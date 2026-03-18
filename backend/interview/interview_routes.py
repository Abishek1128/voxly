# from fastapi import APIRouter, Depends, Query
# from sqlalchemy.orm import Session
# from backend.auth.dependencies import get_current_user, get_db
# from fastapi import UploadFile, File, Form
# from typing import Optional
# from backend.models.user import User
# from backend.models.interview_session import InterviewSession as DBInterviewSession
# from backend.asr.speech_to_text import transcribe_audio
# from backend.evaluator.semantic_search import evaluate_answer
# from backend.evaluator.voice_confidence import analyze_voice_confidence
# from backend.models.StartInterviewRequest import StartInterviewRequest
# from backend.interview.interview_service import (
#     start_interview,
#     get_next_question,
#     submit_answer,
#     generate_summary,
#     get_current_question
# )
# import os

# interview_router = APIRouter(prefix="/interview", tags=["Interview"])


# @interview_router.post("/start")
# def start(
#     request: StartInterviewRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     session_id = start_interview(
#         db,
#         user_id=current_user.id,
#         role=request.role,
#         mode=request.mode,
#         difficulty=request.difficulty,
#         questions_count=request.questions_count
#     )

#     first_question = get_next_question(session_id)

#     return {
#         "session_id": session_id,
#         "question": first_question["question"],
#         "question_number": 1,
#         "total_questions": request.questions_count
#     }


# # ── NEW: fetch the current user's sessions with pagination + filters ──
# @interview_router.get("/sessions")
# def get_sessions(
#     current_user: User = Depends(get_current_user),
#     db: Session           = Depends(get_db),
#     limit: int            = Query(3,  ge=1, le=100),
#     page: int             = Query(1,  ge=1),
#     mode: Optional[str]   = Query(None),        # "practice" | "interview"
#     role: Optional[str]   = Query(None),        # "frontend" | "python_backend" | ...
#     sort: Optional[str]   = Query("newest"),    # "newest" | "oldest" | "highest" | "lowest"
# ):
#     query = db.query(DBInterviewSession).filter(
#         DBInterviewSession.user_id == current_user.id
#     )

#     # optional filters
#     if mode:
#         query = query.filter(DBInterviewSession.mode == mode)
#     if role:
#         query = query.filter(DBInterviewSession.role == role)

#     # sorting
#     if sort == "oldest":
#         query = query.order_by(DBInterviewSession.created_at.asc())
#     elif sort == "highest":
#         query = query.order_by(DBInterviewSession.average_score.desc())
#     elif sort == "lowest":
#         query = query.order_by(DBInterviewSession.average_score.asc())
#     else:  # newest (default)
#         query = query.order_by(DBInterviewSession.created_at.desc())

#     total = query.count()

#     # if limit=3 and no page was passed (dashboard quick-fetch), skip pagination
#     sessions = query.offset((page - 1) * limit).limit(limit).all()

#     # serialise manually so we don't need a Pydantic schema
#     def serialise(s: DBInterviewSession):
#         return {
#             "id":            s.id,
#             "role":          s.role,
#             "mode":          s.mode,
#             "difficulty":    s.difficulty,
#             "average_score": s.average_score,
#             "verdict":       s.verdict,
#             "created_at":    s.created_at.isoformat() if s.created_at else None,
#         }

#     return {
#         "sessions": [serialise(s) for s in sessions],
#         "total":    total,
#         "page":     page,
#         "pages":    max(1, -(-total // limit)),   # ceiling division
#     }


# @interview_router.get("/question/{session_id}")
# def next_question(session_id: int):
#     return get_next_question(session_id)


# @interview_router.post("/answer")
# async def answer(
#     session_id: int = Form(...),
#     audio_file: Optional[UploadFile] = File(None),
#     text_answer: Optional[str] = Form(None),
#     db: Session = Depends(get_db)
# ):
#     if audio_file:
#         audio_bytes = await audio_file.read()
#         file_path = f"temp_{session_id}.webm"

#         with open(file_path, "wb") as f:
#             f.write(audio_bytes)

#         user_answer = transcribe_audio(file_path)
#         os.remove(file_path)

#     elif text_answer:
#         user_answer = text_answer

#     else:
#         return {"error": "No answer provided"}

#     result = submit_answer(db, session_id, user_answer)
#     voice  = analyze_voice_confidence(user_answer)
#     next_q = get_next_question(session_id)

#     return {
#         "mode":            "practice",
#         "transcribed_text": user_answer,
#         "score":           result.get("score", 0),
#         "filler_words":    result.get("filler_words", []),
#         "confidence":      voice.get("confidence", 0),
#         "next_question":   next_q
#     }


# @interview_router.get("/summary/{session_id}")
# def summary(
#     session_id: int,
#     db: Session = Depends(get_db)
# ):
#     return generate_summary(db, session_id)


from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.auth.dependencies import get_current_user, get_db
from fastapi import UploadFile, File, Form
from typing import Optional
from backend.models.user import User
from backend.models.interview_session import InterviewSession as DBInterviewSession
from backend.models.interview_response import InterviewResponse
from backend.asr.speech_to_text import transcribe_audio
from backend.evaluator.semantic_search import evaluate_answer
from backend.evaluator.voice_confidence import analyze_voice_confidence
from backend.models.StartInterviewRequest import StartInterviewRequest
from backend.interview.interview_service import (
    start_interview,
    get_next_question,
    submit_answer,
    generate_summary,
    get_current_question
)
import os

interview_router = APIRouter(prefix="/interview", tags=["Interview"])


