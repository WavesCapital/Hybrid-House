import React from 'react';

const PRLiftsHorizontal = ({ prsData, style, baseStyle }) => {
  const { glassBlur = 8 } = style;
  const strength = prsData?.strength || {};
  
  const formatWeight = (weight) => {
    return weight ? `${Math.round(weight)}` : '—';
  };

  const lifts = [
    { name: 'Squat', weight: strength.squat_lb, unit: 'lb' },
    { name: 'Bench', weight: strength.bench_lb, unit: 'lb' },
    { name: 'Deadlift', weight: strength.deadlift_lb, unit: 'lb' }
  ];

  return (
    <div 
      className="w-full h-full p-6 flex items-center justify-center"
      style={{
        ...baseStyle,
        backdropFilter: `blur(${glassBlur}px)`,
        WebkitBackdropFilter: `blur(${glassBlur}px)`
      }}
    >
      <div className="text-center w-full">
        {/* Header row */}
        <div className="flex justify-between items-center mb-6">
          {lifts.map((lift, index) => (
            <div key={index} className="flex-1">
              <div className="text-white/70 text-lg font-medium uppercase tracking-wider">
                {lift.name}
              </div>
            </div>
          ))}
        </div>
        
        {/* Values row */}
        <div className="flex justify-between items-center">
          {lifts.map((lift, index) => (
            <div key={index} className="flex-1">
              <div className="text-white text-3xl font-bold">
                {formatWeight(lift.weight)} {lift.unit}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PRLiftsHorizontal;