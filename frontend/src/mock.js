// Mock data for athlete profile response
export const mockAthleteResponse = [
  {
    "scoreInputsUsed": {
      "bodyWeightKg": 70,
      "bodyFatPercent": 22,
      "hrvMs": 55,
      "restingHrBpm": 60,
      "vo2Max": 30,
      "mileSeconds": 1093.6,
      "bench1RmKg": 56,
      "squat1RmKg": 0,
      "dead1RmKg": 0
    },
    "strengthScore": "47.1",
    "enduranceScore": "65.2",
    "bodyCompScore": "78.3",
    "recoveryScore": "55.1",
    "balanceBonus": "5.3",
    "hybridScore": "62",
    "Training Plan": {
      "meta": {
        "title": "Hybrid Athlete Blueprint",
        "version": "1.1",
        "overview": "4-week concurrent strength + endurance block"
      },
      "units": {
        "weight": "lb",
        "distance": "mi"
      },
      "goals": {
        "primary": "Build endurance and lose fat while maintaining muscle",
        "secondary": "Achieve sub 6-minute mile and maintain strength"
      },
      "weeks": [
        {
          "week": 1,
          "days": [
            {
              "day": "Mon",
              "sessions": [
                {
                  "type": "strength",
                  "label": "Lower Strength & Plyo",
                  "start": "07:00",
                  "end": "08:15",
                  "exercises": [
                    {
                      "name": "Back Squat",
                      "sets": 4,
                      "reps": "6",
                      "load": 225
                    },
                    {
                      "name": "Walking Lunge",
                      "sets": 3,
                      "reps": "8/leg",
                      "load": 50
                    },
                    {
                      "name": "Box Jump",
                      "sets": 4,
                      "reps": "5",
                      "load": 0
                    }
                  ],
                  "distance": 0,
                  "intensity": "moderate"
                }
              ],
              "focus": "Explosive legs and power development"
            },
            {
              "day": "Tue",
              "sessions": [
                {
                  "type": "endurance",
                  "label": "Tempo Run",
                  "start": "07:00",
                  "end": "08:00",
                  "exercises": [
                    {
                      "name": "Dynamic Warm-up",
                      "sets": 1,
                      "reps": "10 min",
                      "load": 0
                    }
                  ],
                  "distance": 3,
                  "intensity": "moderate"
                }
              ],
              "focus": "Aerobic base building"
            }
          ]
        }
      ]
    },
    "Nutrition Plan": {
      "planVersion": "Hybrid-Coach v1.0",
      "calorieTargets": {
        "liftDayKcal": 2800,
        "runDayKcal": 2600,
        "restDayKcal": 2400,
        "deficitOrSurplusKcal": -200
      },
      "nutritionTargets": {
        "macroSplitPercent": {
          "protein": 30,
          "carb": 45,
          "fat": 25
        },
        "macroTargetsG": {
          "protein": 170,
          "carb": 280,
          "fat": 70
        }
      },
      "suggestedMeals": [
        {
          "name": "Protein Oat Bowl",
          "macrosG": {
            "protein": 35,
            "carb": 45,
            "fat": 12
          },
          "note": "Perfect post-workout meal"
        },
        {
          "name": "Grilled Chicken Salad",
          "macrosG": {
            "protein": 40,
            "carb": 20,
            "fat": 15
          },
          "note": "High protein, low carb option"
        }
      ]
    }
  }
];