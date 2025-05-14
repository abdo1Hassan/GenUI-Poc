import asyncio
import json
import argparse
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright


async def scrape_decathlon_product(url: str, headful=False) -> dict:
    data = {
        "name": None,
        "brand": None,
        "price": None,
        "category": None,
        "description": None,
        "features": [],
        "specifications": {},
        "care_instructions": [],
        "reviews": {
            "total": 0,
            "average_rating": None,
            "full_reviews": []
        },
        "environmental_impact": {}
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=not headful, slow_mo=50 if headful else 0)

        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/116.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )

        page = await context.new_page()
        await page.goto(url, timeout=60000)

        # Handle cookie popup
        try:
            await page.locator("button:has-text('Agree All')").click(timeout=5000)
        except:
            try:
                await page.locator("text=Continue without agreeing").click(timeout=5000)
            except:
                pass

        # Simulate scroll to load content
        await page.mouse.wheel(0, 500)
        await page.wait_for_timeout(1000)
        await page.mouse.wheel(0, 1000)
        await page.wait_for_timeout(2000)

        # Attempt to load more reviews
        while True:
            try:
                await page.locator("button:has-text('Show more reviews')").click(timeout=2000)
                await page.wait_for_timeout(1000)
            except:
                break

        content = await page.content()
        soup = BeautifulSoup(content, "html.parser")

        # JSON-LD parsing
        json_ld = soup.find("script", {"type": "application/ld+json"})
        if json_ld:
            try:
                parsed = json.loads(json_ld.string)
                product_json = {}

                if "@graph" in parsed:
                    for node in parsed["@graph"]:
                        if node.get("@type") == "Product":
                            product_json = node
                            break
                elif isinstance(parsed, list):
                    product_json = next((item for item in parsed if item.get("@type") == "Product"), {})
                else:
                    product_json = parsed

                data["name"] = product_json.get("name")
                data["brand"] = product_json.get("brand", {}).get("name")
                data["description"] = product_json.get("description")
                offer = product_json.get("offers", {})
                data["price"] = offer.get("price")

            except Exception as e:
                print(f"JSON-LD parsing failed: {e}")

        # Fallbacks
        if not data["name"]:
            h1 = soup.find("h1")
            if h1:
                data["name"] = h1.get_text(strip=True)

        desc_el = soup.find("div", attrs={"data-testid": "product-description"})
        if desc_el and not data["description"]:
            data["description"] = desc_el.get_text(strip=True)

        price_el = soup.find("span", attrs={"data-testid": "price-final"})
        if price_el and not data["price"]:
            data["price"] = price_el.get_text(strip=True)

        breadcrumbs = soup.select("nav[aria-label='breadcrumb'] li span")
        if breadcrumbs:
            data["category"] = " > ".join([b.text.strip() for b in breadcrumbs])

        # Features
        feature_items = soup.select("[data-testid='product-advantage'] li")
        if feature_items:
            data["features"] = [li.get_text(strip=True) for li in feature_items]

        # Specifications
        tech_block = soup.find("div", {"data-testid": "technical-information"})
        if tech_block:
            dts = tech_block.find_all("dt")
            dds = tech_block.find_all("dd")
            if len(dts) == len(dds):
                data["specifications"] = {
                    dt.get_text(strip=True): dd.get_text(strip=True)
                    for dt, dd in zip(dts, dds)
                }

        # Care Instructions
        care_section = soup.find(string=lambda x: x and "care instructions" in x.lower())
        if care_section:
            ul = care_section.find_next("ul")
            if ul:
                data["care_instructions"] = [li.get_text(strip=True) for li in ul.find_all("li")]
            else:
                block = care_section.find_parent()
                if block:
                    data["care_instructions"] = [block.get_text(" ", strip=True)]

        # Reviews
        try:
            reviews = await page.locator("[data-testid='product-review']").all_text_contents()
            clean_reviews = [r.strip() for r in reviews if r.strip()]
            data["reviews"]["full_reviews"] = clean_reviews
            data["reviews"]["total"] = len(clean_reviews)
        except Exception as e:
            print(f"Failed to extract reviews: {e}")

        rating_tag = soup.find("span", {"data-testid": "review-rating-value"})
        if rating_tag:
            try:
                data["reviews"]["average_rating"] = float(rating_tag.text.strip())
            except ValueError:
                pass

        # Environmental impact
        for section in soup.find_all("section"):
            if section.find(string=lambda x: x and "carbon footprint" in x.lower()):
                data["environmental_impact"]["text"] = section.get_text(" ", strip=True)
                break

        await context.close()
        await browser.close()
    return data


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape Decathlon product page.")
    parser.add_argument("url", help="Product URL")
    parser.add_argument("--headful", action="store_true", help="Launch browser visibly for debugging")

    args = parser.parse_args()
    result = asyncio.run(scrape_decathlon_product(args.url, headful=args.headful))
    print(json.dumps(result, indent=2, ensure_ascii=False))
