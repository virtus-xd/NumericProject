import { Formula } from "./Formula";
import { Card } from "./ui/Card";

interface MethodExplainerProps {
  /** Method name, e.g. "Newton-Raphson". */
  name: string;
  /** Display LaTeX formula for the method. */
  formula: string;
  /** Plain-English description of how the method works. */
  description: string;
  /** When to prefer this method over the alternatives. */
  whenToUse: string;
  /** Optional order-of-accuracy / convergence note. */
  convergence?: string;
}

/**
 * Standard explainer block: KaTeX formula + plain-English description +
 * "when to prefer it" + an optional convergence note. Used on every module
 * page to keep the teaching layout consistent.
 */
export function MethodExplainer({
  name,
  formula,
  description,
  whenToUse,
  convergence,
}: MethodExplainerProps) {
  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold">{name}</h3>
      <div className="my-3 overflow-x-auto rounded-md bg-slate-50 px-3 py-3 dark:bg-slate-800/60">
        <Formula math={formula} block />
      </div>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {description}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          When to use:{" "}
        </span>
        {whenToUse}
      </p>
      {convergence && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">Convergence: </span>
          {convergence}
        </p>
      )}
    </Card>
  );
}
