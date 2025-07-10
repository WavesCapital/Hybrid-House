import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Loader2, Trophy, Target, Calendar, Apple, Zap, Heart, Activity, 
  CheckCircle, Clock, MapPin, Utensils, Dumbbell, Timer, 
  TrendingUp, Star, Award, BarChart3, Scale, Brain, ExternalLink,
  Flame, Droplets, Moon, Coffee, AlertCircle, ChevronRight, Shield,
  CheckCircle2, Bed, Smartphone, Info, Pill, Plus, Share2, Download
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AthleteProfile = () => {
  const [athleteProfile, setAthleteProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [scoreData, setScoreData] = useState(null);
  const [error, setError] = useState(null);
  const [animatedScores, setAnimatedScores] = useState({});
  const [progressInterval, setProgressInterval] = useState(null);

  const callWebhook = async (athleteProfileData, deliverable) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000);

    try {
      const response = await fetch('https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          athleteProfile: athleteProfileData,
          deliverable: deliverable
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout for ${deliverable} (4 minutes)`);
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!athleteProfile.trim()) return;

    setLoading(true);
    setError(null);
    setScoreData(null);
    setLoadingProgress(0);
    
    // Clear any existing interval
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    // Start progress animation for 55 seconds
    let progress = 0;
    const interval = setInterval(() => {
      progress += (100 / 55); // 55 seconds for score
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setLoadingProgress(Math.min(progress, 100));
    }, 1000);
    setProgressInterval(interval);

    try {
      let athleteProfileData;
      try {
        athleteProfileData = JSON.parse(athleteProfile);
      } catch {
        athleteProfileData = athleteProfile;
      }

      // Only call score webhook
      const data = await callWebhook(athleteProfileData, 'score');
      
      // Clear interval and set progress to 100%
      if (interval) {
        clearInterval(interval);
      }
      setLoadingProgress(100);
      setScoreData(data);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      if (interval) {
        clearInterval(interval);
      }
    } finally {
      setLoading(false);
    }
  };

  // Animate score counters
  useEffect(() => {
    const data = scoreData?.[0] || scoreData;
    if (data) {
      const scores = {
        hybrid: parseFloat(data.hybridScore),
        strength: parseFloat(data.strengthScore),
        endurance: parseFloat(data.enduranceScore),
        bodyComp: parseFloat(data.bodyCompScore),
        recovery: parseFloat(data.recoveryScore),
        balance: parseFloat(data.balanceBonus)
      };

      Object.entries(scores).forEach(([key, targetValue]) => {
        let currentValue = 0;
        const increment = targetValue / 50;
        const timer = setInterval(() => {
          currentValue += increment;
          if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
          }
          setAnimatedScores(prev => ({ ...prev, [key]: currentValue }));
        }, 20);
      });
    }
  }, [scoreData]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);

  const data = scoreData?.[0] || scoreData;
  const showCheckmark = !loading && loadingProgress === 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <style jsx>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>

      {/* Header with action buttons when results are shown */}
      {data && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Athlete Profile
              </h1>
              <div className="flex space-x-2 sm:space-x-3">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2"
                  onClick={() => {/* TODO: Navigate to training plan creation */}}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Training Plan
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2"
                  onClick={() => {/* TODO: Navigate to nutrition plan creation */}}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Nutrition Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header - Only show when no results */}
          {!data && (
            <div className="text-center mb-8 sm:mb-12 px-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent leading-tight">
                Athlete Profile
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Get your hybrid athlete score and unlock your athletic potential
              </p>
              
              {/* Create Profile Button */}
              <div className="mb-6 sm:mb-8">
                <a
                  href="https://chatgpt.com/g/g-686e85594828819185c3264c65086ae2-hybrid-house-interviewer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                >
                  Create Profile
                </a>
              </div>

              {/* Input Form */}
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 backdrop-blur-sm shadow-2xl max-w-4xl mx-auto">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl sm:text-2xl text-white flex items-center justify-center gap-2 sm:gap-3">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                    Paste your athlete profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <Textarea
                      placeholder="Paste your athlete profile here..."
                      value={athleteProfile}
                      onChange={(e) => setAthleteProfile(e.target.value)}
                      className="min-h-[120px] sm:min-h-[140px] bg-gray-800/70 border-gray-600 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
                      disabled={loading}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={loading || !athleteProfile.trim()}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          Analyzing Profile...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          Get My Hybrid Score
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading Status */}
          {loading && (
            <div className={`space-y-6 sm:space-y-8 px-4 ${data ? 'pt-20' : ''}`}>
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Calculating Your Hybrid Score</h2>
                <p className="text-gray-400 text-sm sm:text-base">Analyzing your athletic profile...</p>
              </div>
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center space-x-3 sm:space-x-4 p-4 sm:p-6 bg-gray-800/30 rounded-xl border border-gray-700">
                  <div className={`p-2 sm:p-3 rounded-full transition-all duration-500 ${
                    showCheckmark ? 'bg-green-500/20 scale-110' : 'bg-blue-500/20 animate-pulse'
                  }`}>
                    {showCheckmark ? (
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 animate-pulse" />
                    ) : (
                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold transition-colors duration-300 text-sm sm:text-base ${
                      showCheckmark ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      Performance Analysis
                    </h3>
                    <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3 mt-2 overflow-hidden">
                      <div 
                        className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${
                          showCheckmark ? 'bg-green-400' : 'bg-blue-400'
                        }`}
                        style={{ 
                          width: `${Math.min(loadingProgress, 100)}%`,
                          transition: showCheckmark ? 'width 0.5s ease-out, background-color 0.5s ease-out' : 'width 0.3s ease-out'
                        }}
                      />
                    </div>
                    {!showCheckmark && (
                      <div className="text-xs text-gray-400 mt-1">
                        {Math.round(loadingProgress)}% complete
                      </div>
                    )}
                    {showCheckmark && (
                      <div className="text-xs text-green-400 mt-1 animate-fade-in">
                        ✓ Complete
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Card className="bg-red-900/20 border-red-700 mb-8">
              <CardContent className="p-6">
                <p className="text-red-400 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Error: {error}</span>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Hybrid Score Results */}
          {data && (
            <div className={`space-y-6 sm:space-y-8 px-4 ${loading ? '' : 'pt-20'}`}>
              
              {/* Hybrid Score Section */}
              <section className="space-y-6 sm:space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">Your Hybrid Score</h2>
                  <div className="text-6xl sm:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
                    {animatedScores.hybrid ? Math.round(animatedScores.hybrid) : Math.round(parseFloat(data.hybridScore))}
                  </div>
                  <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
                    Your overall hybrid-fitness score on a 0-100 scale
                  </p>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {[
                    { key: 'strength', label: 'Strength', value: data.strengthScore, icon: Dumbbell, color: 'from-orange-500 to-red-500' },
                    { key: 'endurance', label: 'Endurance', value: data.enduranceScore, icon: Heart, color: 'from-green-500 to-emerald-500' },
                    { key: 'bodyComp', label: 'Body Comp', value: data.bodyCompScore, icon: Scale, color: 'from-blue-500 to-cyan-500' },
                    { key: 'recovery', label: 'Recovery', value: data.recoveryScore, icon: Moon, color: 'from-purple-500 to-pink-500' }
                  ].map((score) => (
                    <Card key={score.key} className="bg-gray-800/50 border-gray-700 text-center hover:scale-105 transition-transform">
                      <CardContent className="p-3 sm:p-6">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 rounded-full bg-gradient-to-r ${score.color} flex items-center justify-center`}>
                          <score.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                          {animatedScores[score.key] ? Math.round(animatedScores[score.key]) : Math.round(parseFloat(score.value))}
                        </div>
                        <div className="text-sm sm:text-base text-gray-300">{score.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Score Explanation */}
                <Card className="bg-gray-800/30 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl text-white">What's the Hybrid Athlete Score?</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-invert max-w-none px-4 sm:px-6">
                    <p className="text-gray-300 text-base sm:text-lg mb-6">
                      Think of it as your <strong>overall "hybrid-fitness GPA"</strong> on a 0 – 100 scale:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      <div className="space-y-4">
                        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                            <h4 className="text-white font-semibold text-sm sm:text-base">Strength</h4>
                          </div>
                          <p className="text-gray-300 text-xs sm:text-sm">How much weight you can lift relative to your body-weight (bench, squat, deadlift).</p>
                          <p className="text-orange-400 text-xs sm:text-sm mt-2">Power for sprints, hills, injury-proofing.</p>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                            <h4 className="text-white font-semibold text-sm sm:text-base">Endurance</h4>
                          </div>
                          <p className="text-gray-300 text-xs sm:text-sm">Your engine—VO₂ max plus best mile time.</p>
                          <p className="text-green-400 text-xs sm:text-sm mt-2">Determines how long and how hard you can keep moving.</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                            <h4 className="text-white font-semibold text-sm sm:text-base">Body-comp</h4>
                          </div>
                          <p className="text-gray-300 text-xs sm:text-sm">How close you are to a healthy, performance-lean body-fat range.</p>
                          <p className="text-blue-400 text-xs sm:text-sm mt-2">Better power-to-weight and joint health.</p>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                            <h4 className="text-white font-semibold text-sm sm:text-base">Recovery</h4>
                          </div>
                          <p className="text-gray-300 text-xs sm:text-sm">HRV and resting heart-rate—how well your body bounces back.</p>
                          <p className="text-purple-400 text-xs sm:text-sm mt-2">Faster gains, fewer burn-outs.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-4 sm:p-6 border border-blue-800/30">
                      <h4 className="text-white font-semibold mb-3 text-sm sm:text-base">The Balance Bonus</h4>
                      <p className="text-gray-300 mb-4 text-sm sm:text-base">
                        We average those slices, then add a <strong>"balance bonus."</strong> If your strength and endurance levels are close together, you score extra points—because true hybrid athletes aren't one-sided.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl font-bold text-green-400">100 points</div>
                          <p className="text-gray-300">Elite strength, elite cardio, dialed-in body-comp, and stellar recovery with good balance.</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl font-bold text-yellow-400">50 points</div>
                          <p className="text-gray-300">Recreational lifter or runner with room to grow in other areas.</p>
                        </div>
                      </div>
                      <p className="text-blue-400 mt-4 text-center text-sm sm:text-base">
                        Your score helps you see <strong>which dial to turn next</strong>—lift heavier, run faster, lean out, or sleep/recover better—to level up as a complete hybrid athlete.
                      </p>
                    </div>

                    {/* Detailed Metrics */}
                    <Card className="bg-gray-800/50 border-gray-700 mt-6 sm:mt-8">
                      <CardHeader>
                        <CardTitle className="text-lg sm:text-xl text-white flex items-center space-x-2">
                          <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
                          <span>Your Metrics</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                          {[
                            { 
                              label: 'Body Weight', 
                              value: Math.round(data.scoreInputsUsed.bodyWeightKg * 2.20462), 
                              unit: 'lbs', 
                              color: 'text-blue-400' 
                            },
                            { 
                              label: 'Body Fat', 
                              value: data.scoreInputsUsed.bodyFatPercent, 
                              unit: '%', 
                              color: 'text-green-400' 
                            },
                            { 
                              label: 'HRV', 
                              value: data.scoreInputsUsed.hrvMs, 
                              unit: 'ms', 
                              color: 'text-purple-400' 
                            },
                            { 
                              label: 'Resting HR', 
                              value: data.scoreInputsUsed.restingHrBpm, 
                              unit: 'bpm', 
                              color: 'text-red-400' 
                            },
                            { 
                              label: 'VO2 Max', 
                              value: data.scoreInputsUsed.vo2Max, 
                              unit: 'ml/kg/min', 
                              color: 'text-orange-400' 
                            },
                            { 
                              label: 'Mile Time', 
                              value: `${Math.floor(data.scoreInputsUsed.mileSeconds / 60)}:${String(Math.round(data.scoreInputsUsed.mileSeconds % 60)).padStart(2, '0')}`, 
                              unit: '', 
                              color: 'text-cyan-400' 
                            },
                            { 
                              label: 'Bench 1RM', 
                              value: data.scoreInputsUsed.bench1RmKg ? Math.round(data.scoreInputsUsed.bench1RmKg * 2.20462) : 'N/A', 
                              unit: data.scoreInputsUsed.bench1RmKg ? 'lbs' : '', 
                              color: 'text-yellow-400' 
                            },
                            { 
                              label: 'Squat 1RM', 
                              value: data.scoreInputsUsed.squat1RmKg ? Math.round(data.scoreInputsUsed.squat1RmKg * 2.20462) : 'N/A', 
                              unit: data.scoreInputsUsed.squat1RmKg ? 'lbs' : '', 
                              color: 'text-pink-400' 
                            }
                          ].map((metric, index) => (
                            <div key={index} className="bg-gray-800/30 rounded-lg p-3 sm:p-4 text-center">
                              <div className={`text-lg sm:text-xl font-bold ${metric.color} mb-1`}>
                                {metric.value}
                              </div>
                              {metric.unit && <div className="text-xs text-gray-400">{metric.unit}</div>}
                              <div className="text-xs text-gray-300 mt-1">{metric.label}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Next Steps */}
                    <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-800/30 mt-6 sm:mt-8">
                      <CardHeader>
                        <CardTitle className="text-lg sm:text-xl text-white flex items-center space-x-2">
                          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                          <span>Ready for the Next Step?</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 mb-4 text-sm sm:text-base">
                          Now that you know your hybrid score, create personalized training and nutrition plans to improve your weakest areas and maintain your strengths.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            onClick={() => {/* TODO: Navigate to training plan creation */}}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Training Plan
                          </Button>
                          <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                            onClick={() => {/* TODO: Navigate to nutrition plan creation */}}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Nutrition Plan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;