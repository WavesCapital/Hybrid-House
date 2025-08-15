import React from 'react';

const BalanceChips = ({ prsData, style, baseStyle }) => {
  // Extract scores from prsData or use defaults
  const strengthScore = 75; // Would come from score analysis
  const enduranceScore = 68;
  const recoveryScore = 82;
  
  const chips = [
    { name: 'Strength', score: strengthScore, color: '#FFA42D' },
    { name: 'Endurance', score: enduranceScore, color: '#00FF88' }, 
    { name: 'Recovery', score: recoveryScore, color: '#08F0FF' }
  ];

  return (
    <div className="flex items-center justify-center w-full h-full gap-4" style={baseStyle}>
      {chips.map((chip, index) => (
        <div
          key={index}
          className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 flex items-center gap-3"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: chip.color }}
          />
          <span className="text-white font-medium text-sm">
            {chip.name}
          </span>
          <span 
            className="font-bold text-sm"
            style={{ color: chip.color }}
          >
            {chip.score}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BalanceChips;