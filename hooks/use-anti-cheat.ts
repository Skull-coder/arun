"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

export function useAntiCheat(maxStrikes: number = 3, onMaxStrikesReached: () => void, isActive: boolean = true) {
  const [strikes, setStrikes] = useState(0);
  const [showWarning, setShowWarningState] = useState(false);
  
  const showWarningRef = useRef(false);
  const hasTriggeredRef = useRef(false);
  const callbackRef = useRef(onMaxStrikesReached);

  useEffect(() => {
    callbackRef.current = onMaxStrikesReached;
  }, [onMaxStrikesReached]);

  const setShowWarning = (val: boolean) => {
    showWarningRef.current = val;
    setShowWarningState(val);
  };

  useEffect(() => {
    if (!isActive) return;
    
    const handleViolation = () => {
      if (hasTriggeredRef.current) return;
      if (showWarningRef.current) return; // Don't penalize while warning is already on screen
      
      showWarningRef.current = true;
      setShowWarningState(true);
      
      setStrikes(prev => {
        const newStrikes = prev + 1;
        if (newStrikes >= maxStrikes) {
          hasTriggeredRef.current = true;
          // Defer callback slightly to allow React to update state
          setTimeout(() => {
            toast.error("Anti-cheat limit exceeded. Submitting automatically.");
            callbackRef.current();
          }, 0);
        }
        return newStrikes;
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleViolation();
      }
    };

    const onBlur = () => {
      handleViolation();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [isActive, maxStrikes]);

  return { strikes, showWarning, setShowWarning };
}
