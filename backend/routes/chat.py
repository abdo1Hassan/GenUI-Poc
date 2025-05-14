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
