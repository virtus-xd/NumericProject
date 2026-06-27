/**
 * Root-finding methods (Exam topic A.2), implemented from scratch.
 *
 * Methods: bisection (linear convergence, always brackets), Newton-Raphson
 * (quadratic convergence when started near a simple root), and the secant
 * method (superlinear, no derivative required).
 *
 * Each solver returns the full iteration history so the UI can plot markers
 * and render a per-step error table, and each guards against NaN/Inf,
 * non-convergence (maxIter), and degenerate input.
 */

import {
  DEFAULT_MAX_ITER,
  DEFAULT_TOL,
  isFiniteNumber,
  ScalarFn,
  SolveOptions,
} from "./types";

/** A single iteration record shared by all root-finding methods. */
export interface RootStep {
  iter: number;
  x: number;
  fx: number;
  /** Error estimate for this step (|x_k - x_{k-1}| or half the bracket width). */
  error: number;
  /** Bracket lower bound (bisection only). */
  a?: number;
  /** Bracket upper bound (bisection only). */
  b?: number;
}

/** Result object returned by every root-finding method. */
export interface RootResult {
  method: "bisection" | "newton" | "secant";
  root: number;
  fRoot: number;
  converged: boolean;
  /** Human-readable reason when `converged` is false. */
  reason?: string;
  iterations: RootStep[];
}

/**
 * Bisection method. Requires f(a) and f(b) to have opposite signs so that a
 * root is bracketed; halves the interval each step. Linear convergence
 * (~1 bit per iteration), but guaranteed to converge for a continuous f.
 */
export function bisection(
  f: ScalarFn,
  a: number,
  b: number,
  opts: SolveOptions = {},
): RootResult {
  const tol = opts.tol ?? DEFAULT_TOL;
  const maxIter = opts.maxIter ?? DEFAULT_MAX_ITER;
  const iterations: RootStep[] = [];

  if (a === b) {
    return emptyResult("bisection", "Interval endpoints a and b are equal.");
  }
  let lo = Math.min(a, b);
  let hi = Math.max(a, b);

  let flo = f(lo);
  let fhi = f(hi);
  if (!isFiniteNumber(flo) || !isFiniteNumber(fhi)) {
    return emptyResult(
      "bisection",
      "Function is not finite at an interval endpoint.",
    );
  }
  // An exact root at an endpoint is a valid answer.
  if (flo === 0) return solvedAtEndpoint("bisection", lo, flo);
  if (fhi === 0) return solvedAtEndpoint("bisection", hi, fhi);
  if (Math.sign(flo) === Math.sign(fhi)) {
    return emptyResult(
      "bisection",
      "Interval [a, b] does not bracket a root (f(a) and f(b) have the same sign).",
    );
  }

  let mid = lo;
  let fmid = flo;
  for (let iter = 1; iter <= maxIter; iter++) {
    mid = 0.5 * (lo + hi);
    fmid = f(mid);
    const error = 0.5 * (hi - lo);
    if (!isFiniteNumber(fmid)) {
      return {
        method: "bisection",
        root: mid,
        fRoot: fmid,
        converged: false,
        reason: "Function returned a non-finite value during iteration.",
        iterations,
      };
    }
    iterations.push({ iter, x: mid, fx: fmid, error, a: lo, b: hi });

    if (Math.abs(fmid) <= tol || error <= tol) {
      return {
        method: "bisection",
        root: mid,
        fRoot: fmid,
        converged: true,
        iterations,
      };
    }
    if (Math.sign(fmid) === Math.sign(flo)) {
      lo = mid;
      flo = fmid;
    } else {
      hi = mid;
      fhi = fmid;
    }
  }
  return {
    method: "bisection",
    root: mid,
    fRoot: fmid,
    converged: false,
    reason: `Did not reach tolerance within ${maxIter} iterations.`,
    iterations,
  };
}

/**
 * Newton-Raphson method. Uses x_{k+1} = x_k - f(x_k)/f'(x_k). Quadratic
 * convergence near a simple root, but can diverge or stall when f'(x) ≈ 0;
 * those cases are reported via `converged: false` rather than throwing.
 */
