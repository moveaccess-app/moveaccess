/**
 * Text and Heading Components
 * Typography components following MoveAccess Design System
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-bold tracking-tight", {
  variants: {
    level: {
      h1: "text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]",
      h2: "text-3xl md:text-4xl lg:text-5xl leading-tight",
      h3: "text-2xl md:text-3xl lg:text-4xl leading-tight",
      h4: "text-xl md:text-2xl lg:text-3xl leading-snug",
      h5: "text-lg md:text-xl lg:text-2xl leading-snug",
      h6: "text-base md:text-lg lg:text-xl leading-normal",
    },
    gradient: {
      true: "text-gradient",
      false: "",
    },
  },
  defaultVariants: {
    level: "h2",
    gradient: false,
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = "h2", gradient, as, ...props }, ref) => {
    const Component = as || level || "h2";
    return (
      <Component
        className={cn(headingVariants({ level, gradient, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Heading.displayName = "Heading";

const textVariants = cva("", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg md:text-xl",
      xl: "text-xl md:text-2xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    color: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      secondary: "text-secondary-foreground",
    },
  },
  defaultVariants: {
    size: "base",
    weight: "normal",
    color: "default",
  },
});

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "label";
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size, weight, color, as = "p", ...props }, ref) => {
    const Component = as;
    return (
      <Component
        className={cn(textVariants({ size, weight, color, className }))}
        ref={ref as React.Ref<HTMLParagraphElement>}
        {...props}
      />
    );
  }
);
Text.displayName = "Text";

export { Heading, headingVariants, Text, textVariants };
