import asyncio
import time
from typing import AsyncGenerator, Dict, Any, List
from app.schemas.models import AuditStreamEvent, ProductStickerInfo
from app.services.audit_engine import AuditEngine

MOCK_CATALOG: Dict[str, Dict[str, Any]] = {
    "sony": {
        "title": "Sony WH-1000XM5 Wireless Noise Cancelling Headphones (Black)",
        "store_name": "QuickCart Electronics",
        "url": "https://www.quickcart.in/sony-wh-1000xm5-black/p/itm194820",
        "advertised_price": 26990.0,
        "currency": "INR",
        "description": "Industry Leading Active Noise Cancellation, 30hr battery life, Multipoint connection.",
        "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
        "candidates": [
            {
                "title": "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
                "store_name": "QuickCart Electronics",
                "url": "https://www.quickcart.in/sony-wh-1000xm5-black/p/itm194820",
                "advertised_price": 26990.0,
                "currency": "INR",
            },
            {
                "title": "Sony WH-1000XM5 Silver Noise Canceling Headset",
                "store_name": "AudioPlaza India",
                "url": "https://audioplaza.in/products/sony-wh-1000xm5-silver",
                "advertised_price": 27490.0,
                "currency": "INR",
            },
            {
                "title": "Sony WH-1000XM4 Previous Gen ANC Headphones",
                "store_name": "MegaMart",
                "url": "https://megamart.com/sony-xm4",
                "advertised_price": 21990.0,
                "currency": "INR",
            },
        ],
        "cart_data": {
            "base_price": 26990.0,
            "handling_fee": 99.0,
            "delivery_fee": 149.0,
            "taxes": 0.0,
            "hidden_surcharges": 899.0,  # Auto-ticked 1-year accidental warranty
            "final_total": 28137.0,
        },
        "stream_url": "https://view.tinyfish.ai/sessions/live-demo-sony-xm5",
    },
    "macbook": {
        "title": "Apple MacBook Air 13.6-inch M3 Chip (16GB Unified Memory, 512GB SSD) - Space Grey",
        "store_name": "ApexRetail Prime",
        "url": "https://apexretail.in/apple-macbook-air-m3-16gb-512gb/p/macm3",
        "advertised_price": 114900.0,
        "currency": "INR",
        "description": "Liquid Retina display, M3 8-core CPU, 10-core GPU, MagSafe charging.",
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
        "candidates": [
            {
                "title": "Apple MacBook Air 13.6\" M3 Chip 16GB / 512GB Space Grey",
                "store_name": "ApexRetail Prime",
                "url": "https://apexretail.in/apple-macbook-air-m3-16gb-512gb/p/macm3",
                "advertised_price": 114900.0,
                "currency": "INR",
            },
            {
                "title": "Apple MacBook Air M3 8GB / 256GB Midnight",
                "store_name": "iStore Authorized",
                "url": "https://istore.in/macbook-air-m3-base",
                "advertised_price": 99900.0,
                "currency": "INR",
            },
        ],
        "cart_data": {
            "base_price": 114900.0,
            "handling_fee": 299.0,
            "delivery_fee": 0.0,
            "taxes": 0.0,
            "hidden_surcharges": 1499.0,  # Mandatory secure transit & tamper box surcharge
            "final_total": 116698.0,
        },
        "stream_url": "https://view.tinyfish.ai/sessions/live-demo-macbook-m3",
    },
    "nike": {
        "title": "Nike Air Jordan 1 Retro High OG 'Chicago Lost & Found'",
        "store_name": "SneakerVault Kicks",
        "url": "https://sneakervault.in/sneakers/air-jordan-1-lost-and-found",
        "advertised_price": 14995.0,
        "currency": "INR",
        "description": "Iconic vintage high top leather sneakers with cracked leather detailing.",
        "image_url": "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80",
        "candidates": [
            {
                "title": "Nike Air Jordan 1 Retro High OG Chicago",
                "store_name": "SneakerVault Kicks",
                "url": "https://sneakervault.in/sneakers/air-jordan-1-lost-and-found",
                "advertised_price": 14995.0,
                "currency": "INR",
            },
            {
                "title": "Air Jordan 1 Mid Alternate Bred",
                "store_name": "FootDistrict",
                "url": "https://footdistrict.in/jordan-1-mid-bred",
                "advertised_price": 11995.0,
                "currency": "INR",
            },
        ],
        "cart_data": {
            "base_price": 14995.0,
            "handling_fee": 250.0,
            "delivery_fee": 550.0,  # Distance / heavy packaging surcharge
            "taxes": 0.0,
            "hidden_surcharges": 490.0,  # Authentication certificate fee tacked on
            "final_total": 16285.0,
        },
        "stream_url": "https://view.tinyfish.ai/sessions/live-demo-jordan-1",
    },
    "indigo": {
        "title": "IndiGo Flight 6E-204 (BLR -> CCU) Non-Stop Economy Saver",
        "store_name": "IndiGo Air Travel",
        "url": "https://www.goindigo.in/booking/flight-select/blr-ccu",
        "advertised_price": 4899.0,
        "currency": "INR",
        "description": "Bengaluru Kempegowda Intl (BLR) to Kolkata Netaji Subhash Chandra Bose Intl (CCU), 2h 25m, 15kg check-in baggage.",
        "image_url": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
        "candidates": [
            {
                "title": "IndiGo Flight 6E-204 BLR to CCU Saver Fare",
                "store_name": "IndiGo Air Travel",
                "url": "https://www.goindigo.in/booking/flight-select/blr-ccu",
                "advertised_price": 4899.0,
                "currency": "INR",
            },
            {
                "title": "Air India Flight AI-772 BLR to CCU Standard",
                "store_name": "Air India Portal",
                "url": "https://www.airindia.com/booking/flight/blr-ccu",
                "advertised_price": 5499.0,
                "currency": "INR",
            },
        ],
        "cart_data": {
            "base_price": 4899.0,
            "handling_fee": 350.0,        # Convenience fee per passenger
            "delivery_fee": 420.0,        # User Development Fee (UDF)
            "taxes": 295.0,               # Passenger Service Fee + GST
            "hidden_surcharges": 450.0,   # Pre-selected middle/window seat selection & green carbon levy
            "final_total": 6414.0,
        },
        "stream_url": "https://view.tinyfish.ai/sessions/live-demo-indigo-blr-ccu",
    },
}


