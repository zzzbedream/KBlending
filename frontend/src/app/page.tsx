import Link from "next/link";
import { Activity, Layers, ShieldCheck } from "lucide-react";
import { Hero } from "@/components/landing/Hero";
import { StatsBand } from "@/components/landing/StatsBand";
import { Niche } from "@/components/landing/Niche";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Marquee } from "@/components/landing/Marquee";
import { CTA } from "@/components/landing/CTA";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "KAP-20 adminTransfer defense",
    body: "The vault mirrors the balances it should hold and auto-pauses the instant a token admin drains funds — a risk unique to KAP-20 assets on KUB Chain.",
  },
  {
    icon: Layers,
    title: "Two-sided money market",
    body: "Lenders supply KUSDT and earn utilization-based interest; borrowers post KAP-20 / RWA collateral and borrow against it with real liquidations.",
  },
  {
    icon: Activity,
    title: "Live on KUB testnet",
    body: "Deployed, verified and indexed. A REST backend surfaces TVL, utilization and Weekly Unique Active Wallet straight from on-chain events.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#f9fafb] text-[#05261e]">
      <header className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-8 py-7">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#04140e] text-emerald-400">✦</span>
          <span className="font-display text-lg font-semibold tracking-tight">KBlending</span>
        </div>
        <Link
          href="/app"
          className="rounded-full bg-[#04140e] px-5 py-2 text-[13px] font-semibold text-white transition-transform hover:scale-[1.03]"
        >
          Launch App
        </Link>
      </header>

      <main className="px-4 pb-24">
        <Hero />
        <StatsBand />
        <Niche />
        <HowItWorks />

        <section className="mx-auto mt-24 grid w-full max-w-[1400px] gap-5 px-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-3xl border border-slate-200/70 bg-white p-7 shadow-[0_20px_60px_-30px_rgba(6,40,30,0.15)]"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-500">{body}</p>
            </div>
          ))}
        </section>

        <Marquee />
        <CTA />
      </main>

      <footer className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 px-8 py-8 text-[13px] text-slate-500">
        <span>KBlending · the RWA credit layer for KUB Chain</span>
        <nav className="flex items-center gap-5">
          <Link href="/app" className="font-semibold hover:text-[#05261e]">
            App
          </Link>
          <a
            href="https://github.com/zzzbedream/KBlending"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:text-[#05261e]"
          >
            GitHub
          </a>
        </nav>
      </footer>
    </div>
  );
}
