import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoadingDisputes.module.css";

export const LoadingDisputes: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Mínimo 10 segundos de loading
    const timer = setTimeout(() => {
      // Navegar a la vista general de la disputa asignada
      navigate("/dispute-overview");
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.loadingContent}>
        <div className={styles.videoContainer}>
          <video 
            src="/animations/loading.mp4" 
            autoPlay
            loop
            muted
            playsInline
            className={styles.loadingVideo}
          />
        </div>
        <p className={styles.loadingText}>Cargando disputas para ti</p>
      </div>
    </div>
  );
};

export default LoadingDisputes;

