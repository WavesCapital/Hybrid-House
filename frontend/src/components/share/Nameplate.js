import React from 'react';

const Nameplate = ({ prsData, style, baseStyle }) => {
  const { textSize = 'M', align = 'center' } = style;
  
  const firstName = prsData?.meta?.first_name || '';
  const lastName = prsData?.meta?.last_name || '';
  const displayName = prsData?.meta?.display_name || `${firstName} ${lastName}`.trim() || 'Your Name';
  
  // Text size mapping
  const sizeMap = {
    S: 'text-3xl',
    M: 'text-5xl',
    L: 'text-7xl'
  };
  
  // Alignment mapping
  const alignMap = {
    left: 'text-left justify-start',
    center: 'text-center justify-center',
    right: 'text-right justify-end'
  };

  // Split name into lines if too long
  const words = displayName.split(' ');
  let lines = [];
  
  if (words.length <= 2) {
    lines = [displayName];
  } else {
    // Split longer names into two lines
    const midpoint = Math.ceil(words.length / 2);
    lines = [
      words.slice(0, midpoint).join(' '),
      words.slice(midpoint).join(' ')
    ];
  }

  return (
    <div 
      className={`flex items-center w-full h-full ${alignMap[align]}`}
      style={baseStyle}
    >
      <div>
        {lines.map((line, index) => (
          <div 
            key={index}
            className={`${sizeMap[textSize]} font-bold text-white leading-tight`}
            style={{
              // Ensure text fits within bounds with ellipsis if needed
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Nameplate;