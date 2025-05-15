# backend/intents/compare.py
from backend.services.gemini import generate_response
from backend.services.products import extract_products_from_response
import logging
import json

logger = logging.getLogger("main")

async def handle_compare(query: str, intent: str, products=None):
    logger.info(f"📦 Processing comparison request")
    logger.info(f"Query: {query}")
    logger.info(f"Products: {products}")

    if not products:
        return {"result": "Please provide products to compare", "intent": intent}

    # Process product details
    product_details = [extract_products_from_response(product) for product in products]
    
    # Generate enhanced comparison prompt
    comparison_prompt = (
        "You are a helpful sports retail assistant specialized in product comparisons. Your goal is to provide "
        "a detailed, structured comparison focusing on what matters most to sports enthusiasts.\n\n"
        f"**User Query:** {query}\n\n"
        "**Products to Compare:**\n"
        f"{product_details}\n\n"
        "**Comparison Criteria:**\n"
        "- Core Features: Technical specifications, materials, performance aspects\n"
        "- Usage Context: Intended activities, skill levels, environments\n"
        "- Value Proposition: Price-to-feature ratio, durability, brand reputation\n"
        "- User Benefits: Comfort, performance enhancement, convenience\n\n"
        "**Instructions:**\n"
        "1. Create a comprehensive comparison table with key attributes\n"
        "2. Analyze the main differences and their practical implications\n"
        "3. Provide specific recommendations for different user types/needs\n"
        "4. Consider experience levels (beginner/intermediate/advanced)\n"
        "5. Maintain objectivity and support claims with product features\n\n"
        "Return the response in this exact JSON structure:\n"
        "{\n"
        '  "table": "| Feature | Product 1 | Product 2 |\\n|---|---|---|\\n|Price|...|...|",\n'
        '  "comparison": "Analysis of key differences with practical implications...",\n'
        '  "recommendation": "Specific recommendations based on user types and needs..."\n'
        "}\n"
    )
    
    try:
        response = generate_response(comparison_prompt, products)
        logger.info(f"💡 Raw comparison response from Gemini: {response}")

        # Ensure response is valid JSON
        structured_response = json.loads(response)
        
        # Validate required fields
        required_fields = ["table", "comparison", "recommendation"]
        missing_fields = [field for field in required_fields if not structured_response.get(field)]
        
        if missing_fields:
            logger.warning(f"Missing required fields in response: {missing_fields}")
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

        return {
            "result": structured_response,
            "products": products or [],
            "intent": intent,
            "structured": True
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}")
        logger.error(f"Problematic response: {response}")
        return {
            "result": {
                "table": "Sorry, I couldn't generate a proper comparison table.",
                "comparison": f"Error parsing the comparison response: {str(e)}",
                "recommendation": "Please try again with your comparison request."
            },
            "products": products or [],
            "intent": intent,
            "structured": True
        }
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return {
            "result": {
                "table": "The comparison response was incomplete.",
                "comparison": str(e),
                "recommendation": "Please try again with your comparison request."
            },
            "products": products or [],
            "intent": intent,
            "structured": True
        }
    except Exception as e:
        logger.error(f"Unexpected error in comparison handler: {e}")
        return {
            "result": {
                "table": "An unexpected error occurred.",
                "comparison": f"Error: {str(e)}",
                "recommendation": "Please try again or contact support if the issue persists."
            },
            "products": products or [],
            "intent": intent,
            "structured": True
        }
