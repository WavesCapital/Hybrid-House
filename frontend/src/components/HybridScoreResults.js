import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { 
  Trophy, Target, AlertCircle, Dumbbell, Zap, Heart, MapPin, 
  BarChart3, Activity, Moon, ArrowLeft, Share2, Download
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const HybridScoreResults = () => {
  const { profileId } = useParams();
  const [scoreData, setScoreData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedScores, setAnimatedScores] = useState({});
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Animate score numbers
  const animateScores = (data) => {
    const scoresToAnimate = [
      { key: 'hybrid', value: data.hybridScore },
      { key: 'strength', value: data.strengthScore },
      { key: 'speed', value: data.speedScore },
      { key: 'vo2', value: data.vo2Score },
      { key: 'distance', value: data.distanceScore },
      { key: 'volume', value: data.volumeScore },
      { key: 'endurance', value: data.enduranceScore },
      { key: 'recovery', value: data.recoveryScore }
    ];

    scoresToAnimate.forEach(({ key, value }) => {
      if (value) {
        const targetValue = parseFloat(value);
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const currentValue = targetValue * progress;
          
          setAnimatedScores(prev => ({
            ...prev,
            [key]: currentValue
          }));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    });
  };

  // Fetch score data from Supabase
  useEffect(() => {
    const fetchScoreData = async () => {
      if (!profileId || !session) return;

      try {
        setIsLoading(true);
        
        const response = await axios.get(
          `${BACKEND_URL}/api/athlete-profile/${profileId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const { profile_json, score_data } = response.data;
        
        if (score_data) {
          setScoreData(score_data);
          setProfileData(profile_json);
          // Animate scores
          setTimeout(() => animateScores(score_data), 500);
        } else {
          toast({
            title: "Score data not found",
            description: "The score data for this profile is not available.",
            variant: "destructive",
          });
          navigate('/');
        }
        
      } catch (error) {
        console.error('Error fetching score data:', error);
        toast({
          title: "Error loading score data",
          description: "Failed to load your hybrid score. Please try again.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScoreData();
  }, [profileId, session, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0B0C' }}>
        <div className="text-center">
          <div className="neo-primary text-xl mb-4">Loading your hybrid score...</div>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0B0C' }}>
        <div className="text-center">
          <div className="neo-primary text-xl mb-4">Score data not found</div>
          <Button onClick={() => navigate('/')} className="neo-btn-primary">
            Go Back to Interview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0B0C' }}>
      <style>
        {`
        .neo-card {
          background: linear-gradient(135deg, rgba(217, 217, 217, 0.1) 0%, rgba(159, 161, 163, 0.05) 100%);
          border: 1px solid rgba(217, 217, 217, 0.2);
          backdrop-filter: blur(10px);
        }
        .neo-primary {
          color: #79CFF7;
        }
        .neo-text-primary {
          color: #D9D9D9;
        }
        .neo-text-secondary {
          color: #9FA1A3;
        }
        .neo-text-muted {
          color: #6B7280;
        }
        .neo-btn-primary {
          background: linear-gradient(135deg, #79CFF7 0%, #4FC3F7 100%);
          color: #0A0B0C;
          border: none;
          font-weight: 600;
        }
        .neo-btn-primary:hover {
          background: linear-gradient(135deg, #4FC3F7 0%, #79CFF7 100%);
          transform: translateY(-1px);
        }
        .neo-btn-secondary {
          background: rgba(159, 161, 163, 0.1);
          color: #D9D9D9;
          border: 1px solid rgba(159, 161, 163, 0.3);
        }
        .neo-btn-secondary:hover {
          background: rgba(159, 161, 163, 0.2);
          color: #D9D9D9;
        }
        `}
      </style>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/')}
              className="neo-btn-secondary"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Interview
            </Button>
            <div>
              <h1 className="text-3xl font-bold neo-primary">Your Hybrid Score</h1>
              <p className="neo-text-secondary">
                Complete analysis for {profileData?.first_name || 'your profile'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button className="neo-btn-secondary" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share Score
            </Button>
            <Button className="neo-btn-secondary" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Score Display */}
        <div className="space-y-8">
          {/* Hybrid Score Section */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-5xl font-bold neo-text-primary mb-4">Your Hybrid Score</h2>
              <div className="text-8xl font-bold neo-primary mb-6" style={{ lineHeight: '1' }}>
                {animatedScores.hybrid ? Math.round(animatedScores.hybrid) : Math.round(parseFloat(scoreData.hybridScore))}
              </div>
              <p className="text-xl neo-text-secondary max-w-2xl mx-auto mb-6">
                Your overall hybrid-fitness score on a 0-100 scale
              </p>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {[
                { key: 'strength', label: 'Strength', value: scoreData.strengthScore, comment: scoreData.strengthComment, color: '#79CFF7', icon: Dumbbell },
                { key: 'speed', label: 'Speed', value: scoreData.speedScore, comment: scoreData.speedComment, color: '#85E26E', icon: Zap },
                { key: 'vo2', label: 'VO₂ Max', value: scoreData.vo2Score, comment: scoreData.vo2Comment, color: '#8D5CFF', icon: Heart },
                { key: 'distance', label: 'Distance', value: scoreData.distanceScore, comment: scoreData.distanceComment, color: '#79CFF7', icon: MapPin },
                { key: 'volume', label: 'Volume', value: scoreData.volumeScore, comment: scoreData.volumeComment, color: '#85E26E', icon: BarChart3 },
                { key: 'endurance', label: 'Endurance', value: scoreData.enduranceScore, comment: scoreData.enduranceComment, color: '#8D5CFF', icon: Activity },
                { key: 'recovery', label: 'Recovery', value: scoreData.recoveryScore, comment: scoreData.recoveryComment, color: '#79CFF7', icon: Moon }
              ].map((score) => {
                const IconComponent = score.icon;
                return (
                  <div key={score.key} className="neo-card rounded-xl p-6 hover:scale-105 transition-transform duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ 
                        background: `${score.color}20`,
                        border: `2px solid ${score.color}` 
                      }}>
                        <IconComponent className="h-6 w-6" style={{ color: score.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="neo-text-primary font-semibold">{score.label}</h3>
                          <div className="text-2xl font-bold neo-text-primary">
                            {animatedScores[score.key] ? Math.round(animatedScores[score.key]) : Math.round(parseFloat(score.value))}
                          </div>
                        </div>
                        <p className="neo-text-secondary text-sm leading-relaxed">
                          {score.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Balance & Penalty Information */}
            {(scoreData.balanceBonus > 0 || scoreData.hybridPenalty > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {scoreData.balanceBonus > 0 && (
                  <div className="rounded-xl p-6" style={{ 
                    background: 'linear-gradient(135deg, rgba(121, 207, 247, 0.1), rgba(133, 226, 110, 0.1))',
                    border: '1px solid rgba(121, 207, 247, 0.3)'
                  }}>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ 
                        background: 'rgba(121, 207, 247, 0.2)',
                        border: '2px solid #79CFF7' 
                      }}>
                        <Trophy className="h-5 w-5 neo-primary" />
                      </div>
                      <h4 className="text-lg font-semibold neo-primary">Balance Bonus: +{Math.round(scoreData.balanceBonus)}</h4>
                    </div>
                    <p className="neo-text-secondary">{scoreData.balanceComment}</p>
                  </div>
                )}
                
                {scoreData.hybridPenalty > 0 && (
                  <div className="rounded-xl p-6" style={{ 
                    background: 'linear-gradient(135deg, rgba(255, 75, 75, 0.1), rgba(255, 75, 75, 0.05))',
                    border: '1px solid rgba(255, 75, 75, 0.3)'
                  }}>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ 
                        background: 'rgba(255, 75, 75, 0.2)',
                        border: '2px solid #FF4B4B' 
                      }}>
                        <AlertCircle className="h-5 w-5" style={{ color: '#FF4B4B' }} />
                      </div>
                      <h4 className="text-lg font-semibold" style={{ color: '#FF4B4B' }}>Penalty: -{Math.round(scoreData.hybridPenalty)}</h4>
                    </div>
                    <p className="neo-text-secondary">{scoreData.penaltyComment}</p>
                  </div>
                )}
              </div>
            )}

            {/* Hybrid Score Commentary */}
            <div className="neo-card rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold neo-text-primary mb-4 flex items-center space-x-2">
                <Trophy className="h-6 w-6 neo-primary" />
                <span>Your Hybrid Profile</span>
              </h3>
              <p className="neo-text-secondary text-lg leading-relaxed">
                {scoreData.hybridComment}
              </p>
            </div>

            {/* Actionable Tips */}
            {scoreData.tips && scoreData.tips.length > 0 && (
              <div className="neo-card rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold neo-text-primary mb-6 flex items-center space-x-2">
                  <Target className="h-6 w-6 neo-primary" />
                  <span>Action Plan</span>
                </h3>
                <div className="space-y-4">
                  {scoreData.tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ 
                        background: 'rgba(121, 207, 247, 0.2)',
                        border: '2px solid #79CFF7' 
                      }}>
                        <span className="text-xs font-bold neo-primary">{index + 1}</span>
                      </div>
                      <p className="neo-text-secondary leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/')}
                className="neo-btn-primary px-8 py-3"
              >
                Take Another Assessment
              </Button>
              <Button
                onClick={() => navigate('/full-interview')}
                className="neo-btn-secondary px-8 py-3"
              >
                Try Full Interview (55 Questions)
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HybridScoreResults;