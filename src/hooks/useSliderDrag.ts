import { useState, useEffect, useCallback, RefObject } from "react";

// Make T generic extending HTMLElement to allow specific elements like HTMLButtonElement
export function useSliderDrag<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  onComplete: () => void,
  threshold = 80,
) {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const calculateProgress = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const width = rect.width - 36; // Subtract handle width
      return Math.max(0, Math.min(100, (x / width) * 100));
    },
    [containerRef],
  );

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      const newProgress = calculateProgress(clientX);
      setProgress(newProgress);

      if (newProgress >= threshold) {
        setIsDragging(false);
        setProgress(0);
        onComplete();
      }
    },
    [isDragging, calculateProgress, onComplete, threshold],
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    if (progress < threshold) setProgress(0);
  }, [progress, threshold]);

  useEffect(() => {
    if (isDragging) {
      const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
      const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", handleEnd);

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", handleEnd);
      };
    }
  }, [isDragging, handleMove, handleEnd]);

  return {
    progress,
    isDragging,
    startDrag: () => setIsDragging(true),
  };
}
