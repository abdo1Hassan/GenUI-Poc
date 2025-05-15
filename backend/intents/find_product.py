# backend/intents/find_product.py
from services.search import fetch_products
from backend.services.gemini import generate_response
from collections import Counter
from fastapi import WebSocket
import logging
import json

logger = logging.getLogger("main")

async def handle_find_product(query: str, intent: str, websocket: WebSocket = None):
    try:
        # Step 1: Decompose the query using Gemini
        decomposition_prompt = (
            "You are an intelligent assistant for a sports e-commerce platform. Your role is to rewrite customer queries to enhance search relevance and accuracy.\n\n"
            "Follow these guidelines based on the query type:\n"
            "1. For simple and focused queries containing just one product or sport, return a single clean sub-query with the main item to search (e.g., 'search a tent' becomes 'tent').\n"
            "2. For complex queries mentioning multiple sports, general contexts, or compound requests, decompose them into up to 3 structured sub-queries as follows:\n"
            "   - Sub-query 1: The general sport or activity (e.g., 'hiking').\n"
            "   - Sub-query 2: A relevant product for that sport (e.g., 'shoes').\n"
            "   - Sub-query 3: Another relevant product for that sport (e.g., 'backpack').\n\n"
            f"Query: {query}\n"
            "Output: Provide 1 to 3 sub-queries, one per line. Do not number them.\n"
        )

        sub_queries_response = generate_response(decomposition_prompt)
        sub_queries = [line.strip() for line in sub_queries_response.split("\n") if line.strip()]

        # Step 2: Search for products for each sub-query
        all_products = []
        for sub_query in sub_queries:
            if websocket:
                await websocket.send_json({"event": "toaster", "message": f"Searching for: {sub_query}"})
            products = fetch_products(sub_query)
            if products:
                all_products.extend(products)

        # Step 3: Rank the top 10 products
        if all_products:
            product_names = [product['title'] for product in all_products]
            product_counts = Counter(product_names)
            top_10_product_titles = [product[0] for product in product_counts.most_common(10)]
            filtered_products = [product for product in all_products if product['title'] in top_10_product_titles]

            # Generate Markdown explanation
            top_products_prompt = (
                f"You are a helpful assistant for a sports e-commerce platform. Below is a JSON list of products and their occurrence counts, retrieved in response to a user query.\n\n"
                f"**Query:** {query}\n\n"
                f"**Products:**\n{json.dumps(product_counts, indent=2)}\n\n"
                "Your task is to analyze the product list and identify the **main product categories** relevant to the given query.\n\n"
                "Please present your output in **Markdown format**, following this structure:\n\n"
                "1. Begin with a **single concise sentence** summarizing the main product categories relevant to the query.\n"
                "2. Under a level 1 heading (`## Main Categories`), list the main categories with a brief explanation of their relevance.\n"
                "3. Under a level 2 heading (`## Recommendation`), highlight **your top category recommendation** and explain why it’s the best choice in 1-2 sentences.\n"
                "4. Ensure the response is **brief, clear, and actionable**. Avoid unnecessary details or repetition.\n"
            )

            top_products_response = generate_response(top_products_prompt)

            return {
                "result": top_products_response.strip(),
                "products": filtered_products,
                "intent": intent,
            }
        else:
            return {
                "result": f"No products found for '{query}'.",
                "products": [],
                "intent": intent,
            }

    except Exception as e:
        logger.error(f"Error in handle_find_product: {e}")
        if websocket:
            await websocket.send_json({"event": "toaster", "message": "An error occurred while processing your request."})
        return {
            "result": "Failed to generate sub-queries due to a backend error.",
            "products": [],
            "intent": intent,
        }
