import { describe, it, expect } from "vitest";
import { time, compareTiming, estimateOrder } from "@/lib/benchmark";

describe("benchmark helpers (A.10)", () => {
  it("time() reports the number of runs and a finite duration", () => {
    let counter = 0;
    const r = time("increment", () => {
      counter++;
    }, 1000);
    expect(r.runs).toBe(1000);
    expect(counter).toBe(1000);
    expect(Number.isFinite(r.ms)).toBe(true);
    expect(r.msPerRun).toBeCloseTo(r.ms / 1000, 12);
  });

  it("compareTiming returns one result per case", () => {
    const results = compareTiming([
      { label: "a", fn: () => void 0 },
      { label: "b", fn: () => void 0, runs: 5 },
    ]);
    expect(results.map((r) => r.label)).toEqual(["a", "b"]);
    expect(results[1].runs).toBe(5);
  });

  it("estimateOrder recovers the order of a power law error", () => {
    // error = C n^-2 -> doubling n divides error by 4 -> order 2.
    const C = 3;
    const n1 = 10;
    const n2 = 40;
    const e1 = C * Math.pow(n1, -2);
    const e2 = C * Math.pow(n2, -2);
    expect(estimateOrder(n1, e1, n2, e2)).toBeCloseTo(2, 10);
  });

  it("estimateOrder returns NaN for degenerate input", () => {
    expect(Number.isNaN(estimateOrder(10, 0, 20, 1))).toBe(true);
    expect(Number.isNaN(estimateOrder(10, 1, 10, 1))).toBe(true);
  });
});
