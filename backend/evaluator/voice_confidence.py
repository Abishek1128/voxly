# import re

# FILLER_WORDS = ["uh", "um", "like", "you know", "actually", "basically"]

# def analyze_voice_confidence(text):
#     text = text.lower()
#     words = text.split()
#     word_count = len(words)

#     filler_count = 0
#     for filler in FILLER_WORDS:
#         filler_count += len(re.findall(rf"\b{filler}\b", text))

#     hesitation_ratio = filler_count / max(word_count, 1)

#     if hesitation_ratio < 0.05:
#         confidence = "High"
#     elif hesitation_ratio < 0.12:
#         confidence = "Medium"
#     else:
#         confidence = "Low"

#     if word_count < 10:
#         hesitation = "Very High"
#     elif word_count < 20:
#         hesitation = "Medium"
#     else:
#         hesitation = "Low"

#     return {
#         "word_count": word_count,
#         "filler_count": filler_count,
#         "confidence": confidence,
#         "hesitation": hesitation
#     }


# backend/evaluator/voice_confidence.py

import re
import math

# ── Signal 1: Filler / hesitation words ──────────────────────────────
FILLER_WORDS = [
    "uh", "um", "uhh", "umm", "erm", "err",
    "like", "you know", "you know what i mean",
    "actually", "basically", "literally", "honestly",
    "kind of", "kinda", "sort of", "sorta",
    "i mean", "i think", "i guess", "i suppose",
    "right", "okay so", "so yeah", "yeah so",
    "stuff", "things", "whatever",
]

# ── Signal 2: Weak / vague language ──────────────────────────────────
WEAK_PHRASES = [
    "maybe", "perhaps", "possibly", "might be", "could be",
    "not sure", "i don't know", "i'm not sure", "hard to say",
    "it depends", "something like that", "and so on", "etc",
    "a lot of", "some kind of", "a bit", "a little",
    "not really", "kind of like",
]

# ── Signal 3: Strong / confident language ────────────────────────────
STRONG_PHRASES = [
    "specifically", "for example", "for instance", "such as",
    "in particular", "to be precise", "the key point",
    "i implemented", "i designed", "i built", "i developed",
    "i led", "i managed", "i optimized", "i reduced", "i improved",
    "the reason is", "this works because", "the benefit is",
    "in my experience", "i have worked with", "i have used",
    "the approach i took", "my solution was", "i achieved",
    "as a result", "consequently", "therefore", "this ensures",
    "we can conclude", "the trade-off is", "the advantage is",
]

# ── Signal 4: Technical / domain markers ─────────────────────────────
TECHNICAL_MARKERS = [
    # general engineering
    "algorithm", "complexity", "architecture", "scalability",
    "performance", "optimization", "design pattern", "trade-off",
    "abstraction", "encapsulation", "modularity", "refactoring",
    # frontend
    "component", "rendering", "virtual dom", "state management",
    "css", "html", "javascript", "react", "vue", "angular",
    "responsive", "accessibility", "bundle", "webpack", "vite",
    # backend
    "api", "rest", "graphql", "endpoint", "middleware",
    "database", "query", "index", "cache", "async", "await",
    "authentication", "authorization", "jwt", "oauth",
    "microservice", "docker", "kubernetes", "ci/cd",
    # data / ml
    "model", "training", "inference", "dataset", "feature",
    "precision", "recall", "overfitting", "gradient",
]

# ── Signal 5: Sentence structure quality ─────────────────────────────
def _sentence_quality(text: str) -> float:
    """
    Score 0–1 based on:
    - Average sentence length (too short = underdeveloped, too long = rambling)
    - Sentence variety (not all the same length)
    - Presence of subordinate clauses (because, which, that, when, while...)
    """
    sentences = re.split(r'[.!?]+', text.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 3]

    if not sentences:
        return 0.0

    lengths = [len(s.split()) for s in sentences]
    avg_len = sum(lengths) / len(lengths)

    # ideal sentence length 12–25 words
    if 12 <= avg_len <= 25:
        len_score = 1.0
    elif 8 <= avg_len < 12 or 25 < avg_len <= 35:
        len_score = 0.7
    elif 5 <= avg_len < 8 or 35 < avg_len <= 50:
        len_score = 0.4
    else:
        len_score = 0.2

    # sentence variety (std dev of lengths)
    if len(lengths) > 1:
        mean = avg_len
        variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
        std = math.sqrt(variance)
        variety_score = min(std / 8, 1.0)   # std of 8+ words = good variety
    else:
        variety_score = 0.3

    # subordinate clause markers (shows complex reasoning)
    clause_markers = ["because", "which", "that", "when", "while", "although",
                      "however", "therefore", "since", "unless", "whereas",
                      "consequently", "furthermore", "moreover", "additionally"]
    text_lower = text.lower()
    clause_count = sum(1 for m in clause_markers if f" {m} " in f" {text_lower} ")
    clause_score = min(clause_count / max(len(sentences), 1), 1.0)

    return (len_score * 0.4 + variety_score * 0.3 + clause_score * 0.3)


