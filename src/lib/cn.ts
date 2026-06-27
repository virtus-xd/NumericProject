/** Joins truthy class names into a single string (tiny classnames helper). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
