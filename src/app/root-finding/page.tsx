"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { MethodExplainer } from "@/components/MethodExplainer";
import { MethodControls } from "@/components/MethodControls";
import { FunctionInput } from "@/components/FunctionInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { PlotCanvas } from "@/components/PlotCanvas";
import { IterationTable, Column } from "@/components/IterationTable";
import { Card, CardTitle } from "@/components/ui/Card";
import { Callout } from "@/components/ui/Callout";
import { compileScalar } from "@/lib/expression";
import { sampleFunction } from "@/lib/plotting";
import { centralDiff } from "@/lib/numerical/differentiation";
import {
  bisection,
  newtonRaphson,
  secant,
  RootResult,
  RootStep,
} from "@/lib/numerical/rootfinding";

type Method = "bisection" | "newton" | "secant";

const columns: Column<RootStep>[] = [
  { key: "iter", label: "k" },
  { key: "x", label: "xₖ" },
  { key: "fx", label: "f(xₖ)" },
  { key: "error", label: "error" },
];

export default function RootFindingPage() {
  const [expr, setExpr] = useState("x^2 - 2");
  const [method, setMethod] = useState<Method>("bisection");
  const [a, setA] = useState(0);
  const [b, setB] = useState(2);
  const [x0, setX0] = useState(1.5);
  const [x1, setX1] = useState(2);
  const [tol, setTol] = useState(1e-8);
  const [maxIter, setMaxIter] = useState(50);
  const [xMin, setXMin] = useState(-3);
  const [xMax, setXMax] = useState(3);

  const compiled = useMemo(() => compileScalar(expr), [expr]);
  const f = compiled.ok ? compiled.fn : null;

  // Numerical derivative for Newton's method (from-scratch central difference),
  // so mathjs is only ever used to parse the expression — never for the method.
  const df = useMemo(
    () => (f ? (x: number) => centralDiff(f, x, 1e-6) : null),
    [f],
  );

  const result: RootResult | null = useMemo(() => {
    if (!f || !df) return null;
    const opts = { tol, maxIter };
    if (method === "bisection") return bisection(f, a, b, opts);
    if (method === "newton") return newtonRaphson(f, df, x0, opts);
    return secant(f, x0, x1, opts);
  }, [f, df, method, a, b, x0, x1, tol, maxIter]);

  // Run all three methods for the comparison block.
  const comparison = useMemo(() => {
    if (!f || !df) return [];
    const opts = { tol, maxIter };
    return [
      { name: "Bisection", r: bisection(f, a, b, opts) },
      { name: "Newton-Raphson", r: newtonRaphson(f, df, x0, opts) },
      { name: "Secant", r: secant(f, x0, x1, opts) },
    ];
  }, [f, df, a, b, x0, x1, tol, maxIter]);

  // Error-handling demo: deliberately call bisection on an interval that does
  // not bracket a root, to show the graceful failure message.
  const badDemo = useMemo(() => {
    if (!f) return null;
    return bisection(f, 5, 6, { tol, maxIter });
  }, [f, tol, maxIter]);

  const curve = useMemo(
    () => (f ? sampleFunction(f, xMin, xMax) : null),
    [f, xMin, xMax],
  );

  return (
    <div className="space-y-8">
      <PageIntro topic="A.2" title="Root Finding">
        Root finding answers the question “for which x is f(x) = 0?” — a task at
        the heart of engineering, from solving equilibrium equations to sizing
        components. Type a function, pick a method, and watch each iteration
        close in on the root, with a per-step error column and a convergence
        comparison across all three methods.
      </PageIntro>

      <div className="grid gap-4 lg:grid-cols-3">
        <MethodExplainer
          name="Bisection"
          formula="c = \frac{a+b}{2}, \quad \text{keep the half where the sign changes}"
          description="Repeatedly halves an interval [a, b] on which f changes sign, always keeping the sub-interval that still brackets the root."
          whenToUse="When you only know a bracket and want a guaranteed result; it cannot diverge for a continuous function."
          convergence="Linear — gains about one binary digit of accuracy per iteration."
        />
        <MethodExplainer
          name="Newton-Raphson"
          formula="x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}"
          description="Follows the tangent line at the current point down to the x-axis. Here f'(x) is approximated by a from-scratch central difference."
          whenToUse="When you have a good initial guess near a simple root and want very fast convergence."
          convergence="Quadratic near a simple root — the number of correct digits roughly doubles each step."
        />
        <MethodExplainer
          name="Secant"
          formula="x_{k+1} = x_k - f(x_k)\,\frac{x_k - x_{k-1}}{f(x_k) - f(x_{k-1})}"
          description="Like Newton, but replaces the derivative with the slope through the two most recent points, so no derivative is required."
          whenToUse="When the derivative is unavailable or expensive, but you still want faster-than-linear convergence."
          convergence="Superlinear, order ≈ 1.618 (the golden ratio)."
        />
      </div>

      <MethodControls title="Controls" columns={4}>
        <FunctionInput
          value={expr}
          onChange={setExpr}
          error={compiled.ok ? null : compiled.error}
          className="sm:col-span-2 lg:col-span-2"
        />
        <Select
          label="Method"
          value={method}
          onChange={(v) => setMethod(v as Method)}
          options={[
            { value: "bisection", label: "Bisection" },
            { value: "newton", label: "Newton-Raphson" },
            { value: "secant", label: "Secant" },
          ]}
        />
        <Select
          label="Tolerance"
          value={String(tol)}
          onChange={(v) => setTol(Number(v))}
          options={[
            { value: "0.001", label: "1e-3" },
            { value: "0.000001", label: "1e-6" },
            { value: "0.00000001", label: "1e-8" },
            { value: "0.0000000001", label: "1e-10" },
          ]}
        />
        {method === "bisection" && (
          <>
            <NumberInput label="a (bracket left)" value={a} onChange={setA} step={0.1} />
            <NumberInput label="b (bracket right)" value={b} onChange={setB} step={0.1} />
          </>
        )}
        {method === "newton" && (
          <NumberInput label="x₀ (initial guess)" value={x0} onChange={setX0} step={0.1} />
        )}
        {method === "secant" && (
          <>
            <NumberInput label="x₀" value={x0} onChange={setX0} step={0.1} />
            <NumberInput label="x₁" value={x1} onChange={setX1} step={0.1} />
          </>
        )}
        <NumberInput label="Max iterations" value={maxIter} onChange={(v) => setMaxIter(Math.round(v))} step={5} min={1} />
        <NumberInput label="Plot x-min" value={xMin} onChange={setXMin} step={0.5} />
        <NumberInput label="Plot x-max" value={xMax} onChange={setXMax} step={0.5} />
      </MethodControls>

      {result && curve && (
        <Card>
          <CardTitle>Function & iterations</CardTitle>
          {result.converged ? (
            <Callout tone="success" className="mb-4">
              Converged to root ≈{" "}
              <strong>{result.root.toPrecision(10)}</strong> in{" "}
              {result.iterations.length} iterations, with f(root) ≈{" "}
              {result.fRoot.toExponential(3)}.
            </Callout>
          ) : (
            <Callout tone="warning" className="mb-4" title="Did not converge">
              {result.reason}
            </Callout>
          )}
          <PlotCanvas
            data={[
              {
                x: curve.x,
                y: curve.y,
                type: "scatter",
                mode: "lines",
                name: "f(x)",
                line: { color: "#1a5ff5", width: 2 },
              },
              {
                x: result.iterations.map((s) => s.x),
                y: result.iterations.map((s) => s.fx),
                type: "scatter",
                mode: "markers",
                name: "iterations",
                marker: { color: "#f59e0b", size: 7 },
              },
              ...(result.converged
                ? [
                    {
                      x: [result.root],
                      y: [0],
                      type: "scatter" as const,
                      mode: "markers" as const,
                      name: "root",
                      marker: { color: "#10b981", size: 12, symbol: "x" as const },
                    },
                  ]
                : []),
            ]}
            layout={{ yaxis: { title: { text: "f(x)" } }, xaxis: { title: { text: "x" } } }}
          />
        </Card>
      )}

      {result && (
        <Card>
          <CardTitle>Iteration history</CardTitle>
          <IterationTable columns={columns} rows={result.iterations} />
        </Card>
      )}

      <Card>
        <CardTitle>Method comparison</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          All three methods run on the same function and settings. Faster methods
          reach the tolerance in fewer iterations.
        </p>
        <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {["Method", "Converged", "Root", "Iterations", "f(root)"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-300">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map(({ name, r }) => (
                <tr key={name} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-1.5">{name}</td>
                  <td className="px-3 py-1.5">{r.converged ? "✓" : "✕"}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">
                    {Number.isFinite(r.root) ? r.root.toPrecision(8) : "—"}
                  </td>
                  <td className="px-3 py-1.5">{r.iterations.length}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">
                    {Number.isFinite(r.fRoot) ? r.fRoot.toExponential(2) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle>Error handling demo</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Here we deliberately ask bisection to find a root on the interval [5, 6],
          which usually does not bracket one. Instead of crashing, the solver
          returns a clear reason.
        </p>
        {badDemo &&
          (badDemo.converged ? (
            <Callout tone="info">
              On this particular function [5, 6] happened to bracket a root, so it
              converged. Try f(x) = x^2 - 2 to see the graceful failure.
            </Callout>
          ) : (
            <Callout tone="error" title="Handled gracefully">
              {badDemo.reason}
            </Callout>
          ))}
      </Card>
    </div>
  );
}
