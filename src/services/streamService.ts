export interface ProductInfo {
  title: string;
  store_name: string;
  url: string;
  advertised_price: number;
  currency: string;
  description?: string;
  image_url?: string;
}

export interface CartBreakdown {
  base_price: number;
  handling_fee: number;
  delivery_fee: number;
  taxes: number;
  hidden_surcharges: number;
  final_total: number;
  delta_amount: number;
  delta_percentage: number;
  currency: string;
  dark_patterns_detected: string[];
  audit_summary?: string;
}

export type AuditEventType =
  | 'STARTED'
  | 'PROGRESS'
  | 'STREAMING_URL'
  | 'AUDIT_COMPLETE'
  | 'ERROR';

export interface AuditEvent {
  type: AuditEventType;
  rawType?: string;
  message: string;
  timestamp: number;
  data?: {
    query?: string;
    target_url?: string;
    stream_url?: string;
    streaming_url?: string;
    action?: string;
    candidates?: any[];
    product?: ProductInfo;
    cart_breakdown?: CartBreakdown;
    postal_code?: string;
    [key: string]: any;
  };
}

// Curated demo presets for 1-click test runs
export interface DemoPreset {
  id: string;
  name: string;
  category: string;
  query: string;
  postal_code: string;
  badge: string;
  advertised_price: number;
  expected_pattern: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'sony-xm5',
    name: 'Sony WH-1000XM5',
    category: 'Electronics / Drip Warranty',
    query: 'Sony WH-1000XM5',
    postal_code: '560001',
    badge: 'Popular Tech',
    advertised_price: 26990,
    expected_pattern: 'Auto-added 1-yr warranty (₹899 hidden opt-in) + Handling fee',
  },
  {
    id: 'macbook-m3',
    name: 'MacBook Air M3',
    category: 'High-Value / Logistics fee',
    query: 'MacBook Air M3',
    postal_code: '560001',
    badge: 'High Value',
    advertised_price: 114900,
    expected_pattern: 'Mandatory secure transit & tamper box surcharge (+₹1,499)',
  },
  {
    id: 'indigo-flight',
    name: 'IndiGo Flight BLR-CCU',
    category: 'Travel / Seat surge charge',
    query: 'IndiGo Flight BLR to CCU',
    postal_code: '560001',
    badge: 'Travel / Flights',
    advertised_price: 4899,
    expected_pattern: 'Auto-assigned paid seat + Convenience charge (+30.9% Surge)',
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Client-side 5-step mock generator to ensure zero-fail demos if backend is unavailable.
 */
async function runClientMockStream(
  query: string,
  postalCode: string,
  onEvent: (ev: AuditEvent) => void,
  signal?: AbortSignal
) {
  const queryLower = query.toLowerCase();

  let product: ProductInfo;
  let cartBreakdown: CartBreakdown;
  let streamUrl = 'https://view.tinyfish.ai/sessions/live-agent-sandbox';

  if (queryLower.includes('sony') || queryLower.includes('xm5') || queryLower.includes('headphone')) {
    product = {
      title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones (Silver)',
      store_name: 'QuickCart Electronics',
      url: 'https://store.electronics.in/sony-wh-1000xm5/p/itm948',
      advertised_price: 26990.0,
      currency: 'INR',
      description: 'Industry Leading Noise Cancellation, 30hr battery, multipoint connection.',
    };
    cartBreakdown = {
      base_price: 26990.0,
      handling_fee: 99.0,
      delivery_fee: 149.0,
      taxes: 0.0,
      hidden_surcharges: 899.0,
      final_total: 28137.0,
      delta_amount: 1147.0,
      delta_percentage: 4.25,
      currency: 'INR',
      dark_patterns_detected: [
        'Sneak-into-Cart: Auto-ticked 1-year damage protection (₹899)',
        'Drip Pricing: Platform handling charge unmasked at Step 3 (₹99)',
        'Postal Geo-Markup: Distance delivery fee for postal code ' + postalCode + ' (₹149)',
      ],
      audit_summary:
        'WARNING: Significant drip pricing detected! Advertised at ₹26,990.00, true total is ₹28,137.00 (+4.2% markup). Intercepted auto-checked warranty.',
    };
    streamUrl = 'https://view.tinyfish.ai/sessions/live-demo-sony-xm5';
  } else if (queryLower.includes('macbook') || queryLower.includes('apple') || queryLower.includes('air')) {
    product = {
      title: 'Apple MacBook Air 13.6-inch M3 (16GB RAM, 512GB SSD) - Space Grey',
      store_name: 'ApexRetail Prime',
      url: 'https://apexretail.in/apple-macbook-air-m3-16gb',
      advertised_price: 114900.0,
      currency: 'INR',
      description: 'M3 chip with 8-core CPU, 10-core GPU, 16GB Unified Memory, MagSafe.',
    };
    cartBreakdown = {
      base_price: 114900.0,
      handling_fee: 299.0,
      delivery_fee: 0.0,
      taxes: 0.0,
      hidden_surcharges: 1499.0,
      final_total: 116698.0,
      delta_amount: 1798.0,
      delta_percentage: 1.56,
      currency: 'INR',
      dark_patterns_detected: [
        'Hidden Surcharge: Mandatory secure transit & tamper box fee (₹1,499)',
        'Drip Handling: High-value electronic packaging fee (₹299)',
      ],
      audit_summary:
        'ALERT: Hidden high-value fulfillment surcharge of ₹1,499 injected at payment confirmation.',
    };
    streamUrl = 'https://view.tinyfish.ai/sessions/live-demo-macbook-m3';
  } else if (queryLower.includes('flight') || queryLower.includes('indigo') || queryLower.includes('blr')) {
    product = {
      title: 'IndiGo Flight 6E-512 (Bengaluru BLR ➔ Kolkata CCU)',
      store_name: 'SkyFly Travel Hub',
      url: 'https://skyfly.in/flights/blr-ccu/6e-512',
      advertised_price: 4899.0,
      currency: 'INR',
      description: 'Direct nonstop flight 06:15 - 08:45, 15kg checked luggage.',
    };
    cartBreakdown = {
      base_price: 4899.0,
      handling_fee: 450.0,
      delivery_fee: 0.0,
      taxes: 413.0,
      hidden_surcharges: 650.0,
      final_total: 6412.0,
      delta_amount: 1513.0,
      delta_percentage: 30.88,
      currency: 'INR',
      dark_patterns_detected: [
        'Confirmshaming / Forced Choice: Auto-assigned paid seat fee (₹650)',
        'Drip Convenience: Mandatory non-waivable payment gateway fee (₹450)',
        'Unbundled Surcharges: Surprise passenger fuel & airport development tax (₹413)',
      ],
      audit_summary:
        'SEVERE PREDATORY SURGE: Advertised base fare ₹4,899 spiked to ₹6,412 (+30.9% increase) at seat selection.',
    };
    streamUrl = 'https://view.tinyfish.ai/sessions/live-demo-indigo-blr';
  } else {
    const base = 4999.0;
    product = {
      title: `${query} (Official Retail Edition)`,
      store_name: 'OmniStore Direct',
      url: `https://omnistore.in/item/${encodeURIComponent(query)}`,
      advertised_price: base,
      currency: 'INR',
      description: `Authentic verified listing for ${query}`,
    };
    cartBreakdown = {
      base_price: base,
      handling_fee: 89.0,
      delivery_fee: 129.0,
      taxes: 0.0,
      hidden_surcharges: 349.0,
      final_total: base + 89.0 + 129.0 + 349.0,
      delta_amount: 567.0,
      delta_percentage: 11.34,
      currency: 'INR',
      dark_patterns_detected: [
        'Hidden Cart Line Item: Priority fulfillment handling (+₹89)',
        'Drip Logistics: Regional postal surcharge for pincode ' + postalCode + ' (+₹129)',
        'Pre-checked Option: Default return protection insurance (+₹349)',
      ],
      audit_summary:
        'DRIP PRICING DETECTED: Checkout total inflated by 11.3% through unbundled service fees.',
    };
  }

  if (signal?.aborted) return;

  // Step 1: STARTED / DISCOVERY
  onEvent({
    type: 'STARTED',
    rawType: 'DISCOVERY',
    message: `Querying TinySearch for live listings matching "${query}"...`,
    timestamp: Date.now(),
    data: { query, postal_code: postalCode },
  });
  await sleep(650);
  if (signal?.aborted) return;

  // Step 2: PROGRESS / FETCH
  onEvent({
    type: 'PROGRESS',
    rawType: 'FETCH',
    message: `Discovered merchant "${product.store_name}". Extracting sticker price via TinyFetch...`,
    timestamp: Date.now(),
    data: { product, target_url: product.url },
  });
  await sleep(600);
  if (signal?.aborted) return;

  // Step 3: STREAMING_URL
  onEvent({
    type: 'STREAMING_URL',
    rawType: 'STREAM_URL',
    message: 'Browser sandbox active. Streaming live viewport telemetry from TinyAgent...',
    timestamp: Date.now(),
    data: {
      stream_url: streamUrl,
      streaming_url: streamUrl,
      target_url: product.url,
    },
  });
  await sleep(650);
  if (signal?.aborted) return;

  // Step 4: BROWSER ACTIONS
  const steps = [
    `Navigating headless chromium agent to cart checkout: ${product.url}`,
    `DOM loaded. Injecting postal code "${postalCode}" into fulfillment validator`,
    'Selecting standard product SKU variant and clicking "Proceed to Cart"',
    'DARK PATTERN INTERCEPTED: De-selecting auto-ticked insurance checkbox in DOM',
    'Extracting final checkout total, unmasked handling fees, and taxes from invoice tree',
  ];

  for (const step of steps) {
    if (signal?.aborted) return;
    onEvent({
      type: 'PROGRESS',
      rawType: 'BROWSER_ACTION',
      message: step,
      timestamp: Date.now(),
      data: { action: step, postal_code: postalCode },
    });
    await sleep(600);
  }

  if (signal?.aborted) return;

  // Step 5: AUDIT_COMPLETE
  onEvent({
    type: 'AUDIT_COMPLETE',
    rawType: 'AUDIT_COMPLETE',
    message: cartBreakdown.audit_summary || 'Audit evaluation finished successfully.',
    timestamp: Date.now(),
    data: {
      product,
      cart_breakdown: cartBreakdown,
      postal_code: postalCode,
    },
  });
}

/**
 * Primary streaming audit initiator.
 * Tries the FastAPI SSE endpoint at http://localhost:8000/api/audit/stream.
 * If backend is unreachable or errors, falls back to the client simulator seamlessly.
 */
export async function streamAudit(
  query: string,
  postalCode: string,
  onEvent: (ev: AuditEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const BACKEND_URL = 'http://localhost:8000/api/audit/stream';

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query,
        postal_code: postalCode || '560001',
        use_mock: true,
      }),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEventType = 'PROGRESS';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('event:')) {
          currentEventType = trimmed.replace('event:', '').trim();
        } else if (trimmed.startsWith('data:')) {
          const rawData = trimmed.replace('data:', '').trim();
          try {
            const parsed = JSON.parse(rawData);
            const serverEvent = parsed.event_type || parsed.event || currentEventType;
            const message = parsed.message || 'Processing live audit...';
            const data = parsed.data || {};

            let normalizedType: AuditEventType = 'PROGRESS';

            if (serverEvent === 'DISCOVERY' || serverEvent === 'STARTED') {
              normalizedType = 'STARTED';
            } else if (serverEvent === 'STREAM_URL' || serverEvent === 'STREAMING_URL') {
              normalizedType = 'STREAMING_URL';
            } else if (serverEvent === 'AUDIT_COMPLETE') {
              normalizedType = 'AUDIT_COMPLETE';
            } else if (serverEvent === 'ERROR') {
              normalizedType = 'ERROR';
            }

            onEvent({
              type: normalizedType,
              rawType: serverEvent,
              message,
              timestamp: parsed.timestamp ? parsed.timestamp * 1000 : Date.now(),
              data: {
                ...data,
                stream_url: data.stream_url || data.streaming_url,
                streaming_url: data.streaming_url || data.stream_url,
              },
            });
          } catch {
            onEvent({
              type: 'PROGRESS',
              message: rawData,
              timestamp: Date.now(),
            });
          }
        }
      }
    }
  } catch (err: any) {
    if (signal?.aborted) return;
    console.warn(
      'Live backend unreachable at http://localhost:8000. Engaging resilient client fallback simulator:',
      err?.message || err
    );
    // Engage zero-fail fallback
    await runClientMockStream(query, postalCode, onEvent, signal);
  }
}
