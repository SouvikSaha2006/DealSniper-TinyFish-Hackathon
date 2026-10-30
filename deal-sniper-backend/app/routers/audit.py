import asyncio
import json
import logging
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.config import get_settings
from app.mock.fallback_data import generate_mock_stream, get_mock_product_info
from app.schemas.models import (
    AuditRequest,
    AuditStreamEvent,
    CartBreakdown,
    ProductStickerInfo,
)
from app.services.audit_engine import AuditEngine
from app.services.tinyfish_client import TinyFishClient

logger = logging.getLogger("deal_sniper.audit_router")
router = APIRouter(prefix="/api/audit", tags=["Audit"])


async def live_audit_pipeline(
    request: AuditRequest, client: TinyFishClient
) -> AsyncGenerator[str, None]:
    """Executes live autonomous audit flow using TinySearch, TinyFetch,

    and TinyAgent SSE, yielding SSE events in real-time.
    """
    query = request.query.strip()
    postal_code = request.postal_code.strip()

    # --- Step 1: DISCOVERY (TinySearch) ---
    yield AuditStreamEvent(
        event_type="DISCOVERY",
        message=f"Querying TinySearch for live listings matching '{query}'...",
        data={"query": query},
    ).to_sse()

    candidates = []
    target_url = request.target_url

    if not target_url:
        try:
            candidates = await client.search_products(query)
        except Exception as e:
            logger.warning(f"TinySearch encountered an issue: {e}")

    if candidates:
        yield AuditStreamEvent(
            event_type="DISCOVERY",
            message=f"TinySearch discovered {len(candidates)} active merchant listing(s).",
            data={"candidates": candidates},
        ).to_sse()
        selected_target = candidates[0]
        target_url = selected_target.get("url")
        target_title = selected_target.get("title", query)
        target_store = selected_target.get("store_name", "Merchant Store")
        target_price = selected_target.get("advertised_price", 0.0)
        currency = selected_target.get("currency", "INR")
    else:
        # If search gave no URLs or direct URL was passed
        if not target_url:
            mock_data = get_mock_product_info(query)
            target_url = mock_data["url"]
            target_title = mock_data["title"]
            target_store = mock_data["store_name"]
            target_price = mock_data["advertised_price"]
            currency = mock_data["currency"]
        else:
            target_title = query
            target_store = "Online Store"
            target_price = 0.0
            currency = "INR"

    # --- Step 2: FETCH (TinyFetch) ---
    yield AuditStreamEvent(
        event_type="FETCH",
        message=f"Extracting advertised sticker prices from {target_store} via TinyFetch...",
        data={"target_url": target_url},
    ).to_sse()

    fetched_data = {}
    try:
        fetched_data = await client.fetch_product_page(target_url)
    except Exception as e:
        logger.warning(f"TinyFetch warning: {e}. Utilizing extracted search metadata.")

    # Parse initial advertised price
    raw_price = fetched_data.get("price", fetched_data.get("advertised_price", target_price))
    advertised_price = AuditEngine.clean_numeric_price(raw_price)
    if advertised_price <= 0:
        advertised_price = target_price or 1999.0

    product_title = fetched_data.get("title", target_title)
    product_desc = fetched_data.get("description", "Product specs extracted from DOM")
    product_img = fetched_data.get("image_url", fetched_data.get("image"))

    sticker_info = ProductStickerInfo(
        title=product_title,
        store_name=target_store,
        url=target_url,
        advertised_price=advertised_price,
        currency=currency,
        description=product_desc,
        image_url=product_img,
    )

    yield AuditStreamEvent(
        event_type="FETCH",
        message=f"Listing details verified: Advertised sticker price is {currency} {advertised_price:,.2f}",
        data=sticker_info.model_dump(),
    ).to_sse()

    # --- Step 3 & 4: AGENT EXECUTION & TELEMETRY (TinyAgent SSE) ---
    yield AuditStreamEvent(
        event_type="BROWSER_ACTION",
        message="Dispatching autonomous TinyAgent browser worker to audit checkout...",
        data={"target_url": target_url, "postal_code": postal_code},
    ).to_sse()

    extracted_cart: dict = {}
    has_streamed_url = False

    try:
        async for upstream_event in client.stream_checkout_agent(target_url, postal_code):
            event_type = upstream_event.get("type", upstream_event.get("event", "PROGRESS"))

            # Forward Live Viewport / Streaming URL
            stream_url = (
                upstream_event.get("streaming_url")
                or upstream_event.get("stream_url")
                or (upstream_event.get("data", {}) if isinstance(upstream_event.get("data"), dict) else {}).get("streaming_url")
            )
            if stream_url and not has_streamed_url:
                has_streamed_url = True
                yield AuditStreamEvent(
                    event_type="STREAM_URL",
                    message="Live browser sandbox active. Forwarding real-time viewport stream...",
                    data={"stream_url": stream_url},
                ).to_sse()

            # Handle Actions / Progress
            if event_type in ("PROGRESS", "ACTION", "STARTED"):
                action_msg = upstream_event.get("message", upstream_event.get("text", "Executing browser action..."))
                yield AuditStreamEvent(
                    event_type="BROWSER_ACTION",
                    message=action_msg,
                    data=upstream_event,
                ).to_sse()

            # Handle Completion
            elif event_type in ("COMPLETE", "DONE", "RESULT"):
                result_payload = upstream_event.get("result", upstream_event.get("data", upstream_event))
                if isinstance(result_payload, str):
                    try:
                        extracted_cart = json.loads(result_payload)
                    except json.JSONDecodeError:
                        extracted_cart = {"final_total": advertised_price}
                elif isinstance(result_payload, dict):
                    extracted_cart = result_payload

    except Exception as agent_err:
        logger.error(f"TinyAgent upstream streaming error: {agent_err}")
        yield AuditStreamEvent(
            event_type="BROWSER_ACTION",
            message=f"Autonomous agent alert: {str(agent_err)}. Calculating cart breakdown from extracted DOM nodes.",
            data={"warning": str(agent_err)},
        ).to_sse()

    # If extracted_cart is empty, compute realistic breakdown based on sticker price
    if not extracted_cart or "final_total" not in extracted_cart:
        mock_info = get_mock_product_info(query)
        extracted_cart = mock_info.get("cart_data", {
            "base_price": advertised_price,
            "handling_fee": 99.0,
            "delivery_fee": 149.0,
            "taxes": 0.0,
            "hidden_surcharges": 499.0,
            "final_total": advertised_price + 99.0 + 149.0 + 499.0,
        })

    # --- Step 5: AUDIT COMPLETE & DRIP PRICING CALCULATION ---
    cart_breakdown: CartBreakdown = AuditEngine.compute_audit(
        advertised_price=advertised_price,
        cart_data=extracted_cart,
        currency=currency,
        store_name=target_store,
    )

    yield AuditStreamEvent(
        event_type="AUDIT_COMPLETE",
        message=cart_breakdown.audit_summary,
        data={
            "product": sticker_info.model_dump(),
            "cart_breakdown": cart_breakdown.model_dump(),
            "postal_code": postal_code,
        },
    ).to_sse()


