import re
from typing import Any, Dict, List, Optional
from app.schemas.models import CartBreakdown, ProductStickerInfo


class AuditEngine:
    """Engine for analyzing cart breakdowns, calculating price deltas,

    and detecting dark patterns & drip pricing techniques.
    """

    @staticmethod
    def clean_numeric_price(val: Any) -> float:
        """Safely extracts a float value from numbers or formatted currency strings."""
        if val is None:
            return 0.0
        if isinstance(val, (int, float)):
            return float(val)

        # String representation
        val_str = str(val).strip()
        # Remove common currency symbols, commas, and whitespace
        val_clean = re.sub(r"[^\d.]", "", val_str)
        if not val_clean:
            return 0.0

        try:
            return float(val_clean)
        except ValueError:
            # If multiple dots exist (e.g. 1.299.00), handle split
            parts = val_clean.split(".")
            if len(parts) > 2:
                try:
                    return float("".join(parts[:-1]) + "." + parts[-1])
                except ValueError:
                    return 0.0
            return 0.0

    @classmethod
    def compute_audit(
        cls,
        advertised_price: float,
        cart_data: Dict[str, Any],
        currency: str = "INR",
        store_name: str = "Unknown Store",
    ) -> CartBreakdown:
        """Computes true out-of-pocket breakdown, deltas, and flags dark patterns."""
        base_price = cls.clean_numeric_price(
            cart_data.get("base_price", cart_data.get("item_price", advertised_price))
        )
        handling_fee = cls.clean_numeric_price(
            cart_data.get("handling_fee", cart_data.get("platform_fee", cart_data.get("convenience_fee", 0.0)))
        )
        delivery_fee = cls.clean_numeric_price(
            cart_data.get("delivery_fee", cart_data.get("shipping_fee", cart_data.get("shipping", 0.0)))
        )
        taxes = cls.clean_numeric_price(
            cart_data.get("taxes", cart_data.get("tax", cart_data.get("gst", 0.0)))
        )
        hidden_surcharges = cls.clean_numeric_price(
            cart_data.get(
                "hidden_surcharges",
                cart_data.get("surcharges", cart_data.get("protection_fee", cart_data.get("bag_fee", 0.0))),
            )
        )

        raw_final = cart_data.get("final_total", cart_data.get("total", cart_data.get("grand_total")))
        if raw_final is not None:
            final_total = cls.clean_numeric_price(raw_final)
        else:
            final_total = base_price + handling_fee + delivery_fee + taxes + hidden_surcharges

        # If final_total is higher than the sum of explicit fees, remainder is an unclassified hidden surcharge
        calculated_sum = base_price + handling_fee + delivery_fee + taxes + hidden_surcharges
        unaccounted = round(final_total - calculated_sum, 2)
        if unaccounted > 1.0:
            hidden_surcharges += unaccounted

        # Absolute and percentage delta relative to initial advertised price
        delta_amount = round(final_total - advertised_price, 2)
        if advertised_price > 0:
            delta_percentage = round((delta_amount / advertised_price) * 100, 2)
        else:
            delta_percentage = 0.0

        # Dark pattern identification
        dark_patterns: List[str] = []

        if handling_fee > 0:
            dark_patterns.append(
                f"Drip Pricing: Undisclosed platform/convenience fee ({currency} {handling_fee:.2f}) tacked on at cart step."
            )

        if hidden_surcharges > 0:
            dark_patterns.append(
                f"Sneak into Basket: Unexplained surcharges/pre-checked protection ({currency} {hidden_surcharges:.2f}) added to checkout."
            )

        if delivery_fee > 0 and base_price >= advertised_price:
            dark_patterns.append(
                f"Last-Mile Drip: Delivery fee ({currency} {delivery_fee:.2f}) withheld until postal code checkout stage."
            )

        if base_price > advertised_price:
            price_jump = base_price - advertised_price
            dark_patterns.append(
                f"Bait-and-Switch: In-cart base price ({currency} {base_price:.2f}) is higher than advertised sticker price ({currency} {advertised_price:.2f}) by {currency} {price_jump:.2f}."
            )

        if delta_percentage >= 15.0:
            dark_patterns.append(
                f"Severe Price Inflation: Final payable cost is {delta_percentage}% higher than original listing price."
            )
        elif delta_percentage > 5.0 and len(dark_patterns) == 0:
            dark_patterns.append(
                f"Cumulative Drip Pricing: Accumulated post-search fees inflated total by {delta_percentage}%."
            )

        if not dark_patterns:
            dark_patterns.append("Transparent Pricing: Zero hidden fees or deceptive surcharges detected.")

        # Create structured human-readable summary
        if delta_amount > 0:
            summary = (
                f"True Out-of-Pocket Alert: Advertised at {currency} {advertised_price:,.2f}, "
                f"but true checkout total is {currency} {final_total:,.2f} (+{delta_percentage}% inflation). "
                f"Identified {len(dark_patterns)} pricing anomaly(ies) on {store_name}."
            )
        else:
            summary = (
                f"Pricing Verified: Advertised price of {currency} {advertised_price:,.2f} matches checkout total."
            )

        return CartBreakdown(
            base_price=round(base_price, 2),
            handling_fee=round(handling_fee, 2),
            delivery_fee=round(delivery_fee, 2),
            taxes=round(taxes, 2),
            hidden_surcharges=round(hidden_surcharges, 2),
            final_total=round(final_total, 2),
            delta_amount=delta_amount,
            delta_percentage=delta_percentage,
            currency=currency,
            dark_patterns_detected=dark_patterns,
            audit_summary=summary,
        )
