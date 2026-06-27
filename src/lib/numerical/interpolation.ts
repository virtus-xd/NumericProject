/**
 * Interpolation (Exam topic A.3), implemented from scratch.
 *
 * Three classic schemes:
 *  - linearInterp: piecewise-linear through the data points.
 *  - lagrange:     the single polynomial of degree n-1 through all n points.
 *  - cubic spline: a natural cubic spline (C^2-continuous, no end curvature).
 *
 * All routines sort the points by x internally and guard against degenerate
 * input (fewer than two points, duplicate x values).
 */

export interface Point {
  x: number;
  y: number;
}

/** Per-segment cubic coefficients: y = a + b(x-xi) + c(x-xi)^2 + d(x-xi)^3. */
export interface SplineSegment {
  x: number; // left node xi of the segment
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface SplineModel {
  xs: number[];
  segments: SplineSegment[];
}

/** Returns a copy of the points sorted ascending by x. */
function sortedPoints(points: Point[]): Point[] {
  return [...points].sort((p, q) => p.x - q.x);
}

/**
 * Piecewise-linear interpolation. Connects consecutive points with straight
 * lines; for x outside the data range it extrapolates along the nearest
 * segment. Exact, simple, but only C^0 (kinks at the nodes).
 */
export function linearInterp(points: Point[], x: number): number {
  if (points.length < 2) return NaN;
  const p = sortedPoints(points);
  // Locate the bracketing segment (clamp the index for extrapolation).
  let i = 0;
  if (x <= p[0].x) i = 0;
  else if (x >= p[p.length - 1].x) i = p.length - 2;
  else {
    while (i < p.length - 2 && x > p[i + 1].x) i++;
  }
  const dx = p[i + 1].x - p[i].x;
  if (dx === 0) return NaN;
  const t = (x - p[i].x) / dx;
  return p[i].y + t * (p[i + 1].y - p[i].y);
}

/**
 * Lagrange interpolating polynomial evaluated at x. Passes exactly through all
 * points, but high-degree polynomials oscillate badly (Runge phenomenon) for
 * many equally spaced nodes — a good teaching contrast against splines.
 */
export function lagrange(points: Point[], x: number): number {
  const n = points.length;
  if (n === 0) return NaN;
  let result = 0;
  for (let i = 0; i < n; i++) {
    let term = points[i].y;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const denom = points[i].x - points[j].x;
      if (denom === 0) return NaN; // duplicate x -> undefined polynomial
      term *= (x - points[j].x) / denom;
    }
    result += term;
  }
  return result;
}

/**
 * Builds a natural cubic spline (second derivative zero at both ends). Solves
 * the tridiagonal system for the second derivatives with the Thomas algorithm,
 * then derives per-segment coefficients. C^2-continuous and free of the Runge
 * oscillations that plague high-degree Lagrange interpolation.
 *
 * @throws Error if fewer than two distinct points are supplied.
 */
export function buildCubicSpline(points: Point[]): SplineModel {
  const p = sortedPoints(points);
  const n = p.length;
  if (n < 2) {
    throw new Error("A cubic spline needs at least two points.");
  }
  const xs = p.map((q) => q.x);
  const ys = p.map((q) => q.y);
  const h = new Array<number>(n - 1);
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    if (h[i] === 0) throw new Error("Duplicate x value: spline nodes must be distinct.");
  }

  // Set up the tridiagonal system for the second derivatives m[i].
  // Natural boundary conditions: m[0] = m[n-1] = 0.
  const lower = new Array<number>(n).fill(0);
  const diag = new Array<number>(n).fill(1);
  const upper = new Array<number>(n).fill(0);
  const rhs = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    lower[i] = h[i - 1];
    diag[i] = 2 * (h[i - 1] + h[i]);
    upper[i] = h[i];
    rhs[i] = 6 * ((ys[i + 1] - ys[i]) / h[i] - (ys[i] - ys[i - 1]) / h[i - 1]);
  }

  // Thomas algorithm (forward sweep + back substitution).
  const cp = new Array<number>(n).fill(0);
  const dp = new Array<number>(n).fill(0);
  cp[0] = upper[0] / diag[0];
  dp[0] = rhs[0] / diag[0];
  for (let i = 1; i < n; i++) {
    const denom = diag[i] - lower[i] * cp[i - 1];
    cp[i] = upper[i] / denom;
    dp[i] = (rhs[i] - lower[i] * dp[i - 1]) / denom;
  }
  const m = new Array<number>(n).fill(0);
  m[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    m[i] = dp[i] - cp[i] * m[i + 1];
  }

  // Convert second derivatives into per-segment cubic coefficients.
  const segments: SplineSegment[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = ys[i];
    const b = (ys[i + 1] - ys[i]) / h[i] - (h[i] * (2 * m[i] + m[i + 1])) / 6;
    const c = m[i] / 2;
    const d = (m[i + 1] - m[i]) / (6 * h[i]);
    segments.push({ x: xs[i], a, b, c, d });
  }
  return { xs, segments };
}

/**
 * Evaluates a cubic spline at x. Clamps to the first/last segment for points
 * outside the data range.
 */
export function evalSpline(model: SplineModel, x: number): number {
  const { xs, segments } = model;
  if (segments.length === 0) return NaN;
  // Find the segment containing x (clamped at the ends).
  let i = 0;
  if (x <= xs[0]) i = 0;
  else if (x >= xs[xs.length - 1]) i = segments.length - 1;
  else {
    while (i < segments.length - 1 && x > xs[i + 1]) i++;
  }
  const s = segments[i];
  const dx = x - s.x;
  return s.a + dx * (s.b + dx * (s.c + dx * s.d));
}

/**
 * Samples an interpolant on [a, b] at `n` points for plotting a dense curve.
 */
export function sampleInterpolant(
  evaluate: (x: number) => number,
  a: number,
  b: number,
  n = 300,
): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  const step = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) {
    const xi = a + i * step;
    x.push(xi);
    y.push(evaluate(xi));
  }
  return { x, y };
}

/**
 * Generates noisy sample data from a clean function, for the smoothing demo.
 * Uses a seeded linear-congruential RNG so the demo is reproducible.
 */
export function makeNoisyData(
  f: (x: number) => number,
  a: number,
  b: number,
  count: number,
  noise: number,
  seed = 42,
): Point[] {
  let state = seed >>> 0;
  const rand = () => {
    state = (1103515245 * state + 12345) % 2147483648;
    return state / 2147483648; // [0, 1)
  };
  const points: Point[] = [];
  const step = (b - a) / (count - 1);
  for (let i = 0; i < count; i++) {
    const x = a + i * step;
    points.push({ x, y: f(x) + (rand() * 2 - 1) * noise });
  }
  return points;
}
