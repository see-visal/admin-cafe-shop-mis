import { cn } from "@/lib/utils";

import { formatCurrency } from "@/lib/utils";

export function Price({
  amount,
  size = "md",
  className,
}: {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";
  return <span className={cn("font-semibold", sizeClass, className)}>{formatCurrency(amount ?? 0)}</span>;
}

