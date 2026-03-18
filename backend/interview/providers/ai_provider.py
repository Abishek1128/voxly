import os
import requests
import json

class AIQuestionProvider:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "qwen/qwen-2.5-7b-instruct"

    def get_question(self, role, topic, difficulty, previous_answer=None):  # 🔥 added
        if not self.api_key:
            raise Exception("API key missing")

        # 🔥 Build follow-up context if previous answer exists
        follow_up_context = ""
        if previous_answer:
            follow_up_context = f"""
The candidate just answered the previous question with:
"{previous_answer}"

Based on their response, generate a follow-up question that either:
- Probes deeper into something they mentioned
- Clarifies a concept they seemed unsure about
- Explores a related area they may have missed
"""

        prompt = f"""
You are an expert technical interviewer.

Generate ONE {difficulty.upper()} level interview question 
for a {role} developer.

Topic focus: {topic}

Difficulty Guidelines:
- Easy → Basic conceptual clarity and simple practical example.
- Medium → Real-world implementation scenario or debugging situation.
- Hard → Advanced architecture, system design, performance tradeoffs, or edge cases.

{follow_up_context}

Avoid basic definitions.
Ask practical, scenario-based, or conceptual depth questions.

Return ONLY valid JSON (no markdown, no backticks):

{{
  "id": "{topic}_{difficulty}_auto",
  "question": "string",
  "ideal_answer": "clear technical explanation",
  "concepts": ["concept1", "concept2"],
  "topic": "{topic}",
  "difficulty": "{difficulty}"
}}
"""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.6
        }

        response = requests.post(
            self.url,
            headers=headers,
            json=payload,
            timeout=10
        )
        response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"]

        # Strip markdown code fences if model returns them
        content = content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        return json.loads(content.strip())