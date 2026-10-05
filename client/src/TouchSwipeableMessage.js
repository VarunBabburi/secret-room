import React, { useState } from "react";

const SwipeableMessage = ({ children, onSwipeLeft, onSwipeRight }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [translateX, setTranslateX] = useState(0);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
    if (!touchStart) return;

    // Visual effect while dragging (WhatsApp elastic feel)
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;

    // Right swipe limit (max 80px shift)
    if (diff > 0 && diff < 80) {
      setTranslateX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setTranslateX(0);
      return;
    }

    const distance = touchEnd - touchStart;
    const isRightSwipe = distance > minSwipeDistance;

    if (isRightSwipe) {
      onSwipeRight(); // Trigger reply callback
    }

    // Reset position back to origin smoothly
    setTranslateX(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${translateX}px)`,
        transition: translateX === 0 ? "transform 0.2s ease-out" : "none",
        position: "relative",
      }}
    >
      {/* Visual Reply Icon during swipe */}
      {translateX > 20 && (
        <div
          style={{
            position: "absolute",
            left: "-30px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "18px",
            opacity: translateX / 80,
          }}
        >
          ↩️
        </div>
      )}
      {children}
    </div>
  );
};

export default SwipeableMessage;