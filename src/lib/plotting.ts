import type { ScalarFn } from "./numerical/types";

/**
 * Samples a scalar function on [a, b] at `n` points for plotting. Non-finite
 * values become null so Plotly draws a gap instead of a spurious line.
 */
export function sampleFunction(
  f: ScalarFn,
  a: number,
  b: number,
  n = 400,
): { x: number[]; y: (number | null)[] } {
  const x: number[] = [];
  const y: (number | null)[] = [];
  const step = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) {
    const xi = a + i * step;
    const yi = f(xi);
    x.push(xi);
    y.push(Number.isFinite(yi) ? yi : null);
  }
  return { x, y };
}
