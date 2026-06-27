/**
 * Shared type definitions for the from-scratch numerical library.
 *
 * Design principle (see CLAUDE.md §5): every solver is a pure function that
 * returns a typed result object containing the final answer AND the full step
 * history, so the UI can render tables, plots and animations from one source.
 */

/** A scalar function f: R -> R. */
export type ScalarFn = (x: number) => number;

/** A function of two variables f: R^2 -> R. */
export type TwoVarFn = (x: number, y: number) => number;

/** A function f: R^n -> R (used by the optimization module). */
export type VectorFn = (v: number[]) => number;

/** Right-hand side of an ODE system y' = f(t, y), f: R x R^n -> R^n. */
export type SystemFn = (t: number, y: number[]) => number[];

/** Common options accepted by iterative solvers. */
export interface SolveOptions {
  /** Convergence tolerance. Default: 1e-10. */
  tol?: number;
  /** Maximum number of iterations before giving up. Default: 100. */
  maxIter?: number;
}

/** Default tolerance used across the library when none is supplied. */
export const DEFAULT_TOL = 1e-10;

/** Default iteration cap used across the library when none is supplied. */
export const DEFAULT_MAX_ITER = 100;

/**
 * Returns true when a numeric value is a usable finite number.
 * Guards every solver against NaN / +-Infinity propagation.
 */
export function isFiniteNumber(x: number): boolean {
  return typeof x === "number" && Number.isFinite(x);
}
