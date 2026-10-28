import React, { useState, useEffect } from 'react';
import {
  BETA_DYNAMIC_BG,
  BgMotionMode,
  getStoredBgMotion,
  subscribeBgMotion,
} from './dynamicBgState.ts';
import './dynamicBg.css';

export interface DynamicBackgroundProps {
  className?: string;
  style?: React.CSSProperties;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  className = '',
  style,
}) => {
  const [motionMode, setMotionMode] = useState<BgMotionMode>(getStoredBgMotion);

  useEffect(() => {
    if (!BETA_DYNAMIC_BG) return undefined;
    return subscribeBgMotion(setMotionMode);
  }, []);

  // When Beta dynamic background is off or mode is 'static', render the exact original static bubbles
  if (!BETA_DYNAMIC_BG || motionMode === 'static') {
    return (
      <div
        className={`tk-global-bg-bubbles ${className}`}
        style={{
          position: 'absolute',
          inset: '-12%',
          background: `
            radial-gradient(circle at calc(14% + var(--bg-t, 0) * 18%) calc(10% + var(--bg-t, 0) * 8%), var(--b1) 0, transparent 26%),
            radial-gradient(ellipse at calc(55% - var(--bg-t, 0) * 12%) calc(92% - var(--bg-t, 0) * 6%), var(--b2) 0, transparent 55%),
            radial-gradient(ellipse at calc(95% - var(--bg-t, 0) * 16%) calc(78% - var(--bg-t, 0) * 12%), var(--b3) 0, transparent 42%)
          `,
          filter: 'blur(26px)',
          pointerEvents: 'none',
          transition: 'background 0.3s ease',
          ...style,
        }}
      />
    );
  }

  // Google Stitch high-contrast fluid mesh / aurora motion
  return (
    <div
      className={`tk-stitch-motion-container ${className}`}
      style={style}
      aria-hidden="true"
    >
      <div className="tk-stitch-base-ambient tk-stitch-orb-2" />
      <div className="tk-stitch-ribbon-primary tk-stitch-orb-1" />
      <div className="tk-stitch-ribbon-complementary tk-stitch-orb-3" />
      <div className="tk-stitch-orb-core tk-stitch-orb-4" />
      <div className="tk-stitch-noise" />
    </div>
  );
};
