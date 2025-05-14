# backend/services/gemini.py
from vertexai.generative_models import GenerativeModel
import logging

logger = logging.getLogger("main")

model = GenerativeModel("gemini-2.0-flash-001")

def generate_gemini_response(query: str) -> str:
    try:
        response = model.generate_content(
            f"You are a helpful assistant. Respond conversationally to: {query}"
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"❌ Gemini generation failed: {e}")
        return "Sorry, I'm having trouble responding right now."
