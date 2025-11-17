import React, { useState, useEffect } from "react";

export default function ZoomableImageViewer({ 
  isOpen, 
  onClose, 
  images = [],
  initialIndex = 0
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset to initialIndex when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetZoom();
    }
  }, [isOpen, initialIndex]);

  if (!isOpen || images.length === 0) return null;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetZoom();
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetZoom();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      resetZoom();
    }
  };

  const handleClose = () => {
    onClose();
    resetZoom();
  };
  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 10)); // Max 1000% (10x zoom)
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.1)); // Min 10%
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
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
          zIndex: 1001,
          transition: "background 0.2s"
        }}
        onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
        onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
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

      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0, 0, 0, 0.7)",
          borderRadius: 20,
          padding: "8px 12px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          zIndex: 1001
        }}
      >        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.1}
          style={{
            background: "transparent",
            border: "none",
            color: zoom <= 0.1 ? "#666" : "#fff",
            fontSize: 20,
            cursor: zoom <= 0.1 ? "not-allowed" : "pointer",
            padding: "4px 8px"
          }}
        >
          −
        </button>
        <span style={{ color: "#fff", fontSize: 14, minWidth: 50, textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </span>        <button
          onClick={handleZoomIn}
          disabled={zoom >= 10}
          style={{
            background: "transparent",
            border: "none",
            color: zoom >= 10 ? "#666" : "#fff",
            fontSize: 20,
            cursor: zoom >= 10 ? "not-allowed" : "pointer",
            padding: "4px 8px"
          }}
        >
          +
        </button>
        <button
          onClick={resetZoom}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#fff",
            fontSize: 12,
            cursor: "pointer",
            padding: "4px 12px",
            borderRadius: 12,
            marginLeft: 4
          }}
        >
          Reset
        </button>
      </div>

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
            zIndex: 1001,
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
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
            zIndex: 1001,
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
        >
          ›
        </button>
      )}      {/* Image */}
      <div
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default"
        }}
        onWheel={handleWheel}
      >
        {currentImage && (
          <img
            src={currentImage.src}
            alt={currentImage.alt || `Document ${currentIndex + 1}`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              userSelect: "none",
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.1s ease-out"
            }}
            draggable={false}
            onMouseDown={handleMouseDown}
          />
        )}
      </div>

      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: 12,
          textAlign: "center",
          zIndex: 1001
        }}
      >
        {zoom > 1 ? "Drag to pan • Scroll to zoom" : "Scroll to zoom in"}
      </div>
    </div>
  );
}
