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

def generate_response(query: str, products=None) -> str:
    try:
        if products:
            prompt = (
                "You are a helpful sports retailer e-commerce assistant. "
                "Stay on topic, introduce yourself when needed.\n"
                f"User query: {query}\n"
                f"Products (JSON): {products}\n"
                "Compare the products in detail. For each product, show all available fields (such as title, brand, price, image, url, nature, etc) in a markdown table, with one row per field and one column per product. After the table, provide a short comparison message and a small recommendation."
            )
            logger.info(f"🔍 Comparison prompt: {prompt}")
        else:
            prompt = (
                "You are a helpful sports retailer ecom assistant, stay on topic, introduce yourself when needed. Respond to: "
                f"{query}"
            )
        response = model.generate_content(prompt)
        logger.info(f"✨ Raw Gemini response: {response.text}")
        return response.text.strip()
    except Exception as e:
        logger.error(f"❌ Gemini response failed: {e}")
        return "Sorry, I'm having trouble responding."