def get_mock_product_info(query: str) -> Dict[str, Any]:
    """Matches query keywords against mock catalog or creates dynamic fallback."""
    query_lower = query.lower()
    for key, data in MOCK_CATALOG.items():
        if key in query_lower or any(word in query_lower for word in key.split()):
            return data

    # Dynamic fallback generator for any generic query
    clean_title = query.strip().title()
    base_val = 3999.0
    return {
        "title": f"{clean_title} (Premium Edition)",
        "store_name": "GlobalCart Direct",
        "url": f"https://globalcart.com/products/{query_lower.replace(' ', '-')}",
        "advertised_price": base_val,
        "currency": "INR",
        "description": f"Official authentic {clean_title} with warranty.",
        "image_url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80",
        "candidates": [
            {
                "title": f"{clean_title} (Premium Edition)",
                "store_name": "GlobalCart Direct",
                "url": f"https://globalcart.com/products/{query_lower.replace(' ', '-')}",
                "advertised_price": base_val,
                "currency": "INR",
            },
            {
                "title": f"{clean_title} Standard Bundle",
                "store_name": "MetroStore Online",
                "url": f"https://metrostore.in/catalog/{query_lower.replace(' ', '-')}",
                "advertised_price": base_val + 400.0,
                "currency": "INR",
            },
        ],
        "cart_data": {
            "base_price": base_val,
            "handling_fee": 49.0,
            "delivery_fee": 99.0,
            "taxes": 0.0,
            "hidden_surcharges": 199.0,
            "final_total": base_val + 49.0 + 99.0 + 199.0,
        },
        "stream_url": f"https://view.tinyfish.ai/sessions/demo-{int(time.time())}",
    }


