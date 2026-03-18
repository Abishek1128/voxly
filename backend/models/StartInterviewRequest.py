from pydantic import BaseModel

class StartInterviewRequest(BaseModel):
    role: str
    mode: str
    difficulty: str
    questions_count: int