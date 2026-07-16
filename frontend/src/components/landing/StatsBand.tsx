const STATS = [
  { value: "40%", label: "Max LTV on collateral" },
  { value: "Auto-pause", label: "on KAP-20 adminTransfer" },
  { value: "Two-sided", label: "supply + borrow market" },
  { value: "~92%", label: "contract test coverage" },
];

export function StatsBand() {
  return (
    <section className="mx-auto mt-16 grid w-full max-w-[1400px] grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200/70 bg-slate-200/70 md:grid-cols-4">
      {STATS.map((s) => (
        <div key={s.label} className="bg-white px-6 py-8 text-center">
          <div className="font-display text-3xl font-semibold tracking-tight text-[#05261e]">{s.value}</div>
          <div className="mt-1 text-[13px] text-slate-500">{s.label}</div>
        </div>
      ))}
    </section>
  );
}
