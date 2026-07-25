import os
import joblib
import pandas as pd
import numpy as np
import logging
from backend.preprocessing import PlacementDataPreprocessor
from backend.explainability import ExplainableAI

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class PlacementPredictor:
    def __init__(self, model_dir: str = "saved_models"):
        self.model_dir = model_dir
        self.model_path = os.path.join(model_dir, "best_model.pkl")
        self.best_model_name_path = os.path.join(model_dir, "best_model_name.pkl")
        
        self.preprocessor = PlacementDataPreprocessor()
        self.preprocessor.load(model_dir)
        
        self.model = joblib.load(self.model_path)
        if os.path.exists(self.best_model_name_path):
            self.model_name = joblib.load(self.best_model_name_path)
        else:
            self.model_name = self.model.__class__.__name__

        self.explainer = ExplainableAI(model_dir)

    def predict_single(self, student_data: dict) -> dict:
        """
        Takes raw student details dict and outputs placement prediction, 
        probability, risk level, confidence score, and SHAP explanations.
        """
        df_raw = pd.DataFrame([student_data])
        scaled_df, unscaled_engineered_df = self.preprocessor.transform(df_raw)

        # Model Prediction
        y_pred = self.model.predict(scaled_df)[0]
        
        if hasattr(self.model, "predict_proba"):
            proba = float(self.model.predict_proba(scaled_df)[0][1])
        else:
            proba = float(1.0 / (1.0 + np.exp(-self.model.decision_function(scaled_df)[0])))

        status = "Placed" if y_pred == 1 else "Not Placed"
        placement_probability = round(proba * 100.0, 2)
        confidence_score = round(abs(proba - 0.5) * 200.0, 2)

        # Risk Level Calculation
        if placement_probability >= 75.0:
            risk_level = "Low"
        elif placement_probability >= 45.0:
            risk_level = "Medium"
        else:
            risk_level = "High"

        # SHAP & Personalized Suggestions
        explanations = self.explainer.explain_prediction(scaled_df, student_data, proba)

        return {
            "model_used": self.model_name,
            "placement_status": status,
            "placement_probability": placement_probability,
            "confidence_score": confidence_score,
            "risk_level": risk_level,
            "top_positive_factors": explanations["top_positive_factors"],
            "top_negative_factors": explanations["top_negative_factors"],
            "suggestions": explanations["suggestions"],
            "engineered_metrics": {
                "skills_index": float(unscaled_engineered_df['Total_Skills_Index'].iloc[0]),
                "academic_score": float(unscaled_engineered_df['Academic_Score'].iloc[0]),
                "practical_exp": int(unscaled_engineered_df['Practical_Experience'].iloc[0]),
                "risk_score": int(unscaled_engineered_df['Risk_Score'].iloc[0])
            }
        }
