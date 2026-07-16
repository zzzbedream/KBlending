import { ArrowRight, Building2, Coins } from "lucide-react";

export function Niche() {
  return (
    <section className="mx-auto mt-24 grid w-full max-w-[1400px] items-center gap-12 px-4 md:grid-cols-2">
      <div>
        <span className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">The niche</span>
        <h2 className="font-display mt-3 text-[32px] font-medium leading-tight tracking-tight text-[#05261e] md:text-[40px]">
          Unlock liquidity from real-world assets
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-500">
          Thailand leads in regulated asset tokenization, and Bitkub already issues real-world assets like RealX
          real estate as KAP-20 tokens — but they sit idle. KBlending makes them productive collateral: deposit,
          borrow KUSDT, keep your upside.
        </p>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-500">
          The reason nobody has done it safely: KAP-20&apos;s <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] text-[#05261e]">adminTransfer</code>{" "}
          can drain any contract. KBlending turns KUB&apos;s biggest DeFi blocker into its moat.
        </p>
      </div>

      {/* Flow card: RWA collateral -> borrow stablecoin */}
      <div className="rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_30px_80px_-40px_rgba(6,40,30,0.2)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center gap-3 rounded-2xl bg-emerald-50/70 px-4 py-6 text-center">
            <Building2 className="h-7 w-7 text-emerald-600" />
            <div>
              <div className="font-display text-sm font-semibold text-[#05261e]">RealX / KAP-20</div>
              <div className="text-[11px] text-slate-500">tokenized RWA collateral</div>
            </div>
          </div>
          <ArrowRight className="h-6 w-6 shrink-0 text-slate-300" />
          <div className="flex flex-1 flex-col items-center gap-3 rounded-2xl bg-sky-50/70 px-4 py-6 text-center">
            <Coins className="h-7 w-7 text-sky-500" />
            <div>
              <div className="font-display text-sm font-semibold text-[#05261e]">Borrow KUSDT</div>
              <div className="text-[11px] text-slate-500">without selling your asset</div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/60 px-5 py-4">
          <span className="text-[13px] font-medium text-slate-500">Protected by</span>
          <span className="font-display text-[13px] font-semibold text-emerald-600">adminTransfer auto-pause</span>
        </div>
      </div>
    </section>
  );
}
