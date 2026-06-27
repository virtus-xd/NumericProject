import { describe, it, expect } from "vitest";
import {
  gaussianElimination,
  jacobi,
  gaussSeidel,
  matVec,
  conditionNumber,
  isDiagonallyDominant,
  inverse,
} from "@/lib/numerical/linalg";

// A well-conditioned, diagonally dominant system with known solution.
// 4x + y = 1 ; x + 3y = 2  ->  x = 1/11, y = 7/11.
const A = [
  [4, 1],
  [1, 3],
];
const b = [1, 2];
const expected = [1 / 11, 7 / 11];

describe("linear systems (A.6)", () => {
  it("Gaussian elimination solves a 2x2 system", () => {
    const r = gaussianElimination(A, b);
    expect(r.converged).toBe(true);
    expect(r.solution[0]).toBeCloseTo(expected[0], 10);
    expect(r.solution[1]).toBeCloseTo(expected[1], 10);
  });

  it("Gaussian elimination solves a 3x3 system and A x ≈ b", () => {
    const A3 = [
      [2, 1, -1],
      [-3, -1, 2],
      [-2, 1, 2],
    ];
    const b3 = [8, -11, -3];
    const r = gaussianElimination(A3, b3);
    expect(r.converged).toBe(true);
    const ax = matVec(A3, r.solution);
    for (let i = 0; i < b3.length; i++) {
      expect(ax[i]).toBeCloseTo(b3[i], 9);
    }
    // Known solution is (2, 3, -1).
    expect(r.solution[0]).toBeCloseTo(2, 8);
    expect(r.solution[1]).toBeCloseTo(3, 8);
    expect(r.solution[2]).toBeCloseTo(-1, 8);
  });

  it("Gaussian elimination reports a singular matrix gracefully", () => {
    const singular = [
      [1, 2],
      [2, 4],
    ];
    const r = gaussianElimination(singular, [1, 2]);
    expect(r.converged).toBe(false);
    expect(r.reason).toMatch(/singular/i);
  });

  it("Jacobi converges on a diagonally dominant system", () => {
    expect(isDiagonallyDominant(A)).toBe(true);
    const r = jacobi(A, b, { tol: 1e-10, maxIter: 500 });
    expect(r.converged).toBe(true);
    expect(r.solution[0]).toBeCloseTo(expected[0], 8);
    expect(r.solution[1]).toBeCloseTo(expected[1], 8);
    expect(r.iterations && r.iterations.length).toBeGreaterThan(0);
  });

  it("Gauss-Seidel converges in fewer iterations than Jacobi", () => {
    const opts = { tol: 1e-10, maxIter: 500 };
    const j = jacobi(A, b, opts);
    const gs = gaussSeidel(A, b, opts);
    expect(gs.converged).toBe(true);
    expect(gs.iterations!.length).toBeLessThanOrEqual(j.iterations!.length);
    expect(gs.solution[0]).toBeCloseTo(expected[0], 8);
  });

  it("Jacobi reports a zero diagonal instead of dividing by zero", () => {
    const r = jacobi(
      [
        [0, 1],
        [1, 0],
      ],
      [1, 1],
    );
    expect(r.converged).toBe(false);
    expect(r.reason).toMatch(/diagonal/i);
  });

  it("computes the inverse and a sensible condition number", () => {
    const inv = inverse(A);
    expect(inv).not.toBeNull();
    // A * A^-1 ≈ I (check every entry of the product).
    const n = A.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let s = 0;
        for (let k = 0; k < n; k++) s += A[i][k] * inv![k][j];
        expect(s).toBeCloseTo(i === j ? 1 : 0, 8);
      }
    }
    const cond = conditionNumber(A);
    expect(cond).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(cond)).toBe(true);
  });

  it("condition number of a singular matrix is Infinity", () => {
    expect(
      conditionNumber([
        [1, 2],
        [2, 4],
      ]),
    ).toBe(Infinity);
  });
});
