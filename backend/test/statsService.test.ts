import { describe, it, expect } from "vitest";
import { computeWeeklyActiveWallets, isoWeek, summarize } from "../src/services/statsService.js";
import type { VaultEvent } from "../src/types.js";

const secs = (y: number, m: number, d: number) => Math.floor(Date.UTC(y, m, d) / 1000);

function ev(type: VaultEvent["type"], user: string, ts: number, i: number): VaultEvent {
  return { type, user, amount: "1", blockNumber: i, timestamp: ts, txHash: `0x${i}`, logIndex: i };
}

describe("isoWeek", () => {
  it("anchors 2026-01-01 (Thursday) to ISO week 01", () => {
    expect(isoWeek(secs(2026, 0, 1))).toBe("2026-W01");
  });

  it("keeps days within the same ISO week together", () => {
    expect(isoWeek(secs(2026, 0, 5))).toBe(isoWeek(secs(2026, 0, 6))); // Mon & Tue
  });

  it("rolls to the next week after 7 days", () => {
    expect(isoWeek(secs(2026, 0, 5))).not.toBe(isoWeek(secs(2026, 0, 13)));
  });
});

describe("computeWeeklyActiveWallets", () => {
  it("counts distinct wallets per ISO week, case-insensitively", () => {
    const w2 = secs(2026, 0, 5);
    const w3 = secs(2026, 0, 13);
    const events = [
      ev("Supplied", "0xAAA", w2, 1),
      ev("Borrowed", "0xaaa", w2, 2), // same wallet, different case -> still 1
      ev("Supplied", "0xBBB", w2, 3),
      ev("Repaid", "0xAAA", w3, 4),
    ];
    const weeks = computeWeeklyActiveWallets(events);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toMatchObject({ wallets: 2 }); // W02: {A,B}
    expect(weeks[1]).toMatchObject({ wallets: 1 }); // W03: {A}
  });

  it("returns an empty array with no events", () => {
    expect(computeWeeklyActiveWallets([])).toEqual([]);
  });
});

describe("summarize", () => {
  it("aggregates totals, unique wallets and per-type counts", () => {
    const t = secs(2026, 0, 5);
    const events = [
      ev("Supplied", "0xAAA", t, 1),
      ev("Supplied", "0xBBB", t, 2),
      ev("Borrowed", "0xAAA", t, 3),
    ];
    const s = summarize(events);
    expect(s.totalEvents).toBe(3);
    expect(s.uniqueWallets).toBe(2);
    expect(s.byType.Supplied).toBe(2);
    expect(s.byType.Borrowed).toBe(1);
    expect(s.byType.Liquidated).toBe(0);
  });
});
