import React from "react";

export default function ActionButton({ 
  children, 
  onClick, 
  style = {}, 
  disabled = false, 
  variant = "primary",
  ...props 
}) {
  const baseStyle = {
    border: "none",
    borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: 500,
    padding: "8px 16px",
    minWidth: 90,
    ...style
  };

  const variants = {
    primary: {
      background: disabled ? "#d9d9d9" : "#52c41a",
      color: disabled ? "#999" : "#fff"
    },
    danger: {
      background: disabled ? "#d9d9d9" : "#cf1322",
      color: disabled ? "#999" : "#fff"
    },
    warning: {
      background: disabled ? "#d9d9d9" : "#faad14",
      color: disabled ? "#999" : "#fff"
    },
    secondary: {
      background: disabled ? "#f5f5f5" : "#eee",
      color: disabled ? "#999" : "#333"
    }
  };

  const finalStyle = {
    ...baseStyle,
    ...variants[variant]
  };

  return (
    <button
      style={finalStyle}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}