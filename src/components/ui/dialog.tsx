"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used inside Dialog");
  }
  return context;
}

function Dialog({ open, defaultOpen = false, onOpenChange, children }: React.PropsWithChildren<{ open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }>) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const actualOpen = open ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return <DialogContext.Provider value={{ open: actualOpen, setOpen }}>{children}</DialogContext.Provider>;
}

function DialogTrigger({ asChild, children, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { setOpen } = useDialogContext();
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

function DialogContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { open, setOpen } = useDialogContext();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className={cn("w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl", className)} onClick={(e) => e.stopPropagation()} {...props}>
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 text-left", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-4 flex items-center justify-end gap-2", className)} {...props} />;
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };

