import React from 'react';

const ScoreChip = ({ prsData, style, baseStyle }) => {
  const hybridScore = prsData?.meta?.hybrid_score || 0;
  const { textSize = 'M', align = 'center' } = style;
  
  // Text size mapping
  const sizeMap = {
    S: 'text-2xl',
    M: 'text-4xl', 
    L: 'text-6xl'
  };
  
  // Alignment mapping
  const alignMap = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <div 
      className={`flex items-center justify-center w-full h-full ${alignMap[align]}`}
      style={baseStyle}
    >
      <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-8 py-3">
        <span className={`${sizeMap[textSize]} font-bold text-white uppercase tracking-wider`}>
          HYBRID SCORE {Math.round(hybridScore)}
        </span>
      </div>
    </div>
  );
};

export default ScoreChip;