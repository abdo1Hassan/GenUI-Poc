from fastapi import APIRouter, Request
import requests
import logging
from vertexai.generative_models import GenerativeModel
from ..services.intent import detect_intent
from ..services.products import extract_products_from_response
from ..services.gemini import generate_gemini_response


logger = logging.getLogger("main")
router = APIRouter()

SEARCH_API_URL = "http://10.60.21.248:8000/search"
model = GenerativeModel("gemini-2.0-flash-001")

@router.post("/chat")
async def chat_handler(request: Request):
    body = await request.json()
    query = body.get("query", "").lower()
    logger.info(f"📩 Incoming query: {query}")

    intent = detect_intent(query)

    if intent != "find_product":
        try:
            response = model.generate_content(
                f"You are a helpful assistant. Respond conversationally to: {query}"
            )
            answer = response.text.strip()
        except Exception as e:
            logger.error(f"❌ Gemini generation failed: {e}")
            answer = "Sorry, I'm having trouble responding right now."

        return {"result": answer, "products": [], "intent": intent}

    try:
        response = requests.post(
            SEARCH_API_URL,
            headers={"Content-Type": "application/json"},
            json={"query": query},
            timeout=10
        )
        response.raise_for_status()
        search_data = response.json()
        products = extract_products_from_response(search_data)

        return {
            "result": f"Found {len(products)} products for '{query}'.",
            "products": products,
            "intent": intent,
        }
    except requests.RequestException as e:
        logger.error(f"❌ Search failed: {e}")
        return {
            "result": "Search failed due to a backend error.",
            "products": [],
            "intent": intent,
        }