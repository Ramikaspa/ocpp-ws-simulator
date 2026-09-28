"use client";

import { GripHorizontal, GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  ...props
}: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle = true,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean;
}) {
  const isHorizontal =
    className?.includes("h-px") ||
    className?.includes("h-[") ||
    props["aria-orientation"] === "horizontal";

  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "group relative flex items-center justify-center bg-border ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        isHorizontal
          ? "h-px w-full cursor-row-resize after:absolute after:inset-x-0 after:top-1/2 after:h-2 after:-translate-y-1/2"
          : "w-px h-full cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            "z-20 flex items-center justify-center rounded-full border border-b-strong bg-surface-elevated text-t-muted shadow-md transition-all",
            "group-hover:border-brand/80 group-hover:bg-surface-hover group-hover:text-brand group-hover:scale-105",
            "group-data-[resize-handle-active]:border-brand group-data-[resize-handle-active]:bg-brand group-data-[resize-handle-active]:text-white",
            isHorizontal
              ? "h-2 w-7 cursor-row-resize"
              : "h-7 w-2 cursor-col-resize",
          )}
        >
          {isHorizontal ? (
            <GripHorizontal className="size-2.5" aria-hidden="true" />
          ) : (
            <GripVertical className="size-2.5" aria-hidden="true" />
          )}
        </div>
      )}
    </ResizablePrimitive.Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
