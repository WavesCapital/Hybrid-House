import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Loader2, Trophy, Target, Calendar, Apple, Zap, Heart, Activity } from 'lucide-react';
import { mockAthleteResponse } from '../mock';

const AthleteProfile = () => {
  const [athleteProfile, setAthleteProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!athleteProfile.trim()) return;

    setLoading(true);
    
    // Simulate API call with mock data
    setTimeout(() => {
      setResponseData(mockAthleteResponse[0]);
      setLoading(false);
    }, 2000);
  };

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
                Tell us about yourself
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Textarea
                    placeholder="Describe your athletic profile, goals, training background, and current fitness level..."
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

          {/* Results */}
          {responseData && (
            <div className="space-y-8">
              {/* Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ScoreCard
                  title="Hybrid Score"
                  score={responseData.hybridScore}
                  icon={Trophy}
                  color="bg-gradient-to-r from-purple-500 to-pink-500"
                />
                <ScoreCard
                  title="Strength Score"
                  score={responseData.strengthScore}
                  icon={Zap}
                  color="bg-gradient-to-r from-orange-500 to-red-500"
                />
                <ScoreCard
                  title="Endurance Score"
                  score={responseData.enduranceScore}
                  icon={Heart}
                  color="bg-gradient-to-r from-green-500 to-emerald-500"
                />
                <ScoreCard
                  title="Body Composition"
                  score={responseData.bodyCompScore}
                  icon={Activity}
                  color="bg-gradient-to-r from-blue-500 to-cyan-500"
                />
                <ScoreCard
                  title="Recovery Score"
                  score={responseData.recoveryScore}
                  icon={Heart}
                  color="bg-gradient-to-r from-indigo-500 to-purple-500"
                />
                <ScoreCard
                  title="Balance Bonus"
                  score={responseData.balanceBonus}
                  icon={Target}
                  color="bg-gradient-to-r from-teal-500 to-green-500"
                />
              </div>

              {/* Detailed Analysis */}
              <Tabs defaultValue="training" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
                  <TabsTrigger value="training" className="data-[state=active]:bg-blue-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Training Plan
                  </TabsTrigger>
                  <TabsTrigger value="nutrition" className="data-[state=active]:bg-green-600">
                    <Apple className="h-4 w-4 mr-2" />
                    Nutrition Plan
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="training" className="space-y-6">
                  <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-2xl text-white">
                        {responseData['Training Plan'].meta.title}
                      </CardTitle>
                      <p className="text-gray-300">{responseData['Training Plan'].meta.overview}</p>
                      <div className="flex space-x-4 mt-4">
                        <Badge variant="outline" className="text-blue-400 border-blue-400">
                          {responseData['Training Plan'].goals.primary}
                        </Badge>
                        <Badge variant="outline" className="text-purple-400 border-purple-400">
                          {responseData['Training Plan'].goals.secondary}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {responseData['Training Plan'].weeks.map((week, weekIndex) => (
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

                <TabsContent value="nutrition" className="space-y-6">
                  <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-2xl text-white">Nutrition Strategy</CardTitle>
                      <p className="text-gray-300">Personalized nutrition plan to support your goals</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="bg-gray-800/30 border-gray-600">
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-white mb-2">Lift Day</h4>
                            <p className="text-2xl font-bold text-blue-400">
                              {responseData['Nutrition Plan'].calorieTargets.liftDayKcal}
                            </p>
                            <p className="text-sm text-gray-300">calories</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-800/30 border-gray-600">
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-white mb-2">Run Day</h4>
                            <p className="text-2xl font-bold text-green-400">
                              {responseData['Nutrition Plan'].calorieTargets.runDayKcal}
                            </p>
                            <p className="text-sm text-gray-300">calories</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-800/30 border-gray-600">
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-white mb-2">Rest Day</h4>
                            <p className="text-2xl font-bold text-purple-400">
                              {responseData['Nutrition Plan'].calorieTargets.restDayKcal}
                            </p>
                            <p className="text-sm text-gray-300">calories</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Daily Macro Targets</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-800/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-green-400 font-medium">Protein</span>
                              <span className="text-white font-bold">
                                {responseData['Nutrition Plan'].nutritionTargets.macroTargetsG.protein}g
                              </span>
                            </div>
                            <div className="text-sm text-gray-300">
                              {responseData['Nutrition Plan'].nutritionTargets.macroSplitPercent.protein}%
                            </div>
                          </div>
                          <div className="bg-gray-800/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-blue-400 font-medium">Carbs</span>
                              <span className="text-white font-bold">
                                {responseData['Nutrition Plan'].nutritionTargets.macroTargetsG.carb}g
                              </span>
                            </div>
                            <div className="text-sm text-gray-300">
                              {responseData['Nutrition Plan'].nutritionTargets.macroSplitPercent.carb}%
                            </div>
                          </div>
                          <div className="bg-gray-800/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-yellow-400 font-medium">Fat</span>
                              <span className="text-white font-bold">
                                {responseData['Nutrition Plan'].nutritionTargets.macroTargetsG.fat}g
                              </span>
                            </div>
                            <div className="text-sm text-gray-300">
                              {responseData['Nutrition Plan'].nutritionTargets.macroSplitPercent.fat}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Suggested Meals</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {responseData['Nutrition Plan'].suggestedMeals.map((meal, index) => (
                            <MealCard key={index} meal={meal} />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;