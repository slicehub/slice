import React, { useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DisputeOverviewHeader } from "../components/dispute-overview/DisputeOverviewHeader";
import { DeadlineCard } from "../components/dispute-overview/DeadlineCard";
import { ClaimantInfoCard } from "../components/claimant-evidence/ClaimantInfoCard";
import { DemandDetailSection } from "../components/claimant-evidence/DemandDetailSection";
import { EvidenceList } from "../components/claimant-evidence/EvidenceList";
import { VideoEvidenceList } from "../components/claimant-evidence/VideoEvidenceList";
import { AudioEvidenceCard } from "../components/claimant-evidence/AudioEvidenceCard";
import { PaginationDots } from "../components/dispute-overview/PaginationDots";
import styles from "./ClaimantEvidence.module.css";

export const ClaimantEvidence: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const handleBack = () => {
    navigate("/dispute-overview");
  };

  // Mínima distancia para considerar un swipe (50px)
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
    
    // Solo prevenir scroll si el movimiento es principalmente horizontal
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

    // Solo considerar swipe horizontal si el movimiento horizontal es mayor que el vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe izquierda (deslizar hacia la izquierda = navegar a la derecha)
        // TODO: Navegar a evidencias del demandado cuando esté implementado
      } else {
        // Swipe derecha (deslizar hacia la derecha = navegar a la izquierda/atrás)
        navigate("/dispute-overview");
      }
    }

    startX.current = null;
    startY.current = null;
    isDragging.current = false;
  }, [navigate]);

  // Mouse events para desarrollo en desktop
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    isDragging.current = true;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !startX.current) return;
    
    const endX = e.clientX;
    const endY = e.clientY;
    const deltaX = startX.current - endX;
    const deltaY = startY.current - endY;

    // Solo considerar swipe horizontal si el movimiento horizontal es mayor que el vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe izquierda (deslizar hacia la izquierda = navegar a la derecha)
        // TODO: Navegar a evidencias del demandado cuando esté implementado
      } else {
        // Swipe derecha (deslizar hacia la derecha = navegar a la izquierda/atrás)
        navigate("/dispute-overview");
      }
    }

    startX.current = null;
    startY.current = null;
    isDragging.current = false;
  }, [navigate]);

  // Limpiar cuando el componente se desmonte
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

  // Mock data - en producción vendría del contrato
  const claimantData = {
    name: "Julio Banegas",
    role: "Demandante",
    avatar: "/images/profiles-mockup/profile-1.png",
  };

  const demandDetail =
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.";

  const imageEvidenceList = [
    {
      id: "1",
      type: "image" as const,
      url: "https://via.placeholder.com/300x200?text=Evidence+1",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesing industry. Lorem Ipsum has been the industry's standard dummy text ever since the",
      uploadDate: "10/08/2026",
    },
    {
      id: "2",
      type: "image" as const,
      url: "https://via.placeholder.com/300x200?text=Evidence+2",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesing industry. Lorem Ipsum has been the industry's standard dummy text ever since the",
      uploadDate: "11/08/2026",
    },
    {
      id: "3",
      type: "image" as const,
      url: "https://via.placeholder.com/300x200?text=Evidence+3",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesing industry. Lorem Ipsum has been the industry's standard dummy text ever since the",
      uploadDate: "12/08/2026",
    },
  ];

  const videoEvidenceList = [
    {
      id: "v1",
      type: "video" as const,
      url: "https://example.com/video1.mp4",
      thumbnail: "https://via.placeholder.com/300x200?text=Video+1",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesing industry. Lorem Ipsum has been the industry's standard dummy text ever since the",
      uploadDate: "10/08/2026",
    },
  ];

  const audioEvidence = {
    id: "a1",
    title: "Audio del demandate",
    duration: "1:45min",
    progress: 43, // 43% de progreso
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
        <ClaimantInfoCard claimant={claimantData} />
        <DemandDetailSection detail={demandDetail} />
        <EvidenceList evidenceList={imageEvidenceList} />
        <VideoEvidenceList evidenceList={videoEvidenceList} />
        <AudioEvidenceCard audio={audioEvidence} />
      </div>
      <PaginationDots currentIndex={1} total={4} />
    </div>
  );
};

export default ClaimantEvidence;

