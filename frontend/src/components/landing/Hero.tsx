"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight, ShieldCheck } from "lucide-react";

export function Hero() {
  return (
    <section className="relative mx-auto flex h-[600px] w-full max-w-[1400px] flex-col overflow-hidden rounded-[48px] border border-slate-200/60 bg-white shadow-[0_40px_100px_-20px_rgba(6,40,30,0.10)]">
      {/* On-brand animated gradient mesh (KUB green + celeste) — replaces stock video */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
        <div className="kub-mesh">
          <div className="kub-blob kub-blob-green" />
          <div className="kub-blob kub-blob-cyan" />
          <div className="kub-blob kub-blob-mint" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(6,40,30,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6,40,30,0.05) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 flex flex-1 flex-col items-start px-8 pt-12 md:px-16 md:pt-16"
      >
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold text-emerald-700 backdrop-blur-sm">
          <ShieldCheck className="h-3.5 w-3.5" />
          KAP-20 adminTransfer protection
        </span>

        <h1 className="font-display max-w-2xl text-[42px] font-medium leading-[1.05] tracking-tight text-[#05261e] md:text-[56px]">
          Lending, secured for
          <br />
          the KUB economy
        </h1>

        <p className="mt-5 max-w-md font-sans text-[14px] leading-relaxed text-slate-500 md:text-[15px]">
          A two-sided, over-collateralized money market for KAP-20 assets and tokenized RWAs — with on-chain
          protection that halts the protocol the moment an admin tries to drain deposited collateral.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/app">
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#04140e] px-6 text-[13px] font-semibold text-white shadow-lg shadow-emerald-900/10"
            >
              Launch App
              <ChevronRight className="h-4 w-4" />
            </motion.span>
          </Link>
          <a
            href="#ecosystem"
            className="inline-flex h-11 items-center rounded-full border border-slate-200/70 bg-white/70 px-6 text-[13px] font-semibold text-[#05261e] backdrop-blur-sm transition-colors hover:border-emerald-300"
          >
            Explore the ecosystem
          </a>
        </div>
      </motion.div>

      {/* Floating bottom navbar */}
      <div className="absolute bottom-10 left-1/2 z-30 -translate-x-1/2">
        <motion.nav
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-1 rounded-full border border-slate-200/50 bg-white/90 px-1.5 py-1.5 shadow-[0_12px_40px_rgba(6,40,30,0.10)] backdrop-blur-2xl"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-emerald-600 shadow-sm">
            ✦
          </span>
          <a href="#ecosystem" className="px-3 text-[12px] font-semibold text-slate-500 transition-colors hover:text-[#05261e]">
            Protocol
          </a>
          <a
            href="https://github.com/zzzbedream/KBlending"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 text-[12px] font-semibold text-slate-500 transition-colors hover:text-[#05261e]"
          >
            Docs
          </a>
          <Link
            href="/app"
            className="ml-1 inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-white px-5 py-2 text-[12px] font-semibold text-[#05261e] shadow-sm transition-all hover:border-slate-300"
          >
            Launch App
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </motion.nav>
      </div>
    </section>
  );
}
