import React from 'react';

const IPhoneMockupTest = () => {
  return (
    <div className="min-h-screen bg-[#0E0E11] flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-white text-2xl mb-8">iPhone Pro Max Mockup Test</h1>
        
        {/* iPhone Pro Max Realistic Mockup */}
        <div className="relative">
          {/* iPhone Device Frame */}
          <div className="relative" style={{
            width: '375px',
            height: '812px',
            background: 'linear-gradient(145deg, #2c2c2e 0%, #1c1c1e 100%)',
            borderRadius: '60px',
            padding: '8px',
            boxShadow: `
              0 0 0 2px #000,
              0 0 0 4px #2c2c2e,
              0 20px 40px rgba(0,0,0,0.3),
              inset 0 2px 0 rgba(255,255,255,0.1)
            `
          }}>
            
            {/* Screen Container */}
            <div className="relative w-full h-full bg-black rounded-[52px] overflow-hidden">
              
              {/* Dynamic Island */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20" style={{
                width: '126px',
                height: '37px',
                background: '#000',
                borderRadius: '19px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}></div>
              
              {/* Screen Content - Gradient Background */}
              <div
                className="relative w-full h-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(8,240,255,.20) 0%, #0E0E11 60%)',
                }}
              >
                {/* Sample Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-2">91</div>
                    <div className="text-sm text-white/60 uppercase tracking-wider">
                      HYBRID SCORE
                    </div>
                  </div>
                </div>
                
                {/* Sample Component Positions */}
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                  <span className="text-white text-xs font-bold">HYBRID SCORE 91</span>
                </div>
                
                <div className="absolute bottom-32 left-4 right-4 bg-black/20 border border-white/20 rounded-xl p-4">
                  <div className="text-white text-sm font-semibold mb-2">Strength PRs</div>
                  <div className="space-y-1 text-xs text-white/80">
                    <div className="flex justify-between">
                      <span>Squat</span>
                      <span>315 lb</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bench</span>
                      <span>225 lb</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deadlift</span>
                      <span>405 lb</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20" style={{
                width: '134px',
                height: '5px',
                background: 'rgba(255,255,255,0.6)',
                borderRadius: '3px'
              }}></div>
              
              {/* Speaker Grill (for realism) */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10" style={{
                width: '60px',
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px'
              }}></div>
            </div>
            
            {/* Power Button */}
            <div className="absolute right-[-2px] top-[180px]" style={{
              width: '4px',
              height: '80px',
              background: 'linear-gradient(90deg, #2c2c2e 0%, #1c1c1e 100%)',
              borderRadius: '0 2px 2px 0'
            }}></div>
            
            {/* Volume Buttons */}
            <div className="absolute left-[-2px] top-[160px]" style={{
              width: '4px',
              height: '40px',
              background: 'linear-gradient(270deg, #2c2c2e 0%, #1c1c1e 100%)',
              borderRadius: '2px 0 0 2px'
            }}></div>
            <div className="absolute left-[-2px] top-[210px]" style={{
              width: '4px',
              height: '40px',
              background: 'linear-gradient(270deg, #2c2c2e 0%, #1c1c1e 100%)',
              borderRadius: '2px 0 0 2px'
            }}></div>
            
            {/* Silent Switch */}
            <div className="absolute left-[-2px] top-[130px]" style={{
              width: '4px',
              height: '20px',
              background: 'linear-gradient(270deg, #2c2c2e 0%, #1c1c1e 100%)',
              borderRadius: '2px 0 0 2px'
            }}></div>
          </div>
        </div>
        
        <p className="text-white/60 text-sm mt-4">
          iPhone 14 Pro Max mockup with realistic proportions and styling
        </p>
      </div>
    </div>
  );
};

export default IPhoneMockupTest;