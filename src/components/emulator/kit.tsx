"use client";

/**
 * Emulator-specific compositions of the shadcn components in
 * `@/components/ui`. Buttons, badges, inputs, textareas, tabs and tables are
 * used directly from there; this file only adds the patterns the emulator
 * repeats (labelled field, option-list select, confirmation, notice).
 *
 * Built to ISO 9241-110/-112/-171 and WCAG 2.1 AA (ISO/IEC 40500): every
 * control has a programmatic label, destructive actions ask first, and
 * status never relies on colour alone.
 */

import { Info } from "lucide-react";
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
  useState,
} from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field as FieldRoot,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ─────────────────────────────── Icon button ─────────────────────────────── */

/** Icon-only shadcn Button. `label` is required: it is the accessible name. */
export function IconButton({
  label,
  variant = "ghost",
  size = "icon",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "aria-label"> & {
  label: string;
}) {
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      {...props}
    />
  );
}

/* ─────────────────────────────── Headings ─────────────────────────────── */

export function SectionHeading({
  icon,
  children,
  action,
  className,
  id,
}: {
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-between gap-2 mb-2", className)}
    >
      <h3
        id={id}
        className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-t-muted [&_svg]:size-3.5 [&_svg]:shrink-0"
      >
        {icon}
        {children}
      </h3>
      {action}
    </div>
  );
}

/* ─────────────────────────────── Form field ─────────────────────────────── */

/**
 * shadcn Field + FieldLabel + FieldDescription, with the label wired to the
 * control automatically (htmlFor/id) and the hint wired via
 * aria-describedby.
 */
export function Field({
  label,
  hint,
  required,
  icon,
  children,
  className,
  htmlFor,
}: {
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Id of the control when it is not the first child (e.g. input + button row). */
  htmlFor?: string;
}) {
  const generated = useId();
  const hintId = `${generated}-hint`;
  const [first, ...rest] = Children.toArray(children);
  const control =
    !htmlFor && isValidElement(first)
      ? (first as ReactElement<{ id?: string; "aria-describedby"?: string }>)
      : null;
  const id = htmlFor ?? control?.props.id ?? generated;

  return (
    <FieldRoot className={cn("gap-1.5", className)}>
      <FieldLabel
        htmlFor={id}
        className="gap-1.5 text-2xs font-semibold uppercase tracking-wider text-t-muted [&_svg]:size-3 [&_svg]:shrink-0"
      >
        {icon}
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </FieldLabel>
      {control
        ? cloneElement(control, {
            id,
            "aria-describedby": hint
              ? hintId
              : control.props["aria-describedby"],
          })
        : first}
      {rest}
      {hint && (
        <FieldDescription id={hintId} className="text-2xs text-t-muted">
          {hint}
        </FieldDescription>
      )}
    </FieldRoot>
  );
}

/* ─────────────────────────────── Select ─────────────────────────────── */

type Option<T extends string> = T | { label: string; value: T };

/**
 * shadcn Select driven by an option list. Base UI supplies the listbox
 * semantics and full keyboard support (arrows, type-ahead, Home/End, Esc).
 */
export function OptionSelect<T extends string>({
  value,
  onChange,
  options,
  size = "default",
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly Option<T>[];
  size?: "sm" | "default";
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  const items = options.map((o) =>
    typeof o === "string" ? { label: o, value: o } : o,
  );
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(v) => v != null && onChange(v as T)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        size={size}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={className}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ─────────────────────────────── Notice ─────────────────────────────── */

/** shadcn Alert used as an inline note, e.g. why controls are unavailable. */
export function Notice({
  tone = "info",
  icon,
  children,
  className,
  live = false,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Announce changes politely to screen readers. */
  live?: boolean;
}) {
  return (
    <Alert
      variant={tone}
      role={live ? "status" : undefined}
      className={className}
    >
      {icon ?? <Info aria-hidden="true" />}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

/* ─────────────────────────────── Confirmation ─────────────────────────────── */

/**
 * shadcn AlertDialog guarding a destructive action (ISO 9241-110 error
 * tolerance). `trigger` must be a button element; it opens the dialog.
 */
export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  tone = "danger",
}: {
  trigger: ReactElement;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  tone?: "danger" | "warning";
}) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="neutral">Cancel</AlertDialogCancel>
          <Button
            variant={tone}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
