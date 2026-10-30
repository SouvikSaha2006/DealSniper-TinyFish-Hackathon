import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional
import httpx
from app.config import get_settings

logger = logging.getLogger("deal_sniper.tinyfish")


class TinyFishClient:
    """Async HTTP client for interfacing with TinyFish Web Agent API:

    - TinySearch: Product discovery across the web
    - TinyFetch: Clean DOM extraction of advertised prices
    - TinyAgent: Autonomous browser agent with SSE telemetry stream
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

    async def search_products(self, query: str) -> List[Dict[str, Any]]:
        """Search products using TinySearch API.

        Discovers candidate product listings and URLs.
        """
        if not self.api_key:
            logger.warning("No TINYFISH_API_KEY provided; cannot call TinySearch.")
            return []

        params = {"query": query}
        async with httpx.AsyncClient(timeout=self.settings.HTTP_TIMEOUT_SECONDS) as client:
            try:
                response = await client.get(self.search_url, params=params, headers=self.headers)
                response.raise_for_status()
                data = response.json()

                # Normalize response into a list of candidates
                candidates: List[Dict[str, Any]] = []
                raw_results = []
                if isinstance(data, list):
                    raw_results = data
                elif isinstance(data, dict):
                    raw_results = data.get("results", data.get("items", data.get("data", [])))

                for item in raw_results:
                    if isinstance(item, dict):
                        candidates.append({
                            "title": item.get("title", item.get("name", query)),
                            "url": item.get("url", item.get("link", "")),
                            "store_name": item.get("store_name", item.get("source", item.get("domain", "Online Store"))),
                            "advertised_price": float(item.get("price", item.get("advertised_price", 0.0)) or 0.0),
                            "currency": item.get("currency", "INR"),
                        })
                return candidates
            except Exception as e:
                logger.error(f"TinySearch request failed: {e}")
                raise

    async def fetch_product_page(self, url: str) -> Dict[str, Any]:
        """Extract advertised sticker price, specifications, and DOM metadata

        from product page using TinyFetch API.
        """
        if not self.api_key:
            logger.warning("No TINYFISH_API_KEY provided; cannot call TinyFetch.")
            return {}

        payload = {"url": url}
        async with httpx.AsyncClient(timeout=self.settings.HTTP_TIMEOUT_SECONDS) as client:
            try:
                response = await client.post(self.fetch_url, json=payload, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"TinyFetch request failed: {e}")
                raise

    async def stream_checkout_agent(
        self, url: str, postal_code: str = "560001"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Runs the autonomous TinyAgent SSE workflow to add product to cart,

        input delivery postal code, uncover hidden fees, and stream live telemetry.
        """
        payload = {
            "url": url,
            "goal": (
                f"Audit the true cart price for this item delivered to postal code {postal_code}. "
                f"Step 1: Select default variant if prompted. "
                f"Step 2: Input delivery pincode/zip code {postal_code} if available. "
                f"Step 3: Add item to cart and proceed to the checkout/cart summary screen. "
                f"Step 4: Extract base price, shipping fees, platform fees, taxes, and final total. "
                f"Return result as JSON with keys: base_price, handling_fee, shipping_fee, tax, final_total."
            ),
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
                if response.status_code != 200:
                    error_text = await response.aread()
                    raise RuntimeError(
                        f"TinyAgent SSE failed with status {response.status_code}: {error_text.decode('utf-8', errors='ignore')}"
                    )

                async for line in response.aiter_lines():
                    if not line:
                        continue

                    # Process standard SSE line
                    if line.startswith("data:"):
                        data_str = line[len("data:"):].strip()
                        if not data_str:
                            continue

                        try:
                            parsed = json.loads(data_str)
                            yield parsed
                        except json.JSONDecodeError:
                            # If upstream emitted plain text progress
                            yield {"type": "PROGRESS", "message": data_str}
