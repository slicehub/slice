import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./LoadingDisputes.module.css";

export const LoadingDisputes: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const disputeId = id || "1";

  useEffect(() => {
    // Reduced to 4000ms (4s) for better UX
    const timer = setTimeout(() => {
      // Navigate to overview of assigned dispute
      navigate(`/dispute-overview/${disputeId}`);
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate, disputeId]);

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
