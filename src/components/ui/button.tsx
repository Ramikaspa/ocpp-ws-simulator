import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Base UI's Button renders type="button" by default, so a button inside a
// form never submits it by accident.
const buttonVariants = cva(
  "group/button inline-flex !cursor-pointer shrink-0 items-center justify-center rounded-md border bg-clip-padding text-xs font-semibold whitespace-nowrap transition-colors select-none disabled:!cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Primary action — white on violet-600 (5.7:1) */
        default: "bg-primary text-white border-brand/60 hover:bg-violet-700",
        neutral:
          "bg-surface-elevated text-t-secondary border-b-strong hover:bg-surface-hover hover:text-t-primary hover:border-b-control",
        outline:
          "border-b-control bg-transparent text-t-secondary hover:bg-surface-hover hover:text-t-primary aria-expanded:bg-surface-hover",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "border-transparent text-t-secondary hover:bg-surface-hover hover:text-t-primary aria-expanded:bg-surface-hover aria-expanded:text-t-primary",
        success:
          "bg-success-fill text-white border-green-600 hover:bg-green-800",
        danger: "bg-danger-fill text-white border-rose-500 hover:bg-rose-700",
        warning:
          "bg-warning-fill text-[#1a1203] border-amber-300 hover:bg-amber-400",
        "soft-brand":
          "bg-brand-subtle text-brand-strong border-brand/35 hover:bg-brand/20",
        "soft-success":
          "bg-success/10 text-success border-success/35 hover:bg-success/20",
        "soft-danger":
          "bg-danger/10 text-danger border-danger/35 hover:bg-danger/20",
        "soft-warning":
          "bg-warning/10 text-warning border-warning/35 hover:bg-warning/20",
        destructive:
          "bg-danger/10 text-danger border-danger/35 hover:bg-danger/20",
        link: "border-transparent text-brand underline underline-offset-4 hover:text-brand-strong",
      },
      size: {
        default: "h-9 gap-2 px-3",
        xs: "h-7 gap-1 px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-4 text-sm",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
