# backend/services/intent.py
from vertexai.generative_models import GenerativeModel
import logging

logger = logging.getLogger("main")

examples = [
    {"query": "hi", "intent": "chitchat"},
    {"query": "hello", "intent": "chitchat"},
    {"query": "i want to buy shoes", "intent": "find_product"},
    {"query": "show me backpacks", "intent": "find_product"},
    {"query": "compare the hiking tents", "intent": "compare"},
    {"query": "can I return this product?", "intent": "reassure"},
]

model = GenerativeModel("gemini-2.0-flash-001")

def detect_intent(query: str) -> str:
    prompt = """
Classify the intent of the user's query into one of the following categories:
- find_product
- compare
- reassure
- chitchat

Respond with only the intent label.

Examples:
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
