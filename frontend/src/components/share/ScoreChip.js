import React from 'react';

const ScoreChip = ({ prsData, style, baseStyle, containerWidth, containerHeight }) => {
  const hybridScore = prsData?.meta?.hybrid_score || 0;
  const { textSize = 'M', align = 'center' } = style;
  
  // Dynamic text size based on container dimensions
  const baseFontSize = Math.min(containerWidth || 200, containerHeight || 40) * 0.08;
  
  // Text size mapping with dynamic scaling
  const sizeMultipliers = {
    S: 0.8,
    M: 1.0, 
    L: 1.3
  };
  
  const fontSize = baseFontSize * sizeMultipliers[textSize];
  
  // Alignment mapping
  const alignMap = {
    left: 'text-left justify-start',
    center: 'text-center justify-center',
    right: 'text-right justify-end'
  };

  return (
    <div 
      className={`flex items-center w-full h-full ${alignMap[align]}`}
      style={baseStyle}
    >
      <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 min-w-0">
        <span 
          className="font-bold text-white uppercase tracking-wider whitespace-nowrap"
          style={{ fontSize: `${fontSize}px` }}
        >
          HYBRID SCORE {Math.round(hybridScore)}
        </span>
      </div>
    </div>
  );
};

export default ScoreChip;