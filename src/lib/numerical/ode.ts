/**
 * Ordinary differential equation solvers (Exam topic A.9), from scratch.
 *
 * Solves a first-order system y' = f(t, y) (higher-order ODEs are reduced to
 * first-order systems by the caller). Three methods of increasing
 * sophistication: explicit Euler, classic RK4, and an adaptive Dormand-Prince
 * RK45 with automatic step-size control. Each returns the full trajectory so
 * the UI can plot solutions and (for RK45) the shrinking step sizes.
 */

import { isFiniteNumber, SystemFn } from "./types";

/** Solution trajectory sampled at the time points the method produced. */
export interface ODESolution {
  method: string;
  t: number[];
  /** y[k] is the state vector at time t[k]. */
  y: number[][];
  nSteps: number;
  /** Present for adaptive methods: the step size accepted at each point. */
  stepSizes?: number[];
}

/** Adds two state vectors scaled: a + s * b. */
function axpy(a: number[], s: number, b: number[]): number[] {
  return a.map((ai, i) => ai + s * b[i]);
}

/**
 * Explicit (forward) Euler: y_{n+1} = y_n + h f(t_n, y_n).
 * First-order accurate, O(h) global error. Cheap but needs small steps for
 * accuracy and can be unstable for stiff problems.
 */
export function euler(
  f: SystemFn,
  y0: number[],
  t0: number,
  tEnd: number,
  h: number,
): ODESolution {
  const t: number[] = [t0];
  const y: number[][] = [y0.slice()];
  let tn = t0;
  let yn = y0.slice();
  const steps = Math.max(1, Math.ceil((tEnd - t0) / h));

  for (let i = 0; i < steps; i++) {
    const k1 = f(tn, yn);
    yn = axpy(yn, h, k1);
    tn = tn + h;
    if (yn.some((v) => !isFiniteNumber(v))) break;
    t.push(tn);
    y.push(yn.slice());
  }
  return { method: "Euler", t, y, nSteps: t.length - 1 };
}

/**
 * Classic fourth-order Runge-Kutta (RK4). Combines four slope evaluations per
 * step for O(h^4) global accuracy — vastly more accurate than Euler at the same
 * step size, for four times the work per step.
 */
export function rk4(
  f: SystemFn,
  y0: number[],
  t0: number,
  tEnd: number,
  h: number,
): ODESolution {
  const t: number[] = [t0];
  const y: number[][] = [y0.slice()];
  let tn = t0;
  let yn = y0.slice();
  const steps = Math.max(1, Math.ceil((tEnd - t0) / h));

  for (let i = 0; i < steps; i++) {
    const k1 = f(tn, yn);
    const k2 = f(tn + h / 2, axpy(yn, h / 2, k1));
    const k3 = f(tn + h / 2, axpy(yn, h / 2, k2));
    const k4 = f(tn + h, axpy(yn, h, k3));
    yn = yn.map(
      (yi, j) => yi + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]),
    );
    tn = tn + h;
    if (yn.some((v) => !isFiniteNumber(v))) break;
    t.push(tn);
    y.push(yn.slice());
  }
  return { method: "RK4", t, y, nSteps: t.length - 1 };
}

/**
 * Adaptive Runge-Kutta-Fehlberg via the Dormand-Prince (RK45) pair. Each step
 * computes a 5th- and an embedded 4th-order estimate; their difference drives
 * an automatic step-size controller that shrinks h where the solution changes
 * fast and grows it where the solution is smooth — meeting the tolerance with
 * far fewer evaluations than a fixed small step.
 */
