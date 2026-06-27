import { Card, CardTitle } from "./ui/Card";
import { cn } from "@/lib/cn";

interface MethodControlsProps {
  title?: string;
  children: React.ReactNode;
  /** Number of columns on wide screens. Defaults to 3. */
  columns?: 2 | 3 | 4;
  className?: string;
}

const colClasses: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * Responsive container that lays out a module's interactive controls
 * (FunctionInput, sliders, number inputs, selects) in a consistent grid.
 */
export function MethodControls({
  title = "Controls",
  children,
  columns = 3,
  className,
}: MethodControlsProps) {
  return (
    <Card className={className}>
      <CardTitle>{title}</CardTitle>
      <div className={cn("grid grid-cols-1 gap-4", colClasses[columns])}>
        {children}
      </div>
    </Card>
  );
}
