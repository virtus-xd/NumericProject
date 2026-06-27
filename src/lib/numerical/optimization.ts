/**
 * Optimization (Exam topic A.8), implemented from scratch.
 *
 * Scalar: golden-section search (derivative-free, bracketing).
 * Multivariate: gradient descent, Newton's method, and Nelder-Mead
 * (derivative-free simplex). Each solver returns the full search path so the UI
 * can draw it over a function curve or a contour plot, and each guards against
 * NaN/Inf and non-convergence.
 */

import {
  DEFAULT_MAX_ITER,
  DEFAULT_TOL,
  isFiniteNumber,
  ScalarFn,
  SolveOptions,
  VectorFn,
} from "./types";
import { gaussianElimination, type Matrix } from "./linalg";

/** One step of an optimization run. */
export interface OptStep {
  iter: number;
  x: number[];
  f: number;
  /** Gradient norm at this step (gradient-based methods only). */
  gradNorm?: number;
}

/** Result object returned by every optimizer. */
export interface OptResult {
  method: string;
  xStar: number[];
  fStar: number;
  converged: boolean;
  reason?: string;
  steps: OptStep[];
}

/** Euclidean norm of a vector. */
function norm(v: number[]): number {
  return Math.sqrt(v.reduce((s, vi) => s + vi * vi, 0));
}

/**
 * Golden-section search for the minimum of a unimodal scalar function on [a, b].
 * Shrinks the bracket by the golden ratio each step, keeping one interior
 * evaluation. Linear convergence with factor ≈ 0.618 per iteration.
 */
export function goldenSection(
  f: ScalarFn,
  a: number,
  b: number,
  opts: SolveOptions = {},
): OptResult {
  const tol = opts.tol ?? 1e-8;
  const maxIter = opts.maxIter ?? DEFAULT_MAX_ITER;
  const steps: OptStep[] = [];
  const invphi = (Math.sqrt(5) - 1) / 2; // 1/phi ≈ 0.618

  let lo = Math.min(a, b);
  let hi = Math.max(a, b);
  if (!isFiniteNumber(f(lo)) || !isFiniteNumber(f(hi))) {
    return failed("Golden section", "Function is not finite at a bracket endpoint.");
  }

  let c = hi - invphi * (hi - lo);
  let d = lo + invphi * (hi - lo);
  let fc = f(c);
  let fd = f(d);

  for (let iter = 1; iter <= maxIter; iter++) {
    if (fc < fd) {
      hi = d;
      d = c;
      fd = fc;
      c = hi - invphi * (hi - lo);
      fc = f(c);
    } else {
      lo = c;
      c = d;
      fc = fd;
      d = lo + invphi * (hi - lo);
      fd = f(d);
    }
    const xMid = 0.5 * (lo + hi);
    steps.push({ iter, x: [xMid], f: f(xMid) });
    if (Math.abs(hi - lo) <= tol) {
      return {
        method: "Golden section",
        xStar: [xMid],
        fStar: f(xMid),
        converged: true,
        steps,
      };
    }
  }
  const xMid = 0.5 * (lo + hi);
  return {
    method: "Golden section",
    xStar: [xMid],
    fStar: f(xMid),
    converged: false,
    reason: `Did not reach tolerance within ${maxIter} iterations.`,
    steps,
  };
}

/**
 * Gradient descent with a fixed learning rate: x_{k+1} = x_k - lr * ∇f(x_k).
 * Converges when the gradient norm drops below the tolerance. Simple but
 * sensitive to the learning rate (too large diverges, too small crawls).
 */
export function gradientDescent(
  f: VectorFn,
  grad: (v: number[]) => number[],
  x0: number[],
  lr: number,
  opts: SolveOptions = {},
): OptResult {
  const tol = opts.tol ?? 1e-6;
  const maxIter = opts.maxIter ?? 1000;
  const steps: OptStep[] = [];
  let x = x0.slice();

  for (let iter = 1; iter <= maxIter; iter++) {
    const g = grad(x);
    const gn = norm(g);
    const fx = f(x);
    if (!isFiniteNumber(fx) || g.some((gi) => !isFiniteNumber(gi))) {
      return {
        method: "Gradient descent",
        xStar: x,
        fStar: fx,
        converged: false,
        reason: "Diverged to a non-finite value (try a smaller learning rate).",
        steps,
      };
    }
    steps.push({ iter, x: x.slice(), f: fx, gradNorm: gn });
    if (gn <= tol) {
      return { method: "Gradient descent", xStar: x, fStar: fx, converged: true, steps };
    }
    x = x.map((xi, i) => xi - lr * g[i]);
  }
  return {
    method: "Gradient descent",
    xStar: x,
    fStar: f(x),
    converged: false,
    reason: `Did not reach tolerance within ${maxIter} iterations.`,
    steps,
  };
}

/**
 * Newton's method in N dimensions: solves H(x) d = -∇f(x) for the step d and
 * updates x ← x + d. Quadratic convergence near a minimum where the Hessian is
 * positive definite; reports failure if the Hessian is singular.
 */
