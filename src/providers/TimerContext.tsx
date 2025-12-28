"use client";
import React, { createContext, use, useState, useEffect, useRef } from "react";

interface TimerContextType {
  timeInSeconds: number;
  isRunning: boolean;
  startTimer: (initialSeconds: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = use(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
};

interface TimerProviderProps {
  children: React.ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [timeInSeconds, setTimeInSeconds] = useState(10 * 60); // 10 minutos por defecto
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Inicializar el timer solo una vez
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      startTimeRef.current = Date.now();
    }

    if (isRunning && timeInSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimeInSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeInSeconds]);

  const startTimer = (initialSeconds: number) => {
    setTimeInSeconds(initialSeconds);
    setIsRunning(true);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (startTimeRef.current) {
      pausedTimeRef.current = timeInSeconds;
    }
  };

  const resumeTimer = () => {
    setIsRunning(true);
    startTimeRef.current = Date.now();
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeInSeconds(10 * 60);
    pausedTimeRef.current = 0;
    startTimeRef.current = null;
  };

  const value = {
    timeInSeconds,
    isRunning,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  };

  return <TimerContext value={value}>{children}</TimerContext>;
};
