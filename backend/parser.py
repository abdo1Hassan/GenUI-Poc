from fastapi import FastAPI, UploadFile
from bs4 import BeautifulSoup
from typing import Dict, Any
import json

app = FastAPI()

@app.post("/parse")
async def parse_html(file: UploadFile) -> Dict[str, Any]:
    contents = await file.read()
    soup = BeautifulSoup(contents, "lxml")

    result = {
        "title": None,
        "price": None,
        "images": [],
        "description": None,
        "features": [],
        "care_instructions": [],
        "technical_info": {},
        "environmental_impact": None,
        "raw_text": soup.get_text(separator="\n", strip=True)
    }

    # 1. Title
    title_tag = soup.find("h1")
    if title_tag:
        result["title"] = title_tag.get_text(strip=True)

    # 2. Images
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src")
        if src and "mediadecathlon.com" in src:
            result["images"].append(src)

    # 3. Description
    meta_desc = soup.find("meta", {"name": "description"})
    if meta_desc:
        result["description"] = meta_desc.get("content")

    # 4. Features & Care Instructions (by class or bullet list)
    for ul in soup.find_all("ul"):
        items = [li.get_text(strip=True) for li in ul.find_all("li")]
        if "Dry after" in " ".join(items) or "wash" in " ".join(items).lower():
            result["care_instructions"] = items
        elif len(items) > 2 and not result["features"]:
            result["features"] = items

    # 5. JSON-LD (Structured data)
    for script in soup.find_all("script", {"type": "application/ld+json"}):
        try:
            ld = json.loads(script.string)
            if isinstance(ld, dict) and ld.get("@type") == "Product":
                result["technical_info"] = ld
                result["price"] = ld.get("offers", {}).get("price")
                break
        except Exception:
            continue

    # 6. Environmental impact
    for div in soup.find_all("div"):
        if "life cycle" in div.get_text().lower():
            result["environmental_impact"] = div.get_text(strip=True)
            break

    return result
