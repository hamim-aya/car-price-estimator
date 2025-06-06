from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict

app = FastAPI()
# Allow requests from any frontend (change origins in production!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <-- or use ["http://localhost:3000"] for React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("pipeline_lightgbm.pkl")
df = pd.read_csv(r'C:\Users\AYA\Desktop\tomobiltek\data\avito_after.csv')
class CarInput(BaseModel):
    kilometrage: float
    Année_Modèle: int
    Nombre_de_portes: int
    Puissance_fiscale: float
    Première_main: str
    type_boit: str
    type_carburant: str
    marke: str
    model: str
    État: str
    Origine: str
@app.get("/brands")
def get_brands():
    brands = df['marke'].unique().tolist()  # 'marke' est la colonne dans votre dataset
    return {"brands": brands}

# Endpoint pour récupérer les modèles d'une marque spécifique
@app.get("/models/{brand}")
def get_models(brand: str):
    models = df[df['marke'] == brand]['model'].unique().tolist()
    return {"models": models}
@app.post("/predict")
def predict_price(car: CarInput):
    input_dict = car.dict()
    input_dict["âge_voiture"] = 2025 - input_dict["Année_Modèle"]
    input_dict["kilometrage_par_an"] = input_dict["kilometrage"] / (input_dict["âge_voiture"] or 1)

    # ✅ Rename keys to match training pipeline column names
    input_dict["Année-Modèle"] = input_dict.pop("Année_Modèle")
    input_dict["Nombre-de-portes"] = input_dict.pop("Nombre_de_portes")
    input_dict["Puissance-fiscale"] = input_dict.pop("Puissance_fiscale")
    input_dict["Première-main"] = input_dict.pop("Première_main")

    # ✅ All required columns
    all_features = [
        'kilometrage', 'Année-Modèle', 'Nombre-de-portes', 'Puissance-fiscale',
        'âge_voiture', 'kilometrage_par_an',
        'Première-main', 'type_boit', 'type_carburant', 'marke', 'model', 'État', 'Origine'
    ]

    input_df = pd.DataFrame([input_dict], columns=all_features)

    numeric_cols = ['kilometrage', 'Année-Modèle', 'Nombre-de-portes', 'Puissance-fiscale', 'âge_voiture', 'kilometrage_par_an']
    input_df[numeric_cols] = input_df[numeric_cols].apply(pd.to_numeric, errors='coerce')

    if input_df[numeric_cols].isnull().any().any():
        return {"error": "Invalid numeric input in one or more fields."}

    prediction_log = model.predict(input_df)[0]
    prediction = round(np.expm1(prediction_log), 2)

    return {"predicted_price": prediction}
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
