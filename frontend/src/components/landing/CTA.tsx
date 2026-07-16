import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function CTA() {
  return (
    <section className="mx-auto mt-24 w-full max-w-[1400px] px-4">
      <div className="relative overflow-hidden rounded-[40px] bg-[#04140e] px-8 py-16 text-center md:px-16">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="kub-mesh">
            <div className="kub-blob kub-blob-green" />
            <div className="kub-blob kub-blob-cyan" />
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-display text-[32px] font-medium leading-tight tracking-tight text-white md:text-[44px]">
            Bring real-world assets on-chain
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-emerald-100/70">
            Supply, borrow, and unlock liquidity from KAP-20 assets on KUB Chain — with protection no other lending
            market offers.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[14px] font-semibold text-[#04140e] transition-transform hover:scale-[1.03]"
            >
              Launch App
              <ChevronRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com/zzzbedream/KBlending"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center rounded-full border border-white/20 px-7 text-[14px] font-semibold text-white transition-colors hover:border-white/50"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
