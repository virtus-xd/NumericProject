"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { MethodControls } from "@/components/MethodControls";
import { Card, CardTitle } from "@/components/ui/Card";
import { Callout } from "@/components/ui/Callout";
import { Slider } from "@/components/ui/Slider";
import { NumberInput } from "@/components/ui/NumberInput";
import { PlotCanvas } from "@/components/PlotCanvas";
import { Formula } from "@/components/Formula";
import {
  MACHINE_EPSILON,
  accumulationDemo,
  cancellationDemo,
  floatingPointSurprise,
  summationErrorSeries,
  absoluteError,
  relativeError,
} from "@/lib/numerical/errors";

export default function ErrorAnalysisPage() {
  const [n, setN] = useState(10000);
  const [cancelExp, setCancelExp] = useState(-7); // x = 10^cancelExp
  const [approx, setApprox] = useState(3.14159);
  const [exact, setExact] = useState(Math.PI);

  const fp = useMemo(() => floatingPointSurprise(), []);
  const acc = useMemo(() => accumulationDemo(n), [n]);
  const x = useMemo(() => Math.pow(10, cancelExp), [cancelExp]);
  const cancel = useMemo(() => cancellationDemo(x), [x]);
  const series = useMemo(() => summationErrorSeries(n), [n]);

  return (
    <div className="space-y-8">
      <PageIntro topic="A.1" title="Error Analysis & Floating-Point Precision">
        Computers store real numbers in a finite number of bits, so almost every
        calculation carries a small error. Understanding where that error comes
        from — representation, rounding, cancellation and accumulation — is the
        foundation for trusting every other numerical method on this site.
      </PageIntro>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Machine epsilon</CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            The smallest number that still makes a difference when added to 1.0,
            computed at runtime (not hard-coded):
          </p>
          <p className="mt-3 font-mono text-lg text-brand-700 dark:text-brand-300">
            ε = {MACHINE_EPSILON.toExponential(15)}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            This equals 2⁻⁵² for IEEE-754 double precision.
          </p>
        </Card>

        <Card>
          <CardTitle>The 0.1 + 0.2 surprise</CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Because 0.1 and 0.2 are not exactly representable in binary, their sum
            is not exactly 0.3:
          </p>
          <div className="mt-3 space-y-1 font-mono text-sm">
            <p>0.1 + 0.2 = {fp.sum.toPrecision(18)}</p>
            <p>0.3 (literal) = {fp.expected.toPrecision(18)}</p>
            <p>
              equal? <span className="font-semibold">{String(fp.equal)}</span>{" "}
              (difference ≈ {fp.difference.toExponential(3)})
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Catastrophic cancellation</CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Computing{" "}
          <Formula math="\dfrac{1 - \cos x}{x^2}" /> directly subtracts two nearly
          equal numbers when x is small, destroying significant digits. An
          algebraically equivalent stable form,{" "}
          <Formula math="\dfrac{2\sin^2(x/2)}{x^2}" />, avoids the cancellation.
          The true limit as x → 0 is 0.5.
        </p>
        <MethodControls title="" columns={2} className="mt-4 border-0 p-0 shadow-none">
          <Slider
            label="x = 10^e"
            value={cancelExp}
            onChange={setCancelExp}
            min={-12}
            max={-1}
            step={1}
            format={(v) => `1e${v}`}
          />
          <div className="self-end text-sm text-slate-500 dark:text-slate-400">
            x = {x.toExponential(0)}
          </div>
        </MethodControls>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Naive formula" value={cancel.naive} ref0={0.5} />
          <Stat label="Stable formula" value={cancel.stable} ref0={0.5} />
          <Stat label="Exact limit" value={cancel.exact} ref0={0.5} />
        </div>
      </Card>

      <Card>
        <CardTitle>Naive vs. Kahan summation</CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Adding 0.1 to a running total {n.toLocaleString("en-US")} times should
          give {acc.exact.toLocaleString("en-US")}. Naive summation drifts as
          rounding errors accumulate; Kahan compensated summation keeps a
          correction term and stays essentially exact.
        </p>
        <MethodControls title="" columns={2} className="mt-4 border-0 p-0 shadow-none">
          <NumberInput
            label="Number of terms (N)"
            value={n}
            onChange={(v) => setN(Math.max(10, Math.round(v)))}
            step={5000}
            min={10}
          />
        </MethodControls>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Naive sum" value={acc.naive} ref0={acc.exact} />
          <Stat label="Kahan sum" value={acc.kahan} ref0={acc.exact} />
          <Stat label="Exact" value={acc.exact} ref0={acc.exact} />
        </div>
        <div className="mt-5">
          <PlotCanvas
            title="Absolute error vs. number of terms"
            data={[
              {
                x: series.map((s) => s.k),
                y: series.map((s) => s.naiveErr),
                type: "scatter",
                mode: "lines",
                name: "naive error",
                line: { color: "#ef4444" },
              },
              {
                x: series.map((s) => s.k),
                y: series.map((s) => s.kahanErr),
                type: "scatter",
                mode: "lines",
                name: "Kahan error",
                line: { color: "#10b981" },
              },
            ]}
            layout={{
              xaxis: { title: { text: "terms added" } },
              yaxis: { title: { text: "absolute error" } },
            }}
          />
        </div>
      </Card>

      <Card>
        <CardTitle>Absolute vs. relative error</CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Absolute error is{" "}
          <Formula math="|\,\tilde{x} - x\,|" />; relative error scales it by the
          magnitude of the true value,{" "}
          <Formula math="|\,\tilde{x} - x\,| / |x|" />. Relative error is usually
          the more meaningful measure.
        </p>
        <MethodControls title="" columns={2} className="mt-4 border-0 p-0 shadow-none">
          <NumberInput label="Approximation x̃" value={approx} onChange={setApprox} step={0.01} />
          <NumberInput label="Exact value x" value={exact} onChange={setExact} step={0.01} />
        </MethodControls>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Stat label="Absolute error" value={absoluteError(approx, exact)} />
          <Stat label="Relative error" value={relativeError(approx, exact)} />
        </div>
      </Card>

      <Callout tone="info" title="Why this matters">
        Every method on this site inherits these limits. When a root-finder or
        integrator stops improving, it is often round-off — not a bug — that sets
        the floor on achievable accuracy.
      </Callout>
    </div>
  );
}

/** Small labeled numeric read-out, optionally annotated with its error. */
function Stat({
  label,
  value,
  ref0,
}: {
  label: string;
  value: number;
  ref0?: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-mono text-sm">{value.toPrecision(12)}</p>
      {ref0 !== undefined && (
        <p className="text-[11px] text-slate-400">
          error ≈ {Math.abs(value - ref0).toExponential(3)}
        </p>
      )}
    </div>
  );
}
