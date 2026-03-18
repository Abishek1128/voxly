from interview.providers.ai_provider import AIQuestionProvider
from interview.providers.static_provider import StaticQuestionProvider
from interview.providers.question_router import QuestionRouter
from interview.interview_session import InterviewSession
from interview.interview_engine import InterviewEngine
from evaluator.semantic_search import evaluate_answer
from evaluator.voice_confidence import analyze_voice_confidence
from interview.question_loader import load_questions
from asr.speech_to_text import record_audio, save_audio, transcribe_audio

#Database
from backend.db.database import SessionLocal
from backend.models.interviewSession import InterviewSession as DBInterviewSession
from backend.models.interviewResponse import InterviewResponse
from interview.interview_session import InterviewSession as LogicSession

load_dotenv()



# router = QuestionRouter(ai_provider, static_provider)

print("Select Role:")
print("1. Frontend Developer")
print("2. Python Developer")
print("3. Java Developer")

role_choice = input("Enter role (1/2/3): ")

if role_choice == "1":
    selected_role = "frontend"
elif role_choice == "2":
    selected_role = "python_backend"
elif role_choice == "3":
    selected_role = "java_backend"
else:
    print("Invalid role. Defaulting to frontend.")
    selected_role = "frontend"
    
ai_provider = AIQuestionProvider()
static_provider = StaticQuestionProvider(role=selected_role)

router = QuestionRouter(ai_provider, static_provider)


engine = InterviewEngine(router, role=selected_role)
session = InterviewSession()


print("Select Mode:")
print("1. Practice Mode")
print("2. Interview Mode")

choice = input("Enter choice (1/2): ")
mode = "practice" if choice == "1" else "interview"

print("🎤 AI Interview Started\n")

question_count = 0
MAX_QUESTIONS = 3 if mode == "practice" else 3

while question_count < MAX_QUESTIONS:
    q = engine.get_next_question()
    if q is None:
        print("⚠ No more questions available at this level")
        break

    question_count += 1

    print(f"❓ Question {question_count}: {q['question']}")
    input("Press ENTER and answer by speaking...")

    audio = record_audio()
    audio_path = save_audio(audio)
    user_answer = transcribe_audio(audio_path)

    print("\n📝 Your Answer:", user_answer)

    result = evaluate_answer(user_answer, q)
    engine.adapt_difficulty(result["score"])

    voice_stats = analyze_voice_confidence(user_answer)
    session.add_response(
        score=result["score"],
        covered=result["covered"],
        missing=result["missing"],
        voice_level=voice_stats["confidence"]
    )

    if mode == "practice":
        # Voice feedback
        print("🎤 Voice Confidence:", voice_stats["confidence"])
        print("😐 Filler Words:", voice_stats["filler_count"])
        print("🔢 Answer Score:", result["score"])
        
         # 🔥 COMMUNICATION vs KNOWLEDGE INSIGHT
        if result["score"] < 0.5 and voice_stats["confidence"] == "High":
            print("💡 Insight: You sound confident, but the answer lacks technical depth.")
        elif result["score"] >= 0.75 and voice_stats["confidence"] in ["Low", "Medium"]:
            print("💡 Insight: Strong knowledge, but improve clarity and confidence.")
        elif result["score"] >= 0.75 and voice_stats["confidence"] == "High":
            print("💡 Insight: Excellent balance of confidence and technical depth.")
        print("-" * 50)



print("✅ Interview Completed!")

# =============================
# 📊 INTERVIEW SUMMARY
# =============================
summary = session.generate_summary()

print("\n📊 INTERVIEW SUMMARY")
print("Questions Asked:", summary["total_questions"])
print("Average Confidence:", summary["average_score"])

print("\n💪 Strengths:")
for s in summary["strengths"]:
    print("✔", s)

print("\n⚠ Weak Areas:")
for w in summary["weak_areas"][:5]:
    print("✖", w)

print("\n🏆 Final Verdict:", summary["verdict"])
