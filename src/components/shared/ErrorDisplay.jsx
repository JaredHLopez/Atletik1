import React from "react";

export default function ErrorDisplay({ error }) {
  if (!error) return null;

  return (
    <div style={{
      padding: "12px 16px",
      marginBottom: 16,
      backgroundColor: "#fee",
      color: "#c00",
      borderRadius: 6,
      border: "1px solid #fcc"
    }}>
      {error}
    </div>
  );
}