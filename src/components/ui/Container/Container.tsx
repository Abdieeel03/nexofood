import React from "react";
import styles from "./Container.module.css";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = "",
  id,
}) => {
  return (
    <div id={id} className={`${styles.container} ${className}`}>
      {children}
    </div>
  );
};
