import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Loader2, Trophy, Target, Calendar, Apple, Zap, Heart, Activity, 
  CheckCircle, Clock, MapPin, Utensils, Dumbbell, Timer, 
  TrendingUp, Star, Award, BarChart3, PieChart, LineChart,
  Flame, Droplets, Scale, Brain, Moon, Sun, Coffee, Pill, AlertCircle
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
  const [responses, setResponses] = useState({
    score: null,
    trainingPlan: null,
    nutritionPlan: null
  });
  const [error, setError] = useState(null);
  const [animatedScores, setAnimatedScores] = useState({});

  const callWebhook = async (athleteProfileData, deliverable) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minutes timeout

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
    setResponses({
      score: null,
      trainingPlan: null,
      nutritionPlan: null
    });

    try {
      // Parse the athlete profile if it's JSON, otherwise send as string
      let athleteProfileData;
      try {
        athleteProfileData = JSON.parse(athleteProfile);
      } catch {
        athleteProfileData = athleteProfile;
      }

      // Make all three API calls simultaneously
      const deliverables = ['score', 'trainingPlan', 'nutritionPlan'];
      
      // Set loading status for all deliverables
      setLoadingStatus({
        score: true,
        trainingPlan: true,
        nutritionPlan: true
      });

      const promises = deliverables.map(async (deliverable) => {
        try {
          const data = await callWebhook(athleteProfileData, deliverable);
          return { deliverable, data, success: true };
        } catch (error) {
          console.error(`Error fetching ${deliverable}:`, error);
          return { deliverable, error: error.message, success: false };
        }
      });

      // Wait for all promises to resolve
      const results = await Promise.all(promises);
      
      // Process results
      const newResponses = {};
      const newLoadingStatus = {};
      
      results.forEach(result => {
        newLoadingStatus[result.deliverable] = false;
        if (result.success) {
          newResponses[result.deliverable] = result.data;
        } else {
          console.error(`Failed to fetch ${result.deliverable}:`, result.error);
        }
      });

      setLoadingStatus(newLoadingStatus);
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

  const LoadingCard = ({ title, isLoading, isComplete, icon: Icon }) => (
    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
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
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  isComplete ? 'bg-green-400 w-full' : 
                  isLoading ? 'bg-blue-400 w-1/2 animate-pulse' : 'bg-gray-600 w-0'
                }`}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ScoreCard = ({ title, score, icon: Icon, color, description }) => (
    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${color} shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">{title}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white mb-1">
              {animatedScores[title.toLowerCase().replace(' ', '')] ? 
                animatedScores[title.toLowerCase().replace(' ', '')].toFixed(1) : 
                score}
            </div>
            <Progress value={parseFloat(score)} className="w-16 h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const MetricCard = ({ label, value, unit, icon: Icon, color }) => (
    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-sm text-gray-300">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-lg font-semibold text-white">{value}</span>
          <span className="text-xs text-gray-400 ml-1">{unit}</span>
        </div>
      </div>
    </div>
  );

  const ExerciseCard = ({ exercise, sessionType }) => (
    <Card className={`bg-gradient-to-r ${
      sessionType === 'strength' ? 'from-red-900/20 to-orange-900/20' :
      sessionType === 'run' ? 'from-green-900/20 to-blue-900/20' :
      sessionType === 'mobility' ? 'from-purple-900/20 to-pink-900/20' :
      'from-gray-800/20 to-gray-900/20'
    } border-gray-600 hover:shadow-lg transition-shadow duration-300`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-semibold text-white text-lg">{exercise.name}</h4>
          <div className="flex space-x-2">
            {exercise.load > 0 && (
              <Badge variant="outline" className="text-amber-400 border-amber-400">
                {exercise.load} lbs
              </Badge>
            )}
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {sessionType}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Dumbbell className="h-4 w-4 text-gray-400" />
            <span className="text-gray-300">{exercise.sets} sets</span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-gray-400" />
            <span className="text-gray-300">{exercise.reps} reps</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const MealCard = ({ meal }) => (
    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-600 hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-white text-lg mb-2">{meal.name}</h4>
            <p className="text-sm text-gray-400 italic">{meal.note}</p>
          </div>
          <Utensils className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{meal.macrosG.protein}</div>
            <div className="text-xs text-gray-400">Protein (g)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{meal.macrosG.carb}</div>
            <div className="text-xs text-gray-400">Carbs (g)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{meal.macrosG.fat}</div>
            <div className="text-xs text-gray-400">Fat (g)</div>
          </div>
        </div>
        
        <div className="flex space-x-1">
          <div className="flex-1 bg-green-500 h-2 rounded-l" style={{width: `${(meal.macrosG.protein * 4) / ((meal.macrosG.protein * 4) + (meal.macrosG.carb * 4) + (meal.macrosG.fat * 9)) * 100}%`}} />
          <div className="flex-1 bg-blue-500 h-2" style={{width: `${(meal.macrosG.carb * 4) / ((meal.macrosG.protein * 4) + (meal.macrosG.carb * 4) + (meal.macrosG.fat * 9)) * 100}%`}} />
          <div className="flex-1 bg-yellow-500 h-2 rounded-r" style={{width: `${(meal.macrosG.fat * 9) / ((meal.macrosG.protein * 4) + (meal.macrosG.carb * 4) + (meal.macrosG.fat * 9)) * 100}%`}} />
        </div>
      </CardContent>
    </Card>
  );

  const DailyFlowCard = ({ day, actions }) => (
    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white capitalize flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>{day} Day</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/30">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-400">{action.clock}</span>
              <span className="text-sm text-white truncate">{action.item}</span>
            </div>
            <div className="text-xs text-gray-400 italic max-w-xs">
              {action.cue}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  // Get combined response data
  const scoreData = responses.score?.[0] || responses.score;
  const trainingData = responses.trainingPlan?.[0] || responses.trainingPlan;
  const nutritionData = responses.nutritionPlan?.[0] || responses.nutritionPlan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="container mx-auto px-4 py-8 relative">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent">
              Athlete Profile
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              Unlock your athletic potential with personalized insights
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                <Trophy className="h-3 w-3 mr-1" />
                Performance Analysis
              </Badge>
              <Badge variant="outline" className="text-green-400 border-green-400">
                <Dumbbell className="h-3 w-3 mr-1" />
                Training Plans
              </Badge>
              <Badge variant="outline" className="text-purple-400 border-purple-400">
                <Apple className="h-3 w-3 mr-1" />
                Nutrition Strategy
              </Badge>
            </div>
          </div>

          {/* Input Form */}
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 backdrop-blur-sm mb-8 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Target className="h-6 w-6" />
                Paste your athlete profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Textarea
                    placeholder="Paste your athlete profile here..."
                    value={athleteProfile}
                    onChange={(e) => setAthleteProfile(e.target.value)}
                    className="min-h-[140px] bg-gray-800/70 border-gray-600 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={loading}
                  />
                </div>
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

          {/* Loading Status */}
          {loading && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                <Brain className="h-6 w-6" />
                <span>AI Analysis in Progress</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LoadingCard 
                  title="Generating Performance Scores" 
                  isLoading={loadingStatus.score} 
                  isComplete={!loadingStatus.score && responses.score !== null}
                  icon={BarChart3}
                />
                <LoadingCard 
                  title="Creating Training Plan" 
                  isLoading={loadingStatus.trainingPlan} 
                  isComplete={!loadingStatus.trainingPlan && responses.trainingPlan !== null}
                  icon={Calendar}
                />
                <LoadingCard 
                  title="Building Nutrition Plan" 
                  isLoading={loadingStatus.nutritionPlan} 
                  isComplete={!loadingStatus.nutritionPlan && responses.nutritionPlan !== null}
                  icon={Apple}
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

          {/* Results */}
          {(scoreData || trainingData || nutritionData) && (
            <div className="space-y-8">
              {/* Hero Dashboard */}
              {scoreData && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">Your Athletic Profile</h2>
                    <p className="text-xl text-gray-300">Performance metrics and insights</p>
                  </div>

                  {/* Main Score Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ScoreCard
                      title="Hybrid Score"
                      score={scoreData.hybridScore}
                      icon={Trophy}
                      color="bg-gradient-to-r from-purple-500 to-pink-500"
                      description="Overall athletic performance"
                    />
                    <ScoreCard
                      title="Strength Score"
                      score={scoreData.strengthScore}
                      icon={Dumbbell}
                      color="bg-gradient-to-r from-orange-500 to-red-500"
                      description="Muscular power and strength"
                    />
                    <ScoreCard
                      title="Endurance Score"
                      score={scoreData.enduranceScore}
                      icon={Heart}
                      color="bg-gradient-to-r from-green-500 to-emerald-500"
                      description="Cardiovascular fitness"
                    />
                    <ScoreCard
                      title="Body Composition"
                      score={scoreData.bodyCompScore}
                      icon={Scale}
                      color="bg-gradient-to-r from-blue-500 to-cyan-500"
                      description="Body fat and muscle mass"
                    />
                    <ScoreCard
                      title="Recovery Score"
                      score={scoreData.recoveryScore}
                      icon={Moon}
                      color="bg-gradient-to-r from-indigo-500 to-purple-500"
                      description="Rest and recovery metrics"
                    />
                    <ScoreCard
                      title="Balance Bonus"
                      score={scoreData.balanceBonus}
                      icon={Star}
                      color="bg-gradient-to-r from-teal-500 to-green-500"
                      description="Training balance bonus"
                    />
                  </div>

                  {/* Detailed Metrics */}
                  <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-2xl text-white flex items-center space-x-2">
                        <Activity className="h-6 w-6" />
                        <span>Detailed Metrics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                          label="Body Weight"
                          value={scoreData.scoreInputsUsed.bodyWeightKg}
                          unit="kg"
                          icon={Scale}
                          color="text-blue-400"
                        />
                        <MetricCard
                          label="Body Fat"
                          value={scoreData.scoreInputsUsed.bodyFatPercent}
                          unit="%"
                          icon={TrendingUp}
                          color="text-green-400"
                        />
                        <MetricCard
                          label="HRV"
                          value={scoreData.scoreInputsUsed.hrvMs}
                          unit="ms"
                          icon={Heart}
                          color="text-purple-400"
                        />
                        <MetricCard
                          label="Resting HR"
                          value={scoreData.scoreInputsUsed.restingHrBpm}
                          unit="bpm"
                          icon={Activity}
                          color="text-red-400"
                        />
                        <MetricCard
                          label="VO2 Max"
                          value={scoreData.scoreInputsUsed.vo2Max}
                          unit="ml/kg/min"
                          icon={Flame}
                          color="text-orange-400"
                        />
                        <MetricCard
                          label="Mile Time"
                          value={Math.floor(scoreData.scoreInputsUsed.mileSeconds / 60)}
                          unit="min"
                          icon={Timer}
                          color="text-cyan-400"
                        />
                        <MetricCard
                          label="Bench 1RM"
                          value={scoreData.scoreInputsUsed.bench1RmKg}
                          unit="kg"
                          icon={Dumbbell}
                          color="text-yellow-400"
                        />
                        <MetricCard
                          label="Squat 1RM"
                          value={scoreData.scoreInputsUsed.squat1RmKg}
                          unit="kg"
                          icon={Dumbbell}
                          color="text-pink-400"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detailed Analysis Tabs */}
              {(trainingData || nutritionData) && (
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700">
                  <Tabs defaultValue="training" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border-gray-700 mb-8">
                      <TabsTrigger 
                        value="training" 
                        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        disabled={!trainingData}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Training Plan
                      </TabsTrigger>
                      <TabsTrigger 
                        value="nutrition" 
                        className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                        disabled={!nutritionData}
                      >
                        <Apple className="h-4 w-4 mr-2" />
                        Nutrition Plan
                      </TabsTrigger>
                    </TabsList>

                    {/* Training Plan Tab */}
                    {trainingData && (
                      <TabsContent value="training" className="space-y-8">
                        {/* Training Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <Card className="bg-gray-800/30 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-xl text-white">
                                {trainingData['Training Plan'].meta.title}
                              </CardTitle>
                              <p className="text-gray-300">{trainingData['Training Plan'].meta.overview}</p>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-white mb-2">Primary Goal</h4>
                                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                                    {trainingData['Training Plan'].goals.primary}
                                  </Badge>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white mb-2">Secondary Goal</h4>
                                  <Badge variant="outline" className="text-purple-400 border-purple-400">
                                    {trainingData['Training Plan'].goals.secondary}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-gray-800/30 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-xl text-white flex items-center space-x-2">
                                <MapPin className="h-5 w-5" />
                                <span>Equipment & Setup</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-white mb-2">Location</h4>
                                  <p className="text-gray-300 capitalize">{trainingData['Training Plan'].equipment.location}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white mb-2">Equipment</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {trainingData['Training Plan'].equipment.items.map((item, index) => (
                                      <Badge key={index} variant="outline" className="text-amber-400 border-amber-400">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Training Schedule */}
                        <Card className="bg-gray-800/30 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-xl text-white flex items-center space-x-2">
                              <Clock className="h-5 w-5" />
                              <span>Training Windows</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {trainingData['Training Plan'].timeWindows.map((window, index) => (
                                <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-white font-medium">
                                      {window.days.join(', ')}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                      {window.start} - {window.end}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Weekly Training Plan */}
                        <div className="space-y-8">
                          {trainingData['Training Plan'].weeks.map((week, weekIndex) => (
                            <Card key={weekIndex} className="bg-gray-800/30 border-gray-600">
                              <CardHeader>
                                <CardTitle className="text-2xl text-white">
                                  Week {week.week}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  {week.days.map((day, dayIndex) => (
                                    <Card key={dayIndex} className="bg-gray-800/50 border-gray-600">
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-lg text-white flex items-center justify-between">
                                          <span>{day.day}</span>
                                          <Badge variant="outline" className="text-xs capitalize">
                                            {day.sessions[0]?.type}
                                          </Badge>
                                        </CardTitle>
                                        <p className="text-sm text-gray-300">{day.focus}</p>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        {day.sessions.map((session, sessionIndex) => (
                                          <div key={sessionIndex} className="space-y-3">
                                            <div className="flex justify-between items-center">
                                              <h4 className="font-medium text-white">{session.label}</h4>
                                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                                <Clock className="h-3 w-3" />
                                                <span>{session.start} - {session.end}</span>
                                              </div>
                                            </div>
                                            <div className="grid gap-3">
                                              {session.exercises.map((exercise, exerciseIndex) => (
                                                <ExerciseCard 
                                                  key={exerciseIndex} 
                                                  exercise={exercise}
                                                  sessionType={session.type}
                                                />
                                              ))}
                                            </div>
                                            {session.distance > 0 && (
                                              <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-800">
                                                <div className="flex items-center space-x-2">
                                                  <MapPin className="h-4 w-4 text-blue-400" />
                                                  <span className="text-blue-400 font-medium">
                                                    {session.distance} miles
                                                  </span>
                                                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                                                    {session.intensity}
                                                  </Badge>
                                                </div>
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
                        <Card className="bg-gray-800/30 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-xl text-white">Important Notes</CardTitle>
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
                      </TabsContent>
                    )}

                    {/* Nutrition Plan Tab */}
                    {nutritionData && (
                      <TabsContent value="nutrition" className="space-y-8">
                        {/* Nutrition Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <Card className="bg-gray-800/30 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-lg text-white">Lift Day</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                              <div className="text-3xl font-bold text-blue-400 mb-2">
                                {nutritionData['Nutrition Plan'].calorieTargets.liftDayKcal}
                              </div>
                              <p className="text-sm text-gray-300">calories</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-800/30 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-lg text-white">Run Day</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                              <div className="text-3xl font-bold text-green-400 mb-2">
                                {nutritionData['Nutrition Plan'].calorieTargets.runDayKcal}
                              </div>
                              <p className="text-sm text-gray-300">calories</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-800/30 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-lg text-white">Rest Day</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                              <div className="text-3xl font-bold text-purple-400 mb-2">
                                {nutritionData['Nutrition Plan'].calorieTargets.restDayKcal}
                              </div>
                              <p className="text-sm text-gray-300">calories</p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Macro Targets */}
                        <Card className="bg-gray-800/30 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-xl text-white">Daily Macro Targets</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold text-green-400 mb-2">
                                  {nutritionData['Nutrition Plan'].nutritionTargets.macroTargetsG.protein}g
                                </div>
                                <div className="text-sm text-gray-300 mb-1">Protein</div>
                                <div className="text-xs text-gray-400">
                                  {nutritionData['Nutrition Plan'].nutritionTargets.macroSplitPercent.protein}%
                                </div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold text-blue-400 mb-2">
                                  {nutritionData['Nutrition Plan'].nutritionTargets.macroTargetsG.carb}g
                                </div>
                                <div className="text-sm text-gray-300 mb-1">Carbs</div>
                                <div className="text-xs text-gray-400">
                                  {nutritionData['Nutrition Plan'].nutritionTargets.macroSplitPercent.carb}%
                                </div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold text-yellow-400 mb-2">
                                  {nutritionData['Nutrition Plan'].nutritionTargets.macroTargetsG.fat}g
                                </div>
                                <div className="text-sm text-gray-300 mb-1">Fat</div>
                                <div className="text-xs text-gray-400">
                                  {nutritionData['Nutrition Plan'].nutritionTargets.macroSplitPercent.fat}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Suggested Meals */}
                        <Card className="bg-gray-800/30 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-xl text-white">Suggested Meals</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {nutritionData['Nutrition Plan'].suggestedMeals.map((meal, index) => (
                                <MealCard key={index} meal={meal} />
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Takeout Options */}
                        <Card className="bg-gray-800/30 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-xl text-white">Takeout Options</CardTitle>
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

                        {/* Daily Flows */}
                        <Card className="bg-gray-800/30 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-xl text-white">Daily Nutrition Flows</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {nutritionData['Nutrition Plan'].dailyFlowVariants.map((flow, index) => (
                                <DailyFlowCard key={index} day={flow.dayType} actions={flow.actions} />
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Hydration & Supplements */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="bg-gray-800/30 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-xl text-white flex items-center space-x-2">
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

                          <Card className="bg-gray-800/30 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-xl text-white">Cooking Preferences</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-white mb-2">Equipment</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {nutritionData['Nutrition Plan'].cookingPreferences.equipment.map((item, index) => (
                                      <Badge key={index} variant="outline" className="text-orange-400 border-orange-400">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white mb-2">Habit</h4>
                                  <p className="text-gray-300">{nutritionData['Nutrition Plan'].cookingPreferences.habit}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Guardrails */}
                        <Card className="bg-gray-800/30 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-xl text-white">Important Guidelines</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {nutritionData['Nutrition Plan'].guardrails.map((guardrail, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-gray-300">{guardrail}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}
                  </Tabs>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;