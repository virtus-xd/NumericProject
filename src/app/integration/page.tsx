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
import { compileScalar } from "@/lib/expression";
import { sampleFunction } from "@/lib/plotting";
import {
  trapezoid,
  simpson,
  simpson38,
  midpoint,
  monteCarlo,
  adaptiveSimpson,
  convergenceSeries,
  IntegralResult,
} from "@/lib/numerical/integration";

type RuleKey = "trapezoid" | "simpson" | "simpson38" | "midpoint";

export default function IntegrationPage() {
  const [expr, setExpr] = useState("sin(x)");
  const [a, setA] = useState(0);
  const [b, setB] = useState(Math.PI);
  const [n, setN] = useState(20);
  const [rule, setRule] = useState<RuleKey>("simpson");

  const fc = useMemo(() => compileScalar(expr), [expr]);
  const f = fc.ok ? fc.fn : null;

  // High-accuracy reference for error reporting (adaptive Simpson, tight tol).
  const reference = useMemo(() => {
    if (!f) return NaN;
    const r = adaptiveSimpson(f, a, b, 1e-12);
    return Number.isFinite(r.value) ? r.value : NaN;
  }, [f, a, b]);

  const closedRules: Record<
    RuleKey,
    (f: (x: number) => number, a: number, b: number, n: number) => IntegralResult
  > = { trapezoid, simpson, simpson38, midpoint };

  const chosen = useMemo(() => {
    if (!f) return null;
    return closedRules[rule](f, a, b, n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, a, b, n, rule]);

  const comparison = useMemo(() => {
    if (!f) return [];
    const rows: { name: string; r: IntegralResult }[] = [
      { name: "Trapezoid", r: trapezoid(f, a, b, n) },
      { name: "Simpson 1/3", r: simpson(f, a, b, n) },
      { name: "Simpson 3/8", r: simpson38(f, a, b, n) },
      { name: "Midpoint", r: midpoint(f, a, b, n) },
      { name: "Monte Carlo", r: monteCarlo(f, a, b, n * 1000) },
      { name: "Adaptive Simpson", r: adaptiveSimpson(f, a, b, 1e-8) },
    ];
    return rows;
  }, [f, a, b, n]);

  const convergence = useMemo(() => {
    if (!f || !Number.isFinite(reference)) return null;
    const nValues = [2, 4, 8, 16, 32, 64, 128, 256];
    return {
      trapezoid: convergenceSeries(trapezoid, f, a, b, reference, nValues),
      simpson: convergenceSeries(simpson, f, a, b, reference, nValues),
      midpoint: convergenceSeries(midpoint, f, a, b, reference, nValues),
    };
  }, [f, a, b, reference]);

  const curve = useMemo(() => (f ? sampleFunction(f, a, b, 300) : null), [f, a, b]);

  // Error-handling demo: integrand singular at the lower limit (1/x on [0, b]).
  const badDemo = useMemo(() => {
    if (!f) return null;
    return trapezoid((t) => 1 / t, 0, Math.max(1, b), Math.max(2, n));
  }, [f, b, n]);

  return (
    <div className="space-y-8">
      <PageIntro topic="A.5" title="Numerical Integration">
        Definite integrals measure accumulated quantities — area, work, charge,
        probability. When the antiderivative is unknown, we approximate the
        integral by sampling f and combining the samples with quadrature rules.
        Compare the classic Newton–Cotes rules against Monte Carlo and an adaptive
        scheme, and watch each one converge as the sampling grows.
      </PageIntro>

      <div className="grid gap-4 lg:grid-cols-3">
        <MethodExplainer
          name="Trapezoid rule"
          formula="\int_a^b f \approx \frac{h}{2}\Big(f_0 + 2\textstyle\sum f_i + f_n\Big)"
          description="Approximates the area as a sequence of trapezoids between consecutive samples."
          whenToUse="A simple, robust default; exact for linear integrands."
          convergence="Second-order, O(h²)."
        />
        <MethodExplainer
          name="Simpson's rule"
          formula="\int_a^b f \approx \frac{h}{3}\Big(f_0 + 4f_1 + 2f_2 + \cdots + f_n\Big)"
          description="Fits parabolas through triples of points (1/3 rule) for much higher accuracy. The 3/8 variant fits cubics."
          whenToUse="The go-to rule for smooth integrands; exact for cubic polynomials."
          convergence="Fourth-order, O(h⁴)."
        />
        <MethodExplainer
          name="Monte Carlo & adaptive"
          formula="\int_a^b f \approx (b-a)\,\frac{1}{N}\sum_{i=1}^{N} f(x_i)"
          description="Monte Carlo averages random samples (slow but dimension-independent). Adaptive Simpson subdivides only where the integrand is hard."
          whenToUse="Monte Carlo for high dimensions; adaptive when accuracy must be guaranteed to a tolerance."
          convergence="Monte Carlo O(1/√N); adaptive concentrates effort to meet a tolerance."
        />
      </div>

      <MethodControls columns={4}>
        <FunctionInput value={expr} onChange={setExpr} error={fc.ok ? null : fc.error} className="lg:col-span-2" placeholder="sin(x)" />
        <NumberInput label="Lower limit a" value={a} onChange={setA} step={0.1} />
        <NumberInput label="Upper limit b" value={b} onChange={setB} step={0.1} />
        <Select
          label="Rule (for the area plot)"
          value={rule}
          onChange={(v) => setRule(v as RuleKey)}
          options={[
            { value: "trapezoid", label: "Trapezoid" },
            { value: "simpson", label: "Simpson 1/3" },
            { value: "simpson38", label: "Simpson 3/8" },
            { value: "midpoint", label: "Midpoint" },
          ]}
        />
        <NumberInput label="Sub-intervals n" value={n} onChange={(v) => setN(Math.max(1, Math.round(v)))} step={2} min={1} />
      </MethodControls>

      {chosen && curve && (
        <Card>
          <CardTitle>Area under the curve</CardTitle>
          <Callout tone="success" className="mb-4">
            {chosen.method} with n = {chosen.nIntervals}:{" "}
            <strong>{chosen.value.toPrecision(10)}</strong>
            {Number.isFinite(reference) && (
              <>
                {" "}· absolute error ≈ {Math.abs(chosen.value - reference).toExponential(3)}
              </>
            )}
          </Callout>
          <PlotCanvas
            data={[
              {
                x: curve.x,
                y: curve.y,
                type: "scatter",
                mode: "lines",
                name: "f(x)",
                fill: "tozeroy",
                fillcolor: "rgba(26,95,245,0.15)",
                line: { color: "#1a5ff5", width: 2 },
              },
            ]}
            layout={{ xaxis: { title: { text: "x" } }, yaxis: { title: { text: "f(x)" } } }}
          />
        </Card>
      )}

      <Card>
        <CardTitle>Method comparison (n = {n})</CardTitle>
        <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {["Method", "Value", "Samples/intervals", "Absolute error"].map((h) => (
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
                  <td className="px-3 py-1.5 font-mono text-xs">
                    {Number.isFinite(r.value) ? r.value.toPrecision(10) : "non-finite"}
                  </td>
                  <td className="px-3 py-1.5">{r.nIntervals.toLocaleString("en-US")}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">
                    {Number.isFinite(reference) && Number.isFinite(r.value)
                      ? Math.abs(r.value - reference).toExponential(3)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Number.isFinite(reference) && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Reference value (adaptive Simpson, tol 1e-12): {reference.toPrecision(12)}
          </p>
        )}
      </Card>

      {convergence && (
        <Card>
          <CardTitle>Convergence vs. number of intervals (log–log)</CardTitle>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Higher-order rules drop faster. Simpson’s steeper slope reflects its
            O(h⁴) accuracy versus the O(h²) of trapezoid and midpoint.
          </p>
          <PlotCanvas
            data={[
              {
                x: convergence.trapezoid.map((d) => d.n),
                y: convergence.trapezoid.map((d) => d.error),
                type: "scatter",
                mode: "lines+markers",
                name: "Trapezoid",
                line: { color: "#ef4444" },
              },
              {
                x: convergence.midpoint.map((d) => d.n),
                y: convergence.midpoint.map((d) => d.error),
                type: "scatter",
                mode: "lines+markers",
                name: "Midpoint",
                line: { color: "#f59e0b" },
              },
              {
                x: convergence.simpson.map((d) => d.n),
                y: convergence.simpson.map((d) => d.error),
                type: "scatter",
                mode: "lines+markers",
                name: "Simpson 1/3",
                line: { color: "#1a5ff5" },
              },
            ]}
            layout={{
              xaxis: { title: { text: "sub-intervals n" }, type: "log" },
              yaxis: { title: { text: "absolute error" }, type: "log" },
            }}
          />
        </Card>
      )}

      <Card>
        <CardTitle>Error handling demo</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Integrating 1/x from 0 evaluates the integrand at the singular point
          x = 0. The rule returns a non-finite value, which the UI detects and
          labels instead of plotting garbage.
        </p>
        {badDemo && (
          <Callout tone={Number.isFinite(badDemo.value) ? "info" : "error"} title="Trapezoid on 1/x over [0, b]">
            Computed value: {String(badDemo.value)}
            {!Number.isFinite(badDemo.value) &&
              " — flagged as non-finite (the integrand diverges at x = 0)."}
          </Callout>
        )}
      </Card>
    </div>
  );
}
