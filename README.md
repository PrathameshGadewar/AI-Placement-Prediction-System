# 🎓 AI-Powered Placement Prediction & Resume Intelligence System

An end-to-end production-ready Machine Learning and NLP web platform for student placement probability prediction, SHAP explainability analysis, and Job Description / ATS resume matching.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![XGBoost](https://img.shields.io/badge/XGBoost-Primary%20Model-orange)
![SentenceTransformers](https://img.shields.io/badge/SentenceTransformers-all--MiniLM--L6--v2-purple)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Key Features

1. **Student Placement Predictor (`Placement Predictor`)**:
   - **Option 1 (Manual Input)**: Interactive sliders for CGPA, Aptitude, Coding Skills, and Communication Skills, alongside Internship, Project, Certification, and Backlog counters.
   - **Option 2 (Resume Upload)**: Auto-extracts profile signals from PDF/DOCX resumes using PyMuPDF and python-docx.
   - **Real-Time Model Readout**: Dynamic SVG Radial Gauge ($P(\text{placed})$), Risk Badge (`On Track` / `Moderate Risk` / `High Risk`), and top SHAP feature contribution bar charts.
   - **5-Second Scanning Animation**: Animated laser beam line, spinning radar ring, and dynamic step-by-step progress status.

2. **Job Description & ATS Matching Engine (`ATS & JD Match`)**:
   - **Sentence Transformers & NLP Engine**: Computes semantic similarity between job requirements and candidate resumes using `all-MiniLM-L6-v2`.
   - **ATS Compatibility Score**: Progress meter showing exact match percentage, matched skills (green chips), and missing skill gaps (red chips).

3. **Multi-Model Machine Learning Pipeline**:
   - Trains & benchmarks 6 algorithms: Logistic Regression, Decision Tree, Random Forest, SVM (`log_loss`), KNN, and XGBoost.
   - Evaluates performance via F1-Score, ROC-AUC, Confusion Matrix, Precision-Recall curves, and SHAP explainability.

---

## 🏗️ Architecture Stack

- **Frontend**: React.js, Tailwind CSS, Custom Glassmorphic Design Tokens, SVG Radial Gauge, Font Awesome / SVG icons.
- **Backend**: FastAPI, Python 3.10+, SQLAlchemy ORM, SQLite DB (`placement.db`), JWT Authentication, PyPDF2/PyMuPDF/python-docx.
- **Machine Learning**: XGBoost, Scikit-learn, SHAP, Joblib, SentenceTransformers.

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10 or higher
- Node.js v18 or higher & npm

### 2. Clone the Repository
```bash
git clone https://github.com/PrathameshGadewar/AI-Placement-Prediction-System.git
cd AI-Placement-Prediction-System
```

### 3. Backend Setup & Machine Learning Training
```bash
# Create Python Virtual Environment
python -m venv venv

# Activate Virtual Environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Train Machine Learning Models
python train.py

# Launch FastAPI Backend Server
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```
The FastAPI backend REST API & Swagger documentation will be live at:
👉 **`http://localhost:8000/docs`**

---

### 4. Frontend Setup
Open a new terminal window:
```bash
cd frontend

# Install Node Dependencies
npm install

# Start Vite Development Server
npm run dev
```
The React frontend application will be live at:
👉 **`http://localhost:3000`**

---

## 📊 ML Model Evaluation Reports

All model metrics, confusion matrices, and SHAP summary charts are automatically generated during training in `reports/`:
- `reports/metrics.json`
- `reports/model_comparison.csv`
- `reports/confusion_matrix.png`
- `reports/feature_importance.png`
- `reports/shap_summary.png`

---

## 📜 License

This project is licensed under the MIT License.
