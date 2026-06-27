/**
 * Numerical integration (Exam topic A.5), implemented from scratch.
 *
 * Newton-Cotes rules (trapezoid, Simpson 1/3, Simpson 3/8, midpoint), a
 * Monte Carlo estimator, and an adaptive Simpson scheme with error control.
 * Every routine returns an `IntegralResult` describing the method, value and
 * the number of intervals/samples used, plus an error estimate where cheap.
 */

import { isFiniteNumber, ScalarFn } from "./types";

/** Result returned by every integration rule. */
export interface IntegralResult {
  method: string;
  value: number;
  /** Number of sub-intervals (or samples, for Monte Carlo). */
  nIntervals: number;
  /** Optional error estimate when the method can provide one. */
  estimatedError?: number;
}

/**
 * Composite trapezoidal rule over n sub-intervals. Second-order accurate,
 * O(h^2). Exact for linear integrands.
 */
export function trapezoid(
  f: ScalarFn,
  a: number,
  b: number,
  n: number,
): IntegralResult {
  const N = Math.max(1, Math.floor(n));
  const h = (b - a) / N;
  let sum = 0.5 * (f(a) + f(b));
  for (let i = 1; i < N; i++) {
    sum += f(a + i * h);
  }
  return { method: "Trapezoid", value: sum * h, nIntervals: N };
}

/**
 * Composite Simpson's 1/3 rule. Requires an even number of sub-intervals
 * (rounded up). Fourth-order accurate, O(h^4); exact for cubics.
 */
export function simpson(
  f: ScalarFn,
  a: number,
  b: number,
  n: number,
): IntegralResult {
  let N = Math.max(2, Math.floor(n));
  if (N % 2 !== 0) N += 1; // Simpson 1/3 needs an even interval count
  const h = (b - a) / N;
  let sum = f(a) + f(b);
  for (let i = 1; i < N; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  }
  return { method: "Simpson 1/3", value: (sum * h) / 3, nIntervals: N };
}

/**
 * Composite Simpson's 3/8 rule. Requires a multiple of 3 sub-intervals
 * (rounded up). Fourth-order accurate, O(h^4).
 */
export function simpson38(
  f: ScalarFn,
  a: number,
  b: number,
  n: number,
): IntegralResult {
  let N = Math.max(3, Math.floor(n));
  if (N % 3 !== 0) N += 3 - (N % 3); // needs a multiple of 3
  const h = (b - a) / N;
  let sum = f(a) + f(b);
  for (let i = 1; i < N; i++) {
    sum += (i % 3 === 0 ? 2 : 3) * f(a + i * h);
  }
  return { method: "Simpson 3/8", value: (3 * sum * h) / 8, nIntervals: N };
}

/**
 * Composite midpoint rule. Open rule (does not use the endpoints). Second-order
 * accurate, O(h^2); useful when the integrand is singular at an endpoint.
 */
export function midpoint(
  f: ScalarFn,
  a: number,
  b: number,
  n: number,
): IntegralResult {
  const N = Math.max(1, Math.floor(n));
  const h = (b - a) / N;
  let sum = 0;
  for (let i = 0; i < N; i++) {
    sum += f(a + (i + 0.5) * h);
  }
  return { method: "Midpoint", value: sum * h, nIntervals: N };
}

/**
 * Monte Carlo integration: average of `samples` random function evaluations
 * times the interval width. Converges slowly (error ~ O(1/sqrt(N))) but is
 * dimension-independent. The standard-error estimate is reported.
 *
 * @param rng Optional deterministic RNG in [0,1) (defaults to Math.random),
 *            so tests can seed it for reproducibility.
 */
export function monteCarlo(
  f: ScalarFn,
  a: number,
  b: number,
  samples: number,
  rng: () => number = Math.random,
): IntegralResult {
  const N = Math.max(1, Math.floor(samples));
  const width = b - a;
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < N; i++) {
    const fx = f(a + rng() * width);
    sum += fx;
    sumSq += fx * fx;
  }
  const mean = sum / N;
  const variance = Math.max(0, sumSq / N - mean * mean);
  // Standard error of the integral estimate.
  const estimatedError = width * Math.sqrt(variance / N);
  return {
    method: "Monte Carlo",
    value: width * mean,
    nIntervals: N,
    estimatedError,
  };
}

/**
 * Adaptive Simpson's rule. Recursively subdivides where the local Simpson
 * error estimate exceeds the tolerance, concentrating effort where the
 * integrand is hard. Returns the value, the leaf-interval count, and the
 * summed error estimate.
 */
export function adaptiveSimpson(
  f: ScalarFn,
  a: number,
  b: number,
  tol: number,
  maxDepth = 50,
): IntegralResult {
  let intervalCount = 0;
  let errorSum = 0;

  /** Simpson estimate over [lo, hi] given the midpoint value. */
  const simpsonOf = (lo: number, hi: number, flo: number, fmid: number, fhi: number) =>
    ((hi - lo) / 6) * (flo + 4 * fmid + fhi);

  const recurse = (
    lo: number,
    hi: number,
    flo: number,
    fmid: number,
    fhi: number,
    whole: number,
    localTol: number,
    depth: number,
  ): number => {
    const mid = 0.5 * (lo + hi);
    const leftMid = 0.5 * (lo + mid);
    const rightMid = 0.5 * (mid + hi);
    const fLeftMid = f(leftMid);
    const fRightMid = f(rightMid);
    const left = simpsonOf(lo, mid, flo, fLeftMid, fmid);
    const right = simpsonOf(mid, hi, fmid, fRightMid, fhi);
    const delta = left + right - whole;
    // Richardson error estimate for Simpson is delta/15.
    if (depth <= 0 || Math.abs(delta) <= 15 * localTol) {
      intervalCount += 2;
      errorSum += Math.abs(delta) / 15;
      return left + right + delta / 15;
    }
    return (
      recurse(lo, mid, flo, fLeftMid, fmid, left, localTol / 2, depth - 1) +
      recurse(mid, hi, fmid, fRightMid, fhi, right, localTol / 2, depth - 1)
    );
  };

  const fa = f(a);
  const fb = f(b);
  const fm = f(0.5 * (a + b));
  const whole = simpsonOf(a, b, fa, fm, fb);
  const value = recurse(a, b, fa, fm, fb, whole, tol, maxDepth);
  return {
    method: "Adaptive Simpson",
    value,
    nIntervals: intervalCount,
    estimatedError: errorSum,
  };
}

/**
 * Convergence helper: evaluates a rule for a series of interval counts and
 * reports the value and absolute error against a known exact value. Feeds the
 * comparison/convergence plot on the integration page.
 */
export function convergenceSeries(
  rule: (f: ScalarFn, a: number, b: number, n: number) => IntegralResult,
  f: ScalarFn,
  a: number,
  b: number,
  exact: number,
  nValues: number[],
): { n: number; value: number; error: number }[] {
  return nValues.map((n) => {
    const r = rule(f, a, b, n);
    const error = isFiniteNumber(r.value)
      ? Math.abs(r.value - exact)
      : NaN;
    return { n: r.nIntervals, value: r.value, error };
  });
}
