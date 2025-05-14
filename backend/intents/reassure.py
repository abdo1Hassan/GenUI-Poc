# backend/intents/reassure.py
"""
Handles reassurance/FAQ-style queries (stub for future FAQ integration).
"""

from backend.services.gemini import generate_response

async def handle_reassure(query: str, intent: str):
    response = generate_response(query)
    return {"result": response, "products": [], "intent": intent}
