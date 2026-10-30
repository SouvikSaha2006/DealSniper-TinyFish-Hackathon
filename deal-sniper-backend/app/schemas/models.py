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
    "NOTICE",
    "STRIP_START",
    "STRIP_ACTION",
    "STRIP_COMPLETE",
    "ARBITRAGE_DISCOVERY",
    "MERCHANT_ASSIGNMENT",
    "AGENT_STREAM_A",
    "AGENT_STREAM_B",
    "ARBITRAGE_COMPLETE",
]


class ArbitrageRequest(BaseModel):
    query: str = Field(default="Sony WH-1000XM5", description="Product to arbitrage across retailers")
    postal_code: str = Field(default="560001", description="Target destination postal code")
    use_mock: bool = Field(default=False, description="Enable simulated mock stream")


class MerchantCheckoutSummary(BaseModel):
    merchant_name: str = Field(..., description="E-commerce retailer name")
    advertised_price: float = Field(..., description="Sticker listing price on search")
    base_price: float = Field(..., description="Item cart base price")
    shipping_fee: float = Field(default=0.0, description="Delivery or shipping charge")
    convenience_fee: float = Field(default=0.0, description="Platform or convenience fee")
    tax_and_surcharges: float = Field(default=0.0, description="Taxes and pre-selected add-ons/surcharges")
    final_total: float = Field(..., description="True checkout out-of-pocket cost")
    dark_patterns_count: int = Field(default=0, description="Number of predatory patterns identified")
    dark_patterns: List[str] = Field(default_factory=list, description="List of identified dark patterns")
    compliance_grade: str = Field(..., description="GRADE A | GRADE F")
    is_true_winner: bool = Field(default=False, description="Whether this merchant is the true lowest cost")


class ArbitrageResult(BaseModel):
    product_name: str = Field(..., description="Product name audited")
    postal_code: str = Field(..., description="Destination postal code")
    merchant_a: MerchantCheckoutSummary = Field(..., description="First retailer (e.g., Bait Trap)")
    merchant_b: MerchantCheckoutSummary = Field(..., description="Second retailer (e.g., Honest Store)")
    initial_perceived_winner: str = Field(..., description="Retailer advertising lower search price")
    actual_true_winner: str = Field(..., description="Retailer cheaper at final checkout")
    arbitrage_delta: float = Field(..., description="Net consumer savings at true checkout")
    verdict_summary: str = Field(..., description="Executive comparative analysis verdict")


class StripRequest(BaseModel):
    cart_session_id: str = Field(default="session-live", description="ID of the active cart session to sanitize")
    product_name: str = Field(..., description="Name or title of the product in cart")
    current_total: float = Field(..., description="Current un-sanitized cart total")
    patterns_to_strip: List[str] = Field(default_factory=list, description="List of detected dark patterns to strip")
    use_mock: bool = Field(default=False, description="Enable deterministic mock simulation")


class StripResult(BaseModel):
    original_total: float = Field(..., description="Initial checkout total before sanitization")
    sanitized_total: float = Field(..., description="Cleaned checkout total after stripping predatory add-ons")
    total_saved: float = Field(..., description="Total currency saved by stripping predatory fees")
    items_removed: List[str] = Field(default_factory=list, description="Itemized predatory line items stripped")
    clean_cart_url: str = Field(..., description="Direct sanitized checkout URL with clean ref")
    status: str = Field(default="SANITIZED", description="Sanitization outcome status")


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


class ViolationItem(BaseModel):
    statute: str = Field(..., description="Statute or regulation, e.g. FTC Act Section 5 or CCPA § 1770(a)(22)")
    violation_type: str = Field(..., description="Type of violation, e.g. Deceptive Drip Pricing")
    severity: str = Field(..., description="CRITICAL | HIGH | MODERATE")
    description: str = Field(..., description="Legal rationale explaining the infraction")
    potential_fine: str = Field(..., description="Statutory penalty or fine exposure")


class RegulatoryScorecard(BaseModel):
    grade: str = Field(..., description="GRADE A | GRADE B | GRADE C | GRADE F")
    compliance_score: int = Field(..., description="Numeric compliance score from 0 to 100")
    status_label: str = Field(..., description="Executive compliance status description")
    violations: List[ViolationItem] = Field(default_factory=list, description="Enumerated statutory infractions")
    audit_timestamp: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))


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
    regulatory_scorecard: Optional[RegulatoryScorecard] = Field(default=None, description="FTC & CCPA regulatory scorecard")


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
