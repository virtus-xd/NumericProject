import { describe, it, expect } from "vitest";
import {
  forwardDiff,
  backwardDiff,
  centralDiff,
  richardson,
  stepSizeSweep,
  logSpacedSteps,
} from "@/lib/numerical/differentiation";

describe("numerical differentiation (A.4)", () => {
  it("derivative of sin at 0 is 1", () => {
    const h = 1e-5;
    expect(forwardDiff(Math.sin, 0, h)).toBeCloseTo(1, 6);
    expect(backwardDiff(Math.sin, 0, h)).toBeCloseTo(1, 6);
    expect(centralDiff(Math.sin, 0, h)).toBeCloseTo(1, 9);
  });

  it("central difference beats forward at the same h", () => {
    // f(x) = e^x at x = 1; exact derivative is e.
    const f = Math.exp;
    const exact = Math.E;
    const h = 1e-4;
    const fwdErr = Math.abs(forwardDiff(f, 1, h) - exact);
    const cenErr = Math.abs(centralDiff(f, 1, h) - exact);
    expect(cenErr).toBeLessThan(fwdErr);
  });

  it("Richardson extrapolation is more accurate than plain central diff", () => {
    const f = Math.exp;
    const exact = Math.E;
    const h = 1e-2;
    const cenErr = Math.abs(centralDiff(f, 1, h) - exact);
    const richErr = Math.abs(richardson(f, 1, h) - exact);
    expect(richErr).toBeLessThan(cenErr);
  });

  it("stepSizeSweep returns finite errors and shows the U-curve trend", () => {
    const hValues = logSpacedSteps(-1, -8, 3); // 10^-1 .. 10^-8
    const sweep = stepSizeSweep(Math.sin, Math.cos, 1, hValues);
    expect(sweep.length).toBe(hValues.length);
    for (const row of sweep) {
      expect(Number.isFinite(row.forwardErr)).toBe(true);
      expect(Number.isFinite(row.centralErr)).toBe(true);
    }
    // The minimum central error should be smaller than the error at the
    // largest step (truncation-dominated) — i.e. accuracy improves first.
    const largestStepErr = sweep[0].centralErr;
    const minErr = Math.min(...sweep.map((r) => r.centralErr));
    expect(minErr).toBeLessThan(largestStepErr);
  });
});
