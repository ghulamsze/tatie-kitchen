import React, { useState, useEffect, useRef } from 'react';
import { DeviceInfo } from '../lib/device/detect.ts';

export interface PhoneDevFrameProps {
  device: DeviceInfo;
  children: React.ReactNode;
}

export const PhoneDevFrame: React.FC<PhoneDevFrameProps> = ({ device, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [isWideScreen, setIsWideScreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 500 : true;
  });

  const isFrameEnabled =
    !device.native &&
    device.formFactor === 'phone' &&
    isWideScreen &&
    (import.meta.env.DEV || import.meta.env.VITE_BETA_FRAME === '1');

  useEffect(() => {
    const handleResize = () => {
      const wide = window.innerWidth > 500;
      setIsWideScreen(wide);

      if (wide) {
        const availableWidth = window.innerWidth - 32;
        const availableHeight = window.innerHeight - 32;

        const scaleX = availableWidth / 390;
        const scaleY = availableHeight / 800;
        const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1);
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isFrameEnabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: '#070a0e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        className="phone-dev-frame-wrapper"
        style={{
          width: `${390 * scale}px`,
          height: `${800 * scale}px`,
          position: 'relative',
        }}
      >
        <div
          className="phone-dev-frame-inner"
          style={{
            width: '390px',
            height: '800px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            borderRadius: 'var(--r-xl)',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.15)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--scr-bg)',
            contain: 'paint',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
