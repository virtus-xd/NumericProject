import { describe, it, expect } from "vitest";
import {
  trapezoid,
  simpson,
  simpson38,
  midpoint,
  monteCarlo,
  adaptiveSimpson,
  convergenceSeries,
} from "@/lib/numerical/integration";

describe("numerical integration (A.5)", () => {
  it("integrates sin x over [0, pi] to 2", () => {
    expect(trapezoid(Math.sin, 0, Math.PI, 1000).value).toBeCloseTo(2, 4);
    expect(simpson(Math.sin, 0, Math.PI, 100).value).toBeCloseTo(2, 7);
    expect(simpson38(Math.sin, 0, Math.PI, 99).value).toBeCloseTo(2, 7);
    expect(midpoint(Math.sin, 0, Math.PI, 1000).value).toBeCloseTo(2, 4);
  });

  it("integrates x^2 over [0, 1] to 1/3", () => {
    const f = (x: number) => x * x;
    // Simpson is exact for polynomials up to degree 3.
    expect(simpson(f, 0, 1, 2).value).toBeCloseTo(1 / 3, 12);
    expect(trapezoid(f, 0, 1, 2000).value).toBeCloseTo(1 / 3, 6);
  });

  it("Simpson enforces an even interval count", () => {
    const r = simpson((x) => x * x, 0, 1, 5); // odd -> bumped to 6
    expect(r.nIntervals % 2).toBe(0);
  });

  it("Simpson 3/8 enforces a multiple-of-three interval count", () => {
    const r = simpson38((x) => x * x, 0, 1, 7); // -> bumped to 9
    expect(r.nIntervals % 3).toBe(0);
  });

  it("trapezoid error decreases as n grows (convergence)", () => {
    const f = Math.sin;
    const series = convergenceSeries(trapezoid, f, 0, Math.PI, 2, [10, 100, 1000]);
    expect(series[0].error).toBeGreaterThan(series[1].error);
    expect(series[1].error).toBeGreaterThan(series[2].error);
  });

  it("adaptive Simpson reaches the tolerance on sin over [0, pi]", () => {
    const r = adaptiveSimpson(Math.sin, 0, Math.PI, 1e-9);
    expect(Math.abs(r.value - 2)).toBeLessThan(1e-7);
    expect(r.nIntervals).toBeGreaterThan(0);
  });

  it("Monte Carlo (seeded) approximates a known integral", () => {
    // Deterministic linear-congruential RNG so the test is reproducible.
    let state = 123456789;
    const rng = () => {
      state = (1103515245 * state + 12345) % 2147483648;
      return state / 2147483648;
    };
    // integral of x^2 over [0,1] = 1/3.
    const r = monteCarlo((x) => x * x, 0, 1, 200000, rng);
    expect(Math.abs(r.value - 1 / 3)).toBeLessThan(5e-3);
    expect(r.estimatedError).toBeGreaterThan(0);
  });
});
