from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from difflib import SequenceMatcher


model = SentenceTransformer("all-MiniLM-L6-v2")
THRESHOLD = 0.6

def text_similarity(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def evaluate_answer(user_answer, question_obj):
    ideal_answer = question_obj["ideal_answer"]
    concepts = question_obj["concepts"]

    # ---- Semantic similarity ----
    user_emb = model.encode(user_answer)
    ideal_emb = model.encode(ideal_answer)

    semantic_score = cosine_similarity([user_emb], [ideal_emb])[0][0]

    # ---- Lexical similarity ----
    lexical_score = text_similarity(user_answer, ideal_answer)

    # ---- Final hybrid score ----
    final_score = (0.7 * semantic_score) + (0.3 * lexical_score)

    # ---- Concept coverage ----
    user_text = user_answer.lower()
    covered = [c for c in concepts if c.lower() in user_text]
    missing = [c for c in concepts if c.lower() not in user_text]

    # ---- Level decision ----
    if final_score >= 0.75:
        level = "Excellent"
    elif final_score >= 0.6:
        level = "Good"
    elif final_score >= 0.45:
        level = "Average"
    else:
        level = "Poor"

    return {
        "semantic_score": round(semantic_score, 3),
        "lexical_score": round(lexical_score, 3),
        "score": round(final_score, 3),
        "level": level,
        "covered": covered,
        "missing": missing
    }
