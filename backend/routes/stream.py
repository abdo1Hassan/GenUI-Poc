from fastapi.responses import StreamingResponse
from backend.services.gemini import generate_stream_response
import json
import asyncio
import logging

logger = logging.getLogger("main")

async def generate_comparison_stream(query: str, products=None):
    try:
        async for chunk in generate_stream_response(query, products):
            if chunk:  # chunk is now the text directly
                yield f"data: {json.dumps({'content': chunk})}\n\n"
    except Exception as e:
        logger.error(f"Error in stream: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
    finally:
        yield "data: [DONE]\n\n"

async def stream_handler(request):
    body = await request.json()
    query = body.get("query", "").lower()
    products = body.get("products", [])
    
    return StreamingResponse(
        generate_comparison_stream(query, products),
        media_type="text/event-stream"
    )
