import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full resize-y rounded-md border border-b-control bg-surface-inset px-3 py-2 font-mono text-xs text-t-primary transition-colors placeholder:text-t-faint hover:border-b-strong focus-visible:border-brand/70 focus-visible:ring-1 focus-visible:ring-brand/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