@interview_router.post("/start")
def start(
    request: StartInterviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session_id = start_interview(
        db,
        user_id=current_user.id,
        role=request.role,
        mode=request.mode,
        difficulty=request.difficulty,
        questions_count=request.questions_count
    )
    first_question = get_next_question(session_id)
    return {
        "session_id":      session_id,
        "question":        first_question["question"],
        "question_number": 1,
        "total_questions": request.questions_count,
        "mode":            request.mode,        # "practice" | "interview"
        "role":            request.role,
        "difficulty":      request.difficulty,
    }


# ── GET paginated sessions for current user ───────────────────────────
@interview_router.get("/sessions")
def get_sessions(
    current_user: User  = Depends(get_current_user),
    db: Session         = Depends(get_db),
    limit: int          = Query(3,  ge=1, le=100),
    page: int           = Query(1,  ge=1),
    mode: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    sort: Optional[str] = Query("newest"),
):
    query = db.query(DBInterviewSession).filter(
        DBInterviewSession.user_id == current_user.id
    )
    if mode:
        query = query.filter(DBInterviewSession.mode == mode)
    if role:
        query = query.filter(DBInterviewSession.role == role)
    if sort == "oldest":
        query = query.order_by(DBInterviewSession.created_at.asc())
    elif sort == "highest":
        query = query.order_by(DBInterviewSession.average_score.desc())
    elif sort == "lowest":
        query = query.order_by(DBInterviewSession.average_score.asc())
    else:
        query = query.order_by(DBInterviewSession.created_at.desc())

    total    = query.count()
    sessions = query.offset((page - 1) * limit).limit(limit).all()

    def serialise(s: DBInterviewSession):
        return {
            "id":            s.id,
            "role":          s.role,
            "mode":          s.mode,
            "difficulty":    s.difficulty,
            "average_score": round((s.average_score or 0) * 10, 1),
            "verdict":       s.verdict,
            "created_at":    s.created_at.isoformat() if s.created_at else None,
        }

    return {
        "sessions": [serialise(s) for s in sessions],
        "total":    total,
        "page":     page,
        "pages":    max(1, -(-total // limit)),
    }


# ── GET full report for a single session (used by report pages) ───────
@interview_router.get("/report/{session_id}")
def get_report(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session        = Depends(get_db),
):
    session = db.query(DBInterviewSession).filter(
        DBInterviewSession.id      == session_id,
        DBInterviewSession.user_id == current_user.id,
    ).first()

    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session not found")

    responses = db.query(InterviewResponse).filter(
        InterviewResponse.session_id == session_id
    ).all()

    # derive stats from per-question responses
    scores = [r.score for r in responses if r.score is not None]
    avg    = round(sum(scores) / len(scores), 3) if scores else (session.average_score or 0)

    # voice confidence majority vote
    voices = [r.voice_confidence for r in responses if r.voice_confidence]
    from collections import Counter
    voice_label = Counter(voices).most_common(1)[0][0] if voices else "Unknown"

    return {
        "session": {
            "id":            session.id,
            "role":          session.role,
            "mode":          session.mode,
            "difficulty":    session.difficulty,
            "average_score": avg,
            "verdict":       session.verdict or "Incomplete",
            "created_at":    session.created_at.isoformat() if session.created_at else None,
        },
        "stats": {
            "total_questions":   len(responses),
            "average_score":     avg,                          # 0‒1 float
            "average_score_10":  round(avg * 10, 1),           # 0‒10 display
            "average_pct":       round(avg * 100),             # 0‒100 display
            "voice_confidence":  voice_label,
        },
        "responses": [
            {
                "question":         r.question,
                "score":            r.score,
                "score_pct":        round((r.score or 0) * 100),
                "voice_confidence": r.voice_confidence,
            }
            for r in responses
        ],
    }


@interview_router.get("/question/{session_id}")
def next_question(session_id: int):
    return get_next_question(session_id)


@interview_router.post("/answer")
async def answer(
    session_id:  int                    = Form(...),
    audio_file:  Optional[UploadFile]   = File(None),
    text_answer: Optional[str]          = Form(None),
    db:          Session                = Depends(get_db),
):
    if audio_file:
        audio_bytes = await audio_file.read()
        file_path   = f"temp_{session_id}.webm"
        with open(file_path, "wb") as f:
            f.write(audio_bytes)
        user_answer = transcribe_audio(file_path)
        os.remove(file_path)
    elif text_answer:
        user_answer = text_answer
    else:
        return {"error": "No answer provided"}

    result = submit_answer(db, session_id, user_answer)
    voice  = analyze_voice_confidence(user_answer)
    next_q = get_next_question(session_id)

    # get the actual mode from the active session
    from backend.interview.interview_service import active_sessions
    session_data = active_sessions.get(session_id, {})
    actual_mode  = session_data.get("mode", "practice")

    is_audio         = audio_file is not None
    voice_confidence = voice.get("confidence", "Low")   # "High" | "Medium" | "Low"
    voice_score      = voice.get("score", 0.0)           # 0-1 numeric

    return {
        "mode":             actual_mode,
        "transcribed_text": user_answer,
        "score":            result.get("score", 0),
        "filler_words":     voice.get("filler_count", 0),
        "confidence":       voice_score,                 # numeric 0-1 for bar display
        "confidence_label": voice_confidence,            # "High" / "Medium" / "Low"
        "is_audio":         is_audio,
        "next_question":    next_q,
    }


@interview_router.get("/summary/{session_id}")
def summary(session_id: int, db: Session = Depends(get_db)):
    return generate_summary(db, session_id)