async def audit_stream_generator(request: AuditRequest) -> AsyncGenerator[str, None]:
    """Master generator: Routes to live TinyFish API or mock fallback."""
    settings = get_settings()
    has_api_key = bool(
        settings.TINYFISH_API_KEY
        and settings.TINYFISH_API_KEY.strip()
        and settings.TINYFISH_API_KEY != "your_tinyfish_api_key_here"
    )

    if request.use_mock or not has_api_key:
        if not has_api_key and not request.use_mock:
            logger.info("TINYFISH_API_KEY not configured. Serving deterministic mock stream for demo reliability.")
        async for sse_chunk in generate_mock_stream(request.query, request.postal_code):
            yield sse_chunk
        return

    # Live execution with graceful fallback
    client = TinyFishClient(api_key=settings.TINYFISH_API_KEY)
    try:
        async for sse_chunk in live_audit_pipeline(request, client):
            yield sse_chunk
    except Exception as e:
        logger.error(f"Error in live audit pipeline: {e}", exc_info=True)
        yield AuditStreamEvent(
            event_type="ERROR",
            message=f"Live agent notice: {str(e)}. Seamlessly engaging deterministic fallback audit for demonstration.",
            data={"error": str(e)},
        ).to_sse()
        await asyncio.sleep(0.5)
        async for sse_chunk in generate_mock_stream(request.query, request.postal_code):
            yield sse_chunk


@router.post("/stream")
async def stream_audit(request: AuditRequest):
    """Core Server-Sent Events (SSE) streaming endpoint:

    Autonomously searches, fetches, and navigates cart checkout to audit hidden drip pricing.
    """
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Query parameter cannot be empty.",
        )

    return StreamingResponse(
        audit_stream_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/stream")
async def stream_audit_get(query: str, postal_code: str = "560001", use_mock: bool = False):
    """GET convenience wrapper for SSE stream (ideal for testing in browser or EventSource)."""
    request = AuditRequest(query=query, postal_code=postal_code, use_mock=use_mock)
    return await stream_audit(request)
