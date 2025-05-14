# backend/services/search.py
import requests

SEARCH_API_URL = "http://10.60.21.248:8000/search"

def fetch_products(query: str, max_items: int = 10) -> list:
    response = requests.post(
        SEARCH_API_URL,
        headers={"Content-Type": "application/json"},
        json={"query": query},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json().get("data", {}).get("blocks", {}).get("items", [])

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

            results.append({
                "title": title,
                "price": price,
                "image": image,
                "url": url,
                "brand": brand,
                "nature": nature,
                "capacity": sizes,
            })

            if len(results) >= max_items:
                return results
    return results