'use client';

import React, { useEffect, useState, useId } from 'react';

interface CoachAvatarMarkProps {
  size?: number;
  isThinking?: boolean;
  interactive?: boolean;
  eyeOffset?: { x: number; y: number };
  className?: string;
}

/**
 * Lightweight, scalable SVG mark for the SKILLEZO AI Career Coach.
 * Supports subtle idle blinking, pointer-tracked gaze, and streaming pulse.
 */
export const CoachAvatarMark: React.FC<CoachAvatarMarkProps> = ({
  size = 28,
  isThinking = false,
  interactive = false,
  eyeOffset = { x: 0, y: 0 },
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (!interactive) return;

    let blinkTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = setTimeout(() => setIsBlinking(false), 140);
    }, 4200);

    return () => {
      clearInterval(interval);
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, [interactive]);

  const gradId = `coach-grad-${uid}`;
  const visorId = `coach-visor-${uid}`;
  const eyeScaleY = isBlinking ? 0.15 : 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="6" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D9C0" />
          <stop offset="55%" stopColor="#3D5AFE" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={visorId} x1="8" y1="14" x2="32" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#08102E" />
          <stop offset="100%" stopColor="#05091B" />
        </linearGradient>
      </defs>

      {/* Neural Spark Antenna */}
      <path
        d="M20 7.5V11"
        stroke={`url(#${gradId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle
        cx="20"
        cy="5.5"
        r={isThinking ? 2.6 : 2.1}
        fill="#00D9C0"
        className={isThinking ? 'animate-pulse' : ''}
      />

      {/* Side Audio Nodes */}
      <rect x="4.5" y="18" width="2.5" height="8" rx="1.25" fill="#3D5AFE" opacity="0.85" />
      <rect x="33" y="18" width="2.5" height="8" rx="1.25" fill="#00D9C0" opacity="0.85" />

      {/* Outer Bot Head Shell */}
      <rect
        x="7"
        y="11"
        width="26"
        height="22"
        rx="8.5"
        fill="#121C4D"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
      />

      {/* Inner Dark Glass Visor */}
      <rect
        x="10.5"
        y="15"
        width="19"
        height="13.5"
        rx="5"
        fill={`url(#${visorId})`}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />

      {/* Expressive Cyan LED Eyes with Pointer Tracking & Idle Blink */}
      <g
        style={{
          transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
          transition: 'transform 120ms ease-out',
        }}
      >
        <rect
          x="14"
          y="19"
          width="3.4"
          height="5.4"
          rx="1.7"
          fill="#00D9C0"
          style={{
            transformOrigin: '15.7px 21.7px',
            transform: `scaleY(${eyeScaleY})`,
            transition: 'transform 90ms ease-in-out',
          }}
        />
        <rect
          x="22.6"
          y="19"
          width="3.4"
          height="5.4"
          rx="1.7"
          fill="#00D9C0"
          style={{
            transformOrigin: '24.3px 21.7px',
            transform: `scaleY(${eyeScaleY})`,
            transition: 'transform 90ms ease-in-out',
          }}
        />
      </g>

      {/* Subtle Visor Specular Glint */}
      <path
        d="M12.5 17C14.5 16 17.5 16 19.5 16.3"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
};
