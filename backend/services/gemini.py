# backend/services/gemini.py
from vertexai.generative_models import GenerativeModel
import logging

logger = logging.getLogger("main")
model = GenerativeModel("gemini-2.0-flash-001")

examples = [
    {"query": "hi", "intent": "chitchat"},
    {"query": "buy shoes", "intent": "find_product"},
    {"query": "compare backpacks", "intent": "compare"},
    {"query": "return policy", "intent": "reassure"},
]

def detect_intent(query: str) -> str:
    prompt = """
Classify the intent of the user's query:
- find_product
- compare
- reassure
- chitchat

Respond with one intent label only.
"""
    for ex in examples:
        prompt += f"User: {ex['query']}\nIntent: {ex['intent']}\n"
    prompt += f"User: {query}\nIntent:"

    logger.info(f"🔍 Gemini intent detection for query: {query}")
    try:
        response = model.generate_content(prompt)
        intent = response.text.strip().lower()
        logger.info(f"🎯 Detected intent: {intent}")
        return intent
    except Exception as e:
        logger.error(f"❌ Gemini intent detection failed: {e}")
        return "chitchat"

def generate_response(query: str) -> str:
    try:
        response = model.generate_content(
            f"You are a helpful assistant. Respond to: {query}"
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"❌ Gemini response failed: {e}")
        return "Sorry, I'm having trouble responding."
