import React, { useState, useEffect, useRef } from 'react';
import { DeviceInfo } from '../lib/device/detect.ts';

export interface PhoneDevFrameProps {
  device: DeviceInfo;
  children: React.ReactNode;
}

export const PhoneDevFrame: React.FC<PhoneDevFrameProps> = ({ device, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isIos = device.platform === 'ios';
  const phoneWidth = isIos ? 393 : 390;
  const phoneHeight = isIos ? 852 : 800;

  const [scale, setScale] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const availableWidth = window.innerWidth - 32;
    const availableHeight = window.innerHeight - 48;
    const sX = availableWidth / (device.platform === 'ios' ? 393 : 390);
    const sY = availableHeight / (device.platform === 'ios' ? 852 : 800);
    return Math.min(Math.max(Math.min(sX, sY), 0.25), 1);
  });
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
        const availableHeight = window.innerHeight - 48;

        const scaleX = availableWidth / phoneWidth;
        const scaleY = availableHeight / phoneHeight;
        const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1);
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [phoneWidth, phoneHeight]);

  if (!isFrameEnabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100dvh',
        maxHeight: '100dvh',
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
          width: `${phoneWidth * scale}px`,
          height: `${phoneHeight * scale}px`,
          position: 'relative',
          margin: 'auto',
          flexShrink: 0,
        }}
      >
        <div
          className="phone-dev-frame-inner"
          style={{
            width: `${phoneWidth}px`,
            height: `${phoneHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            borderRadius: isIos ? '50px' : 'var(--r-xl)',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.15)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--scr-bg)',
            contain: 'paint',
          }}
        >
          {/* iOS Dynamic Island */}
          {isIos && (
            <div
              style={{
                position: 'absolute',
                top: '11px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '124px',
                height: '35px',
                borderRadius: '20px',
                background: '#000000',
                zIndex: 999,
                pointerEvents: 'none',
                boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.08)',
              }}
            />
          )}

          {/* iOS Home Indicator Bar */}
          {isIos && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '136px',
                height: '5px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.4)',
                zIndex: 999,
                pointerEvents: 'none',
              }}
            />
          )}

          <div
            style={{
              width: '100%',
              height: '100%',
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
