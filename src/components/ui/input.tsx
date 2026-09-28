import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

import { cn } from "@/lib/utils";

// Outline uses b-control (≥3:1 against the surrounding surfaces, WCAG 1.4.11).
// Read-only values stay fully legible and selectable instead of greyed out.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-b-control bg-surface-inset px-3 py-1 text-xs text-t-primary transition-colors placeholder:text-t-faint file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50 [&[readonly]]:border-transparent [&[readonly]]:bg-transparent [&[readonly]]:text-t-secondary aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
