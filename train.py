import os
import time
import json
import logging
import pandas as pd
import numpy as np
import joblib

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from xgboost import XGBClassifier

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    roc_curve, precision_recall_curve, auc
)
from sklearn.model_selection import cross_val_score
import shap

from backend.preprocessing import PlacementDataPreprocessor, FEATURE_COLUMNS
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Base paths
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(PROJECT_ROOT, "dataset")
SAVED_MODELS_DIR = os.path.join(PROJECT_ROOT, "saved_models")
REPORTS_DIR = os.path.join(PROJECT_ROOT, "reports")

os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

from sklearn.linear_model import SGDClassifier

class ModelTrainer:
    def __init__(self):
        self.preprocessor = PlacementDataPreprocessor()
        self.models = {
            "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
            "Decision Tree": DecisionTreeClassifier(random_state=42, max_depth=8),
            "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
            "Support Vector Machine": SGDClassifier(loss='log_loss', max_iter=1000, random_state=42),
            "KNN": KNeighborsClassifier(n_neighbors=5, n_jobs=-1),
            "XGBoost": XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=6, random_state=42, eval_metric='logloss')
        }
        self.results = {}
        self.trained_models = {}

    def load_data(self):
        train_path = os.path.join(DATASET_DIR, "train.csv")
        test_path = os.path.join(DATASET_DIR, "test.csv")

        if not os.path.exists(train_path) or not os.path.exists(test_path):
            raise FileNotFoundError(f"Dataset files missing in {DATASET_DIR}. Expected train.csv & test.csv")

        logger.info(f"Loading datasets from {DATASET_DIR}...")
        train_df = pd.read_csv(train_path)
        test_df = pd.read_csv(test_path)

        X_train, y_train, _ = self.preprocessor.fit_transform(train_df)
        X_test, y_test, _ = self.preprocessor.transform(test_df)

        return X_train, y_train, X_test, y_test

    def train_and_evaluate(self):
        X_train, y_train, X_test, y_test = self.load_data()
        
        logger.info("Beginning model training and cross-validation...")

        comparison_list = []

        for name, model in self.models.items():
            logger.info(f"Training model: {name}...")

            # Measure training time
            t0 = time.time()
            model.fit(X_train, y_train)
            train_time = time.time() - t0

            # Measure prediction time
            t1 = time.time()
            y_pred = model.predict(X_test)
            pred_time = time.time() - t1

            if hasattr(model, "predict_proba"):
                y_proba = model.predict_proba(X_test)[:, 1]
            else:
                y_proba = model.decision_function(X_test)

            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, zero_division=0)
            rec = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            roc_auc = roc_auc_score(y_test, y_proba)

            # 5-Fold Cross Validation
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='f1', n_jobs=-1)
            cv_mean = cv_scores.mean()

            cm = confusion_matrix(y_test, y_pred)
            clf_rep = classification_report(y_test, y_pred, target_names=["Not Placed", "Placed"])

            self.trained_models[name] = model
            self.results[name] = {
                "accuracy": round(float(acc), 4),
                "precision": round(float(prec), 4),
                "recall": round(float(rec), 4),
                "f1_score": round(float(f1), 4),
                "roc_auc": round(float(roc_auc), 4),
                "cv_score": round(float(cv_mean), 4),
                "train_time_sec": round(float(train_time), 4),
                "pred_time_sec": round(float(pred_time), 4),
                "confusion_matrix": cm.tolist(),
                "classification_report": clf_rep,
                "y_proba": y_proba,
                "y_pred": y_pred
            }

            comparison_list.append({
                "Model": name,
                "Accuracy": acc,
                "Precision": prec,
                "Recall": rec,
                "F1 Score": f1,
                "ROC AUC": roc_auc,
                "CV Score": cv_mean,
                "Train Time (s)": train_time,
                "Pred Time (s)": pred_time
            })

            print(f"\n--- {name} Results ---")
            print(f"Accuracy: {acc:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | F1: {f1:.4f} | ROC AUC: {roc_auc:.4f} | CV: {cv_mean:.4f}")

        # Select Best Model based on F1 Score
        best_model_name = max(self.results, key=lambda k: self.results[k]["f1_score"])
        best_model = self.trained_models[best_model_name]
        logger.info(f"--> BEST MODEL SELECTED: {best_model_name} with F1 Score: {self.results[best_model_name]['f1_score']}")

        # Save Best Model & Preprocessor
        joblib.dump(best_model, os.path.join(SAVED_MODELS_DIR, "best_model.pkl"))
        joblib.dump(best_model_name, os.path.join(SAVED_MODELS_DIR, "best_model_name.pkl"))
        self.preprocessor.save(SAVED_MODELS_DIR)

        # Generate Visualizations & Reports
        self.generate_plots(X_train, X_test, y_test, best_model_name)
        self.save_reports(comparison_list, best_model_name, y_test)

        return best_model_name, self.results[best_model_name]

    def generate_plots(self, X_train, X_test, y_test, best_model_name):
        sns.set_theme(style="whitegrid")

        # 1. Confusion Matrix Plot
        plt.figure(figsize=(6, 5))
        cm = np.array(self.results[best_model_name]["confusion_matrix"])
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=["Not Placed", "Placed"], yticklabels=["Not Placed", "Placed"])
        plt.title(f"Confusion Matrix - {best_model_name}")
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
        plt.tight_layout()
        plt.savefig(os.path.join(REPORTS_DIR, "confusion_matrix.png"), dpi=300)
        plt.close()

        # 2. ROC Curve Plot
        plt.figure(figsize=(8, 6))
        for name, res in self.results.items():
            fpr, tpr, _ = roc_curve(y_test, res["y_proba"])
            plt.plot(fpr, tpr, label=f"{name} (AUC = {res['roc_auc']:.2f})")
        plt.plot([0, 1], [0, 1], 'k--', label="Random Baseline")
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate")
        plt.title("ROC Curve Comparison")
        plt.legend(loc="lower right")
        plt.tight_layout()
        plt.savefig(os.path.join(REPORTS_DIR, "roc_curve.png"), dpi=300)
        plt.close()

        # 3. Precision-Recall Curve
        plt.figure(figsize=(8, 6))
        for name, res in self.results.items():
            precision, recall, _ = precision_recall_curve(y_test, res["y_proba"])
            pr_auc = auc(recall, precision)
            plt.plot(recall, precision, label=f"{name} (PR AUC = {pr_auc:.2f})")
        plt.xlabel("Recall")
        plt.ylabel("Precision")
        plt.title("Precision-Recall Curve Comparison")
        plt.legend(loc="lower left")
        plt.tight_layout()
        plt.savefig(os.path.join(REPORTS_DIR, "precision_recall_curve.png"), dpi=300)
        plt.close()

        # 4. Feature Importance (XGBoost / Random Forest)
        best_model = self.trained_models[best_model_name]
        plt.figure(figsize=(10, 6))
        if hasattr(best_model, "feature_importances_"):
            importances = best_model.feature_importances_
            indices = np.argsort(importances)[::-1]
            sorted_features = [FEATURE_COLUMNS[i] for i in indices]
            sns.barplot(x=importances[indices], y=sorted_features, palette="crest")
            plt.title(f"Feature Importances - {best_model_name}")
            plt.xlabel("Relative Importance")
            plt.tight_layout()
            plt.savefig(os.path.join(REPORTS_DIR, "feature_importance.png"), dpi=300)
            plt.close()

        # 5. SHAP Summary Plot
        plt.figure(figsize=(10, 6))
        try:
            if best_model_name in ["XGBoost", "Random Forest", "Decision Tree"]:
                explainer = shap.TreeExplainer(best_model)
                shap_values = explainer.shap_values(X_test.iloc[:500])
                shap.summary_plot(shap_values, X_test.iloc[:500], feature_names=FEATURE_COLUMNS, show=False)
            else:
                explainer = shap.KernelExplainer(best_model.predict_proba, shap.sample(X_train, 50))
                shap_values = explainer.shap_values(X_test.iloc[:100])
                shap.summary_plot(shap_values[1], X_test.iloc[:100], feature_names=FEATURE_COLUMNS, show=False)
            
            plt.tight_layout()
            plt.savefig(os.path.join(REPORTS_DIR, "shap_summary.png"), dpi=300)
            plt.close()
        except Exception as e:
            logger.warning(f"SHAP summary plot generation skipped: {e}")
            plt.close()

    def save_reports(self, comparison_list, best_model_name, y_test):
        # 1. Model Comparison CSV
        df_comp = pd.DataFrame(comparison_list)
        df_comp.to_csv(os.path.join(REPORTS_DIR, "model_comparison.csv"), index=False)

        # 2. Metrics JSON
        metrics_export = {
            "best_model": best_model_name,
            "metrics": {
                name: {
                    k: v for k, v in res.items() if k not in ["y_proba", "y_pred"]
                }
                for name, res in self.results.items()
            }
        }
        with open(os.path.join(REPORTS_DIR, "metrics.json"), "w") as f:
            json.dump(metrics_export, f, indent=4)

        # 3. Classification Report TXT
        with open(os.path.join(REPORTS_DIR, "classification_report.txt"), "w") as f:
            f.write(f"=== MODEL PERFORMANCE & BENCHMARK SUMMARY ===\n")
            f.write(f"Selected Best Model: {best_model_name}\n\n")
            for name, res in self.results.items():
                f.write(f"-----------------------------------------\n")
                f.write(f"MODEL: {name}\n")
                f.write(f"Accuracy: {res['accuracy']} | F1 Score: {res['f1_score']} | ROC AUC: {res['roc_auc']}\n")
                f.write(res["classification_report"])
                f.write("\n")

        # 4. Generate PDF Report
        self.generate_pdf_report(best_model_name)

    def generate_pdf_report(self, best_model_name):
        pdf_path = os.path.join(REPORTS_DIR, "prediction_report.pdf")
        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#1e293b'),
            alignment=1,
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            'SubTitle',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#475569'),
            alignment=1,
            spaceAfter=20
        )
        
        story = []
        story.append(Paragraph("AI-Powered Placement Prediction & Intelligence Report", title_style))
        story.append(Paragraph(f"Model Training Benchmark & Evaluation Summary | Best Model: <b>{best_model_name}</b>", subtitle_style))
        story.append(Spacer(1, 10))

        # Metrics Table
        table_data = [["Model", "Accuracy", "Precision", "Recall", "F1 Score", "ROC AUC", "CV Score"]]
        for name, res in self.results.items():
            table_data.append([
                name,
                f"{res['accuracy']:.4f}",
                f"{res['precision']:.4f}",
                f"{res['recall']:.4f}",
                f"{res['f1_score']:.4f}",
                f"{res['roc_auc']:.4f}",
                f"{res['cv_score']:.4f}"
            ])

        t = Table(table_data, colWidths=[120, 60, 60, 60, 60, 60, 60])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        story.append(t)
        story.append(Spacer(1, 20))

        # Embed Images
        cm_path = os.path.join(REPORTS_DIR, "confusion_matrix.png")
        fi_path = os.path.join(REPORTS_DIR, "feature_importance.png")
        
        if os.path.exists(cm_path):
            story.append(Paragraph("<b>Confusion Matrix (Best Model)</b>", styles['Heading2']))
            story.append(Spacer(1, 5))
            story.append(Image(cm_path, width=300, height=240))
            story.append(Spacer(1, 15))

        if os.path.exists(fi_path):
            story.append(Paragraph("<b>Feature Importance Analysis</b>", styles['Heading2']))
            story.append(Spacer(1, 5))
            story.append(Image(fi_path, width=450, height=270))

        doc.build(story)
        logger.info(f"PDF report successfully saved to {pdf_path}")

if __name__ == "__main__":
    trainer = ModelTrainer()
    trainer.train_and_evaluate()
