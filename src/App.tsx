import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ScanSearch,
  Eye,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('Live Scanner');

  const navLinks = [
    { label: 'Live Scanner', icon: ScanSearch },
    { label: 'Drip Detection', icon: AlertTriangle },
    { label: 'Benchmarks', icon: Eye },
    { label: 'API', icon: Zap },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative selection:bg-accent/20">
      {/* Fullscreen looping background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 pointer-events-none"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
      />

      {/* Atmospheric Vignette & Contrast Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/90 pointer-events-none z-[1]" />

      {/* Navigation Header */}
      <header className="relative z-20 w-full border-b border-border/70 bg-background/75 backdrop-blur-md px-6 lg:px-10 py-3.5 flex items-center justify-between transition-all">
        {/* Left: Brand & TinyFish Badge */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2 group cursor-pointer">
            <span className="text-accent text-lg animate-pulse">✦</span>
            <span className="font-display text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-accent">
              DealSniper
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-body bg-accent/10 border border-accent/25 text-accent shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            <span>TinyFish Mako Engine</span>
          </div>
        </div>

        {/* Center/Right: Navigation Links & Launch Auditor CTA */}
        <div className="flex items-center gap-1 sm:gap-6">
          <nav className="hidden md:flex items-center gap-1 bg-secondary/80 p-1 rounded-lg border border-border/60">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button className="relative group inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-body text-xs font-semibold tracking-wide shadow-sm hover:bg-primary/90 active:scale-95 transition-all">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Launch Auditor</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Viewport Content Scaffold */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl w-full flex flex-col items-center text-center space-y-6"
        >
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-background/80 backdrop-blur-sm text-xs font-medium text-foreground shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-accent" />
            <span>Autonomous Checkout Dark-Pattern Auditing</span>
            <span className="text-border">|</span>
            <span className="text-muted-foreground font-mono">v1.0-alpha</span>
          </div>

          {/* Typography Showcase with Instrument Serif & Inter */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-normal tracking-tight text-foreground leading-[1.08]">
              Neutralize sneaky fees <br />
              <span className="italic font-normal text-accent underline decoration-accent/30 decoration-wavy underline-offset-8">
                before they reach checkout.
              </span>
            </h1>
            <p className="font-body text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed pt-2">
              Powered by TinyFish Mako web-agent orchestration. DealSniper autonomously navigates
              multistep purchase flows, exposes deceptive drip pricing, pre-checked add-ons, and hidden service charges.
            </p>
          </div>

          {/* Dashboard Preview Card using shadow-dashboard & design tokens */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="w-full mt-4 bg-background/85 backdrop-blur-xl border border-border rounded-xl p-6 shadow-dashboard text-left space-y-5"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <ScanSearch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-body font-semibold text-sm text-foreground">
                    Active Inspection Pipeline
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Multi-turn checkout journey auditor powered by TinyFish API
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-mono font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Tokens Loaded
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-mono font-medium">
                  <Lock className="w-3.5 h-3.5 text-accent" />
                  Zero-Tamper SSL
                </span>
              </div>
            </div>

            {/* Quick Metrics / Dark-Pattern Detection Categories Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              {[
                { label: 'Drip Pricing', desc: 'Hidden checkout fees', stat: '98.4%', badge: 'Active' },
                { label: 'Sneak into Cart', desc: 'Pre-checked warranties', stat: 'Zero-loss', badge: 'Active' },
                { label: 'Fake Urgency', desc: 'Artificial countdowns', stat: 'Real-time', badge: 'Active' },
                { label: 'Confirmshaming', desc: 'Manipulative opt-outs', stat: 'Flagged', badge: 'Active' },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="p-3.5 rounded-lg bg-secondary/60 border border-border/50 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mb-1">
                    <span>{metric.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-background text-accent border border-accent/20 font-mono">
                      {metric.badge}
                    </span>
                  </div>
                  <div className="font-display text-xl font-bold text-foreground">
                    {metric.stat}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {metric.desc}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="relative z-20 w-full border-t border-border/60 bg-background/70 backdrop-blur-sm px-6 py-2.5 flex items-center justify-between text-xs text-muted-foreground font-body">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Mako Engine Node: Online
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span className="hidden sm:inline text-[11px]">Autonomous Dark-Pattern Interceptor</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Phase 1 Design System Initialized</span>
        </div>
      </footer>
    </div>
  );
}
