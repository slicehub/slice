import React, { useRef } from "react";
import styles from "./CategoryAmountHeader.module.css";

interface CategoryAmountHeaderProps {
  onBack: () => void;
}

export const CategoryAmountHeader: React.FC<CategoryAmountHeaderProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnded = () => {
    if (videoRef.current) {
      // Pausar el video en el último frame
      videoRef.current.pause();
      // Asegurar que esté en el último frame
      if (videoRef.current.duration) {
        videoRef.current.currentTime = videoRef.current.duration;
      }
    }
  };

  return (
    <div className={styles.header}>
      <button className={styles.backButton} onClick={onBack}>
        <img 
          src="/images/category-amount/back-arrow.svg" 
          alt="Back" 
          className={styles.backIcon}
        />
      </button>
      
      <button className={styles.categoryButton}>
        <div className={styles.categoryIcon}>
          <video 
            ref={videoRef}
            src="/animations/category.mp4" 
            autoPlay
            muted
            playsInline
            className={styles.categoryVideo}
            onEnded={handleVideoEnded}
          />
        </div>
        <span className={styles.categoryText}>Select a category</span>
        <img 
          src="/images/category-amount/chevron-down.svg" 
          alt="Dropdown" 
          className={styles.chevronIcon}
        />
      </button>
    </div>
  );
};

