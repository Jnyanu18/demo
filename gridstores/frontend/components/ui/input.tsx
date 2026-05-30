import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("h-11 w-full rounded-md border border-burgundy/15 bg-cream-card px-3 text-sm outline-none ring-gold/40 focus:ring-2", className)} {...props} />
));
Input.displayName = "Input";