export function newtonND(
  f: VectorFn,
  grad: (v: number[]) => number[],
  hess: (v: number[]) => Matrix,
  x0: number[],
  opts: SolveOptions = {},
): OptResult {
  const tol = opts.tol ?? 1e-8;
  const maxIter = opts.maxIter ?? DEFAULT_MAX_ITER;
  const steps: OptStep[] = [];
  let x = x0.slice();

  for (let iter = 1; iter <= maxIter; iter++) {
    const g = grad(x);
    const gn = norm(g);
    const fx = f(x);
    steps.push({ iter, x: x.slice(), f: fx, gradNorm: gn });
    if (gn <= tol) {
      return { method: "Newton (ND)", xStar: x, fStar: fx, converged: true, steps };
    }
    const H = hess(x);
    const negG = g.map((gi) => -gi);
    const solve = gaussianElimination(H, negG);
    if (!solve.converged) {
      return {
        method: "Newton (ND)",
        xStar: x,
        fStar: fx,
        converged: false,
        reason: "Hessian is singular; Newton step is undefined.",
        steps,
      };
    }
    const xNext = x.map((xi, i) => xi + solve.solution[i]);
    if (xNext.some((v) => !isFiniteNumber(v))) {
      return {
        method: "Newton (ND)",
        xStar: x,
        fStar: fx,
        converged: false,
        reason: "Iteration produced a non-finite value.",
        steps,
      };
    }
    x = xNext;
  }
  return {
    method: "Newton (ND)",
    xStar: x,
    fStar: f(x),
    converged: false,
    reason: `Did not reach tolerance within ${maxIter} iterations.`,
    steps,
  };
}

/**
 * Nelder-Mead downhill simplex: a derivative-free method that reflects,
 * expands, contracts and shrinks a simplex of n+1 points to roll downhill.
 * Robust for noisy or non-smooth objectives where gradients are unavailable.
 */
export function nelderMead(
  f: VectorFn,
  x0: number[],
  opts: SolveOptions = {},
): OptResult {
  const tol = opts.tol ?? 1e-8;
  const maxIter = opts.maxIter ?? 500;
  const steps: OptStep[] = [];
  const n = x0.length;

  // Standard reflection / expansion / contraction / shrink coefficients.
  const alpha = 1;
  const gamma = 2;
  const rho = 0.5;
  const sigma = 0.5;

  // Build the initial simplex by perturbing each coordinate.
  let simplex: number[][] = [x0.slice()];
  for (let i = 0; i < n; i++) {
    const pt = x0.slice();
    pt[i] += pt[i] !== 0 ? 0.05 * pt[i] : 0.05;
    simplex.push(pt);
  }
  let fvals = simplex.map((p) => f(p));

  const centroid = (excludeIdx: number): number[] => {
    const c = new Array<number>(n).fill(0);
    for (let i = 0; i < simplex.length; i++) {
      if (i === excludeIdx) continue;
      for (let j = 0; j < n; j++) c[j] += simplex[i][j];
    }
    return c.map((cj) => cj / n);
  };

  for (let iter = 1; iter <= maxIter; iter++) {
    // Sort vertices best -> worst.
    const order = fvals
      .map((v, i) => ({ v, i }))
      .sort((a, b) => a.v - b.v)
      .map((o) => o.i);
    simplex = order.map((i) => simplex[i]);
    fvals = order.map((i) => fvals[i]);

    steps.push({ iter, x: simplex[0].slice(), f: fvals[0] });

    // Convergence: spread of function values across the simplex is tiny.
    const spread = Math.abs(fvals[fvals.length - 1] - fvals[0]);
    if (spread <= tol) {
      return { method: "Nelder-Mead", xStar: simplex[0], fStar: fvals[0], converged: true, steps };
    }

    const worst = simplex.length - 1;
    const c = centroid(worst);

    // Reflection.
    const xr = c.map((cj, j) => cj + alpha * (cj - simplex[worst][j]));
    const fr = f(xr);
    if (fr < fvals[0]) {
      // Expansion.
      const xe = c.map((cj, j) => cj + gamma * (xr[j] - cj));
      const fe = f(xe);
      if (fe < fr) {
        simplex[worst] = xe;
        fvals[worst] = fe;
      } else {
        simplex[worst] = xr;
        fvals[worst] = fr;
      }
    } else if (fr < fvals[worst - 1]) {
      simplex[worst] = xr;
      fvals[worst] = fr;
    } else {
      // Contraction.
      const xc = c.map((cj, j) => cj + rho * (simplex[worst][j] - cj));
      const fc = f(xc);
      if (fc < fvals[worst]) {
        simplex[worst] = xc;
        fvals[worst] = fc;
      } else {
        // Shrink toward the best vertex.
        for (let i = 1; i < simplex.length; i++) {
          simplex[i] = simplex[i].map((xi, j) => simplex[0][j] + sigma * (xi - simplex[0][j]));
          fvals[i] = f(simplex[i]);
        }
      }
    }
  }
  // Return the best vertex found.
  const bestIdx = fvals.indexOf(Math.min(...fvals));
  return {
    method: "Nelder-Mead",
    xStar: simplex[bestIdx],
    fStar: fvals[bestIdx],
    converged: false,
    reason: `Did not reach tolerance within ${maxIter} iterations.`,
    steps,
  };
}

/** Builds a failed scalar result with no steps. */
function failed(method: string, reason: string): OptResult {
  return { method, xStar: [], fStar: NaN, converged: false, reason, steps: [] };
}
