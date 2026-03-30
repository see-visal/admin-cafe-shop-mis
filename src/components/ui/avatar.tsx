import * as React from "react";

import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />;
}

function AvatarImage({
  className,
  src,
  alt = "",
  ...props
}: React.ComponentProps<"img">) {
  const [error, setError] = React.useState(false);
  // Reset error state when src changes
  React.useEffect(() => { setError(false); }, [src]);
  if (!src || error) return null;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)} {...props} />;
}

export { Avatar, AvatarImage, AvatarFallback };


