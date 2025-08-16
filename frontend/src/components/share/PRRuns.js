import React from 'react';

const PRRuns = ({ prsData, style, baseStyle }) => {
  const { glassBlur = 8 } = style;
  const running = prsData?.running || {};
  
  const formatTime = (seconds) => {
    if (!seconds) return '—';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const runs = [
    { name: 'Mile', time: running.mile_time_seconds },
    { name: '5K', time: running.five_k_time_seconds },
    { name: '10K', time: running.ten_k_time_seconds }
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
            TIMES
          </h3>
        </div>
        
        {/* Running Times */}
        <div className="space-y-5">
          {runs.map((run, index) => (
            <div key={index} className="flex items-center justify-between w-full">
              <span className="text-white/80 text-xl font-medium">
                {run.name}
              </span>
              <span className="text-white text-2xl font-bold">
                {formatTime(run.time)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PRRuns;