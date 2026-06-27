import { describe, it, expect } from "vitest";
import { bisection, newtonRaphson, secant } from "@/lib/numerical/rootfinding";

// Test function f(x) = x^2 - 2, whose positive root is sqrt(2).
const f = (x: number) => x * x - 2;
const df = (x: number) => 2 * x;
const SQRT2 = Math.SQRT2;

describe("root finding (A.2)", () => {
  it("bisection finds sqrt(2) on [0, 2]", () => {
    const r = bisection(f, 0, 2, { tol: 1e-10, maxIter: 200 });
    expect(r.converged).toBe(true);
    expect(Math.abs(r.root - SQRT2)).toBeLessThan(1e-8);
    expect(r.iterations.length).toBeGreaterThan(0);
    // Each step should report a bracket.
    expect(r.iterations[0].a).toBeDefined();
    expect(r.iterations[0].b).toBeDefined();
  });

  it("bisection reports a non-bracketing interval instead of throwing", () => {
    const r = bisection(f, 2, 3); // f(2)=2, f(3)=7, same sign
    expect(r.converged).toBe(false);
    expect(r.reason).toMatch(/bracket/i);
  });

  it("Newton-Raphson converges quadratically to sqrt(2)", () => {
    const r = newtonRaphson(f, df, 1.5, { tol: 1e-12 });
    expect(r.converged).toBe(true);
    expect(Math.abs(r.root - SQRT2)).toBeLessThan(1e-10);
    // Quadratic convergence: very few iterations needed.
    expect(r.iterations.length).toBeLessThan(10);
  });

  it("Newton-Raphson handles a near-zero derivative gracefully", () => {
    // f(x) = x^2 has a double root at 0 and f'(0) = 0; start exactly at 0.
    const g = (x: number) => x * x;
    const dg = (x: number) => 2 * x;
    const r = newtonRaphson(g, dg, 0, { tol: 1e-12 });
    // Starting at the root: f(0)=0 converges immediately, OR derivative floor
    // triggers. Either way it must not throw and must report a result.
    expect(typeof r.converged).toBe("boolean");
  });

  it("Newton-Raphson reports derivative-too-small on a flat start", () => {
    // f(x) = cos(x); derivative -sin(x) is 0 at x = 0.
    const r = newtonRaphson(Math.cos, (x) => -Math.sin(x), 0);
    expect(r.converged).toBe(false);
    expect(r.reason).toMatch(/derivative/i);
  });

  it("secant converges to sqrt(2) superlinearly", () => {
    const r = secant(f, 1, 2, { tol: 1e-12 });
    expect(r.converged).toBe(true);
    expect(Math.abs(r.root - SQRT2)).toBeLessThan(1e-10);
    expect(r.iterations.length).toBeLessThan(15);
  });

  it("Newton converges in fewer iterations than bisection at equal tol", () => {
    const tol = 1e-10;
    const bis = bisection(f, 0, 2, { tol, maxIter: 200 });
    const newt = newtonRaphson(f, df, 1.5, { tol });
    expect(newt.iterations.length).toBeLessThan(bis.iterations.length);
  });
});
