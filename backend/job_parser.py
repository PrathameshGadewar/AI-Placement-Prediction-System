import re
import fitz  # PyMuPDF
import pdfplumber
import logging
from backend.resume_parser import PROGRAMMING_LANGS, TECH_SKILLS, SOFT_SKILLS

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class JobParser:
    def __init__(self):
        pass

    def extract_text(self, file_content_or_text, is_pdf: bool = False) -> str:
        if not is_pdf:
            return str(file_content_or_text)
        
        text = ""
        try:
            doc = fitz.open(stream=file_content_or_text, filetype="pdf")
            for page in doc:
                text += page.get_text() + "\n"
        except Exception as e:
            logger.warning(f"PyMuPDF failed for JD: {e}")
        return text

    def parse_job_description(self, raw_input, is_pdf: bool = False) -> dict:
        text = self.extract_text(raw_input, is_pdf=is_pdf)
        text_lower = text.lower()

        # 1. Experience extraction
        exp_match = re.search(r'([0-9]+)\+?\s*(years|yr|yrs|year)\s*(of)?\s*experience', text_lower)
        min_experience_years = int(exp_match.group(1)) if exp_match else 0

        # 2. Degree Requirements
        degree_reqs = []
        if any(w in text_lower for w in ["b.tech", "btech", "b.e", "bachelor"]):
            degree_reqs.append("B.Tech / B.E.")
        if any(w in text_lower for w in ["m.tech", "mtech", "master"]):
            degree_reqs.append("M.Tech / M.E.")
        if any(w in text_lower for w in ["bca", "mca"]):
            degree_reqs.append("BCA / MCA")

        if not degree_reqs:
            degree_reqs.append("Bachelor's Degree in CS/IT or related field")

        # 3. Technologies & Skills Extraction
        found_progs = [p for p in PROGRAMMING_LANGS if re.search(r'\b' + re.escape(p) + r'\b', text_lower)]
        found_tech = [t for t in TECH_SKILLS if re.search(r'\b' + re.escape(t) + r'\b', text_lower)]
        found_soft = [s for s in SOFT_SKILLS if re.search(r'\b' + re.escape(s) + r'\b', text_lower)]

        all_req_skills = list(set(found_progs + found_tech))
        
        # Heuristic splitting into required vs preferred
        required_skills = all_req_skills[:max(1, len(all_req_skills) // 2)]
        preferred_skills = all_req_skills[len(all_req_skills) // 2:]

        # Keywords extraction
        keywords = list(set(found_progs + found_tech + found_soft))

        return {
            "title": "Software Development / Engineering Role",
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "minimum_experience_years": min_experience_years,
            "degree_requirements": degree_reqs,
            "technologies": found_tech,
            "keywords": keywords,
            "raw_text": text[:2000]
        }
