const STEPS = [
  {
    n: "01",
    title: "Supply & earn",
    body: "Lenders supply KUSDT into the vault and earn interest that scales with utilization — the more it's borrowed, the more you earn.",
  },
  {
    n: "02",
    title: "Collateralize & borrow",
    body: "Borrowers post KAP-20 assets or tokenized RWAs as collateral and borrow KUSDT up to 40% LTV, tracked live by Health Factor.",
  },
  {
    n: "03",
    title: "Stay protected",
    body: "The vault auto-pauses the instant a KAP-20 admin drains funds, and unhealthy positions liquidate cleanly at an 8% bonus.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto mt-24 w-full max-w-[1400px] px-4">
      <h2 className="font-display text-[32px] font-medium tracking-tight text-[#05261e] md:text-[40px]">How it works</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-3xl border border-slate-200/70 bg-white p-7 transition-all hover:border-emerald-300 hover:shadow-[0_20px_60px_-30px_rgba(6,40,30,0.2)]"
          >
            <div className="font-display text-[13px] font-semibold text-emerald-600">{s.n}</div>
            <h3 className="font-display mt-3 text-lg font-semibold tracking-tight text-[#05261e]">{s.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-500">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
