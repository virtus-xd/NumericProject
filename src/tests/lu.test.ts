import { describe, it, expect } from "vitest";
import {
  luDecompose,
  luSolve,
  determinantFromLU,
  permutationMatrix,
} from "@/lib/numerical/lu";
import { matVec, type Matrix } from "@/lib/numerical/linalg";

const A: Matrix = [
  [2, 1, -1],
  [-3, -1, 2],
  [-2, 1, 2],
];

/** Multiplies two matrices (test helper). */
function matMul(X: Matrix, Y: Matrix): Matrix {
  const n = X.length;
  const m = Y[0].length;
  const p = Y.length;
  const out: Matrix = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++)
      for (let k = 0; k < p; k++) out[i][j] += X[i][k] * Y[k][j];
  return out;
}

describe("LU decomposition (A.7)", () => {
  it("produces factors with P A = L U", () => {
    const { L, U, P } = luDecompose(A);
    const PA = matMul(permutationMatrix(P), A);
    const LU = matMul(L, U);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        expect(LU[i][j]).toBeCloseTo(PA[i][j], 10);
  });

  it("L is unit lower triangular and U is upper triangular", () => {
    const { L, U } = luDecompose(A);
    for (let i = 0; i < 3; i++) {
      expect(L[i][i]).toBeCloseTo(1, 12);
      for (let j = i + 1; j < 3; j++) expect(L[i][j]).toBeCloseTo(0, 12);
      for (let j = 0; j < i; j++) expect(U[i][j]).toBeCloseTo(0, 12);
    }
  });

  it("solves A x = b via forward/back substitution", () => {
    const model = luDecompose(A);
    const b = [8, -11, -3]; // known solution (2, 3, -1)
    const x = luSolve(model, b);
    expect(x[0]).toBeCloseTo(2, 9);
    expect(x[1]).toBeCloseTo(3, 9);
    expect(x[2]).toBeCloseTo(-1, 9);
  });

  it("factors once and reuses the factorization for many right-hand sides", () => {
    const model = luDecompose(A);
    const rhsList = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    for (const b of rhsList) {
      const x = luSolve(model, b);
      const ax = matVec(A, x);
      for (let i = 0; i < 3; i++) expect(ax[i]).toBeCloseTo(b[i], 9);
    }
  });

  it("computes the determinant from the LU factors", () => {
    // det(A) for this matrix is -1.
    expect(determinantFromLU(luDecompose(A))).toBeCloseTo(-1, 8);
  });

  it("throws on a singular matrix", () => {
    expect(() =>
      luDecompose([
        [1, 2],
        [2, 4],
      ]),
    ).toThrow(/singular/i);
  });

  it("throws on a non-square matrix", () => {
    expect(() => luDecompose([[1, 2, 3]])).toThrow();
  });
});
