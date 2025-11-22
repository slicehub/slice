import React, { useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DisputeOverviewHeader } from "../components/dispute-overview/DisputeOverviewHeader";
import { DeadlineCard } from "../components/dispute-overview/DeadlineCard";
import { DisputeInfoCard } from "../components/dispute-overview/DisputeInfoCard";
import { PaginationDots } from "../components/dispute-overview/PaginationDots";
import styles from "./DisputeOverview.module.css";

export const DisputeOverview: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const handleBack = () => {
    navigate("/disputes");
  };

  const handleSwipe = useCallback((direction: "left" | "right") => {
    if (direction === "right") {
      // Navegar a evidencias del demandante (pantalla 1 del carrusel)
      navigate("/claimant-evidence");
    }
  }, [navigate]);

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
        handleSwipe("right");
      }
    }

    startX.current = null;
    startY.current = null;
    isDragging.current = false;
  }, [handleSwipe]);

  // Mouse events para desarrollo en desktop
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    isDragging.current = true;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
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
        handleSwipe("right");
      }
    }

    startX.current = null;
    startY.current = null;
    isDragging.current = false;
  }, [handleSwipe]);

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
  const disputeData = {
    id: "1",
    title: "Stellar Community Fund",
    logo: "/images/icons/stellar-fund-icon.svg",
    category: "Crowdfunding",
    actors: [
      {
        name: "Julio Banegas",
        role: "Claimer",
        avatar: "/images/profiles-mockup/profile-1.png",
      },
      {
        name: "Micaela Descotte",
        role: "Defender",
        avatar: "/images/profiles-mockup/profile-2.png",
      },
    ],
    generalContext:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
    creationDate: "14/08/2026",
    deadline: "19/08/2026",
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
      <DisputeInfoCard dispute={disputeData} />
      <PaginationDots currentIndex={0} total={4} />
    </div>
  );
};

export default DisputeOverview;

