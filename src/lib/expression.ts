/**
 * Expression parsing wrapper around mathjs.
 *
 * IMPORTANT (CLAUDE.md §0 rule #2): mathjs is used ONLY to parse and evaluate
 * user-typed expressions such as "x^2 - 2". It is never used for the numerical
 * methods themselves — those are implemented from scratch. The rest of the app
 * imports from this module, never from mathjs directly.
 */

import { compile, type EvalFunction } from "mathjs";
import type { ScalarFn, TwoVarFn } from "./numerical/types";

/** Outcome of compiling a user expression: either a function or an error. */
export type CompileResult<F> =
  | { ok: true; fn: F; expr: string }
  | { ok: false; error: string; expr: string };

/**
 * Compiles a single-variable expression in `x` (e.g. "x^2 - 2") into a
 * ScalarFn. Evaluation is wrapped so any runtime error yields NaN rather than
 * throwing, and a non-numeric result (e.g. a complex number) is coerced to NaN.
 */
export function compileScalar(expr: string): CompileResult<ScalarFn> {
  if (!expr || expr.trim() === "") {
    return { ok: false, error: "Expression is empty.", expr };
  }
  let compiled: EvalFunction;
  try {
    compiled = compile(expr);
  } catch (err) {
    return { ok: false, error: parseErrorMessage(err), expr };
  }
  const fn: ScalarFn = (x: number) => {
    try {
      const value = compiled.evaluate({ x });
      return toRealNumber(value);
    } catch {
      return NaN;
    }
  };
  return { ok: true, fn, expr };
}

/**
 * Compiles a two-variable expression in `x` and `y` (e.g. "x^2 + y^2") into a
 * TwoVarFn. Used by 2D modules (optimization, etc.).
 */
export function compile2D(expr: string): CompileResult<TwoVarFn> {
  if (!expr || expr.trim() === "") {
    return { ok: false, error: "Expression is empty.", expr };
  }
  let compiled: EvalFunction;
  try {
    compiled = compile(expr);
  } catch (err) {
    return { ok: false, error: parseErrorMessage(err), expr };
  }
  const fn: TwoVarFn = (x: number, y: number) => {
    try {
      return toRealNumber(compiled.evaluate({ x, y }));
    } catch {
      return NaN;
    }
  };
  return { ok: true, fn, expr };
}

/** Coerces a mathjs evaluation result to a real number, or NaN if not real. */
function toRealNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return NaN;
}

/** Extracts a readable message from a mathjs parse error. */
function parseErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Could not parse the expression.";
}
