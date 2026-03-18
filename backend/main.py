from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.auth.AuthRoutes import AuthRouter as auth_router
from backend.interview.interview_routes import interview_router as interview_router
from backend.asr.live_transcribe import router as live_asr_router



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",    
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(interview_router)
app.include_router(live_asr_router, prefix="/asr")
