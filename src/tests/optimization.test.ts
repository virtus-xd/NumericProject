import { describe, it, expect } from "vitest";
import {
  goldenSection,
  gradientDescent,
  newtonND,
  nelderMead,
} from "@/lib/numerical/optimization";
import type { Matrix } from "@/lib/numerical/linalg";

describe("optimization (A.8)", () => {
  it("golden section finds the minimum of (x-3)^2 at x = 3", () => {
    const r = goldenSection((x) => (x - 3) * (x - 3), 0, 10, { tol: 1e-9 });
    expect(r.converged).toBe(true);
    expect(r.xStar[0]).toBeCloseTo(3, 6);
    expect(r.fStar).toBeCloseTo(0, 10);
    expect(r.steps.length).toBeGreaterThan(0);
  });

  it("gradient descent minimizes a 2D quadratic", () => {
    // f(x,y) = (x-1)^2 + (y-2)^2, min at (1, 2).
    const f = (v: number[]) => (v[0] - 1) ** 2 + (v[1] - 2) ** 2;
    const grad = (v: number[]) => [2 * (v[0] - 1), 2 * (v[1] - 2)];
    const r = gradientDescent(f, grad, [0, 0], 0.1, { tol: 1e-8, maxIter: 5000 });
    expect(r.converged).toBe(true);
    expect(r.xStar[0]).toBeCloseTo(1, 4);
    expect(r.xStar[1]).toBeCloseTo(2, 4);
  });

  it("gradient descent reports divergence with too large a learning rate", () => {
    const f = (v: number[]) => v[0] * v[0];
    const grad = (v: number[]) => [2 * v[0]];
    const r = gradientDescent(f, grad, [1], 5, { maxIter: 100 });
    expect(r.converged).toBe(false);
  });

  it("Newton's method converges quadratically on a quadratic (one step)", () => {
    const f = (v: number[]) => (v[0] - 1) ** 2 + (v[1] - 2) ** 2;
    const grad = (v: number[]) => [2 * (v[0] - 1), 2 * (v[1] - 2)];
    const hess = (): Matrix => [
      [2, 0],
      [0, 2],
    ];
    const r = newtonND(f, grad, hess, [-5, 7], { tol: 1e-10 });
    expect(r.converged).toBe(true);
    expect(r.xStar[0]).toBeCloseTo(1, 9);
    expect(r.xStar[1]).toBeCloseTo(2, 9);
    // A pure quadratic is solved in a single Newton step.
    expect(r.steps.length).toBeLessThanOrEqual(2);
  });

  it("Nelder-Mead finds the Rosenbrock minimum at (1, 1)", () => {
    const rosenbrock = (v: number[]) =>
      (1 - v[0]) ** 2 + 100 * (v[1] - v[0] * v[0]) ** 2;
    const r = nelderMead(rosenbrock, [-1.2, 1], { tol: 1e-10, maxIter: 2000 });
    expect(r.xStar[0]).toBeCloseTo(1, 2);
    expect(r.xStar[1]).toBeCloseTo(1, 2);
    expect(r.fStar).toBeLessThan(1e-4);
  });
});
