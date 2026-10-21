import React, { useEffect } from 'react';

export interface IntroScreenProps {
  onFinish: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const isReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Durasi intro: ~1,25s (1250ms), atau 0,7s (700ms) pada reduced motion
    const timer = setTimeout(
      () => {
        onFinish();
      },
      isReduced ? 700 : 1250
    );

    return () => clearTimeout(timer);
  }, [onFinish]);

  const renderWord = (word: string, startIndex: number) => {
    return [...word].map((char, idx) => (
      <span
        key={idx}
        className="tk-intro-letter"
        aria-hidden="true"
        style={{ '--i': startIndex + idx } as React.CSSProperties}
      >
        {char}
      </span>
    ));
  };

  return (
    <div
      className="scr tk-intro-container"
      onClick={onFinish}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onFinish();
      }}
      aria-label="Intro Tati’e Kitchen, ketuk untuk melanjutkan"
    >
      <div className="tk-intro-wordmark" role="img" aria-label="Tati’e Kitchen">
        {renderWord('Tati’e', 0)}
        <span className="tk-intro-space" />
        {renderWord('Kitchen', 6)}
      </div>
      <p className="tk-intro-replay-hint">Ketuk untuk melanjutkan</p>
    </div>
  );
};
