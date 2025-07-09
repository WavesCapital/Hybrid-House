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
  CheckCircle2, Bed, Smartphone, Info, Pill
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AthleteProfile = () => {
  const [athleteProfile, setAthleteProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState({
    score: false,
    trainingPlan: false,
    nutritionPlan: false
  });
  const [loadingProgress, setLoadingProgress] = useState({
    score: 0,
    trainingPlan: 0,
    nutritionPlan: 0
  });
  const [progressIntervals, setProgressIntervals] = useState({});
  const [responses, setResponses] = useState({
    score: null,
    trainingPlan: null,
    nutritionPlan: null
  });
  const [error, setError] = useState(null);
  const [animatedScores, setAnimatedScores] = useState({});
  const [activeTab, setActiveTab] = useState('score');

  // Refs for scrolling
  const scoreRef = useRef(null);
  const trainingRef = useRef(null);
  const nutritionRef = useRef(null);

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

  // Progress bar animation based on actual response times
  useEffect(() => {
    if (loading) {
      const progressTimings = {
        score: 55, // 55 seconds
        nutritionPlan: 75, // 75 seconds
        trainingPlan: 120 // 2 minutes
      };
      
      Object.entries(progressTimings).forEach(([deliverable, totalTime]) => {
        if (loadingStatus[deliverable]) {
          let progress = 0;
          const interval = setInterval(() => {
            progress += (100 / totalTime); // Progress based on actual timing
            
            // Cap training plan at 99% if it takes longer than 2 minutes
            if (deliverable === 'trainingPlan' && progress >= 99) {
              progress = 99;
            } else if (progress >= 100) {
              progress = 100;
            }
            
            // Stop if no longer loading
            if (!loadingStatus[deliverable]) {
              clearInterval(interval);
              return;
            }
            
            setLoadingProgress(prev => ({ ...prev, [deliverable]: progress }));
          }, 1000);
        }
      });
    }
  }, [loading, loadingStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!athleteProfile.trim()) return;

    setLoading(true);
    setError(null);
    setResponses({
      score: null,
      trainingPlan: null,
      nutritionPlan: null
    });
    setLoadingProgress({
      score: 0,
      trainingPlan: 0,
      nutritionPlan: 0
    });

    try {
      let athleteProfileData;
      try {
        athleteProfileData = JSON.parse(athleteProfile);
      } catch {
        athleteProfileData = athleteProfile;
      }

      const deliverables = ['score', 'trainingPlan', 'nutritionPlan'];
      
      setLoadingStatus({
        score: true,
        trainingPlan: true,
        nutritionPlan: true
      });

      const promises = deliverables.map(async (deliverable) => {
        try {
          const data = await callWebhook(athleteProfileData, deliverable);
          // Update loading status immediately when complete
          setLoadingStatus(prev => ({ ...prev, [deliverable]: false }));
          setLoadingProgress(prev => ({ ...prev, [deliverable]: 100 }));
          return { deliverable, data, success: true };
        } catch (error) {
          console.error(`Error fetching ${deliverable}:`, error);
          setLoadingStatus(prev => ({ ...prev, [deliverable]: false }));
          return { deliverable, error: error.message, success: false };
        }
      });

      const results = await Promise.all(promises);
      
      const newResponses = {};
      
      results.forEach(result => {
        if (result.success) {
          newResponses[result.deliverable] = result.data;
        } else {
          console.error(`Failed to fetch ${result.deliverable}:`, result.error);
        }
      });

      setResponses(newResponses);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setLoadingStatus({
        score: false,
        trainingPlan: false,
        nutritionPlan: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Animate score counters
  useEffect(() => {
    const scoreData = responses.score?.[0] || responses.score;
    if (scoreData) {
      const scores = {
        hybrid: parseFloat(scoreData.hybridScore),
        strength: parseFloat(scoreData.strengthScore),
        endurance: parseFloat(scoreData.enduranceScore),
        bodyComp: parseFloat(scoreData.bodyCompScore),
        recovery: parseFloat(scoreData.recoveryScore),
        balance: parseFloat(scoreData.balanceBonus)
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
  }, [responses.score]);

  // Auto-scroll to sections
  const scrollToSection = (section) => {
    setActiveTab(section);
    const refs = {
      score: scoreRef,
      training: trainingRef,
      nutrition: nutritionRef
    };
    refs[section]?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const hasResults = responses.score || responses.trainingPlan || responses.nutritionPlan;
  const scoreData = responses.score?.[0] || responses.score;
  const trainingData = responses.trainingPlan?.[0] || responses.trainingPlan;
  const nutritionData = responses.nutritionPlan?.[0] || responses.nutritionPlan;

  const LoadingCard = ({ title, isLoading, isComplete, icon: Icon, deliverable }) => (
    <div className="flex items-center space-x-4 p-6 bg-gray-800/30 rounded-xl border border-gray-700">
      <div className={`p-3 rounded-full transition-all duration-500 ${
        isLoading ? 'bg-blue-500/20 animate-pulse' : 
        isComplete ? 'bg-green-500/20' : 'bg-gray-600/20'
      }`}>
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        ) : isComplete ? (
          <CheckCircle className="h-6 w-6 text-green-400" />
        ) : (
          <Icon className="h-6 w-6 text-gray-400" />
        )}
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold transition-colors duration-300 ${
          isComplete ? 'text-green-400' : 
          isLoading ? 'text-blue-400' : 'text-gray-400'
        }`}>
          {title}
        </h3>
        <div className="w-full bg-gray-700 rounded-full h-3 mt-2">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              isComplete ? 'bg-green-400' : 
              isLoading ? 'bg-blue-400' : 'bg-gray-600'
            }`}
            style={{ 
              width: isComplete ? '100%' : 
                     isLoading ? `${loadingProgress[deliverable]}%` : '0%' 
            }}
          />
        </div>
        {isLoading && (
          <div className="text-xs text-gray-400 mt-1">
            {Math.round(loadingProgress[deliverable])}% complete
          </div>
        )}
      </div>
    </div>
  );

  const DailyFlowCard = ({ day, actions }) => (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white capitalize flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>{day.replace(/([A-Z])/g, ' $1').trim()} Day</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-400 min-w-fit">{action.clock}</span>
              <span className="text-sm text-white">{action.item}</span>
            </div>
            <div className="text-xs text-gray-400 italic max-w-xs text-right">
              {action.cue}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Fixed Navigation */}
      {hasResults && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Athlete Profile
              </h1>
              <div className="flex space-x-1">
                <button
                  onClick={() => scrollToSection('score')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'score' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Hybrid Score
                </button>
                <button
                  onClick={() => scrollToSection('training')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'training' 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Training Plan
                </button>
                <button
                  onClick={() => scrollToSection('nutrition')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'nutrition' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Nutrition Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header - Only show when no results */}
          {!hasResults && (
            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent">
                Athlete Profile
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Unlock your athletic potential with personalized insights
              </p>
              
              {/* Create Profile Button */}
              <div className="mb-8">
                <a
                  href="https://chatgpt.com/g/g-686e85594828819185c3264c65086ae2-hybrid-house-interviewer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Create Profile
                </a>
              </div>

              {/* Input Form */}
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 backdrop-blur-sm shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center justify-center gap-3">
                    <Target className="h-6 w-6" />
                    Paste your athlete profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Textarea
                      placeholder="Paste your athlete profile here..."
                      value={athleteProfile}
                      onChange={(e) => setAthleteProfile(e.target.value)}
                      className="min-h-[140px] bg-gray-800/70 border-gray-600 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 transition-all"
                      disabled={loading}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={loading || !athleteProfile.trim()}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Analyzing Profile...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-5 w-5" />
                          Generate Athletic Analysis
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
            <div className={`space-y-8 ${hasResults ? 'pt-20' : ''}`}>
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">AI Analysis in Progress</h2>
                <p className="text-gray-400">Creating your personalized athletic profile...</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LoadingCard 
                  title="Performance Scores" 
                  isLoading={loadingStatus.score} 
                  isComplete={!loadingStatus.score && responses.score !== null}
                  icon={BarChart3}
                  deliverable="score"
                />
                <LoadingCard 
                  title="Training Plan" 
                  isLoading={loadingStatus.trainingPlan} 
                  isComplete={!loadingStatus.trainingPlan && responses.trainingPlan !== null}
                  icon={Calendar}
                  deliverable="trainingPlan"
                />
                <LoadingCard 
                  title="Nutrition Plan" 
                  isLoading={loadingStatus.nutritionPlan} 
                  isComplete={!loadingStatus.nutritionPlan && responses.nutritionPlan !== null}
                  icon={Apple}
                  deliverable="nutritionPlan"
                />
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

          {/* Results Sections */}
          {hasResults && (
            <div className={`space-y-16 ${loading ? '' : 'pt-20'}`}>
              
              {/* Hybrid Score Section */}
              {scoreData && (
                <section ref={scoreRef} className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-5xl font-bold text-white mb-4">Your Hybrid Score</h2>
                    <div className="text-8xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
                      {animatedScores.hybrid ? animatedScores.hybrid.toFixed(1) : scoreData.hybridScore}
                    </div>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                      Your overall hybrid-fitness score on a 0-100 scale
                    </p>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { key: 'strength', label: 'Strength', value: scoreData.strengthScore, icon: Dumbbell, color: 'from-orange-500 to-red-500' },
                      { key: 'endurance', label: 'Endurance', value: scoreData.enduranceScore, icon: Heart, color: 'from-green-500 to-emerald-500' },
                      { key: 'bodyComp', label: 'Body Comp', value: scoreData.bodyCompScore, icon: Scale, color: 'from-blue-500 to-cyan-500' },
                      { key: 'recovery', label: 'Recovery', value: scoreData.recoveryScore, icon: Moon, color: 'from-purple-500 to-pink-500' }
                    ].map((score) => (
                      <Card key={score.key} className="bg-gray-800/50 border-gray-700 text-center hover:scale-105 transition-transform">
                        <CardContent className="p-6">
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${score.color} flex items-center justify-center`}>
                            <score.icon className="h-8 w-8 text-white" />
                          </div>
                          <div className="text-3xl font-bold text-white mb-2">
                            {animatedScores[score.key] ? animatedScores[score.key].toFixed(1) : score.value}
                          </div>
                          <div className="text-gray-300">{score.label}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Score Explanation */}
                  <Card className="bg-gray-800/30 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-2xl text-white">What's the Hybrid Athlete Score?</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-invert max-w-none">
                      <p className="text-gray-300 text-lg mb-6">
                        Think of it as your <strong>overall "hybrid-fitness GPA"</strong> on a 0 – 100 scale:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-4">
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-2">
                              <Dumbbell className="h-5 w-5 text-orange-400" />
                              <h4 className="text-white font-semibold">Strength</h4>
                            </div>
                            <p className="text-gray-300 text-sm">How much weight you can lift relative to your body-weight (bench, squat, deadlift).</p>
                            <p className="text-orange-400 text-sm mt-2">Power for sprints, hills, injury-proofing.</p>
                          </div>
                          
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-2">
                              <Heart className="h-5 w-5 text-green-400" />
                              <h4 className="text-white font-semibold">Endurance</h4>
                            </div>
                            <p className="text-gray-300 text-sm">Your engine—VO₂ max plus best mile time.</p>
                            <p className="text-green-400 text-sm mt-2">Determines how long and how hard you can keep moving.</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-2">
                              <Scale className="h-5 w-5 text-blue-400" />
                              <h4 className="text-white font-semibold">Body-comp</h4>
                            </div>
                            <p className="text-gray-300 text-sm">How close you are to a healthy, performance-lean body-fat range.</p>
                            <p className="text-blue-400 text-sm mt-2">Better power-to-weight and joint health.</p>
                          </div>
                          
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-2">
                              <Moon className="h-5 w-5 text-purple-400" />
                              <h4 className="text-white font-semibold">Recovery</h4>
                            </div>
                            <p className="text-gray-300 text-sm">HRV and resting heart-rate—how well your body bounces back.</p>
                            <p className="text-purple-400 text-sm mt-2">Faster gains, fewer burn-outs.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-800/30">
                        <h4 className="text-white font-semibold mb-3">The Balance Bonus</h4>
                        <p className="text-gray-300 mb-4">
                          We average those slices, then add a <strong>"balance bonus."</strong> If your strength and endurance levels are close together, you score extra points—because true hybrid athletes aren't one-sided.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">100 points</div>
                            <p className="text-gray-300">Elite strength, elite cardio, dialed-in body-comp, and stellar recovery with good balance.</p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">50 points</div>
                            <p className="text-gray-300">Recreational lifter or runner with room to grow in other areas.</p>
                          </div>
                        </div>
                        <p className="text-blue-400 mt-4 text-center">
                          Your score helps you see <strong>which dial to turn next</strong>—lift heavier, run faster, lean out, or sleep/recover better—to level up as a complete hybrid athlete.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Training Plan Section */}
              {trainingData && (
                <section ref={trainingRef} className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">Training Plan</h2>
                    <p className="text-xl text-gray-300">
                      {trainingData['Training Plan'].meta.title}
                    </p>
                    <p className="text-gray-400 mt-2">
                      {trainingData['Training Plan'].meta.overview}
                    </p>
                  </div>

                  {/* Training Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gray-800/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center space-x-2">
                          <Target className="h-5 w-5" />
                          <span>Goals</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-1">Primary</h4>
                          <p className="text-white">{trainingData['Training Plan'].goals.primary}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-1">Secondary</h4>
                          <p className="text-white">{trainingData['Training Plan'].goals.secondary}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center space-x-2">
                          <MapPin className="h-5 w-5" />
                          <span>Equipment</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {trainingData['Training Plan'].equipment.items.map((item, index) => (
                            <Badge key={index} variant="outline" className="text-blue-400 border-blue-400">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Run Progression & Recovery */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trainingData['Training Plan'].runProgression && (
                      <Card className="bg-gray-800/30 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5" />
                            <span>Run Progression</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Base Mileage</span>
                            <span className="text-white font-semibold">{trainingData['Training Plan'].runProgression.baseMileage} miles</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Weekly Increase</span>
                            <span className="text-green-400 font-semibold">{trainingData['Training Plan'].runProgression.weekOverWeekPct}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Long Run Start</span>
                            <span className="text-blue-400 font-semibold">{trainingData['Training Plan'].runProgression.longRunStart} miles</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {trainingData['Training Plan'].recovery && (
                      <Card className="bg-gray-800/30 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center space-x-2">
                            <Bed className="h-5 w-5" />
                            <span>Recovery Protocol</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Sleep Target</span>
                            <span className="text-purple-400 font-semibold">{trainingData['Training Plan'].recovery.sleepTargetHrs} hours</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Sauna/Week</span>
                            <span className="text-orange-400 font-semibold">{trainingData['Training Plan'].recovery.saunaPerWeek} sessions</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Daily Mobility</span>
                            <span className="text-green-400 font-semibold">{trainingData['Training Plan'].recovery.mobilityMinPerDay} min</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Weekly Schedule */}
                  <div className="space-y-6">
                    {trainingData['Training Plan'].weeks.map((week, weekIndex) => (
                      <Card key={weekIndex} className="bg-gray-800/30 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-2xl text-white">Week {week.week}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {week.days.map((day, dayIndex) => (
                              <Card key={dayIndex} className="bg-gray-800/50 border-gray-600">
                                <CardHeader className="pb-3">
                                  <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-white">{day.day}</h3>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {day.sessions[0]?.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-400">{day.focus}</p>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {day.sessions.map((session, sessionIndex) => (
                                    <div key={sessionIndex}>
                                      <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-medium text-white">{session.label}</h4>
                                        <span className="text-xs text-gray-400">{session.start}-{session.end}</span>
                                      </div>
                                      {session.exercises.slice(0, 3).map((exercise, exerciseIndex) => (
                                        <div key={exerciseIndex} className="text-sm text-gray-300 pl-3 border-l-2 border-gray-600">
                                          <div className="flex justify-between">
                                            <span>{exercise.name}</span>
                                            <span className="text-xs text-gray-500">
                                              {exercise.sets}×{exercise.reps}
                                              {exercise.load > 0 && ` @ ${exercise.load}lbs`}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                      {session.distance > 0 && (
                                        <div className="text-sm text-blue-400 pl-3 border-l-2 border-blue-600">
                                          {session.distance} miles - {session.intensity}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Training Notes */}
                  <Card className="bg-gray-800/30 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center space-x-2">
                        <Info className="h-5 w-5" />
                        <span>Important Notes</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-white mb-2">Auto-regulation</h4>
                          <p className="text-gray-300">{trainingData['Training Plan'].notes.autoRegulation}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-2">Safety</h4>
                          <p className="text-gray-300">{trainingData['Training Plan'].notes.safety}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Nutrition Plan Section */}
              {nutritionData && (
                <section ref={nutritionRef} className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">Nutrition Plan</h2>
                    <p className="text-xl text-gray-300">
                      Personalized nutrition strategy to fuel your goals
                    </p>
                  </div>

                  {/* Calorie Targets */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Lift Day', value: nutritionData['Nutrition Plan'].calorieTargets.liftDayKcal, color: 'text-blue-400' },
                      { label: 'Run Day', value: nutritionData['Nutrition Plan'].calorieTargets.runDayKcal, color: 'text-green-400' },
                      { label: 'Rest Day', value: nutritionData['Nutrition Plan'].calorieTargets.restDayKcal, color: 'text-purple-400' }
                    ].map((target, index) => (
                      <Card key={index} className="bg-gray-800/30 border-gray-700 text-center">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold text-white mb-2">{target.label}</h3>
                          <div className={`text-4xl font-bold ${target.color} mb-1`}>
                            {target.value}
                          </div>
                          <p className="text-gray-400">calories</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Macro Targets */}
                  <Card className="bg-gray-800/30 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Daily Macro Targets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { label: 'Protein', value: nutritionData['Nutrition Plan'].nutritionTargets.macroTargetsG.protein, unit: 'g', color: 'text-green-400' },
                          { label: 'Carbs', value: nutritionData['Nutrition Plan'].nutritionTargets.macroTargetsG.carb, unit: 'g', color: 'text-blue-400' },
                          { label: 'Fat', value: nutritionData['Nutrition Plan'].nutritionTargets.macroTargetsG.fat, unit: 'g', color: 'text-yellow-400' }
                        ].map((macro, index) => (
                          <div key={index} className="text-center">
                            <div className={`text-5xl font-bold ${macro.color} mb-2`}>
                              {macro.value}{macro.unit}
                            </div>
                            <div className="text-gray-300">{macro.label}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Meal Suggestions */}
                  <Card className="bg-gray-800/30 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Suggested Meals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {nutritionData['Nutrition Plan'].suggestedMeals.slice(0, 6).map((meal, index) => (
                          <Card key={index} className="bg-gray-800/50 border-gray-600">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-white mb-2">{meal.name}</h4>
                              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                                <span className="text-green-400">P: {meal.macrosG.protein}g</span>
                                <span className="text-blue-400">C: {meal.macrosG.carb}g</span>
                                <span className="text-yellow-400">F: {meal.macrosG.fat}g</span>
                              </div>
                              <p className="text-xs text-gray-400 italic">{meal.note}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Takeout Options */}
                  {nutritionData['Nutrition Plan'].suggestedTakeout && (
                    <Card className="bg-gray-800/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center space-x-2">
                          <Utensils className="h-5 w-5" />
                          <span>Takeout Options</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {nutritionData['Nutrition Plan'].suggestedTakeout.map((takeout, index) => (
                            <Card key={index} className="bg-gray-800/50 border-gray-600">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-semibold text-white">{takeout.restaurant}</h4>
                                    <p className="text-sm text-gray-300">{takeout.item}</p>
                                  </div>
                                  <Badge variant="outline" className="text-amber-400 border-amber-400">
                                    Takeout
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                                  <span className="text-green-400">P: {takeout.macrosG.protein}g</span>
                                  <span className="text-blue-400">C: {takeout.macrosG.carb}g</span>
                                  <span className="text-yellow-400">F: {takeout.macrosG.fat}g</span>
                                </div>
                                <p className="text-xs text-gray-400 italic">{takeout.note}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Daily Flows */}
                  {nutritionData['Nutrition Plan'].dailyFlowVariants && (
                    <Card className="bg-gray-800/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center space-x-2">
                          <Clock className="h-5 w-5" />
                          <span>Daily Nutrition Flows</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {nutritionData['Nutrition Plan'].dailyFlowVariants.map((flow, index) => (
                            <DailyFlowCard key={index} day={flow.dayType} actions={flow.actions} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Hydration & Daily Totals */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {nutritionData['Nutrition Plan'].hydrationTargets && (
                      <Card className="bg-gray-800/30 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center space-x-2">
                            <Droplets className="h-5 w-5" />
                            <span>Hydration Targets</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Lift Day</span>
                              <span className="text-blue-400 font-semibold">
                                {nutritionData['Nutrition Plan'].hydrationTargets.liftDayLiters}L
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Run Day</span>
                              <span className="text-green-400 font-semibold">
                                {nutritionData['Nutrition Plan'].hydrationTargets.runDayLiters}L
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Rest Day</span>
                              <span className="text-purple-400 font-semibold">
                                {nutritionData['Nutrition Plan'].hydrationTargets.restDayLiters}L
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {nutritionData['Nutrition Plan'].dailyTotals && (
                      <Card className="bg-gray-800/30 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center space-x-2">
                            <Pill className="h-5 w-5" />
                            <span>Daily Supplements</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {Object.entries(nutritionData['Nutrition Plan'].dailyTotals).map(([dayType, totals]) => (
                              <div key={dayType} className="bg-gray-800/50 rounded-lg p-4">
                                <h4 className="text-white font-semibold mb-2 capitalize">
                                  {dayType.replace(/([A-Z])/g, ' $1').trim()}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-400">Caffeine: </span>
                                    <span className="text-orange-400">{totals.caffeineMg}mg</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Creatine: </span>
                                    <span className="text-blue-400">{totals.creatineG}g</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Magnesium: </span>
                                    <span className="text-purple-400">{totals.magnesiumMg}mg</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">EPA+DHA: </span>
                                    <span className="text-green-400">{totals.epaPlusDhaG}g</span>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 italic">{totals.note}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Guardrails & Checkpoints */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {nutritionData['Nutrition Plan'].guardrails && (
                      <Card className="bg-gray-800/30 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center space-x-2">
                            <Shield className="h-5 w-5" />
                            <span>Guardrails</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {nutritionData['Nutrition Plan'].guardrails.map((guardrail, index) => (
                              <div key={index} className="flex items-start space-x-3">
                                <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-300 text-sm">{guardrail}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {nutritionData['Nutrition Plan'].checkpoints && (
                      <Card className="bg-gray-800/30 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center space-x-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <span>Progress Checkpoints</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {nutritionData['Nutrition Plan'].checkpoints.map((checkpoint, index) => (
                              <div key={index} className="flex items-start space-x-3">
                                <Calendar className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-300 text-sm">{checkpoint}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;