import { describe, it, expect } from "bun:test";
import { validateSession } from "../progression";

describe("validateSession", () => {
  it("rejects sessions shorter than the minimum", () => {
    const progress: any = {
      counters: { placementsToday: 0, lastSessionEndedAt: 0 },
      streak: { days: 0, lastDate: new Date().toDateString() },
    };
    const result = validateSession({ mode: "flow", seconds: 100 }, progress);
    expect(result).toEqual({ ok: false, reason: "too_short" });
  });

  it("enforces cooldown intervals", () => {
    const progress: any = {
      counters: { placementsToday: 0, lastSessionEndedAt: Date.now() },
      streak: { days: 0, lastDate: new Date().toDateString() },
    };
    const result = validateSession({ mode: "flow", seconds: 200 }, progress);
    expect(result).toEqual({ ok: false, reason: "cooldown" });
  });

  it("honors the daily placement cap", () => {
    const progress: any = {
      counters: { placementsToday: 6, lastSessionEndedAt: 0 },
      streak: { days: 1, lastDate: new Date().toDateString() },
    };
    const result = validateSession({ mode: "flow", seconds: 200 }, progress);
    expect(result).toEqual({ ok: false, reason: "daily_cap" });
  });

  it("validates a proper session successfully", () => {
    const progress: any = {
      counters: { placementsToday: 0, lastSessionEndedAt: Date.now() - 31_000 },
      streak: { days: 1, lastDate: new Date().toDateString() },
    };
    const result = validateSession({ mode: "flow", seconds: 200 }, progress);
    expect(result).toEqual({ ok: true });
  });
});

