/**
 * Linear systems (Exam topic A.6), implemented from scratch.
 *
 * Direct solver: Gaussian elimination with partial pivoting.
 * Iterative solvers: Jacobi and Gauss-Seidel, each returning a residual
 * history so the UI can plot convergence. Plus matrix helpers and an
 * infinity-norm condition-number estimate for the stability discussion.
 */

import {
  DEFAULT_MAX_ITER,
  DEFAULT_TOL,
  isFiniteNumber,
  SolveOptions,
} from "./types";

export type Matrix = number[][];
export type Vector = number[];

/** One iteration record for the iterative solvers. */
export interface LinearIteration {
  iter: number;
  x: Vector;
  /** Euclidean norm of the residual b - A x at this step. */
  residual: number;
}

/** Result object returned by every linear-system solver. */
export interface LinearResult {
  method: string;
  solution: Vector;
  converged: boolean;
  reason?: string;
  /** Present for iterative methods (Jacobi, Gauss-Seidel). */
  iterations?: LinearIteration[];
}

/** Deep-copies a matrix so solvers never mutate the caller's data. */
function cloneMatrix(A: Matrix): Matrix {
  return A.map((row) => row.slice());
}

/** Computes the matrix-vector product A x. */
export function matVec(A: Matrix, x: Vector): Vector {
  return A.map((row) => row.reduce((s, aij, j) => s + aij * x[j], 0));
}

/** Euclidean (2-)norm of a vector. */
export function vectorNorm(v: Vector): number {
  return Math.sqrt(v.reduce((s, vi) => s + vi * vi, 0));
}

/** Residual vector b - A x. */
export function residual(A: Matrix, x: Vector, b: Vector): Vector {
  const ax = matVec(A, x);
  return b.map((bi, i) => bi - ax[i]);
}

/** Validates that A is square and b matches its size. Returns null if OK. */
function validateSystem(A: Matrix, b: Vector): string | null {
  const n = A.length;
  if (n === 0) return "Matrix A is empty.";
  if (b.length !== n) return "Dimension mismatch between A and b.";
  for (const row of A) {
    if (row.length !== n) return "Matrix A must be square.";
  }
  return null;
}

/**
 * Gaussian elimination with partial pivoting, followed by back-substitution.
 * Detects a singular (or numerically singular) matrix and reports it via
 * `converged: false` instead of returning garbage.
 *
 * Complexity O(n^3). This is the from-scratch direct solver used as the
 * reference for the iterative methods.
 */
export function gaussianElimination(A: Matrix, b: Vector): LinearResult {
  const err = validateSystem(A, b);
  if (err) {
    return { method: "Gaussian elimination", solution: [], converged: false, reason: err };
  }
  const n = A.length;
  const M = cloneMatrix(A);
  const rhs = b.slice();
  // Threshold below which a pivot is treated as zero (singular system).
  const PIVOT_FLOOR = 1e-14;

  for (let k = 0; k < n; k++) {
    // Partial pivoting: move the row with the largest |entry| in column k up.
    let maxRow = k;
    let maxVal = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > maxVal) {
        maxVal = Math.abs(M[i][k]);
        maxRow = i;
      }
    }
    if (maxVal < PIVOT_FLOOR) {
      return {
        method: "Gaussian elimination",
        solution: [],
        converged: false,
        reason: "Matrix is singular or nearly singular (zero pivot encountered).",
      };
    }
    if (maxRow !== k) {
      [M[k], M[maxRow]] = [M[maxRow], M[k]];
      [rhs[k], rhs[maxRow]] = [rhs[maxRow], rhs[k]];
    }
    // Eliminate column k below the pivot.
    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / M[k][k];
      for (let j = k; j < n; j++) {
        M[i][j] -= factor * M[k][j];
      }
      rhs[i] -= factor * rhs[k];
    }
  }

  // Back-substitution.
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = rhs[i];
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = sum / M[i][i];
  }
  if (x.some((xi) => !isFiniteNumber(xi))) {
    return {
      method: "Gaussian elimination",
      solution: x,
      converged: false,
      reason: "Solution contains non-finite values.",
    };
  }
  return { method: "Gaussian elimination", solution: x, converged: true };
}

/** True when every diagonal entry strictly dominates its row's off-diagonals. */
export function isDiagonallyDominant(A: Matrix): boolean {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    let offSum = 0;
    for (let j = 0; j < n; j++) if (j !== i) offSum += Math.abs(A[i][j]);
    if (Math.abs(A[i][i]) < offSum) return false;
  }
  return true;
}

/**
 * Jacobi iteration: x_i^{(k+1)} = (b_i - sum_{j!=i} a_ij x_j^{(k)}) / a_ii.
 * Each component uses only the PREVIOUS iterate. Converges when A is
 * diagonally dominant; the residual history is returned for plotting.
 */
