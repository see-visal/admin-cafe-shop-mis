"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type AlertDialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext() {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error("AlertDialog components must be used inside AlertDialog");
  }
  return context;
}

function AlertDialog({ children }: React.PropsWithChildren) {
  const [open, setOpen] = React.useState(false);
  return <AlertDialogContext.Provider value={{ open, setOpen }}>{children}</AlertDialogContext.Provider>;
}

function AlertDialogTrigger({ asChild, children, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { setOpen } = useAlertDialogContext();
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

function AlertDialogContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { open, setOpen } = useAlertDialogContext();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className={cn("w-full max-w-md rounded-lg border bg-background p-6 shadow-xl", className)} onClick={(e) => e.stopPropagation()} {...props}>
        {children}
      </div>
    </div>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

function AlertDialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-4 flex items-center justify-end gap-2", className)} {...props} />;
}

function AlertDialogCancel({ className, onClick, ...props }: React.ComponentProps<"button">) {
  const { setOpen } = useAlertDialogContext();
  return (
    <button
      type="button"
      className={cn("rounded-md border px-3 py-2 text-sm", className)}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    />
  );
}

function AlertDialogAction({ className, onClick, ...props }: React.ComponentProps<"button">) {
  const { setOpen } = useAlertDialogContext();
  return (
    <button
      type="button"
      className={cn("rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground", className)}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
};

