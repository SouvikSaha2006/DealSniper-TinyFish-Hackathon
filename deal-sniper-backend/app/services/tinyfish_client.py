import json
import logging
import re
from typing import Any, AsyncGenerator, Dict, List, Optional
from urllib.parse import urlparse
import httpx
from app.config import get_settings

logger = logging.getLogger("deal_sniper.tinyfish")


class TinyFishClient:
    """Async HTTP client interfacing with the live TinyFish Web Agent API:

    - TinySearch: Live product discovery across real e-commerce portals
    - TinyFetch: Point-in-time DOM / markdown extraction of sticker prices
    - TinyAgent: Autonomous browser agent with SSE telemetry & cart traversal
    """

    def __init__(self, api_key: Optional[str] = None):
        self.settings = get_settings()
        self.api_key = api_key or self.settings.TINYFISH_API_KEY
        self.search_url = self.settings.TINYSEARCH_URL
        self.fetch_url = self.settings.TINYFETCH_URL
        self.agent_url = self.settings.TINYAGENT_SSE_URL

    @property
    def headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        return headers

    @staticmethod
    def parse_merchant_from_url(url: str) -> str:
        """Derives clean retailer name from a canonical product URL."""
        try:
            parsed = urlparse(url)
            netloc = parsed.netloc.lower()
            if netloc.startswith("www."):
                netloc = netloc[4:]

            merchant_map = {
                "amazon.in": "Amazon.in",
                "amazon.com": "Amazon",
                "croma.com": "Croma",
                "reliancedigital.in": "Reliance Digital",
                "flipkart.com": "Flipkart",
                "tatacliq.com": "Tata CLiQ",
                "vijaysales.com": "Vijay Sales",
                "poorvika.com": "Poorvika",
                "myntra.com": "Myntra",
                "nykaa.com": "Nykaa",
                "ajio.com": "AJIO",
            }
            if netloc in merchant_map:
                return merchant_map[netloc]
            # Capitalize primary domain part
            parts = netloc.split(".")
            return parts[0].capitalize() if parts else "Online Retailer"
        except Exception:
            return "Online Retailer"

    @staticmethod
    def extract_advertised_price_from_markdown(content: str) -> float:
        """Extracts advertised sticker price from TinyFetch markdown using regex."""
        if not content:
            return 0.0

        patterns = [
            # Matches: Deal Price: ₹24,990 or Price: Rs. 24,990.00
            r"(?:deal\s*price|our\s*price|offer\s*price|price|m\.?r\.?p\.?)\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{2})?)",
            # Matches: ₹ 24,990 or Rs 24,990
            r"(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)",
            # General price pattern with commas
            r"\b([\d]{1,3}(?:,\d{3})+(?:\.\d{2})?)\b",
        ]

        for pat in patterns:
            matches = re.finditer(pat, content, re.IGNORECASE)
            for m in matches:
                raw_val = m.group(1).replace(",", "").strip()
                try:
                    price = float(raw_val)
                    if 10.0 <= price <= 500000.0:  # Reasonable product price window
                        return price
                except ValueError:
                    continue

        return 0.0

    @staticmethod
    def filter_product_urls(raw_results: List[Dict[str, Any]], query: str) -> List[Dict[str, Any]]:
        """Filters out non-product search aggregators, prioritizing direct product URLs."""
        excluded_domains = [
            "google.com",
            "bing.com",
            "yahoo.com",
            "youtube.com",
            "wikipedia.org",
            "quora.com",
            "reddit.com",
            "facebook.com",
            "instagram.com",
            "twitter.com",
            "x.com",
        ]
        ecom_patterns = ["/dp/", "/p/", "/product/", "/item/", "/buy/", "/pd/", "-p-", "/ip/"]

        valid_candidates: List[Dict[str, Any]] = []

        for item in raw_results:
            url = item.get("url", item.get("link", ""))
            if not url or not url.startswith("http"):
                continue

            parsed = urlparse(url)
            netloc = parsed.netloc.lower()
            if any(exc in netloc for exc in excluded_domains):
                continue

            merchant = TinyFishClient.parse_merchant_from_url(url)
            title = item.get("title", item.get("name", query))
            raw_price = item.get("price", item.get("advertised_price", 0.0))

            try:
                price = float(raw_price) if raw_price else 0.0
            except (ValueError, TypeError):
                price = 0.0

            # Score url preference
            score = 1
            if any(pat in url.lower() for pat in ecom_patterns):
                score += 3
            if any(dom in netloc for dom in ["amazon", "croma", "reliancedigital", "flipkart", "tatacliq"]):
                score += 2

            valid_candidates.append({
                "title": title,
                "url": url,
                "store_name": merchant,
                "merchant_name": merchant,
                "advertised_price": price,
                "currency": item.get("currency", "INR"),
                "score": score,
            })

        # Sort candidate product URLs by specificity score
        valid_candidates.sort(key=lambda x: x["score"], reverse=True)
        return valid_candidates

    async def search_products(self, query: str, postal_code: str = "560001") -> List[Dict[str, Any]]:
        """Step 1 (TinySearch): Queries live web listings for exact product deals."""
        if not self.api_key:
            logger.warning("No TINYFISH_API_KEY provided; cannot call TinySearch.")
            return []

        search_query = f"{query} price buy online india {postal_code}"
        params = {"query": search_query}

        async with httpx.AsyncClient(timeout=self.settings.HTTP_TIMEOUT_SECONDS) as client:
            try:
                response = await client.get(self.search_url, params=params, headers=self.headers)
                response.raise_for_status()
                data = response.json()

                raw_results = []
                if isinstance(data, list):
                    raw_results = data
                elif isinstance(data, dict):
                    raw_results = data.get("results", data.get("items", data.get("data", [])))

                return self.filter_product_urls(raw_results, query)
            except Exception as e:
                logger.error(f"TinySearch live request failed: {e}")
                raise

    async def fetch_product_page(self, url: str) -> Dict[str, Any]:
        """Step 2 (TinyFetch): Extracts live advertised sticker price and clean DOM markdown."""
        if not self.api_key:
            logger.warning("No TINYFISH_API_KEY provided; cannot call TinyFetch.")
            return {}

        payload = {"url": url}
        async with httpx.AsyncClient(timeout=self.settings.HTTP_TIMEOUT_SECONDS) as client:
            try:
                response = await client.post(self.fetch_url, json=payload, headers=self.headers)
                response.raise_for_status()
                data = response.json()

                # If response has markdown/text, extract price
                markdown_content = data.get("markdown", data.get("content", data.get("text", "")))
                extracted_price = self.extract_advertised_price_from_markdown(markdown_content)

                return {
                    "raw_data": data,
                    "title": data.get("title", ""),
                    "description": data.get("description", ""),
                    "advertised_price": extracted_price or data.get("price", 0.0),
                    "markdown": markdown_content,
                    "url": url,
                }
            except Exception as e:
                logger.error(f"TinyFetch live request failed: {e}")
                raise

    async def discover_and_fetch_live_deal(
        self, query: str, postal_code: str = "560001"
    ) -> Dict[str, Any]:
        """Orchestrates Step 1 (TinySearch) + Step 2 (TinyFetch) to resolve a live product URL and price."""
        # 1. Search live product
        candidates = await self.search_products(query, postal_code)
        if not candidates:
            # Fallback to direct merchant query
            candidates = [
                {
                    "title": query,
                    "url": f"https://www.amazon.in/s?k={query.replace(' ', '+')}",
                    "store_name": "Amazon.in",
                    "merchant_name": "Amazon.in",
                    "advertised_price": 0.0,
                    "currency": "INR",
                }
            ]

        top_deal = candidates[0]
        selected_url = top_deal["url"]
        merchant_name = top_deal.get("merchant_name") or self.parse_merchant_from_url(selected_url)

        # 2. Fetch live product page
        advertised_price = top_deal.get("advertised_price", 0.0)
        product_title = top_deal.get("title", query)

        try:
            fetched = await self.fetch_product_page(selected_url)
            if fetched.get("advertised_price"):
                advertised_price = float(fetched["advertised_price"])
            if fetched.get("title"):
                product_title = fetched["title"]
        except Exception as e:
            logger.warning(f"TinyFetch parsing notice for {selected_url}: {e}")

        return {
            "selected_url": selected_url,
            "merchant_name": merchant_name,
            "product_title": product_title,
            "advertised_price": advertised_price,
            "candidates": candidates,
        }

    async def stream_checkout_agent(
        self, url: str, postal_code: str = "560001"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Step 3 (TinyAgent SSE): Dispatches live browser agent to audit the dynamic cart."""
        goal = (
            f"Navigate to this live product page. 1. Identify the advertised sticker price. "
            f"2. If delivery pincode prompt exists, enter '{postal_code}'. "
            f"3. Click 'Add to Cart' or 'Buy Now' to proceed to the cart/checkout review stage without entering payment details. "
            f"4. Extract the exact itemized breakdown: base_price, shipping_fee, handling_fee, taxes, and final_total. "
            f"5. Note any pre-checked warranty or insurance checkboxes. Return output strictly adhering to the JSON schema."
        )

        schema = {
            "type": "object",
            "properties": {
                "product_title": {"type": "string"},
                "advertised_price": {"type": "number"},
                "base_price": {"type": "number"},
                "shipping_fee": {"type": "number"},
                "handling_fee": {"type": "number"},
                "taxes": {"type": "number"},
                "final_total": {"type": "number"},
                "dark_patterns": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["final_total", "advertised_price"],
        }

        payload = {
            "url": url,
            "goal": goal,
            "schema": schema,
            "browser_profile": "lite",
        }

        agent_headers = {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }
        if self.api_key:
            agent_headers["X-API-Key"] = self.api_key

        async with httpx.AsyncClient(timeout=self.settings.AGENT_SSE_TIMEOUT_SECONDS) as client:
            async with client.stream(
                "POST",
                self.agent_url,
                json=payload,
                headers=agent_headers,
            ) as response:
                if response.status_code == 401:
                    raise PermissionError("TinyFish API key unauthorized (401).")
                elif response.status_code != 200:
                    error_text = await response.aread()
                    raise RuntimeError(
                        f"TinyAgent SSE failed with HTTP {response.status_code}: {error_text.decode('utf-8', errors='ignore')}"
                    )

                async for line in response.aiter_lines():
                    if not line:
                        continue

                    if line.startswith("data:"):
                        data_str = line[len("data:"):].strip()
                        if not data_str:
                            continue

                        try:
                            parsed = json.loads(data_str)
                            yield parsed
                        except json.JSONDecodeError:
                            yield {"type": "PROGRESS", "message": data_str}
