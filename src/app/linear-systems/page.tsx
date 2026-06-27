"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { MethodExplainer } from "@/components/MethodExplainer";
import { Card, CardTitle } from "@/components/ui/Card";
import { Callout } from "@/components/ui/Callout";
import { Select } from "@/components/ui/Select";
import { NumberInput } from "@/components/ui/NumberInput";
import { MatrixEditor, resizeSystem } from "@/components/MatrixEditor";
import { PlotCanvas } from "@/components/PlotCanvas";
import {
  gaussianElimination,
  jacobi,
  gaussSeidel,
  conditionNumber,
  isDiagonallyDominant,
  vectorNorm,
  residual,
  type Matrix,
  type Vector,
  type LinearResult,
} from "@/lib/numerical/linalg";

export default function LinearSystemsPage() {
  const [A, setA] = useState<Matrix>([
    [4, 1, 0],
    [1, 4, 1],
    [0, 1, 3],
  ]);
  const [b, setB] = useState<Vector>([5, 6, 4]);
  const [tol, setTol] = useState(1e-10);
  const [maxIter, setMaxIter] = useState(100);

  const resize = (n: number) => {
    const next = resizeSystem(A, b, n);
    setA(next.A);
    setB(next.b);
  };

  const opts = { tol, maxIter };

  const gauss = useMemo(() => gaussianElimination(A, b), [A, b]);
  const jac = useMemo(() => jacobi(A, b, opts), [A, b, tol, maxIter]);
  const gs = useMemo(() => gaussSeidel(A, b, opts), [A, b, tol, maxIter]);

  const cond = useMemo(() => conditionNumber(A), [A]);
  const dominant = useMemo(() => isDiagonallyDominant(A), [A]);

  const directResidual = useMemo(
    () => (gauss.converged ? vectorNorm(residual(A, gauss.solution, b)) : NaN),
    [gauss, A, b],
  );

  // Error-handling demo: a deliberately singular matrix.
  const badDemo = useMemo(
    () =>
      gaussianElimination(
        [
          [1, 2],
          [2, 4],
        ],
        [3, 6],
      ),
    [],
  );

  const methods: { name: string; r: LinearResult }[] = [
    { name: "Gaussian elimination", r: gauss },
    { name: "Jacobi", r: jac },
    { name: "Gauss-Seidel", r: gs },
  ];

  return (
    <div className="space-y-8">
      <PageIntro topic="A.6" title="Linear Systems">
        Systems of linear equations A x = b appear everywhere in engineering —
        circuit analysis, structural mechanics, discretized PDEs. Compare a
        direct solver (Gaussian elimination) with two iterative solvers (Jacobi
        and Gauss-Seidel), watch the residual fall each iteration, and see how the
        condition number flags an ill-posed problem.
      </PageIntro>

      <div className="grid gap-4 lg:grid-cols-3">
        <MethodExplainer
          name="Gaussian elimination"
          formula="A x = b \;\Rightarrow\; U x = c \;\text{(partial pivoting)}"
          description="Reduces A to upper-triangular form with row operations and partial pivoting, then back-substitutes. A direct method: one pass gives the exact answer up to round-off."
          whenToUse="The default for small-to-medium dense systems; robust and pivot-stable."
          convergence="Direct, O(n³); no iteration needed."
        />
        <MethodExplainer
          name="Jacobi iteration"
          formula="x_i^{(k+1)} = \frac{1}{a_{ii}}\Big(b_i - \sum_{j\ne i} a_{ij}\,x_j^{(k)}\Big)"
          description="Updates every component from the previous iterate. Simple and parallelizable, but slower to converge."
          whenToUse="Large sparse, diagonally dominant systems where each sweep is cheap."
          convergence="Linear; converges when A is diagonally dominant."
        />
        <MethodExplainer
          name="Gauss-Seidel iteration"
          formula="x_i^{(k+1)} = \frac{1}{a_{ii}}\Big(b_i - \sum_{j<i} a_{ij}x_j^{(k+1)} - \sum_{j>i} a_{ij}x_j^{(k)}\Big)"
          description="Like Jacobi, but reuses freshly updated components within the same sweep, usually converging in fewer iterations."
          whenToUse="Same setting as Jacobi when in-place sequential updates are acceptable."
          convergence="Linear, typically about twice as fast as Jacobi."
        />
      </div>

      <Card>
        <CardTitle>System A x = b</CardTitle>
        <div className="flex flex-wrap items-end gap-6">
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
          <NumberInput label="Max iterations" value={maxIter} onChange={(v) => setMaxIter(Math.round(v))} step={10} min={1} className="w-36" />
          <Select
            label="Tolerance"
            value={String(tol)}
            onChange={(v) => setTol(Number(v))}
            options={[
              { value: "0.000001", label: "1e-6" },
              { value: "0.00000001", label: "1e-8" },
              { value: "0.0000000001", label: "1e-10" },
            ]}
            className="w-32"
          />
        </div>
        <div className="mt-4">
          <MatrixEditor A={A} b={b} onChangeA={setA} onChangeB={setB} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-md bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
            Condition number (∞-norm):{" "}
            <strong>{Number.isFinite(cond) ? cond.toPrecision(4) : "∞ (singular)"}</strong>
          </span>
          <span
            className={
              dominant
                ? "rounded-md bg-emerald-100 px-3 py-1.5 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "rounded-md bg-amber-100 px-3 py-1.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
            }
          >
            {dominant
              ? "Diagonally dominant — iterative methods will converge."
              : "Not diagonally dominant — Jacobi/Gauss-Seidel may diverge."}
          </span>
        </div>
      </Card>

      <Card>
        <CardTitle>Solutions</CardTitle>
        {gauss.converged ? (
          <Callout tone="success" className="mb-4">
            Gaussian elimination solution:{" "}
            <strong>
              [{gauss.solution.map((v) => v.toPrecision(6)).join(", ")}]
            </strong>{" "}
            · residual ‖b − Ax‖ ≈ {directResidual.toExponential(2)}
          </Callout>
        ) : (
          <Callout tone="error" className="mb-4" title="Could not solve directly">
            {gauss.reason}
          </Callout>
        )}
        <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {["Method", "Converged", "Iterations", "Solution"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-300">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {methods.map(({ name, r }) => (
                <tr key={name} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-1.5">{name}</td>
                  <td className="px-3 py-1.5">{r.converged ? "✓" : "✕"}</td>
                  <td className="px-3 py-1.5">{r.iterations ? r.iterations.length : "—"}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">
                    {r.converged
                      ? `[${r.solution.map((v) => v.toPrecision(5)).join(", ")}]`
                      : r.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {(jac.iterations?.length || gs.iterations?.length) && (
        <Card>
          <CardTitle>Residual vs. iteration (log scale)</CardTitle>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            The Euclidean residual ‖b − Ax‖ at each sweep. Gauss-Seidel usually
            drops below the tolerance sooner than Jacobi.
          </p>
          <PlotCanvas
            data={[
              {
                x: jac.iterations?.map((it) => it.iter) ?? [],
                y: jac.iterations?.map((it) => it.residual) ?? [],
                type: "scatter",
                mode: "lines+markers",
                name: "Jacobi",
                line: { color: "#f59e0b" },
              },
              {
                x: gs.iterations?.map((it) => it.iter) ?? [],
                y: gs.iterations?.map((it) => it.residual) ?? [],
                type: "scatter",
                mode: "lines+markers",
                name: "Gauss-Seidel",
                line: { color: "#1a5ff5" },
              },
            ]}
            layout={{
              xaxis: { title: { text: "iteration" } },
              yaxis: { title: { text: "residual" }, type: "log" },
            }}
          />
        </Card>
      )}

      <Card>
        <CardTitle>Error handling demo</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Solving a singular system (rows that are multiples of each other) cannot
          succeed. Gaussian elimination detects the zero pivot and reports it.
        </p>
        <Callout tone="error" title="Singular system [[1,2],[2,4]] x = [3,6]">
          {badDemo.reason}
        </Callout>
      </Card>
    </div>
  );
}