export function rk45Adaptive(
  f: SystemFn,
  y0: number[],
  t0: number,
  tEnd: number,
  tol: number,
  maxSteps = 100000,
): ODESolution {
  // Dormand-Prince Butcher tableau.
  const c = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];
  const a: number[][] = [
    [],
    [1 / 5],
    [3 / 40, 9 / 40],
    [44 / 45, -56 / 15, 32 / 9],
    [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
    [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
    [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
  ];
  const b5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
  const b4 = [
    5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100,
    1 / 40,
  ];

  const t: number[] = [t0];
  const y: number[][] = [y0.slice()];
  const stepSizes: number[] = [];
  let tn = t0;
  let yn = y0.slice();
  // Initial step guess: a small fraction of the interval.
  let h = (tEnd - t0) / 100;
  const safety = 0.9;
  const minScale = 0.2;
  const maxScale = 5;

  let count = 0;
  while (tn < tEnd && count < maxSteps) {
    count++;
    if (tn + h > tEnd) h = tEnd - tn; // do not overshoot the end

    // Evaluate the seven stages.
    const k: number[][] = [];
    k[0] = f(tn, yn);
    for (let s = 1; s < 7; s++) {
      let yi = yn.slice();
      for (let j = 0; j < s; j++) {
        yi = axpy(yi, h * a[s][j], k[j]);
      }
      k[s] = f(tn + c[s] * h, yi);
    }

    // 5th- and 4th-order solutions and their difference.
    const y5 = yn.map(
      (yi, idx) => yi + h * b5.reduce((acc, bj, s) => acc + bj * k[s][idx], 0),
    );
    const y4 = yn.map(
      (yi, idx) => yi + h * b4.reduce((acc, bj, s) => acc + bj * k[s][idx], 0),
    );
    let errNorm = 0;
    for (let idx = 0; idx < yn.length; idx++) {
      const scale = tol + tol * Math.max(Math.abs(yn[idx]), Math.abs(y5[idx]));
      const e = (y5[idx] - y4[idx]) / scale;
      errNorm += e * e;
    }
    errNorm = Math.sqrt(errNorm / yn.length);

    if (!y5.every((v) => isFiniteNumber(v))) {
      break; // diverged; stop gracefully and return what we have
    }

    if (errNorm <= 1) {
      // Accept the step.
      tn = tn + h;
      yn = y5;
      t.push(tn);
      y.push(yn.slice());
      stepSizes.push(h);
    }
    // Adapt the step size for next time (5th-order error exponent 1/5).
    const scale =
      errNorm === 0
        ? maxScale
        : Math.min(maxScale, Math.max(minScale, safety * Math.pow(errNorm, -0.2)));
    h = h * scale;
  }

  return {
    method: "RK45 (Dormand-Prince)",
    t,
    y,
    nSteps: t.length - 1,
    stepSizes,
  };
}

/* ----------------------------------------------------------------------------
 * Demo systems used by the ODE page (and by tests where a closed form exists).
 * -------------------------------------------------------------------------- */

/** Logistic growth y' = r y (1 - y/K). Has a closed-form solution. */
export function logistic(r: number, K: number): SystemFn {
  return (_t, y) => [r * y[0] * (1 - y[0] / K)];
}

/** Closed-form logistic solution for validating the solvers. */
export function logisticExact(
  r: number,
  K: number,
  y0: number,
): (t: number) => number {
  return (t) => {
    const A = (K - y0) / y0;
    return K / (1 + A * Math.exp(-r * t));
  };
}

/** Simple pendulum: theta'' = -(g/L) sin(theta), as a first-order system. */
export function pendulum(g = 9.81, L = 1): SystemFn {
  return (_t, y) => [y[1], -(g / L) * Math.sin(y[0])];
}

/**
 * Projectile with quadratic air drag. State [x, y, vx, vy].
 * m v' = -m g ĵ - k |v| v.
 */
export function projectileDrag(g = 9.81, k = 0.1, m = 1): SystemFn {
  return (_t, s) => {
    const [, , vx, vy] = s;
    const speed = Math.hypot(vx, vy);
    return [
      vx,
      vy,
      (-k * speed * vx) / m,
      -g - (k * speed * vy) / m,
    ];
  };
}
