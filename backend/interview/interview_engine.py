

# class InterviewEngine:
    # def __init__(self, router, role, difficulty, difficulty_instruction):
    #     self.router = router
    #     self.role = role
    #     self.difficulty = difficulty
    #     self.difficulty_instruction = difficulty_instruction
    #     self.topics = ROLE_TOPICS.get(role, [])
    #     self.current_topic_index = 0
    #     self.difficulty = "easy"
    #     self.asked_ids = set()

    # def get_next_question(self):
    #     if self.current_topic_index >= len(self.topics):
    #         return None

    #     topic = self.topics[self.current_topic_index]

    #     q = self.router.get_question(
    #         role=self.role,
    #         topic=topic,
    #         difficulty=self.difficulty,
    #         asked_ids=self.asked_ids
    # )

    #     self.asked_ids.add(q["id"])
    #     self.current_topic_index += 1

    #     return q


    # def adapt_difficulty(self, score):
    #     if score > 0.75:
    #         self.current_difficulty = "hard"
    #     elif score > 0.5:
    #         self.current_difficulty = "medium"
    #     else:
    #         self.current_difficulty = "easy"
    
ROLE_TOPICS = {
    "frontend": ["html", "css", "javascript","browser_internals", "react","state_management", "performance", "accessibility", "api_handling", "testing", "system_design"],
    "python_backend": ["python_basics", "oop", "data_structures", "web", "system_design"],
    "java_backend": ["java_basics","oops",
        "collections",
        "exceptions",
        "spring",
        "database",
        "api",
        "concurrency",
        "jvm",
        "security",
        "design_patterns",
        "build_tools",
        "performance",
        "system_design"
    ]
}
BASIC_TOPICS = ["html", "css", "javascript"]
ADVANCED_TOPICS = ["system_design", "performance", "concurrency"]

ROLE_DIFFICULTY_TOPICS = {
    "frontend": {
        "easy": ["html", "css", "javascript"],
        "medium": ["react", "state_management", "api_handling"],
        "hard": ["performance", "system_design", "browser_internals"]
    },
    "python_backend": {
        "easy": ["python_basics", "oop"],
        "medium": ["data_structures", "web"],
        "hard": ["system_design"]
    },
    "java_backend": {
        "easy": ["java_basics", "oops", "collections"],
        "medium": ["spring", "database", "api"],
        "hard": ["concurrency", "jvm", "performance", "system_design"]
    }
}

class InterviewEngine:
    def __init__(self, router, role, difficulty, difficulty_instruction):
        self.router = router
        self.role = role
        self.difficulty = difficulty
        self.difficulty_instruction = difficulty_instruction
        self.topics = ROLE_TOPICS.get(role, [])
        self.current_topic_index = 0
        self.asked_ids = set()

    def get_next_question(self, previous_answer: str = None):   # 🔥 added previous_answer

        role_topics = ROLE_DIFFICULTY_TOPICS.get(self.role, {})
        topic_pool = role_topics.get(self.difficulty, self.topics)

        if self.current_topic_index >= len(topic_pool):
            return None

        topic = topic_pool[self.current_topic_index]

        q = self.router.get_question(
            role=self.role,
            topic=topic,
            difficulty=self.difficulty,
            asked_ids=self.asked_ids,
            previous_answer=previous_answer   # 🔥 pass to router
        )

        self.asked_ids.add(q["id"])
        self.current_topic_index += 1

        return q

    def adapt_difficulty(self, score):
        if score > 0.75:
            self.difficulty = "hard"
        elif score > 0.5:
            self.difficulty = "medium"
        else:
            self.difficulty = "easy"