import React from 'react';

const ScoreChip = ({ prsData, style, baseStyle }) => {
  const hybridScore = prsData?.meta?.hybrid_score || 0;
  const { textSize = 'M', align = 'center' } = style;
  
  // Text size mapping - Fixed optimal sizes
  const sizeMap = {
    S: 'text-lg',
    M: 'text-2xl', 
    L: 'text-4xl'
  };
  
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
      <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 whitespace-nowrap">
        <span className={`${sizeMap[textSize]} font-bold text-white uppercase tracking-wider`}>
          HYBRID SCORE {Math.round(hybridScore)}
        </span>
      </div>
    </div>
  );
};

export default ScoreChip;