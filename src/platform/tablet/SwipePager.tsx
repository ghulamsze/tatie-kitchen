import React from 'react';

export interface SwipePagerProps {
  trackRef?: React.Ref<HTMLDivElement>;
  progress: number;
  isDragging: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  children: React.ReactNode[];
}

export const SwipePager: React.FC<SwipePagerProps> = ({
  trackRef,
  progress,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  children,
}) => {
  return (
    <div
      className="tk-swipe-pager-container"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      tabIndex={-1}
      aria-label="Swipeable tab pages"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'pan-y',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      <div
        ref={trackRef}
        className="tk-swipe-pager-track"
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          transform: `translate3d(calc(-${progress} * 100%), 0, 0)`,
          transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)',
          willChange: 'transform',
        }}
      >
        {React.Children.map(children, (child, index) => (
          <section
            key={index}
            className="tk-swipe-page"
            style={{
              flex: '0 0 100%',
              width: '100%',
              height: '100%',
              overflowY: 'hidden',
              boxSizing: 'border-box',
              position: 'relative',
              contain: 'layout style paint',
            }}
          >
            {child}
          </section>
        ))}
      </div>
    </div>
  );
};
