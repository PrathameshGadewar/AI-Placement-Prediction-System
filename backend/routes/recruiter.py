import io
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import pandas as pd
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.db_models import User, JobMatchHistory
from backend.utils.auth_utils import require_role
from backend.resume_parser import ResumeParser
from backend.job_parser import JobParser
from backend.matching_engine import AIMatchingEngine
from backend.predict import PlacementPredictor

router = APIRouter(prefix="/api/recruiter", tags=["Recruiter Dashboard"])

resume_parser = ResumeParser()
job_parser = JobParser()
matching_engine = AIMatchingEngine()
predictor = None

def get_predictor():
    global predictor
    if predictor is None:
        predictor = PlacementPredictor(model_dir="saved_models")
    return predictor

@router.post("/batch-rank")
async def batch_rank_candidates(
    job_description: str = Form(...),
    resumes: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    if not resumes:
        raise HTTPException(status_code=400, detail="No resume files uploaded.")

    parsed_jd = job_parser.parse_job_description(job_description, is_pdf=False)
    p = get_predictor()

    ranked_candidates = []

    for idx, res_file in enumerate(resumes):
        content = await res_file.read()
        parsed_resume = resume_parser.parse_resume(content, res_file.filename)

        # Calculate Job Match & ATS scores
        match_analytics = matching_engine.calculate_match(parsed_resume, parsed_jd)

        # Calculate Placement Probability using ML model
        form_fields = parsed_resume["form_fields"]
        form_fields["Name"] = parsed_resume.get("name", f"Candidate {idx+1}")
        prediction = p.predict_single(form_fields)

        candidate_entry = {
            "id": idx + 1,
            "filename": res_file.filename,
            "candidate_name": form_fields["Name"],
            "email": parsed_resume.get("email", ""),
            "phone": parsed_resume.get("phone", ""),
            "degree": parsed_resume.get("degree", "B.Tech"),
            "branch": parsed_resume.get("branch", "CSE"),
            "cgpa": parsed_resume.get("cgpa", 7.5),
            "placement_status": prediction["placement_status"],
            "placement_probability": prediction["placement_probability"],
            "risk_level": prediction["risk_level"],
            "ats_score": match_analytics["ats_compatibility_score"],
            "job_match_score": match_analytics["job_match_score"],
            "skill_match_score": match_analytics["skill_match_score"],
            "missing_skills": match_analytics["missing_skills"],
            "recommended_skills": match_analytics["recommended_skills"],
            "skills": parsed_resume.get("skills", [])
        }
        ranked_candidates.append(candidate_entry)

    # Sort candidates by combined score (0.6 * Job Match + 0.4 * Placement Prob)
    ranked_candidates.sort(key=lambda c: (0.6 * c["job_match_score"] + 0.4 * c["placement_probability"]), reverse=True)

    for rank, cand in enumerate(ranked_candidates, 1):
        cand["overall_rank"] = rank

    # Save to JobMatchHistory
    history = JobMatchHistory(
        job_title=parsed_jd.get("title", "Software Engineering"),
        job_description_snippet=job_description[:300],
        candidate_count=len(ranked_candidates),
        results_json=json.dumps(ranked_candidates)
    )
    db.add(history)
    db.commit()

    return {
        "job_summary": parsed_jd,
        "total_candidates": len(ranked_candidates),
        "candidates": ranked_candidates
    }

@router.post("/export-excel")
async def export_candidates_excel(candidates_json: str = Form(...)):
    try:
        candidates = json.loads(candidates_json)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON data.")

    df_data = []
    for c in candidates:
        df_data.append({
            "Rank": c.get("overall_rank"),
            "Candidate Name": c.get("candidate_name"),
            "Email": c.get("email"),
            "Phone": c.get("phone"),
            "Degree": c.get("degree"),
            "Branch": c.get("branch"),
            "CGPA": c.get("cgpa"),
            "Placement Prob (%)": c.get("placement_probability"),
            "Placement Status": c.get("placement_status"),
            "Job Match Score (%)": c.get("job_match_score"),
            "ATS Score (%)": c.get("ats_score"),
            "Missing Skills": ", ".join(c.get("missing_skills", []))
        })

    df = pd.DataFrame(df_data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Candidate Rankings")
    output.seek(0)

    headers = {
        "Content-Disposition": "attachment; filename=Candidate_Rankings.xlsx"
    }
    return StreamingResponse(
        output,
        headers=headers,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
