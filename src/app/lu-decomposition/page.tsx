"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { MethodExplainer } from "@/components/MethodExplainer";
import { Card, CardTitle } from "@/components/ui/Card";
import { Callout } from "@/components/ui/Callout";
import { Button } from "@/components/ui/Button";
import { MatrixEditor, resizeSystem } from "@/components/MatrixEditor";
import { Select } from "@/components/ui/Select";
import { PlotCanvas } from "@/components/PlotCanvas";
import {
  luDecompose,
  luSolve,
  determinantFromLU,
  permutationMatrix,
  type LUModel,
} from "@/lib/numerical/lu";
import {
  gaussianElimination,
  matVec,
  type Matrix,
  type Vector,
} from "@/lib/numerical/linalg";

/** Read-only matrix display with fixed precision. */
function MatrixView({ M, title }: { M: Matrix; title: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <div className="inline-block overflow-auto rounded-md border border-slate-200 p-2 dark:border-slate-800">
        <table className="font-mono text-xs tabular-nums">
          <tbody>
            {M.map((row, i) => (
              <tr key={i}>
                {row.map((v, j) => (
                  <td key={j} className="px-2 py-0.5 text-right">
                    {Math.abs(v) < 1e-12 ? "0" : v.toPrecision(4)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Generates a random, well-conditioned (diagonally boosted) n x n matrix. */
function randomMatrix(n: number, seed = 99): Matrix {
  let state = seed >>> 0;
  const rand = () => {
    state = (1103515245 * state + 12345) % 2147483648;
    return state / 2147483648;
  };
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i === j ? n + rand() : rand() * 2 - 1,
    ),
  );
}

export default function LuDecompositionPage() {
  const [A, setA] = useState<Matrix>([
    [2, 1, 1],
    [4, -6, 0],
    [-2, 7, 2],
  ]);
  const [b, setB] = useState<Vector>([5, -2, 9]);

  const resize = (n: number) => {
    const next = resizeSystem(A, b, n);
    setA(next.A);
    setB(next.b);
  };

  // Factor the editable matrix (guarded — singular matrices throw).
  const factor = useMemo((): { model: LUModel | null; error: string | null } => {
    try {
      return { model: luDecompose(A), error: null };
    } catch (e) {
      return { model: null, error: e instanceof Error ? e.message : "Decomposition failed." };
    }
  }, [A]);

  const solution = useMemo(() => {
    if (!factor.model) return null;
    try {
      return luSolve(factor.model, b);
    } catch {
      return null;
    }
  }, [factor.model, b]);

  // Error-handling demo: a singular matrix that makes luDecompose throw.
  const badDemo = useMemo(() => {
    try {
      luDecompose([
        [1, 2],
        [2, 4],
      ]);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "error";
    }
  }, []);

  // Benchmark: factor-once-solve-many vs. repeated full Gaussian elimination.
  const [bench, setBench] = useState<
    { k: number; lu: number; gauss: number }[] | null
  >(null);

  const runBenchmark = () => {
    const n = 60;
    const M = randomMatrix(n);
    const rhsCounts = [1, 25, 50, 100, 200, 400];
    const rhsList = Array.from({ length: 400 }, (_, r) =>
      Array.from({ length: n }, (_, i) => Math.sin(0.5 * i + r)),
    );

    const results: { k: number; lu: number; gauss: number }[] = [];
    for (const k of rhsCounts) {
      // Approach 1: factor once, then solve k right-hand sides cheaply.
      let t0 = performance.now();
      const model = luDecompose(M);
      for (let r = 0; r < k; r++) luSolve(model, rhsList[r]);
      const luTime = performance.now() - t0;

      // Approach 2: full Gaussian elimination for each right-hand side.
      t0 = performance.now();
      for (let r = 0; r < k; r++) gaussianElimination(M, rhsList[r]);
      const gaussTime = performance.now() - t0;

      results.push({ k, lu: luTime, gauss: gaussTime });
    }
    setBench(results);
  };

  return (
    <div className="space-y-8">
      <PageIntro topic="A.7" title="LU Decomposition">
        LU decomposition factors a matrix once into a permutation P, a
        unit-lower-triangular L and an upper-triangular U so that P A = L U. The
        expensive O(n³) work happens a single time; afterwards each new
        right-hand side is solved in cheap O(n²) forward/back substitution. The
        benchmark below shows why this matters when solving A x = b for many b.
      </PageIntro>

      <div className="grid gap-4 lg:grid-cols-2">
        <MethodExplainer
          name="Factorization (P A = L U)"
          formula="P A = L U"
          description="Gaussian elimination with partial pivoting, but the row multipliers are stored in L and the pivot row swaps in P instead of being discarded."
          whenToUse="Whenever you must solve A x = b repeatedly with the same A but different b."
          convergence="Direct; O(n³) to factor, then O(n²) per solve."
        />
        <MethodExplainer
          name="Triangular solves"
          formula="L y = P b, \quad U x = y"
          description="Forward substitution solves the lower-triangular system for y, then back substitution solves the upper-triangular system for x."
          whenToUse="The reuse step — far cheaper than re-running elimination."
          convergence="O(n²) per right-hand side."
        />
      </div>

      <Card>
        <CardTitle>Matrix A and right-hand side b</CardTitle>
        <div className="mb-4">
          <Select
            label="Size"
            value={String(A.length)}
            onChange={(v) => resize(Number(v))}
            options={[
              { value: "2", label: "2 × 2" },
              { value: "3", label: "3 × 3" },
              { value: "4", label: "4 × 4" },
            ]}
            className="w-28"
          />
        </div>
        <MatrixEditor A={A} b={b} onChangeA={setA} onChangeB={setB} />
      </Card>

      {factor.model ? (
        <Card>
          <CardTitle>Factors</CardTitle>
          <div className="flex flex-wrap gap-6">
            <MatrixView M={permutationMatrix(factor.model.P)} title="P (permutation)" />
            <MatrixView M={factor.model.L} title="L (unit lower)" />
            <MatrixView M={factor.model.U} title="U (upper)" />
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            det(A) = {determinantFromLU(factor.model).toPrecision(6)} (product of
            U's diagonal, sign-corrected for {factor.model.swaps} row swap
            {factor.model.swaps === 1 ? "" : "s"}).
          </p>
          {solution && (
            <Callout tone="success" className="mt-4">
              Solving A x = b via the factors gives x ={" "}
              <strong>[{solution.map((v) => v.toPrecision(6)).join(", ")}]</strong>
              . Check: A x ={" "}
              [{matVec(A, solution).map((v) => v.toPrecision(4)).join(", ")}].
            </Callout>
          )}
        </Card>
      ) : (
        <Callout tone="error" title="Cannot factor this matrix">
          {factor.error}
        </Callout>
      )}

      <Card>
        <CardTitle>Benchmark — factor once vs. eliminate every time</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          A 60 × 60 matrix is solved for an increasing number of right-hand sides,
          two ways: reusing one LU factorization, versus running full Gaussian
          elimination from scratch each time. As the count grows, LU reuse wins
          decisively.
        </p>
        <Button onClick={runBenchmark} className="mb-4">
          Run benchmark
        </Button>
        {bench && (
          <>
            <PlotCanvas
              data={[
                {
                  x: bench.map((d) => d.k),
                  y: bench.map((d) => d.gauss),
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Repeated Gaussian elimination",
                  line: { color: "#ef4444" },
                },
                {
                  x: bench.map((d) => d.k),
                  y: bench.map((d) => d.lu),
                  type: "scatter",
                  mode: "lines+markers",
                  name: "LU: factor once, solve many",
                  line: { color: "#10b981" },
                },
              ]}
              layout={{
                xaxis: { title: { text: "number of right-hand sides" } },
                yaxis: { title: { text: "time (ms)" } },
              }}
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              At {bench[bench.length - 1].k} right-hand sides: LU ≈{" "}
              {bench[bench.length - 1].lu.toFixed(1)} ms vs. Gaussian ≈{" "}
              {bench[bench.length - 1].gauss.toFixed(1)} ms.
            </p>
          </>
        )}
      </Card>

      <Card>
        <CardTitle>Error handling demo</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          A singular matrix has no LU decomposition. The factorization throws a
          clear error, which the page catches and displays.
        </p>
        <Callout tone="error" title="luDecompose([[1,2],[2,4]])">
          {badDemo}
        </Callout>
      </Card>
    </div>
  );
}
