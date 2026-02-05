import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            // Variants
            "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500":
              variant === "default",
            "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 focus-visible:ring-stone-400":
              variant === "outline",
            "hover:bg-stone-100 text-stone-700 focus-visible:ring-stone-400":
              variant === "ghost",
            // Sizes
            "h-10 px-6 py-2 text-base": size === "default",
            "h-8 px-4 py-1 text-sm": size === "sm",
            "h-12 px-8 py-3 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
