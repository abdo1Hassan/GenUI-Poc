# backend/services/search.py
import requests
import logging
logger = logging.getLogger(__name__)


SEARCH_API_URL = "http://10.60.21.248:8000/search"

def fetch_products(query: str, max_items: int = 10, return_metadata: bool = False) -> list | tuple:
    """
    Queries the Decathlon Search API and returns a list of products.
    Optionally includes llm_output metadata when return_metadata is True.
    Logs both product results and metadata.
    """
    try:
        logger.info(f"🔍 Sending request to Search API: {SEARCH_API_URL}")
        logger.info(f"📤 Request payload: {{'query': '{query}'}}")

        response = requests.post(
            SEARCH_API_URL,
            headers={"Content-Type": "application/json"},
            json={"query": query},
            timeout=10,
        )
        response.raise_for_status()
        response_json = response.json()

        logger.info(f"📥 Raw response from API: {response_json}")

        data = response_json.get("data", {}).get("blocks", {}).get("items", [])
        metadata = response_json.get("stats", {}).get("llm_output", {}) if return_metadata else {}

        logger.info(f"🛍️ Found {len(data)} raw product blocks from API for query: '{query}'")
        if metadata:
            logger.info(f"📊 Metadata extracted: {metadata}")

        results = []
        for item in data:
            models = item.get("models", [])
            brand = item.get("brand", {}).get("label", "")
            nature = item.get("natureLabel", "")
            fallback_url = item.get("url", "")
            fallback_title = item.get("webLabel", "")

            for model in models:
                title = model.get("webLabel") or fallback_title or "Untitled"
                image = model.get("image", {}).get("url", "")
                price = model.get("price", "")
                url = model.get("url", fallback_url)
                sizes = model.get("availableSizes", [])

                product = {
                    "title": title,
                    "price": price,
                    "image": image,
                    "url": url,
                    "brand": brand,
                    "nature": nature,
                    "capacity": sizes,
                }
                logger.info(f"🧾 Parsed product: {product}")
                results.append(product)

                if len(results) >= max_items:
                    return (results, metadata) if return_metadata else results

        return (results, metadata) if return_metadata else results

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request to Search API failed: {e}")
        return ([], {}) if return_metadata else []

    except Exception as e:
        logger.error(f"❌ Unexpected error in fetch_products: {e}")
        return ([], {}) if return_metadata else []
