import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from catboost import CatBoostRegressor
import optuna
import joblib

# Chemin vers le fichier CSV
file_path = r"C:\Users\AYA\Desktop\tomobiltek\data\avito_after.csv"

# Chargement du dataset
df = pd.read_csv(file_path)

# Séparation des features et de la cible
X = df.drop("price", axis=1)
y = df["price"]

# 🔍 Détection des colonnes catégorielles (si ce sont des objets ou booléens)
cat_features = X.select_dtypes(include=["object", "bool"]).columns.tolist()

# Train/Valid split
X_train, X_valid, y_train, y_valid = train_test_split(X, y, test_size=0.2, random_state=42)

# 🔧 Optimisation Optuna
def objective(trial):
    params = {
        "iterations": trial.suggest_int("iterations", 100, 1000),
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3),
        "depth": trial.suggest_int("depth", 4, 10),
        "l2_leaf_reg": trial.suggest_float("l2_leaf_reg", 1e-3, 10.0, log=True),
        "bootstrap_type": trial.suggest_categorical("bootstrap_type", ["Bayesian", "Bernoulli", "MVS"]),
        "random_strength": trial.suggest_float("random_strength", 1e-3, 10.0, log=True),
        "loss_function": "RMSE",
        "verbose": 0
    }

    if params["bootstrap_type"] == "Bayesian":
        params["bagging_temperature"] = trial.suggest_float("bagging_temperature", 0, 10)
    elif params["bootstrap_type"] == "Bernoulli":
        params["subsample"] = trial.suggest_float("subsample", 0.3, 1.0)

    model = CatBoostRegressor(**params)
    model.fit(X_train, y_train, cat_features=cat_features)

    preds = model.predict(X_valid)
    return np.sqrt(mean_squared_error(y_valid, preds))

# 🔍 Optimisation
study = optuna.create_study(direction="minimize")
study.optimize(objective, n_trials=50)

# ✅ Entraîner le modèle final
print("\nBest parameters found:")
print(study.best_params)

best_model = CatBoostRegressor(**study.best_params, loss_function="RMSE", verbose=0)
best_model.fit(X_train, y_train, cat_features=cat_features)

# 📊 Évaluation
y_pred = best_model.predict(X_valid)
print(f"R² Score: {r2_score(y_valid, y_pred):.4f}")
print(f"RMSE: {mean_squared_error(y_valid, y_pred):.2f}")
print(f"MAE: {mean_absolute_error(y_valid, y_pred):.2f}")

# 💾 Sauvegarde
joblib.dump(best_model, "pipeline_CatBoostRegressor.pkl")
joblib.dump(cat_features, "cat_features.pkl")  # à utiliser aussi dans ton API
