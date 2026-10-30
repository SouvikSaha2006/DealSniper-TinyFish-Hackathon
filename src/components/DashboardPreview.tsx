import {
  Activity,
  Layers,
  ShieldAlert,
  Database,
  Radio,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Search,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPreview() {
  return (
    <div
      className="w-full max-w-5xl rounded-2xl overflow-hidden p-3 md:p-4 select-none pointer-events-none"
      style={{
        background: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: 'var(--shadow-dashboard)',
      }}
    >
      {/* Inner Window Shell */}
      <div className="bg-white/85 dark:bg-zinc-950/80 rounded-xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden text-[11px] font-body text-foreground">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/80 bg-secondary/50">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-primary text-primary-foreground font-display font-bold flex items-center justify-center text-xs shadow-sm">
              D
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-foreground text-xs">
                DealSniper Live Agent HUD
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                / session-8491-live
              </span>
            </div>
          </div>

          {/* Search / Target URL Input */}
          <div className="flex items-center gap-2 bg-background/90 border border-border px-3 py-1 rounded-md shadow-inner max-w-xs sm:max-w-md w-full mx-2">
            <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            <span className="text-muted-foreground truncate font-mono text-[10px]">
              https://store.electronics.in/cart/checkout
            </span>
            <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground bg-secondary rounded border border-border">
              ⌘K
            </kbd>
          </div>

          {/* Live Status Pill */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Agent Live: #TF-9821</span>
            </div>
          </div>
        </div>

        {/* Content Workspace: Sidebar + Main Area */}
        <div className="flex flex-col md:flex-row">
          {/* Sidebar (w-44) */}
          <aside className="w-full md:w-44 border-b md:border-b-0 md:border-r border-border/70 p-3 bg-secondary/30 flex-shrink-0 space-y-4">
            {/* Section 1: Auditor Controls */}
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Auditor Controls
              </div>
              <ul className="space-y-1">
                <li className="flex items-center justify-between px-2 py-1.5 rounded bg-background text-foreground shadow-xs font-medium border border-border/60">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-accent" />
                    <span>Active Telemetry</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </li>
                <li className="flex items-center justify-between px-2 py-1.5 rounded text-muted-foreground hover:text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    <span>Cart Sandboxes</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">4</span>
                </li>
                <li className="flex items-center justify-between px-2 py-1.5 rounded text-muted-foreground hover:text-foreground">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3 text-amber-500" />
                    <span>Dark Patterns</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-500/10 text-red-600 font-mono font-bold border border-red-500/20">
                    3
                  </span>
                </li>
                <li className="flex items-center justify-between px-2 py-1.5 rounded text-muted-foreground hover:text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3 h-3" />
                    <span>TinyFetch Cache</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-mono font-medium">99%</span>
                </li>
              </ul>
            </div>

            {/* Section 2: Tracked Vectors */}
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Tracked Vectors
              </div>
              <div className="space-y-1 text-muted-foreground">
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <span className="w-1 h-1 rounded-full bg-accent" />
                  <span>Drip Price Surcharge</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <span className="w-1 h-1 rounded-full bg-accent" />
                  <span>Pre-checked Addons</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <span className="w-1 h-1 rounded-full bg-accent" />
                  <span>Postal Geo-Surge</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Area */}
          <div className="flex-1 p-3.5 space-y-3 bg-background/50">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground tracking-tight">
                  Target: Sony WH-1000XM5 (Silver)
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  SKU: SNY-XM5-SLV
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent text-[10px] font-medium font-mono">
                  <Radio className="w-2.5 h-2.5" />
                  DOM Traversal
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-600 text-[10px] font-medium font-mono">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  Drip Auditor
                </span>
              </div>
            </div>

            {/* Grid: Card 1 (Price Delta) + Card 2 (Unmasked Surcharges) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Card 1: Price Delta & Surcharge Trajectory */}
              <div className="lg:col-span-7 bg-background rounded-lg border border-border p-3 space-y-2.5 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                      True Cart Total
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tight">
                        ₹28,447.00
                      </span>
                      <span className="text-[10px] text-muted-foreground line-through font-mono">
                        Base: ₹24,990.00
                      </span>
                    </div>
                  </div>

                  {/* Delta Badge */}
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/25 text-red-600 font-mono text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>+₹3,457.00 (+13.8% Drip Markup)</span>
                  </div>
                </div>

                {/* Custom SVG Area Chart */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono mb-1">
                    <span>Funnel Step 1 (Browse)</span>
                    <span>Step 2 (Cart)</span>
                    <span className="text-red-500 font-semibold">Step 3 (Hidden Surcharges)</span>
                  </div>
                  <div className="relative w-full h-16 bg-secondary/30 rounded border border-border/40 overflow-hidden">
                    <svg
                      viewBox="0 0 300 80"
                      preserveAspectRatio="none"
                      className="w-full h-full overflow-visible"
                    >
                      <defs>
                        <linearGradient id="surchargeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Area Under Curve */}
                      <path
                        d="M 0 65 C 50 65, 80 50, 130 50 C 180 50, 220 20, 300 12 L 300 80 L 0 80 Z"
                        fill="url(#surchargeGradient)"
                      />
                      {/* Cubic Bézier Trajectory Line */}
                      <path
                        d="M 0 65 C 50 65, 80 50, 130 50 C 180 50, 220 20, 300 12"
                        fill="none"
                        stroke="hsl(var(--accent))"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                      {/* Peak indicator dot */}
                      <circle cx="300" cy="12" r="3.5" fill="hsl(var(--accent))" />
                      <circle
                        cx="300"
                        cy="12"
                        r="6.5"
                        fill="hsl(var(--accent))"
                        opacity="0.3"
                        className="animate-ping"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2: Unmasked Surcharges */}
              <div className="lg:col-span-5 bg-background rounded-lg border border-border p-3 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                    <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3 h-3 text-red-500" />
                      Unmasked Surcharges (3)
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">Intercepted</span>
                  </div>

                  <ul className="mt-2 space-y-2">
                    <li className="flex items-center justify-between p-1.5 rounded bg-secondary/50 border border-border/40">
                      <div>
                        <div className="font-medium text-foreground">Opt-in Care Protection</div>
                        <div className="text-[9px] text-muted-foreground font-mono">
                          Pre-ticked addon (Auto-checked)
                        </div>
                      </div>
                      <span className="font-mono font-bold text-red-600">+₹1,999</span>
                    </li>

                    <li className="flex items-center justify-between p-1.5 rounded bg-secondary/50 border border-border/40">
                      <div>
                        <div className="font-medium text-foreground">Step 3 Handling Fee</div>
                        <div className="text-[9px] text-muted-foreground font-mono">
                          Drip line item (Post-address)
                        </div>
                      </div>
                      <span className="font-mono font-bold text-red-600">+₹99</span>
                    </li>

                    <li className="flex items-center justify-between p-1.5 rounded bg-secondary/50 border border-border/40">
                      <div>
                        <div className="font-medium text-foreground">Dynamic Pincode Surge</div>
                        <div className="text-[9px] text-muted-foreground font-mono">
                          Surge markup on postal 560001
                        </div>
                      </div>
                      <span className="font-mono font-bold text-red-600">+₹149</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 text-[9px] text-muted-foreground font-mono flex items-center justify-between border-t border-border/40 mt-2">
                  <span>Audit Confidence</span>
                  <span className="text-emerald-600 font-bold">99.8% Deterministic</span>
                </div>
              </div>
            </div>

            {/* Live Action Table (3 rows) */}
            <div className="bg-background rounded-lg border border-border overflow-hidden shadow-2xs">
              <div className="px-3 py-1.5 bg-secondary/40 border-b border-border/60 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                <span className="uppercase tracking-wider">Engine Execution Stream</span>
                <span className="font-mono">TinyFish Mako v2.4</span>
              </div>
              <div className="divide-y divide-border/60">
                {/* Row 1: TinySearch */}
                <div className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-16 font-mono font-semibold text-accent flex items-center gap-1">
                      <Search className="w-3 h-3 text-accent" />
                      TinySearch
                    </span>
                    <span className="text-muted-foreground truncate">
                      Resolved product landing & direct checkout entrypoint
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-muted-foreground text-[10px]">0.38s</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 text-[9px] font-mono font-semibold">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      COMPLETED
                    </span>
                  </div>
                </div>

                {/* Row 2: TinyFetch */}
                <div className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-16 font-mono font-semibold text-accent flex items-center gap-1">
                      <ExternalLink className="w-3 h-3 text-accent" />
                      TinyFetch
                    </span>
                    <span className="text-muted-foreground truncate">
                      Intercepted postal code pricing API <code className="font-mono text-[10px] bg-secondary px-1 py-0.5 rounded">/v2/shipping/quote</code>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-muted-foreground text-[10px]">0.61s</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 text-[9px] font-mono font-semibold">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      COMPLETED
                    </span>
                  </div>
                </div>

                {/* Row 3: TinyAgent Live */}
                <div className="px-3 py-2 flex items-center justify-between gap-3 bg-accent/5 hover:bg-accent/10 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-16 font-mono font-semibold text-accent flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-accent animate-spin" />
                      TinyAgent
                    </span>
                    <span className="text-foreground font-medium truncate">
                      Autonomous DOM traversal: de-selecting hidden warranty box & auditing delta
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-accent text-[10px] font-medium">Live</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-accent/15 text-accent text-[9px] font-mono font-bold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      STREAMING
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
