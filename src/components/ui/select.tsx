"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SelectContextValue = {
  value: string;
  setValue: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used inside Select");
  }
  return context;
}

function Select({ value, defaultValue = "", onValueChange, children }: React.PropsWithChildren<{ value?: string; defaultValue?: string; onValueChange?: (value: string) => void }>) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const actualValue = value ?? internalValue;

  const setValue = (next: string) => {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value: actualValue, setValue, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

function SelectTrigger({ className, children, ...props }: React.ComponentProps<"button">) {
  const { open, setOpen } = useSelectContext();
  return (
    <button
      type="button"
      className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm", className)}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelectContext();
  return <span className={cn(!value && "text-muted-foreground")}>{value || placeholder || "Select"}</span>;
}

function SelectContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { open } = useSelectContext();
  if (!open) return null;
  return (
    <div className={cn("absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md", className)} {...props}>
      {children}
    </div>
  );
}

function SelectItem({ className, value, children, ...props }: React.ComponentProps<"button"> & { value: string }) {
  const { value: selected, setValue } = useSelectContext();
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
        selected === value && "bg-accent",
        className,
      )}
      onClick={() => setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };

