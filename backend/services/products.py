# backend/services/products.py
def extract_products_from_response(search_response: dict, max_items: int = 10, include_metadata: bool = False) -> list | tuple:
    """
    Extracts product list from the nested search response.
    Optionally includes metadata from llm_output for enhanced query insights.
    """
    items = search_response.get("data", {}).get("blocks", {}).get("items", [])
    products = []
    metadata = search_response.get("stats", {}).get("llm_output", {}) if include_metadata else {}

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
                return (products, metadata) if include_metadata else products

    return (products, metadata) if include_metadata else products
