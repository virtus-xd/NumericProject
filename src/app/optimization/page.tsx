"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { MethodExplainer } from "@/components/MethodExplainer";
import { MethodControls } from "@/components/MethodControls";
import { FunctionInput } from "@/components/FunctionInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { Card, CardTitle } from "@/components/ui/Card";
import { Callout } from "@/components/ui/Callout";
import { PlotCanvas } from "@/components/PlotCanvas";
import { compileScalar, compile2D } from "@/lib/expression";
import { sampleFunction } from "@/lib/plotting";
import {
  goldenSection,
  gradientDescent,
  newtonND,
  nelderMead,
  type OptResult,
} from "@/lib/numerical/optimization";
import type { Matrix } from "@/lib/numerical/linalg";
import type { TwoVarFn } from "@/lib/numerical/types";

/** Central-difference gradient of a 2D function (mathjs only parses f). */
function numericalGradient(f: TwoVarFn, h = 1e-5) {
  return (v: number[]) => [
    (f(v[0] + h, v[1]) - f(v[0] - h, v[1])) / (2 * h),
    (f(v[0], v[1] + h) - f(v[0], v[1] - h)) / (2 * h),
  ];
}

/** Central-difference Hessian of a 2D function. */
function numericalHessian(f: TwoVarFn, h = 1e-4) {
  return (v: number[]): Matrix => {
    const [x, y] = v;
    const fxx = (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h);
    const fyy = (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h);
    const fxy =
      (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) /
      (4 * h * h);
    return [
      [fxx, fxy],
      [fxy, fyy],
    ];
  };
}

const PRESETS_2D: Record<string, string> = {
  "Bowl: (x-1)² + (y-2)²": "(x-1)^2 + (y-2)^2",
  "Rosenbrock": "(1-x)^2 + 100*(y-x^2)^2",
  "Himmelblau": "(x^2+y-11)^2 + (x+y^2-7)^2",
};

