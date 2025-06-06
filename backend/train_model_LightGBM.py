import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import lightgbm as lgb

file_path = r"C:\Users\AYA\Desktop\tomobiltek\data\avito_after.csv"

# Chargement du dataset
df = pd.read_csv(file_path)

# --- 1 bis. Ajout de variables supplémentaires ---
df["âge_voiture"] = 2025 - df["Année-Modèle"]
df["kilometrage_par_an"] = df["kilometrage"] / df["âge_voiture"].replace(0, 1)

# --- 2. Colonnes ---
num_cols = ['kilometrage', 'Année-Modèle', 'Nombre-de-portes', 'Puissance-fiscale', 'âge_voiture', 'kilometrage_par_an']
cat_cols = ['Première-main', 'type_boit', 'type_carburant', 'marke', 'model', 'État', 'Origine']  # Origine ajoutée

# --- 3. Préparation des données ---
df['price_log'] = np.log1p(df['price'])
X = df[num_cols + cat_cols]
y = df['price_log']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- 4. Pipeline de prétraitement ---
preprocessor = ColumnTransformer(transformers=[
    ('num', StandardScaler(), num_cols),
    ('cat', OneHotEncoder(handle_unknown='ignore'), cat_cols)
])

# --- 5. Modèle LightGBM avec hyperparamètres optimaux ---
model = lgb.LGBMRegressor(
    learning_rate=0.27051311428368224,
    n_estimators=1500,
    max_depth=12,
    min_child_samples=8,
    reg_alpha=0.5742359946065061,
    reg_lambda=0.10266566769442868,
    random_state=42,
    n_jobs=-1
)

pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('model', model)
])

# --- 6. Entraînement ---
pipeline.fit(X_train, y_train)

# --- 7. Évaluation ---
y_pred_log = pipeline.predict(X_test)
y_pred = np.expm1(y_pred_log)
y_test_orig = np.expm1(y_test)

mae = mean_absolute_error(y_test_orig, y_pred)
r2 = r2_score(y_test_orig, y_pred)

print(f"✅ MAE : {mae:.2f} MAD")
print(f"✅ R² : {r2:.4f}")

# --- 8. Sauvegarde du pipeline ---
joblib.dump(pipeline, "pipeline_lightgbm.pkl")
