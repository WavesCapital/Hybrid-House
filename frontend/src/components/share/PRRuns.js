import React from 'react';

const PRRuns = ({ prsData, style, baseStyle }) => {
  const { glassBlur = 8 } = style;
  const running = prsData?.running || {};
  
  const formatTime = (seconds) => {
    if (!seconds) return '—';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };
  
  const calculatePace = (seconds, distance) => {
    if (!seconds) return '—';
    
    // Calculate pace per mile
    const pacePerMile = seconds / distance;
    const paceMinutes = Math.floor(pacePerMile / 60);
    const paceSeconds = Math.round(pacePerMile % 60);
    
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}/mi`;
  };

  const runs = [
    { name: 'Mile', time: running.mile_s, distance: 1 },
    { name: '5K', time: running['5k_s'], distance: 3.1 },
    { name: '10K', time: running['10k_s'], distance: 6.2 }
  ].filter(run => run.time); // Only show runs with times

  // Add half marathon if available
  if (running.half_s) {
    runs.push({ name: 'Half', time: running.half_s, distance: 13.1 });
  }

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
        <h3 className="text-xl font-bold text-white mb-4 text-center">Running PRs</h3>
        
        <div className="space-y-4">
          {runs.map((run, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-white/80 font-medium">{run.name}</span>
              <div className="text-right">
                <div className="text-white font-bold text-lg">
                  {formatTime(run.time)}
                </div>
                <div className="text-[#00FF88] text-xs bg-[#00FF88]/10 px-2 py-1 rounded mt-1">
                  {calculatePace(run.time, run.distance)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {runs.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <span className="text-white/40 text-sm">No running times available</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PRRuns;