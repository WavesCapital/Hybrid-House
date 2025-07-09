import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Loader2, Trophy, Target, Calendar, Apple, Zap, Heart, Activity, CheckCircle } from 'lucide-react';
import { mockAthleteResponse } from '../mock';

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

  const LoadingCard = ({ title, isLoading, isComplete }) => (
    <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          ) : isComplete ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
          )}
          <span className={`font-medium ${isComplete ? 'text-green-400' : isLoading ? 'text-blue-400' : 'text-gray-400'}`}>
            {title}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  const ScoreCard = ({ title, score, icon: Icon, color }) => (
    <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">{title}</p>
              <p className="text-2xl font-bold text-white">{score}</p>
            </div>
          </div>
          <div className="text-right">
            <Progress value={parseFloat(score)} className="w-20 h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ExerciseCard = ({ exercise }) => (
    <Card className="bg-gray-800/30 border-gray-600">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-white">{exercise.name}</h4>
          {exercise.load > 0 && (
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {exercise.load} lbs
            </Badge>
          )}
        </div>
        <div className="flex space-x-4 text-sm text-gray-300">
          <span>{exercise.sets} sets</span>
          <span>{exercise.reps} reps</span>
        </div>
      </CardContent>
    </Card>
  );

  const MealCard = ({ meal }) => (
    <Card className="bg-gray-800/30 border-gray-600">
      <CardContent className="p-4">
        <h4 className="font-semibold text-white mb-2">{meal.name}</h4>
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-4 text-sm">
            <span className="text-green-400">P: {meal.macrosG.protein}g</span>
            <span className="text-blue-400">C: {meal.macrosG.carb}g</span>
            <span className="text-yellow-400">F: {meal.macrosG.fat}g</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 italic">{meal.note}</p>
      </CardContent>
    </Card>
  );

  // Get combined response data
  const scoreData = responses.score?.[0] || responses.score;
  const trainingData = responses.trainingPlan?.[0] || responses.trainingPlan;
  const nutritionData = responses.nutritionPlan?.[0] || responses.nutritionPlan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Athlete Profile
            </h1>
            <p className="text-xl text-gray-300">
              Unlock your athletic potential with personalized insights
            </p>
          </div>

          {/* Input Form */}
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
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
                    className="min-h-[120px] bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none"
                    disabled={loading}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3"
                  disabled={loading || !athleteProfile.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Profile...
                    </>
                  ) : (
                    'Generate Athletic Analysis'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Loading Status */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <LoadingCard 
                title="Generating Scores" 
                isLoading={loadingStatus.score} 
                isComplete={!loadingStatus.score && responses.score !== null}
              />
              <LoadingCard 
                title="Creating Training Plan" 
                isLoading={loadingStatus.trainingPlan} 
                isComplete={!loadingStatus.trainingPlan && responses.trainingPlan !== null}
              />
              <LoadingCard 
                title="Building Nutrition Plan" 
                isLoading={loadingStatus.nutritionPlan} 
                isComplete={!loadingStatus.nutritionPlan && responses.nutritionPlan !== null}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Card className="bg-red-900/20 border-red-700 mb-8">
              <CardContent className="p-6">
                <p className="text-red-400">Error: {error}</p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {(scoreData || trainingData || nutritionData) && (
            <div className="space-y-8">
              {/* Score Overview */}
              {scoreData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ScoreCard
                    title="Hybrid Score"
                    score={scoreData.hybridScore}
                    icon={Trophy}
                    color="bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                  <ScoreCard
                    title="Strength Score"
                    score={scoreData.strengthScore}
                    icon={Zap}
                    color="bg-gradient-to-r from-orange-500 to-red-500"
                  />
                  <ScoreCard
                    title="Endurance Score"
                    score={scoreData.enduranceScore}
                    icon={Heart}
                    color="bg-gradient-to-r from-green-500 to-emerald-500"
                  />
                  <ScoreCard
                    title="Body Composition"
                    score={scoreData.bodyCompScore}
                    icon={Activity}
                    color="bg-gradient-to-r from-blue-500 to-cyan-500"
                  />
                  <ScoreCard
                    title="Recovery Score"
                    score={scoreData.recoveryScore}
                    icon={Heart}
                    color="bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                  <ScoreCard
                    title="Balance Bonus"
                    score={scoreData.balanceBonus}
                    icon={Target}
                    color="bg-gradient-to-r from-teal-500 to-green-500"
                  />
                </div>
              )}

              {/* Detailed Analysis */}
              {(trainingData || nutritionData) && (
                <Tabs defaultValue="training" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
                    <TabsTrigger value="training" className="data-[state=active]:bg-blue-600" disabled={!trainingData}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Training Plan
                    </TabsTrigger>
                    <TabsTrigger value="nutrition" className="data-[state=active]:bg-green-600" disabled={!nutritionData}>
                      <Apple className="h-4 w-4 mr-2" />
                      Nutrition Plan
                    </TabsTrigger>
                  </TabsList>

                  {trainingData && (
                    <TabsContent value="training" className="space-y-6">
                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-2xl text-white">
                            {trainingData['Training Plan']?.meta?.title || 'Training Plan'}
                          </CardTitle>
                          <p className="text-gray-300">{trainingData['Training Plan']?.meta?.overview}</p>
                          {trainingData['Training Plan']?.goals && (
                            <div className="flex space-x-4 mt-4">
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {trainingData['Training Plan'].goals.primary}
                              </Badge>
                              <Badge variant="outline" className="text-purple-400 border-purple-400">
                                {trainingData['Training Plan'].goals.secondary}
                              </Badge>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {trainingData['Training Plan']?.weeks?.map((week, weekIndex) => (
                              <div key={weekIndex} className="space-y-4">
                                <h3 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">
                                  Week {week.week}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {week.days.map((day, dayIndex) => (
                                    <Card key={dayIndex} className="bg-gray-800/30 border-gray-600">
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-lg text-white flex items-center justify-between">
                                          {day.day}
                                          <Badge variant="outline" className="text-xs">
                                            {day.sessions[0]?.type}
                                          </Badge>
                                        </CardTitle>
                                        <p className="text-sm text-gray-300">{day.focus}</p>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        {day.sessions.map((session, sessionIndex) => (
                                          <div key={sessionIndex} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                              <h4 className="font-medium text-white">{session.label}</h4>
                                              <span className="text-xs text-gray-400">
                                                {session.start} - {session.end}
                                              </span>
                                            </div>
                                            <div className="grid gap-2">
                                              {session.exercises.map((exercise, exerciseIndex) => (
                                                <ExerciseCard key={exerciseIndex} exercise={exercise} />
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {nutritionData && (
                    <TabsContent value="nutrition" className="space-y-6">
                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-2xl text-white">Nutrition Strategy</CardTitle>
                          <p className="text-gray-300">Personalized nutrition plan to support your goals</p>
                        </CardHeader>
                        <CardContent>
                          {nutritionData['Nutrition Plan']?.calorieTargets && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                              <Card className="bg-gray-800/30 border-gray-600">
                                <CardContent className="p-4 text-center">
                                  <h4 className="font-semibold text-white mb-2">Lift Day</h4>
                                  <p className="text-2xl font-bold text-blue-400">
                                    {nutritionData['Nutrition Plan'].calorieTargets.liftDayKcal}
                                  </p>
                                  <p className="text-sm text-gray-300">calories</p>
                                </CardContent>
                              </Card>
                              <Card className="bg-gray-800/30 border-gray-600">
                                <CardContent className="p-4 text-center">
                                  <h4 className="font-semibold text-white mb-2">Run Day</h4>
                                  <p className="text-2xl font-bold text-green-400">
                                    {nutritionData['Nutrition Plan'].calorieTargets.runDayKcal}
                                  </p>
                                  <p className="text-sm text-gray-300">calories</p>
                                </CardContent>
                              </Card>
                              <Card className="bg-gray-800/30 border-gray-600">
                                <CardContent className="p-4 text-center">
                                  <h4 className="font-semibold text-white mb-2">Rest Day</h4>
                                  <p className="text-2xl font-bold text-purple-400">
                                    {nutritionData['Nutrition Plan'].calorieTargets.restDayKcal}
                                  </p>
                                  <p className="text-sm text-gray-300">calories</p>
                                </CardContent>
                              </Card>
                            </div>
                          )}

                          {nutritionData['Nutrition Plan']?.nutritionTargets && (
                            <div className="mb-8">
                              <h3 className="text-xl font-semibold text-white mb-4">Daily Macro Targets</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-800/30 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-green-400 font-medium">Protein</span>
                                    <span className="text-white font-bold">
                                      {nutritionData['Nutrition Plan'].nutritionTargets.macroTargetsG.protein}g
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    {nutritionData['Nutrition Plan'].nutritionTargets.macroSplitPercent.protein}%
                                  </div>
                                </div>
                                <div className="bg-gray-800/30 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-blue-400 font-medium">Carbs</span>
                                    <span className="text-white font-bold">
                                      {nutritionData['Nutrition Plan'].nutritionTargets.macroTargetsG.carb}g
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    {nutritionData['Nutrition Plan'].nutritionTargets.macroSplitPercent.carb}%
                                  </div>
                                </div>
                                <div className="bg-gray-800/30 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-yellow-400 font-medium">Fat</span>
                                    <span className="text-white font-bold">
                                      {nutritionData['Nutrition Plan'].nutritionTargets.macroTargetsG.fat}g
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    {nutritionData['Nutrition Plan'].nutritionTargets.macroSplitPercent.fat}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {nutritionData['Nutrition Plan']?.suggestedMeals && (
                            <div>
                              <h3 className="text-xl font-semibold text-white mb-4">Suggested Meals</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {nutritionData['Nutrition Plan'].suggestedMeals.map((meal, index) => (
                                  <MealCard key={index} meal={meal} />
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;