async def generate_mock_stream(query: str, postal_code: str = "560001") -> AsyncGenerator[str, None]:
    """Generates an authentic, step-by-step synthetic SSE stream for live demos and fallbacks."""
    data = get_mock_product_info(query)

    # 1. DISCOVERY PHASE
    yield AuditStreamEvent(
        event_type="DISCOVERY",
        message=f"Querying TinySearch for live listings: '{query}'...",
        data={"query": query},
    ).to_sse()
    await asyncio.sleep(0.7)

    yield AuditStreamEvent(
        event_type="DISCOVERY",
        message=f"TinySearch found {len(data['candidates'])} matching merchant listings.",
        data={"candidates": data["candidates"]},
    ).to_sse()
    await asyncio.sleep(0.6)

    # 2. FETCH PHASE
    top_candidate = data["candidates"][0]
    yield AuditStreamEvent(
        event_type="FETCH",
        message=f"Extracting advertised sticker prices from {data['store_name']} via TinyFetch...",
        data={"target_url": top_candidate["url"]},
    ).to_sse()
    await asyncio.sleep(0.8)

    sticker_info = ProductStickerInfo(
        title=data["title"],
        store_name=data["store_name"],
        url=data["url"],
        advertised_price=data["advertised_price"],
        currency=data["currency"],
        description=data.get("description"),
        image_url=data.get("image_url"),
    )
    yield AuditStreamEvent(
        event_type="FETCH",
        message=f"Advertised price confirmed: {data['currency']} {data['advertised_price']:,.2f}",
        data=sticker_info.model_dump(),
    ).to_sse()
    await asyncio.sleep(0.6)

    # 3. STREAM_URL PHASE (TinyAgent launch)
    stream_url = data.get("stream_url", "https://view.tinyfish.ai/sessions/live-stream")
    yield AuditStreamEvent(
        event_type="STREAM_URL",
        message="Live browser sandbox session initialized. Streaming viewport telemetry...",
        data={"stream_url": stream_url},
    ).to_sse()
    await asyncio.sleep(0.6)

    # 4. BROWSER_ACTIONs
    actions = [
        f"Navigating headless browser to {data['url']}",
        "DOM loaded. Dismissing modal popups and marketing banners",
        f"Locating delivery postal code field; injecting '{postal_code}'",
        f"Pincode '{postal_code}' validated. Address verified for standard logistics",
        "Selecting default product variant and stock specifications",
        "Clicking 'Add to Cart' button",
        "Dark pattern intercepted: Unchecking auto-selected warranty / insurance add-on",
        "Advancing navigation to Checkout / Cart Summary screen",
        "Extracting final checkout invoice DOM tree (base price, shipping, handling, surcharges)",
    ]

    for action in actions:
        yield AuditStreamEvent(
            event_type="BROWSER_ACTION",
            message=action,
            data={"action": action, "postal_code": postal_code},
        ).to_sse()
        await asyncio.sleep(0.7)

    # 5. AUDIT_COMPLETE PHASE
    cart_breakdown = AuditEngine.compute_audit(
        advertised_price=data["advertised_price"],
        cart_data=data["cart_data"],
        currency=data["currency"],
        store_name=data["store_name"],
    )

    yield AuditStreamEvent(
        event_type="AUDIT_COMPLETE",
        message=cart_breakdown.audit_summary,
        data={
            "product": sticker_info.model_dump(),
            "cart_breakdown": cart_breakdown.model_dump(),
            "regulatory_scorecard": cart_breakdown.regulatory_scorecard.model_dump() if cart_breakdown.regulatory_scorecard else None,
            "postal_code": postal_code,
        },
    ).to_sse()
