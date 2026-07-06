"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu, X, LayoutDashboard, BarChart3, Wallet, Target, Repeat2, Users,
  BrainCircuit, Shield, ChevronRight, Star, Check,
} from "lucide-react";

const FEATURES = [
  { icon: LayoutDashboard, title: "Dashboard", desc: "At-a-glance view of your net worth, spending, and financial health in real time." },
  { icon: BarChart3, title: "Analytics", desc: "Interactive charts — pie, bar, area, heatmap — with CSV/PDF export." },
  { icon: Wallet, title: "Budgets", desc: "Per-category budgets with smart reallocation suggestions." },
  { icon: Target, title: "Goals", desc: "Track savings goals with AI-powered ETA predictions." },
  { icon: Repeat2, title: "Subscriptions", desc: "Track recurring bills, get renewal reminders, pause what you don't need." },
  { icon: Users, title: "Group Splits", desc: "Split expenses equally or by percentage, track balances, settle up." },
  { icon: BrainCircuit, title: "Insights Engine", desc: "12 rule-based alerts — anomalies, trends, impulse risk, and more." },
  { icon: Shield, title: "Privacy First", desc: "100% local. SQLite on your machine. No cloud, no tracking, no AI APIs." },
];

const PRICING = [
  {
    tier: "Free",
    price: "₹0",
    period: "forever",
    desc: "Perfect for individuals getting started.",
    features: [
      "Unlimited transactions",
      "8 analytics charts",
      "5 active budgets",
      "10 savings goals",
      "12 insight rules",
      "Group splits (up to 5 members)",
    ],
    cta: "Get Started Free",
    featured: false,
  },
  {
    tier: "Premium",
    price: "₹499",
    period: "/year",
    desc: "For power users who want more.",
    features: [
      "Everything in Free",
      "Unlimited budgets",
      "Unlimited goals",
      "Unlimited group members",
      "Priority insights engine",
      "CSV/PDF export",
      "Multi-currency support",
    ],
    cta: "Go Premium",
    featured: true,
  },
];

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleDemoLogin() {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@wealthwise.app",
          password: "Demo@1234",
          rememberMe: false,
        }),
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {} finally {
      setDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-monochrome-100/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-monochrome-900">
            ◆ WealthWise
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-monochrome-600 hover:text-black transition-colors">
                {l.label}
              </a>
            ))}
            <div className="flex items-center gap-2 ml-4">
              <Link href="/login" className="text-sm text-monochrome-700 hover:text-black px-3 py-2 transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                Sign Up Free
              </Link>
            </div>
          </nav>

          <button className="md:hidden text-monochrome-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-monochrome-200 bg-white overflow-hidden animate-slide-down">
            <div className="px-4 py-4 space-y-3">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="block text-sm text-monochrome-600 hover:text-black" onClick={() => setMobileMenuOpen(false)}>
                  {l.label}
                </a>
              ))}
              <div className="pt-2 border-t border-monochrome-100 space-y-2">
                <Link href="/login" className="block text-center text-sm text-monochrome-700 py-2" onClick={() => setMobileMenuOpen(false)}>
                  Log In
                </Link>
                <Link href="/signup" className="block text-center btn-primary" onClick={() => setMobileMenuOpen(false)}>
                  Sign Up Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-20 md:pt-32 md:pb-28 text-center slide-in-stagger">
        <div className="inline-flex items-center gap-1.5 bg-monochrome-100 border border-monochrome-200 rounded-full px-3 py-1 text-xs text-monochrome-600 mb-6">
          <Star size={12} />
          <span>Your money. Your rules. Total clarity.</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-display-lg font-display text-monochrome-900 max-w-3xl mx-auto leading-tight">
          Take control of your
          <br />
          <span className="relative">
            finances
            <span className="absolute -bottom-2 left-0 right-0 h-1 bg-black/10 rounded-full" />
          </span>{" "}
          without the noise.
        </h1>
        <p className="mt-6 text-lg text-monochrome-500 max-w-xl mx-auto leading-relaxed">
          WealthWise is a personal finance app that runs entirely on your machine.
          No cloud, no ads, no AI APIs — just you and your money.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/signup" className="btn-primary btn-lg flex items-center gap-2">
            Get Started Free <ChevronRight size={18} />
          </Link>
          <button className="btn-secondary btn-lg flex items-center gap-2" onClick={handleDemoLogin} disabled={demoLoading}>
            {demoLoading ? "Loading..." : "Live Demo"}
          </button>
        </div>
        <p className="mt-4 text-xs text-monochrome-400">No credit card needed · 3 demo accounts included</p>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-monochrome-200 bg-monochrome-50">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center slide-in-stagger">
          {[
            { value: "100%", label: "Local on your machine" },
            { value: "12", label: "Insight rules" },
            { value: "8", label: "Analytics charts" },
            { value: "0", label: "External API calls" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-bold text-monochrome-900">{s.value}</p>
              <p className="text-sm text-monochrome-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-monochrome-900">
            Everything you need in one place
          </h2>
          <p className="mt-3 text-monochrome-500 max-w-lg mx-auto">
            Built for individuals who want clarity, control, and complete privacy over their finances.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 slide-in-stagger">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5 hover:shadow-card-hover transition-shadow">
              <div className="w-10 h-10 rounded-md bg-black flex items-center justify-center mb-3">
                <f.icon size={18} className="text-white" />
              </div>
              <h3 className="font-semibold text-monochrome-900 mb-1">{f.title}</h3>
              <p className="text-sm text-monochrome-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-monochrome-50 border-y border-monochrome-200">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-monochrome-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-monochrome-500 max-w-lg mx-auto">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto slide-in-stagger">
            {PRICING.map((p) => (
              <div
                key={p.tier}
                className={`card p-5 relative ${p.featured ? "border-black shadow-card-hover" : ""}`}
              >
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-monochrome-900">{p.tier}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-monochrome-900">{p.price}</span>
                  <span className="text-sm text-monochrome-400">{p.period}</span>
                </div>
                <p className="text-sm text-monochrome-500 mt-2">{p.desc}</p>
                <ul className="mt-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-monochrome-700">
                      <Check size={16} className="text-monochrome-900 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-6 block text-center rounded-md py-2 text-sm font-medium transition-colors ${
                    p.featured
                      ? "bg-black text-white hover:bg-monochrome-800"
                      : "border border-monochrome-300 text-monochrome-700 hover:bg-monochrome-100"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center slide-in-stagger">
        <h2 className="text-3xl md:text-4xl font-bold text-monochrome-900 max-w-xl mx-auto">
          Ready to take control of your money?
        </h2>
        <p className="mt-3 text-monochrome-500 max-w-md mx-auto">
          Join WealthWise today. No sign-up friction, no spam, no data collection.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/signup" className="btn-primary btn-lg flex items-center gap-2">
            Get Started Free <ChevronRight size={18} />
          </Link>
          <button className="btn-secondary btn-lg flex items-center gap-2" onClick={handleDemoLogin} disabled={demoLoading}>
            {demoLoading ? "Loading..." : "Try the Demo"}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-monochrome-200 bg-monochrome-50">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="text-lg font-bold text-monochrome-900">
              ◆ WealthWise
            </Link>
            <p className="text-sm text-monochrome-400">
              &copy; {new Date().getFullYear()} WealthWise. No data leaves your machine.
            </p>
            <div className="flex items-center gap-4 text-sm text-monochrome-500">
              <Link href="/login" className="hover:text-black transition-colors">Log In</Link>
              <Link href="/signup" className="hover:text-black transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
