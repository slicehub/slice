import React, { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import styles from "./SuccessAnimation.module.css";

// Load animation data dynamically
const loadAnimationData = async () => {
  // Encode the filename part to handle the space in "success confetti.json"
  const filename = encodeURIComponent("success confetti.json");
  const response = await fetch(`/images/category-amount/${filename}`);
  if (!response.ok) {
    throw new Error("Failed to load animation");
  }
  return await response.json();
};

interface SuccessAnimationProps {
  onComplete: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ onComplete }) => {
  const lottieRef = useRef<any>(null);
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    void loadAnimationData()
      .then((data) => {
        setAnimationData(data);
      })
      .catch((error) => {
        console.error("Failed to load animation:", error);
      });
  }, []);

  useEffect(() => {
    if (!animationData) return;

    // Calculate animation duration: op (180 frames) / fr (60 fps) = 3 seconds
    const animationDuration = 3000;

    const timer = setTimeout(() => {
      onComplete();
    }, animationDuration);

    return () => {
      clearTimeout(timer);
    };
  }, [animationData, onComplete]);

  if (!animationData) {
    return (
      <div className={styles.container}>
        <div className={styles.animationWrapper}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.animationWrapper}>
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={false}
          autoplay={true}
          className={styles.animation}
        />
      </div>
    </div>
  );
};

