import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Activity, User, Heart, Target, Trophy, Info, HelpCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const HybridScoreForm = () => {
  const { user, session, loading, signUpWithEmail, signInWithEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    sex: '',
    dob: '',
    country: 'US',
    wearables: [],
    
    // Body Metrics
    weight_lb: '',
    height_ft: '',
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

  // Pre-fill form data for authenticated users
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user && session && !isLoadingProfile) {
        setIsLoadingProfile(true);
        try {
          const response = await axios.get(
            `${BACKEND_URL}/api/user-profile/me`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            }
          );

          const userProfile = response.data.user_profile;
          if (userProfile) {
            // Parse the name if it exists
            const [firstName = '', lastName = ''] = (userProfile.name || '').split(' ', 2);
            
            // Convert height back to feet and inches if available
            const totalHeightInches = userProfile.height_in || 0;
            const feet = Math.floor(totalHeightInches / 12);
            const inches = totalHeightInches % 12;

            setFormData(prev => ({
              ...prev,
              first_name: firstName,
              last_name: lastName,
              email: userProfile.email || '',
              sex: userProfile.gender || '',
              dob: userProfile.dob || '',
              country: userProfile.country || 'US',
              wearables: Array.isArray(userProfile.wearables) ? userProfile.wearables : [],
              weight_lb: userProfile.weight_lb || '',
              height_ft: feet > 0 ? feet.toString() : '',
              height_in: inches > 0 ? inches.toString() : '',
            }));
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Don't show error toast for profile loading as it's not critical
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    loadUserProfile();
  }, [user, session]); // Re-run when user or session changes

  const sections = [
    {
      title: 'Personal Info',
      icon: <User className="w-5 h-5" />,
      fields: ['first_name', 'last_name', 'sex', 'dob', 'country', 'wearables'] // Removed email and password
    },
    {
      title: 'Body Metrics',
      icon: <Activity className="w-5 h-5" />,
      fields: ['weight_lb', 'height_ft', 'height_in', 'vo2max', 'resting_hr_bpm', 'hrv_ms']
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

  const triggerWebhookForScore = async (athleteProfileData, profileId, currentSession = session) => {
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
            'Authorization': `Bearer ${currentSession.access_token}`,
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
    if (e) e.preventDefault();
    
    if (isSubmitting) return;

    // Double-check we're on the final section before proceeding
    if (currentSection !== sections.length - 1) {
      console.log('⚠️ Form submission blocked - not on final section');
      return;
    }

    console.log('✅ Form submission proceeding - user clicked Calculate Hybrid Score');
    setIsSubmitting(true);

    try {
      let currentUser = user;
      let currentSession = session;

      // Create account if user is not authenticated
      if (!currentUser) {
        console.log('Creating new account...');
        setIsCreatingAccount(true);
        
        if (!formData.email || !formData.password) {
          throw new Error('Email and password are required');
        }

        const authResult = await signUpWithEmail(formData.email, formData.password);
        
        if (authResult.error) {
          throw new Error(authResult.error.message);
        }

        // Sign in the newly created user
        const signInResult = await signInWithEmail(formData.email, formData.password);
        
        if (signInResult.error) {
          throw new Error('Failed to sign in after account creation');
        }

        currentUser = signInResult.data?.user;
        currentSession = signInResult.data?.session;

        if (!currentUser || !currentSession) {
          throw new Error('Failed to authenticate after account creation');
        }

        toast({
          title: "Account Created! 🎉",
          description: "Now calculating your hybrid score...",
          duration: 3000,
        });
      } else {
        console.log('User already authenticated, proceeding with score calculation...');
        toast({
          title: "Processing your data! 🚀",
          description: "Calculating your hybrid score...",
          duration: 3000,
        });
      }

      setIsCreatingAccount(false);

      // Calculate height in inches
      const heightInches = (parseInt(formData.height_ft) || 0) * 12 + (parseInt(formData.height_in) || 0);

      // Structure the data for submission
      const profileData = {
        first_name: formData.first_name.substring(0, 20), // Limit first name
        last_name: formData.last_name.substring(0, 20),   // Limit last name
        email: formData.email.substring(0, 50),           // Limit email to 50 chars
        sex: formData.sex,
        dob: formData.dob,
        country: formData.country.substring(0, 2),        // Limit country to 2 chars
        wearables: formData.wearables,
        body_metrics: {
          weight_lb: parseFloat(formData.weight_lb) || null,
          height_in: heightInches || null,
          vo2max: parseFloat(formData.vo2max) || null,
          resting_hr_bpm: parseInt(formData.resting_hr_bpm) || null,
          hrv_ms: parseInt(formData.hrv_ms) || null
        },
        pb_mile: formData.pb_mile || null,
        pb_5k: formData.pb_5k || null,
        pb_10k: formData.pb_10k || null,
        pb_half_marathon: formData.pb_half_marathon || null,
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
            'Authorization': `Bearer ${currentSession.access_token}`,
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

        // Trigger webhook for score calculation with complete profile data
        await triggerWebhookForScore(profileData, profileId, currentSession);
      } else {
        throw new Error('No profile ID returned');
      }

    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Submission Error",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setIsCreatingAccount(false);
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
    'Apple Watch', 'Garmin', 'Whoop', 'Ultrahuman Ring', 'Fitbit', 'Oura', 'None', 'Other'
  ];

  const getWearableTips = () => {
    const selectedWearables = formData.wearables;
    if (selectedWearables.length === 0) return null;

    const tips = [];
    
    if (selectedWearables.includes('Apple Watch')) {
      tips.push({
        device: 'Apple Watch',
        vo2: 'Health app → Browse → Heart → Cardio Fitness',
        rhr: 'Health app → Browse → Heart → Resting Heart Rate',
        hrv: 'Health app → Browse → Heart → Heart Rate Variability'
      });
    }
    
    if (selectedWearables.includes('Garmin')) {
      tips.push({
        device: 'Garmin',
        vo2: 'Garmin Connect app → Health Stats → VO2 Max',
        rhr: 'Garmin Connect app → Health Stats → Resting Heart Rate', 
        hrv: 'Garmin Connect app → Health Stats → HRV Status'
      });
    }
    
    if (selectedWearables.includes('Whoop')) {
      tips.push({
        device: 'Whoop',
        vo2: 'Not available on Whoop - use estimated values',
        rhr: 'Whoop app → Overview → Resting Heart Rate',
        hrv: 'Whoop app → Overview → HRV (RMSSD value)'
      });
    }
    
    if (selectedWearables.includes('Ultrahuman Ring')) {
      tips.push({
        device: 'Ultrahuman Ring',
        vo2: 'Not typically measured - use estimated values',
        rhr: 'Ultrahuman app → Vitals → Resting Heart Rate',
        hrv: 'Ultrahuman app → Vitals → HRV'
      });
    }
    
    if (selectedWearables.includes('Fitbit')) {
      tips.push({
        device: 'Fitbit',
        vo2: 'Fitbit app → Today tab → Cardio Fitness Score',
        rhr: 'Fitbit app → Today tab → Heart Rate tile → Resting HR',
        hrv: 'Fitbit app → Premium features → HRV'
      });
    }
    
    if (selectedWearables.includes('Oura')) {
      tips.push({
        device: 'Oura',
        vo2: 'Not available - use estimated values',
        rhr: 'Oura app → Today → Resting Heart Rate',
        hrv: 'Oura app → Today → HRV'
      });
    }

    return tips;
  };

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

        .info-box {
          background: rgba(8, 240, 255, 0.1);
          border: 1px solid rgba(8, 240, 255, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .section-explainer {
          background: rgba(8, 240, 255, 0.05);
          border-left: 3px solid var(--neon-primary);
          padding: 16px 20px;
          margin-bottom: 32px;
          border-radius: 0 8px 8px 0;
        }

        .section-explainer h3 {
          margin: 0 0 8px 0;
          color: var(--neon-primary);
          font-size: 16px;
          font-weight: 600;
        }

        .section-explainer p {
          margin: 0;
          color: var(--txt);
          font-size: 14px;
          line-height: 1.5;
        }

        .height-input-group {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .height-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .height-input {
          width: 80px;
        }

        .height-label {
          color: var(--txt);
          font-size: 14px;
          font-weight: 500;
          min-width: 20px;
        }

        .wearable-tips {
          background: rgba(255, 45, 222, 0.05);
          border-left: 3px solid var(--neon-secondary);
          padding: 12px 16px;
          margin-top: 16px;
          border-radius: 0 8px 8px 0;
        }

        .wearable-tip {
          margin-bottom: 8px;
        }

        .wearable-tip:last-child {
          margin-bottom: 0;
        }

        .wearable-tip-device {
          color: var(--neon-secondary);
          font-weight: 600;
          font-size: 14px;
        }

        .wearable-tip-instruction {
          color: var(--txt);
          font-size: 13px;
          margin-left: 16px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .section-nav {
            flex-direction: column;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }

          .height-input-group {
            flex-direction: row;
            justify-content: flex-start;
          }

          .height-input-wrapper {
            flex-direction: row;
            align-items: center;
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
            <form onSubmit={(e) => e.preventDefault()} onKeyDown={(e) => {
              if (e.key === 'Enter' && currentSection !== sections.length - 1) {
                e.preventDefault(); // Prevent accidental submission when not on final section
                console.log('⚠️ Enter key blocked - not on final section');
              }
            }}>
              
              {/* Loading state for profile data */}
              {isLoadingProfile && user && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-[#08F0FF] border-t-transparent rounded-full animate-spin"></div>
                    <span style={{ color: 'var(--txt)' }}>Loading your profile data...</span>
                  </div>
                </div>
              )}
              
              {/* Personal Info Section */}
              {currentSection === 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--txt)' }}>
                    Personal Information
                  </h2>

                  {/* Welcome message for authenticated users */}
                  {user && !isLoadingProfile && (
                    <div className="mb-6 p-4 rounded-lg" style={{ 
                      background: 'rgba(8, 240, 255, 0.1)', 
                      border: '1px solid rgba(8, 240, 255, 0.3)' 
                    }}>
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4" style={{ color: 'var(--neon-primary)' }} />
                        <span style={{ color: 'var(--neon-primary)', fontWeight: '600' }}>
                          Welcome back! 👋
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--txt)' }}>
                        We've pre-filled your personal information from your profile. You can update any details and add your performance metrics below.
                      </p>
                    </div>
                  )}
                  
                  <div className="section-explainer">
                    <h3>Why We Need Your Personal Details</h3>
                    <p>
                      Your <strong>body weight</strong> is fundamental to hybrid scoring - all strength calculations compare your lifts to bodyweight ratios (e.g., 1.5x bodyweight bench press for males). <strong>Gender</strong> determines your performance targets: males target 1.5x/2.0x/2.4x bodyweight for bench/squat/deadlift, while females target 1.0x/1.5x/1.8x. Your demographic profile ensures accurate peer comparison in the global leaderboard rankings.
                    </p>
                  </div>
                  
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
                        readOnly={!!user}
                        style={user ? { backgroundColor: 'var(--muted)', opacity: 0.7 } : {}}
                      />
                      {user && (
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                          Email cannot be changed for existing accounts
                        </p>
                      )}
                    </div>

                    {/* Only show password field for new users */}
                    {!user && (
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                          Password *
                        </label>
                        <input
                          type="password"
                          className="form-input"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Create a secure password"
                          required
                          minLength={6}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                          Password should be at least 6 characters long
                        </p>
                      </div>
                    )}

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
                  
                  <div className="section-explainer">
                    <h3>Understanding Your Physiological Foundation</h3>
                    <p>
                      <strong>Height & weight</strong> establish your strength-to-bodyweight ratios - the core of hybrid scoring. <strong>VO₂ max</strong> contributes 25% of your endurance score, compared against elite standards (70 for males, 60 for females). <strong>HRV carries 70% weight</strong> in your recovery score, while <strong>resting heart rate carries 30%</strong> - together they form a critical 10% of your total hybrid score.
                    </p>
                  </div>

                  {/* Dynamic Wearable Tips */}
                  {getWearableTips() && (
                    <div className="wearable-tips">
                      <h4 style={{ color: 'var(--neon-secondary)', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                        📱 How to Find These Metrics on Your Devices:
                      </h4>
                      {getWearableTips().map((tip, index) => (
                        <div key={index} className="wearable-tip">
                          <div className="wearable-tip-device">{tip.device}:</div>
                          <div className="wearable-tip-instruction">• VO₂ Max: {tip.vo2}</div>
                          <div className="wearable-tip-instruction">• Resting HR: {tip.rhr}</div>
                          <div className="wearable-tip-instruction">• HRV: {tip.hrv}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
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
                        Height *
                      </label>
                      <div className="height-input-group">
                        <div className="height-input-wrapper">
                          <input
                            type="number"
                            className="form-input height-input"
                            value={formData.height_ft}
                            onChange={(e) => handleInputChange('height_ft', e.target.value)}
                            placeholder="5"
                            min="3"
                            max="8"
                            required
                          />
                          <span className="height-label">ft</span>
                        </div>
                        <div className="height-input-wrapper">
                          <input
                            type="number"
                            className="form-input height-input"
                            value={formData.height_in}
                            onChange={(e) => handleInputChange('height_in', e.target.value)}
                            placeholder="10"
                            min="0"
                            max="11"
                            required
                          />
                          <span className="height-label">in</span>
                        </div>
                      </div>
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
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                        Heart Rate Variability - check your fitness tracker
                      </p>
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
                  
                  <div className="section-explainer">
                    <h3>Measuring Your Aerobic Engine</h3>
                    <p>
                      Your <strong>mile time</strong> determines your speed score (25% of endurance) - males target sub-5:30, females target sub-6:15. <strong>Weekly miles</strong> create your volume score with thresholds at 20/40/50+ miles. <strong>Long runs</strong> build your distance score with benchmarks at half-marathon (13.1mi), marathon (26.2mi), and ultra (50mi+) distances. Together, these form your endurance score - 40% of your total hybrid score.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 form-grid">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Mile PR (MM:SS)
                        <span className="text-xs" style={{ color: 'var(--muted)' }}> - Optional</span>
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
                        <span className="text-xs" style={{ color: 'var(--muted)' }}> - Optional</span>
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
                        <span className="text-xs" style={{ color: 'var(--muted)' }}> - Optional</span>
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
                        <span className="text-xs" style={{ color: 'var(--muted)' }}> - Optional</span>
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
                        <span className="text-xs" style={{ color: 'var(--muted)' }}> - Optional</span>
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
                        <span className="text-xs" style={{ color: 'var(--muted)' }}> - Optional</span>
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
                  
                  <div className="section-explainer">
                    <h3>Assessing Your Anaerobic Power</h3>
                    <p>
                      Your <strong>1-rep maxes directly determine 40% of your hybrid score</strong> through bodyweight ratio calculations. <strong>Males target:</strong> 1.5x bench, 2.0x squat, 2.4x deadlift. <strong>Females target:</strong> 1.0x bench, 1.5x squat, 1.8x deadlift. <strong>Missing lifts carry penalties:</strong> 8-point penalty for no lifts, 4-point penalty for only one lift. Even partial data significantly improves your score accuracy.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 form-grid">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Bench Press 1RM (lbs)
                        <span className="text-xs" style={{ color: 'var(--muted)' }}> - Optional</span>
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
                        <span className="text-xs" style={{ color: 'var(--muted)' }}> - Optional</span>
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
                        <span className="text-xs" style={{ color: 'var(--muted)' }}> - Optional</span>
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
                    type="button"
                    className="neon-button"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      isCreatingAccount ? 'Creating Account...' : 'Calculating Score...'
                    ) : (
                      'Calculate Hybrid Score'
                    )}
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