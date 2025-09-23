'use client';

import { useState, useEffect } from 'react';

interface FlipDotProps {
  isActive: boolean;
  delay?: number;
  onFlip?: () => void;
}

export default function FlipDot({ isActive, delay = 0, onFlip }: FlipDotProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentState, setCurrentState] = useState(isActive);

  useEffect(() => {
    if (currentState !== isActive) {
      setTimeout(() => {
        setIsFlipping(true);
        // Trigger sound when flip starts
        if (onFlip) {
          onFlip();
        }
        setTimeout(() => {
          setCurrentState(isActive);
          setTimeout(() => {
            setIsFlipping(false);
          }, 150);
        }, 150);
      }, delay);
    }
  }, [isActive, currentState, delay, onFlip]);

  return (
    <div className="relative w-[7px] h-[7px] sm:w-[8px] sm:h-[8px] md:w-[10px] md:h-[10px] lg:w-[12px] lg:h-[12px]">
      <div
        className={`
          absolute inset-0 rounded-full transition-all duration-300
          ${isFlipping ? 'animate-flip-dot' : ''}
        `}
        style={{
          background: currentState
            ? 'radial-gradient(circle at 30% 30%, #fde047, #facc15, #eab308)'
            : 'radial-gradient(circle at 30% 30%, #374151, #1f2937, #111827)',
          boxShadow: currentState
            ? '0 0 10px rgba(250,204,21,0.8), inset -1px -1px 2px rgba(0,0,0,0.3)'
            : 'inset 0 1px 2px rgba(0,0,0,0.8), inset 0 -1px 2px rgba(255,255,255,0.1)',
          transform: `rotateY(${isFlipping ? 180 : 0}deg)`,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden'
        }}
      />
      {isFlipping && (
        <div
          className="absolute inset-0 rounded-full animate-flip-edge"
          style={{
            background: 'linear-gradient(90deg, #6b7280, #9ca3af, #6b7280)',
            transform: 'rotateY(90deg) scaleX(0.1)',
          }}
        />
      )}
    </div>
  );
}