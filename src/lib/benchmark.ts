/**
 * Lightweight timing and convergence helpers for the benchmarks page (A.10).
 *
 * These are measurement utilities only — the numerical methods themselves live
 * in `lib/numerical/` and are implemented from scratch.
 */

export interface TimingResult {
  label: string;
  /** Total wall-clock time in milliseconds across all runs. */
  ms: number;
  runs: number;
  /** Average time per run in milliseconds. */
  msPerRun: number;
}

/**
 * Times a function over `runs` repetitions using performance.now().
 * Repetition averages out scheduler noise for fast operations.
 */
export function time(label: string, fn: () => void, runs = 1): TimingResult {
  const start = performance.now();
  for (let i = 0; i < runs; i++) fn();
  const ms = performance.now() - start;
  return { label, ms, runs, msPerRun: ms / runs };
}

/** Times several labelled cases and returns one TimingResult each. */
export function compareTiming(
  cases: { label: string; fn: () => void; runs?: number }[],
): TimingResult[] {
  return cases.map((c) => time(c.label, c.fn, c.runs ?? 1));
}

/**
 * Estimates the empirical order of convergence p from a pair of (n, error)
 * samples, assuming error ≈ C n^(-p): p = log(e1/e2) / log(n2/n1).
 * Returns NaN if the inputs are not usable.
 */
export function estimateOrder(
  n1: number,
  e1: number,
  n2: number,
  e2: number,
): number {
  if (e1 <= 0 || e2 <= 0 || n1 <= 0 || n2 <= 0 || n1 === n2) return NaN;
  return Math.log(e1 / e2) / Math.log(n2 / n1);
}
