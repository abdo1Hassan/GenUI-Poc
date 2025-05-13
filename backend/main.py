from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from vertexai.generative_models import GenerativeModel
import requests
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SEARCH_API_URL = "http://10.60.21.248:8000/search"

examples = [
    {"query": "hi", "intent": "chitchat"},
    {"query": "hello", "intent": "chitchat"},
    {"query": "i want to buy shoes", "intent": "find_product"},
    {"query": "show me backpacks", "intent": "find_product"},
    {"query": "compare the hiking tents", "intent": "compare"},
    {"query": "can I return this product?", "intent": "reassure"},
]

model = GenerativeModel("gemini-2.0-flash-001")

def detect_intent(query: str) -> str:
    prompt = """
Classify the intent of the user's query into one of the following categories:
- find_product
- compare
- reassure
- chitchat

Respond with only the intent label.

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

def extract_products_from_response(search_response: dict, max_items: int = 10) -> list:
    items = search_response.get("data", {}).get("blocks", {}).get("items", [])
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

@app.post("/chat")
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