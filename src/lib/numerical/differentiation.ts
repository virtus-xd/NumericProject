/**
 * Numerical differentiation (Exam topic A.4), implemented from scratch.
 *
 * Finite-difference approximations of f'(x):
 *  - forward / backward: first-order accurate, O(h) truncation error.
 *  - central:            second-order accurate, O(h^2) truncation error.
 *  - richardson:         Richardson extrapolation on central differences,
 *                        fourth-order accurate, O(h^4).
 *
 * The `stepSizeSweep` helper produces the signature log-log "U-curve" data
 * that shows the trade-off between truncation error (large h) and round-off
 * error (small h).
 */

import { ScalarFn } from "./types";

/** Forward difference: (f(x+h) - f(x)) / h. First-order accurate. */
export function forwardDiff(f: ScalarFn, x: number, h: number): number {
  return (f(x + h) - f(x)) / h;
}

/** Backward difference: (f(x) - f(x-h)) / h. First-order accurate. */
export function backwardDiff(f: ScalarFn, x: number, h: number): number {
  return (f(x) - f(x - h)) / h;
}

/** Central difference: (f(x+h) - f(x-h)) / (2h). Second-order accurate. */
export function centralDiff(f: ScalarFn, x: number, h: number): number {
  return (f(x + h) - f(x - h)) / (2 * h);
}

/**
 * Richardson extrapolation combining central differences at step h and h/2 to
 * cancel the leading O(h^2) error term, yielding an O(h^4) estimate:
 *   D = (4 * D(h/2) - D(h)) / 3.
 */
export function richardson(f: ScalarFn, x: number, h: number): number {
  const dH = centralDiff(f, x, h);
  const dHalf = centralDiff(f, x, h / 2);
  return (4 * dHalf - dH) / 3;
}

/**
 * Step-size sweep for the truncation/round-off study (the U-curve).
 * For each h, returns the absolute error of the forward and central
 * approximations against the known exact derivative.
 *
 * @param f        Function to differentiate.
 * @param dfExact  Exact derivative used as the error reference.
 * @param x        Point at which the derivative is evaluated.
 * @param hValues  Step sizes to test (typically log-spaced).
 */
export function stepSizeSweep(
  f: ScalarFn,
  dfExact: ScalarFn,
  x: number,
  hValues: number[],
): { h: number; forwardErr: number; centralErr: number }[] {
  const exact = dfExact(x);
  return hValues.map((h) => ({
    h,
    forwardErr: Math.abs(forwardDiff(f, x, h) - exact),
    centralErr: Math.abs(centralDiff(f, x, h) - exact),
  }));
}

/**
 * Convenience generator for a log-spaced set of step sizes from 10^startExp
 * down to 10^endExp (startExp > endExp), used to drive `stepSizeSweep`.
 */
export function logSpacedSteps(
  startExp: number,
  endExp: number,
  perDecade = 4,
): number[] {
  const steps: number[] = [];
  const total = Math.abs(startExp - endExp) * perDecade;
  for (let i = 0; i <= total; i++) {
    const exp = startExp - i / perDecade;
    steps.push(Math.pow(10, exp));
  }
  return steps;
}
