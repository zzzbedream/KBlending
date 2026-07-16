type Partner = { name: string; tag: string; gradient: string };

// KUB ecosystem the protocol plugs into — on-brand chips (no external logos).
const PARTNERS: Partner[] = [
  { name: "KUB Chain", tag: "L1", gradient: "linear-gradient(135deg,#12c48b,#0ea5e9)" },
  { name: "Bitkub NEXT", tag: "Wallet", gradient: "linear-gradient(135deg,#12c48b,#34d399)" },
  { name: "RealX", tag: "RWA", gradient: "linear-gradient(135deg,#38bdf8,#22d3ee)" },
  { name: "KUSDT", tag: "Stable", gradient: "linear-gradient(135deg,#34d399,#12c48b)" },
  { name: "Pyth", tag: "Oracle", gradient: "linear-gradient(135deg,#0ea5e9,#38bdf8)" },
  { name: "DeFiLlama", tag: "Analytics", gradient: "linear-gradient(135deg,#12c48b,#38bdf8)" },
  { name: "GeckoTerminal", tag: "Data", gradient: "linear-gradient(135deg,#22d3ee,#0ea5e9)" },
  { name: "KAP-20", tag: "Standard", gradient: "linear-gradient(135deg,#34d399,#0ea5e9)" },
];

function Card({ partner }: { partner: Partner }) {
  return (
    <div className="group relative mx-3 flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all hover:border-slate-300">
      <div
        className="absolute inset-0 scale-150 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
        style={{ background: partner.gradient }}
      />
      <div className="relative z-10 flex flex-col items-center gap-0.5 text-center transition-colors duration-300 group-hover:text-white">
        <span className="font-display text-[15px] font-semibold text-[#05261e] group-hover:text-white">
          {partner.name}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-white/80">
          {partner.tag}
        </span>
      </div>
    </div>
  );
}

export function Marquee() {
  return (
    <div id="ecosystem" className="marquee-mask mx-auto mt-10 w-full max-w-[1400px] overflow-hidden">
      <div className="marquee-track py-2">
        {[...PARTNERS, ...PARTNERS].map((p, i) => (
          <Card key={`${p.name}-${i}`} partner={p} />
        ))}
      </div>
    </div>
  );
}
