import React from 'react';

export interface SwipePagerProps {
  pagerRef: React.Ref<HTMLDivElement>;
  onScroll: () => void;
  children: React.ReactNode[];
}

export const SwipePager: React.FC<SwipePagerProps> = ({
  pagerRef,
  onScroll,
  children,
}) => {
  return (
    <div
      ref={pagerRef}
      className="tk-swipe-pager"
      onScroll={onScroll}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
        overscrollBehaviorX: 'contain',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
      tabIndex={-1}
      aria-label="Swipeable tab pages"
    >
      {React.Children.map(children, (child, index) => (
        <section
          key={index}
          className="tk-swipe-page"
          style={{
            flex: '0 0 100%',
            width: '100%',
            height: '100%',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
            overflowY: 'hidden',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {child}
        </section>
      ))}
    </div>
  );
};
