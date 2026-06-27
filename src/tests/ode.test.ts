import { describe, it, expect } from "vitest";
import {
  euler,
  rk4,
  rk45Adaptive,
  logistic,
  logisticExact,
} from "@/lib/numerical/ode";

// Logistic growth y' = r y (1 - y/K) with a known closed-form solution.
const r = 1;
const K = 10;
const y0 = 1;
const f = logistic(r, K);
const exact = logisticExact(r, K, y0);

describe("ODE solvers (A.9)", () => {
  it("Euler approximates the logistic solution (loosely)", () => {
    const sol = euler(f, [y0], 0, 5, 0.01);
    const last = sol.y[sol.y.length - 1][0];
    const tEndActual = sol.t[sol.t.length - 1];
    expect(Math.abs(last - exact(tEndActual))).toBeLessThan(0.1);
  });

  it("RK4 is far more accurate than Euler at the same step size", () => {
    const h = 0.25;
    const eSol = euler(f, [y0], 0, 5, h);
    const rSol = rk4(f, [y0], 0, 5, h);
    const tE = eSol.t[eSol.t.length - 1];
    const tR = rSol.t[rSol.t.length - 1];
    const eulerErr = Math.abs(eSol.y[eSol.y.length - 1][0] - exact(tE));
    const rk4Err = Math.abs(rSol.y[rSol.y.length - 1][0] - exact(tR));
    expect(rk4Err).toBeLessThan(eulerErr);
    expect(rk4Err).toBeLessThan(1e-3);
  });

  it("RK4 matches the closed form to high accuracy", () => {
    const sol = rk4(f, [y0], 0, 5, 0.1);
    for (let i = 0; i < sol.t.length; i++) {
      expect(Math.abs(sol.y[i][0] - exact(sol.t[i]))).toBeLessThan(1e-4);
    }
  });

  it("adaptive RK45 meets the tolerance and reports step sizes", () => {
    const sol = rk45Adaptive(f, [y0], 0, 5, 1e-8);
    const last = sol.y[sol.y.length - 1][0];
    const tEnd = sol.t[sol.t.length - 1];
    expect(tEnd).toBeCloseTo(5, 6);
    expect(Math.abs(last - exact(tEnd))).toBeLessThan(1e-5);
    expect(sol.stepSizes && sol.stepSizes.length).toBeGreaterThan(0);
  });

  it("RK45 uses variable step sizes", () => {
    const sol = rk45Adaptive(f, [y0], 0, 5, 1e-8);
    const sizes = sol.stepSizes ?? [];
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    // The controller should adapt, so steps are not all identical.
    expect(max).toBeGreaterThan(min);
  });
});
