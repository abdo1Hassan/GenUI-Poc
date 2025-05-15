# backend/intents/intent_router.py
from backend.services.gemini import detect_intent
from backend.intents.find_product import handle_find_product
from backend.intents.chitchat import handle_chitchat
from backend.intents.compare import handle_compare
from backend.intents.reassure import handle_reassure

async def route_intent(query: str, products=None):
    intent = detect_intent(query)
    if intent == "find_product":
        return await handle_find_product(query, intent)
    elif intent == "compare":
        return await handle_compare(query, intent, products)
    elif intent == "reassure":
        return await handle_reassure(query, intent)
    else:
        return await handle_chitchat(query, intent)