# backend/services/gemini.py
from vertexai.generative_models import GenerativeModel
import logging
import json
import asyncio

logger = logging.getLogger("main")
model = GenerativeModel("gemini-2.0-flash-001")

examples = [
    {"query": "hi", "intent": "chitchat"},
    {"query": "buy shoes", "intent": "find_product"},
    {"query": "compare backpacks", "intent": "compare"},
    {"query": "return policy", "intent": "reassure"},
]

def detect_intent(query: str) -> str:
    prompt = """
Classify the intent of the user's query:
- find_product
- compare
- reassure
- chitchat

Respond with one intent label only.
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

def generate_response(query: str, products=None) -> str:
    try:
        if products:
            prompt = (
                "You are a helpful sports retailer e-commerce assistant. "
                "Stay on topic and be concise.\n"
                f"User query: {query}\n"
                f"Products (JSON): {products}\n"
                "Compare the products and return a response in strict JSON format with these exact fields:\n"
                "- table: A markdown table comparing products\n"
                "- comparison: A brief text comparing key differences\n"
                "- recommendation: A clear recommendation\n"
                "\nYour response must be parseable JSON. Do not include markdown code blocks or any text outside the JSON structure.\n"
                "Example format:\n"
                '{\n'
                '  "table": "| Feature | Product A | Product B |\\n|---|---|---|\\n|...",\n'
                '  "comparison": "Product A is...",\n'
                '  "recommendation": "Choose Product A if..."\n'
                '}'
            )
            logger.info(f"🔍 Comparison prompt: {prompt}")
            
            # Get the raw response
            response = model.generate_content(prompt)
            text = response.text.strip()
            logger.info(f"✨ Raw Gemini response: {text}")
            
            # Remove any markdown code block syntax if present
            text = text.replace("```json", "").replace("```", "").strip()
            
            try:
                # Validate JSON by parsing and re-stringifying
                parsed = json.loads(text)
                return json.dumps(parsed)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON: {e}")
                # If not valid JSON, return a structured error response
                return json.dumps({
                    "table": "Error: Could not generate comparison",
                    "comparison": f"Error parsing response: {str(e)}",
                    "recommendation": "Please try again"
                })
        else:
            prompt = (
                "You are a helpful sports retailer ecom assistant, stay on topic, introduce yourself only when needed. Respond to: "
                f"{query}"
            )
            response = model.generate_content(prompt)
            return response.text.strip()
            
    except Exception as e:
        logger.error(f"❌ Gemini response generation failed: {e}")
        return json.dumps({
            "table": "Error: Failed to generate comparison",
            "comparison": f"Error: {str(e)}",
            "recommendation": "Please try again"
        })

async def generate_stream_response(query: str, products=None):
    try:
        if products:
            prompt = (
                "You are a helpful sports retailer e-commerce assistant. "
                "Stay on topic and be concise.\n"
                f"User query: {query}\n"
                f"Products (JSON): {products}\n"
                "Compare the products and provide a response with these sections:\n"
                "1. A markdown comparison table\n"
                "2. Key differences summary\n"
                "3. Clear recommendation\n"
                "\nStart each section with these exact tags:\n"
                "[TABLE]\n"
                "[COMPARISON]\n"
                "[RECOMMENDATION]\n"
                "\nExample format:\n"
                "[TABLE]\n| Feature | Product A | Product B |\n|---|---|---|\n"
                "[COMPARISON]\nProduct A is...\n"
                "[RECOMMENDATION]\nChoose Product A if..."
            )
            
            logger.info(f"🔍 Streaming comparison prompt: {prompt}")
            
            response = model.generate_content(prompt, stream=True)
            async for chunk in response:
                if hasattr(chunk, 'text') and chunk.text:
                    yield chunk.text

        else:
            prompt = (
                "You are a helpful sports retailer ecom assistant. Respond to: "
                f"{query}"
            )
            response = model.generate_content(prompt, stream=True)
            async for chunk in response:
                if hasattr(chunk, 'text') and chunk.text:
                    yield chunk.text
            
    except Exception as e:
        logger.error(f"❌ Gemini streaming response failed: {e}")
        yield "[ERROR] Failed to generate streaming response"
