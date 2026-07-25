import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from backend.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="student")  # student, recruiter, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    student_name = Column(String, default="Anonymous Student")
    degree = Column(String)
    branch = Column(String)
    cgpa = Column(Float)
    placement_status = Column(String)  # Placed, Not Placed
    placement_probability = Column(Float)
    risk_level = Column(String)
    input_data_json = Column(Text)
    result_data_json = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class JobMatchHistory(Base):
    __tablename__ = "job_match_history"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    job_title = Column(String)
    job_description_snippet = Column(Text)
    candidate_count = Column(Integer, default=0)
    results_json = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
