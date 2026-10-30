import json
import time
from typing import Any, List, Literal, Optional, Union
from pydantic import BaseModel, Field


EventType = Literal[
    "DISCOVERY",
    "FETCH",
    "BROWSER_ACTION",
    "STREAM_URL",
    "AUDIT_COMPLETE",
    "ERROR",
]


class AuditRequest(BaseModel):
    query: str = Field(..., description="Product name or shopping search query", min_length=1)
    postal_code: str = Field(default="560001", description="Delivery pincode or zip code")
    use_mock: bool = Field(default=False, description="Force deterministic mock fallback for testing/demo")
    target_url: Optional[str] = Field(default=None, description="Optional direct product URL to audit directly")


class ProductStickerInfo(BaseModel):
    title: str = Field(..., description="Product title extracted from listing")
    store_name: str = Field(..., description="Platform or store name (e.g., Flipkart, Amazon, Croma)")
    url: str = Field(..., description="Canonical product URL")
    advertised_price: float = Field(..., description="Initial advertised sticker price")
    currency: str = Field(default="INR", description="Currency symbol or code")
    description: Optional[str] = Field(default=None, description="Short product description or specs")
    image_url: Optional[str] = Field(default=None, description="Product image thumbnail URL")


class CartBreakdown(BaseModel):
    base_price: float = Field(..., description="Item listing base price in cart")
    handling_fee: float = Field(default=0.0, description="Platform, convenience, or handling fees")
    delivery_fee: float = Field(default=0.0, description="Delivery, shipping, or distance surcharge")
    taxes: float = Field(default=0.0, description="GST / Sales Tax applied at checkout")
    hidden_surcharges: float = Field(default=0.0, description="Auto-added protection plans, bag fees, surge fees")
    final_total: float = Field(..., description="Final true out-of-pocket checkout total")
    delta_amount: float = Field(default=0.0, description="Absolute difference between final total and advertised price")
    delta_percentage: float = Field(..., description="Percentage inflation over advertised sticker price")
    currency: str = Field(default="INR", description="Currency identifier")
    dark_patterns_detected: List[str] = Field(default_factory=list, description="Identified dark patterns")
    audit_summary: Optional[str] = Field(default=None, description="Human-readable audit breakdown summary")


class AuditStreamEvent(BaseModel):
    event_type: EventType = Field(..., description="Categorized stream event type")
    message: Optional[str] = Field(default=None, description="Human readable description of the event")
    data: Optional[Union[dict, list, str, int, float, bool, None]] = Field(default=None, description="Structured payload")
    timestamp: float = Field(default_factory=time.time, description="Unix epoch timestamp")

    def to_sse(self) -> str:
        """Serialize event into standard Server-Sent Event format."""
        payload = {
            "event": self.event_type,
            "event_type": self.event_type,
            "message": self.message,
            "data": self.data,
            "timestamp": self.timestamp,
        }
        json_str = json.dumps(payload, default=str)
        # Yield both event: <type> and data: <json> for maximum client compatibility
        return f"event: {self.event_type}\ndata: {json_str}\n\n"
