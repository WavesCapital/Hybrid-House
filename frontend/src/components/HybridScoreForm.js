import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Activity, User, Heart, Target, Trophy, Info, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import SharedHeader from './SharedHeader';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const HybridScoreForm = () => {
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
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
    runningApp: '',
    pb_mile: '',
    pb_5k: '',
    pb_10k: '',
    pb_half_marathon: '',
    pb_marathon: '',
    weekly_miles: '',
    long_run: '',
    
    // Strength Performance
    strengthApp: '',
    customStrengthApp: '',
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
          // First, check if there's preserved form data from before authentication
          const preservedData = localStorage.getItem('hybrid-score-form-data');
          if (preservedData) {
            console.log('🔍 Found preserved form data, restoring...');
            const parsedData = JSON.parse(preservedData);
            setFormData(prev => ({ ...prev, ...parsedData }));
            localStorage.removeItem('hybrid-score-form-data'); // Clean up
            
            toast({
              title: "Form Data Restored! 🎉",
              description: "Your previously entered data has been restored.",
              duration: 3000,
            });
            return; // Skip loading profile if we have preserved data
          }

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
              sex: userProfile.gender || '',
              dob: userProfile.dob || '',
              country: userProfile.country || 'US',
              wearables: Array.isArray(userProfile.wearables) ? userProfile.wearables : [],
              runningApp: userProfile.running_app || '',
              strengthApp: userProfile.strength_app && ['Strong', 'Jefit', 'StrongApp 5x5', 'Hevy', 'Gym Buddy', 'FitNotes', 'Simple Workout Log', 'RepCount', 'WorkIt', 'GymBook'].includes(userProfile.strength_app) ? userProfile.strength_app : userProfile.strength_app ? 'Other' : '',
              customStrengthApp: userProfile.strength_app && !['Strong', 'Jefit', 'StrongApp 5x5', 'Hevy', 'Gym Buddy', 'FitNotes', 'Simple Workout Log', 'RepCount', 'WorkIt', 'GymBook'].includes(userProfile.strength_app) ? userProfile.strength_app : '',
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

  const wearableOptions = [
    'Apple Watch', 'Garmin', 'Whoop', 'Ultrahuman Ring', 'Fitbit', 'Oura', 'None', 'Other'
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      toast({
        title: "Processing your data! 🚀",
        description: "Calculating your hybrid score...",
        duration: 3000,
      });

      // Calculate height in inches
      const heightInches = (parseInt(formData.height_ft) || 0) * 12 + (parseInt(formData.height_in) || 0);

      // Structure the data for submission - WEBHOOK FORMAT REQUIREMENTS:
      // The n8n.cloud webhook requires EXACTLY this format with "athleteProfile" and "deliverable": "score"
      // Based on successful webhook call example from user
      const profileData = {
        first_name: (formData.first_name || '').substring(0, 20),
        last_name: (formData.last_name || '').substring(0, 20),
        email: user?.email || `${formData.first_name?.toLowerCase() || 'user'}.${formData.last_name?.toLowerCase() || 'temp'}@temp-hybrid-score.com`,
        sex: formData.sex,
        dob: formData.dob,
        country: (formData.country || 'US').substring(0, 2),
        wearables: formData.wearables || [],
        running_app: formData.runningApp,
        strength_app: formData.strengthApp === 'Other' ? formData.customStrengthApp : formData.strengthApp,
        body_metrics: {
          weight_lb: parseFloat(formData.weight_lb) || 0,
          height_in: heightInches || 0,
          vo2max: parseFloat(formData.vo2max) || 0,
          resting_hr_bpm: parseInt(formData.resting_hr_bpm) || 0,
          hrv_ms: parseInt(formData.hrv_ms) || 0
        },
        pb_mile: formData.pb_mile || '',
        pb_5k: formData.pb_5k || '',
        pb_10k: formData.pb_10k || '',
        pb_half_marathon: formData.pb_half_marathon || '',
        pb_marathon: formData.pb_marathon || '',
        weekly_miles: parseFloat(formData.weekly_miles) || 0,
        long_run: parseFloat(formData.long_run) || 0,
        pb_bench_1rm: parseFloat(formData.pb_bench_1rm) || 0,
        pb_squat_1rm: parseFloat(formData.pb_squat_1rm) || 0,
        pb_deadlift_1rm: parseFloat(formData.pb_deadlift_1rm) || 0,
        schema_version: "v1.0",
        interview_type: "form"
      };

      // Generate unique profile ID
      const profileId = uuid();
      
      let response;
      
      if (user && session) {
        // Authenticated user
        response = await axios.post(
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
      } else {
        // Public submission
        const newProfile = {
          id: profileId,
          profile_json: profileData,
          is_public: true,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        response = await axios.post(
          `${BACKEND_URL}/api/athlete-profiles/public`,
          newProfile,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const finalProfileId = user && session ? response.data?.profile?.id : profileId;

      if (finalProfileId) {
        toast({
          title: "Profile Created! 🚀",
          description: "Calculating your hybrid score...",
          duration: 3000,
        });

        // Call webhook - CRITICAL REQUIREMENTS FOR n8n.cloud webhook:
        // 1. Must send "athleteProfile" object with all profile data
        // 2. Must send "deliverable": "score" (exact spelling and case)
        // 3. Content-Type must be application/json
        // 4. Data format must match exactly as shown in successful example
        console.log('🔥 CALLING WEBHOOK - Sending athleteProfile and deliverable:', {
          athleteProfileKeys: Object.keys(profileData),
          deliverable: 'score'
        });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minutes like other components

        const webhookPayload = {
          athleteProfile: profileData,
          deliverable: 'score'  // REQUIRED: exactly "score"
        };
        
        console.log('🔥 WEBHOOK PAYLOAD:', JSON.stringify(webhookPayload, null, 2));

        const webhookResponse = await fetch(
          'https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookPayload),
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);
        
        console.log('🔥 WEBHOOK RESPONSE STATUS:', webhookResponse.status);
        console.log('🔥 WEBHOOK RESPONSE HEADERS:', Object.fromEntries(webhookResponse.headers.entries()));

        if (webhookResponse.ok) {
          const responseText = await webhookResponse.text();
          console.log('🔥 WEBHOOK RESPONSE TEXT LENGTH:', responseText.length);
          console.log('🔥 WEBHOOK RESPONSE TEXT:', responseText);
          
          if (!responseText || responseText.trim() === '') {
            console.error('🚨 WEBHOOK RETURNED EMPTY RESPONSE - This means the n8n.cloud webhook is not configured correctly!');
            toast({
              title: "Webhook Configuration Issue",
              description: "The scoring service returned an empty response. Please check the n8n.cloud webhook configuration.",
              variant: "destructive",
              duration: 5000,
            });
            // Navigate anyway so user can see their profile
            navigate(`/hybrid-score/${finalProfileId}`);
            return;
          }
          
          let webhookData;
          try {
            webhookData = JSON.parse(responseText);
            console.log('Parsed webhook data:', webhookData);
          } catch (parseError) {
            console.error('Failed to parse webhook response:', parseError);
            console.error('Response text was:', responseText);
            toast({
              title: "Score Calculation Issue",
              description: "The scoring service returned an invalid response format. Your profile has been created successfully.",
              variant: "destructive",
              duration: 5000,
            });
            // Navigate anyway so user can see their profile
            navigate(`/hybrid-score/${finalProfileId}`);
            return;
          }
          
          // Handle both array and object responses
          const scoreData = Array.isArray(webhookData) ? webhookData[0] : webhookData;
          console.log('Score data extracted:', scoreData);

          // Verify we have valid score data
          if (!scoreData || typeof scoreData !== 'object') {
            console.error('Score data is not valid object:', scoreData);
            toast({
              title: "Score Calculation Issue", 
              description: "The scoring service returned invalid data. Your profile has been created successfully.",
              variant: "destructive",
              duration: 5000,
            });
            navigate(`/hybrid-score/${finalProfileId}`);
            return;
          }

          // Store score data
          try {
            const scoreHeaders = user && session ? 
              { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } :
              { 'Content-Type': 'application/json' };
              
            console.log('Storing score data in backend...');
            await axios.post(`${BACKEND_URL}/api/athlete-profile/${finalProfileId}/score`, scoreData, {
              headers: scoreHeaders
            });
            console.log('Score data stored successfully');
          } catch (scoreError) {
            console.warn('Could not store score:', scoreError.message);
            console.warn('Score error details:', scoreError.response?.data);
          }

          // Navigate to results
          console.log('Navigating to results page...');
          navigate(`/hybrid-score/${finalProfileId}`);
        } else {
          throw new Error('Webhook failed');
        }
      } else {
        throw new Error('No profile ID returned');
      }

    } catch (error) {
      console.error('Error in submission:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      
      let errorMessage = "Failed to calculate your hybrid score. Please try again.";
      
      if (error.name === 'AbortError') {
        errorMessage = "Score calculation timed out. Please try again with a stable connection.";
      } else if (error.message.includes('Webhook failed')) {
        errorMessage = "The scoring service is currently unavailable. Please try again later.";
      } else if (error.message.includes('JSON')) {
        errorMessage = "There was an issue processing your score. Your profile has been created.";
      } else if (error.message.includes('fetch')) {
        errorMessage = "Network error occurred. Please check your connection and try again.";
      }
      
      toast({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getRunningAppTips = () => {
    const selectedApp = formData.runningApp;
    if (!selectedApp) return null;

    const appTips = {
      'Strava': {
        appName: 'Strava',
        instructions: 'Open Strava app → Go to Your Profile → Tap "Personal Records" → Find your best times for Mile, 5K, 10K, and Half Marathon distances'
      },
      'Nike Run Club': {
        appName: 'Nike Run Club',
        instructions: 'Open Nike Run Club → Go to Profile → Tap "Achievements" → Scroll to "Personal Records" section to find your fastest times'
      },
      'Garmin Connect': {
        appName: 'Garmin Connect',
        instructions: 'Open Garmin Connect → Go to More → Personal Records → Select "Running" → View your best times for different distances'
      },
      'Apple Fitness': {
        appName: 'Apple Fitness',
        instructions: 'Open Apple Health app → Browse → Activity → Workouts → Show All Data → Filter by "Running" to find your fastest recorded times'
      },
      'Fitbit': {
        appName: 'Fitbit',
        instructions: 'Open Fitbit app → Today tab → Exercise tile → View exercise history → Find your fastest running workouts by distance'
      },
      'MapMyRun': {
        appName: 'MapMyRun',
        instructions: 'Open MapMyRun → Go to Profile → Tap "Personal Records" → View your best times across different running distances'
      },
      'Runkeeper': {
        appName: 'Runkeeper',
        instructions: 'Open Runkeeper → Go to Progress → Personal Records → View your fastest times for Mile, 5K, 10K, and longer distances'
      },
      'Adidas Running': {
        appName: 'Adidas Running',
        instructions: 'Open Adidas Running → Go to Progress → Personal Records → Find your best running times organized by distance'
      },
      'Polar Flow': {
        appName: 'Polar Flow',
        instructions: 'Open Polar Flow app → Diary → Filter by "Running" → Review your workout history to find your fastest times by distance'
      }
    };

    return appTips[selectedApp] || null;
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
    <>
      {/* Beautiful Calculation Modal */}
      <CalculationModal isVisible={isSubmitting} />
      
      <SharedHeader 
        title="Hybrid Score Form"
      />
      
      <div className="min-h-screen" style={{ background: '#0E0E11' }}>
      <style>
        {`
        /* Unified Design System */
        :root {
          --bg: #0E0E11;
          --card: #15161A;
          --card-secondary: #1A1B20;
          --border: #1F2025;
          --border-subtle: #2A2B30;
          --txt: #F5FAFF;
          --txt-muted: #8D9299;
          --txt-subtle: #6B7280;
          --neon-primary: #08F0FF;
          --neon-secondary: #00FF88;
          --neon-accent: #FFA42D;
          --gradient-primary: linear-gradient(135deg, #08F0FF 0%, #0EA5E9 100%);
          --shadow-glow: 0 0 20px rgba(8, 240, 255, 0.15);
          --shadow-glow-hover: 0 0 30px rgba(8, 240, 255, 0.25);
        }

        /* Unified Section Styling */
        .assessment-section {
          background: var(--card-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          transition: all 0.4s ease;
          box-shadow: var(--shadow-glow);
        }

        .assessment-section:hover {
          border-color: var(--neon-primary);
          box-shadow: var(--shadow-glow-hover);
          transform: translateY(-2px);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--gradient-primary);
          color: #000000;
        }

        .section-title {
          color: var(--txt);
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          color: var(--txt-muted);
          font-size: 16px;
          margin: 4px 0 0 0;
          font-weight: 400;
        }

        /* Unified Field Styling */
        .field-group {
          margin-bottom: 32px;
        }

        .field-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--txt);
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .field-description {
          color: var(--txt-muted);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 12px;
          padding-left: 4px;
        }

        .field-description-highlight {
          color: var(--neon-primary);
          font-weight: 600;
        }

        .required-indicator {
          color: var(--neon-primary);
          font-size: 18px;
        }

        .optional-indicator {
          color: var(--txt-subtle);
          font-size: 14px;
          font-weight: 400;
          font-style: italic;
          margin-left: 8px;
        }

        /* Device Tips - Unified */
        .device-tips {
          background: rgba(0, 255, 136, 0.06);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-top: 12px;
        }

        .device-tips-header {
          color: var(--neon-secondary);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .device-tip-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }

        .device-tip-item:last-child {
          margin-bottom: 0;
        }

        .device-tip-device {
          color: var(--neon-secondary);
          font-weight: 600;
          font-size: 13px;
        }

        .device-tip-instruction {
          color: var(--txt);
          font-size: 13px;
          line-height: 1.5;
          padding-left: 12px;
          border-left: 2px solid rgba(0, 255, 136, 0.3);
        }

        /* App Tips - Unified */
        .app-tips {
          background: rgba(255, 164, 45, 0.06);
          border: 1px solid rgba(255, 164, 45, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-top: 12px;
        }

        .app-tips-header {
          color: var(--neon-accent);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .app-tip-instruction {
          color: var(--txt);
          font-size: 14px;
          line-height: 1.6;
        }

        /* Height Input - Unified */
        .height-input-group {
          display: flex;
          gap: 16px;
          align-items: flex-end;
        }

        .height-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .height-input {
          width: 100px;
        }

        .height-unit-label {
          color: var(--txt-muted);
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }

        /* Grid Layout - Unified */
        .fields-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 32px;
        }

        /* Welcome Message - Unified */
        .welcome-message {
          background: rgba(8, 240, 255, 0.06);
          border: 1px solid rgba(8, 240, 255, 0.2);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .welcome-icon {
          color: var(--neon-primary);
          margin-top: 2px;
        }

        .welcome-content h3 {
          color: var(--neon-primary);
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .welcome-content p {
          color: var(--txt);
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
        }
        .submit-button {
          background: var(--neon-primary);
          color: #000000;
          border: none;
          border-radius: 12px;
          padding: 20px 40px;
          font-size: 18px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 48px auto 0;
          min-width: 280px;
          box-shadow: 
            0 0 20px rgba(8, 240, 255, 0.4),
            0 0 40px rgba(8, 240, 255, 0.2),
            0 4px 16px rgba(8, 240, 255, 0.3);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 
            0 0 30px rgba(8, 240, 255, 0.6),
            0 0 60px rgba(8, 240, 255, 0.3),
            0 8px 32px rgba(8, 240, 255, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 
            0 0 10px rgba(8, 240, 255, 0.2),
            0 0 20px rgba(8, 240, 255, 0.1),
            0 2px 8px rgba(8, 240, 255, 0.15);
        }

        /* Form Controls - Unified */
        .form-input {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--txt);
          padding: 16px;
          font-size: 16px;
          transition: all 0.3s ease;
          width: 100%;
          font-weight: 400;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--neon-primary);
          box-shadow: 0 0 0 3px rgba(8, 240, 255, 0.1);
          background: var(--card-secondary);
        }

        .form-input::placeholder {
          color: var(--txt-subtle);
        }

        .form-select {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--txt);
          padding: 16px;
          font-size: 16px;
          transition: all 0.3s ease;
          width: 100%;
          cursor: pointer;
          font-weight: 400;
        }

        .form-select:focus {
          outline: none;
          border-color: var(--neon-primary);
          box-shadow: 0 0 0 3px rgba(8, 240, 255, 0.1);
          background: var(--card-secondary);
        }

        /* Wearable Chips - Unified */
        .wearables-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 12px;
        }

        .wearable-chip {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 25px;
          color: var(--txt);
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 40px;
          width: 100%;
        }

        .wearable-chip:hover {
          border-color: var(--neon-primary);
          background: rgba(8, 240, 255, 0.05);
          transform: translateY(-1px);
        }

        .wearable-chip.selected {
          background: var(--neon-primary);
          color: #000000;
          border-color: var(--neon-primary);
          box-shadow: var(--shadow-glow);
        }

        /* Mobile Optimizations */
        @media (max-width: 768px) {
          .assessment-section {
            padding: 24px 20px;
            border-radius: 12px;
            margin-bottom: 20px;
          }

          .section-header {
            margin-bottom: 24px;
          }

          .section-icon {
            width: 40px;
            height: 40px;
          }

          .section-title {
            font-size: 24px;
          }

          .section-subtitle {
            font-size: 14px;
          }

          .fields-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .field-group {
            margin-bottom: 24px;
          }

          .wearables-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .wearable-chip {
            padding: 10px 14px;
            font-size: 13px;
            min-height: 40px;
          }

          .height-input-group {
            gap: 12px;
          }

          .height-input {
            width: 80px;
          }

          .submit-button {
            padding: 16px 32px;
            font-size: 16px;
            min-width: 240px;
          }
        }

        @media (max-width: 480px) {
          .assessment-section {
            padding: 20px 16px;
            margin-bottom: 16px;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            text-align: left;
          }

          .section-title {
            font-size: 22px;
          }

          .fields-grid {
            gap: 20px;
          }

          .field-group {
            margin-bottom: 20px;
          }

          .form-input, .form-select {
            font-size: 16px; /* Prevent zoom on iOS */
            padding: 14px;
          }

          .wearables-grid {
            grid-template-columns: 1fr 1fr;
          }

          .wearable-chip {
            padding: 8px 12px;
            font-size: 12px;
            min-height: 36px;
          }

          .welcome-message {
            padding: 20px 16px;
            flex-direction: column;
            gap: 12px;
          }

          .submit-button {
            padding: 14px 28px;
            font-size: 16px;
            min-width: 200px;
          }
        }

        `}
      </style>

      {/* Main Form - Single Scroll */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="max-w-5xl mx-auto">
          
          <form onSubmit={(e) => e.preventDefault()}>
            
            {/* Loading state for profile data */}
            {isLoadingProfile && user && (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-[#08F0FF] border-t-transparent rounded-full animate-spin"></div>
                  <span style={{ color: 'var(--txt)' }}>Loading your profile data...</span>
                </div>
              </div>
            )}
            
            {/* Personal Foundation Section */}
            <div className="assessment-section">
              <div className="section-header">
                <div className="section-icon">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="section-title">Personal Foundation</h2>
                  <p className="section-subtitle">Essential information for accurate assessment</p>
                </div>
              </div>

              {/* Welcome message for authenticated users */}
              {user && !isLoadingProfile && (
                <div className="welcome-message">
                  <div className="welcome-icon">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="welcome-content">
                    <h3>Account Created Successfully!</h3>
                    <p>Now let's collect your performance data to calculate your hybrid score. Any pre-filled information can be updated below.</p>
                  </div>
                </div>
              )}
              
              <div className="fields-grid">
                <div className="field-group">
                  <label className="field-label">
                    <span>First Name</span>
                    <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter your first name"
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>Last Name</span>
                    <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter your last name"
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>Gender</span>
                    <span className="required-indicator">*</span>
                  </label>
                  <p className="field-description">
                    Determines your performance targets: <span className="field-description-highlight">Males target</span> 1.5x/2.0x/2.4x bodyweight for bench/squat/deadlift, while <span className="field-description-highlight">females target</span> 1.0x/1.5x/1.8x bodyweight.
                  </p>
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

                <div className="field-group">
                  <label className="field-label">
                    <span>Date of Birth</span>
                    <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>Country</span>
                    <span className="optional-indicator">optional</span>
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

              <div className="field-group" style={{ marginTop: '48px' }}>
                <label className="field-label">
                  <span>Wearable Devices</span>
                  <span className="optional-indicator">select all that apply</span>
                </label>
                <p className="field-description">
                  Help us provide device-specific instructions for finding your health metrics.
                </p>
                <div className="wearables-grid">
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

            {/* Body Metrics Section */}
            <div className="assessment-section">
              <div className="section-header">
                <div className="section-icon">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="section-title">Body Metrics</h2>
                  <p className="section-subtitle">Physical measurements and health indicators</p>
                </div>
              </div>
              
              <div className="fields-grid">
                <div className="field-group">
                  <label className="field-label">
                    <span>Weight (lbs)</span>
                    <span className="required-indicator">*</span>
                  </label>
                  <p className="field-description">
                    Your body weight is fundamental to hybrid scoring - all <span className="field-description-highlight">strength calculations compare your lifts to bodyweight ratios</span> for accurate performance assessment.
                  </p>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.weight_lb}
                    onChange={(e) => handleInputChange('weight_lb', e.target.value)}
                    placeholder="190"
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>Height</span>
                    <span className="required-indicator">*</span>
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
                      <span className="height-unit-label">feet</span>
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
                      <span className="height-unit-label">inches</span>
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>VO₂ Max</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <p className="field-description">
                    Contributes <span className="field-description-highlight">25% of your endurance score</span>, compared against elite standards (70 for males, 60 for females). Can be estimated from mile time if not provided.
                  </p>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.vo2max}
                    onChange={(e) => handleInputChange('vo2max', e.target.value)}
                    placeholder="55"
                  />
                  {formData.wearables.length > 0 && (
                    <div className="device-tips">
                      <div className="device-tips-header">
                        <Info className="w-4 h-4" />
                        How to Find on Your Device
                      </div>
                      {getWearableTips()?.map((tip, index) => (
                        <div key={index} className="device-tip-item">
                          <span className="device-tip-device">{tip.device}</span>
                          <span className="device-tip-instruction">{tip.vo2}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>Resting Heart Rate (bpm)</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <p className="field-description">
                    Carries <span className="field-description-highlight">30% weight in your recovery score</span>. Lower resting heart rate typically indicates better cardiovascular fitness and recovery capacity.
                  </p>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.resting_hr_bpm}
                    onChange={(e) => handleInputChange('resting_hr_bpm', e.target.value)}
                    placeholder="45"
                  />
                  {formData.wearables.length > 0 && (
                    <div className="device-tips">
                      <div className="device-tips-header">
                        <Info className="w-4 h-4" />
                        How to Find on Your Device
                      </div>
                      {getWearableTips()?.map((tip, index) => (
                        <div key={index} className="device-tip-item">
                          <span className="device-tip-device">{tip.device}</span>
                          <span className="device-tip-instruction">{tip.rhr}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>HRV (ms)</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <p className="field-description">
                    <span className="field-description-highlight">HRV carries 70% weight</span> in your recovery score - a critical 10% of your total hybrid score. Higher HRV indicates better recovery and stress adaptation.
                  </p>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.hrv_ms}
                    onChange={(e) => handleInputChange('hrv_ms', e.target.value)}
                    placeholder="195"
                  />
                  {formData.wearables.length > 0 && (
                    <div className="device-tips">
                      <div className="device-tips-header">
                        <Info className="w-4 h-4" />
                        How to Find on Your Device
                      </div>
                      {getWearableTips()?.map((tip, index) => (
                        <div key={index} className="device-tip-item">
                          <span className="device-tip-device">{tip.device}</span>
                          <span className="device-tip-instruction">{tip.hrv}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Running Performance Section */}
            <div className="assessment-section">
              <div className="section-header">
                <div className="section-icon">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="section-title">Running Performance</h2>
                  <p className="section-subtitle">Your personal records and running volume</p>
                </div>
              </div>
              
              {/* Running App Selector */}
              <div className="field-group">
                <label className="field-label">
                  <span>Running Tracking App</span>
                  <span className="optional-indicator">optional</span>
                </label>
                <p className="field-description">
                  Select your primary running app to receive specific instructions for finding your personal records.
                </p>
                <select
                  className="form-select"
                  value={formData.runningApp}
                  onChange={(e) => handleInputChange('runningApp', e.target.value)}
                >
                  <option value="">Select running app</option>
                  <option value="Strava">Strava</option>
                  <option value="Nike Run Club">Nike Run Club</option>
                  <option value="Garmin Connect">Garmin Connect</option>
                  <option value="Apple Fitness">Apple Fitness/Health</option>
                  <option value="Fitbit">Fitbit</option>
                  <option value="MapMyRun">MapMyRun (Under Armour)</option>
                  <option value="Runkeeper">Runkeeper</option>
                  <option value="Adidas Running">Adidas Running</option>
                  <option value="Polar Flow">Polar Flow</option>
                </select>
                
                {getRunningAppTips() && (
                  <div className="app-tips">
                    <div className="app-tips-header">
                      <Target className="w-4 h-4" />
                      How to Find Your Best Times in {getRunningAppTips().appName}
                    </div>
                    <div className="app-tip-instruction">
                      {getRunningAppTips().instructions}
                    </div>
                  </div>
                )}
              </div>

              <div className="fields-grid">
                <div className="field-group">
                  <label className="field-label">
                    <span>Mile PR (MM:SS)</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <p className="field-description">
                    Determines your speed score (25% of endurance). Elite targets: <span className="field-description-highlight">sub-5:30 for males, sub-6:15 for females</span>. Used to estimate VO₂ max if not provided.
                  </p>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.pb_mile}
                    onChange={(e) => handleInputChange('pb_mile', e.target.value)}
                    placeholder="4:59"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>5K PR (MM:SS)</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.pb_5k}
                    onChange={(e) => handleInputChange('pb_5k', e.target.value)}
                    placeholder="18:30"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>10K PR (MM:SS)</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.pb_10k}
                    onChange={(e) => handleInputChange('pb_10k', e.target.value)}
                    placeholder="38:00"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>Half Marathon PR (HH:MM:SS)</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.pb_half_marathon}
                    onChange={(e) => handleInputChange('pb_half_marathon', e.target.value)}
                    placeholder="1:25:00"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>Marathon PR (HH:MM:SS)</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <p className="field-description">
                    Elite targets: <span className="field-description-highlight">sub-3:00 for males, sub-3:30 for females</span>. Marathon performance demonstrates exceptional endurance and pacing strategy.
                  </p>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.pb_marathon}
                    onChange={(e) => handleInputChange('pb_marathon', e.target.value)}
                    placeholder="3:15:00"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>Weekly Miles</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <p className="field-description">
                    Creates your volume score with thresholds at <span className="field-description-highlight">20/40/50+ miles</span>. Higher weekly mileage indicates greater aerobic base and endurance capacity.
                  </p>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.weekly_miles}
                    onChange={(e) => handleInputChange('weekly_miles', e.target.value)}
                    placeholder="40"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>Long Run (miles)</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <p className="field-description">
                    Builds your distance score with benchmarks at <span className="field-description-highlight">half-marathon (13.1mi), marathon (26.2mi), and ultra (50mi+)</span> distances.
                  </p>
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

            {/* Strength Performance Section */}
            <div className="assessment-section">
              <div className="section-header">
                <div className="section-icon">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="section-title">Strength Performance</h2>
                  <p className="section-subtitle">Your one-rep maximums and strength training</p>
                </div>
              </div>
              
              {/* Strength App Selector */}
              <div className="field-group">
                <label className="field-label">
                  <span>Strength Tracking App</span>
                  <span className="optional-indicator">optional</span>
                </label>
                <p className="field-description">
                  Track how you record your strength training to help us understand your lifting data.
                </p>
                <select
                  className="form-select"
                  value={formData.strengthApp}
                  onChange={(e) => handleInputChange('strengthApp', e.target.value)}
                >
                  <option value="">Select strength app</option>
                  <option value="Strong">Strong (iOS)</option>
                  <option value="Jefit">Jefit</option>
                  <option value="StrongApp 5x5">StrongApp 5x5</option>
                  <option value="Hevy">Hevy</option>
                  <option value="Gym Buddy">Gym Buddy</option>
                  <option value="FitNotes">FitNotes (Android)</option>
                  <option value="Simple Workout Log">Simple Workout Log</option>
                  <option value="RepCount">RepCount</option>
                  <option value="WorkIt">WorkIt</option>
                  <option value="GymBook">GymBook</option>
                  <option value="Other">Other</option>
                </select>
                
                {formData.strengthApp === 'Other' && (
                  <div className="field-group" style={{ marginTop: '16px', marginBottom: '0' }}>
                    <label className="field-label">
                      <span>Specify Your App</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.customStrengthApp}
                      onChange={(e) => handleInputChange('customStrengthApp', e.target.value)}
                      placeholder="Enter app name"
                    />
                  </div>
                )}
              </div>

              <div className="fields-grid">
                <div className="field-group">
                  <label className="field-label">
                    <span>Bench Press 1RM (lbs)</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <p className="field-description">
                    Target: <span className="field-description-highlight">1.5x bodyweight for males, 1.0x for females</span>. Missing lifts carry penalties, but even partial data significantly improves your score accuracy.
                  </p>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.pb_bench_1rm}
                    onChange={(e) => handleInputChange('pb_bench_1rm', e.target.value)}
                    placeholder="315"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>Squat 1RM (lbs)</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <p className="field-description">
                    Target: <span className="field-description-highlight">2.0x bodyweight for males, 1.5x for females</span>. Your 1-rep maxes directly determine 40% of your hybrid score through bodyweight ratio calculations.
                  </p>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.pb_squat_1rm}
                    onChange={(e) => handleInputChange('pb_squat_1rm', e.target.value)}
                    placeholder="405"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <span>Deadlift 1RM (lbs)</span>
                    <span className="optional-indicator">optional</span>
                  </label>
                  <p className="field-description">
                    Target: <span className="field-description-highlight">2.4x bodyweight for males, 1.8x for females</span>. The deadlift tests total-body strength and is crucial for hybrid athletic performance.
                  </p>
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

            {/* Submit Button */}
            <button
              type="button"
              className="submit-button"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating Score...
                </>
              ) : (
                'Calculate Hybrid Score'
              )}
            </button>
          </form>
        </div>
      </div>
      </div>
    </>
  );
};

// Badass Neon Calculation Modal Component
const CalculationModal = ({ isVisible }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { text: "ANALYZING PERFORMANCE DATA", duration: 2000 },
    { text: "CALCULATING STRENGTH MATRIX", duration: 2000 },
    { text: "EVALUATING ENDURANCE METRICS", duration: 2000 },
    { text: "PROCESSING POWER ALGORITHMS", duration: 2000 },
    { text: "FINALIZING HYBRID SCORE", duration: 2000 }
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 100); // 10 seconds total

    // Step text animation
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return steps.length - 1;
        }
        return prev + 1;
      });
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-md">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(8, 240, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(8, 240, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }}></div>
      </div>

      <div className="relative max-w-lg w-full mx-4">
        {/* Main container with STABLE neon border */}
        <div 
          className="relative bg-black rounded-lg p-8 shadow-2xl"
          style={{
            border: '2px solid rgb(8, 240, 255)',
            boxShadow: `
              0 0 20px rgba(8, 240, 255, 0.5),
              0 0 40px rgba(8, 240, 255, 0.3),
              inset 0 0 20px rgba(8, 240, 255, 0.1)
            `
          }}
        >
          {/* STABLE background glow - no jumping */}
          <div 
            className="absolute inset-0 rounded-lg opacity-20"
            style={{
              background: 'linear-gradient(45deg, rgba(8, 240, 255, 0.1), rgba(59, 130, 246, 0.1))',
              filter: 'blur(20px)'
            }}
          ></div>
          
          <div className="relative z-10">
            {/* Header with home page typography */}
            <div className="text-center mb-8">
              <h1 
                className="text-3xl lg:text-4xl font-extrabold text-white mb-2" 
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  textShadow: '0 0 20px rgba(8, 240, 255, 0.6)',
                  letterSpacing: '0.05em'
                }}
              >
                CALCULATING
              </h1>
              <h2 
                className="text-2xl lg:text-3xl font-bold mb-4"
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  background: 'linear-gradient(135deg, rgb(8, 240, 255) 0%, rgb(59, 130, 246) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(8, 240, 255, 0.8)',
                  letterSpacing: '0.1em'
                }}
              >
                HYBRID SCORE
              </h2>
            </div>

            {/* Neon progress bar */}
            <div className="mb-8">
              <div 
                className="relative w-full h-4 bg-gray-900 rounded-sm overflow-hidden"
                style={{
                  border: '1px solid rgba(8, 240, 255, 0.3)',
                  boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)'
                }}
              >
                {/* Progress fill with neon effect */}
                <div 
                  className="h-full relative transition-all duration-100 ease-out"
                  style={{ 
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, rgb(8, 240, 255), rgb(59, 130, 246))',
                    boxShadow: '0 0 20px rgba(8, 240, 255, 0.8)'
                  }}
                >
                  {/* Animated scanner line */}
                  <div className="absolute right-0 top-0 w-1 h-full bg-white opacity-80"></div>
                  {/* Moving neon effect */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                      animation: 'scan 2s linear infinite'
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Progress percentage with home page typography */}
              <div className="flex justify-between items-center mt-3">
                <span 
                  className="text-cyan-400 text-sm font-semibold"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    letterSpacing: '0.1em'
                  }}
                >
                  PROGRESS
                </span>
                <span 
                  className="text-white text-lg font-bold"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    textShadow: '0 0 10px rgba(8, 240, 255, 0.5)'
                  }}
                >
                  {progress}%
                </span>
              </div>
            </div>

            {/* Current step with stable styling */}
            <div 
              className="rounded p-4 mb-6"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(8, 240, 255, 0.3)',
                boxShadow: '0 0 15px rgba(8, 240, 255, 0.2)'
              }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                <span 
                  className="text-cyan-400 text-xs font-semibold"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    letterSpacing: '0.1em'
                  }}
                >
                  STATUS
                </span>
              </div>
              <p 
                className="text-white text-sm font-medium"
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  textShadow: '0 0 5px rgba(255, 255, 255, 0.3)'
                }}
              >
                {steps[currentStep]?.text}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default HybridScoreForm;