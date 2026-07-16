import { formatUnits, parseUnits } from "ethers";

const WAD = 10n ** 18n;
const MAX_UINT = (1n << 256n) - 1n;

/** Format a token amount (wei) to a human string with up to `maxFrac` decimals. */
export function formatAmount(value: bigint, decimals = 18, maxFrac = 4): string {
  const s = formatUnits(value, decimals);
  const [whole, frac = ""] = s.split(".");
  const trimmed = frac.slice(0, maxFrac).replace(/0+$/, "");
  const withGrouping = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return trimmed ? `${withGrouping}.${trimmed}` : withGrouping;
}

/** Parse a user-entered decimal string into wei. Throws on invalid input. */
export function parseAmount(value: string, decimals = 18): bigint {
  return parseUnits(value.trim(), decimals);
}

/** WAD ratio (1e18 == 1.0) to a fixed-decimals string. */
export function formatWadRatio(value: bigint, fracDigits = 2): string {
  const scale = 10n ** BigInt(fracDigits);
  const scaled = (value * scale) / WAD;
  const whole = scaled / scale;
  const frac = (scaled % scale).toString().padStart(fracDigits, "0");
  return `${whole}.${frac}`;
}

/** WAD fraction (1e18 == 100%) to a percentage string. */
export function formatWadPercent(value: bigint, fracDigits = 2): string {
  return `${formatWadRatio(value * 100n, fracDigits)}%`;
}

/** Health factor display: "∞" when the position has no debt (sentinel max uint). */
export function formatHealthFactor(hf: bigint): string {
  if (hf >= MAX_UINT / 2n) return "∞";
  return formatWadRatio(hf, 2);
}

/** Health factor severity for color coding. */
export function healthTier(hf: bigint): "safe" | "warn" | "danger" {
  if (hf >= MAX_UINT / 2n) return "safe";
  if (hf >= parseUnits("1.5", 18)) return "safe";
  if (hf >= WAD) return "warn";
  return "danger";
}

export function shortenAddress(address: string): string {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
}
