import React from "react";
import ActionButton from "./ActionButton";

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onConfirm, 
  confirmText = "Confirm", 
  confirmDisabled = false,
  confirmVariant = "primary",
  showDefaultButtons = true,
  width = "420px"
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "8px",
        width: width,
        maxWidth: "95vw",
        maxHeight: "90vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box"
      }}>
        {title && <h3 style={{ marginBottom: "16px", flexShrink: 0 }}>{title}</h3>}
        <div style={{ 
          marginBottom: showDefaultButtons ? "16px" : "0",
          overflow: "auto",
          flex: 1,
          minHeight: 0
        }}>
          {children}
        </div>
        {showDefaultButtons && (
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexShrink: 0 }}>
            <ActionButton variant="secondary" onClick={onClose}>
              Cancel
            </ActionButton>
            {onConfirm && (
              <ActionButton 
                variant={confirmVariant} 
                onClick={onConfirm}
                disabled={confirmDisabled}
              >
                {confirmText}
              </ActionButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}