import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, User, TrendingUp, Activity } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/leaderboard`);
      setLeaderboardData(response.data.leaderboard || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold" style={{ color: 'var(--txt)' }}>#{rank}</span>;
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return 'border-l-4 border-yellow-400 bg-gradient-to-r from-yellow-400/10 to-transparent';
      case 2:
        return 'border-l-4 border-gray-300 bg-gradient-to-r from-gray-300/10 to-transparent';
      case 3:
        return 'border-l-4 border-orange-400 bg-gradient-to-r from-orange-400/10 to-transparent';
      default:
        return 'border-l-4 border-[#08F0FF]/30';
    }
  };

  const formatScore = (score) => {
    return Math.round(score * 10) / 10; // Round to 1 decimal place
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0E0E11' }}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="glass-card p-8 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-[#08F0FF] animate-pulse" />
              <p style={{ color: 'var(--muted)' }}>Loading leaderboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: '#0E0E11' }}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="glass-card p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="neon-button"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0E0E11' }}>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="glass-card p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <Trophy className="w-12 h-12 text-[#08F0FF] mr-4" />
              <div>
                <h1 className="text-4xl font-bold" style={{ color: 'var(--txt)' }}>
                  Hybrid Athletes
                </h1>
                <p className="text-xl" style={{ color: 'var(--muted)' }}>
                  Global Leaderboard
                </p>
              </div>
            </div>
            <div className="hybrid-score-dial inline-block">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--txt)' }}>
                  {leaderboardData.length}
                </div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  Total Athletes
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-4">
            {leaderboardData.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <User className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted)' }} />
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--txt)' }}>
                  No Athletes Yet
                </h3>
                <p style={{ color: 'var(--muted)' }}>
                  Be the first to complete the hybrid assessment and claim the top spot!
                </p>
              </div>
            ) : (
              leaderboardData.map((athlete, index) => (
                <div
                  key={`${athlete.display_name}-${athlete.profile_id}`}
                  className={`glass-card p-6 transition-all duration-300 hover:scale-[1.02] ${getRankStyle(athlete.rank)}`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Rank and Name */}
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        {getRankIcon(athlete.rank)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold" style={{ color: 'var(--txt)' }}>
                          {athlete.display_name}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          Hybrid Athlete
                        </p>
                      </div>
                    </div>

                    {/* Right: Score */}
                    <div className="text-right">
                      <div className="text-3xl font-bold mb-1" style={{ 
                        color: athlete.rank <= 3 ? '#08F0FF' : 'var(--txt)',
                        textShadow: athlete.rank <= 3 ? '0 0 10px #08F0FFAA' : 'none'
                      }}>
                        {formatScore(athlete.score)}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--muted)' }}>
                        Hybrid Score
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown for Top 3 */}
                  {athlete.rank <= 3 && athlete.score_breakdown && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {Object.entries(athlete.score_breakdown).map(([key, value]) => {
                          if (value === null || value === undefined) return null;
                          const label = key.replace('_score', '').charAt(0).toUpperCase() + key.replace('_score', '').slice(1);
                          return (
                            <div key={key} className="text-center">
                              <div className="text-lg font-semibold" style={{ color: 'var(--txt)' }}>
                                {formatScore(value)}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                                {label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* CTA Section */}
          <div className="glass-card p-8 text-center">
            <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--txt)' }}>
              Ready to Compete?
            </h3>
            <p className="mb-6" style={{ color: 'var(--muted)' }}>
              Take the hybrid assessment and see where you rank among the world's top athletes.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="neon-button"
            >
              Start Your Assessment
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }

        .neon-button {
          background: linear-gradient(45deg, #08F0FF, #FF2DDE);
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .neon-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(8, 240, 255, 0.3);
        }

        .hybrid-score-dial {
          background: radial-gradient(circle at center, rgba(8, 240, 255, 0.1) 0%, transparent 70%);
          border: 2px solid rgba(8, 240, 255, 0.3);
          border-radius: 50%;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .hybrid-score-dial::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #08F0FF, #FF2DDE, #08F0FF);
          z-index: -1;
          animation: rotate 3s linear infinite;
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        :root {
          --txt: #FFFFFF;
          --muted: #94A3B8;
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;