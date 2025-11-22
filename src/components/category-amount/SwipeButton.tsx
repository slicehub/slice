import React, { useState, useRef, useEffect } from "react";
import styles from "./SwipeButton.module.css";

interface SwipeButtonProps {
  onSwipeComplete: () => void;
}

export const SwipeButton: React.FC<SwipeButtonProps> = ({ onSwipeComplete }) => {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      startXRef.current = e.clientX - rect.left;
    }
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const handleWidth = 36;
    const maxWidth = rect.width - handleWidth;
    const progress = Math.max(0, Math.min(100, (currentX / maxWidth) * 100));
    
    currentXRef.current = currentX;
    setSwipeProgress(progress);

    if (progress >= 80) {
      onSwipeComplete();
      setIsDragging(false);
      setSwipeProgress(0);
    }
  }, [isDragging, onSwipeComplete]);

  const handleMouseUp = React.useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setSwipeProgress((prev) => {
        if (prev < 80) {
          return 0;
        }
        return prev;
      });
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      startXRef.current = e.touches[0].clientX - rect.left;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !buttonRef.current) return;
    e.preventDefault();
    
    const rect = buttonRef.current.getBoundingClientRect();
    const currentX = e.touches[0].clientX - rect.left;
    const handleWidth = 36;
    const maxWidth = rect.width - handleWidth;
    const progress = Math.max(0, Math.min(100, (currentX / maxWidth) * 100));
    
    currentXRef.current = currentX;
    setSwipeProgress(progress);

    if (progress >= 80) {
      onSwipeComplete();
      setIsDragging(false);
      setSwipeProgress(0);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      if (swipeProgress < 80) {
        setSwipeProgress(0);
      }
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
      return () => {
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging]);

  return (
    <button
      ref={buttonRef}
      className={styles.swipeButton}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className={styles.buttonBackground} />
      <div className={styles.buttonBorder} />
      
      {/* Progress bar that covers the text */}
      <div 
        className={styles.progressBar}
        style={{ width: `calc(${swipeProgress}% + 18px)` }}
      />
      
      <div className={styles.swipeHandle} style={{ left: `${swipeProgress}%` }}>
        <div className={styles.handleGradient} />
        <img 
          src="/images/category-amount/subtract-icon.svg" 
          alt="Arrow" 
          className={styles.arrowIcon}
        />
      </div>
      
      <span className={styles.buttonText}>Desliza para buscar disputas</span>
    </button>
  );
};

