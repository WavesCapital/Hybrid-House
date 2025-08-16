import React from 'react';

const PRLiftsHorizontal = ({ prsData, style, baseStyle }) => {
  const { glassBlur = 8 } = style;
  const strength = prsData?.strength || {};
  
  const formatWeight = (weight) => {
    return weight ? `${Math.round(weight)}` : '—';
  };

  const lifts = [
    { name: 'Bench', weight: strength.bench_lb },
    { name: 'Squat', weight: strength.squat_lb },
    { name: 'Deadlift', weight: strength.deadlift_lb }
  ];

  return (
    <div 
      className="w-full h-full p-6 flex items-center justify-start"
      style={{
        ...baseStyle,
        backdropFilter: `blur(${glassBlur}px)`,
        WebkitBackdropFilter: `blur(${glassBlur}px)`
      }}
    >
      <div className="bg-black/20 border border-white/20 rounded-2xl p-6 backdrop-blur-md w-full">
        {/* Header - Left aligned */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white/90 uppercase tracking-widest text-left">
            MAXES
          </h3>
        </div>
        
        {/* Lifts Grid - Left aligned with clean spacing */}
        <div className="grid grid-cols-3 gap-8 text-left">
          {lifts.map((lift, index) => (
            <div key={index} className="space-y-2">
              {/* Exercise name */}
              <div className="text-white/70 text-sm font-medium uppercase tracking-wide">
                {lift.name}
              </div>
              {/* Weight with smaller lbs */}
              <div className="flex items-baseline gap-1">
                <span className="text-white text-2xl font-bold">
                  {formatWeight(lift.weight)}
                </span>
                <span className="text-white/60 text-sm font-medium">
                  lbs
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PRLiftsHorizontal;