export default function OptimizationPage() {
  // --- 1D golden-section section ---
  const [expr1d, setExpr1d] = useState("(x-3)^2 + 1");
  const [a, setA] = useState(-2);
  const [b, setB] = useState(8);
  const f1c = useMemo(() => compileScalar(expr1d), [expr1d]);
  const f1 = f1c.ok ? f1c.fn : null;
  const gs1d = useMemo(
    () => (f1 ? goldenSection(f1, a, b, { tol: 1e-8 }) : null),
    [f1, a, b],
  );
  const curve1d = useMemo(
    () => (f1 ? sampleFunction(f1, a, b) : null),
    [f1, a, b],
  );

  // --- 2D section ---
  const [preset, setPreset] = useState("Rosenbrock");
  const [expr2d, setExpr2d] = useState(PRESETS_2D["Rosenbrock"]);
  const [x0, setX0] = useState(-1.2);
  const [y0, setY0] = useState(1);
  const [lr, setLr] = useState(0.002);
  const [method, setMethod] = useState<"gd" | "newton" | "nm">("nm");
  const [xLo, setXLo] = useState(-2);
  const [xHi, setXHi] = useState(2);
  const [yLo, setYLo] = useState(-1);
  const [yHi, setYHi] = useState(3);

  const f2c = useMemo(() => compile2D(expr2d), [expr2d]);
  const f2 = f2c.ok ? f2c.fn : null;

  const run2d: OptResult | null = useMemo(() => {
    if (!f2) return null;
    const fv = (v: number[]) => f2(v[0], v[1]);
    const grad = numericalGradient(f2);
    const hess = numericalHessian(f2);
    const start = [x0, y0];
    if (method === "gd")
      return gradientDescent(fv, grad, start, lr, { tol: 1e-6, maxIter: 5000 });
    if (method === "newton")
      return newtonND(fv, grad, hess, start, { tol: 1e-8, maxIter: 100 });
    return nelderMead(fv, start, { tol: 1e-10, maxIter: 1000 });
  }, [f2, method, x0, y0, lr]);

  // Contour grid.
  const contour = useMemo(() => {
    if (!f2) return null;
    const nx = 80;
    const ny = 80;
    const xs = Array.from({ length: nx }, (_, i) => xLo + (i * (xHi - xLo)) / (nx - 1));
    const ys = Array.from({ length: ny }, (_, j) => yLo + (j * (yHi - yLo)) / (ny - 1));
    const z = ys.map((yy) => xs.map((xx) => f2(xx, yy)));
    return { xs, ys, z };
  }, [f2, xLo, xHi, yLo, yHi]);

  const choosePreset = (name: string) => {
    setPreset(name);
    if (PRESETS_2D[name]) setExpr2d(PRESETS_2D[name]);
  };

  return (
    <div className="space-y-8">
      <PageIntro topic="A.8" title="Optimization">
        Optimization finds the inputs that minimize (or maximize) an objective —
        minimizing cost, error or energy is the daily work of engineering design.
        Explore a 1D bracketing search and three 2D strategies, watching each one
        trace a path downhill across a contour map.
      </PageIntro>

      <div className="grid gap-4 lg:grid-cols-2">
        <MethodExplainer
          name="Golden-section search (1D)"
          formula="\text{shrink } [a,b] \text{ by } \tfrac{1}{\varphi} \approx 0.618 \text{ each step}"
          description="A derivative-free bracketing method for a unimodal function: it keeps one interior evaluation and narrows the interval around the minimum."
          whenToUse="Robust 1D minimization when derivatives are unavailable."
          convergence="Linear, factor ≈ 0.618 per iteration."
        />
        <MethodExplainer
          name="Gradient descent (ND)"
          formula="x_{k+1} = x_k - \eta\,\nabla f(x_k)"
          description="Steps opposite the gradient with a fixed learning rate η. The gradient here is computed by finite differences."
          whenToUse="Large smooth problems where only first derivatives are practical."
          convergence="Linear; very sensitive to the learning rate."
        />
        <MethodExplainer
          name="Newton's method (ND)"
          formula="x_{k+1} = x_k - H(x_k)^{-1}\,\nabla f(x_k)"
          description="Uses curvature (the Hessian) to take much better-scaled steps. Hessian and gradient are formed by finite differences and the step solves a linear system."
          whenToUse="When the Hessian is available/cheap and the start is reasonably close."
          convergence="Quadratic near a well-behaved minimum."
        />
        <MethodExplainer
          name="Nelder-Mead (ND)"
          formula="\text{reflect / expand / contract / shrink a simplex}"
          description="A derivative-free simplex of n+1 points that rolls downhill by geometric moves."
          whenToUse="Noisy, non-smooth, or derivative-free objectives."
          convergence="No general guarantee, but robust in practice."
        />
      </div>

      {/* ---------- 1D ---------- */}
      <Card>
        <CardTitle>1D — golden-section search</CardTitle>
        <MethodControls title="" columns={3} className="mb-4 border-0 p-0 shadow-none">
          <FunctionInput value={expr1d} onChange={setExpr1d} error={f1c.ok ? null : f1c.error} placeholder="(x-3)^2 + 1" />
          <NumberInput label="Bracket a" value={a} onChange={setA} step={0.5} />
          <NumberInput label="Bracket b" value={b} onChange={setB} step={0.5} />
        </MethodControls>
        {gs1d && curve1d && (
          <>
            {gs1d.converged ? (
              <Callout tone="success" className="mb-4">
                Minimum at x ≈ <strong>{gs1d.xStar[0].toPrecision(8)}</strong>,
                f(x) ≈ {gs1d.fStar.toPrecision(8)} in {gs1d.steps.length} iterations.
              </Callout>
            ) : (
              <Callout tone="warning" className="mb-4" title="Did not converge">
                {gs1d.reason}
              </Callout>
            )}
            <PlotCanvas
              data={[
                {
                  x: curve1d.x,
                  y: curve1d.y,
                  type: "scatter",
                  mode: "lines",
                  name: "f(x)",
                  line: { color: "#1a5ff5", width: 2 },
                },
                {
                  x: gs1d.steps.map((s) => s.x[0]),
                  y: gs1d.steps.map((s) => s.f),
                  type: "scatter",
                  mode: "markers",
                  name: "search points",
                  marker: { color: "#f59e0b", size: 7 },
                },
                {
                  x: [gs1d.xStar[0]],
                  y: [gs1d.fStar],
                  type: "scatter",
                  mode: "markers",
                  name: "minimum",
                  marker: { color: "#10b981", size: 12, symbol: "star" },
                },
              ]}
              layout={{ xaxis: { title: { text: "x" } }, yaxis: { title: { text: "f(x)" } } }}
            />
          </>
        )}
      </Card>

      {/* ---------- 2D ---------- */}
      <Card>
        <CardTitle>2D — gradient descent / Newton / Nelder-Mead</CardTitle>
        <MethodControls title="" columns={4} className="mb-4 border-0 p-0 shadow-none">
          <Select
            label="Preset"
            value={preset}
            onChange={choosePreset}
            options={Object.keys(PRESETS_2D).map((k) => ({ value: k, label: k }))}
            className="lg:col-span-2"
          />
          <Select
            label="Method"
            value={method}
            onChange={(v) => setMethod(v as "gd" | "newton" | "nm")}
            options={[
              { value: "gd", label: "Gradient descent" },
              { value: "newton", label: "Newton" },
              { value: "nm", label: "Nelder-Mead" },
            ]}
          />
          {method === "gd" && (
            <NumberInput label="Learning rate η" value={lr} onChange={setLr} step={0.001} min={0} />
          )}
          <FunctionInput
            label="f(x, y)"
            value={expr2d}
            onChange={setExpr2d}
            error={f2c.ok ? null : f2c.error}
            className="lg:col-span-2"
          />
          <NumberInput label="Start x₀" value={x0} onChange={setX0} step={0.1} />
          <NumberInput label="Start y₀" value={y0} onChange={setY0} step={0.1} />
        </MethodControls>

        {run2d && contour && (
          <>
            {run2d.converged ? (
              <Callout tone="success" className="mb-4">
                {run2d.method} reached x* ≈ [
                {run2d.xStar.map((v) => v.toPrecision(6)).join(", ")}], f* ≈{" "}
                {run2d.fStar.toExponential(3)} in {run2d.steps.length} steps.
              </Callout>
            ) : (
              <Callout tone="warning" className="mb-4" title="Stopped before tolerance">
                {run2d.reason} Best so far: x* ≈ [
                {run2d.xStar.map((v) => v.toPrecision(5)).join(", ")}], f* ≈{" "}
                {run2d.fStar.toExponential(3)}.
              </Callout>
            )}
            <PlotCanvas
              height={460}
              data={[
                {
                  x: contour.xs,
                  y: contour.ys,
                  z: contour.z,
                  type: "contour",
                  contours: { coloring: "heatmap" },
                  colorscale: "Viridis",
                  showscale: false,
                  name: "f",
                },
                {
                  x: run2d.steps.map((s) => s.x[0]),
                  y: run2d.steps.map((s) => s.x[1]),
                  type: "scatter",
                  mode: "lines+markers",
                  name: "search path",
                  line: { color: "#ffffff", width: 1.5 },
                  marker: { color: "#f59e0b", size: 5 },
                },
                {
                  x: [run2d.xStar[0]],
                  y: [run2d.xStar[1]],
                  type: "scatter",
                  mode: "markers",
                  name: "result",
                  marker: { color: "#ef4444", size: 12, symbol: "star" },
                },
              ]}
              layout={{ xaxis: { title: { text: "x" } }, yaxis: { title: { text: "y" } } }}
            />
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <NumberInput label="x-min" value={xLo} onChange={setXLo} step={0.5} />
              <NumberInput label="x-max" value={xHi} onChange={setXHi} step={0.5} />
              <NumberInput label="y-min" value={yLo} onChange={setYLo} step={0.5} />
              <NumberInput label="y-max" value={yHi} onChange={setYHi} step={0.5} />
            </div>
          </>
        )}
      </Card>

      <Card>
        <CardTitle>Error handling demo</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Gradient descent with an excessive learning rate overshoots and
          diverges. The solver detects the non-finite values and reports it
          instead of looping forever.
        </p>
        <Callout tone="error" title="Gradient descent on x² + y² with η = 5">
          {
            gradientDescent(
              (v) => v[0] ** 2 + v[1] ** 2,
              (v) => [2 * v[0], 2 * v[1]],
              [1, 1],
              5,
              { maxIter: 100 },
            ).reason
          }
        </Callout>
      </Card>
    </div>
  );
}
