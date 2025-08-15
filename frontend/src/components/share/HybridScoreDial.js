import React from 'react';

const HybridScoreDial = ({ prsData, style, baseStyle }) => {
  const hybridScore = prsData?.meta?.hybrid_score || 0;
  const { ringThickness = 'M', ticks = true } = style;
  
  // Ring thickness mapping - Fixed sizes for optimal quality
  const thicknessMap = {
    S: 12,
    M: 20,
    L: 28
  };
  
  // Fixed optimal dimensions (280x280) - will be scaled via CSS transform
  const size = 280;
  const strokeWidth = thicknessMap[ringThickness];
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (hybridScore / 100) * circumference;

  return (
    <div className="flex items-center justify-center w-full h-full" style={baseStyle}>
      <div className="relative">
        {/* SVG Ring - Fixed optimal size */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#08F0FF"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Tick Marks */}
          {ticks && (
            <g>
              {Array.from({ length: 20 }, (_, i) => {
                const angle = (i * 18) - 90; // 20 ticks, starting from top
                const isMainTick = i % 5 === 0; // Every 5th tick is longer
                const tickLength = isMainTick ? 15 : 8;
                const tickWidth = isMainTick ? 2 : 1;
                
                const x1 = (size / 2) + (radius + 5) * Math.cos(angle * Math.PI / 180);
                const y1 = (size / 2) + (radius + 5) * Math.sin(angle * Math.PI / 180);
                const x2 = (size / 2) + (radius + 5 + tickLength) * Math.cos(angle * Math.PI / 180);
                const y2 = (size / 2) + (radius + 5 + tickLength) * Math.sin(angle * Math.PI / 180);
                
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(8,240,255,0.6)"
                    strokeWidth={tickWidth}
                  />
                );
              })}
            </g>
          )}
        </svg>
        
        {/* Score Text - Fixed optimal font sizes */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-white leading-none">
              {Math.round(hybridScore)}
            </div>
            <div className="text-sm text-white/60 uppercase tracking-wider mt-1">
              HYBRID SCORE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HybridScoreDial;