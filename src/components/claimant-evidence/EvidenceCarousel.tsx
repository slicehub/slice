import React, { useRef, useEffect } from "react";
import { FullscreenIcon } from "./icons/EvidenceIcons";
import styles from "./EvidenceCarousel.module.css";

interface EvidenceImage {
  id: string;
  url: string;
  description?: string;
}

interface EvidenceCarouselProps {
  images: EvidenceImage[];
}

export const EvidenceCarousel: React.FC<EvidenceCarouselProps> = ({ images }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = (url: string) => {
    window.open(url, "_blank");
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Ensure smooth scrolling
    container.style.scrollBehavior = "smooth";
  }, []);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={styles.carouselContainer}>
      <div
        ref={scrollContainerRef}
        className={styles.scrollContainer}
      >
        <div className={styles.imagesGrid}>
          {images.map((image, index) => (
            <div key={image.id || index} className={styles.imageCard}>
              <div className={styles.imageContainer}>
                <img
                  src={image.url}
                  alt={image.description || `Evidence ${index + 1}`}
                  className={styles.image}
                />
                <button
                  className={styles.fullscreenButton}
                  onClick={() => handleFullscreen(image.url)}
                  aria-label="View fullscreen"
                >
                  <FullscreenIcon size={16} color="#1b1c23" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

