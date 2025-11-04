import React, { useState } from "react";

export default function SimpleImageViewer({ 
  isOpen, 
  onClose, 
  images = []
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || images.length === 0) return null;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20
      }}
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "rgba(255, 255, 255, 0.2)",
          border: "none",
          color: "#fff",
          fontSize: 24,
          width: 40,
          height: 40,
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001
        }}
      >
        ×
      </button>

      {/* Image counter */}
      {hasMultipleImages && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            background: "rgba(0, 0, 0, 0.7)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 15,
            fontSize: 14,
            zIndex: 1001
          }}
        >
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Previous button */}
      {hasMultipleImages && currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          style={{
            position: "absolute",
            left: 20,
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#fff",
            fontSize: 24,
            width: 50,
            height: 50,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001
          }}
        >
          ‹
        </button>
      )}

      {/* Next button */}
      {hasMultipleImages && currentIndex < images.length - 1 && (
        <button
          onClick={handleNext}
          style={{
            position: "absolute",
            right: 20,
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#fff",
            fontSize: 24,
            width: 50,
            height: 50,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001
          }}
        >
          ›
        </button>
      )}

      {/* Image */}
      <div
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {currentImage && (
          <img
            src={currentImage.src}
            alt={currentImage.alt || `Document ${currentIndex + 1}`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              userSelect: "none"
            }}
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}