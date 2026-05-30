import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-burgundy text-cream hover:bg-burgundy-dark",
    secondary: "bg-gold text-charcoal hover:bg-gold-dark",
    outline: "border border-burgundy/25 bg-transparent text-burgundy hover:bg-burgundy/5",
    ghost: "bg-transparent text-charcoal hover:bg-charcoal/5"
  };
  return (
    <button
      className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60", variants[variant], className)}
      {...props}
    />
  );
}
