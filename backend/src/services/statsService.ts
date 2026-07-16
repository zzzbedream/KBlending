import type { StatsSummary, VaultEvent, VaultEventType, WeeklyActiveWallets } from "../types.js";

const EVENT_TYPES: VaultEventType[] = [
  "Supplied",
  "SupplyWithdrawn",
  "CollateralDeposited",
  "CollateralWithdrawn",
  "Borrowed",
  "Repaid",
  "Liquidated",
];

/** ISO-8601 week label ("YYYY-Www") for a unix-seconds timestamp. */
export function isoWeek(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // Thursday of the current week decides the ISO year.
  const day = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Weekly Unique Active Wallet: distinct acting wallets per ISO week, ascending by week.
 * This is the core grant metric — computed from indexed events only, auditable on-chain.
 */
export function computeWeeklyActiveWallets(events: VaultEvent[]): WeeklyActiveWallets[] {
  const byWeek = new Map<string, Set<string>>();
  for (const e of events) {
    const week = isoWeek(e.timestamp);
    const set = byWeek.get(week) ?? new Set<string>();
    set.add(e.user.toLowerCase());
    byWeek.set(week, set);
  }
  return [...byWeek.entries()]
    .map(([week, wallets]) => ({ week, wallets: wallets.size }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export function summarize(events: VaultEvent[]): StatsSummary {
  const byType = Object.fromEntries(EVENT_TYPES.map((t) => [t, 0])) as Record<VaultEventType, number>;
  const wallets = new Set<string>();
  for (const e of events) {
    byType[e.type] += 1;
    wallets.add(e.user.toLowerCase());
  }
  return { totalEvents: events.length, uniqueWallets: wallets.size, byType };
}
