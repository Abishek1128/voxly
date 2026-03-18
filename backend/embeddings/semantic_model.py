import os
os.environ["TRANSFORMERS_NO_TF"] = "1"
from sentence_transformers import SentenceTransformer


class SemanticModel:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def embed(self, text):
        return self.model.encode(text)
