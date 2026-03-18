class QuestionRouter:
    def __init__(self, ai_provider, static_provider):
        self.ai = ai_provider
        self.static = static_provider

    def get_question(self, role, topic, difficulty, asked_ids, previous_answer=None):  # 🔥 added
        try:
            print("🤖 Using AI-generated question")
            return self.ai.get_question(
                role=role,
                topic=topic,
                difficulty=difficulty,
                previous_answer=previous_answer  # 🔥 forward it
            )
        except Exception:
            print("📚 Using static question")
            return self.static.get_question(
                topic=topic,
                difficulty=difficulty,
                asked_ids=asked_ids
            )