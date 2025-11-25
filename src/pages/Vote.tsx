import React, { useRef, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DisputeOverviewHeader } from "../components/dispute-overview/DisputeOverviewHeader";
import { TimerCard } from "../components/dispute-overview/TimerCard";
import { PaginationDots } from "../components/dispute-overview/PaginationDots";
import { SuccessAnimation } from "../components/SuccessAnimation";
import { useWallet } from "../hooks/useWallet";
import { useSliceVoting } from "../hooks/useSliceVoting";
import { useGetDispute } from "../hooks/useGetDispute";
import styles from "./Vote.module.css";

export const Vote: React.FC = () => {
  const navigate = useNavigate();
  const { address } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // 1. Get Dispute ID from URL
  const { id } = useParams<{ id: string }>();
  const disputeId = id || "1";

  // 1. Fetch Dispute State
  const { dispute, refetch } = useGetDispute(disputeId);
  const { commitVote, revealVote, isProcessing, logs } = useSliceVoting();

  const handleBack = () => {
    void navigate(`/defendant-evidence/${disputeId}`);
  };

  const handleVoteSelect = (vote: number) => {
    setSelectedVote(vote);
    setMessage(null);
  };

  const handleCommit = async () => {
    if (selectedVote === null) return;
    const success = await commitVote(disputeId, selectedVote);
    if (success) {
        await refetch(); // Refresh dispute status
        setMessage({ type: "success", text: "Vote committed. Waiting for Reveal Phase." });
    }
  };

  const handleReveal = async () => {
    const success = await revealVote(disputeId);
    if (success) setShowSuccessAnimation(true);
  };

  // Check if local storage has a vote for this dispute
  const hasCommittedLocally = localStorage.getItem(`slice_vote_${disputeId}_${address}`);

  // Determine what to show based on Contract Status (0=Created, 1=Commit, 2=Reveal)
  const isRevealPhase = dispute?.status === 2;

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

    // Solo prevenir scroll si el movimiento es principalmente horizontal
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !startX.current || startY.current === null) return;

    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const deltaX = startX.current - endX;
    const deltaY = startY.current - endY;

    // Only consider horizontal swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left (slide left = navigate right)
        // No more pages to the right, do nothing
      } else {
        // Swipe right (slide right = navigate left/back)
        void navigate(`/defendant-evidence/${disputeId}`);
      }
    }

    startX.current = null;
    startY.current = null;
    isDragging.current = false;
  }, [navigate, disputeId]);

  // Mouse events for desktop development
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    isDragging.current = true;
  }, []);

  const onMouseMove = useCallback(() => {
    if (!isDragging.current || startX.current === null || startY.current === null) return;
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !startX.current || startY.current === null) return;

    const endX = e.clientX;
    const endY = e.clientY;
    const deltaX = startX.current - endX;
    const deltaY = startY.current - endY;

    // Only consider horizontal swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left (slide left = navigate right)
        // Do nothing
      } else {
        // Swipe right (slide right = navigate left/back)
        void navigate(`/defendant-evidence/${disputeId}`);
      }
    }

    startX.current = null;
    startY.current = null;
    isDragging.current = false;
  }, [navigate, disputeId]);

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

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    void navigate("/");
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
      <TimerCard />
      <div className={styles.scrollableContent}>
        <div className={styles.voteSection}>
          <h2 className={styles.title}>Vote</h2>
          <div className={styles.optionsContainer}>
            <button
              className={`${styles.voteOption} ${selectedVote === 1 ? styles.selected : ""}`}
              onClick={() => handleVoteSelect(1)}
              disabled={isProcessing || isRevealPhase}
            >
              <div className={styles.optionContent}>
                <div className={styles.optionHeader}>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionRole}>Claimant</span>
                    <span className={styles.optionName}>Julio Banegas</span>
                  </div>
                  <span className={styles.optionBadge}>1</span>
                </div>
              </div>
            </button>

            <button
              className={`${styles.voteOption} ${selectedVote === 0 ? styles.selected : ""}`}
              onClick={() => handleVoteSelect(0)}
              disabled={isProcessing || isRevealPhase}
            >
              <div className={styles.optionContent}>
                <div className={styles.optionHeader}>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionRole}>Defendant</span>
                    <span className={styles.optionName}>Micaela Descotte</span>
                  </div>
                  <span className={styles.optionBadge}>0</span>
                </div>
              </div>
            </button>
          </div>

          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          {/* Display Logs (ZK proof generation takes time) */}
          {isProcessing && (
            <div style={{ padding: "10px", background: "#f3f4f6", fontSize: "10px", marginBottom: "10px", whiteSpace: "pre-wrap" }}>
              {logs || "Initializing..."}
            </div>
          )}

          {isRevealPhase ? (
             /* REVEAL BUTTON */
             <button
               className={styles.submitButton}
               onClick={() => void handleReveal()}
               disabled={isProcessing || !hasCommittedLocally}
             >
               {isProcessing ? "Revealing..." : "Reveal My Vote"}
             </button>
          ) : (
             /* COMMIT BUTTON */
             <button
               className={styles.submitButton}
               onClick={() => void handleCommit()}
               disabled={isProcessing || selectedVote === null}
             >
               {isProcessing ? "Committing..." : "Commit Vote"}
             </button>
          )}
        </div>
      </div>
      <PaginationDots currentIndex={3} total={4} />
      {showSuccessAnimation && <SuccessAnimation onComplete={handleAnimationComplete} />}
    </div>
  );
};

export default Vote;
