import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database.connection import engine, Base
from backend.routes import auth, predict, matching, recruiter, admin

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Placement Prediction & Resume Intelligence API",
    description="Production-ready REST API for ML Placement Probability Prediction, SHAP Explainable AI, ATS Job Matching, and Candidate Ranking.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount reports directory for serving generated charts and PDF files
os.makedirs("reports", exist_ok=True)
app.mount("/reports", StaticFiles(directory="reports"), name="reports")

# Include Routers
app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(matching.router)
app.include_router(recruiter.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "AI Placement Prediction & Resume Intelligence API is running.",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
