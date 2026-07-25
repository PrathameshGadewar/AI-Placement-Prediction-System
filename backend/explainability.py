import os
import joblib
import numpy as np
import pandas as pd
import shap
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class ExplainableAI:
    def __init__(self, model_dir: str = "saved_models"):
        self.model_path = os.path.join(model_dir, "best_model.pkl")
        self.feature_cols_path = os.path.join(model_dir, "feature_columns.pkl")
        self.model = None
        self.feature_columns = None
        self.explainer = None
        self.load_resources()

    def load_resources(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            self.feature_columns = joblib.load(self.feature_cols_path)
            try:
                # TreeExplainer works for XGBoost, Random Forest, Decision Tree
                self.explainer = shap.TreeExplainer(self.model)
            except Exception:
                self.explainer = None
                logger.info("Fallback to heuristic feature contribution due to non-tree model.")

    def explain_prediction(self, scaled_df: pd.DataFrame, raw_dict: dict, proba: float):
        """
        Calculates feature contributions and returns positive factors, 
        negative factors, and actionable suggestions.
        """
        pos_factors = []
        neg_factors = []
        suggestions = []

        if self.explainer is not None:
            try:
                shap_vals = self.explainer.shap_values(scaled_df)
                if isinstance(shap_vals, list):
                    vals = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
                else:
                    vals = shap_vals[0]

                feat_contribs = list(zip(self.feature_columns, vals, scaled_df.iloc[0]))
                feat_contribs.sort(key=lambda x: abs(x[1]), reverse=True)

                for feat, contrib, val in feat_contribs:
                    readable_feat = feat.replace('_', ' ')
                    if contrib > 0:
                        pos_factors.append({
                            "feature": readable_feat,
                            "impact": round(float(contrib), 3),
                            "description": f"High positive impact from {readable_feat}"
                        })
                    else:
                        neg_factors.append({
                            "feature": readable_feat,
                            "impact": round(float(contrib), 3),
                            "description": f"Negative impact from {readable_feat}"
                        })
            except Exception as e:
                logger.warning(f"SHAP explanation error: {e}")

        # Rule-based fallback/augmentation for personalized recommendations
        cgpa = raw_dict.get('CGPA', 0)
        coding = raw_dict.get('Coding_Skills', 0)
        comm = raw_dict.get('Communication_Skills', 0)
        internships = raw_dict.get('Internships', 0)
        projects = raw_dict.get('Projects', 0)
        aptitude = raw_dict.get('Aptitude_Test_Score', 0)
        backlogs = raw_dict.get('Backlogs', 0)
        certifications = raw_dict.get('Certifications', 0)
        soft_skills = raw_dict.get('Soft_Skills_Rating', 0)

        # Generating actionable recommendations
        if backlogs > 0:
            suggestions.append(f"Clear your {backlogs} pending backlog(s) immediately; backlogs significantly reduce recruiter callback rates.")
        if coding < 7:
            suggestions.append("Improve Coding Skills by solving LeetCode/HackerRank problems (aim for 7+ rating).")
        if CGPA_needed := (8.0 - cgpa) > 0 and cgpa < 7.5:
            suggestions.append(f"Raise CGPA towards 8.0+ in upcoming semesters to clear initial eligibility filters.")
        if internships < 2:
            suggestions.append("Complete at least 1 additional industrial internship to boost hands-on practical experience.")
        if comm < 7:
            suggestions.append("Enhance Communication & Interview Soft Skills by taking mock technical and HR interviews.")
        if aptitude < 70:
            suggestions.append("Practice quantitative & logical aptitude tests daily to improve your Aptitude Test Score above 75.")
        if projects < 3:
            suggestions.append("Build 1-2 end-to-end full-stack or Machine Learning domain projects on GitHub.")
        if certifications < 2:
            suggestions.append("Earn industry-recognized certifications (e.g. AWS Certified Developer, Azure Data Engineer, or Docker).")

        if not suggestions:
            suggestions.append("Excellent profile! Focus on refining your resume structure and preparing for company-specific interview rounds.")

        return {
            "top_positive_factors": pos_factors[:5],
            "top_negative_factors": neg_factors[:5],
            "suggestions": suggestions
        }
