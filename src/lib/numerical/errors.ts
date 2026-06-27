/**
 * Error analysis & floating-point precision utilities (Exam topic A.1).
 *
 * All functions are pure and implemented from scratch. They power the
 * `/error-analysis` page: machine epsilon, absolute/relative error,
 * catastrophic cancellation, and naive vs. compensated (Kahan) summation.
 */

import { isFiniteNumber } from "./types";

/**
 * Machine epsilon for IEEE-754 double precision, COMPUTED at module load
 * (not hard-coded) by finding the smallest e such that 1 + e !== 1.
 * The result equals 2^-52 ≈ 2.220446049250313e-16.
 */
export const MACHINE_EPSILON: number = (() => {
  let eps = 1;
  while (1 + eps / 2 !== 1) {
    eps /= 2;
  }
  return eps;
})();

/**
 * Absolute error |approx - exact|.
 * @param approx Computed approximation.
 * @param exact  Reference / exact value.
 */
export function absoluteError(approx: number, exact: number): number {
  return Math.abs(approx - exact);
}

/**
 * Relative error |approx - exact| / |exact|.
 * Falls back to the absolute error when exact is 0 to avoid division by zero.
 */
export function relativeError(approx: number, exact: number): number {
  if (exact === 0) return Math.abs(approx - exact);
  return Math.abs(approx - exact) / Math.abs(exact);
}

/**
 * Naive left-to-right summation. Included for comparison against Kahan
 * summation to demonstrate round-off error accumulation.
 */
export function naiveSum(values: number[]): number {
  let sum = 0;
  for (const v of values) sum += v;
  return sum;
}

/**
 * Kahan compensated summation: tracks a running compensation term to recover
 * low-order bits lost during floating-point addition. Reduces the error of a
 * length-N sum from O(N * eps) (naive) to O(eps), independent of N.
 */
export function kahanSum(values: number[]): number {
  let sum = 0;
  let compensation = 0; // running lost-low-order-bits term
  for (const v of values) {
    const y = v - compensation;
    const t = sum + y;
    // (t - sum) recovers the high-order part of y; subtracting y yields the
    // part of y that was lost in the addition.
    compensation = t - sum - y;
    sum = t;
  }
  return sum;
}

/**
 * Accumulation demo: add the value 0.1 exactly `n` times.
 *
 * The exact answer is 0.1 * n, but 0.1 is not representable in binary, so the
 * naive running sum drifts. Kahan summation stays far closer to the exact value.
 *
 * @returns the naive sum, the Kahan sum and the exact reference value.
 */
export function accumulationDemo(n: number): {
  naive: number;
  kahan: number;
  exact: number;
} {
  const term = 0.1;
  const values = new Array<number>(n).fill(term);
  return {
    naive: naiveSum(values),
    kahan: kahanSum(values),
    exact: term * n,
  };
}

/**
 * Catastrophic cancellation demo. Computes f(x) = (1 - cos x) / x^2 in two ways:
 *  - `naive`: the direct formula, which loses precision for small x because
 *    1 - cos x subtracts two nearly equal numbers.
 *  - `stable`: an algebraically equivalent form using sin(x/2) that avoids the
 *    cancellation. The true limit as x -> 0 is 1/2.
 */
export function cancellationDemo(x: number): {
  naive: number;
  stable: number;
  exact: number;
} {
  const naive = (1 - Math.cos(x)) / (x * x);
  const s = Math.sin(x / 2);
  const stable = (2 * s * s) / (x * x); // 1 - cos x = 2 sin^2(x/2)
  return { naive, stable, exact: 0.5 };
}

/**
 * The canonical floating-point surprise: 0.1 + 0.2 !== 0.3.
 * Returns the computed sum, the literal 0.3, whether they are exactly equal,
 * and the tiny difference between them.
 */
export function floatingPointSurprise(): {
  sum: number;
  expected: number;
  equal: boolean;
  difference: number;
} {
  const sum = 0.1 + 0.2;
  const expected = 0.3;
  return {
    sum,
    expected,
    equal: sum === expected,
    difference: sum - expected,
  };
}

/**
 * Builds an error-growth series for plotting: for k = 1..n terms of 0.1,
 * report the absolute error of the naive and Kahan running sums against the
 * exact value 0.1 * k. Demonstrates that naive error grows while Kahan stays flat.
 */
export function summationErrorSeries(
  n: number,
): { k: number; naiveErr: number; kahanErr: number }[] {
  const series: { k: number; naiveErr: number; kahanErr: number }[] = [];
  const term = 0.1;
  let naive = 0;
  let kahanSumValue = 0;
  let compensation = 0;
  for (let k = 1; k <= n; k++) {
    naive += term;
    const y = term - compensation;
    const t = kahanSumValue + y;
    compensation = t - kahanSumValue - y;
    kahanSumValue = t;
    const exact = term * k;
    if (!isFiniteNumber(naive)) break;
    series.push({
      k,
      naiveErr: Math.abs(naive - exact),
      kahanErr: Math.abs(kahanSumValue - exact),
    });
  }
  return series;
}
