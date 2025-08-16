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
      className="w-full h-full flex items-center justify-center"
      style={{
        ...baseStyle,
        filter: 'drop-shadow(0 0 30px rgba(8,240,255,0.6)) drop-shadow(0 0 60px rgba(8,240,255,0.4)) drop-shadow(0 0 90px rgba(8,240,255,0.2))'
      }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Outer glow ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + 8}
            stroke="rgba(8,240,255,0.1)"
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
              filter: 'drop-shadow(0 0 8px rgba(8,240,255,0.8)) drop-shadow(0 0 16px rgba(8,240,255,0.6))'
            }}
          />

          {/* Inner glow ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - 15}
            stroke="rgba(8,240,255,0.2)"
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
                r="1.5"
                fill="#08F0FF"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(8,240,255,0.8))',
                  opacity: 0.6 + (0.4 * (i / (segments * progress)))
                }}
              />
            );
          })}
        </svg>

        {/* Center content */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(8,240,255,0.3))'
          }}
        >
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-2" 
                 style={{ 
                   textShadow: '0 0 20px rgba(8,240,255,0.5), 0 0 40px rgba(8,240,255,0.3)' 
                 }}>
              {Math.round(hybridScore)}
            </div>
            <div className="text-lg text-white/80 uppercase tracking-wider font-medium"
                 style={{ 
                   textShadow: '0 0 10px rgba(8,240,255,0.3)' 
                 }}>
              Hybrid Score
            </div>
          </div>
        </div>

        {/* Rotating outer glow effect */}
        <div 
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, rgba(8,240,255,0.1) 90deg, transparent 180deg, rgba(8,240,255,0.05) 270deg, transparent 360deg)`,
            animation: 'spin 8s linear infinite'
          }}
        />
      </div>
    </div>
  );
};

export default HybridScoreDial2;