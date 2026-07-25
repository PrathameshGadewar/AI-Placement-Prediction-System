import json
import os
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.db_models import User, PredictionHistory
from backend.utils.auth_utils import get_current_user
from backend.predict import PlacementPredictor
from backend.resume_parser import ResumeParser
from backend.report_generator import generate_individual_prediction_pdf

router = APIRouter(prefix="/api/predict", tags=["Placement Prediction"])

# Lazy instantiate predictor
predictor = None

def get_predictor():
    global predictor
    if predictor is None:
        predictor = PlacementPredictor(model_dir="saved_models")
    return predictor

class StudentPredictionSchema(BaseModel):
    Name: Optional[str] = "Student Candidate"
    Age: int = 21
    Gender: str = "Male"
    Degree: str = "B.Tech"
    Branch: str = "CSE"
    CGPA: float = 7.5
    Internships: int = 1
    Projects: int = 3
    Coding_Skills: int = 7
    Communication_Skills: int = 7
    Aptitude_Test_Score: int = 75
    Soft_Skills_Rating: int = 7
    Certifications: int = 1
    Backlogs: int = 0

@router.post("/manual")
def predict_manual(
    student_data: StudentPredictionSchema,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    p = get_predictor()
    input_dict = student_data.dict()
    result = p.predict_single(input_dict)

    # Save to history
    history_entry = PredictionHistory(
        user_id=current_user.id if current_user else None,
        student_name=input_dict.get("Name", "Student Candidate"),
        degree=input_dict.get("Degree"),
        branch=input_dict.get("Branch"),
        cgpa=input_dict.get("CGPA"),
        placement_status=result["placement_status"],
        placement_probability=result["placement_probability"],
        risk_level=result["risk_level"],
        input_data_json=json.dumps(input_dict),
        result_data_json=json.dumps(result)
    )
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)

    result["history_id"] = history_entry.id
    return result

@router.post("/resume")
async def predict_from_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    content = await file.read()
    parser = ResumeParser()
    extracted_info = parser.parse_resume(content, file.filename)
    
    # Run prediction on extracted form fields
    p = get_predictor()
    form_data = extracted_info["form_fields"]
    form_data["Name"] = extracted_info.get("name", "Candidate")
    
    result = p.predict_single(form_data)

    history_entry = PredictionHistory(
        user_id=current_user.id if current_user else None,
        student_name=form_data["Name"],
        degree=form_data.get("Degree"),
        branch=form_data.get("Branch"),
        cgpa=form_data.get("CGPA"),
        placement_status=result["placement_status"],
        placement_probability=result["placement_probability"],
        risk_level=result["risk_level"],
        input_data_json=json.dumps(form_data),
        result_data_json=json.dumps(result)
    )
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)

    return {
        "extracted_info": extracted_info,
        "prediction": result,
        "history_id": history_entry.id
    }

@router.get("/history")
def get_prediction_history(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    query = db.query(PredictionHistory)
    if current_user and current_user.role != "admin":
        query = query.filter(PredictionHistory.user_id == current_user.id)
        
    records = query.order_by(PredictionHistory.created_at.desc()).limit(50).all()
    
    history_list = []
    for r in records:
        history_list.append({
            "id": r.id,
            "student_name": r.student_name,
            "degree": r.degree,
            "branch": r.branch,
            "cgpa": r.cgpa,
            "placement_status": r.placement_status,
            "placement_probability": r.placement_probability,
            "risk_level": r.risk_level,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M"),
            "input_data": json.loads(r.input_data_json) if r.input_data_json else {},
            "result_data": json.loads(r.result_data_json) if r.result_data_json else {}
        })
    return history_list

@router.get("/download-pdf/{history_id}")
def download_prediction_pdf(history_id: int, db: Session = Depends(get_db)):
    record = db.query(PredictionHistory).filter(PredictionHistory.id == history_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found.")

    input_data = json.loads(record.input_data_json) if record.input_data_json else {}
    result_data = json.loads(record.result_data_json) if record.result_data_json else {}

    output_path = os.path.join("reports", f"student_report_{history_id}.pdf")
    generate_individual_prediction_pdf(input_data, result_data, output_path)

    return FileResponse(output_path, filename=f"Placement_Report_{history_id}.pdf", media_type="application/pdf")
