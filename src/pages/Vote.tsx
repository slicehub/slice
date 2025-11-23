import React, { useRef, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DisputeOverviewHeader } from "../components/dispute-overview/DisputeOverviewHeader";
import { TimerCard } from "../components/dispute-overview/TimerCard";
import { PaginationDots } from "../components/dispute-overview/PaginationDots";
import { SuccessAnimation } from "../components/SuccessAnimation";
import { useWallet } from "../hooks/useWallet";
import { votingService } from "../services/VotingService";
import { generateIdentitySecret, generateSalt, calculateNullifier, bytesToHex } from "../util/votingUtils";
import styles from "./Vote.module.css";

export const Vote: React.FC = () => {
  const navigate = useNavigate();
  const { address, signTransaction } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Mock proposal ID - in production would come from context or props
  const proposalId = 1;

  const handleBack = () => {
    void navigate("/defendant-evidence");
  };

  const handleVoteSelect = (vote: number) => {
    setSelectedVote(vote);
    setMessage(null);
  };

  const handleSubmitVote = async () => {
    if (!address || !signTransaction) {
      setMessage({ type: "error", text: "Please connect your wallet" });
      return;
    }

    if (selectedVote === null) {
      setMessage({ type: "error", text: "Please select an option" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const identitySecret = generateIdentitySecret();
      const salt = generateSalt();

      // Calculate nullifier
      const nullifierBytes = calculateNullifier(identitySecret, salt, proposalId);
      const nullifier = `0x${bytesToHex(nullifierBytes)}`;

      // Store in localStorage for later reveal
      const key = `vote_${address}_${proposalId}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          identitySecret: identitySecret.toString(),
          salt: salt.toString(),
          proposalId,
          nullifier,
          vote: selectedVote,
        })
      );

      const walletSignTransaction = async (xdr: string) => {
        const signed = await signTransaction(xdr);
        return {
          signedTxXdr: signed.signedTxXdr,
          signerAddress: signed.signerAddress ?? address,
        };
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await votingService.vote(
        address,
        proposalId,
        selectedVote,
        identitySecret,
        salt,
        walletSignTransaction
      );

      // Update stored data with result
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        data.nullifier = result.nullifier || nullifier;
        data.vote = selectedVote;
        localStorage.setItem(key, JSON.stringify(data));
      }

      // Show success animation instead of message
      setShowSuccessAnimation(true);
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || "Error sending vote";
      console.error("Failed to vote:", error);
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
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

    // Only consider horizontal swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left (slide left = navigate right)
        // No more pages to the right, do nothing
      } else {
        // Swipe right (slide right = navigate left/back)
        void navigate("/defendant-evidence");
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
        // Swipe left (slide left = navigate right)
        // Do nothing
      } else {
        // Swipe right (slide right = navigate left/back)
        void navigate("/defendant-evidence");
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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

          <button
            className={styles.submitButton}
            onClick={() => void handleSubmitVote()}
            disabled={isSubmitting || selectedVote === null}
          >
            {isSubmitting ? "Sending..." : "Confirm vote"}
          </button>
        </div>
      </div>
      <PaginationDots currentIndex={3} total={4} />
      {showSuccessAnimation && <SuccessAnimation onComplete={handleAnimationComplete} />}
    </div>
  );
};

export default Vote;

