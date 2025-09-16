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
  showDefaultButtons = true
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
        padding: "24px",
        borderRadius: "8px",
        width: "400px",
        maxWidth: "90vw"
      }}>
        {title && <h3 style={{ marginBottom: "16px" }}>{title}</h3>}
        <div style={{ marginBottom: showDefaultButtons ? "16px" : "0" }}>
          {children}
        </div>
        {showDefaultButtons && (
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
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