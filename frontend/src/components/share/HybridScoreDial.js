import React from 'react';

const HybridScoreDial = ({ prsData, style, baseStyle, containerWidth, containerHeight }) => {
  const hybridScore = prsData?.meta?.hybrid_score || 0;
  const { ringThickness = 'M', ticks = true } = style;
  
  // Ring thickness mapping
  const thicknessMap = {
    S: 12,
    M: 20,
    L: 28
  };
  
  // Dynamic sizing based on container dimensions
  const size = Math.min(containerWidth || 280, containerHeight || 280) * 0.9;
  const strokeWidth = thicknessMap[ringThickness] * (size / 280); // Scale stroke width
  const radius = (size / 2) - strokeWidth - 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (hybridScore / 100) * circumference;

  // Scale font sizes
  const scoreFontSize = size * 0.2; // Scale main score
  const labelFontSize = size * 0.04; // Scale label

  return (
    <div className="flex items-center justify-center w-full h-full" style={baseStyle}>
      <div className="relative">
        {/* SVG Ring */}
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
            stroke="url(#neonGradient)"
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
                const tickLength = isMainTick ? 15 * (size / 280) : 8 * (size / 280);
                const tickWidth = isMainTick ? 2 * (size / 280) : 1 * (size / 280);
                
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
          
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#08F0FF" />
              <stop offset="50%" stopColor="#00FF88" />
              <stop offset="100%" stopColor="#FFA42D" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Score Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div 
              className="font-bold text-white leading-none"
              style={{ fontSize: `${scoreFontSize}px` }}
            >
              {Math.round(hybridScore)}
            </div>
            <div 
              className="text-white/60 uppercase tracking-wider mt-1"
              style={{ fontSize: `${labelFontSize}px` }}
            >
              HYBRID SCORE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HybridScoreDial;