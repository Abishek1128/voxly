import json
import random
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "frontend_questions.json")

ROLE_FILES = {
    "frontend": "data/frontend_questions.json",
    "python_backend": "data/python_backend_questions.json",
    "java_backend" : "data/backend_java_questions.json"
}



def load_questions(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 🔥 FLATTEN DICT → LIST
    questions = []
    for topic_questions in data.values():
        questions.extend(topic_questions)

    return questions


def select_questions(questions):
    easy_questions = random.sample(questions["easy"], 1)
    medium_questions = random.sample(questions["medium"], 2)
    hard_questions = random.sample(questions["hard"], 2)

    selected = easy_questions + medium_questions + hard_questions
    random.shuffle(selected)

    return selected
