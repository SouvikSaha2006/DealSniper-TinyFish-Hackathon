#!/usr/bin/env python3
"""DealSniper SSE Stream Test Runner

Connects to the DealSniper backend stream endpoint and displays real-time telemetry.
"""

import argparse
import json
import sys
import time
import httpx

# ANSI Color Codes
CYAN = "\033[96m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
GREEN = "\033[92m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

EVENT_BADGES = {
    "DISCOVERY": f"{CYAN}{BOLD}[DISCOVERY]{RESET}",
    "FETCH": f"{BLUE}{BOLD}[FETCH]{RESET}",
    "STREAM_URL": f"{MAGENTA}{BOLD}[STREAM_URL]{RESET}",
    "BROWSER_ACTION": f"{YELLOW}{BOLD}[BROWSER]{RESET}",
    "NOTICE": f"{YELLOW}{BOLD}[NOTICE]{RESET}",
    "AUDIT_COMPLETE": f"{GREEN}{BOLD}[AUDIT_COMPLETE]{RESET}",
    "ERROR": f"{RED}{BOLD}[ERROR]{RESET}",
}


def print_banner(target_url: str, query: str, postal_code: str, use_mock: bool):
    print(f"\n{BOLD}{'='*72}{RESET}")
    print(f"{BOLD}  🎯 DEALSNIPER SSE AUDIT STREAM TEST RUNNER{RESET}")
    print(f"{BOLD}{'='*72}{RESET}")
    print(f" {DIM}Target Endpoint :{RESET} {target_url}")
    print(f" {DIM}Search Query    :{RESET} {query}")
    print(f" {DIM}Postal Code     :{RESET} {postal_code}")
    print(f" {DIM}Execution Mode  :{RESET} {'Deterministic Simulation (Mock)' if use_mock else 'Live TinyFish Web Agent'}")
    print(f"{BOLD}{'-'*72}{RESET}\n")


def print_audit_card(data: dict):
    cart = data.get("cart_breakdown", {})
    product = data.get("product", {})
    currency = cart.get("currency", "INR")

    print(f"\n{GREEN}{BOLD}{'='*72}{RESET}")
    print(f"{GREEN}{BOLD}  ✅ AUDIT SUMMARY & TRUE OUT-OF-POCKET BREAKDOWN{RESET}")
    print(f"{GREEN}{BOLD}{'='*72}{RESET}")
    print(f" {BOLD}Product Title{RESET}      : {product.get('title', 'N/A')}")
    print(f" {BOLD}Merchant Store{RESET}     : {product.get('store_name', 'N/A')}")
    print(f" {BOLD}Advertised Price{RESET}   : {currency} {product.get('advertised_price', 0):,.2f}")
    print(f"{BOLD}{'-'*72}{RESET}")
    print(f"   Base Price in Cart     : {currency} {cart.get('base_price', 0):,.2f}")
    print(f"   Handling / Platform Fee: {currency} {cart.get('handling_fee', 0):,.2f}")
    print(f"   Delivery / Shipping    : {currency} {cart.get('delivery_fee', 0):,.2f}")
    print(f"   Taxes (GST/VAT)        : {currency} {cart.get('taxes', 0):,.2f}")
    print(f"   Hidden Surcharges      : {currency} {cart.get('hidden_surcharges', 0):,.2f}")
    print(f"{BOLD}{'-'*72}{RESET}")
    print(f" {BOLD}FINAL OUT-OF-POCKET{RESET}    : {BOLD}{currency} {cart.get('final_total', 0):,.2f}{RESET}")
    delta_pct = cart.get("delta_percentage", 0)
    delta_color = RED if delta_pct > 0 else GREEN
    print(f" {BOLD}Price Inflation (Delta){RESET}: {delta_color}{BOLD}+{delta_pct:.2f}% ({currency} {cart.get('delta_amount', 0):,.2f}){RESET}")
    
    dark_patterns = cart.get("dark_patterns_detected", [])
    if dark_patterns:
        print(f"\n {YELLOW}{BOLD}⚠️ Dark Patterns & Deceptive Pricing Flagged:{RESET}")
        for dp in dark_patterns:
            print(f"   • {YELLOW}{dp}{RESET}")
    print(f"{GREEN}{BOLD}{'='*72}{RESET}\n")


def run_stream_test(base_url: str, query: str, postal_code: str, use_mock: bool):
    endpoint = f"{base_url.rstrip('/')}/api/audit/stream"
    payload = {
        "query": query,
        "postal_code": postal_code,
        "use_mock": use_mock,
    }

    print_banner(endpoint, query, postal_code, use_mock)

    start_time = time.time()
    events_received = 0

    try:
        with httpx.Client(timeout=60.0) as client:
            with client.stream("POST", endpoint, json=payload, headers={"Accept": "text/event-stream"}) as response:
                if response.status_code != 200:
                    print(f"{RED}[FAIL] Server returned HTTP {response.status_code}:{RESET} {response.read().decode('utf-8')}")
                    sys.exit(1)

                current_event_type = None

                for line in response.iter_lines():
                    if not line:
                        continue

                    if line.startswith("event:"):
                        current_event_type = line[len("event:"):].strip()
                        continue

                    if line.startswith("data:"):
                        data_str = line[len("data:"):].strip()
                        events_received += 1
                        badge = EVENT_BADGES.get(current_event_type, f"[{current_event_type or 'EVENT'}]")
                        elapsed = time.time() - start_time

                        try:
                            parsed = json.loads(data_str)
                            msg = parsed.get("message", "")
                            event_data = parsed.get("data", {})
                            print(f"{DIM}[+{elapsed:5.2f}s]{RESET} {badge} {msg}")

                            if current_event_type == "STREAM_URL" and isinstance(event_data, dict):
                                url = event_data.get("stream_url")
                                if url:
                                    print(f"          🔗 Live Browser Stream URL: {CYAN}{url}{RESET}")

                            if current_event_type == "AUDIT_COMPLETE" and isinstance(event_data, dict):
                                print_audit_card(event_data)

                        except json.JSONDecodeError:
                            print(f"{DIM}[+{elapsed:5.2f}s]{RESET} {badge} {data_str}")

                        current_event_type = None

        total_time = time.time() - start_time
        print(f"{GREEN}{BOLD}🎉 Stream successfully completed! Received {events_received} event(s) in {total_time:.2f}s.{RESET}\n")

    except httpx.ConnectError:
        print(f"\n{RED}{BOLD}[ERROR] Could not connect to {base_url}.{RESET}")
        print(f"{YELLOW}Make sure the backend is running first using:{RESET}")
        print(f"  cd deal-sniper-backend")
        print(f"  uvicorn app.main:app --port 8000 --reload\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n{RED}{BOLD}[ERROR] Stream interrupted:{RESET} {e}")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DealSniper SSE Stream Test Runner")
    parser.add_argument("--url", default="http://localhost:8000", help="Base backend URL (default: http://localhost:8000)")
    parser.add_argument("--query", default="Sony WH-1000XM5", help="Product query to audit")
    parser.add_argument("--postal-code", default="560001", help="Destination postal / zip code")
    parser.add_argument("--live", action="store_true", help="Force live agent instead of mock fallback")
    args = parser.parse_args()

    run_stream_test(
        base_url=args.url,
        query=args.query,
        postal_code=args.postal_code,
        use_mock=not args.live,
    )
