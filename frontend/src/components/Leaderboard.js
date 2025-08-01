import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, User, TrendingUp, Activity, Search, Filter, ChevronDown } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCTA, setShowCTA] = useState(false);
  
  // Filter states
  const [scoreRange, setScoreRange] = useState([0, 100]);
  const [genderFilter, setGenderFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Apply filters whenever data or filters change
  useEffect(() => {
    let filtered = [...leaderboardData];
    
    // Score range filter
    filtered = filtered.filter(athlete => 
      athlete.score >= scoreRange[0] && athlete.score <= scoreRange[1]
    );
    
    // Gender filter (if we had gender data)
    // Note: Gender data not currently available in backend
    
    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(athlete =>
        athlete.display_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
  }, [leaderboardData, scoreRange, genderFilter, searchQuery]);

  // Scroll listener for CTA
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setShowCTA(scrollPercent > 40);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/leaderboard`);
      const data = response.data.leaderboard || [];
      setLeaderboardData(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const getPodiumData = () => {
    return filteredData.slice(0, 3).map((athlete, index) => ({
      ...athlete,
      rank: index + 1
    }));
  };

  const getTableData = () => {
    return filteredData.slice(3).map((athlete, index) => ({
      ...athlete,
      rank: index + 4
    }));
  };

  const formatScore = (score) => {
    return Math.round(score * 10) / 10;
  };

  const getPillarColor = (pillar) => {
    const colors = {
      strength: '#5CFF5C',
      speed: '#FFA42D', 
      vo2: '#B96DFF',
      distance: '#16D7FF',
      volume: '#F9F871',
      recovery: '#2EFFC0'
    };
    return colors[pillar] || '#08F0FF';
  };

  const renderPodiumBlock = (athlete, position) => {
    if (!athlete) return null;
    
    const heights = { 1: '220px', 2: '180px', 3: '180px' };
    const widths = { 1: '240px', 2: '200px', 3: '200px' };
    const positions = { 1: 'center', 2: 'left', 3: 'right' };
    
    const podiumStyle = {
      width: widths[position],
      height: heights[position],
      background: 'linear-gradient(145deg, #15161A 0%, #1A1B20 100%)',
      borderRadius: '8px',
      position: 'relative',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(8, 240, 255, 0.2)',
      boxShadow: `
        0 12px 32px -24px rgba(0, 0, 0, 0.65),
        inset 0 1px 0 rgba(8, 240, 255, 0.3)
      `
    };

    const pillarData = athlete.score_breakdown ? [
      { name: 'Str', value: athlete.score_breakdown.strengthScore, color: '#5CFF5C' },
      { name: 'Spd', value: athlete.score_breakdown.speedScore, color: '#FFA42D' },
      { name: 'VO₂', value: athlete.score_breakdown.vo2Score, color: '#B96DFF' },
      { name: 'Dist', value: athlete.score_breakdown.distanceScore, color: '#16D7FF' },
      { name: 'Vol', value: athlete.score_breakdown.volumeScore, color: '#F9F871' },
      { name: 'Rec', value: athlete.score_breakdown.recoveryScore, color: '#2EFFC0' }
    ] : [];

    return (
      <div 
        className="podium-block"
        style={podiumStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px) rotateX(6deg)';
          e.currentTarget.style.boxShadow = `
            0 16px 40px -20px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(8, 240, 255, 0.65),
            0 0 20px rgba(8, 240, 255, 0.3)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) rotateX(6deg)';
          e.currentTarget.style.boxShadow = `
            0 12px 32px -24px rgba(0, 0, 0, 0.65),
            inset 0 1px 0 rgba(8, 240, 255, 0.3)
          `;
        }}
      >
        {/* Medal/Rank Icon */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '24px',
          zIndex: 2
        }}>
          {position === 1 ? '🏆' : position === 2 ? '🥈' : '🥉'}
        </div>

        {/* Content Container */}
        <div style={{
          padding: '20px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          marginTop: '20px'
        }}>
          {/* Avatar */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #08F0FF, #FF2DDE)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            border: '2px solid #08F0FF'
          }}>
            <User size={24} color="white" />
          </div>

          {/* Name */}
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#F5FAFF',
            marginBottom: '4px',
            fontFamily: 'Inter, sans-serif'
          }}>
            {athlete.display_name}
          </div>

          {/* Label */}
          <div style={{
            fontSize: '12px',
            fontWeight: '400',
            color: '#8D9299',
            marginBottom: '16px'
          }}>
            Hybrid Athlete
          </div>

          {/* Hybrid Score */}
          <div style={{
            fontSize: '24px',
            fontWeight: '800',
            color: '#08F0FF',
            textShadow: '0 0 10px rgba(8, 240, 255, 0.5)',
            marginBottom: '4px',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {formatScore(athlete.score)}
            <span style={{
              fontSize: '12px',
              fontWeight: '400',
              marginLeft: '4px',
              color: '#8D9299'
            }}>pts</span>
          </div>

          {/* Mini Pillar Bars */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px'
          }}>
            {pillarData.map((pillar, idx) => (
              <div key={idx} style={{
                width: '60px',
                height: '4px',
                background: pillar.color,
                borderRadius: '2px',
                opacity: pillar.value ? 1 : 0.3
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E0E11' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh' 
        }}>
          <div style={{
            background: 'rgba(21, 22, 26, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(8, 240, 255, 0.2)',
            padding: '32px',
            textAlign: 'center'
          }}>
            <Activity size={48} color="#08F0FF" style={{ marginBottom: '16px', animation: 'pulse 2s infinite' }} />
            <p style={{ color: '#8D9299' }}>Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E0E11' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh' 
        }}>
          <div style={{
            background: 'rgba(21, 22, 26, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 45, 222, 0.2)',
            padding: '32px',
            textAlign: 'center'
          }}>
            <TrendingUp size={48} color="#FF2DDE" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#FF2DDE', marginBottom: '16px' }}>{error}</p>
            <button
              onClick={fetchLeaderboard}
              style={{
                background: '#08F0FF',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                color: '#000',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const podiumData = getPodiumData();
  const tableData = getTableData();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0E0E11',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Hero Section with Podium */}
      <div style={{ 
        minHeight: '45vh',
        background: 'radial-gradient(ellipse at center, rgba(8, 240, 255, 0.1) 0%, transparent 50%)',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Hero Headlines */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            color: '#F5FAFF',
            marginBottom: '12px',
            textShadow: '0 0 20px rgba(8, 240, 255, 0.3)'
          }}>
            <span style={{ color: '#08F0FF' }}>Hybrid Athletes</span> Global Leaderboard
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#8D9299',
            marginBottom: '8px'
          }}>
            Real-time ranking of the world's strongest, fastest all-rounders.
          </p>
          <p style={{
            fontSize: '14px',
            color: '#8D9299',
            fontStyle: 'italic'
          }}>
            Earn your place on the podium—balance power with endurance.
          </p>
        </div>

        {/* Podium */}
        <div style={{
          display: 'flex',
          alignItems: 'end',
          justifyContent: 'center',
          gap: '20px',
          transform: 'perspective(1000px)',
          animation: 'podiumRise 0.8s ease-out'
        }}>
          {/* Second Place */}
          {podiumData[1] && renderPodiumBlock(podiumData[1], 2)}
          
          {/* First Place */}
          {podiumData[0] && renderPodiumBlock(podiumData[0], 1)}
          
          {/* Third Place */}
          {podiumData[2] && renderPodiumBlock(podiumData[2], 3)}
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
        position: 'sticky',
        top: '0',
        zIndex: 10,
        background: 'rgba(21, 22, 26, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #1F2025',
        padding: '16px 20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Score Range Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ color: '#8D9299', fontSize: '14px', fontWeight: '500' }}>
              Score 0-100
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={scoreRange[1]}
              onChange={(e) => setScoreRange([0, parseInt(e.target.value)])}
              style={{
                width: '120px',
                height: '4px',
                background: '#08F0FF',
                outline: 'none',
                opacity: '0.8',
                borderRadius: '2px'
              }}
            />
            <span style={{ color: '#08F0FF', fontSize: '14px', fontWeight: '600' }}>
              {scoreRange[1]}
            </span>
          </div>

          {/* Gender Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Male', 'Female'].map(gender => (
              <button
                key={gender}
                onClick={() => setGenderFilter(gender)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: genderFilter === gender ? '#08F0FF' : 'rgba(255, 255, 255, 0.1)',
                  color: genderFilter === gender ? '#000' : '#8D9299'
                }}
              >
                {gender}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8D9299'
            }} />
            <input
              type="text"
              placeholder="Search athletes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '180px',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#F5FAFF',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div style={{ padding: '40px 20px' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'rgba(21, 22, 26, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(8, 240, 255, 0.2)',
          borderBottom: '4px solid #08F0FF',
          overflow: 'hidden',
          boxShadow: '0 12px 32px -24px rgba(0, 0, 0, 0.65)'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 60px 200px 80px 80px 100px repeat(6, 80px) 120px',
            padding: '16px 20px',
            borderBottom: '2px solid #08F0FF',
            background: 'rgba(8, 240, 255, 0.05)',
            fontSize: '12px',
            fontWeight: '600',
            color: '#8D9299',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <div>Rank</div>
            <div></div>
            <div>Name</div>
            <div>Age</div>
            <div>Sex</div>
            <div>Country</div>
            <div style={{ color: '#08F0FF' }}>Hybrid</div>
            <div style={{ color: '#5CFF5C' }}>Str</div>
            <div style={{ color: '#FFA42D' }}>Spd</div>
            <div style={{ color: '#B96DFF' }}>VO₂</div>
            <div style={{ color: '#16D7FF' }}>Dist</div>
            <div style={{ color: '#F9F871' }}>Vol</div>
            <div style={{ color: '#2EFFC0' }}>Rec</div>
            <div>Last Updated</div>
          </div>

          {/* Table Body */}
          {tableData.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#8D9299'
            }}>
              {filteredData.length === 0 && leaderboardData.length > 0 ? 
                "No athletes match those filters—try widening the range." :
                "No athletes yet—be the first to complete the assessment!"
              }
            </div>
          ) : (
            tableData.map((athlete, index) => (
              <div
                key={`${athlete.display_name}-${athlete.profile_id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 60px 200px 80px 80px 100px repeat(6, 80px) 120px',
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(8, 240, 255, 0.05)';
                  e.currentTarget.style.borderLeft = '4px solid #08F0FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeft = 'none';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#F5FAFF'
                }}>
                  #{athlete.rank}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #08F0FF, #FF2DDE)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={16} color="white" />
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#F5FAFF'
                  }}>
                    {athlete.display_name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#8D9299'
                  }}>
                    Hybrid Athlete
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#8D9299',
                  fontSize: '14px'
                }}>
                  --
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#8D9299',
                  fontSize: '14px'
                }}>
                  --
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#8D9299',
                  fontSize: '14px'
                }}>
                  --
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: athlete.score >= 80 ? '#08F0FF' : '#F5FAFF',
                  textShadow: athlete.score >= 80 ? '0 0 8px rgba(8, 240, 255, 0.5)' : 'none',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {formatScore(athlete.score)}
                </div>
                {/* Pillar Scores */}
                {athlete.score_breakdown ? [
                  athlete.score_breakdown.strengthScore,
                  athlete.score_breakdown.speedScore,
                  athlete.score_breakdown.vo2Score,
                  athlete.score_breakdown.distanceScore,
                  athlete.score_breakdown.volumeScore,
                  athlete.score_breakdown.recoveryScore
                ].map((score, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#F5FAFF',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {score ? formatScore(score) : '--'}
                  </div>
                )) : Array(6).fill(0).map((_, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8D9299'
                  }}>--</div>
                ))}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#8D9299'
                }}>
                  {athlete.completed_at ? 
                    new Date(athlete.completed_at).toLocaleDateString() : 
                    '--'
                  }
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table Caption */}
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '12px',
          color: '#8D9299'
        }}>
          Scrolling shows the top {leaderboardData.length} athletes • Use filters to dial in.
        </div>
      </div>

      {/* Sticky CTA Strip */}
      {showCTA && (
        <div style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          background: 'linear-gradient(90deg, #15161A 0%, #131417 100%)',
          borderTop: '1px solid rgba(8, 240, 255, 0.2)',
          padding: '20px',
          textAlign: 'center',
          zIndex: 20,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#F5FAFF',
              margin: '0'
            }}>
              Think you can break into the Top 3?
            </h3>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: '#08F0FF',
                border: 'none',
                borderRadius: '24px',
                padding: '12px 32px',
                color: '#000',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#FF2DDE';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#08F0FF';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Start Hybrid Interview →
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes podiumRise {
          0% {
            opacity: 0.6;
            transform: perspective(1000px) translateY(30px);
          }
          100% {
            opacity: 1;
            transform: perspective(1000px) translateY(0);
          }
        }

        @keyframes slideUp {
          0% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .podium-block {
          transform: rotateX(6deg);
        }

        /* Responsive adjustments */
        @media (max-width: 1279px) {
          .podium-block {
            transform: rotateX(6deg) scale(0.8);
          }
        }

        @media (max-width: 991px) {
          .podium-container {
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;