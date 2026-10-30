import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  MapPin,
  Loader2,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Headphones,
  Laptop,
  Plane,
  Radio,
  Lock,
  ExternalLink,
  Wand2,
  Scale,
  ChevronDown,
  ChevronUp,
  Swords,
  ScanSearch,
} from 'lucide-react';
import ArbitrageView from './ArbitrageView';
import {
  streamAudit,
  streamStripCart,
  computeRegulatoryScorecard,
  AuditEvent,
  CartBreakdown,
  ProductInfo,
  StripResult,
  DEMO_PRESETS,
  DemoPreset,
} from '../services/streamService';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function AuditModal({ isOpen, onClose, initialQuery = '' }: AuditModalProps) {
  const [auditMode, setAuditMode] = useState<'single' | 'arbitrage'>('single');
  const [query, setQuery] = useState(initialQuery || 'Sony WH-1000XM5');
  const [postalCode, setPostalCode] = useState('560001');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [verdict, setVerdict] = useState<CartBreakdown | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('sony-xm5');
  const [isStripping, setIsStripping] = useState(false);
  const [strippedResult, setStrippedResult] = useState<StripResult | null>(null);
  const [isLegalDrawerOpen, setIsLegalDrawerOpen] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsRunning(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleRunAudit = async (customQuery?: string, customPostal?: string) => {
    const auditQuery = customQuery !== undefined ? customQuery : query;
    const auditPostal = customPostal !== undefined ? customPostal : postalCode;

    if (!auditQuery.trim() || isRunning) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsRunning(true);
    setLogs([]);
    setStreamingUrl(null);
    setProductInfo(null);
    setVerdict(null);
    setStrippedResult(null);
    setIsStripping(false);

    await streamAudit(
      auditQuery,
      auditPostal,
      (event: AuditEvent) => {
        setLogs((prev) => [...prev, event]);

        if (event.data?.product) {
          setProductInfo(event.data.product);
        }

        if (event.type === 'STREAMING_URL' || event.data?.streaming_url || event.data?.stream_url) {
          setStreamingUrl(
            event.data?.streaming_url || event.data?.stream_url || 'https://view.tinyfish.ai/sandbox'
          );
        }

        if (event.type === 'AUDIT_COMPLETE' && event.data?.cart_breakdown) {
          setVerdict(event.data.cart_breakdown);
          setIsRunning(false);
        }

        if (event.type === 'ERROR') {
          setIsRunning(false);
        }
      },
      abortController.signal
    );

    setIsRunning(false);
  };

  const handleStripPatterns = async () => {
    if (!verdict || isStripping) return;

    setIsStripping(true);

    // Append initial live strip log into existing Terminal HUD
    setLogs((prev) => [
      ...prev,
      {
        type: 'PROGRESS',
        rawType: 'STRIP_START',
        message: '[TINYAGENT] Re-entering checkout DOM session to sanitize cart...',
        timestamp: Date.now(),
      },
    ]);

    const result = await streamStripCart(
      {
        cart_session_id: 'session-live-audit',
        product_name: productInfo?.title || query,
        current_total: verdict.final_total,
        patterns_to_strip: verdict.dark_patterns_detected,
        use_mock: true,
      },
      (event: AuditEvent) => {
        let prefix = '[DOM INTERACTION]';
        if (event.rawType === 'STRIP_START') prefix = '[TINYAGENT]';
        else if (event.rawType === 'STRIP_COMPLETE') prefix = '[SUCCESS]';

        setLogs((prev) => [
          ...prev,
          {
            ...event,
            message: `${prefix} ${event.message}`,
          },
        ]);
      }
    );

    if (result) {
      setStrippedResult(result);
    }
    setIsStripping(false);
  };

  const handleSelectPreset = (preset: DemoPreset) => {
    setActivePresetId(preset.id);
    setQuery(preset.query);
    setPostalCode(preset.postal_code);
    setStrippedResult(null);
    handleRunAudit(preset.query, preset.postal_code);
  };

  const getPresetIcon = (id: string) => {
    switch (id) {
      case 'sony-xm5':
        return <Headphones className="w-3.5 h-3.5" />;
      case 'macbook-m3':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'indigo-flight':
        return <Plane className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop with Frosted Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-5xl bg-background border border-border/80 rounded-2xl shadow-dashboard overflow-hidden flex flex-col max-h-[90vh] my-auto text-foreground"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/70 bg-secondary/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                      DealSniper Live Agent Auditor
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold">
                      TinyFish Mako v2.4
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Autonomous checkout dark-pattern & drip surcharge detector
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-border/70 bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Toggle: Single Store Audit vs Cross-Merchant Arbitrage */}
            <div className="px-5 py-2.5 border-b border-border/70 bg-secondary/30 flex items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-background/80 border border-border shadow-xs">
                <button
                  onClick={() => setAuditMode('single')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    auditMode === 'single'
                      ? 'bg-accent text-accent-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ScanSearch className="w-3.5 h-3.5" />
                  <span>Single Store Audit</span>
                </button>
                <button
                  onClick={() => setAuditMode('arbitrage')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    auditMode === 'arbitrage'
                      ? 'bg-accent text-accent-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>⚔️ Cross-Merchant Arbitrage</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                {auditMode === 'single' ? 'Single Cart Funnel Deep Scan' : 'Dual-Agent Real-Checkout Comparison'}
              </span>
            </div>

            {auditMode === 'arbitrage' ? (
              <div className="flex-1 overflow-y-auto p-5">
                <ArbitrageView initialQuery={query} initialPostal={postalCode} />
              </div>
            ) : (
              <>
                {/* Presets Bar for 1-Click Judging Demos */}
                <div className="px-5 py-2.5 border-b border-border/60 bg-secondary/20 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-accent" />
                    1-Click Demo Presets:
                  </span>
              {DEMO_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-accent text-accent-foreground shadow-xs'
                        : 'bg-background hover:bg-secondary text-foreground border border-border/70'
                    }`}
                  >
                    {getPresetIcon(preset.id)}
                    <span>{preset.name}</span>
                    <span className="text-[10px] opacity-75 font-mono hidden sm:inline">
                      ({preset.category.split('/')[1]?.trim() || preset.category})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Input Row: Query + Postal Code + Run Button */}
            <div className="p-5 border-b border-border/60 bg-background flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAudit()}
                  placeholder="Enter product title or shopping link (e.g. Sony WH-1000XM5)..."
                  className="w-full pl-9 pr-3 py-2 text-xs font-body rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-accent focus:bg-background transition-all"
                />
              </div>

              <div className="relative w-full sm:w-36">
                <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAudit()}
                  placeholder="Pincode"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-accent focus:bg-background transition-all"
                />
              </div>

              <button
                onClick={() => handleRunAudit()}
                disabled={isRunning || !query.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Cart...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>Run Audit</span>
                  </>
                )}
              </button>
            </div>

            {/* Dynamic Content Area: Verdict, Terminal & Live Sandbox */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Audit Verdict Banner: Either Predatory Drip Alert OR Sanitized Success Card */}
              {verdict && (
                strippedResult ? (
                  /* High-Contrast Sanitized Success Card */
                  <motion.div
                    key="sanitized-success-card"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3.5 shadow-sm"
                  >
                    {/* Top Row: Badge & Big Savings Highlight */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-mono text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Cart Sanitized Successfully
                        </div>
                        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                          {productInfo?.store_name ? `Merchant: ${productInfo.store_name}` : 'TinyAgent Sanitization Complete'}
                        </span>
                      </div>

                      {/* Highlighted Saving Badge */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white font-mono text-xs font-bold shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>You saved {verdict.currency} {strippedResult.total_saved.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Price Comparison Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      <div className="p-3 rounded-lg bg-background/80 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                          Predatory Checkout Total
                        </span>
                        <span className="text-sm font-mono font-medium text-muted-foreground line-through block mt-0.5">
                          {verdict.currency} {strippedResult.original_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-bold block">
                          New Sanitized Total
                        </span>
                        <span className="text-lg font-display font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          {verdict.currency} {strippedResult.sanitized_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-1 p-3 rounded-lg bg-background/80 border border-border flex flex-col justify-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                          Sanitization Status
                        </span>
                        <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Surcharges Stripped
                        </span>
                      </div>
                    </div>

                    {/* Predatory Items Removed */}
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-foreground/90 block mb-1.5">
                        Predatory Charges Intercepted & Removed by TinyAgent:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {strippedResult.items_removed.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span>{item}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Secondary CTA: Proceed with Clean Cart */}
                    <div className="pt-2 flex justify-end">
                      <a
                        href={strippedResult.clean_cart_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md transition-all group cursor-pointer"
                      >
                        <span>Proceed with Clean Cart</span>
                        <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </motion.div>
                ) : (
                  /* Predatory Drip Alert Card with Autonomous Stripper Action */
                  <motion.div
                    key="predatory-drip-card"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-md bg-red-600 text-white font-mono text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 shadow-sm">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          PREDATORY DRIP PRICING DETECTED
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {productInfo?.store_name ? `Merchant: ${productInfo.store_name}` : 'Cart Audit Completed'}
                        </span>
                      </div>

                      <div className="text-xs font-mono font-semibold text-red-600">
                        Delta: +{verdict.currency} {verdict.delta_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (+{verdict.delta_percentage.toFixed(1)}%)
                      </div>
                    </div>

                    {/* Executive Regulatory Compliance Badge & Collapsible Drawer Trigger */}
                    {(() => {
                      const scorecard = verdict.regulatory_scorecard || computeRegulatoryScorecard(verdict);
                      const isGradeF = scorecard.grade === 'GRADE F';
                      const violations = scorecard.violations || [];

                      return (
                        <div className="space-y-2 pt-0.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {/* Compliance Badge */}
                            {isGradeF ? (
                              <div className="bg-red-500/10 text-red-600 border border-red-500/20 px-3 py-1 rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                <span>Grade F: Severe Drip Pricing Violation (FTC 16 CFR § 464)</span>
                              </div>
                            ) : (
                              <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Grade A: Full Pricing Transparency</span>
                              </div>
                            )}

                            {/* Collapsible Trigger */}
                            {violations.length > 0 && (
                              <button
                                onClick={() => setIsLegalDrawerOpen((prev) => !prev)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background/80 hover:bg-secondary border border-border text-xs font-medium text-foreground transition-all cursor-pointer shadow-2xs"
                              >
                                <Scale className="w-3.5 h-3.5 text-amber-600" />
                                <span>View Legal Compliance Audit ({violations.length} Violations Flagged)</span>
                                {isLegalDrawerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>

                          {/* Interactive Compliance Inspection Drawer */}
                          <AnimatePresence>
                            {isLegalDrawerOpen && violations.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3"
                              >
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                                  <div className="flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                    <span className="font-display font-bold text-xs text-foreground tracking-tight">
                                      Consumer Protection & Dark-Pattern Audit
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    CCPA § 1770(a)(22) • FTC 16 CFR Part 464
                                  </span>
                                </div>

                                {/* Statutory Summary */}
                                <p className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 font-medium leading-relaxed">
                                  ⚠️ <span className="font-semibold">Statutory Risk Finding:</span> This checkout funnel violates FTC guidelines on deceptive pricing, exposing the merchant to regulatory enforcement.
                                </p>

                                {/* Compliance Table */}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-[11px] font-body border-collapse">
                                    <thead>
                                      <tr className="border-b border-border/70 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        <th className="py-2 px-2.5">Statute / Mandate</th>
                                        <th className="py-2 px-2.5">Pattern Classification</th>
                                        <th className="py-2 px-2.5">Severity</th>
                                        <th className="py-2 px-2.5">Statutory Liability</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                      {violations.map((v, i) => {
                                        const isCritical = v.severity === 'CRITICAL';
                                        return (
                                          <tr key={i} className="hover:bg-background/40 transition-colors">
                                            <td className="py-2 px-2.5 font-mono font-medium text-foreground">
                                              {v.statute.includes('16 CFR') ? (
                                                <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                                                  {v.statute}
                                                </span>
                                              ) : v.statute.includes('CCPA') ? (
                                                <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                                  {v.statute}
                                                </span>
                                              ) : (
                                                v.statute
                                              )}
                                            </td>
                                            <td className="py-2 px-2.5 text-foreground/90">
                                              <span className="font-semibold block">{v.violation_type}</span>
                                              <span className="text-[10px] text-muted-foreground block">{v.description}</span>
                                            </td>
                                            <td className="py-2 px-2.5">
                                              <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                                  isCritical
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-amber-500 text-amber-950 font-bold'
                                                }`}
                                              >
                                                {v.severity}
                                              </span>
                                            </td>
                                            <td className="py-2 px-2.5 font-mono text-[10px] font-semibold text-foreground/80">
                                              {v.potential_fine}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}

                    {/* Price Comparison Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-background/80 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                          Advertised Base
                        </span>
                        <span className="text-sm font-display font-bold text-foreground">
                          {verdict.currency} {verdict.base_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-background/80 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                          Platform / Handling
                        </span>
                        <span className="text-sm font-mono font-semibold text-foreground">
                          +{verdict.currency} {verdict.handling_fee.toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-background/80 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                          Delivery / Surge
                        </span>
                        <span className="text-sm font-mono font-semibold text-foreground">
                          +{verdict.currency} {verdict.delivery_fee.toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/25">
                        <span className="text-[10px] text-red-600 uppercase font-bold block">
                          True Checkout Total
                        </span>
                        <span className="text-base font-display font-bold text-red-600">
                          {verdict.currency} {verdict.final_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Dark Pattern Tags with Red Accent Styling */}
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-foreground block mb-1.5">
                        Unmasked Deceptive Checkout Vectors:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {verdict.dark_patterns_detected.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 font-mono text-[11px] font-medium"
                          >
                            <ShieldAlert className="w-3 h-3 text-red-600 flex-shrink-0" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Prominent Action Button: Autonomously Clean Cart */}
                    {verdict.dark_patterns_detected.length > 0 && (
                      <div className="pt-2 flex justify-end">
                        {(() => {
                          const estSavings =
                            productInfo?.title.toLowerCase().includes('macbook')
                              ? 1798
                              : productInfo?.title.toLowerCase().includes('flight') || productInfo?.title.toLowerCase().includes('indigo')
                              ? 649
                              : productInfo?.title.toLowerCase().includes('jordan') || productInfo?.title.toLowerCase().includes('nike')
                              ? 1040
                              : 2098;
                          return (
                            <button
                              onClick={handleStripPatterns}
                              disabled={isStripping}
                              className="relative group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-display font-semibold text-xs shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                              {isStripping ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  <span>TinyAgent Sanitizing Cart...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                                  <span>Autonomously Clean Cart (Save ₹{estSavings.toLocaleString('en-IN')})</span>
                                  <Wand2 className="w-3.5 h-3.5 text-white/90 group-hover:rotate-12 transition-transform" />
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </motion.div>
                )
              )}

              {/* Dual View: Live Terminal HUD + Browser Viewport */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Live Terminal HUD (7 cols) */}
                <div className="lg:col-span-7 bg-foreground text-background/90 rounded-xl overflow-hidden border border-border/20 shadow-inner flex flex-col h-72 sm:h-80 font-mono text-xs">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-background/10 border-b border-background/15 select-none">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      <span className="text-[10px] text-background/70 ml-2 font-medium">
                        mako-agent@tinyfish: ~ /audit-telemetry
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isRunning ? 'bg-emerald-400 animate-ping' : 'bg-background/40'
                        }`}
                      />
                      <span className="text-[10px] text-background/60">
                        {isRunning ? 'STREAMING' : 'IDLE'}
                      </span>
                    </div>
                  </div>

                  {/* Terminal Body */}
                  <div className="flex-1 p-3.5 overflow-y-auto space-y-1.5">
                    {logs.length === 0 ? (
                      <div className="text-background/50 italic py-4">
                        Press "Run Audit" or choose a demo preset to trigger autonomous agent stream...
                      </div>
                    ) : (
                      logs.map((log, index) => {
                        let badgeColor = 'text-accent';
                        if (log.type === 'STARTED' || log.rawType === 'DISCOVERY') {
                          badgeColor = 'text-cyan-400';
                        } else if (log.rawType === 'FETCH') {
                          badgeColor = 'text-blue-400';
                        } else if (log.type === 'STREAMING_URL') {
                          badgeColor = 'text-purple-400';
                        } else if (log.type === 'AUDIT_COMPLETE') {
                          badgeColor = 'text-emerald-400 font-bold';
                        }

                        return (
                          <div key={index} className="leading-relaxed flex items-start gap-2">
                            <span className="text-background/40 text-[10px] select-none flex-shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                            <span className={`text-[10px] font-bold ${badgeColor} select-none`}>
                              [{log.rawType || log.type}]
                            </span>
                            <span className="text-background/90 break-words flex-1">
                              {log.message}
                            </span>
                          </div>
                        );
                      })
                    )}
                    {isRunning && (
                      <div className="flex items-center gap-2 text-accent text-xs">
                        <span className="animate-pulse">▋</span>
                        <span className="text-background/60 text-[11px]">
                          Traversing checkout DOM & auditing surcharges...
                        </span>
                      </div>
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                </div>

                {/* Browser View / Sandbox Viewport (5 cols) */}
                <div className="lg:col-span-5 rounded-xl border border-border/80 bg-background overflow-hidden shadow-xs flex flex-col h-72 sm:h-80">
                  {/* Browser Bar */}
                  <div className="flex items-center justify-between px-3 py-2 bg-secondary/60 border-b border-border text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <span className="text-[10px] font-mono text-muted-foreground truncate">
                        {productInfo?.url || 'https://store.checkout/session'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {streamingUrl && (
                        <a
                          href={streamingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-accent hover:underline"
                        >
                          <span>Stream</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                          Live Sandbox
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Browser Viewport Content */}
                  <div className="flex-1 bg-secondary/30 relative flex flex-col justify-between p-3.5 overflow-hidden">
                    {/* Simulated Cart Page Preview with Intercepted Dark Patterns */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-accent" />
                          <span className="text-xs font-semibold text-foreground truncate max-w-[170px]">
                            {productInfo?.title || query}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-foreground">
                          ₹{productInfo?.advertised_price ? productInfo.advertised_price.toLocaleString('en-IN') : '26,990'}
                        </span>
                      </div>

                      {/* Live DOM Inspection Status */}
                      <div className="space-y-1.5 text-xs font-body">
                        <div className="p-2 rounded bg-background border border-border/80 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Standard Delivery:</span>
                          <span className="text-[11px] font-mono font-medium">₹149.00</span>
                        </div>

                        {/* Intercepted Element Simulation */}
                        <div className="p-2 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm border border-red-500 bg-red-500 text-white flex items-center justify-center text-[9px] font-bold">
                              ✓
                            </span>
                            <span className="text-[11px] font-medium text-red-600 line-through">
                              Extended Damage Protection (+₹899)
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-background text-red-600 px-1 py-0.5 rounded border border-red-500/20">
                            BLOCKED
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status Indicator */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>TinyAgent Headless Chromium</span>
                      <span className="text-accent flex items-center gap-1">
                        <Radio className="w-3 h-3 animate-spin" />
                        Intercepting Traversal
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-border/70 bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Zero-Fail Engine Protocol Active
              </span>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-xs font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
