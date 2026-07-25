import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

FEATURE_COLUMNS = [
    'Age', 'Gender', 'Degree', 'Branch', 'CGPA', 'Internships',
    'Projects', 'Coding_Skills', 'Communication_Skills',
    'Aptitude_Test_Score', 'Soft_Skills_Rating', 'Certifications',
    'Backlogs', 'Total_Skills_Index', 'Academic_Score',
    'Practical_Experience', 'Risk_Score'
]

CATEGORICAL_COLS = ['Gender', 'Degree', 'Branch']
NUMERICAL_COLS = [
    'Age', 'CGPA', 'Internships', 'Projects', 'Coding_Skills',
    'Communication_Skills', 'Aptitude_Test_Score', 'Soft_Skills_Rating',
    'Certifications', 'Backlogs'
]

class PlacementDataPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.target_encoder = LabelEncoder()
        self.fitted = False

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create domain-specific engineered features."""
        df = df.copy()
        
        # Skill index combining technical, communication, soft skills and aptitude
        coding = df.get('Coding_Skills', 0)
        comm = df.get('Communication_Skills', 0)
        soft = df.get('Soft_Skills_Rating', 0)
        aptitude = df.get('Aptitude_Test_Score', 0) / 10.0
        
        df['Total_Skills_Index'] = (coding * 0.35 + comm * 0.25 + soft * 0.20 + aptitude * 0.20).round(2)
        df['Academic_Score'] = (df.get('CGPA', 0) * 10.0).round(2)
        df['Practical_Experience'] = (df.get('Internships', 0) * 2 + df.get('Projects', 0))
        df['Risk_Score'] = (df.get('Backlogs', 0) * 2 - (df.get('Internships', 0) + df.get('Certifications', 0)))
        
        return df

    def fit_transform(self, df: pd.DataFrame):
        """Fit preprocessor on train data and transform."""
        logger.info("Starting data preprocessing fit_transform...")
        df = df.copy()
        
        # Handle duplicates & missing values
        df = df.drop_duplicates()
        if 'Student_ID' in df.columns:
            df = df.drop(columns=['Student_ID'])

        # Fill missing values
        for col in NUMERICAL_COLS:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median())
                
        for col in CATEGORICAL_COLS:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].mode()[0])

        # Feature Engineering
        df = self.engineer_features(df)

        # Separate X and y
        y = None
        if 'Placement_Status' in df.columns:
            y = self.target_encoder.fit_transform(df['Placement_Status'])
            df = df.drop(columns=['Placement_Status'])

        # Encode Categorical Features
        for col in CATEGORICAL_COLS:
            if col in df.columns:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le

        # Ensure correct column ordering
        X = df[FEATURE_COLUMNS].copy()

        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        X_scaled_df = pd.DataFrame(X_scaled, columns=FEATURE_COLUMNS)

        self.fitted = True
        logger.info("Data preprocessing completed successfully.")
        return X_scaled_df, y, X

    def transform(self, df: pd.DataFrame):
        """Transform test or single inference data using fitted parameters."""
        if not self.fitted:
            raise ValueError("Preprocessor has not been fitted yet!")

        df = df.copy()
        if 'Student_ID' in df.columns:
            df = df.drop(columns=['Student_ID'])

        # Target encoding if present
        y = None
        if 'Placement_Status' in df.columns:
            # map string values to classes
            y = self.target_encoder.transform(df['Placement_Status'].astype(str))
            df = df.drop(columns=['Placement_Status'])

        # Missing values
        for col in NUMERICAL_COLS:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median() if hasattr(df[col], 'median') else 0)

        # Feature Engineering
        df = self.engineer_features(df)

        # Encode Categoricals
        for col in CATEGORICAL_COLS:
            if col in df.columns and col in self.label_encoders:
                le = self.label_encoders[col]
                # Handle unseen labels by defaulting to 0
                df[col] = df[col].astype(str).map(
                    lambda s: le.transform([s])[0] if s in le.classes_ else 0
                )

        X = df[FEATURE_COLUMNS].copy()
        X_scaled = self.scaler.transform(X)
        X_scaled_df = pd.DataFrame(X_scaled, columns=FEATURE_COLUMNS)

        if y is not None:
            return X_scaled_df, y, X
        return X_scaled_df, X

    def save(self, output_dir: str):
        os.makedirs(output_dir, exist_ok=True)
        joblib.dump(self.scaler, os.path.join(output_dir, "scaler.pkl"))
        joblib.dump(self.label_encoders, os.path.join(output_dir, "label_encoder.pkl"))
        joblib.dump(self.target_encoder, os.path.join(output_dir, "target_encoder.pkl"))
        joblib.dump(FEATURE_COLUMNS, os.path.join(output_dir, "feature_columns.pkl"))
        logger.info(f"Preprocessor artifacts saved to {output_dir}")

    def load(self, model_dir: str):
        self.scaler = joblib.load(os.path.join(model_dir, "scaler.pkl"))
        self.label_encoders = joblib.load(os.path.join(model_dir, "label_encoder.pkl"))
        self.target_encoder = joblib.load(os.path.join(model_dir, "target_encoder.pkl"))
        self.fitted = True
        logger.info(f"Preprocessor artifacts loaded from {model_dir}")
