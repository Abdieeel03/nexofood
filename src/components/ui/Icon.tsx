import React from "react";

export interface IconProps {
  name: string;
  size?: number | string;
  color?: string;
  fill?: boolean;
  weight?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color,
  fill = false,
  weight = 400,
  className = "",
  style = {},
}) => {
  const customStyle: React.CSSProperties = {
    fontSize: typeof size === "number" ? `${size}px` : size,
    fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}`,
    lineHeight: 1,
    userSelect: "none",
    verticalAlign: "middle",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...(color ? { color } : {}),
    ...style,
  };

  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={customStyle}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};
