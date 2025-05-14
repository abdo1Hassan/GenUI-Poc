# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.chat import router as chat_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

# backend/routes/chat.py
from fastapi import APIRouter, Request
from backend.intents.intent_router import route_intent
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
from backend.services.gemini import detect_intent
from backend.intents.find_product import handle_find_product
from backend.intents.chitchat import handle_chitchat
from backend.intents.compare import handle_compare
from backend.intents.reassure import handle_reassure

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