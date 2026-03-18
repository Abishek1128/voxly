from collections import Counter

class InterviewSession:
    def __init__(self):
        self.scores = []
        self.covered = []
        self.missing = []
        self.voice_levels = []

    def add_response(self, score, covered, missing, voice_level):
        self.scores.append(score)
        self.covered.extend(covered)
        self.missing.extend(missing)
        self.voice_levels.append(voice_level)

    def generate_summary(self):
        total = len(self.scores)

        if total == 0:
            return {
                "total_questions": 0,
                "average_score": 0,
                "strengths": [],
                "weak_areas": [],
                "verdict": "No questions were answered."
            }

        avg_score = round(sum(self.scores) / total, 3)

        strengths = list(set(self.covered))
        weak_areas = list(set(self.missing))

        if avg_score >= 0.75:
            verdict = "Excellent performance"
        elif avg_score >= 0.5:
            verdict = "Good, but needs improvement"
        else:
            verdict = "Needs significant improvement"

        return {
            "total_questions": total,
            "average_score": avg_score,
            "strengths": strengths,
            "weak_areas": weak_areas,
            "verdict": verdict
        }

    def _average_voice_confidence(self):
        if not self.voice_levels:
            return "Unknown"

        counts = Counter(self.voice_levels)
        return counts.most_common(1)[0][0]

    def _generate_verdict(self, avg_score, voice):
        if avg_score >= 0.8 and voice == "High":
            return "Excellent – Interview Ready"
        elif avg_score >= 0.6 and voice == "High":
            return "Confident but Needs Concept Clarity"
        elif avg_score >= 0.75 and voice in ["Medium", "Low"]:
            return "Strong Knowledge, Improve Communication"
        elif avg_score >= 0.5:
            return "Good – Practice More"
        elif voice == "High":
            return "Fluent but Lacks Technical Depth"
        else:
            return "Needs Strong Preparation"

    def _generate_insight(self, avg_score, voice):
        if avg_score < 0.5 and voice == "High":
            return "You communicate confidently, but your technical depth needs improvement."
        elif avg_score >= 0.75 and voice in ["Low", "Medium"]:
            return "Your knowledge is strong, but confidence and fluency can be improved."
        elif avg_score >= 0.75:
            return "Strong overall performance with balanced communication and knowledge."
        else:
            return "Focus on fundamentals and practice structured explanations."
