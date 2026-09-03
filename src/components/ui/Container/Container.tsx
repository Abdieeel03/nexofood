import React from "react";

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
    <div id={id} className={`w-full max-w-7xl mx-auto px-4 md:px-6 ${className}`}>
      {children}
    </div>
  );
};
