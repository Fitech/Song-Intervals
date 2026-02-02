import React from 'react';

interface IntensityDisplayProps {
  intensity: number;
}

export const IntensityDisplay: React.FC<IntensityDisplayProps> = ({ intensity }) => {
  // Calculate height percentage based on intensity (0-10)
  // 0 -> 5%, 10 -> 100%
  const heightPercentage = Math.max(5, intensity * 10);

  // Determine color based on intensity
  const getColor = (level: number) => {
    if (level <= 3) return 'from-blue-400 to-green-400';
    if (level <= 7) return 'from-yellow-400 to-orange-500';
    return 'from-red-500 to-purple-600';
  };

  const getShadowColor = (level: number) => {
    if (level <= 3) return 'rgba(59, 130, 246, 0.5)';
    if (level <= 7) return 'rgba(234, 179, 8, 0.5)';
    return 'rgba(239, 68, 68, 0.5)';
  };

  return (
    <div className="absolute inset-0 flex items-end pointer-events-none z-30">
      <div
        className={`w-1/3 transition-all duration-300 ease-out rounded-t-3xl bg-gradient-to-t left-layout-offset ${getColor(intensity)}`}
        style={{
          height: `${heightPercentage}%`,
          boxShadow: `0 0 50px ${getShadowColor(intensity)}`,
          opacity: 0.8
        }}
      >
        <div className="w-full h-full flex items-start justify-center pt-4">
          <span className="text-white font-bold text-6xl drop-shadow-md">
            {intensity > 0 ? intensity : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
