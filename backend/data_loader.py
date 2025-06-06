import pandas as pd
import os
from typing import Dict, List


class DataLoader:
    def __init__(self, data_path: str = None):
        if data_path is None:
            data_path = os.path.join(os.path.dirname(__file__), '../data/avito_after.csv')
        self.data = pd.read_csv(data_path)
        self._prepare_data()
        self.categorical_options = self._extract_categories()

    def _prepare_data(self):
        """Prepare data with derived features"""
        self.data["âge_voiture"] = 2025 - self.data["Année-Modèle"]
        self.data["kilometrage_par_an"] = (
                self.data["kilometrage"] / self.data["âge_voiture"].replace(0, 1)
        )

    def _extract_categories(self) -> Dict[str, List[str]]:
        """Extract possible options for categorical features"""
        return {
            "premiere_main_options": sorted(self.data["Première-main"].unique().tolist()),
            "type_boit_options": sorted(self.data["type_boit"].unique().tolist()),
            "type_carburant_options": sorted(self.data["type_carburant"].unique().tolist()),
            "marke_options": sorted(self.data["marke"].unique().tolist()),
            "model_options": sorted(self.data["model"].unique().tolist()),
            "etat_options": sorted(self.data["État"].unique().tolist()),
            "origine_options": sorted(self.data["Origine"].unique().tolist())
        }

    def get_makes(self) -> List[str]:
        return self.categorical_options["marke_options"]

    def get_models(self, make: str) -> List[str]:
        return sorted(
            self.data[self.data["marke"] == make]["model"].unique().tolist()
        )


# Initialize data loader
data_loader = DataLoader()