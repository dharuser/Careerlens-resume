'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  score: number;
}

export function ScoreCircle({ score }: Props) {
  const [displayScore, setDisplayScore] = useState(0);
  const safeScore = score ?? 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.ceil(safeScore / 60));
    const interval = setInterval(() => {
      current += step;
      if (current >= safeScore) {
        setDisplayScore(safeScore);
        clearInterval(interval);
      } else {
        setDisplayScore(current);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [safeScore]);

  const getColor = () => {
    if (safeScore >= 80) return '#10B981';
    if (safeScore >= 60) return '#3B82F6';
    if (safeScore >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="10"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold" style={{ color: getColor() }}>
          {displayScore}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
