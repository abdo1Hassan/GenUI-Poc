# backend/intents/compare.py
from backend.services.gemini import generate_response

async def handle_compare(query: str, intent: str):
    response = generate_response(query)
    return {"result": response, "products": [], "intent": intent}

# backend/intents/reassure.py
from backend.services.gemini import generate_response

async def handle_reassure(query: str, intent: str):
    response = generate_response(query)
    return {"result": response, "products": [], "intent": intent}
