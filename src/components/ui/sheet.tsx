"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used inside Sheet");
  }
  return context;
}

function Sheet({ children }: React.PropsWithChildren) {
  const [open, setOpen] = React.useState(false);
  return <SheetContext.Provider value={{ open, setOpen }}>{children}</SheetContext.Provider>;
}

function SheetTrigger({ asChild, children, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { setOpen } = useSheetContext();

  if (asChild && React.isValidElement<{ onClick?: (event: React.MouseEvent) => void }>(children)) {
    const child = children;
    return React.cloneElement(child, {
      ...props,
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event);
        setOpen(true);
      },
    });
  }

  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
}

function SheetContent({ side = "right", className, children, ...props }: React.ComponentProps<"div"> & { side?: "left" | "right" }) {
  const { open, setOpen } = useSheetContext();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)}>
      <div
        className={cn(
          "absolute top-0 h-full w-80 max-w-[90vw] bg-background p-4 shadow-lg",
          side === "left" ? "left-0" : "right-0",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export { Sheet, SheetTrigger, SheetContent };

