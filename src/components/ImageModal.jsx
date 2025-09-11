import React, { useState, useRef } from "react";

export default function ImageModal({ src, alt, isOpen, onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.2, 0.5);
      // Reset position if zooming out to 1x or less
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

  const handleTouchStart = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
      e.preventDefault();
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && scale > 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
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
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
          zIndex: 1001
        }}
      >
        <button
          onClick={handleZoomOut}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#fff",
            fontSize: 18,
            width: 35,
            height: 35,
            borderRadius: "50%",
            cursor: "pointer",
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
            cursor: "pointer"
          }}
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#fff",
            fontSize: 18,
            width: 35,
            height: 35,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          +
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
        <img
          ref={imageRef}
          src={src}
          alt={alt}
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
          onTouchStart={handleTouchStart}
          draggable={false}
        />
      </div>
    </div>
  );
}