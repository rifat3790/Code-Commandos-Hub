'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = '' }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isThreeDEnabled, setIsThreeDEnabled] = useState(true);

  // Sync with user preference
  useEffect(() => {
    const checkPreference = () => {
      const mode = localStorage.getItem('3d_mode') !== 'false';
      setIsThreeDEnabled(mode);
    };
    checkPreference();
    
    // Add custom listener for 3d mode toggling
    window.addEventListener('3d_mode_changed', checkPreference);
    return () => window.removeEventListener('3d_mode_changed', checkPreference);
  }, []);

  // Motion values for tilt
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Spring animations for rotation (smooths out the movements)
  const rotateX = useSpring(useTransform(y, [0, 1], [10, -10]), { stiffness: 250, damping: 25 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-10, 10]), { stiffness: 250, damping: 25 });

  // Glare effect values
  const glareX = useTransform(x, [0, 1], [0, 100]);
  const glareY = useTransform(y, [0, 1], [0, 100]);
  const glareOpacity = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });

  // Glare background transformation
  const glareBg = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.4) 0%, transparent 60%)`
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isThreeDEnabled || !cardRef.current) return;

    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    
    // Relative coordinates (0 to 1)
    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;

    x.set(relX);
    y.set(relY);
    glareOpacity.set(0.12);
  };

  const handleMouseEnter = () => {
    if (!isThreeDEnabled) return;
    glareOpacity.set(0.12);
  };

  const handleMouseLeave = () => {
    // Reset to center
    x.set(0.5);
    y.set(0.5);
    glareOpacity.set(0);
  };

  if (!isThreeDEnabled) {
    return (
      <motion.div
        whileHover={{ scale: 1.015 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative will-change-transform ${className}`}
    >
      {/* Glare effect overlay */}
      <motion.div
        style={{
          background: glareBg,
          opacity: glareOpacity,
        }}
        className="absolute inset-0 pointer-events-none rounded-inherit z-30 mix-blend-overlay"
      />
      {children}
    </motion.div>
  );
}
