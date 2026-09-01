import React from "react";
import styles from "./SectionWrapper.module.css";

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

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  id,
  background = "default",
  padding = "lg",
  borderBottom = false,
  className = "",
  children,
}) => {
  const combinedClasses = [
    styles.section,
    styles[`bg-${background}`],
    styles[`padding-${padding}`],
    borderBottom ? styles.borderBottom : "",
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
