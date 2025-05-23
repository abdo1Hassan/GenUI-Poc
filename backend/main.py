# backend/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.chat import router as chat_router
from backend.routes.stream import stream_handler
import logging

# Set up root logger to print to stdout
logging.basicConfig(
    level=logging.INFO,  # Or DEBUG for more verbosity
    format="%(levelname)s:%(name)s:%(message)s"
)

app = FastAPI()
logger = logging.getLogger(__name__)
logger.info("🚀 FastAPI backend started.")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

@app.post("/stream")
async def handle_stream(request: Request):
    return await stream_handler(request)

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