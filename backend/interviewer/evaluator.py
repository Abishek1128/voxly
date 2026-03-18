from sklearn.metrics.pairwise import cosine_similarity
from embeddings.semantic_model import SemanticModel

class AnswerEvaluator:
    def __init__(self):
        self.semantic_model = SemanticModel()

    def evaluate(self, answer, concepts):
        answer_embedding = self.semantic_model.embed(answer)

        results = []
        total_score = 0

        for concept in concepts:
            concept_embedding = self.semantic_model.embed(concept)
            similarity = cosine_similarity(
                [answer_embedding],
                [concept_embedding]
            )[0][0]

            if similarity >= 0.70:
                status = "covered"
                score = 1
            elif similarity >= 0.40:
                status = "partial"
                score = 0.5
            else:
                status = "missing"
                score = 0

            results.append({
                "concept": concept,
                "similarity": round(similarity, 2),
                "status": status
            })

            total_score += score

        final_percentage = (total_score / len(concepts)) * 100

        return {
            "concept_analysis": results,
            "final_score": round(final_percentage, 2)
        }
