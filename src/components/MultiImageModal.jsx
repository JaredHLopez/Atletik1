import React, { useState, useRef, useEffect } from "react";

export default function MultiImageModal({ 
  images = [], 
  currentIndex = 0, 
  isOpen, 
  onClose, 
  onNavigate 
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || {};
  const currentSrc = currentImage.src;
  const currentAlt = currentImage.alt || `Document ${currentIndex + 1}`;

  // Reset scale and position when changing images
  const handleImageChange = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrevious = () => {
    if (onNavigate && currentIndex > 0) {
      onNavigate(currentIndex - 1);
      handleImageChange();
    }
  };

  const handleNext = () => {
    if (onNavigate && currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
      handleImageChange();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentIndex, images.length]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 5)); // Increased max zoom to 5x and step to 0.25
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.25, 0.25); // Decreased min zoom to 0.25x and step to 0.25
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15; // Smoother wheel zoom
    setScale(prev => {
      const newScale = Math.min(Math.max(prev + delta, 0.25), 5); // Same range as buttons
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

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
      onWheel={handleWheel}
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

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          {/* Previous button */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            style={{
              position: "absolute",
              left: 20,
              top: "50%",
              transform: "translateY(-50%)",
              background: currentIndex === 0 ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: currentIndex === 0 ? "#888" : "#fff",
              fontSize: 24,
              width: 50,
              height: 50,
              borderRadius: "50%",
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001
            }}
          >
            ‹
          </button>

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={currentIndex === images.length - 1}
            style={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              background: currentIndex === images.length - 1 ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: currentIndex === images.length - 1 ? "#888" : "#fff",
              fontSize: 24,
              width: 50,
              height: 50,
              borderRadius: "50%",
              cursor: currentIndex === images.length - 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001
            }}
          >
            ›
          </button>
        </>
      )}

      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 10,
          background: "rgba(0, 0, 0, 0.7)",
          padding: "10px 15px",
          borderRadius: 25,
          zIndex: 1001,
          alignItems: "center"
        }}
      >
        <button
          onClick={handleZoomOut}
          disabled={scale <= 0.25}
          style={{
            background: scale <= 0.25 ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: scale <= 0.25 ? "#888" : "#fff",
            fontSize: 18,
            width: 35,
            height: 35,
            borderRadius: "50%",
            cursor: scale <= 0.25 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          -
        </button>
        
        <button
          onClick={handleReset}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#fff",
            fontSize: 12,
            padding: "8px 12px",
            borderRadius: 15,
            cursor: "pointer",
            minWidth: "60px"
          }}
        >
          {Math.round(scale * 100)}%
        </button>
        
        <button
          onClick={handleZoomIn}
          disabled={scale >= 5}
          style={{
            background: scale >= 5 ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: scale >= 5 ? "#888" : "#fff",
            fontSize: 18,
            width: 35,
            height: 35,
            borderRadius: "50%",
            cursor: scale >= 5 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          +
        </button>
        
        {/* Fit to screen button */}
        <button
          onClick={() => {
            setScale(0.8);
            setPosition({ x: 0, y: 0 });
          }}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#fff",
            fontSize: 10,
            padding: "8px 10px",
            borderRadius: 15,
            cursor: "pointer"
          }}
        >
          Fit
        </button>
      </div>

      {/* Image */}
      <div
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {currentSrc && (
          <img
            ref={imageRef}
            src={currentSrc}
            alt={currentAlt}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: "center",
              transition: isDragging ? "none" : "transform 0.2s ease",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              userSelect: "none"
            }}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}