/**
 * LU decomposition (Exam topic A.7), implemented from scratch.
 *
 * Factors a square matrix with partial pivoting so that P A = L U, where L is
 * unit-lower-triangular and U is upper-triangular. The key benefit demonstrated
 * on the page: factor ONCE (O(n^3)), then solve for many right-hand sides
 * cheaply (O(n^2) each) via forward + back substitution.
 */

import { isFiniteNumber } from "./types";
import type { Matrix, Vector } from "./linalg";

/** Factorization result: P A = L U, with P stored as a row-permutation array. */
export interface LUModel {
  L: Matrix;
  U: Matrix;
  /** P[i] is the original row index now sitting in row i. */
  P: number[];
  /** Number of row swaps performed (the sign of det(A) is (-1)^swaps). */
  swaps: number;
}

/**
 * Doolittle LU decomposition with partial pivoting.
 * @throws Error if A is not square or is singular (truly invalid input for LU).
 */
export function luDecompose(A: Matrix): LUModel {
  const n = A.length;
  if (n === 0 || A.some((r) => r.length !== n)) {
    throw new Error("luDecompose requires a non-empty square matrix.");
  }
  const PIVOT_FLOOR = 1e-14;

  // Work on a copy; U is built in place, L accumulates the multipliers.
  const U: Matrix = A.map((row) => row.slice());
  const L: Matrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
  const P = Array.from({ length: n }, (_, i) => i);
  let swaps = 0;

  for (let k = 0; k < n; k++) {
    // Partial pivot: largest |entry| in column k at or below the diagonal.
    let maxRow = k;
    let maxVal = Math.abs(U[k][k]);
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(U[i][k]) > maxVal) {
        maxVal = Math.abs(U[i][k]);
        maxRow = i;
      }
    }
    if (maxVal < PIVOT_FLOOR) {
      throw new Error("Matrix is singular; LU decomposition does not exist.");
    }
    if (maxRow !== k) {
      [U[k], U[maxRow]] = [U[maxRow], U[k]];
      [P[k], P[maxRow]] = [P[maxRow], P[k]];
      // Swap the already-computed part of L (columns 0..k-1) to stay consistent.
      for (let j = 0; j < k; j++) {
        [L[k][j], L[maxRow][j]] = [L[maxRow][j], L[k][j]];
      }
      swaps++;
    }
    // Eliminate below the pivot, recording multipliers in L.
    for (let i = k + 1; i < n; i++) {
      const factor = U[i][k] / U[k][k];
      L[i][k] = factor;
      for (let j = k; j < n; j++) {
        U[i][j] -= factor * U[k][j];
      }
    }
  }
  return { L, U, P, swaps };
}

/**
 * Solves A x = b using a precomputed LU factorization.
 * Applies the permutation to b, then forward substitution (L y = P b) and
 * back substitution (U x = y). O(n^2) per right-hand side.
 */
export function luSolve(model: LUModel, b: Vector): Vector {
  const { L, U, P } = model;
  const n = L.length;
  if (b.length !== n) {
    throw new Error("luSolve: right-hand side length does not match the factor size.");
  }
  // Apply the row permutation: pb[i] = b[P[i]].
  const pb = P.map((srcRow) => b[srcRow]);

  // Forward substitution: L y = pb (L is unit lower triangular).
  const y = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = pb[i];
    for (let j = 0; j < i; j++) sum -= L[i][j] * y[j];
    y[i] = sum; // diagonal of L is 1
  }

  // Back substitution: U x = y.
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = y[i];
    for (let j = i + 1; j < n; j++) sum -= U[i][j] * x[j];
    x[i] = sum / U[i][i];
  }
  return x;
}

/**
 * Determinant from the LU factors: product of U's diagonal times the pivot
 * sign (-1)^swaps. Returns NaN if any factor entry is non-finite.
 */
export function determinantFromLU(model: LUModel): number {
  let det = model.swaps % 2 === 0 ? 1 : -1;
  for (let i = 0; i < model.U.length; i++) det *= model.U[i][i];
  return isFiniteNumber(det) ? det : NaN;
}

/** Builds the explicit permutation matrix P (rows of the identity reordered). */
export function permutationMatrix(P: number[]): Matrix {
  const n = P.length;
  return P.map((srcRow) =>
    Array.from({ length: n }, (_, j) => (j === srcRow ? 1 : 0)),
  );
}
