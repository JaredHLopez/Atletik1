import React from "react";

export default function WarningMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      background: "#fff2f0",
      color: "#cf1322",
      padding: "12px 16px",
      borderRadius: "6px",
      border: "1px solid #ffa39e",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      zIndex: 1000,
      maxWidth: "400px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }}>
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            color: "#cf1322",
            cursor: "pointer",
            marginLeft: "8px",
            fontSize: "16px",
            padding: "0"
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}