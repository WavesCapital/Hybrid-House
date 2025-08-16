import React from 'react';

const HybridScoreDial2 = ({ prsData, style, baseStyle }) => {
  const hybridScore = prsData?.meta?.hybrid_score || 85;
  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const progress = Math.min(Math.max(hybridScore / 100, 0), 1);
  const strokeDashoffset = circumference - (progress * circumference);

  // Create segments for the futuristic look
  const segments = 40;
  const segmentLength = circumference / segments;
  const gapLength = segmentLength * 0.1; // 10% gap between segments

  return (
    <div 
      className="w-full h-full flex items-center justify-center p-4"
      style={{
        ...baseStyle,
      }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(8,240,255,0.3))'
          }}
        >
          {/* Outer glow ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + 6}
            stroke="rgba(8,240,255,0.08)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />

          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(8,240,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Main progress ring with segments */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#08F0FF"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${segmentLength - gapLength} ${gapLength}`}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(8,240,255,0.6))'
            }}
          />

          {/* Inner glow ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - 12}
            stroke="rgba(8,240,255,0.15)"
            strokeWidth="1"
            fill="none"
            className="animate-pulse"
          />

          {/* Progress indicators - small dots along the path */}
          {Array.from({ length: Math.floor(segments * progress) }).map((_, i) => {
            const angle = (i / segments) * 2 * Math.PI - Math.PI / 2;
            const x = size / 2 + (radius - 6) * Math.cos(angle);
            const y = size / 2 + (radius - 6) * Math.sin(angle);
            
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="1"
                fill="#08F0FF"
                style={{
                  filter: 'drop-shadow(0 0 2px rgba(8,240,255,0.8))',
                  opacity: 0.4 + (0.4 * (i / (segments * progress)))
                }}
              />
            );
          })}
        </svg>

        {/* Center content */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-2" 
                 style={{ 
                   textShadow: '0 0 8px rgba(8,240,255,0.4)' 
                 }}>
              {Math.round(hybridScore)}
            </div>
            <div className="text-lg text-white/80 uppercase tracking-wider font-medium"
                 style={{ 
                   textShadow: '0 0 4px rgba(8,240,255,0.3)' 
                 }}>
              Hybrid Score
            </div>
          </div>
        </div>

        {/* Subtle rotating outer glow effect */}
        <div 
          className="absolute inset-2 rounded-full pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, rgba(8,240,255,0.05) 90deg, transparent 180deg, rgba(8,240,255,0.02) 270deg, transparent 360deg)`,
            animation: 'spin 12s linear infinite'
          }}
        />
      </div>
    </div>
  );
};

export default HybridScoreDial2;