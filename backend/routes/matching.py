from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.resume_parser import ResumeParser
from backend.job_parser import JobParser
from backend.matching_engine import AIMatchingEngine

router = APIRouter(prefix="/api/matching", tags=["Job Description & ATS Matching"])

job_parser = JobParser()
resume_parser = ResumeParser()
matching_engine = AIMatchingEngine()

class TextMatchRequest(BaseModel):
    job_description: str
    resume_text: str

@router.post("/parse-jd")
async def parse_job_description(
    job_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    if file:
        content = await file.read()
        parsed_jd = job_parser.parse_job_description(content, is_pdf=file.filename.endswith(".pdf"))
    elif job_text:
        parsed_jd = job_parser.parse_job_description(job_text, is_pdf=False)
    else:
        raise HTTPException(status_code=400, detail="Provide job_text or upload a JD PDF file.")
    return parsed_jd

@router.post("/match")
async def match_resume_and_jd(
    job_description: str = Form(...),
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None)
):
    if resume_file:
        content = await resume_file.read()
        parsed_resume = resume_parser.parse_resume(content, resume_file.filename)
    elif resume_text:
        parsed_resume = resume_parser.parse_resume(resume_text, "txt")
    else:
        raise HTTPException(status_code=400, detail="Provide resume_file or resume_text.")

    parsed_jd = job_parser.parse_job_description(job_description, is_pdf=False)
    match_results = matching_engine.calculate_match(parsed_resume, parsed_jd)

    return {
        "job_description_summary": parsed_jd,
        "resume_summary": {
            "name": parsed_resume.get("name"),
            "degree": parsed_resume.get("degree"),
            "branch": parsed_resume.get("branch"),
            "skills": parsed_resume.get("skills")
        },
        "match_analytics": match_results
    }
