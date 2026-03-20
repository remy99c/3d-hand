import React, { useState, useEffect } from 'react';

interface TextPair {
  header: string;
  subtext: string;
}

interface CyclingTextProps {
  pairs: TextPair[];
  interval?: number;
}

export const CyclingText: React.FC<CyclingTextProps> = ({ pairs, interval = 3000 }) => {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % pairs.length);
        setIsAnimating(false);
      }, 500); // Wait for fade out/roll out animation
    }, interval);

    return () => clearInterval(timer);
  }, [pairs.length, interval]);

  const currentPair = pairs[index];

  return (
    <div className="cycling-text-container">
      <h1 className={`cycling-header ${isAnimating ? 'exit' : 'enter'}`}>
        {currentPair.header}
      </h1>
      <p className={`cycling-subtext ${isAnimating ? 'exit' : 'enter'}`}>
        {currentPair.subtext}
      </p>
    </div>
  );
};