export function newtonRaphson(
  f: ScalarFn,
  df: ScalarFn,
  x0: number,
  opts: SolveOptions = {},
): RootResult {
  const tol = opts.tol ?? DEFAULT_TOL;
  const maxIter = opts.maxIter ?? DEFAULT_MAX_ITER;
  const iterations: RootStep[] = [];
  // Threshold below which the derivative is treated as effectively zero.
  const DERIV_FLOOR = 1e-14;

  let x = x0;
  if (!isFiniteNumber(x)) {
    return emptyResult("newton", "Initial guess x0 is not a finite number.");
  }

  for (let iter = 1; iter <= maxIter; iter++) {
    const fx = f(x);
    const dfx = df(x);
    if (!isFiniteNumber(fx) || !isFiniteNumber(dfx)) {
      return {
        method: "newton",
        root: x,
        fRoot: fx,
        converged: false,
        reason: "Function or derivative returned a non-finite value.",
        iterations,
      };
    }
    if (Math.abs(dfx) < DERIV_FLOOR) {
      return {
        method: "newton",
        root: x,
        fRoot: fx,
        converged: false,
        reason: "Derivative is too close to zero; Newton step is undefined.",
        iterations,
      };
    }
    const xNext = x - fx / dfx;
    const error = Math.abs(xNext - x);
    iterations.push({ iter, x: xNext, fx: f(xNext), error });

    if (Math.abs(fx) <= tol || error <= tol) {
      const fRoot = f(xNext);
      return {
        method: "newton",
        root: xNext,
        fRoot,
        converged: true,
        iterations,
      };
    }
    x = xNext;
  }
  return {
    method: "newton",
    root: x,
    fRoot: f(x),
    converged: false,
    reason: `Did not reach tolerance within ${maxIter} iterations.`,
    iterations,
  };
}

/**
 * Secant method. Approximates the derivative with a finite difference of the
 * two most recent iterates, so no analytic derivative is needed. Superlinear
 * convergence (order ≈ 1.618). Fails gracefully when the secant slope ≈ 0.
 */
export function secant(
  f: ScalarFn,
  x0: number,
  x1: number,
  opts: SolveOptions = {},
): RootResult {
  const tol = opts.tol ?? DEFAULT_TOL;
  const maxIter = opts.maxIter ?? DEFAULT_MAX_ITER;
  const iterations: RootStep[] = [];
  const SLOPE_FLOOR = 1e-14;

  let xPrev = x0;
  let xCurr = x1;
  let fPrev = f(xPrev);
  let fCurr = f(xCurr);
  if (
    !isFiniteNumber(fPrev) ||
    !isFiniteNumber(fCurr) ||
    !isFiniteNumber(xPrev) ||
    !isFiniteNumber(xCurr)
  ) {
    return emptyResult(
      "secant",
      "Function or initial guesses are not finite.",
    );
  }

  for (let iter = 1; iter <= maxIter; iter++) {
    const denom = fCurr - fPrev;
    if (Math.abs(denom) < SLOPE_FLOOR) {
      return {
        method: "secant",
        root: xCurr,
        fRoot: fCurr,
        converged: false,
        reason: "Secant slope is too close to zero; step is undefined.",
        iterations,
      };
    }
    const xNext = xCurr - (fCurr * (xCurr - xPrev)) / denom;
    const fNext = f(xNext);
    const error = Math.abs(xNext - xCurr);
    if (!isFiniteNumber(xNext) || !isFiniteNumber(fNext)) {
      return {
        method: "secant",
        root: xNext,
        fRoot: fNext,
        converged: false,
        reason: "Iteration produced a non-finite value.",
        iterations,
      };
    }
    iterations.push({ iter, x: xNext, fx: fNext, error });

    if (Math.abs(fNext) <= tol || error <= tol) {
      return {
        method: "secant",
        root: xNext,
        fRoot: fNext,
        converged: true,
        iterations,
      };
    }
    xPrev = xCurr;
    fPrev = fCurr;
    xCurr = xNext;
    fCurr = fNext;
  }
  return {
    method: "secant",
    root: xCurr,
    fRoot: fCurr,
    converged: false,
    reason: `Did not reach tolerance within ${maxIter} iterations.`,
    iterations,
  };
}

/** Builds a failed result with no iterations and a reason. */
function emptyResult(
  method: RootResult["method"],
  reason: string,
): RootResult {
  return {
    method,
    root: NaN,
    fRoot: NaN,
    converged: false,
    reason,
    iterations: [],
  };
}

/** Builds a converged result for the case where an endpoint is already a root. */
function solvedAtEndpoint(
  method: RootResult["method"],
  x: number,
  fx: number,
): RootResult {
  return {
    method,
    root: x,
    fRoot: fx,
    converged: true,
    iterations: [{ iter: 0, x, fx, error: 0 }],
  };
}
