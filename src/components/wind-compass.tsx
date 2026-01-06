
'use client';

import React from 'react';

const directions: { [key: string]: number } = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

const compassPoints = [
  { label: 'N', angle: 0 },
  { label: 'NE', angle: 45 },
  { label: 'E', angle: 90 },
  { label: 'SE', angle: 135 },
  { label: 'S', angle: 180 },
  { label: 'SW', angle: 225 },
  { label: 'W', angle: 270 },
  { label: 'NW', angle: 315 },
];

interface WindCompassProps {
  speed: number;
  unit: string;
  direction: string;
}

export function WindCompass({ speed, unit, direction }: WindCompassProps) {
  const rotation = directions[direction.toUpperCase()] || 0;
  const size = 120;
  const center = size / 2;
  const radius = size / 2 - 10;
  const strokeWidth = 8;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {compassPoints.map(({ label, angle }) => {
          const x = center + radius * Math.sin((angle * Math.PI) / 180);
          const y = center - radius * Math.cos((angle * Math.PI) / 180);
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill={label === 'N' ? '#ef4444' : 'hsl(var(--muted-foreground))'}
              fontWeight={label === 'N' ? 'bold' : 'normal'}
            >
              {label}
            </text>
          );
        })}
        
        {/* Arrow pointing in the direction wind is coming from */}
        <g transform={`rotate(${rotation}, ${center}, ${center})`}>
          <polygon
            points={`${center},${center - radius + 12} ${center - 5},${center - radius + 22} ${center + 5},${center - radius + 22}`}
            fill="hsl(var(--foreground))"
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold">{speed}</div>
        <div className="text-sm text-muted-foreground">{unit}</div>
      </div>
    </div>
  );
}
