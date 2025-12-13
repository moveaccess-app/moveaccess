/**
 * Container and Section Components
 * Layout primitives following MoveAccess Design System
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto", {
  variants: {
    size: {
      narrow: "max-w-6xl",
      wide: "max-w-7xl",
      full: "max-w-full",
    },
    padding: {
      none: "",
      default: "px-6 lg:px-12",
      section: "px-6 py-20 md:px-12 lg:px-24 lg:py-32",
    },
  },
  defaultVariants: {
    size: "wide",
    padding: "default",
  },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: "div" | "section" | "main" | "article";
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, as = "div", ...props }, ref) => {
    const Component = as;
    return (
      <Component
        ref={ref}
        className={cn(containerVariants({ size, padding, className }))}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";

const sectionVariants = cva("relative", {
  variants: {
    spacing: {
      none: "",
      default: "py-16 md:py-24",
      large: "py-20 md:py-32 lg:py-40",
    },
    background: {
      none: "",
      default: "bg-background",
      card: "bg-card",
      muted: "bg-muted/30",
    },
  },
  defaultVariants: {
    spacing: "default",
    background: "none",
  },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, background, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(sectionVariants({ spacing, background, className }))}
        {...props}
      />
    );
  }
);
Section.displayName = "Section";

export { Container, containerVariants, Section, sectionVariants };
