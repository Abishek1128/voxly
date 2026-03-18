# backend/interview/interview_service.py

from backend.models.interview_session import InterviewSession as DBInterviewSession
from backend.models.interview_response import InterviewResponse
from backend.interview.providers.ai_provider import AIQuestionProvider
from backend.interview.providers.static_provider import StaticQuestionProvider
from backend.interview.providers.question_router import QuestionRouter
from backend.interview.interview_engine import InterviewEngine
from backend.interview.interview_session import InterviewSession as LogicSession
from backend.evaluator.semantic_search import evaluate_answer
from backend.evaluator.voice_confidence import analyze_voice_confidence
from sqlalchemy.orm import Session


# 🔥 In-memory active interview sessions
active_sessions = {}


# =============================
# START INTERVIEW
# =============================
def start_interview(
    db: Session,
    user_id: int,
    role: str,
    mode: str,
    difficulty: str,
    questions_count: int
):
    db_session = DBInterviewSession(
        user_id=user_id,
        role=role,
        mode=mode,
        difficulty=difficulty
    )

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    difficulty_prompts = {
        "easy": "Ask beginner-level conceptual questions.",
        "medium": "Ask intermediate practical questions.",
        "hard": "Ask advanced system design and scenario-based questions."
    }

    level_instruction = difficulty_prompts.get(difficulty, "Ask interview questions.")

    ai_provider = AIQuestionProvider()
    static_provider = StaticQuestionProvider(role=role)
    router = QuestionRouter(ai_provider, static_provider)

    engine = InterviewEngine(
        router,
        role=role,
        difficulty=difficulty,
        difficulty_instruction=level_instruction
    )

    logic_session = LogicSession()

    active_sessions[db_session.id] = {
        "engine": engine,
        "logic_session": logic_session,
        "role": role,
        "mode": mode,
        "difficulty": difficulty,
        "question_count": 0,           # tracks how many questions asked so far
        "max_questions": questions_count,
        "current_question": None,
        "last_user_answer": None,      # 🔥 store last answer for follow-up generation
    }

    return db_session.id


# =============================
# GET NEXT QUESTION
# =============================
def get_next_question(session_id: int):
    session_data = active_sessions.get(session_id)

    if not session_data:
        return {"error": "Session not found"}

    # Check max question limit BEFORE fetching
    if session_data["question_count"] >= session_data["max_questions"]:
        return {
            "completed": True,
            "message": "Interview completed"
        }

    engine = session_data["engine"]
    last_answer = session_data.get("last_user_answer")

    # 🔥 Pass the last user answer so the engine can generate a follow-up question
    q = engine.get_next_question(previous_answer=last_answer)

    if not q:
        return {
            "completed": True,
            "message": "No more questions available"
        }

    # ✅ Increment counter WHEN a question is fetched
    session_data["question_count"] += 1
    session_data["current_question"] = q

    return {
        "completed": False,
        "question": q["question"],
        "question_number": session_data["question_count"],
        "total_questions": session_data["max_questions"]
    }


def get_current_question(session_id: int):
    session_data = active_sessions.get(session_id)
    if not session_data:
        return None
    return session_data.get("current_question")


# =============================
# SUBMIT ANSWER
# =============================
def submit_answer(db: Session, session_id: int, user_answer: str):
    session_data = active_sessions.get(session_id)

    if not session_data:
        return {"error": "Session not active"}

    engine = session_data["engine"]
    logic_session = session_data["logic_session"]
    q = session_data.get("current_question")

    if not q:
        return {"error": "No active question"}

    # 🔥 Save this answer so next question can be context-aware
    session_data["last_user_answer"] = user_answer

    # Evaluate
    result = evaluate_answer(user_answer, q)

    if not result or "score" not in result:
        return {"error": "Evaluation failed"}

    score = float(result["score"])
    engine.adapt_difficulty(score)

    voice_stats = analyze_voice_confidence(user_answer) or {"confidence": 0, "filler_count": 0}

    response = InterviewResponse(
        session_id=session_id,
        question=q["question"],
        score=score,
        voice_confidence=voice_stats["confidence"]
    )

    db.add(response)
    db.commit()

    logic_session.add_response(
        score=score,
        covered=result.get("covered", []),
        missing=result.get("missing", []),
        voice_level=voice_stats["confidence"]
    )

    return {
        "score": score,
        "confidence": voice_stats["confidence"],
        "filler_words": voice_stats.get("filler_count", 0)
    }


# =============================
# GENERATE SUMMARY
# =============================
def generate_summary(db: Session, session_id: int):
    session_data = active_sessions.get(session_id)

    if not session_data:
        return {"error": "Session not found"}

    logic_session = session_data["logic_session"]
    summary = logic_session.generate_summary()

    db_session = db.query(DBInterviewSession)\
        .filter(DBInterviewSession.id == session_id)\
        .first()

    db_session.average_score = summary["average_score"]
    db_session.verdict = summary["verdict"]
    db.commit()

    del active_sessions[session_id]

    return summary