import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, User, TrendingUp, Activity, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import SharedHeader from './SharedHeader';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Leaderboard = () => {
  const navigate = useNavigate();
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
  const [ageRange, setAgeRange] = useState([18, 100]);
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
    
    // Age range filter - include athletes with null/undefined age
    filtered = filtered.filter(athlete => {
      const age = athlete.age;
      // Include athletes with missing age data (null/undefined)
      if (age === null || age === undefined) return true;
      return age >= ageRange[0] && age <= ageRange[1];
    });
    
    // Gender filter - include athletes with null/undefined gender when "All" is selected
    if (genderFilter !== 'All') {
      filtered = filtered.filter(athlete => {
        const gender = athlete.gender;
        // If gender is null/undefined, exclude from specific gender filters
        if (!gender) return false;
        return gender.toLowerCase() === genderFilter.toLowerCase();
      });
    }
    
    // Country filter - include athletes with null/undefined country when "All" is selected
    if (countryFilter !== 'All') {
      filtered = filtered.filter(athlete => {
        const country = athlete.country;
        // If country is null/undefined, exclude from specific country filters
        if (!country) return false;
        return country.toLowerCase() === countryFilter.toLowerCase();
      });
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
      console.log('🏆 LEADERBOARD DATA DEBUG:', data); // Add debugging
      setLeaderboardData(data);
      console.log('🏆 PROCESSED DATA DEBUG - First athlete:', data[0]); // Show first athlete structure
      console.log('🏆 AVAILABLE FIELDS:', Object.keys(data[0] || {})); // Show all fields
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
        trophyIcon: <Trophy size={40} color="#FFD700" />,
        trophyColor: '#FFD700'
      },
      2: { 
        width: '220px', 
        height: '260px', 
        trophyIcon: <Trophy size={32} color="#C0C0C0" />,
        trophyColor: '#C0C0C0'
      },
      3: { 
        width: '220px', 
        height: '260px', 
        trophyIcon: <Trophy size={32} color="#CD7F32" />,
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
        onClick={() => {
          const id = athlete.profile_id;
          console.log('Clicking athlete:', athlete.first_name, athlete.last_name, 'with profile_id:', id, 'full athlete object:', athlete);
          navigate(`/hybrid-score/${id}`);
        }}
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
    <>
      <SharedHeader 
        title="Global Leaderboard"
        contextualActions={[
          {
            label: 'Get Hybrid Score',
            icon: <Activity className="w-4 h-4" />,
            onClick: () => navigate('/create-account'),
            variant: 'primary'
          }
        ]}
      />
      
      <div style={{ 
        minHeight: 'calc(100vh - 80px)', 
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
              color: '#08F0FF',
              textShadow: '0 0 20px rgba(8, 240, 255, 0.8), 0 0 40px rgba(8, 240, 255, 0.4), 0 0 60px rgba(8, 240, 255, 0.2)'
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
      </div>

      {/* Filters Bar - Sticky */}
      <div style={{
        position: 'sticky',
        top: '0',
        zIndex: 10,
        background: '#15161AEE',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #1F2025',
        padding: '12px 16px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Total Athletes Count */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#8D9299',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            <User size={12} />
            {leaderboardData.length} Athletes
          </div>

          {/* Score Range Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px' }}>
            <label style={{ 
              color: (scoreRange[0] > 0 || scoreRange[1] < 100) ? '#08F0FF' : '#8D9299', 
              fontSize: '11px', 
              fontWeight: '600', 
              textTransform: 'uppercase', 
              minWidth: '70px' 
            }}>
              Score: {scoreRange[0]}-{scoreRange[1]}
            </label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={scoreRange[0]}
                onMouseDown={() => setIsDragging('min')}
                onMouseUp={() => setIsDragging('')}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value);
                  if (newMin <= scoreRange[1]) {
                    setScoreRange([newMin, scoreRange[1]]);
                  }
                }}
                style={{
                  width: '50px',
                  height: '4px',
                  background: `linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) ${scoreRange[0]}%, ${(scoreRange[0] > 0 || scoreRange[1] < 100) ? '#08F0FF' : '#6B7280'} ${scoreRange[0]}%, ${(scoreRange[0] > 0 || scoreRange[1] < 100) ? '#08F0FF' : '#6B7280'} ${scoreRange[1]}%, rgba(255,255,255,0.1) ${scoreRange[1]}%, rgba(255,255,255,0.1) 100%)`,
                  outline: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  appearance: 'none'
                }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={scoreRange[1]}
                onMouseDown={() => setIsDragging('max')}
                onMouseUp={() => setIsDragging('')}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value);
                  if (newMax >= scoreRange[0]) {
                    setScoreRange([scoreRange[0], newMax]);
                  }
                }}
                style={{
                  width: '50px',
                  height: '4px',
                  background: `linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) ${scoreRange[0]}%, ${(scoreRange[0] > 0 || scoreRange[1] < 100) ? '#08F0FF' : '#6B7280'} ${scoreRange[0]}%, ${(scoreRange[0] > 0 || scoreRange[1] < 100) ? '#08F0FF' : '#6B7280'} ${scoreRange[1]}%, rgba(255,255,255,0.1) ${scoreRange[1]}%, rgba(255,255,255,0.1) 100%)`,
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
                  left: isDragging === 'min' ? `${scoreRange[0]}%` : `${scoreRange[1]}%`,
                  transform: 'translateX(-50%)',
                  background: '#08F0FF',
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  zIndex: 10
                }}>
                  {isDragging === 'min' ? scoreRange[0] : scoreRange[1]}
                </div>
              )}
            </div>
          </div>

          {/* Age Range Filter - Simplified for mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
            <label style={{ 
              color: (ageRange[0] > 18 || ageRange[1] < 100) ? '#08F0FF' : '#8D9299', 
              fontSize: '11px', 
              fontWeight: '600', 
              textTransform: 'uppercase', 
              minWidth: '40px' 
            }}>
              Age: {ageRange[0]}-{ageRange[1]}
            </label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                type="range"
                min="18"
                max="100"
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
                  width: '50px',
                  height: '4px',
                  background: `linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) ${((ageRange[0]-18)/(100-18))*100}%, ${(ageRange[0] > 18 || ageRange[1] < 100) ? '#08F0FF' : '#6B7280'} ${((ageRange[0]-18)/(100-18))*100}%, ${(ageRange[0] > 18 || ageRange[1] < 100) ? '#08F0FF' : '#6B7280'} ${((ageRange[1]-18)/(100-18))*100}%, rgba(255,255,255,0.1) ${((ageRange[1]-18)/(100-18))*100}%, rgba(255,255,255,0.1) 100%)`,
                  outline: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  appearance: 'none'
                }}
              />
              <input
                type="range"
                min="18"
                max="100"
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
                  width: '50px',
                  height: '4px',
                  background: `linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) ${((ageRange[0]-18)/(100-18))*100}%, ${(ageRange[0] > 18 || ageRange[1] < 100) ? '#08F0FF' : '#6B7280'} ${((ageRange[0]-18)/(100-18))*100}%, ${(ageRange[0] > 18 || ageRange[1] < 100) ? '#08F0FF' : '#6B7280'} ${((ageRange[1]-18)/(100-18))*100}%, rgba(255,255,255,0.1) ${((ageRange[1]-18)/(100-18))*100}%, rgba(255,255,255,0.1) 100%)`,
                  outline: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  appearance: 'none'
                }}
              />
            </div>
          </div>

          {/* Gender Pills - Compact for mobile */}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <span style={{ 
              color: genderFilter !== 'All' ? '#08F0FF' : '#8D9299', 
              fontSize: '11px', 
              fontWeight: '600', 
              textTransform: 'uppercase', 
              marginRight: '4px' 
            }}>
              Gender:
            </span>
            {['All', 'Male', 'Female'].map(gender => (
              <button
                key={gender}
                onClick={() => setGenderFilter(gender)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  background: genderFilter === gender ? (gender === 'All' ? 'rgba(255, 255, 255, 0.1)' : '#08F0FF') : 'rgba(255, 255, 255, 0.1)',
                  color: genderFilter === gender ? (gender === 'All' ? '#FFFFFF' : '#000') : '#8D9299',
                  minHeight: '32px'
                }}
              >
                {gender === 'All' ? 'All' : gender.charAt(0)}
              </button>
            ))}
          </div>

          {/* Country Dropdown - Simplified */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ 
              color: countryFilter !== 'All' ? '#08F0FF' : '#8D9299', 
              fontSize: '11px', 
              fontWeight: '600', 
              textTransform: 'uppercase' 
            }}>
              Country:
            </label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: countryFilter !== 'All' ? '1px solid #08F0FF' : '1px solid rgba(255, 255, 255, 0.1)',
                background: countryFilter !== 'All' ? 'rgba(8, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                color: countryFilter !== 'All' ? '#08F0FF' : '#FFFFFF',
                fontSize: '11px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
                minHeight: '32px'
              }}
            >
              <option value="All" style={{ background: '#1A1B1F', color: '#FFFFFF' }}>All</option>
              {getUniqueCountries().map(country => (
                <option key={country} value={country} style={{ background: '#1A1B1F', color: '#FFFFFF' }}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input - Hidden on mobile, shown as expandable button */}
          <div style={{ position: 'relative', marginLeft: 'auto', display: window.innerWidth > 640 ? 'block' : 'none' }}>
            <Search size={14} style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: searchQuery ? '#08F0FF' : '#8D9299'
            }} />
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '120px',
                padding: '6px 8px 6px 28px',
                borderRadius: '6px',
                border: searchQuery ? '1px solid #08F0FF' : '1px solid rgba(255, 255, 255, 0.1)',
                background: searchQuery ? 'rgba(8, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                fontSize: '12px',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                minHeight: '32px'
              }}
            />
          </div>

          {/* Active Filters Count */}
          {(genderFilter !== 'All' || countryFilter !== 'All' || searchQuery || scoreRange[0] > 0 || scoreRange[1] < 100 || ageRange[0] > 18 || ageRange[1] < 100) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              background: 'rgba(8, 240, 255, 0.1)',
              border: '1px solid rgba(8, 240, 255, 0.3)',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#08F0FF',
              textTransform: 'uppercase'
            }}>
              <Filter size={10} />
              {filteredData.length}/{leaderboardData.length}
              <button
                onClick={() => {
                  setScoreRange([0, 100]);
                  setAgeRange([18, 100]);
                  setGenderFilter('All');
                  setCountryFilter('All');
                  setSearchQuery('');
                }}
                style={{
                  background: 'rgba(8, 240, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '1px 4px',
                  color: '#08F0FF',
                  fontSize: '9px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div style={{ padding: '20px 16px', paddingBottom: '100px' }}>
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
          {/* Mobile Card Layout for small screens */}
          <div className="mobile-leaderboard" style={{ display: 'none' }}>
            {filteredData.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#8D9299'
              }}>
                <TrendingUp size={48} style={{ margin: '0 auto 16px', color: '#08F0FF' }} />
                <h3 style={{ color: '#FFFFFF', marginBottom: '8px' }}>No athletes match those filters</h3>
                <p>Try adjusting your filters to see more results</p>
              </div>
            ) : (
              filteredData.map((athlete, index) => (
                <div 
                  key={athlete.profile_id || index} 
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => {
                    const id = athlete.profile_id;
                    console.log('Clicking mobile athlete:', athlete.first_name, athlete.last_name, 'with profile_id:', id);
                    navigate(`/hybrid-score/${id}`);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(8, 240, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    minWidth: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(8, 240, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#08F0FF'
                  }}>
                    {index + 1}
                  </div>
                  
                  {/* Main Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <button
                        onClick={() => navigate(`/athlete/${athlete.user_id}`)}
                        style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#FFFFFF',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: '0',
                          textDecoration: 'none',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = '#08F0FF';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = '#FFFFFF';
                        }}
                      >
                        {athlete.display_name}
                      </button>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#08F0FF'
                      }}>
                        {formatScore(athlete.score)}
                      </div>
                    </div>
                    
                    {/* Demographic info */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#8D9299',
                      marginBottom: '8px'
                    }}>
                      {athlete.age && <span>Age {athlete.age}</span>}
                      {athlete.gender && <span>• {athlete.gender}</span>}
                      {athlete.country && (
                        <span>• {getCountryFlag(athlete.country)} {athlete.country}</span>
                      )}
                    </div>
                    
                    {/* Score breakdown - compact */}
                    {athlete.score_breakdown && (
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        {[
                          { label: 'STR', value: athlete.score_breakdown.strengthScore, color: '#5CFF5C' },
                          { label: 'SPD', value: athlete.score_breakdown.speedScore, color: '#FFA42D' },
                          { label: 'VO₂', value: athlete.score_breakdown.vo2Score, color: '#B96DFF' },
                          { label: 'REC', value: athlete.score_breakdown.recoveryScore, color: '#2EFFC0' }
                        ].map(item => (
                          <div key={item.label} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: '10px',
                            color: item.color
                          }}>
                            <span style={{ fontWeight: '600' }}>{item.label}</span>
                            <span>{Math.round(item.value || 0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Desktop Table Layout */}
          <div className="desktop-leaderboard" style={{ display: 'block' }}>
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
              <div style={{ color: '#8D9299', cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('rank')}>
                RANK {sortColumn === 'rank' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
              </div>
              <div style={{ color: '#8D9299', cursor: 'pointer', textAlign: 'left' }} onClick={() => handleSort('name')}>
                NAME {sortColumn === 'name' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
              </div>
              <div style={{ color: '#8D9299', textAlign: 'center' }}>AGE</div>
              <div style={{ color: '#8D9299', textAlign: 'center' }}>GENDER</div>
              <div style={{ color: '#8D9299', textAlign: 'center' }}>COUNTRY</div>
              <div style={{ color: sortColumn === 'hybrid' ? '#08F0FF' : '#8D9299', cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                   onClick={() => handleSort('hybrid')}
                   className="score-tooltip-container">
                HYBRID {sortColumn === 'hybrid' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
                <div className="score-tooltip">
                  <div style={{fontWeight: '700', marginBottom: '8px', color: '#08F0FF'}}>Hybrid Score</div>
                  <div style={{fontSize: '12px', lineHeight: '1.4'}}>
                    Final composite score combining all pillars:<br/>
                    • 40% Strength Score<br/>
                    • 40% Endurance Score<br/>
                    • 10% Recovery Score<br/>
                    • Balance Bonus (up to +10)<br/>
                    • Data Completeness Penalty
                  </div>
                </div>
              </div>
              <div style={{ color: '#5CFF5C', cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                   onClick={() => handleSort('str')}
                   className="score-tooltip-container">
                STR {sortColumn === 'str' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
                <div className="score-tooltip">
                  <div style={{fontWeight: '700', marginBottom: '8px', color: '#5CFF5C'}}>Strength Score</div>
                  <div style={{fontSize: '12px', lineHeight: '1.4'}}>
                    Based on 1-RM ratios to bodyweight:<br/>
                    • Bench: 1.5x (M), 1.0x (F)<br/>
                    • Squat: 2.0x (M), 1.5x (F)<br/>
                    • Deadlift: 2.4x (M), 1.8x (F)<br/>
                    Average of available lifts vs targets
                  </div>
                </div>
              </div>
              <div style={{ color: '#FFA42D', cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                   onClick={() => handleSort('spd')}
                   className="score-tooltip-container">
                SPD {sortColumn === 'spd' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
                <div className="score-tooltip">
                  <div style={{fontWeight: '700', marginBottom: '8px', color: '#FFA42D'}}>Speed Score</div>
                  <div style={{fontSize: '12px', lineHeight: '1.4'}}>
                    Based on mile time performance:<br/>
                    • Elite target: 5:30 (M), 6:15 (F)<br/>
                    • Scoring cap: 330s (M), 375s (F)<br/>
                    • Faster times = higher scores<br/>
                    One of four endurance pillars
                  </div>
                </div>
              </div>
              <div style={{ color: '#B96DFF', cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                   onClick={() => handleSort('vo2')}
                   className="score-tooltip-container">
                VO₂ {sortColumn === 'vo2' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
                <div className="score-tooltip">
                  <div style={{fontWeight: '700', marginBottom: '8px', color: '#B96DFF'}}>VO₂ Max Score</div>
                  <div style={{fontSize: '12px', lineHeight: '1.4'}}>
                    Aerobic fitness capacity:<br/>
                    • Elite target: 70 (M), 60 (F)<br/>
                    • Baseline: 30 ml/kg/min<br/>
                    • Estimated from mile time if not provided<br/>
                    One of four endurance pillars
                  </div>
                </div>
              </div>
              <div style={{ color: '#16D7FF', cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                   onClick={() => handleSort('dist')}
                   className="score-tooltip-container">
                DIST {sortColumn === 'dist' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
                <div className="score-tooltip">
                  <div style={{fontWeight: '700', marginBottom: '8px', color: '#16D7FF'}}>Distance Score</div>
                  <div style={{fontSize: '12px', lineHeight: '1.4'}}>
                    Longest single run capacity:<br/>
                    • Half Marathon: 13.1 mi (60% max)<br/>
                    • Full Marathon: 26.2 mi (80% max)<br/>
                    • Ultra Distance: 50+ mi (100%)<br/>
                    One of four endurance pillars
                  </div>
                </div>
              </div>
              <div style={{ color: '#F9F871', cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                   onClick={() => handleSort('vol')}
                   className="score-tooltip-container">
                VOL {sortColumn === 'vol' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
                <div className="score-tooltip">
                  <div style={{fontWeight: '700', marginBottom: '8px', color: '#F9F871'}}>Volume Score</div>
                  <div style={{fontSize: '12px', lineHeight: '1.4'}}>
                    Weekly running volume:<br/>
                    • Moderate: 20 miles (60% max)<br/>
                    • High: 40 miles (80% max)<br/>
                    • Elite: 50+ miles (100%)<br/>
                    One of four endurance pillars
                  </div>
                </div>
              </div>
              <div style={{ color: '#2EFFC0', cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                   onClick={() => handleSort('rec')}
                   className="score-tooltip-container">
                REC {sortColumn === 'rec' && (sortDirection === 'asc' ? <ChevronUp size={12} style={{display: 'inline', color: '#08F0FF'}} /> : <ChevronDown size={12} style={{display: 'inline', color: '#08F0FF'}} />)}
                <div className="score-tooltip">
                  <div style={{fontWeight: '700', marginBottom: '8px', color: '#2EFFC0'}}>Recovery Score</div>
                  <div style={{fontSize: '12px', lineHeight: '1.4'}}>
                    Recovery and readiness metrics:<br/>
                    • HRV: Higher = better recovery<br/>
                    • Resting HR: Lower = better fitness<br/>
                    • Sleep quality and duration<br/>
                    Critical for hybrid performance
                  </div>
                </div>
              </div>
              <div style={{ color: '#8D9299', textAlign: 'center' }}>ACTIONS</div>
            </div>

            {/* Table Rows */}
            {filteredData.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#8D9299'
              }}>
                <TrendingUp size={48} style={{ margin: '0 auto 16px', color: '#08F0FF' }} />
                <h3 style={{ color: '#FFFFFF', marginBottom: '8px' }}>No athletes match those filters</h3>
                <p>Try adjusting your filters to see more results</p>
              </div>
            ) : (
              filteredData.map((athlete, index) => (
                <div 
                  key={athlete.profile_id || index} 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 200px 80px 80px 100px 100px repeat(6, 80px) 120px',
                    padding: '12px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                    alignItems: 'center',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'background-color 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const id = athlete.profile_id;
                    console.log('Clicking desktop athlete:', athlete.first_name, athlete.last_name, 'with profile_id:', id);
                    navigate(`/hybrid-score/${id}`);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(8, 240, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent';
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#08F0FF'
                  }}>
                    {index + 1}
                  </div>
                  
                  {/* Name */}
                  <button
                    onClick={() => navigate(`/athlete/${athlete.user_id}`)}
                    style={{
                      color: '#FFFFFF',
                      fontWeight: '600',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '0',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#08F0FF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#FFFFFF';
                    }}
                  >
                    {athlete.display_name}
                  </button>
                  
                  {/* Age */}
                  <div style={{
                    textAlign: 'center',
                    color: athlete.age ? '#FFFFFF' : '#8D9299'
                  }}>
                    {athlete.age || '—'}
                  </div>
                  
                  {/* Gender */}
                  <div style={{
                    textAlign: 'center',
                    color: athlete.gender ? '#FFFFFF' : '#8D9299',
                    textTransform: 'capitalize'
                  }}>
                    {athlete.gender || '—'}
                  </div>
                  
                  {/* Country */}
                  <div style={{
                    textAlign: 'center',
                    color: athlete.country ? '#FFFFFF' : '#8D9299'
                  }}>
                    {athlete.country ? `${getCountryFlag(athlete.country)} ${athlete.country}` : '—'}
                  </div>
                  
                  {/* Hybrid Score */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#08F0FF'
                  }}>
                    {formatScore(athlete.score)}
                  </div>
                  
                  {/* Sub-scores */}
                  {athlete.score_breakdown ? [
                    { key: 'strengthScore', color: '#5CFF5C' },
                    { key: 'speedScore', color: '#FFA42D' },
                    { key: 'vo2Score', color: '#B96DFF' },
                    { key: 'distanceScore', color: '#16D7FF' },
                    { key: 'volumeScore', color: '#F9F871' },
                    { key: 'recoveryScore', color: '#2EFFC0' }
                  ].map(({ key, color }) => (
                    <div key={key} style={{
                      textAlign: 'center',
                      color: athlete.score_breakdown[key] ? color : '#8D9299',
                      fontWeight: '600'
                    }}>
                      {athlete.score_breakdown[key] ? Math.round(athlete.score_breakdown[key]) : '—'}
                    </div>
                  )) : (
                    Array(6).fill(null).map((_, i) => (
                      <div key={i} style={{ textAlign: 'center', color: '#8D9299' }}>—</div>
                    ))
                  )}
                  
                  {/* Actions */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => window.open(`/hybrid-score/${athlete.profile_id}`, '_blank')}
                      style={{
                        background: 'rgba(8, 240, 255, 0.1)',
                        border: '1px solid rgba(8, 240, 255, 0.3)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        color: '#08F0FF',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(8, 240, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(8, 240, 255, 0.1)';
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile/Desktop Media Query CSS */}
      <style>
        {`
          @media (max-width: 768px) {
            .mobile-leaderboard { display: block !important; }
            .desktop-leaderboard { display: none !important; }
          }
          
          @media (min-width: 769px) {
            .mobile-leaderboard { display: none !important; }
            .desktop-leaderboard { display: block !important; }
          }
        `}
      </style>

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

        /* Score Tooltip Styles */
        .score-tooltip-container {
          position: relative;
        }

        .score-tooltip {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
          padding: 12px 16px;
          background: rgba(21, 22, 26, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(8, 240, 255, 0.3);
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 12px;
          line-height: 1.4;
          white-space: nowrap;
          z-index: 1000;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
          transform: translateX(-50%) translateY(-4px);
          width: 280px;
          white-space: normal;
        }

        .score-tooltip-container:hover .score-tooltip {
          opacity: 1;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0);
        }

        .score-tooltip::before {
          content: '';
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid rgba(8, 240, 255, 0.3);
        }

        /* Slider thumb styling */
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #08F0FF;
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
          background: #08F0FF;
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
          
          .score-tooltip {
            width: 240px;
          }
        }
      `}</style>
      </div>
    </>
  );
};

export default Leaderboard;