# backend/intents/chitchat.py
from backend.services.gemini import generate_response

async def handle_chitchat(query: str, intent: str):
    answer = generate_response(query)
    return {"result": answer, "products": [], "intent": intent}
