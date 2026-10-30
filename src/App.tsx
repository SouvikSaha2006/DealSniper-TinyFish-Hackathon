import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Play,
  ArrowRight,
  Sparkles,
  ScanSearch,
  AlertTriangle,
  Eye,
  Zap,
} from 'lucide-react';
import DashboardPreview from './components/DashboardPreview';
import AuditModal from './components/AuditModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('Live Scanner');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPresetQuery, setSelectedPresetQuery] = useState('Sony WH-1000XM5');

  const navLinks = [
    { label: 'Live Scanner', icon: ScanSearch },
    { label: 'Drip Detection', icon: AlertTriangle },
    { label: 'Benchmarks', icon: Eye },
    { label: 'API', icon: Zap },
  ];

  const handleOpenAuditor = (presetQuery?: string) => {
    if (presetQuery) {
      setSelectedPresetQuery(presetQuery);
    }
    setIsModalOpen(true);
  };

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
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/95 pointer-events-none z-[1]" />

      {/* Navigation Header */}
      <header className="relative z-20 w-full border-b border-border/70 bg-background/75 backdrop-blur-md px-6 lg:px-10 py-3.5 flex items-center justify-between transition-all">
        {/* Left: Brand & TinyFish Badge */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handleOpenAuditor()}>
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
        <div className="flex items-center gap-2 sm:gap-6">
          <nav className="hidden md:flex items-center gap-1 bg-secondary/80 p-1 rounded-lg border border-border/60">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveTab(item.label);
                    if (item.label === 'Live Scanner') {
                      handleOpenAuditor();
                    }
                  }}
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

          <button
            onClick={() => handleOpenAuditor()}
            className="relative group inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-body text-xs font-semibold tracking-wide shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Launch Auditor</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Viewport Content Scaffold with Clean Bottom Overflow Clipping */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-start text-center pt-5 sm:pt-8 md:pt-10 px-4 sm:px-6 overflow-hidden">
        {/* Hero Section Container */}
        <div className="max-w-4xl w-full flex flex-col items-center space-y-4 flex-shrink-0">
          {/* Badge: fade up from y:10, duration 0.5s */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/80 bg-background/80 backdrop-blur-sm text-xs font-medium text-foreground shadow-xs cursor-pointer hover:border-accent/40 transition-colors"
            onClick={() => handleOpenAuditor()}
          >
            <span>Autonomous Checkout Dark-Pattern Detection ✨</span>
          </motion.div>

          {/* Headline: fade up from y:16, duration 0.6s, delay 0.1s */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-foreground leading-[1.08] max-w-3xl"
          >
            Expose the <span className="italic font-normal">hidden</span> cost of checkout.
          </motion.h1>

          {/* Subheadline: fade up from y:16, duration 0.6s, delay 0.2s */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-body text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            TinyFish web agents navigate dynamic cart funnels, enter postal codes, bypass pre-ticked add-ons, and audit true checkout totals in real time.
          </motion.p>

          {/* CTA Row: Primary pill button & circular Play/Demo button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-3 pt-1"
          >
            {/* Primary pill button "Audit a Checkout" with ArrowUpRight */}
            <button
              onClick={() => handleOpenAuditor()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-body text-xs sm:text-sm font-semibold tracking-wide shadow-md hover:bg-primary/90 active:scale-95 transition-all group"
            >
              <span>Audit a Checkout</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            {/* Circular Play/Demo button with hover scale */}
            <button
              onClick={() => handleOpenAuditor('Sony WH-1000XM5')}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background/80 backdrop-blur-sm text-foreground shadow-xs hover:scale-110 active:scale-95 hover:border-accent/50 hover:text-accent transition-all duration-200 group"
              title="Watch Live Auditor Demo"
              aria-label="Watch Live Auditor Demo"
            >
              <Play className="w-4 h-4 fill-current ml-0.5 group-hover:text-accent transition-colors" />
            </button>
          </motion.div>
        </div>

        {/* Coded Dashboard Preview HUD: Clean overflow towards bottom */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex justify-center mt-5 sm:mt-7 flex-shrink-0 cursor-pointer"
          onClick={() => handleOpenAuditor()}
          title="Click to launch interactive live auditor"
        >
          <DashboardPreview />
        </motion.div>
      </main>

      {/* Interactive Execution Modal */}
      <AuditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialQuery={selectedPresetQuery}
      />
    </div>
  );
}
