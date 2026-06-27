"use client";

import type { Matrix, Vector } from "@/lib/numerical/linalg";

interface MatrixEditorProps {
  A: Matrix;
  b?: Vector;
  onChangeA: (A: Matrix) => void;
  onChangeB?: (b: Vector) => void;
  /** Heading shown above the grid. */
  label?: string;
}

/**
 * Editable grid for a square matrix A and an optional right-hand-side vector b.
 * Presentational only: it emits updated copies through the change handlers.
 */
export function MatrixEditor({
  A,
  b,
  onChangeA,
  onChangeB,
  label = "Matrix A",
}: MatrixEditorProps) {
  const setCell = (i: number, j: number, value: number) => {
    const next = A.map((row) => row.slice());
    next[i][j] = value;
    onChangeA(next);
  };
  const setB = (i: number, value: number) => {
    if (!b || !onChangeB) return;
    const next = b.slice();
    next[i] = value;
    onChangeB(next);
  };

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
        {b && onChangeB ? " and vector b" : ""}
      </p>
      <div className="inline-flex items-center gap-3 overflow-auto">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${A.length}, minmax(0, 1fr))` }}
        >
          {A.map((row, i) =>
            row.map((val, j) => (
              <input
                key={`${i}-${j}`}
                type="number"
                value={Number.isFinite(val) ? val : ""}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  if (!Number.isNaN(parsed)) setCell(i, j, parsed);
                }}
                className="w-16 rounded-md border border-slate-300 bg-white px-1.5 py-1 text-center font-mono text-sm tabular-nums focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            )),
          )}
        </div>

        {b && onChangeB && (
          <>
            <span className="font-mono text-lg text-slate-400">=</span>
            <div className="grid gap-1.5">
              {b.map((val, i) => (
                <input
                  key={i}
                  type="number"
                  value={Number.isFinite(val) ? val : ""}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    if (!Number.isNaN(parsed)) setB(i, parsed);
                  }}
                  className="w-16 rounded-md border border-brand-300 bg-brand-50 px-1.5 py-1 text-center font-mono text-sm tabular-nums focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-brand-800 dark:bg-brand-950/40 dark:text-slate-100"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Builds an n x n matrix and length-n vector, preserving overlapping values. */
export function resizeSystem(
  A: Matrix,
  b: Vector,
  n: number,
): { A: Matrix; b: Vector } {
  const newA: Matrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => A[i]?.[j] ?? (i === j ? 1 : 0)),
  );
  const newB: Vector = Array.from({ length: n }, (_, i) => b[i] ?? 0);
  return { A: newA, b: newB };
}
