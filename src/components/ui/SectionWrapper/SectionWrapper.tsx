import React from "react";

export type SectionBackground =
  | "default"
  | "surface"
  | "lowest"
  | "container"
  | "dark";

export type SectionPadding = "none" | "sm" | "md" | "lg";

interface SectionWrapperProps {
  id?: string;
  background?: SectionBackground;
  padding?: SectionPadding;
  borderBottom?: boolean;
  className?: string;
  children: React.ReactNode;
}

const backgroundClasses: Record<SectionBackground, string> = {
  default: "bg-background text-on-background",
  surface: "bg-surface text-on-surface",
  lowest: "bg-surface-container-lowest text-on-surface",
  container: "bg-surface-container-low text-on-surface",
  dark: "bg-inverse-surface text-inverse-on-surface",
};

const paddingClasses: Record<SectionPadding, string> = {
  none: "py-0",
  sm: "py-8",
  md: "py-12",
  lg: "py-12 md:py-16",
};

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  id,
  background = "default",
  padding = "lg",
  borderBottom = false,
  className = "",
  children,
}) => {
  const combinedClasses = [
    "w-full relative",
    backgroundClasses[background],
    paddingClasses[padding],
    borderBottom ? "border-b border-border-subtle" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section id={id} className={combinedClasses}>
      {children}
    </section>
  );
};
