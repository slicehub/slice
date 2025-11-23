import React, { useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DisputeOverviewHeader } from "../components/dispute-overview/DisputeOverviewHeader";
import { DeadlineCard } from "../components/dispute-overview/DeadlineCard";
import { ClaimantInfoCard } from "../components/claimant-evidence/ClaimantInfoCard";
import { DemandDetailSection } from "../components/claimant-evidence/DemandDetailSection";
import { EvidenceCarousel } from "../components/claimant-evidence/EvidenceCarousel";
import { EvidenceList } from "../components/claimant-evidence/EvidenceList";
import { VideoEvidenceList } from "../components/claimant-evidence/VideoEvidenceList";
import { AudioEvidenceList } from "../components/claimant-evidence/AudioEvidenceList";
import { PaginationDots } from "../components/dispute-overview/PaginationDots";
import styles from "./ClaimantEvidence.module.css";

export const DefendantEvidence: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const handleBack = () => {
    void navigate("/dispute-overview");
  };

  // Minimum distance to consider a swipe (50px)
  const minSwipeDistance = 50;

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isDragging.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !startX.current) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - startX.current);
    const deltaY = Math.abs(touch.clientY - (startY.current || 0));
    
    // Only prevent scroll if movement is primarily horizontal
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !startX.current) return;
    
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const deltaX = startX.current - endX;
    const deltaY = startY.current - endY;

    // Only consider horizontal swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left (slide left = navigate right/vote)
        void navigate("/vote");
      } else {
        // Swipe right (slide right = navigate left/back)
        void navigate("/claimant-evidence");
      }
    }

    startX.current = null;
    startY.current = null;
    isDragging.current = false;
  }, [navigate]);

  // Mouse events for desktop development
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    isDragging.current = true;
  }, []);

  const onMouseMove = useCallback(() => {
    if (!isDragging.current) return;
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !startX.current) return;
    
    const endX = e.clientX;
    const endY = e.clientY;
    const deltaX = startX.current - endX;
    const deltaY = startY.current - endY;

    // Only consider horizontal swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left (slide left = navigate right/vote)
        void navigate("/vote");
      } else {
        // Swipe right (slide right = navigate left/back)
        void navigate("/claimant-evidence");
      }
    }

    startX.current = null;
    startY.current = null;
    isDragging.current = false;
  }, [navigate]);

  // Cleanup when component unmounts
  useEffect(() => {
    const handleMouseUpGlobal = () => {
      isDragging.current = false;
      startX.current = null;
      startY.current = null;
    };

    window.addEventListener("mouseup", handleMouseUpGlobal);
    return () => {
      window.removeEventListener("mouseup", handleMouseUpGlobal);
    };
  }, []);

  // Mock data - in production would come from the contract
  const defendantData = {
    name: "Micaela Descotte",
    role: "Defendant",
    avatar: "/images/profiles-mockup/profile-2.png",
  };

  const demandDetail =
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.";

  // Images for the top carousel (after the demand detail)
  const topCarouselImages = [
    {
      id: "carousel-1",
      url: "/images/category-amount/defensora-1.png",
      description: "Evidence 1",
    },
    {
      id: "carousel-2",
      url: "/images/category-amount/evidencia-1.png",
      description: "Evidence 2",
    },
    {
      id: "carousel-3",
      url: "/images/category-amount/evidencia-2.png",
      description: "Evidence 3",
    },
  ];

  const imageEvidenceList = [
    {
      id: "1",
      type: "image" as const,
      url: "/images/category-amount/evidencia-1.png",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesing industry. Lorem Ipsum has been the industry's standard dummy text ever since the",
      uploadDate: "10/08/2026",
    },
    {
      id: "2",
      type: "image" as const,
      url: "/images/category-amount/evidencia-2.png",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesing industry. Lorem Ipsum has been the industry's standard dummy text ever since the",
      uploadDate: "11/08/2026",
    },
  ];

  const videoEvidenceList = [
    {
      id: "v1",
      type: "video" as const,
      url: "/animations/money.mp4",
      thumbnail: "/images/category-amount/evidencia-video.png",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesing industry. Lorem Ipsum has been the industry's standard dummy text ever since the",
      uploadDate: "10/08/2026",
    },
  ];

  const audioEvidence = {
    id: "a1",
    title: "Defendant's audio",
    duration: "1:45min",
    progress: 43,
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <DisputeOverviewHeader onBack={handleBack} />
      <DeadlineCard deadline="14/12/2025" />
      <div className={styles.scrollableContent}>
        <ClaimantInfoCard claimant={defendantData} />
        <DemandDetailSection detail={demandDetail} />
        <EvidenceCarousel images={topCarouselImages} />
        <div className={styles.evidenceSection}>
          <h3 className={styles.evidenceTitle}>Evidence that demonstrates it:</h3>
          <EvidenceList evidenceList={imageEvidenceList} />
          <VideoEvidenceList evidenceList={videoEvidenceList} />
          <AudioEvidenceList audio={audioEvidence} />
        </div>
      </div>
      <PaginationDots currentIndex={2} total={4} />
    </div>
  );
};

export default DefendantEvidence;

