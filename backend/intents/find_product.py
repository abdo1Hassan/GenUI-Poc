# backend/intents/find_product.py
from services.search import fetch_products
import logging

logger = logging.getLogger("main")

async def handle_find_product(query: str, intent: str):
    try:
        products, metadata = fetch_products(query, return_metadata=True)
        logger.info(f"📦 Returning {len(products)} products with metadata")

        return {
            "result": f"Found {len(products)} products for '{query}'.",
            "products": products,
            "metadata": metadata,
            "intent": intent,
        }
    except Exception as e:
        logger.error(f"❌ Product fetch failed: {e}")
        return {
            "result": "Search failed due to a backend error.",
            "products": [],
            "metadata": {},
            "intent": intent,
        }
