import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Swords,
  Search,
  MapPin,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Award,
} from 'lucide-react';
import { streamArbitrage, ArbitrageResult, AuditEvent } from '../services/streamService';

interface ArbitrageViewProps {
  initialQuery?: string;
  initialPostal?: string;
}

export default function ArbitrageView({
  initialQuery = 'Sony WH-1000XM5',
  initialPostal = '560001',
}: ArbitrageViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [postalCode, setPostalCode] = useState(initialPostal);
  const [isRunning, setIsRunning] = useState(false);
  const [laneALogs, setLaneALogs] = useState<string[]>([]);
  const [laneBLogs, setLaneBLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ArbitrageResult | null>(null);

  const laneARef = useRef<HTMLDivElement>(null);
  const laneBRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    laneARef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [laneALogs]);

  useEffect(() => {
    laneBRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [laneBLogs]);

  const handleRunArbitrage = async () => {
    if (!query.trim() || isRunning) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsRunning(true);
    setLaneALogs(['[INITIALIZING] Deploying TinyAgent Worker 1 to Apex Retail...']);
    setLaneBLogs(['[INITIALIZING] Deploying TinyAgent Worker 2 to Official Direct...']);
    setResult(null);

    const arbitrageData = await streamArbitrage(
      {
        query,
        postal_code: postalCode,
        use_mock: true,
      },
      (event: AuditEvent) => {
        const rawType = event.rawType || '';
        const msg = event.message || '';

        if (rawType === 'AGENT_STREAM_A') {
          setLaneALogs((prev) => [...prev, `[APEX RETAIL] ${msg}`]);
        } else if (rawType === 'AGENT_STREAM_B') {
          setLaneBLogs((prev) => [...prev, `[OFFICIAL DIRECT] ${msg}`]);
        } else if (rawType === 'ARBITRAGE_DISCOVERY' || rawType === 'MERCHANT_ASSIGNMENT') {
          setLaneALogs((prev) => [...prev, `[DISCOVERY] ${msg}`]);
          setLaneBLogs((prev) => [...prev, `[DISCOVERY] ${msg}`]);
        } else if (rawType === 'ARBITRAGE_COMPLETE' && event.data?.result) {
          setResult(event.data.result as ArbitrageResult);
          setIsRunning(false);
        }
      },
      abortController.signal
    );

    if (arbitrageData) {
      setResult(arbitrageData);
    }
    setIsRunning(false);
  };

  return (
    <div className="space-y-5">
      {/* Search & Pincode Input Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-secondary/50 p-2 rounded-xl border border-border">
        {/* Product Query */}
        <div className="flex-1 flex items-center gap-2 bg-background/90 border border-border px-3 py-2 rounded-lg shadow-inner">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunArbitrage()}
            placeholder="Product to compare across merchants..."
            className="w-full bg-transparent border-none text-xs focus:outline-none placeholder:text-muted-foreground font-medium text-foreground"
          />
        </div>

        {/* Postal Code */}
        <div className="flex items-center gap-1.5 bg-background/90 border border-border px-3 py-2 rounded-lg shadow-inner sm:w-36">
          <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Pincode"
            className="w-full bg-transparent border-none text-xs focus:outline-none font-mono font-medium text-foreground"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleRunArbitrage}
          disabled={isRunning || !query.trim()}
          className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Simultaneous Audit Running...</span>
            </>
          ) : (
            <>
              <Swords className="w-3.5 h-3.5" />
              <span>Audit Competing Checkouts</span>
            </>
          )}
        </button>
      </div>

      {/* Dual-lane Live Telemetry Streams (When running or when logs exist) */}
      {(isRunning || laneALogs.length > 0) && !result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              Dual-Lane Autonomous Browser Telemetry
            </span>
            <span className="font-mono text-[10px]">Concurrent Workers #1 & #2</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-mono text-xs">
            {/* Lane A: Apex Retail (Bait Trap) */}
            <div className="bg-foreground text-background/90 rounded-xl overflow-hidden border border-red-500/30 flex flex-col h-56 shadow-inner">
              <div className="flex items-center justify-between px-3 py-1.5 bg-red-950/40 border-b border-red-500/20 text-red-400 text-[11px] font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Agent 1: Apex Retail (Bait Trap)
                </span>
                <span className="text-[10px] bg-red-500/20 px-2 py-0.5 rounded text-red-300">
                  Search: ₹23,999
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1 text-[11px]">
                {laneALogs.map((log, i) => (
                  <div key={i} className="text-red-200/90 leading-relaxed">
                    <span className="text-red-400/60 mr-1.5">›</span>
                    {log}
                  </div>
                ))}
                <div ref={laneARef} />
              </div>
            </div>

            {/* Lane B: Official Direct (Honest Store) */}
            <div className="bg-foreground text-background/90 rounded-xl overflow-hidden border border-emerald-500/30 flex flex-col h-56 shadow-inner">
              <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-950/40 border-b border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Agent 2: Official Direct (Honest Store)
                </span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                  Search: ₹25,499
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1 text-[11px]">
                {laneBLogs.map((log, i) => (
                  <div key={i} className="text-emerald-200/90 leading-relaxed">
                    <span className="text-emerald-400/60 mr-1.5">›</span>
                    {log}
                  </div>
                ))}
                <div ref={laneBRef} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Cards & Executive Arbitrage Banner */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-4"
        >
          {/* Executive Arbitrage Verdict Banner */}
          <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-display font-bold text-sm tracking-tight text-emerald-800 dark:text-emerald-300">
                  Arbitrage Discovery: Search Listings Were Deceptive
                </h3>
              </div>
              <p className="text-xs text-foreground/90 font-medium">
                Apex Retail appeared <span className="line-through text-muted-foreground font-mono">₹1,500 cheaper</span> in Google Search snippets, but TinyAgent discovered you save{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹{result.arbitrage_delta.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>{' '}
                by checking out on Official Direct.
              </p>
            </div>

            <a
              href="https://store.electronics.in/cart/checkout?ref=dealsniper_arbitrage_win"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md transition-colors flex-shrink-0 cursor-pointer"
            >
              <span>Buy at True Lowest Price (Official Direct)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Dual Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Merchant A (Apex Retail - The Bait Trap) */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-red-500/20 pb-2.5">
                <div>
                  <h4 className="font-display font-bold text-sm text-foreground">
                    {result.merchant_a.merchant_name}
                  </h4>
                  <span className="text-[10px] text-muted-foreground">The Deceptive Bait Funnel</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-600 text-white">
                  {result.merchant_a.compliance_grade}: Drip Trap
                </span>
              </div>

              {/* Price Highlights */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-background/80 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Advertised Search
                  </span>
                  <span className="text-sm font-mono font-medium text-muted-foreground line-through">
                    ₹{result.merchant_a.advertised_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-red-600 block font-semibold mt-0.5">
                    (Seemed Cheaper)
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                  <span className="text-[10px] text-red-600 uppercase font-bold block">
                    True Checkout Total
                  </span>
                  <span className="text-base font-display font-bold text-red-600">
                    ₹{result.merchant_a.final_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-red-700 dark:text-red-400 block font-semibold mt-0.5">
                    (+16.0% Inflated)
                  </span>
                </div>
              </div>

              {/* Itemized Fee Breakdown */}
              <div className="space-y-1.5 pt-1 text-[11px] font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Product Price</span>
                  <span>₹{result.merchant_a.base_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>+ Distance Shipping Surcharge</span>
                  <span>+₹{result.merchant_a.shipping_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>+ Mandatory Handling Platform Fee</span>
                  <span>+₹{result.merchant_a.convenience_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>+ Auto-Checked Warranty & Surcharges</span>
                  <span>+₹{result.merchant_a.tax_and_surcharges.toFixed(2)}</span>
                </div>
              </div>

              {/* Flagged Vectors */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-foreground/80 block mb-1">
                  Deceptive Vectors Intercepted:
                </span>
                <div className="flex flex-wrap gap-1">
                  {result.merchant_a.dark_patterns.map((p, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 border border-red-500/25 text-red-700 dark:text-red-300 font-mono text-[10px]"
                    >
                      <ShieldAlert className="w-3 h-3 text-red-600" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Card: Merchant B (Official Direct - The Honest Store) */}
            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3.5 relative">
              {/* True Winner Pill */}
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-display font-bold text-sm text-foreground">
                      {result.merchant_b.merchant_name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-amber-950 font-mono flex items-center gap-1 shadow-xs">
                      ★ TRUE WINNER
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
                    Transparent Upfront Merchant
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-600 text-white">
                  {result.merchant_b.compliance_grade}: Clean
                </span>
              </div>

              {/* Price Highlights */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-background/80 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Advertised Search
                  </span>
                  <span className="text-sm font-mono font-medium text-foreground">
                    ₹{result.merchant_b.advertised_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-muted-foreground block font-medium mt-0.5">
                    (Initially Higher)
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-bold block">
                    True Checkout Total
                  </span>
                  <span className="text-base font-display font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{result.merchant_b.final_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-300 block font-semibold mt-0.5">
                    (₹0 Surcharges Added)
                  </span>
                </div>
              </div>

              {/* Itemized Fee Breakdown */}
              <div className="space-y-1.5 pt-1 text-[11px] font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Product Price</span>
                  <span>₹{result.merchant_b.base_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>✓ Free Fast Delivery</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>✓ Platform Convenience Fee</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>✓ Mandatory Insurance Surcharge</span>
                  <span>₹0.00</span>
                </div>
              </div>

              {/* Clean Transparency Tag */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-foreground/80 block mb-1">
                  Checkout Integrity Audit:
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Full Pricing Transparency: Zero deceptive add-ons or cart markup
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
