import re
import numpy as np
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Try loading SentenceTransformers, or fallback gracefully to TF-IDF
try:
    from sentence_transformers import SentenceTransformer
    EMBEDDER = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Loaded SentenceTransformer model 'all-MiniLM-L6-v2' successfully.")
except Exception as e:
    EMBEDDER = None
    logger.info(f"SentenceTransformers not loaded ({e}), using TF-IDF fallback.")

class AIMatchingEngine:
    def __init__(self):
        pass

    def compute_semantic_similarity(self, text1: str, text2: str) -> float:
        if not text1 or not text2:
            return 0.0
            
        if EMBEDDER is not None:
            try:
                embeddings = EMBEDDER.encode([text1, text2])
                sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
                return float(np.clip(sim * 100.0, 0, 100))
            except Exception as e:
                logger.warning(f"SentenceTransformer embedding error: {e}")

        # TF-IDF fallback
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_mat = vectorizer.fit_transform([text1, text2])
            sim = cosine_similarity(tfidf_mat[0:1], tfidf_mat[1:2])[0][0]
            return float(np.clip(sim * 100.0, 0, 100))
        except Exception:
            return 50.0

    def calculate_match(self, resume_data: dict, jd_data: dict) -> dict:
        resume_skills = set([s.lower() for s in resume_data.get("skills", [])])
        jd_required = set([s.lower() for s in jd_data.get("required_skills", [])])
        jd_preferred = set([s.lower() for s in jd_data.get("preferred_skills", [])])
        jd_all_skills = jd_required.union(jd_preferred)
        jd_keywords = set([k.lower() for k in jd_data.get("keywords", [])])

        # 1. Skill Match Score
        matched_skills = resume_skills.intersection(jd_all_skills)
        missing_skills = list(jd_all_skills - resume_skills)
        
        if jd_all_skills:
            skill_match_score = (len(matched_skills) / len(jd_all_skills)) * 100.0
        else:
            skill_match_score = 80.0

        # 2. Keyword Match Score
        matched_keywords = resume_skills.intersection(jd_keywords)
        if jd_keywords:
            keyword_match_score = (len(matched_keywords) / len(jd_keywords)) * 100.0
        else:
            keyword_match_score = 75.0

        # 3. Education Match
        res_degree = resume_data.get("degree", "").lower()
        edu_match_score = 90.0 if any(d.lower() in res_degree for d in ["b.tech", "btech", "bca", "mca", "m.tech"]) else 70.0

        # 4. Experience Match
        exp_req = jd_data.get("minimum_experience_years", 0)
        exp_match_score = 100.0 if exp_req <= 1 else 80.0

        # 5. Semantic Similarity
        res_text = resume_data.get("raw_text", " ".join(resume_skills))
        jd_text = jd_data.get("raw_text", " ".join(jd_all_skills))
        semantic_sim_score = self.compute_semantic_similarity(res_text, jd_text)

        # 6. Overall Job Match Score & ATS Compatibility
        job_match_score = round(
            0.40 * skill_match_score +
            0.25 * semantic_sim_score +
            0.15 * keyword_match_score +
            0.10 * edu_match_score +
            0.10 * exp_match_score, 2
        )

        ats_compatibility_score = round(
            0.35 * keyword_match_score +
            0.35 * skill_match_score +
            0.30 * semantic_sim_score, 2
        )

        # Strengths & Weaknesses
        strengths = []
        weaknesses = []

        if skill_match_score >= 70:
            strengths.append(f"Strong overlap in core required skills ({len(matched_skills)} matched).")
        else:
            weaknesses.append(f"Missing key required skills: {', '.join(missing_skills[:3]) if missing_skills else 'None'}.")

        if ats_compatibility_score >= 75:
            strengths.append("High ATS formatting & keyword optimization level.")
        else:
            weaknesses.append("ATS keyword density is below target; incorporate job keywords into experience descriptions.")

        if resume_data.get("projects_count", 0) >= 3:
            strengths.append("Solid practical portfolio with multiple projects.")
        else:
            weaknesses.append("Consider building more target projects matching the job domain.")

        recommended_skills = missing_skills[:5]

        return {
            "ats_compatibility_score": ats_compatibility_score,
            "job_match_score": job_match_score,
            "skill_match_score": round(skill_match_score, 2),
            "education_match_score": round(edu_match_score, 2),
            "experience_match_score": round(exp_match_score, 2),
            "keyword_match_score": round(keyword_match_score, 2),
            "semantic_similarity_score": round(semantic_sim_score, 2),
            "matched_skills": list(matched_skills),
            "missing_skills": missing_skills,
            "recommended_skills": recommended_skills,
            "resume_strengths": strengths,
            "resume_weaknesses": weaknesses
        }
