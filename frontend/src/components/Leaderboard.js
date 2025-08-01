import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, User, TrendingUp, Activity, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCTA, setShowCTA] = useState(false);
  const [sortColumn, setSortColumn] = useState('hybrid');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Filter states
  const [scoreRange, setScoreRange] = useState([0, 100]);
  const [genderFilter, setGenderFilter] = useState('All');
  const [ageRange, setAgeRange] = useState([18, 65]);
  const [countryFilter, setCountryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAgeRangeDragging, setIsAgeRangeDragging] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...leaderboardData];
    
    // Score range filter
    filtered = filtered.filter(athlete => 
      athlete.score >= scoreRange[0] && athlete.score <= scoreRange[1]
    );
    
    // Age range filter
    filtered = filtered.filter(athlete => {
      const age = athlete.age;
      return age >= ageRange[0] && age <= ageRange[1];
    });
    
    // Gender filter
    if (genderFilter !== 'All') {
      filtered = filtered.filter(athlete => 
        athlete.gender && athlete.gender.toLowerCase() === genderFilter.toLowerCase()
      );
    }
    
    // Country filter
    if (countryFilter !== 'All') {
      filtered = filtered.filter(athlete => 
        athlete.country && athlete.country.toLowerCase() === countryFilter.toLowerCase()
      );
    }
    
    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(athlete =>
        athlete.display_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortColumn === 'hybrid') {
        aValue = a.score;
        bValue = b.score;
      } else if (sortColumn === 'name') {
        aValue = a.display_name;
        bValue = b.display_name;
      } else if (a.score_breakdown && b.score_breakdown) {
        const scoreMap = {
          'str': 'strengthScore',
          'spd': 'speedScore',
          'vo2': 'vo2Score',
          'dist': 'distanceScore',
          'vol': 'volumeScore',
          'rec': 'recoveryScore'
        };
        aValue = a.score_breakdown[scoreMap[sortColumn]] || 0;
        bValue = b.score_breakdown[scoreMap[sortColumn]] || 0;
      } else {
        return 0;
      }
      
      if (typeof aValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    setFilteredData(filtered);
  }, [leaderboardData, scoreRange, ageRange, genderFilter, countryFilter, searchQuery, sortColumn, sortDirection]);

  // Scroll listener for CTA
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setShowCTA(scrollPercent > 40);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get unique countries from leaderboard data
  const getUniqueCountries = () => {
    const countries = leaderboardData
      .map(athlete => athlete.country)
      .filter(country => country && country.trim())
      .map(country => country.trim());
    return [...new Set(countries)].sort();
  };

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

  const getCountryFlag = (countryCode) => {
    const flags = {
      'US': '🇺🇸',
      'CA': '🇨🇦', 
      'GB': '🇬🇧',
      'AU': '🇦🇺',
      'NZ': '🇳🇿',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'NL': '🇳🇱',
      'SE': '🇸🇪',
      'NO': '🇳🇴',
      'DK': '🇩🇰',
      'JP': '🇯🇵',
      'KR': '🇰🇷',
      'CN': '🇨🇳',
      'IN': '🇮🇳',
      'BR': '🇧🇷',
      'MX': '🇲🇽',
      'AR': '🇦🇷',
      'ZA': '🇿🇦',
      'OTHER': '🌍'
    };
    return flags[countryCode] || '🌍';
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const renderMinimalPodiumCard = (athlete, position) => {
    if (!athlete) return null;
    
    const configs = {
      1: { 
        width: '260px', 
        height: '280px', 
        trophyIcon: '🏆',
        trophyColor: '#FFD700'
      },
      2: { 
        width: '220px', 
        height: '260px', 
        trophyIcon: '🥈',
        trophyColor: '#C0C0C0'
      },
      3: { 
        width: '220px', 
        height: '260px', 
        trophyIcon: '🥉',
        trophyColor: '#CD7F32'
      }
    };
    
    const config = configs[position];
    
    const cardStyle = {
      width: config.width,
      height: config.height,
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(8, 240, 255, 0.15)',
      position: 'relative',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      boxShadow: `
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.1)
      `,
      opacity: 0,
      transform: 'translateY(40px)',
      animation: `minimalCardRise 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
      animationDelay: `${(position - 1) * 150}ms`,
      overflow: 'hidden'
    };

    return (
      <div 
        className="minimal-podium-card"
        style={cardStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)';
          e.currentTarget.style.boxShadow = `
            0 35px 70px -12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 0 40px rgba(8, 240, 255, 0.15)
          `;
          e.currentTarget.style.border = '1px solid rgba(8, 240, 255, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = `
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `;
          e.currentTarget.style.border = '1px solid rgba(8, 240, 255, 0.15)';
        }}
      >
        {/* Subtle gradient overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: `linear-gradient(180deg, rgba(8, 240, 255, 0.03) 0%, transparent 100%)`,
          borderRadius: '24px 24px 0 0',
          zIndex: 1
        }} />

        {/* Trophy Icon */}
        <div style={{
          position: 'absolute',
          top: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '40px',
          zIndex: 3,
          filter: `drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))`,
          animation: position === 1 ? 'trophyGlow 4s ease-in-out infinite alternate' : 'none'
        }}>
          {config.trophyIcon}
        </div>

        {/* Content Container - Clean and Spacious */}
        <div style={{
          padding: '40px 32px 36px 32px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          gap: '24px'
        }}>
          {/* Name - Clean Typography */}
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.02em',
            lineHeight: '1.1',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
            marginTop: '80px'
          }}>
            {athlete.display_name}
          </div>

          {/* Score - Hero Element */}
          <div style={{
            position: 'relative',
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            {/* Score glow background */}
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '140px',
              height: '80px',
              background: 'radial-gradient(ellipse, rgba(8, 240, 255, 0.12) 0%, transparent 70%)',
              borderRadius: '40px',
              filter: 'blur(12px)'
            }} />
            
            <div style={{
              fontSize: '56px',
              fontWeight: '900',
              color: '#08F0FF',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.04em',
              lineHeight: '1',
              textShadow: `
                0 0 20px rgba(8, 240, 255, 0.6),
                0 0 40px rgba(8, 240, 255, 0.3),
                0 4px 8px rgba(0, 0, 0, 0.3)
              `,
              position: 'relative',
              zIndex: 1
            }}>
              {Math.round(athlete.score)}
            </div>

            {/* Hybrid Score Label */}
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'rgba(8, 240, 255, 0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'Inter, sans-serif'
            }}>
              Hybrid Score
            </div>
          </div>
        </div>

        {/* Subtle bottom accent */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '20%',
          right: '20%',
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, ${config.trophyColor}40 50%, transparent 100%)`,
          borderRadius: '1px'
        }} />
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
        padding: '96px 20px 40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative'
      }}>
        {/* Title Block */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            marginBottom: '40px',
            fontFamily: 'Inter, sans-serif',
            maxWidth: '780px',
            lineHeight: '1.1'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #08F0FF, #FF2DDE)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 6px rgba(8, 240, 255, 0.15))'
            }}>Hybrid</span>
            <span style={{ color: '#FFFFFF' }}> Athletes Global Leaderboard</span>
          </h1>
          <p style={{
            fontSize: '20px',
            fontWeight: '400',
            color: '#8D9299',
            margin: '0 auto 32px auto',
            lineHeight: '1.5'
          }}>
            Real-time ranking of the world's strongest, fastest all-rounders.
          </p>
        </div>

        {/* Podium Area */}
        <div style={{ position: 'relative', marginBottom: '40px' }}>
          {/* Floor Line */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '70%',
            maxWidth: '500px',
            height: '6px',
            background: '#08F0FF',
            borderRadius: '3px',
            zIndex: 0
          }} />
          
          {/* Podium Cards */}
          <div style={{
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'center',
            gap: '32px'
          }}>
            {/* Second Place */}
            {podiumData[1] && renderMinimalPodiumCard(podiumData[1], 2)}
            
            {/* First Place */}
            {podiumData[0] && renderMinimalPodiumCard(podiumData[0], 1)}
            
            {/* Third Place */}
            {podiumData[2] && renderMinimalPodiumCard(podiumData[2], 3)}
          </div>
        </div>

        {/* Total Athletes Badge */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          right: '40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(8, 240, 255, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          zIndex: 2
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif'
          }}>
            {leaderboardData.length}
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: '400',
            color: '#FFFFFF',
            textAlign: 'center',
            textTransform: 'uppercase',
            opacity: 0.9
          }}>
            ATHLETES
          </div>
        </div>
      </div>

      {/* Filters Bar - Sticky */}
      <div style={{
        position: 'sticky',
        top: '0',
        zIndex: 10,
        background: '#15161AEE',
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
            <label style={{ color: '#8D9299', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', minWidth: '70px' }}>
              Score: {scoreRange[1]}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={scoreRange[1]}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onChange={(e) => setScoreRange([0, parseInt(e.target.value)])}
                style={{
                  width: '120px',
                  height: '4px',
                  background: `linear-gradient(to right, #08F0FF 0%, #08F0FF ${scoreRange[1]}%, rgba(255,255,255,0.1) ${scoreRange[1]}%, rgba(255,255,255,0.1) 100%)`,
                  outline: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  appearance: 'none'
                }}
              />
              {isDragging && (
                <div style={{
                  position: 'absolute',
                  top: '-30px',
                  left: `${scoreRange[1]}%`,
                  transform: 'translateX(-50%)',
                  background: '#08F0FF',
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  {scoreRange[1]}
                </div>
              )}
            </div>
          </div>

          {/* Age Range Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ color: '#8D9299', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', minWidth: '70px' }}>
              Age: {ageRange[0]}-{ageRange[1]}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="range"
                  min="18"
                  max="65"
                  value={ageRange[0]}
                  onMouseDown={() => setIsAgeRangeDragging('min')}
                  onMouseUp={() => setIsAgeRangeDragging('')}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value);
                    if (newMin <= ageRange[1]) {
                      setAgeRange([newMin, ageRange[1]]);
                    }
                  }}
                  style={{
                    width: '80px',
                    height: '4px',
                    background: `linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) ${((ageRange[0]-18)/(65-18))*100}%, #B96DFF ${((ageRange[0]-18)/(65-18))*100}%, #B96DFF ${((ageRange[1]-18)/(65-18))*100}%, rgba(255,255,255,0.1) ${((ageRange[1]-18)/(65-18))*100}%, rgba(255,255,255,0.1) 100%)`,
                    outline: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    appearance: 'none'
                  }}
                />
                {isAgeRangeDragging === 'min' && (
                  <div style={{
                    position: 'absolute',
                    top: '-30px',
                    left: '0',
                    background: '#B96DFF',
                    color: '#000',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {ageRange[0]}
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="range"
                  min="18"
                  max="65"
                  value={ageRange[1]}
                  onMouseDown={() => setIsAgeRangeDragging('max')}
                  onMouseUp={() => setIsAgeRangeDragging('')}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value);
                    if (newMax >= ageRange[0]) {
                      setAgeRange([ageRange[0], newMax]);
                    }
                  }}
                  style={{
                    width: '80px',
                    height: '4px',
                    background: `linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) ${((ageRange[0]-18)/(65-18))*100}%, #B96DFF ${((ageRange[0]-18)/(65-18))*100}%, #B96DFF ${((ageRange[1]-18)/(65-18))*100}%, rgba(255,255,255,0.1) ${((ageRange[1]-18)/(65-18))*100}%, rgba(255,255,255,0.1) 100%)`,
                    outline: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    appearance: 'none'
                  }}
                />
                {isAgeRangeDragging === 'max' && (
                  <div style={{
                    position: 'absolute',
                    top: '-30px',
                    right: '0',
                    background: '#B96DFF',
                    color: '#000',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {ageRange[1]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gender Pills */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ color: '#8D9299', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
              Gender:
            </span>
            {['All', 'Male', 'Female'].map(gender => (
              <button
                key={gender}
                onClick={() => setGenderFilter(gender)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  background: genderFilter === gender ? 'rgba(255, 45, 222, 0.85)' : 'rgba(255, 255, 255, 0.1)',
                  color: genderFilter === gender ? '#000' : '#8D9299'
                }}
              >
                {gender}
              </button>
            ))}
          </div>

          {/* Country Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ color: '#8D9299', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
              Country:
            </label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              <option value="All" style={{ background: '#1A1B1F', color: '#FFFFFF' }}>All Countries</option>
              {getUniqueCountries().map(country => (
                <option key={country} value={country} style={{ background: '#1A1B1F', color: '#FFFFFF' }}>
                  {country}
                </option>
              ))}
            </select>
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
              placeholder="Search athletes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '200px',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'Inter, sans-serif'
              }}
            />
          </div>

          {/* Active Filters Count */}
          {(genderFilter !== 'All' || countryFilter !== 'All' || searchQuery || scoreRange[1] < 100 || ageRange[0] > 18 || ageRange[1] < 65) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              background: 'rgba(8, 240, 255, 0.1)',
              border: '1px solid rgba(8, 240, 255, 0.3)',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#08F0FF',
              textTransform: 'uppercase'
            }}>
              <Filter size={12} />
              {filteredData.length} / {leaderboardData.length} Athletes
              <button
                onClick={() => {
                  setScoreRange([0, 100]);
                  setAgeRange([18, 65]);
                  setGenderFilter('All');
                  setCountryFilter('All');
                  setSearchQuery('');
                }}
                style={{
                  background: 'rgba(8, 240, 255, 0.2)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '2px 6px',
                  color: '#08F0FF',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div style={{ padding: '40px 20px' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: '#15161A',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: '2px solid #08F0FF',
          overflow: 'hidden',
          boxShadow: '0 12px 32px -24px rgba(0, 0, 0, 0.65)'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 200px 80px 80px 100px 100px repeat(6, 80px) 120px',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.02)',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: 'Inter, sans-serif'
          }}>
            <div style={{ color: '#8D9299', cursor: 'pointer' }} onClick={() => handleSort('rank')}>
              RANK {sortColumn === 'rank' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
            </div>
            <div style={{ color: '#8D9299', cursor: 'pointer' }} onClick={() => handleSort('name')}>
              NAME {sortColumn === 'name' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
            </div>
            <div style={{ color: '#8D9299' }}>AGE</div>
            <div style={{ color: '#8D9299' }}>GENDER</div>
            <div style={{ color: '#8D9299' }}>COUNTRY</div>
            <div style={{ color: sortColumn === 'hybrid' ? '#08F0FF' : '#8D9299', cursor: 'pointer' }} onClick={() => handleSort('hybrid')}>
              HYBRID {sortColumn === 'hybrid' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
            </div>
            <div style={{ color: '#5CFF5C', cursor: 'pointer' }} onClick={() => handleSort('str')}>
              STR {sortColumn === 'str' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
            </div>
            <div style={{ color: '#FFA42D', cursor: 'pointer' }} onClick={() => handleSort('spd')}>
              SPD {sortColumn === 'spd' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
            </div>
            <div style={{ color: '#B96DFF', cursor: 'pointer' }} onClick={() => handleSort('vo2')}>
              VO₂ {sortColumn === 'vo2' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
            </div>
            <div style={{ color: '#16D7FF', cursor: 'pointer' }} onClick={() => handleSort('dist')}>
              DIST {sortColumn === 'dist' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
            </div>
            <div style={{ color: '#F9F871', cursor: 'pointer' }} onClick={() => handleSort('vol')}>
              VOL {sortColumn === 'vol' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
            </div>
            <div style={{ color: '#2EFFC0', cursor: 'pointer' }} onClick={() => handleSort('rec')}>
              REC {sortColumn === 'rec' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
            </div>
            <div style={{ color: '#8D9299' }}>UPDATED</div>
          </div>

          {/* Table Body */}
          {filteredData.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#8D9299'
            }}>
              {leaderboardData.length > 0 ? 
                "No athletes match those filters—try widening the range." :
                "No athletes yet—be the first to complete the assessment!"
              }
            </div>
          ) : (
            filteredData.map((athlete, index) => {
              const isTopThree = index < 3;
              const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
              
              return (
                <div
                  key={`${athlete.display_name}-${athlete.profile_id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 200px 80px 80px 100px 100px repeat(6, 80px) 120px',
                    padding: '12px 20px',
                    height: '48px',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: index % 2 === 1 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(8, 240, 255, 0.04)';
                    e.currentTarget.style.borderLeft = '3px solid #08F0FF';
                    e.currentTarget.style.paddingLeft = '17px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 1 ? 'rgba(255, 255, 255, 0.02)' : 'transparent';
                    e.currentTarget.style.borderLeft = 'none';
                    e.currentTarget.style.paddingLeft = '20px';
                  }}
                >
                  {/* Rank */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: isTopThree ? '800' : '600',
                    color: '#FFFFFF',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {medalEmoji && <span style={{ marginRight: '4px' }}>{medalEmoji}</span>}
                    #{index + 1}
                  </div>
                  
                  {/* Avatar + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: isTopThree ? '700' : '600',
                        color: '#FFFFFF'
                      }}>
                        {athlete.display_name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#8D9299'
                      }}>
                        Hybrid Athlete
                      </div>
                    </div>
                  </div>
                  
                  {/* Age, Sex, Country */}
                  <div style={{ textAlign: 'center', color: '#8D9299', fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>
                    {athlete.age || '--'}
                  </div>
                  <div style={{ textAlign: 'center', color: '#8D9299', fontSize: '14px' }}>
                    {athlete.gender || '--'}
                  </div>
                  <div style={{ textAlign: 'center', color: '#8D9299', fontSize: '14px' }}>
                    {athlete.country ? getCountryFlag(athlete.country) : '--'}
                  </div>
                  
                  {/* Hybrid Score */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: athlete.score >= 80 ? '#08F0FF' : '#FFFFFF',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {formatScore(athlete.score)}
                  </div>
                  
                  {/* Pillar Scores with Hover Bars */}
                  {athlete.score_breakdown ? [
                    { score: athlete.score_breakdown.strengthScore, color: '#5CFF5C' },
                    { score: athlete.score_breakdown.speedScore, color: '#FFA42D' },
                    { score: athlete.score_breakdown.vo2Score, color: '#B96DFF' },
                    { score: athlete.score_breakdown.distanceScore, color: '#16D7FF' },
                    { score: athlete.score_breakdown.volumeScore, color: '#F9F871' },
                    { score: athlete.score_breakdown.recoveryScore, color: '#2EFFC0' }
                  ].map((pillar, idx) => (
                    <div key={idx} style={{
                      textAlign: 'center',
                      position: 'relative'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        {pillar.score ? formatScore(pillar.score) : '--'}
                      </div>
                      {pillar.score && (
                        <div 
                          className="pillar-hover-bar"
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '36px',
                            height: '4px',
                            background: pillar.color,
                            borderRadius: '2px',
                            opacity: 0,
                            transition: 'opacity 0.2s'
                          }}
                        />
                      )}
                    </div>
                  )) : Array(6).fill(0).map((_, idx) => (
                    <div key={idx} style={{
                      textAlign: 'center',
                      color: '#8D9299',
                      fontSize: '14px'
                    }}>--</div>
                  ))}
                  
                  {/* Updated */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#8D9299',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {athlete.completed_at ? 
                      new Date(athlete.completed_at).toLocaleDateString() : 
                      '--'
                    }
                  </div>
                </div>
              );
            })
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

      {/* CTA Ribbon */}
      {showCTA && (
        <div style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          height: '72px',
          background: 'linear-gradient(90deg, rgba(8, 240, 255, 0.08), rgba(255, 45, 222, 0.08))',
          borderTop: '1px solid rgba(8, 240, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#FFFFFF',
              margin: '0',
              fontFamily: 'Inter, sans-serif'
            }}>
              Think you can crack the Top 3? ⇢ Start Hybrid Interview
            </h3>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: '#08F0FF',
                border: 'none',
                borderRadius: '24px',
                height: '48px',
                padding: '0 32px',
                color: '#000',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#FF2DDE';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#08F0FF';
              }}
            >
              Start Now
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes minimalCardRise {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes trophyGlow {
          0% {
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
          }
          100% {
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));
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

        /* Hover effect for pillar bars */
        div:hover .pillar-hover-bar {
          opacity: 1 !important;
        }

        /* Slider thumb styling */
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FF2DDE;
          cursor: pointer;
          transform: scale(1);
          transition: transform 0.2s;
        }

        input[type="range"]:active::-webkit-slider-thumb {
          transform: scale(1.1);
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FF2DDE;
          cursor: pointer;
          border: none;
          transform: scale(1);
          transition: transform 0.2s;
        }

        input[type="range"]:active::-moz-range-thumb {
          transform: scale(1.1);
        }

        /* Responsive */
        @media (max-width: 1279px) {
          .minimal-podium-card {
            transform: scale(0.9);
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