# ── Signal 6: Vocabulary richness (Type-Token Ratio) ─────────────────
def _vocabulary_richness(words: list) -> float:
    if not words:
        return 0.0
    # use root TTR to reduce length bias
    unique = len(set(words))
    ttr = unique / math.sqrt(len(words))
    # typical good range: 6–10
    return min(ttr / 8.0, 1.0)


# ── Signal 7: Answer completeness ────────────────────────────────────
def _completeness_score(word_count: int) -> float:
    """Rewards substantive answers; penalises very short or padded ones."""
    if word_count >= 120:   return 1.0
    if word_count >= 80:    return 0.85
    if word_count >= 50:    return 0.70
    if word_count >= 30:    return 0.50
    if word_count >= 15:    return 0.30
    return 0.10


# ══════════════════════════════════════════════════════════════════════
# Main function
# ══════════════════════════════════════════════════════════════════════
def analyze_voice_confidence(text: str) -> dict:
    if not text or not text.strip():
        return {
            "word_count":   0,
            "filler_count": 0,
            "confidence":   "Low",
            "hesitation":   "Very High",
            "score":        0.0,
            "breakdown":    {},
        }

    text_lower = text.lower()
    words      = re.findall(r"\b\w+\b", text_lower)
    word_count = len(words)

    # ── S1: Filler penalty ────────────────────────────────────────────
    filler_count = 0
    for filler in FILLER_WORDS:
        filler_count += len(re.findall(rf"\b{re.escape(filler)}\b", text_lower))
    filler_ratio  = filler_count / max(word_count, 1)
    filler_score  = max(0.0, 1.0 - filler_ratio * 6)          # 0.17 ratio → 0

    # ── S2: Weak language penalty ─────────────────────────────────────
    weak_count   = sum(1 for p in WEAK_PHRASES if p in text_lower)
    weak_ratio   = weak_count / max(word_count / 10, 1)        # per 10 words
    weak_score   = max(0.0, 1.0 - weak_ratio * 0.25)

    # ── S3: Strong language bonus ─────────────────────────────────────
    strong_count = sum(1 for p in STRONG_PHRASES if p in text_lower)
    strong_score = min(strong_count / 4, 1.0)                  # 4+ phrases = full marks

    # ── S4: Technical depth ───────────────────────────────────────────
    tech_count   = sum(1 for t in TECHNICAL_MARKERS if t in text_lower)
    tech_score   = min(tech_count / 5, 1.0)                    # 5+ markers = full marks

    # ── S5: Sentence quality ──────────────────────────────────────────
    sent_score   = _sentence_quality(text)

    # ── S6: Vocabulary richness ───────────────────────────────────────
    vocab_score  = _vocabulary_richness(words)

    # ── S7: Completeness ─────────────────────────────────────────────
    comp_score   = _completeness_score(word_count)

    # ── Weighted composite (weights sum to 1.0) ───────────────────────
    weights = {
        "filler":       0.18,
        "weak":         0.10,
        "strong":       0.15,
        "technical":    0.15,
        "sentence":     0.17,
        "vocabulary":   0.13,
        "completeness": 0.12,
    }

    composite = (
        filler_score  * weights["filler"]       +
        weak_score    * weights["weak"]         +
        strong_score  * weights["strong"]       +
        tech_score    * weights["technical"]    +
        sent_score    * weights["sentence"]     +
        vocab_score   * weights["vocabulary"]   +
        comp_score    * weights["completeness"]
    )

    composite = round(min(max(composite, 0.0), 1.0), 3)

    # ── Labels ───────────────────────────────────────────────────────
    if composite >= 0.75:
        confidence = "High"
        hesitation = "Low"
    elif composite >= 0.50:
        confidence = "Medium"
        hesitation = "Medium"
    elif composite >= 0.30:
        confidence = "Low"
        hesitation = "High"
    else:
        confidence = "Low"
        hesitation = "Very High"

    return {
        "word_count":   word_count,
        "filler_count": filler_count,
        "confidence":   confidence,
        "hesitation":   hesitation,
        "score":        composite,          # 0–1 numeric for storage / sorting
        "breakdown": {
            "filler_score":       round(filler_score,  3),
            "weak_score":         round(weak_score,    3),
            "strong_score":       round(strong_score,  3),
            "technical_score":    round(tech_score,    3),
            "sentence_score":     round(sent_score,    3),
            "vocabulary_score":   round(vocab_score,   3),
            "completeness_score": round(comp_score,    3),
        },
    }