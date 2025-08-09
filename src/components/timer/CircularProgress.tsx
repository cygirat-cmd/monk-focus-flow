import React from 'react';

interface Props {
  size?: number;
  stroke?: number;
  progress: number; // 0..1
}

export const CircularProgress: React.FC<Props> = ({ size = 220, stroke = 10, progress }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * progress;
  const remaining = circumference - dash;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="animate-fade-in">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(var(--muted))"
        strokeWidth={stroke}
        fill="none"
        className="opacity-60"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(var(--primary))"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${remaining}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-200"
      />
    </svg>
  );
};
