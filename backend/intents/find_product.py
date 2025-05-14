# backend/intents/find_product.py
"""
Handles product discovery queries using the internal search API.
"""

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