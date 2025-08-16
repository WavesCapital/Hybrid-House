import React from 'react';

const PRLifts = ({ prsData, style, baseStyle }) => {
  const { glassBlur = 8 } = style;
  const strength = prsData?.strength || {};
  
  const formatWeight = (weight) => {
    return weight ? `${Math.round(weight)}` : '—';
  };

  const lifts = [
    { name: 'Squat', weight: strength.squat_lb },
    { name: 'Bench', weight: strength.bench_lb },
    { name: 'Deadlift', weight: strength.deadlift_lb }
  ];

  return (
    <div 
      className="w-full h-full flex items-center justify-center p-4"
      style={{
        ...baseStyle,
        backdropFilter: `blur(${glassBlur}px)`,
        WebkitBackdropFilter: `blur(${glassBlur}px)`
      }}
    >
      <div className="bg-black/20 border border-white/20 rounded-2xl p-6 backdrop-blur-md min-w-full">
        {/* Header - Left aligned */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white/90 uppercase tracking-widest text-left">
            MAXES
          </h3>
        </div>
        
        {/* Lifts */}
        <div className="space-y-5">
          {lifts.map((lift, index) => (
            <div key={index} className="flex items-center justify-between w-full">
              <span className="text-white/80 text-xl font-medium">
                {lift.name}
              </span>
              <span className="text-white text-2xl font-bold">
                {formatWeight(lift.weight)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PRLifts;