import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Activity, User, Heart, Target, Trophy } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const HybridScoreForm = () => {
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    email: '',
    sex: '',
    dob: '',
    country: 'US',
    wearables: [],
    
    // Body Metrics
    weight_lb: '',
    height_in: '',
    vo2max: '',
    resting_hr_bpm: '',
    hrv_ms: '',
    
    // Running Performance
    pb_mile: '',
    pb_5k: '',
    pb_10k: '',
    pb_half_marathon: '',
    weekly_miles: '',
    long_run: '',
    
    // Strength Performance
    pb_bench_1rm: '',
    pb_squat_1rm: '',
    pb_deadlift_1rm: ''
  });

  const sections = [
    {
      title: 'Personal Info',
      icon: <User className="w-5 h-5" />,
      fields: ['first_name', 'last_name', 'email', 'sex', 'dob', 'country', 'wearables']
    },
    {
      title: 'Body Metrics',
      icon: <Activity className="w-5 h-5" />,
      fields: ['weight_lb', 'height_in', 'vo2max', 'resting_hr_bpm', 'hrv_ms']
    },
    {
      title: 'Running PRs',
      icon: <Target className="w-5 h-5" />,
      fields: ['pb_mile', 'pb_5k', 'pb_10k', 'pb_half_marathon', 'weekly_miles', 'long_run']
    },
    {
      title: 'Strength PRs',
      icon: <Dumbbell className="w-5 h-5" />,
      fields: ['pb_bench_1rm', 'pb_squat_1rm', 'pb_deadlift_1rm']
    }
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      localStorage.setItem('postAuthRedirect', '/hybrid-score-form');
      navigate('/auth?mode=signup');
    }
  }, [loading, user, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWearableToggle = (wearable) => {
    setFormData(prev => ({
      ...prev,
      wearables: prev.wearables.includes(wearable)
        ? prev.wearables.filter(w => w !== wearable)
        : [...prev.wearables, wearable]
    }));
  };

  const triggerWebhookForScore = async (athleteProfileData, profileId) => {
    try {
      console.log('Triggering webhook for hybrid score calculation...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minutes

      const response = await fetch('https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          athleteProfile: athleteProfileData,
          deliverable: 'score'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Webhook request failed with status: ${response.status}`);
      }

      const data = await response.json();
      const scoreData = Array.isArray(data) ? data[0] : data;
      
      // Store score data in Supabase
      await axios.post(
        `${BACKEND_URL}/api/athlete-profile/${profileId}/score`,
        scoreData,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Navigate to score results
      navigate(`/hybrid-score/${profileId}`);
      
    } catch (error) {
      console.error('Error calling webhook:', error);
      toast({
        title: "Error calculating score",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Structure the data for submission
      const profileData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        sex: formData.sex,
        dob: formData.dob,
        country: formData.country,
        wearables: formData.wearables,
        body_metrics: {
          weight_lb: parseFloat(formData.weight_lb) || null,
          height_in: parseFloat(formData.height_in) || null,
          vo2max: parseFloat(formData.vo2max) || null,
          resting_hr_bpm: parseInt(formData.resting_hr_bpm) || null,
          hrv_ms: parseInt(formData.hrv_ms) || null
        },
        pb_mile: formData.pb_mile,
        pb_5k: formData.pb_5k,
        pb_10k: formData.pb_10k,
        pb_half_marathon: formData.pb_half_marathon,
        weekly_miles: parseFloat(formData.weekly_miles) || null,
        long_run: parseFloat(formData.long_run) || null,
        pb_bench_1rm: parseFloat(formData.pb_bench_1rm) || null,
        pb_squat_1rm: parseFloat(formData.pb_squat_1rm) || null,
        pb_deadlift_1rm: parseFloat(formData.pb_deadlift_1rm) || null,
        schema_version: "v1.0",
        interview_type: "form"
      };

      console.log('Creating athlete profile with form data:', profileData);

      // Create athlete profile
      const response = await axios.post(
        `${BACKEND_URL}/api/athlete-profiles`,
        {
          profile_json: profileData,
          is_public: true
        },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const profileResult = response.data;
      const profileId = profileResult.profile?.id;

      if (profileId) {
        toast({
          title: "Profile Created! 🚀",
          description: "Calculating your hybrid score...",
          duration: 3000,
        });

        // Trigger webhook for score calculation
        await triggerWebhookForScore(profileData, profileId);
      } else {
        throw new Error('No profile ID returned');
      }

    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Submission Error",
        description: error.response?.data?.detail || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const wearableOptions = [
    'Apple Watch', 'Garmin', 'Whoop', 'Ultrahuman Ring', 'Fitbit', 'Oura', 'None'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0E0E11' }}>
        <div className="text-center" style={{ color: 'var(--txt)' }}>
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--neon-primary)' }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0E0E11' }}>
      <style>
        {`
        /* Flat-Neon "Laser Pop" Color System */
        :root {
          --bg: #0E0E11;
          --card: #15161A;
          --border: #1F2025;
          --txt: #F5FAFF;
          --muted: #8D9299;
          --neon-primary: #08F0FF;
          --neon-secondary: #FF2DDE;
        }

        .neon-button {
          background: var(--neon-primary);
          border: none;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          padding: 16px 32px;
          font-size: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .neon-button:hover {
          transform: translateY(-2px);
          background: var(--neon-secondary);
          box-shadow: 
            0 8px 32px rgba(8, 240, 255, 0.4),
            0 4px 16px rgba(255, 45, 222, 0.3);
        }

        .neon-button:disabled {
          opacity: 0.6;
          transform: none;
          cursor: not-allowed;
        }

        .form-input {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--txt);
          padding: 12px 16px;
          font-size: 14px;
          transition: all 0.3s ease;
          width: 100%;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--neon-primary);
          box-shadow: 0 0 0 2px rgba(8, 240, 255, 0.2);
        }

        .form-select {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--txt);
          padding: 12px 16px;
          font-size: 14px;
          transition: all 0.3s ease;
          width: 100%;
          cursor: pointer;
        }

        .form-select:focus {
          outline: none;
          border-color: var(--neon-primary);
          box-shadow: 0 0 0 2px rgba(8, 240, 255, 0.2);
        }

        .wearable-chip {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          color: var(--txt);
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          margin: 4px;
        }

        .wearable-chip:hover {
          border-color: var(--neon-primary);
        }

        .wearable-chip.selected {
          background: var(--neon-primary);
          color: #000000;
          border-color: var(--neon-primary);
        }

        .section-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
        }

        .section-tab {
          flex: 1;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
        }

        .section-tab.active {
          background: var(--neon-primary);
          color: #000000;
          border-color: var(--neon-primary);
        }

        .section-tab.completed {
          border-color: var(--neon-primary);
          color: var(--neon-primary);
        }

        @media (max-width: 768px) {
          .section-nav {
            flex-direction: column;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
        `}
      </style>

      {/* Header */}
      <header className="border-b border-gray-800" style={{ background: 'var(--bg)' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-6 h-6" style={{ color: 'var(--neon-primary)' }} />
              <h1 className="text-xl font-bold" style={{ color: 'var(--neon-primary)' }}>
                Hybrid Score Form
              </h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:border-[#08F0FF] transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            
            {/* Section Navigation */}
            <div className="section-nav">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`section-tab ${
                    index === currentSection ? 'active' : 
                    index < currentSection ? 'completed' : ''
                  }`}
                  onClick={() => setCurrentSection(index)}
                >
                  {section.icon}
                  <span className="hidden sm:inline">{section.title}</span>
                </div>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit}>
              
              {/* Personal Info Section */}
              {currentSection === 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--txt)' }}>
                    Personal Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 form-grid">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        className="form-input"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Gender *
                      </label>
                      <select
                        className="form-select"
                        value={formData.sex}
                        onChange={(e) => handleInputChange('sex', e.target.value)}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.dob}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Country
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="US"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-4" style={{ color: 'var(--txt)' }}>
                      Wearables (select all that apply)
                    </label>
                    <div className="flex flex-wrap">
                      {wearableOptions.map((wearable) => (
                        <div
                          key={wearable}
                          className={`wearable-chip ${formData.wearables.includes(wearable) ? 'selected' : ''}`}
                          onClick={() => handleWearableToggle(wearable)}
                        >
                          {wearable}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Body Metrics Section */}
              {currentSection === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--txt)' }}>
                    Body Metrics
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 form-grid">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Weight (lbs) *
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.weight_lb}
                        onChange={(e) => handleInputChange('weight_lb', e.target.value)}
                        placeholder="190"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Height (inches) *
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.height_in}
                        onChange={(e) => handleInputChange('height_in', e.target.value)}
                        placeholder="70"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        VO₂ Max
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.vo2max}
                        onChange={(e) => handleInputChange('vo2max', e.target.value)}
                        placeholder="55"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Resting Heart Rate (bpm)
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.resting_hr_bpm}
                        onChange={(e) => handleInputChange('resting_hr_bpm', e.target.value)}
                        placeholder="45"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        HRV (ms)
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.hrv_ms}
                        onChange={(e) => handleInputChange('hrv_ms', e.target.value)}
                        placeholder="195"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Running PRs Section */}
              {currentSection === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--txt)' }}>
                    Running Performance
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 form-grid">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Mile PR (MM:SS)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.pb_mile}
                        onChange={(e) => handleInputChange('pb_mile', e.target.value)}
                        placeholder="4:59"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        5K PR (MM:SS)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.pb_5k}
                        onChange={(e) => handleInputChange('pb_5k', e.target.value)}
                        placeholder="18:30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        10K PR (MM:SS)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.pb_10k}
                        onChange={(e) => handleInputChange('pb_10k', e.target.value)}
                        placeholder="38:00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Half Marathon PR (HH:MM:SS)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.pb_half_marathon}
                        onChange={(e) => handleInputChange('pb_half_marathon', e.target.value)}
                        placeholder="1:25:00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Weekly Miles
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.weekly_miles}
                        onChange={(e) => handleInputChange('weekly_miles', e.target.value)}
                        placeholder="40"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Long Run (miles)
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.long_run}
                        onChange={(e) => handleInputChange('long_run', e.target.value)}
                        placeholder="26"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Strength PRs Section */}
              {currentSection === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--txt)' }}>
                    Strength Performance
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 form-grid">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Bench Press 1RM (lbs)
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.pb_bench_1rm}
                        onChange={(e) => handleInputChange('pb_bench_1rm', e.target.value)}
                        placeholder="315"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Squat 1RM (lbs)
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.pb_squat_1rm}
                        onChange={(e) => handleInputChange('pb_squat_1rm', e.target.value)}
                        placeholder="405"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Deadlift 1RM (lbs)
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.pb_deadlift_1rm}
                        onChange={(e) => handleInputChange('pb_deadlift_1rm', e.target.value)}
                        placeholder="500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:border-[#08F0FF] transition-colors"
                  onClick={prevSection}
                  disabled={currentSection === 0}
                  style={{ opacity: currentSection === 0 ? 0.5 : 1 }}
                >
                  Previous
                </button>

                {currentSection < sections.length - 1 ? (
                  <button
                    type="button"
                    className="neon-button"
                    onClick={nextSection}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="neon-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Calculating Score...' : 'Calculate Hybrid Score'}
                  </button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HybridScoreForm;