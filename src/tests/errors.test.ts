import { describe, it, expect } from "vitest";
import {
  MACHINE_EPSILON,
  absoluteError,
  relativeError,
  naiveSum,
  kahanSum,
  accumulationDemo,
  cancellationDemo,
  floatingPointSurprise,
  summationErrorSeries,
} from "@/lib/numerical/errors";

describe("error analysis (A.1)", () => {
  it("computes machine epsilon ~ 2.22e-16 (2^-52)", () => {
    expect(MACHINE_EPSILON).toBeCloseTo(Math.pow(2, -52), 30);
    // 1 + eps differs from 1, but 1 + eps/2 does not.
    expect(1 + MACHINE_EPSILON).not.toBe(1);
    expect(1 + MACHINE_EPSILON / 2).toBe(1);
  });

  it("computes absolute and relative error", () => {
    expect(absoluteError(2.5, 2.0)).toBeCloseTo(0.5, 12);
    expect(relativeError(2.5, 2.0)).toBeCloseTo(0.25, 12);
    // exact === 0 falls back to absolute error.
    expect(relativeError(0.5, 0)).toBeCloseTo(0.5, 12);
  });

  it("Kahan summation is at least as accurate as naive summation", () => {
    const { naive, kahan, exact } = accumulationDemo(100000);
    const naiveErr = Math.abs(naive - exact);
    const kahanErr = Math.abs(kahan - exact);
    expect(kahanErr).toBeLessThanOrEqual(naiveErr);
    // Kahan should be essentially exact here.
    expect(kahanErr).toBeLessThan(1e-8);
  });

  it("naiveSum and kahanSum agree on an exactly-representable input", () => {
    const values = [1, 2, 3, 4, 5];
    expect(naiveSum(values)).toBe(15);
    expect(kahanSum(values)).toBe(15);
  });

  it("demonstrates the 0.1 + 0.2 !== 0.3 surprise", () => {
    const r = floatingPointSurprise();
    expect(r.equal).toBe(false);
    expect(Math.abs(r.difference)).toBeLessThan(1e-15);
  });

  it("stable cancellation form beats naive near x -> 0", () => {
    const r = cancellationDemo(1e-7);
    expect(Math.abs(r.stable - r.exact)).toBeLessThanOrEqual(
      Math.abs(r.naive - r.exact),
    );
    expect(r.stable).toBeCloseTo(0.5, 6);
  });

  it("produces a monotone-ish error series where Kahan stays small", () => {
    const series = summationErrorSeries(5000);
    expect(series.length).toBe(5000);
    const last = series[series.length - 1];
    expect(last.kahanErr).toBeLessThanOrEqual(last.naiveErr + 1e-12);
  });
});
