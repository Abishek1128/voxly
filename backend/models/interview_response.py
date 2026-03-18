from sqlalchemy import Column, Integer, ForeignKey, Float, String
from backend.db.database import Base

class InterviewResponse(Base):
    __tablename__ = "interview_responses"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"))

    question = Column(String, nullable=False)
    score = Column(Float, default=0.0)
    voice_confidence = Column(String)