export function jacobi(
  A: Matrix,
  b: Vector,
  opts: SolveOptions = {},
): LinearResult {
  const validationErr = validateSystem(A, b);
  if (validationErr) {
    return { method: "Jacobi", solution: [], converged: false, reason: validationErr };
  }
  const tol = opts.tol ?? DEFAULT_TOL;
  const maxIter = opts.maxIter ?? DEFAULT_MAX_ITER;
  const n = A.length;
  for (let i = 0; i < n; i++) {
    if (Math.abs(A[i][i]) < 1e-14) {
      return {
        method: "Jacobi",
        solution: [],
        converged: false,
        reason: `Zero on the diagonal at row ${i}; Jacobi requires non-zero diagonal entries.`,
      };
    }
  }

  let x = new Array<number>(n).fill(0);
  const iterations: LinearIteration[] = [];

  for (let iter = 1; iter <= maxIter; iter++) {
    const xNew = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = b[i];
      for (let j = 0; j < n; j++) if (j !== i) sum -= A[i][j] * x[j];
      xNew[i] = sum / A[i][i];
    }
    if (xNew.some((v) => !isFiniteNumber(v))) {
      return {
        method: "Jacobi",
        solution: xNew,
        converged: false,
        reason: "Iteration diverged to non-finite values (matrix may not be diagonally dominant).",
        iterations,
      };
    }
    const res = vectorNorm(residual(A, xNew, b));
    iterations.push({ iter, x: xNew.slice(), residual: res });
    x = xNew;
    if (res <= tol) {
      return { method: "Jacobi", solution: x, converged: true, iterations };
    }
  }
  return {
    method: "Jacobi",
    solution: x,
    converged: false,
    reason: `Did not reach tolerance within ${maxIter} iterations.`,
    iterations,
  };
}

/**
 * Gauss-Seidel iteration: like Jacobi, but uses already-updated components
 * within the same sweep, so it typically converges in fewer iterations.
 */
export function gaussSeidel(
  A: Matrix,
  b: Vector,
  opts: SolveOptions = {},
): LinearResult {
  const validationErr = validateSystem(A, b);
  if (validationErr) {
    return { method: "Gauss-Seidel", solution: [], converged: false, reason: validationErr };
  }
  const tol = opts.tol ?? DEFAULT_TOL;
  const maxIter = opts.maxIter ?? DEFAULT_MAX_ITER;
  const n = A.length;
  for (let i = 0; i < n; i++) {
    if (Math.abs(A[i][i]) < 1e-14) {
      return {
        method: "Gauss-Seidel",
        solution: [],
        converged: false,
        reason: `Zero on the diagonal at row ${i}; Gauss-Seidel requires non-zero diagonal entries.`,
      };
    }
  }

  const x = new Array<number>(n).fill(0);
  const iterations: LinearIteration[] = [];

  for (let iter = 1; iter <= maxIter; iter++) {
    for (let i = 0; i < n; i++) {
      let sum = b[i];
      for (let j = 0; j < n; j++) if (j !== i) sum -= A[i][j] * x[j];
      x[i] = sum / A[i][i]; // immediately reused by later components
    }
    if (x.some((v) => !isFiniteNumber(v))) {
      return {
        method: "Gauss-Seidel",
        solution: x.slice(),
        converged: false,
        reason: "Iteration diverged to non-finite values (matrix may not be diagonally dominant).",
        iterations,
      };
    }
    const res = vectorNorm(residual(A, x, b));
    iterations.push({ iter, x: x.slice(), residual: res });
    if (res <= tol) {
      return { method: "Gauss-Seidel", solution: x.slice(), converged: true, iterations };
    }
  }
  return {
    method: "Gauss-Seidel",
    solution: x.slice(),
    converged: false,
    reason: `Did not reach tolerance within ${maxIter} iterations.`,
    iterations,
  };
}

/** Infinity-norm (maximum absolute row sum) of a matrix. */
export function matrixInfNorm(A: Matrix): number {
  let max = 0;
  for (const row of A) {
    const rowSum = row.reduce((s, v) => s + Math.abs(v), 0);
    if (rowSum > max) max = rowSum;
  }
  return max;
}

/**
 * Computes the inverse of A via Gauss-Jordan elimination with partial pivoting.
 * Returns null when A is singular. Used internally by `conditionNumber`.
 */
export function inverse(A: Matrix): Matrix | null {
  const n = A.length;
  if (n === 0 || A.some((r) => r.length !== n)) return null;
  // Augment [A | I].
  const M = A.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);
  const PIVOT_FLOOR = 1e-14;

  for (let k = 0; k < n; k++) {
    let maxRow = k;
    let maxVal = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > maxVal) {
        maxVal = Math.abs(M[i][k]);
        maxRow = i;
      }
    }
    if (maxVal < PIVOT_FLOOR) return null;
    if (maxRow !== k) [M[k], M[maxRow]] = [M[maxRow], M[k]];
    const pivot = M[k][k];
    for (let j = 0; j < 2 * n; j++) M[k][j] /= pivot;
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const factor = M[i][k];
      for (let j = 0; j < 2 * n; j++) M[i][j] -= factor * M[k][j];
    }
  }
  return M.map((row) => row.slice(n));
}

/**
 * Condition number in the infinity norm: cond(A) = ||A||_inf * ||A^-1||_inf.
 * A large value signals that the system is ill-conditioned and that small
 * perturbations in b can cause large changes in the solution. Returns Infinity
 * for a singular matrix.
 */
export function conditionNumber(A: Matrix): number {
  const inv = inverse(A);
  if (!inv) return Infinity;
  return matrixInfNorm(A) * matrixInfNorm(inv);
}
