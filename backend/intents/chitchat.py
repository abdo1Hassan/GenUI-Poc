# backend/intents/chitchat.py
from backend.services.gemini import generate_response

async def handle_chitchat(query: str, intent: str):
    answer = generate_response(query)
    return {"result": answer, "products": [], "intent": intent}

# backend/intents/find_product.py
from backend.services.search import fetch_products

async def handle_find_product(query: str, intent: str):
    try:
        products = fetch_products(query)
        return {
            "result": f"Found {len(products)} products for '{query}'.",
            "products": products,
            "intent": intent,
        }
    except Exception:
        return {
            "result": "Search failed due to a backend error.",
            "products": [],
            "intent": intent,
        }