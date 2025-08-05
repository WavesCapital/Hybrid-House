import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, User, Calendar, MapPin, Trophy, TrendingUp, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const PublicProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [publicProfile, setPublicProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicProfile();
  }, [userId]);

  const fetchPublicProfile = async () => {
    try {
      setIsLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/public-profile/${userId}`);
      
      if (response.data.success && response.data.public_profile) {
        setPublicProfile(response.data.public_profile);
      } else {
        setError('Profile not found or not public');
      }
    } catch (err) {
      console.error('Error fetching public profile:', err);
      if (err.response?.status === 404) {
        setError('Profile not found');
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '';
    const flagEmojis = {
      'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'AU': '🇦🇺', 'DE': '🇩🇪', 
      'FR': '🇫🇷', 'ES': '🇪🇸', 'IT': '🇮🇹', 'JP': '🇯🇵', 'KR': '🇰🇷',
      'BR': '🇧🇷', 'MX': '🇲🇽', 'IN': '🇮🇳', 'CN': '🇨🇳', 'RU': '🇷🇺',
      'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮'
    };
    return flagEmojis[countryCode] || '🌍';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  const formatScore = (score) => {
    return Math.round(score || 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <style jsx>{`
          .loading-spinner {
            border: 2px solid #1A1C1D;
            border-top: 2px solid #08F0FF;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex items-center space-x-2 text-[#08F0FF] hover:text-[#08F0FF]/80 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Leaderboard</span>
          </button>
          
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/leaderboard')}
              className="px-6 py-3 bg-[#08F0FF] text-black rounded-lg hover:shadow-lg transition-all"
            >
              Back to Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <style jsx>{`
        .glass-card {
          background: rgba(24, 27, 29, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }
        
        .accent-gradient {
          background: linear-gradient(135deg, #08F0FF 0%, #B96DFF 100%);
        }
        
        .text-primary { color: #D9D9D9; }
        .text-secondary { color: #9FA1A3; }
        .text-muted { color: #6B6E71; }
        
        .score-table {
          background: rgba(15, 17, 18, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .score-table th {
          background: rgba(8, 240, 255, 0.1);
          color: #8D9299;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        
        .score-table td {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          .glass-card {
            padding: 1rem;
          }
          
          .text-2xl {
            font-size: 1.5rem;
          }
          
          .text-xl {
            font-size: 1.25rem;
          }
          
          .grid.md\\:grid-cols-2 {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .overflow-x-auto {
            margin-left: -1rem;
            margin-right: -1rem;
          }
          
          .score-table {
            min-width: 600px;
            font-size: 0.875rem;
          }
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/leaderboard')}
                className="flex items-center space-x-2 text-[#08F0FF] hover:text-[#08F0FF]/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:block">Back to Leaderboard</span>
              </button>
              <div className="h-4 sm:h-6 w-px bg-white/20"></div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 accent-gradient rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-primary">Hybrid House</h1>
                  <p className="text-xs text-muted hidden sm:block">Public Profile</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 accent-gradient rounded-full flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="glass-card p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 accent-gradient rounded-full flex items-center justify-center">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                {publicProfile.display_name}
              </h1>
              
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-secondary mb-4">
                {publicProfile.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{publicProfile.location}</span>
                  </div>
                )}
                
                {publicProfile.country && (
                  <div className="flex items-center space-x-2">
                    <span>{getCountryFlag(publicProfile.country)}</span>
                    <span>{publicProfile.country}</span>
                  </div>
                )}
                
                {publicProfile.age && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{publicProfile.age} years old</span>
                  </div>
                )}
                
                {publicProfile.gender && (
                  <div className="capitalize">
                    {publicProfile.gender}
                  </div>
                )}
              </div>
              
              <div className="flex justify-center sm:justify-start space-x-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#08F0FF]">
                    {publicProfile.total_assessments}
                  </div>
                  <div className="text-sm text-secondary">Assessments</div>
                </div>
                
                {publicProfile.athlete_profiles.length > 0 && (
                  <div>
                    <div className="text-2xl font-bold text-[#08F0FF]">
                      {formatScore(Math.max(...publicProfile.athlete_profiles.map(p => p.hybrid_score || 0)))}
                    </div>
                    <div className="text-sm text-secondary">Best Score</div>
                  </div>
                )}
                
                <div>
                  <div className="text-2xl font-bold text-[#08F0FF]">
                    {formatDate(publicProfile.created_at).split(',')[1]?.trim() || '2024'}
                  </div>
                  <div className="text-sm text-secondary">Joined</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hybrid Score History */}
        {publicProfile.athlete_profiles.length > 0 ? (
          <div className="glass-card p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-2">
                  Public Hybrid Scores
                </h3>
                <p className="text-sm text-secondary">
                  {publicProfile.display_name}'s public assessment history
                </p>
              </div>
              <Trophy className="w-6 h-6 text-[#08F0FF]" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full score-table rounded-lg overflow-hidden">
                <thead>
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-center p-3">Hybrid Score</th>
                    <th className="text-center p-3">Strength</th>
                    <th className="text-center p-3">Speed</th>
                    <th className="text-center p-3">VO₂</th>
                    <th className="text-center p-3">Distance</th>
                    <th className="text-center p-3">Volume</th>
                    <th className="text-center p-3">Recovery</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {publicProfile.athlete_profiles.map((profile, index) => {
                    const scoreData = profile.score_data || {};
                    return (
                      <tr key={profile.profile_id} className="hover:bg-white/5">
                        <td className="p-3 text-primary">
                          {formatDate(profile.created_at)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[#08F0FF] font-bold text-lg">
                            {formatScore(profile.hybrid_score)}
                          </span>
                        </td>
                        <td className="p-3 text-center text-[#5CFF5C]">
                          {formatScore(scoreData.strengthScore) || '—'}
                        </td>
                        <td className="p-3 text-center text-[#FFA42D]">
                          {formatScore(scoreData.speedScore) || '—'}
                        </td>
                        <td className="p-3 text-center text-[#B96DFF]">
                          {formatScore(scoreData.vo2Score) || '—'}
                        </td>
                        <td className="p-3 text-center text-[#16D7FF]">
                          {formatScore(scoreData.distanceScore) || '—'}
                        </td>
                        <td className="p-3 text-center text-[#F9F871]">
                          {formatScore(scoreData.volumeScore) || '—'}
                        </td>
                        <td className="p-3 text-center text-[#2EFFC0]">
                          {formatScore(scoreData.recoveryScore) || '—'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => window.open(`/hybrid-score/${profile.profile_id}`, '_blank')}
                            className="px-3 py-1 bg-[#08F0FF]/10 border border-[#08F0FF]/30 rounded text-[#08F0FF] text-sm hover:bg-[#08F0FF]/20 transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary mb-2">No Public Scores</h3>
            <p className="text-secondary">
              {publicProfile.display_name} hasn't made any scores public yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfileView;