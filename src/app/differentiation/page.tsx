"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { MethodExplainer } from "@/components/MethodExplainer";
import { MethodControls } from "@/components/MethodControls";
import { FunctionInput } from "@/components/FunctionInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { Card, CardTitle } from "@/components/ui/Card";
import { Callout } from "@/components/ui/Callout";
import { PlotCanvas } from "@/components/PlotCanvas";
import { compileScalar } from "@/lib/expression";
import {
  forwardDiff,
  backwardDiff,
  centralDiff,
  richardson,
  stepSizeSweep,
  logSpacedSteps,
} from "@/lib/numerical/differentiation";

export default function DifferentiationPage() {
  const [expr, setExpr] = useState("sin(x)");
  const [dexpr, setDexpr] = useState("cos(x)");
  const [x, setX] = useState(1);
  const [hExp, setHExp] = useState(-3); // h = 10^hExp

  const fc = useMemo(() => compileScalar(expr), [expr]);
  const dc = useMemo(() => compileScalar(dexpr), [dexpr]);
  const f = fc.ok ? fc.fn : null;
  const dfExact = dc.ok ? dc.fn : null;
  const h = useMemo(() => Math.pow(10, hExp), [hExp]);

  const exact = useMemo(
    () => (dfExact ? dfExact(x) : NaN),
    [dfExact, x],
  );

  const estimates = useMemo(() => {
    if (!f) return null;
    return {
      forward: forwardDiff(f, x, h),
      backward: backwardDiff(f, x, h),
      central: centralDiff(f, x, h),
      richardson: richardson(f, x, h),
    };
  }, [f, x, h]);

  const sweep = useMemo(() => {
    if (!f || !dfExact) return [];
    const hValues = logSpacedSteps(-1, -15, 4);
    return stepSizeSweep(f, dfExact, x, hValues);
  }, [f, dfExact, x]);

  // Error-handling demo: h = 0 makes the difference quotient divide by zero.
  const badDemo = useMemo(() => {
    if (!f) return null;
    return forwardDiff(f, x, 0);
  }, [f, x]);

  return (
    <div className="space-y-8">
      <PageIntro topic="A.4" title="Numerical Differentiation">
        When a derivative cannot be found analytically — or f is only known as
        data — we approximate f′(x) with finite differences. The catch is the
        step size h: too large and truncation error dominates; too small and
        floating-point round-off takes over. The log–log error plot below reveals
        the resulting U-curve and its sweet spot.
      </PageIntro>

      <div className="grid gap-4 lg:grid-cols-3">
        <MethodExplainer
          name="Forward / Backward difference"
          formula="f'(x) \approx \frac{f(x+h) - f(x)}{h}"
          description="Uses one neighbouring point. Backward difference uses f(x−h) instead. Simple and cheap."
          whenToUse="At the edge of a data range, or when only one-sided samples are available."
          convergence="First-order accurate, O(h) truncation error."
        />
        <MethodExplainer
          name="Central difference"
          formula="f'(x) \approx \frac{f(x+h) - f(x-h)}{2h}"
          description="Averages a forward and backward step so the leading error term cancels."
          whenToUse="The default choice for an interior point — twice the order of accuracy at the same h."
          convergence="Second-order accurate, O(h²)."
        />
        <MethodExplainer
          name="Richardson extrapolation"
          formula="f'(x) \approx \frac{4\,D(h/2) - D(h)}{3}"
          description="Combines two central-difference estimates to cancel the O(h²) term, where D(h) is the central difference at step h."
          whenToUse="When you want extra accuracy from a smooth function for little extra cost."
          convergence="Fourth-order accurate, O(h⁴)."
        />
      </div>

      <MethodControls columns={4}>
        <FunctionInput value={expr} onChange={setExpr} error={fc.ok ? null : fc.error} className="lg:col-span-2" />
        <FunctionInput
          label="f'(x) exact (error reference)"
          value={dexpr}
          onChange={setDexpr}
          error={dc.ok ? null : dc.error}
          placeholder="cos(x)"
        />
        <NumberInput label="Evaluation point x" value={x} onChange={setX} step={0.1} />
      </MethodControls>

      {estimates && (
        <Card>
          <CardTitle>Estimates at x = {x}, h = {h.toExponential(0)}</CardTitle>
          <MethodControls title="" columns={2} className="mb-4 border-0 p-0 shadow-none">
            <NumberInput
              label="Step exponent (h = 10^e)"
              value={hExp}
              onChange={(v) => setHExp(Math.round(v))}
              step={1}
              min={-15}
              max={-1}
            />
          </MethodControls>
          <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm tabular-nums">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {["Method", "Estimate", "Absolute error"].map((hh) => (
                    <th key={hh} className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-300">
                      {hh}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Forward", estimates.forward],
                  ["Backward", estimates.backward],
                  ["Central", estimates.central],
                  ["Richardson", estimates.richardson],
                ].map(([name, val]) => (
                  <tr key={name as string} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-1.5">{name}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">{(val as number).toPrecision(10)}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">
                      {Number.isFinite(exact)
                        ? Math.abs((val as number) - exact).toExponential(3)
                        : "exact derivative unavailable"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Number.isFinite(exact) && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Exact f′({x}) = {exact.toPrecision(10)}
            </p>
          )}
        </Card>
      )}

      {sweep.length > 0 && (
        <Card>
          <CardTitle>The step-size U-curve (log–log)</CardTitle>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            As h shrinks (moving left), truncation error falls — until round-off
            error starts to grow, forming a U. Central differences reach a lower
            minimum than forward differences.
          </p>
          <PlotCanvas
            data={[
              {
                x: sweep.map((s) => s.h),
                y: sweep.map((s) => s.forwardErr),
                type: "scatter",
                mode: "lines+markers",
                name: "forward O(h)",
                line: { color: "#ef4444" },
              },
              {
                x: sweep.map((s) => s.h),
                y: sweep.map((s) => s.centralErr),
                type: "scatter",
                mode: "lines+markers",
                name: "central O(h²)",
                line: { color: "#1a5ff5" },
              },
            ]}
            layout={{
              xaxis: { title: { text: "step size h" }, type: "log", autorange: "reversed" },
              yaxis: { title: { text: "absolute error" }, type: "log" },
            }}
          />
        </Card>
      )}

      <Card>
        <CardTitle>Error handling demo</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          With h = 0 the difference quotient divides by zero. The function returns
          a non-finite value rather than throwing, and the UI reports it.
        </p>
        {badDemo !== null && (
          <Callout tone={Number.isFinite(badDemo) ? "info" : "error"} title="Result of forwardDiff(f, x, 0)">
            {Number.isFinite(badDemo)
              ? `Unexpectedly finite: ${badDemo}`
              : `Returned ${String(badDemo)} — detected as non-finite and excluded from plots/tables.`}
          </Callout>
        )}
      </Card>
    </div>
  );
}
