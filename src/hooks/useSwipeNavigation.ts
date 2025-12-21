import { useRef, useCallback, useEffect } from "react";


interface SwipeConfig {
    onSwipeLeft?: () => void;  // Navigate to next
    onSwipeRight?: () => void; // Navigate to prev
    minDistance?: number;
}

export function useSwipeNavigation({ onSwipeLeft, onSwipeRight, minDistance = 50 }: SwipeConfig) {
    const startX = useRef<number | null>(null);
    const startY = useRef<number | null>(null);
    const isDragging = useRef(false);

    // --- Touch Events ---
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

        // Prevent scroll only if horizontal movement dominates
        if (deltaX > deltaY && deltaX > 10) {
            e.preventDefault();
        }
    }, []);

    const handleEnd = useCallback((endX: number, endY: number) => {
        if (!startX.current || startY.current === null) return;

        const deltaX = startX.current - endX;
        const deltaY = startY.current - endY;

        // Horizontal swipe check
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minDistance) {
            if (deltaX > 0 && onSwipeLeft) {
                onSwipeLeft();
            } else if (deltaX < 0 && onSwipeRight) {
                onSwipeRight();
            }
        }

        startX.current = null;
        startY.current = null;
        isDragging.current = false;
    }, [minDistance, onSwipeLeft, onSwipeRight]);

    const onTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!isDragging.current) return;
        const touch = e.changedTouches[0];
        handleEnd(touch.clientX, touch.clientY);
    }, [handleEnd]);

    // --- Mouse Events (for dev/desktop) ---
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        startX.current = e.clientX;
        startY.current = e.clientY;
        isDragging.current = true;
    }, []);

    const onMouseMove = useCallback((_e: React.MouseEvent) => {
        if (!isDragging.current) return;
        // Optional: add visual drag feedback here
    }, []);

    const onMouseUp = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current) return;
        handleEnd(e.clientX, e.clientY);
    }, [handleEnd]);

    // Global cleanup
    useEffect(() => {
        const handleGlobalUp = () => { isDragging.current = false; };
        window.addEventListener("mouseup", handleGlobalUp);
        return () => window.removeEventListener("mouseup", handleGlobalUp);
    }, []);

    return {
        handlers: {
            onTouchStart,
            onTouchMove,
            onTouchEnd,
            onMouseDown,
            onMouseMove,
            onMouseUp,
            onMouseLeave: onMouseUp
        }
    };
}
