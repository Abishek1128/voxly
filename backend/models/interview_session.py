from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Float
from datetime import datetime
from backend.db.database import Base

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    role = Column(String, nullable=False)
    mode = Column(String, nullable=False)  # practice or interview
    difficulty = Column(String)

    average_score = Column(Float, default=0.0)
    verdict = Column(String, default="")

    created_at = Column(DateTime, default=datetime.utcnow)
