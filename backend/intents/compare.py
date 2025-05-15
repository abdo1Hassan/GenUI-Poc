# backend/intents/compare.py
from backend.services.gemini import generate_response
import logging

logger = logging.getLogger("main")
async def handle_compare(query: str, intent: str, products=None):
    logger.info(f"📦 Processing comparison request")
    logger.info(f"Query: {query}")
    logger.info(f"Products: {products}")
    
    response = generate_response(query, products)
    logger.info(f"💡 Final comparison response: {response}")

    return {"result": response, "products": products or [], "intent": intent}
