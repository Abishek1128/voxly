import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

ROLE_FILES = {
    "frontend": os.path.join(BASE_DIR, "data", "frontend_questions.json"),
    "python_backend": os.path.join(BASE_DIR, "data", "backend_questions.json"),
    "java_backend": os.path.join(BASE_DIR, "data", "backend_java_questions.json"),
}

class StaticQuestionProvider:
    def __init__(self, role):
        self.role = role
        self.questions = self.load_questions()

    def load_questions(self):
        file_path = ROLE_FILES.get(self.role)
        if not file_path:
            raise ValueError("Invalid role selected")

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return data["technical_questions"]

    def get_question(self, topic, difficulty, asked_ids):
        questions = self.questions[difficulty]

        for q in questions:
            if q["id"] not in asked_ids:
                return q

        raise Exception("No more questions available at this level")
