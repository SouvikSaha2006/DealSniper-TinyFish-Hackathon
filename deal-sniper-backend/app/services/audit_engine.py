import re
from typing import Any, Dict, List, Optional
from app.schemas.models import CartBreakdown, ProductStickerInfo, RegulatoryScorecard, ViolationItem


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

        regulatory_scorecard = cls.evaluate_regulatory_compliance(
            advertised_price=advertised_price,
            total_checkout_price=final_total,
            dark_patterns=dark_patterns,
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
            regulatory_scorecard=regulatory_scorecard,
        )

    @classmethod
    def evaluate_regulatory_compliance(
        cls,
        advertised_price: float,
        total_checkout_price: float,
        dark_patterns: List[str],
    ) -> RegulatoryScorecard:
        """Evaluates detected drip fees and dark patterns against official consumer

        protection mandates (FTC Section 5, FTC 16 CFR Part 464, and CCPA § 1770(a)(22)).
        """
        delta_amount = total_checkout_price - advertised_price
        if advertised_price > 0:
            delta_percentage = (delta_amount / advertised_price) * 100.0
        else:
            delta_percentage = 0.0

        # Filter out "Transparent Pricing" placeholder if present
        actual_patterns = [p for p in dark_patterns if "Transparent Pricing" not in p]
        has_patterns = len(actual_patterns) > 0

        # Scoring Rubric:
        # 1. Delta == 0% and no dark patterns: GRADE A, Score 98
        if delta_percentage <= 0.01 and not has_patterns:
            return RegulatoryScorecard(
                grade="GRADE A",
                compliance_score=98,
                status_label="Full Compliance",
                violations=[],
            )

        # 2. Delta <= 7% and no active dark pattern tricks: GRADE B, Score 82
        if delta_percentage <= 7.0 and not has_patterns:
            return RegulatoryScorecard(
                grade="GRADE B",
                compliance_score=82,
                status_label="Standard Surcharges Disclosed",
                violations=[],
            )

        # 3. Delta > 7% or predatory dark patterns flagged: GRADE F, Score 34
        patterns_str = " ".join(actual_patterns).lower()
        violations: List[ViolationItem] = []

        # Check for pre-ticked affirmative consent traps / warranty sneak-ins
        if any(w in patterns_str for w in ["sneak", "protection", "warranty", "insurance", "pre-ticked", "surcharge"]):
            violations.append(
                ViolationItem(
                    statute="FTC Policy Statement on Negative Option Marketing",
                    violation_type="Pre-ticked Affirmative Consent Trap",
                    severity="CRITICAL",
                    description="Pre-selecting add-on warranties without explicit affirmative opt-in constitutes an unfair trade practice.",
                    potential_fine="$50,120 per civil infraction",
                )
            )

        # Check for mandatory hidden drip pricing / handling fees
        if any(w in patterns_str for w in ["drip", "handling", "platform", "convenience", "fee", "packaging", "bait-and-switch"]) or delta_percentage > 7.0:
            violations.append(
                ViolationItem(
                    statute="FTC Trade Regulation on Hidden Fees (16 CFR Part 464)",
                    violation_type="Mandatory Hidden Surcharge (Drip Pricing)",
                    severity="CRITICAL",
                    description="Failing to disclose unavoidable handling fees in the initial advertised price distorts market comparison.",
                    potential_fine="Statutory restitution & civil penalties",
                )
            )

        # Check for delivery / geographic surcharges withheld until payment step
        if any(w in patterns_str for w in ["last-mile", "delivery", "shipping", "distance", "pincode", "postal", "surge"]):
            violations.append(
                ViolationItem(
                    statute="CCPA § 1770(a)(22) Unfair Competition Law",
                    violation_type="Deceptive Geographic Surcharge",
                    severity="HIGH",
                    description="Withholding delivery surcharges until the final payment gateway entry.",
                    potential_fine="Up to $7,500 per intentional violation",
                )
            )

        # Ensure at least one violation is listed if graded F
        if not violations:
            violations.append(
                ViolationItem(
                    statute="FTC Trade Regulation on Hidden Fees (16 CFR Part 464)",
                    violation_type="Mandatory Hidden Surcharge (Drip Pricing)",
                    severity="CRITICAL",
                    description="Accumulation of undisclosed mandatory fees resulted in deceptive post-advertised price hike.",
                    potential_fine="Statutory restitution & civil penalties",
                )
            )

        score = max(int(100 - (delta_percentage * 2.2) - (len(violations) * 15)), 18)

        return RegulatoryScorecard(
            grade="GRADE F",
            compliance_score=score,
            status_label="Deceptive Drip Pricing Violation",
            violations=violations,
        )
