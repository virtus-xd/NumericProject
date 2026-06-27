"use client";

import { InlineMath, BlockMath } from "react-katex";

/**
 * Renders a LaTeX math string with KaTeX. Use `block` for display equations
 * and inline (default) for math embedded in a sentence.
 */
export function Formula({
  math,
  block = false,
}: {
  math: string;
  block?: boolean;
}) {
  return block ? <BlockMath math={math} /> : <InlineMath math={math} />;
}
