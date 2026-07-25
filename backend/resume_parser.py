import re
import os
import fitz  # PyMuPDF
import pdfplumber
import docx
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Known skill dictionaries for classification
PROGRAMMING_LANGS = [
    "python", "java", "c++", "c#", "c", "javascript", "typescript", "html", "css",
    "sql", "r", "go", "rust", "php", "ruby", "kotlin", "swift"
]

TECH_SKILLS = [
    "react", "node", "fastapi", "express", "django", "flask", "docker", "kubernetes",
    "aws", "azure", "gcp", "git", "linux", "mongodb", "postgresql", "mysql",
    "machine learning", "deep learning", "nlp", "pandas", "numpy", "scikit-learn",
    "tensorflow", "pytorch", "xgboost", "rest api", "graphql", "data structures",
    "algorithms", "devops", "ci/cd"
]

SOFT_SKILLS = [
    "communication", "leadership", "teamwork", "problem solving", "critical thinking",
    "time management", "adaptability", "creativity", "work ethic", "collaboration"
]

BRANCH_KEYWORDS = {
    "CSE": ["computer science", "cse", "computer engineering", "cs"],
    "IT": ["information technology", "it"],
    "ECE": ["electronics", "ece", "telecommunication"],
    "EE": ["electrical", "ee"],
    "ME": ["mechanical", "me", "automobile"],
    "Civil": ["civil", "construction"]
}

DEGREE_KEYWORDS = {
    "B.Tech": ["b.tech", "btech", "b.e", "be", "bachelor of technology", "bachelor of engineering"],
    "M.Tech": ["m.tech", "mtech", "m.e", "master of technology"],
    "BCA": ["bca", "bachelor of computer applications"],
    "MCA": ["mca", "master of computer applications"],
    "B.Sc": ["b.sc", "bsc", "bachelor of science"],
    "M.Sc": ["m.sc", "msc", "master of science"]
}

class ResumeParser:
    def __init__(self):
        pass

    def extract_text_from_pdf(self, file_path_or_bytes) -> str:
        text = ""
        try:
            if isinstance(file_path_or_bytes, str):
                doc = fitz.open(file_path_or_bytes)
            else:
                doc = fitz.open(stream=file_path_or_bytes, filetype="pdf")
            for page in doc:
                text += page.get_text() + "\n"
        except Exception as e:
            logger.warning(f"PyMuPDF failed, trying pdfplumber: {e}")
            try:
                if isinstance(file_path_or_bytes, str):
                    with pdfplumber.open(file_path_or_bytes) as pdf:
                        for page in pdf.pages:
                            text += (page.extract_text() or "") + "\n"
            except Exception as ex:
                logger.error(f"Failed pdfplumber extraction: {ex}")
        return text

    def extract_text_from_docx(self, file_path_or_bytes) -> str:
        try:
            doc = docx.Document(file_path_or_bytes)
            return "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            logger.error(f"Failed docx extraction: {e}")
            return ""

    def parse_resume(self, file_content_or_path, file_extension: str) -> dict:
        ext = file_extension.lower()
        if ext.endswith("pdf"):
            text = self.extract_text_from_pdf(file_content_or_path)
        elif ext.endswith("docx") or ext.endswith("doc"):
            text = self.extract_text_from_docx(file_content_or_path)
        else:
            text = str(file_content_or_path)

        text_lower = text.lower()

        # 1. Contact Information
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
        email = email_match.group(0) if email_match else ""

        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        phone = phone_match.group(0) if phone_match else ""

        lines = [line.strip() for line in text.split('\n') if line.strip()]
        name = lines[0] if lines and len(lines[0]) < 40 and not "@" in lines[0] else "Student Candidate"

        # 2. Degree & Branch Extraction
        extracted_degree = "B.Tech"
        for deg, keywords in DEGREE_KEYWORDS.items():
            if any(kw in text_lower for kw in keywords):
                extracted_degree = deg
                break

        extracted_branch = "CSE"
        for br, keywords in BRANCH_KEYWORDS.items():
            if any(kw in text_lower for kw in keywords):
                extracted_branch = br
                break

        # 3. CGPA Extraction
        cgpa_match = re.search(r'(cgpa|gpa|marks|pointer)[:\s]*([0-9]\.[0-9]{1,2})', text_lower)
        if not cgpa_match:
            cgpa_match = re.search(r'([0-9]\.[0-9]{1,2})\s*/\s*10', text_lower)
        
        cgpa = float(cgpa_match.group(2 if cgpa_match.lastindex >= 2 else 1)) if cgpa_match else 7.5
        if cgpa > 10.0:
            cgpa = round(cgpa / 10.0, 2)

        # 4. Skills Classification
        prog_found = [p for p in PROGRAMMING_LANGS if re.search(r'\b' + re.escape(p) + r'\b', text_lower)]
        tech_found = [t for t in TECH_SKILLS if re.search(r'\b' + re.escape(t) + r'\b', text_lower)]
        soft_found = [s for s in SOFT_SKILLS if re.search(r'\b' + re.escape(s) + r'\b', text_lower)]

        all_skills = list(set(prog_found + tech_found))

        # 5. Counts (Internships, Projects, Certifications, Backlogs)
        internship_count = len(re.findall(r'\b(internship|intern|trainee|apprentice)\b', text_lower))
        internships = min(max(internship_count, 1) if "internship" in text_lower or "intern" in text_lower else 0, 4)

        project_matches = re.findall(r'\b(project|projects)\b', text_lower)
        projects = min(max(len(project_matches), 2) if "project" in text_lower else 1, 6)

        cert_matches = re.findall(r'\b(certified|certification|certificate|nptel|coursera|udemy|aws certified)\b', text_lower)
        certifications = min(len(cert_matches), 5)

        backlog_matches = re.search(r'(backlog|active backlogs|kt)[:\s]*([0-9])', text_lower)
        backlogs = int(backlog_matches.group(2)) if backlog_matches else 0

        # Skill Ratings heuristic based on extracted skills count
        coding_score = min(max(len(prog_found) * 2 + len(tech_found), 4), 10)
        comm_score = min(max(len(soft_found) * 2 + 5, 5), 10)
        soft_score = min(max(len(soft_found) * 2 + 4, 4), 10)
        aptitude_score = 75  # default baseline

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "degree": extracted_degree,
            "branch": extracted_branch,
            "cgpa": cgpa,
            "skills": all_skills,
            "programming_languages": prog_found,
            "soft_skills": soft_found,
            "internships_count": internships,
            "projects_count": projects,
            "certifications_count": certifications,
            "backlogs_count": backlogs,
            "raw_text": text[:1500],
            # Population values for placement prediction form:
            "form_fields": {
                "Age": 21,
                "Gender": "Male",
                "Degree": extracted_degree,
                "Branch": extracted_branch,
                "CGPA": cgpa,
                "Internships": internships,
                "Projects": projects,
                "Coding_Skills": coding_score,
                "Communication_Skills": comm_score,
                "Aptitude_Test_Score": aptitude_score,
                "Soft_Skills_Rating": soft_score,
                "Certifications": certifications,
                "Backlogs": backlogs
            }
        }
