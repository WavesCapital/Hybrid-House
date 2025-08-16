import React from 'react';

const PRRunsHorizontal = ({ prsData, style, baseStyle }) => {
  const { glassBlur = 8 } = style;
  const running = prsData?.running || {};
  
  const formatTime = (seconds) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);
    
    // For times over an hour, show h:mm format (no seconds)
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // For times under an hour, show mm:ss format
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const runs = [
    { name: 'Mile', time: running.mile_s || running.mile_time_seconds },
    { name: '5K', time: running['5k_s'] || running.five_k_time_seconds },
    { name: 'Marathon', time: running.marathon_s || running.marathon_time_seconds }
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
            BEST TIMES
          </h3>
        </div>
        
        {/* Times Grid - Left aligned with clean spacing */}
        <div className="grid grid-cols-3 gap-8 text-left">
          {runs.map((run, index) => (
            <div key={index} className="space-y-2">
              {/* Distance name */}
              <div className="text-white/70 text-sm font-medium uppercase tracking-wide">
                {run.name}
              </div>
              {/* Time */}
              <div className="text-white text-2xl font-bold">
                {formatTime(run.time)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PRRunsHorizontal;