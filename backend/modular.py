# backend/main.py
"""
Entry point for the FastAPI app.
Mounts the chat route and configures middleware.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat import router as chat_router

app = FastAPI()

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(chat_router)

# backend/routes/chat.py
"""
Chat route handling all user queries.
Detects intent, routes to appropriate intent handler.
"""

from fastapi import APIRouter, Request
from intents.intent_router import route_intent
import logging

logger = logging.getLogger("main")

router = APIRouter()

@router.post("/chat")
async def chat_handler(request: Request):
    body = await request.json()
    query = body.get("query", "").lower()
    logger.info(f"📩 Incoming query: {query}")
    return await route_intent(query)

# backend/intents/intent_router.py
"""
Routes query to appropriate intent handler using Gemini intent classification.
"""

from services.gemini import detect_intent
from intents.find_product import handle_find_product
from intents.chitchat import handle_chitchat
from intents.compare import handle_compare
from intents.reassure import handle_reassure

async def route_intent(query: str):
    intent = detect_intent(query)

    if intent == "find_product":
        return await handle_find_product(query, intent)
    elif intent == "compare":
        return await handle_compare(query, intent)
    elif intent == "reassure":
        return await handle_reassure(query, intent)
    else:
        return await handle_chitchat(query, intent)

# backend/intents/chitchat.py
"""
Handles small talk or open-ended queries using Gemini.
"""

from services.gemini import generate_response

async def handle_chitchat(query: str, intent: str):
    answer = generate_response(query)
    return {"result": answer, "products": [], "intent": intent}

# backend/intents/find_product.py
"""
Handles product discovery queries using the internal search API.
"""

from services.search import fetch_products

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

# backend/intents/compare.py
"""
Handles comparison queries (stub for future logic).
"""

from services.gemini import generate_response

async def handle_compare(query: str, intent: str):
    response = generate_response(query)
    return {"result": response, "products": [], "intent": intent}

# backend/intents/reassure.py
"""
Handles reassurance/FAQ-style queries (stub for future FAQ integration).
"""

from services.gemini import generate_response

async def handle_reassure(query: str, intent: str):
    response = generate_response(query)
    return {"result": response, "products": [], "intent": intent}

# backend/services/gemini.py
"""
Provides Gemini model interaction and intent classification.
"""

from vertexai.generative_models import GenerativeModel
import logging

logger = logging.getLogger("main")

model = GenerativeModel("gemini-2.0-flash-001")

examples = [
    {"query": "hi", "intent": "chitchat"},
    {"query": "i want to buy shoes", "intent": "find_product"},
    {"query": "compare hiking tents", "intent": "compare"},
    {"query": "can I return this?", "intent": "reassure"},
]

def detect_intent(query: str) -> str:
    """Use Gemini to classify user query into one of 4 intents."""
    prompt = """
Classify the intent of the user's query into one of:
- find_product
- compare
- reassure
- chitchat

Respond only with the intent.

Examples:
"""
    for ex in examples:
        prompt += f"User: {ex['query']}\nIntent: {ex['intent']}\n"
    prompt += f"User: {query}\nIntent:"

    logger.info(f"🔍 Gemini intent detection for query: {query}")
    try:
        response = model.generate_content(prompt)
        intent = response.text.strip().lower()
        logger.info(f"🎯 Detected intent: {intent}")
        return intent
    except Exception as e:
        logger.error(f"❌ Gemini intent detection failed: {e}")
        return "chitchat"

def generate_response(query: str) -> str:
    """Get natural language response from Gemini."""
    try:
        response = model.generate_content(
            f"You are a helpful assistant. Respond conversationally to: {query}"
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"❌ Gemini response failed: {e}")
        return "Sorry, I'm having trouble responding."

# backend/services/search.py
"""
Handles querying the product search API and parsing responses.
"""

import requests

SEARCH_API_URL = "http://10.60.21.248:8000/search"

def fetch_products(query: str, max_items: int = 10) -> list:
    """Query product API and return parsed product objects."""
    response = requests.post(
        SEARCH_API_URL,
        headers={"Content-Type": "application/json"},
        json={"query": query},
        timeout=10
    )
    response.raise_for_status()
    search_data = response.json()

    items = search_data.get("data", {}).get("blocks", {}).get("items", [])
    products = []

    for product in items:
        models = product.get("models", [])
        brand = product.get("brand", {}).get("label", "")
        nature = product.get("natureLabel", "")
        fallback_url = product.get("url", "")
        fallback_title = product.get("webLabel", "")

        for model in models:
            title = model.get("webLabel") or fallback_title or "Untitled"
            image = model.get("image", {}).get("url", "")
            price = model.get("price", "")
            url = model.get("url", fallback_url)
            sizes = model.get("availableSizes", [])

            products.append({
                "title": title,
                "price": price,
                "image": image,
                "url": url,
                "brand": brand,
                "nature": nature,
                "capacity": sizes,
            })

            if len(products) >= max_items:
                return products

    return products
