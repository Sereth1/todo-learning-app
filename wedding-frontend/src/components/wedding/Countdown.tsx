"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// Custom hook for hydration-safe mounting
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

interface CountdownProps {
  targetDate: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown({ targetDate, className }: CountdownProps) {
  const hydrated = useHydrated();
  
  const calculateTimeLeft = useCallback(() => {
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (!hydrated) {
    return (
      <div className={cn("flex gap-3 md:gap-6 justify-center", className)}>
        {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
          <div key={label} className="flex flex-col items-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-3 md:p-6 min-w-[70px] md:min-w-[100px] border border-primary/10">
              <span className="text-3xl md:text-5xl font-light text-primary tabular-nums">
                --
              </span>
            </div>
            <span className="text-xs md:text-sm text-muted-foreground mt-2 uppercase tracking-wider">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const timeUnits = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className={cn("flex gap-3 md:gap-6 justify-center", className)}>
      {timeUnits.map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-3 md:p-6 min-w-[70px] md:min-w-[100px] border border-primary/10">
            <span className="text-3xl md:text-5xl font-light text-primary tabular-nums">
              {unit.value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs md:text-sm text-muted-foreground mt-2 uppercase tracking-wider">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
