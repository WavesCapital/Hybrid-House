import React from 'react';

const PRLifts = ({ prsData, style, baseStyle }) => {
  const { glassBlur = 8 } = style;
  const strength = prsData?.strength || {};
  
  const formatWeight = (weight) => {
    return weight ? `${Math.round(weight)}` : '—';
  };
  
  const calculateMultiplier = (weight, bodyweight) => {
    if (!weight || !bodyweight) return '—';
    const multiplier = weight / bodyweight;
    return `${multiplier.toFixed(1)}×`;
  };

  const lifts = [
    { name: 'Squat', weight: strength.squat_lb },
    { name: 'Bench', weight: strength.bench_lb },
    { name: 'Deadlift', weight: strength.deadlift_lb }
  ];

  return (
    <div 
      className="w-full h-full p-6"
      style={{
        ...baseStyle,
        backdropFilter: `blur(${glassBlur}px)`,
        WebkitBackdropFilter: `blur(${glassBlur}px)`
      }}
    >
      <div className="bg-black/20 border border-white/20 rounded-2xl p-6 h-full">
        <h3 className="text-xl font-bold text-white mb-4 text-center">Strength PRs</h3>
        
        <div className="space-y-4">
          {lifts.map((lift, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-white/80 font-medium">{lift.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-white font-bold text-lg">
                  {formatWeight(lift.weight)} lb
                </span>
                {strength.bodyweight_lb && (
                  <span className="text-[#08F0FF] text-sm font-medium bg-[#08F0FF]/10 px-2 py-1 rounded">
                    {calculateMultiplier(lift.weight, strength.bodyweight_lb)}BW
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {strength.bodyweight_lb && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Bodyweight</span>
              <span className="text-white/80 text-sm">
                {Math.round(strength.bodyweight_lb)} lb
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PRLifts;