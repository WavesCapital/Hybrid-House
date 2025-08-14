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
  const [currentSection, setCurrentSection] = useState(0);
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
      console.log('🔍 WEBHOOK - Starting webhook for hybrid score calculation...');
      console.log('🔍 WEBHOOK - Profile ID:', profileId);
      console.log('🔍 WEBHOOK - Athlete profile data:', athleteProfileData);
      console.log('🔍 WEBHOOK - Session:', currentSession?.access_token ? 'Present' : 'Missing');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minutes

      console.log('🔍 WEBHOOK - Sending POST request to webhook URL...');
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
      console.log('🔍 WEBHOOK - Response received, status:', response.status);

      if (!response.ok) {
        console.error('❌ WEBHOOK - Response not OK:', response.status, response.statusText);
        throw new Error(`Webhook request failed with status: ${response.status}`);
      }

      console.log('🔍 WEBHOOK - Parsing response JSON...');
      const data = await response.json();
      console.log('🔍 WEBHOOK - Response data:', data);
      
      const scoreData = Array.isArray(data) ? data[0] : data;
      console.log('🔍 WEBHOOK - Score data extracted:', scoreData);
      
      console.log('🔍 WEBHOOK - Storing score data in backend...');
      // Store score data in Supabase (only if we have authentication)
      if (currentSession?.access_token) {
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
        console.log('✅ WEBHOOK - Score stored successfully (authenticated)');
      } else {
        // For public submissions, try to store without authentication
        try {
          await axios.post(
            `${BACKEND_URL}/api/athlete-profile/${profileId}/score`,
            scoreData,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          console.log('✅ WEBHOOK - Score stored successfully (public)');
        } catch (scoreError) {
          // If score storage fails for public submission, continue anyway since the webhook succeeded
          console.warn('⚠️ WEBHOOK - Could not store score for public submission, but webhook succeeded');
          console.warn('⚠️ WEBHOOK - Score error:', scoreError.message);
        }
      }

      console.log('✅ WEBHOOK - Navigating to results...');
      // Navigate to score results
      navigate(`/hybrid-score/${profileId}`);
      
    } catch (error) {
      console.error('❌ WEBHOOK - Error calling webhook:', error);
      console.error('❌ WEBHOOK - Error message:', error.message);
      console.error('❌ WEBHOOK - Error name:', error.name);
      
      if (error.name === 'AbortError') {
        console.error('❌ WEBHOOK - Request timed out after 4 minutes');
        toast({
          title: "Request timed out",
          description: "Score calculation is taking longer than expected. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error calculating score",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    console.log('🚀 CRITICAL DEBUG - handleSubmit ENTRY POINT');
    console.log('🚀 Event object:', e);
    console.log('🚀 Button clicked at:', new Date().toISOString());
    
    if (e) e.preventDefault();
    
    console.log('🔍 DEBUG - handleSubmit called!');
    console.log('🔍 DEBUG - currentSection:', currentSection);
    console.log('🔍 DEBUG - sections.length:', sections.length);
    console.log('🔍 DEBUG - sections.length - 1:', sections.length - 1);
    console.log('🔍 DEBUG - isSubmitting:', isSubmitting);
    console.log('🔍 DEBUG - user:', user);
    console.log('🔍 DEBUG - session:', session);
    
    // Add more debugging for form data
    console.log('🔍 DEBUG - formData keys:', Object.keys(formData));
    console.log('🔍 DEBUG - first_name:', formData.first_name);
    console.log('🔍 DEBUG - last_name:', formData.last_name);
    
    if (isSubmitting) {
      console.log('⚠️ Form submission blocked - already submitting');
      return;
    }

    // Check if we're on the final section before proceeding
    console.log('🔍 DEBUG - Section check - currentSection:', currentSection, 'vs final section:', sections.length - 1);
    if (currentSection !== sections.length - 1) {
      console.log('⚠️ Form submission blocked - not on final section');
      console.log('⚠️ Current section:', currentSection, 'Final section should be:', sections.length - 1);
      
      // Navigate to final section automatically
      setCurrentSection(sections.length - 1);
      toast({
        title: "Please complete the form",
        description: "Navigating to the final section to submit your assessment.",
        variant: "default",
      });
      return;
    }

    // Handle both authenticated and unauthenticated users
    if (!user || !session) {
      console.log('⚠️ No authentication - proceeding with public submission');
      setIsSubmitting(true);
      
      try {
        // For unauthenticated users, we'll use the public endpoint
        // Generate a temporary user email from form data for webhook submission
        const tempEmail = `${formData.first_name?.toLowerCase() || 'user'}.${formData.last_name?.toLowerCase() || 'temp'}@temp-hybrid-score.com`;
        
        toast({
          title: "Processing your data! 🚀",
          description: "Calculating your hybrid score...",
          duration: 3000,
        });

        // Calculate height in inches
        const heightInches = (parseInt(formData.height_ft) || 0) * 12 + (parseInt(formData.height_in) || 0);

        // Structure the data for public submission (same format as ProfilePage)
        const profileData = {
          first_name: (formData.first_name || '').substring(0, 20),
          last_name: (formData.last_name || '').substring(0, 20),
          email: tempEmail,
          sex: formData.sex,
          dob: formData.dob,
          country: (formData.country || 'US').substring(0, 2),
          wearables: formData.wearables,
          running_app: formData.runningApp || null,
          strength_app: formData.strengthApp === 'Other' ? formData.customStrengthApp : formData.strengthApp || null,
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

        console.log('🔍 DEBUGGING - Creating public athlete profile...');
        console.log('🔍 DEBUGGING - Profile data:', profileData);

        // Generate unique profile ID like ProfilePage does
        const profileId = uuid();
        
        // Create athlete profile using public endpoint (same structure as ProfilePage)
        const newProfile = {
          id: profileId,
          profile_json: profileData,
          is_public: true,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const response = await axios.post(
          `${BACKEND_URL}/api/athlete-profiles/public`,
          newProfile,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('🔍 DEBUGGING - Public profile response:', response);
        console.log('🔍 DEBUGGING - Using profile ID:', profileId);

        toast({
          title: "Profile Created! 🚀",
          description: "Calculating your hybrid score...",
          duration: 3000,
        });

        // Call webhook directly like ProfilePage (WORKING METHOD)
        console.log('🔍 DEBUGGING - Calling webhook directly with fetch...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minutes

        const webhookResponse = await fetch(
          'https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              athleteProfile: profileData,
              deliverable: 'score'
            }),
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!webhookResponse.ok) {
          throw new Error(`Webhook request failed with status: ${webhookResponse.status}`);
        }

        const webhookData = await webhookResponse.json();
        console.log('✅ DEBUGGING - Webhook response:', webhookData);

        // Handle the response - it's an array with the score data
        const scoreData = Array.isArray(webhookData) ? webhookData[0] : webhookData;

        // Store score data (optional for public submissions)
        try {
          await axios.post(`${BACKEND_URL}/api/athlete-profile/${profileId}/score`, scoreData);
          console.log('✅ DEBUGGING - Score stored successfully');
        } catch (scoreError) {
          console.warn('⚠️ DEBUGGING - Could not store score for public submission:', scoreError.message);
        }

        // Navigate to results
        console.log('✅ DEBUGGING - Navigating to results page...');
        navigate(`/hybrid-score/${profileId}`);
        
      } catch (error) {
        console.error('❌ DEBUGGING - Error in public submission:', error);
        console.error('❌ DEBUGGING - Error message:', error.message);
        console.error('❌ DEBUGGING - Error stack:', error.stack);
        console.error('❌ DEBUGGING - Error response:', error.response?.data);
        console.error('❌ DEBUGGING - Error status:', error.response?.status);
        
        let errorMessage = "Failed to calculate your hybrid score. Please try again.";
        if (error.name === 'AbortError') {
          errorMessage = "Score calculation timed out. Please try again.";
        } else if (error.message.includes('Webhook')) {
          errorMessage = "Score calculation failed. Please try again.";
        }
        
        toast({
          title: "Submission Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        // Don't immediately set to false - let redirect happen first
        setTimeout(() => {
          console.log('🔍 DEBUGGING - Setting isSubmitting to false (public)');
          setIsSubmitting(false);
        }, 1000);
      }
      
      return; // Exit early for public submission
    }

    console.log('✅ Form submission proceeding - user clicked Calculate Hybrid Score');
    setIsSubmitting(true);

    try {
      console.log('User already authenticated, proceeding with score calculation...');
      toast({
        title: "Processing your data! 🚀",
        description: "Calculating your hybrid score...",
        duration: 3000,
      });

      // Calculate height in inches
      const heightInches = (parseInt(formData.height_ft) || 0) * 12 + (parseInt(formData.height_in) || 0);

      // Structure the data for submission
      const profileData = {
        first_name: (formData.first_name || '').substring(0, 20), // Limit first name
        last_name: (formData.last_name || '').substring(0, 20),   // Limit last name
        email: (user.email || '').substring(0, 50),               // Get email from authenticated user
        sex: formData.sex,
        dob: formData.dob,
        country: (formData.country || 'US').substring(0, 2),        // Limit country to 2 chars
        wearables: formData.wearables,
        running_app: formData.runningApp || null,
        strength_app: formData.strengthApp === 'Other' ? formData.customStrengthApp : formData.strengthApp || null,
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

      console.log('🔍 DEBUGGING - Creating athlete profile...');
      console.log('🔍 DEBUGGING - Backend URL:', BACKEND_URL);
      console.log('🔍 DEBUGGING - Session access token:', session?.access_token ? 'Present' : 'Missing');
      console.log('🔍 DEBUGGING - Profile data:', profileData);

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

      console.log('🔍 DEBUGGING - Athlete profile response:', response);
      console.log('🔍 DEBUGGING - Response data:', response.data);

      const profileResult = response.data;
      const profileId = profileResult.profile?.id;

      console.log('🔍 DEBUGGING - Profile ID extracted:', profileId);

      if (profileId) {
        console.log('✅ DEBUGGING - Profile created successfully, triggering webhook...');
        toast({
          title: "Profile Created! 🚀",
          description: "Calculating your hybrid score...",
          duration: 3000,
        });

        // Trigger webhook for score calculation with complete profile data
        console.log('🔍 DEBUGGING - About to call triggerWebhookForScore...');
        await triggerWebhookForScore(profileData, profileId, session);
        console.log('✅ DEBUGGING - triggerWebhookForScore completed');
      } else {
        console.error('❌ DEBUGGING - No profile ID returned from API');
        console.error('❌ DEBUGGING - Full response data:', profileResult);
        throw new Error('No profile ID returned');
      }

    } catch (error) {
      console.error('❌ DEBUGGING - Error in handleSubmit:', error);
      console.error('❌ DEBUGGING - Error message:', error.message);
      console.error('❌ DEBUGGING - Error response:', error.response?.data);
      console.error('❌ DEBUGGING - Error status:', error.response?.status);
      
      toast({
        title: "Submission Error",
        description: error.response?.data?.message || error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('🔍 DEBUGGING - Setting isSubmitting to false');
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
        /* Flat-Neon "Laser Pop" Color System */
        :root {
          --bg: #0E0E11;
          --card: #15161A;
          --border: #1F2025;
          --txt: #F5FAFF;
          --muted: #8D9299;
          --neon-primary: #08F0FF;
          --neon-secondary: #00FF88;
        }

        /* Field Explanation Styles - High Priority */
        .field-explanation {
          background: rgba(8, 240, 255, 0.08) !important;
          border-left: 3px solid #08F0FF !important;
          border-radius: 0 8px 8px 0 !important;
          padding: 12px 16px !important;
          margin-top: 8px !important;
          margin-bottom: 12px !important;
          transition: all 0.3s ease !important;
          display: block !important;
        }

        .field-explanation:hover {
          background: rgba(8, 240, 255, 0.12) !important;
          border-left-color: #00FF88 !important;
        }

        .field-explanation-header {
          color: #08F0FF !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          margin-bottom: 6px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        .field-explanation-text {
          color: #F5FAFF !important;
          font-size: 13px !important;
          line-height: 1.5 !important;
          margin: 0 !important;
        }

        /* Optional Label Styles */
        .optional-label {
          display: inline !important;
          background: none !important;
          color: #8D9299 !important;
          font-size: 12px !important;
          font-weight: 400 !important;
          padding: 0 !important;
          border-radius: 0 !important;
          margin-left: 8px !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
          border: none !important;
          font-style: italic !important;
        }

        /* Wearable Tips Styles */
        .wearable-tips {
          background: rgba(0, 255, 136, 0.08) !important;
          border-left: 3px solid #00FF88 !important;
          border-radius: 0 8px 8px 0 !important;
          padding: 10px 14px !important;
          margin-top: 6px !important;
          transition: all 0.3s ease !important;
        }

        .wearable-tips:hover {
          background: rgba(0, 255, 136, 0.12) !important;
          border-left-color: #33FF99 !important;
        }

        .wearable-tips-header {
          color: #00FF88 !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          margin-bottom: 8px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        .wearable-tip {
          display: flex !important;
          flex-direction: column !important;
          margin-bottom: 6px !important;
          padding-left: 4px !important;
        }

        .wearable-tip:last-child {
          margin-bottom: 0 !important;
        }

        .wearable-tip-device {
          color: #00FF88 !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          margin-bottom: 2px !important;
        }

        .wearable-tip-instruction {
          color: #F5FAFF !important;
          font-size: 11px !important;
          line-height: 1.4 !important;
          padding-left: 8px !important;
          border-left: 2px solid rgba(0, 255, 136, 0.3) !important;
        }

        /* Running App Selector Styles */
        .running-app-section {
          margin-bottom: 24px !important;
        }

        /* Running App Tips Styles */
        .running-app-tips {
          background: rgba(255, 164, 45, 0.08) !important;
          border-left: 3px solid #FFA42D !important;
          border-radius: 0 8px 8px 0 !important;
          padding: 12px 16px !important;
          margin-top: 8px !important;
          transition: all 0.3s ease !important;
        }

        .running-app-tips:hover {
          background: rgba(255, 164, 45, 0.12) !important;
          border-left-color: #FFB85C !important;
        }

        .running-app-tips-header {
          color: #FFA42D !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          margin-bottom: 8px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        .running-app-tip-instruction {
          color: #F5FAFF !important;
          font-size: 13px !important;
          line-height: 1.5 !important;
        }

        /* Strength App Selector Styles */
        .strength-app-section {
          margin-bottom: 24px !important;
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
          background: var(--neon-primary);
          box-shadow: 
            0 8px 32px rgba(8, 240, 255, 0.6),
            0 4px 16px rgba(8, 240, 255, 0.4),
            0 0 20px rgba(8, 240, 255, 0.8);
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
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 32px;
        }

        .section-tab {
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
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
          min-height: 70px;
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
          background: rgba(0, 255, 136, 0.05);
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
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            margin-bottom: 24px;
          }
          
          .section-tab {
            padding: 8px 4px;
            font-size: 12px;
            flex-direction: column;
            gap: 4px;
            min-height: 60px;
          }

          .section-tab .hidden {
            display: block !important;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .height-input-group {
            flex-direction: row;
            justify-content: flex-start;
            flex-wrap: wrap;
            gap: 8px;
          }

          .height-input-wrapper {
            flex-direction: row;
            align-items: center;
            flex: none;
          }

          .height-input {
            width: 70px;
          }

          .wearable-chip {
            font-size: 13px;
            padding: 10px 14px;
            margin: 3px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .wearable-tips {
            padding: 12px;
            margin-top: 12px;
          }

          .wearable-tip-instruction {
            margin-left: 8px;
            font-size: 12px;
          }

          .section-explainer {
            padding: 12px;
            margin-bottom: 16px;
          }

          .section-explainer h3 {
            font-size: 16px;
            margin-bottom: 8px;
          }

          .section-explainer p {
            font-size: 13px;
            line-height: 1.4;
          }
        }

        @media (max-width: 480px) {
          .container {
            padding-left: 16px;
            padding-right: 16px;
          }

          .section-nav {
            grid-template-columns: 1fr 1fr;
            gap: 3px;
          }

          .section-tab {
            padding: 6px 2px;
            font-size: 11px;
            min-height: 55px;
          }

          .form-grid {
            gap: 12px;
          }

          .form-input, .form-select {
            font-size: 16px; /* Prevent zoom on iOS */
            padding: 12px 14px;
            min-height: 44px;
          }

          .neon-button {
            font-size: 16px;
            padding: 14px 20px;
            min-height: 48px;
          }

          .wearable-chip {
            font-size: 12px;
            padding: 8px 12px;
            margin: 2px;
            min-height: 44px;
          }

          .height-input {
            width: 60px;
            font-size: 16px;
          }

          .height-label {
            font-size: 12px;
          }

          .section-explainer {
            padding: 10px;
          }

          .section-explainer h3 {
            font-size: 15px;
          }

          .section-explainer p {
            font-size: 12px;
          }

          .wearable-tips {
            padding: 8px 12px !important;
            margin-top: 4px !important;
          }

          .wearable-tips-header {
            font-size: 11px !important;
            margin-bottom: 6px !important;
          }

          .wearable-tip-device {
            font-size: 10px !important;
          }

          .wearable-tip-instruction {
            font-size: 10px !important;
            padding-left: 6px !important;
          }



        @media (max-width: 768px) {
          .field-explanation {
            padding: 10px 12px;
            margin-top: 6px;
          }

          .field-explanation-header {
            font-size: 12px;
            margin-bottom: 4px;
          }

          .field-explanation-text {
            font-size: 12px;
            line-height: 1.4;
          }

          .optional-label {
            font-size: 9px;
            padding: 1px 4px;
            margin-left: 6px;
          }

          .wearable-tips {
            padding: 8px 12px !important;
            margin-top: 4px !important;
          }

          .wearable-tips-header {
            font-size: 11px !important;
            margin-bottom: 6px !important;
          }

          .wearable-tip-device {
            font-size: 10px !important;
          }

          .wearable-tip-instruction {
            font-size: 10px !important;
            padding-left: 6px !important;
          }

          .running-app-section {
            margin-bottom: 20px !important;
          }

          .running-app-tips {
            padding: 10px 14px !important;
          }

          .running-app-tips-header {
            font-size: 11px !important;
            margin-bottom: 6px !important;
          }

          .running-app-tip-instruction {
            font-size: 12px !important;
          }

          .strength-app-section {
            margin-bottom: 20px !important;
          }
        }

        @media (max-width: 480px) {
          .field-explanation {
            padding: 8px 10px;
          }

          .field-explanation-header {
            font-size: 11px;
          }

          .field-explanation-text {
            font-size: 11px;
          }

          .optional-label {
            font-size: 8px;
            padding: 1px 3px;
            margin-left: 4px;
          }

          .wearable-tips {
            padding: 6px 10px !important;
            margin-top: 4px !important;
          }

          .wearable-tips-header {
            font-size: 10px !important;
            margin-bottom: 4px !important;
          }

          .wearable-tip-device {
            font-size: 9px !important;
          }

          .wearable-tip-instruction {
            font-size: 9px !important;
            padding-left: 4px !important;
          }

          .running-app-section {
            margin-bottom: 16px !important;
          }

          .running-app-tips {
            padding: 8px 12px !important;
          }

          .running-app-tips-header {
            font-size: 10px !important;
            margin-bottom: 4px !important;
          }

          .running-app-tip-instruction {
            font-size: 11px !important;
          }

          .strength-app-section {
            margin-bottom: 16px !important;
          }
        }
        `}
      </style>

      {/* Main Form */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="p-4 sm:p-8" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            
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
                  <span className="text-xs sm:text-sm">{section.title}</span>
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
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: 'var(--txt)' }}>
                    Personal Information
                  </h2>

                  {/* Welcome message for authenticated users */}
                  {user && !isLoadingProfile && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg" style={{ 
                      background: 'rgba(8, 240, 255, 0.1)', 
                      border: '1px solid rgba(8, 240, 255, 0.3)' 
                    }}>
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4" style={{ color: 'var(--neon-primary)' }} />
                        <span className="text-sm sm:text-base" style={{ color: 'var(--neon-primary)', fontWeight: '600' }}>
                          Account Created Successfully! 🎉
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm" style={{ color: 'var(--txt)' }}>
                        Now let's collect your performance data to calculate your hybrid score. Any pre-filled information can be updated below.
                      </p>
                    </div>
                  )}
                  

                  
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
                      <div className="field-explanation">
                        <div className="field-explanation-header">Performance Targets</div>
                        <div className="field-explanation-text">
                          Determines your performance targets: <strong>Males target</strong> 1.5x/2.0x/2.4x bodyweight for bench/squat/deadlift, while <strong>females target</strong> 1.0x/1.5x/1.8x bodyweight.
                        </div>
                      </div>
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
                      <div className="field-explanation">
                        <div className="field-explanation-header">Strength Foundation</div>
                        <div className="field-explanation-text">
                          Your body weight is fundamental to hybrid scoring - all strength calculations compare your lifts to bodyweight ratios for accurate performance assessment.
                        </div>
                      </div>
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
                      <div className="field-explanation">
                        <div className="field-explanation-header">Aerobic Engine</div>
                        <div className="field-explanation-text">
                          Contributes 25% of your endurance score, compared against elite standards (70 for males, 60 for females). Can be estimated from mile time if not provided.
                        </div>
                      </div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        VO₂ Max
                        <span className="optional-label">Optional</span>
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.vo2max}
                        onChange={(e) => handleInputChange('vo2max', e.target.value)}
                        placeholder="55"
                      />
                      {formData.wearables.length > 0 && (
                        <div className="wearable-tips">
                          <div className="wearable-tips-header">How to Find on Your Device</div>
                          {getWearableTips()?.map((tip, index) => (
                            <div key={index} className="wearable-tip">
                              <span className="wearable-tip-device">{tip.device}:</span>
                              <span className="wearable-tip-instruction">{tip.vo2}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="field-explanation">
                        <div className="field-explanation-header">Recovery Metric</div>
                        <div className="field-explanation-text">
                          Carries 30% weight in your recovery score. Lower resting heart rate typically indicates better cardiovascular fitness and recovery capacity.
                        </div>
                      </div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Resting Heart Rate (bpm)
                        <span className="optional-label">Optional</span>
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.resting_hr_bpm}
                        onChange={(e) => handleInputChange('resting_hr_bpm', e.target.value)}
                        placeholder="45"
                      />
                      {formData.wearables.length > 0 && (
                        <div className="wearable-tips">
                          <div className="wearable-tips-header">How to Find on Your Device</div>
                          {getWearableTips()?.map((tip, index) => (
                            <div key={index} className="wearable-tip">
                              <span className="wearable-tip-device">{tip.device}:</span>
                              <span className="wearable-tip-instruction">{tip.rhr}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="field-explanation">
                        <div className="field-explanation-header">Recovery Power</div>
                        <div className="field-explanation-text">
                          <strong>HRV carries 70% weight</strong> in your recovery score - a critical 10% of your total hybrid score. Higher HRV indicates better recovery and stress adaptation.
                        </div>
                      </div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        HRV (ms)
                        <span className="optional-label">Optional</span>
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.hrv_ms}
                        onChange={(e) => handleInputChange('hrv_ms', e.target.value)}
                        placeholder="195"
                      />
                      {formData.wearables.length > 0 && (
                        <div className="wearable-tips">
                          <div className="wearable-tips-header">How to Find on Your Device</div>
                          {getWearableTips()?.map((tip, index) => (
                            <div key={index} className="wearable-tip">
                              <span className="wearable-tip-device">{tip.device}:</span>
                              <span className="wearable-tip-instruction">{tip.hrv}</span>
                            </div>
                          ))}
                        </div>
                      )}
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
                  
                  {/* Running App Selector */}
                  <div className="running-app-section">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Which app do you use to track runs?
                        <span className="optional-label">Optional</span>
                      </label>
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
                    </div>
                    
                    {getRunningAppTips() && (
                      <div className="running-app-tips">
                        <div className="running-app-tips-header">
                          How to Find Your Best Times in {getRunningAppTips().appName}
                        </div>
                        <div className="running-app-tip">
                          <span className="running-app-tip-instruction">
                            {getRunningAppTips().instructions}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 form-grid">
                    <div>
                      <div className="field-explanation">
                        <div className="field-explanation-header">Speed Score</div>
                        <div className="field-explanation-text">
                          Determines your speed score (25% of endurance). Elite targets: <strong>sub-5:30 for males, sub-6:15 for females</strong>. Used to estimate VO₂ max if not provided.
                        </div>
                      </div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Mile PR (MM:SS)
                        <span className="optional-label">Optional</span>
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
                        <span className="optional-label">Optional</span>
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
                        <span className="optional-label">Optional</span>
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
                        <span className="optional-label">Optional</span>
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
                      <div className="field-explanation">
                        <div className="field-explanation-header">Volume Score</div>
                        <div className="field-explanation-text">
                          Creates your volume score with thresholds at <strong>20/40/50+ miles</strong>. Higher weekly mileage indicates greater aerobic base and endurance capacity.
                        </div>
                      </div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Weekly Miles
                        <span className="optional-label">Optional</span>
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
                      <div className="field-explanation">
                        <div className="field-explanation-header">Distance Score</div>
                        <div className="field-explanation-text">
                          Builds your distance score with benchmarks at <strong>half-marathon (13.1mi), marathon (26.2mi), and ultra (50mi+)</strong> distances.
                        </div>
                      </div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Long Run (miles)
                        <span className="optional-label">Optional</span>
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
                  
                  {/* Strength App Selector */}
                  <div className="strength-app-section">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Which app do you use to track strength workouts?
                        <span className="optional-label">Optional</span>
                      </label>
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
                    </div>
                    
                    {formData.strengthApp === 'Other' && (
                      <div style={{ marginTop: '12px' }}>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                          Please specify your strength tracking app
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 form-grid">
                    <div>
                      <div className="field-explanation">
                        <div className="field-explanation-header">Upper Body Power</div>
                        <div className="field-explanation-text">
                          Target: <strong>1.5x bodyweight for males, 1.0x for females</strong>. Missing lifts carry penalties, but even partial data significantly improves your score accuracy.
                        </div>
                      </div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Bench Press 1RM (lbs)
                        <span className="optional-label">Optional</span>
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
                      <div className="field-explanation">
                        <div className="field-explanation-header">Lower Body Power</div>
                        <div className="field-explanation-text">
                          Target: <strong>2.0x bodyweight for males, 1.5x for females</strong>. Your 1-rep maxes directly determine 40% of your hybrid score through bodyweight ratio calculations.
                        </div>
                      </div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Squat 1RM (lbs)
                        <span className="optional-label">Optional</span>
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
                      <div className="field-explanation">
                        <div className="field-explanation-header">Posterior Chain</div>
                        <div className="field-explanation-text">
                          Target: <strong>2.4x bodyweight for males, 1.8x for females</strong>. The deadlift tests total-body strength and is crucial for hybrid athletic performance.
                        </div>
                      </div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                        Deadlift 1RM (lbs)
                        <span className="optional-label">Optional</span>
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
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  className="px-4 sm:px-6 py-3 text-sm sm:text-base border border-gray-600 rounded-lg text-gray-300 hover:border-[#08F0FF] transition-colors min-h-[44px] order-2 sm:order-1"
                  onClick={prevSection}
                  disabled={currentSection === 0}
                  style={{ opacity: currentSection === 0 ? 0.5 : 1 }}
                >
                  Previous
                </button>

                {currentSection < sections.length - 1 ? (
                  <button
                    type="button"
                    className="neon-button text-sm sm:text-base px-4 sm:px-6 py-3 min-h-[44px] order-1 sm:order-2"
                    onClick={nextSection}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    className="neon-button text-sm sm:text-base px-4 sm:px-6 py-3 min-h-[44px] order-1 sm:order-2"
                    disabled={isSubmitting}
                    onClick={async () => {
                      console.log('🔥 CALCULATE BUTTON CLICKED - FULL IMPLEMENTATION');
                      setIsSubmitting(true);
                      
                      try {
                        // Step 1: Create athlete profile in database FIRST
                        console.log('🔥 STEP 1: Creating athlete profile in database...');
                        
                        const profileId = uuid(); // Generate unique ID
                        const profileData = {
                          first_name: formData.first_name || 'Test',
                          last_name: formData.last_name || 'User',
                          email: `${(formData.first_name || 'test').toLowerCase()}.${(formData.last_name || 'user').toLowerCase()}@temp.com`,
                          sex: formData.sex || 'male',
                          dob: formData.dob || '1990-01-01',
                          country: formData.country || 'US',
                          body_metrics: {
                            weight_lb: parseFloat(formData.weight_lb) || null,
                            height_in: (parseInt(formData.height_ft) || 0) * 12 + (parseInt(formData.height_in) || 0) || null,
                          },
                          pb_bench_1rm: parseFloat(formData.pb_bench_1rm) || null,
                          pb_squat_1rm: parseFloat(formData.pb_squat_1rm) || null,
                          pb_deadlift_1rm: parseFloat(formData.pb_deadlift_1rm) || null,
                          schema_version: 'v1.0',
                          interview_type: 'form'
                        };
                        
                        // Create the profile in database
                        const newProfile = {
                          id: profileId,
                          profile_json: profileData,
                          is_public: true,
                          completed_at: new Date().toISOString(),
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        };
                        
                        let profileResponse;
                        
                        if (user && session) {
                          // User is authenticated - use authenticated endpoint
                          console.log('🔥 STEP 1: User authenticated - using authenticated endpoint');
                          profileResponse = await axios.post(`${BACKEND_URL}/api/athlete-profiles`, newProfile, {
                            headers: {
                              'Authorization': `Bearer ${session.access_token}`,
                              'Content-Type': 'application/json'
                            }
                          });
                        } else {
                          // User not authenticated - use public endpoint
                          console.log('🔥 STEP 1: User not authenticated - using public endpoint');
                          profileResponse = await axios.post(`${BACKEND_URL}/api/athlete-profiles/public`, newProfile);
                        }
                        
                        console.log('🔥 STEP 1 SUCCESS: Profile created in database:', profileResponse.data);
                        
                        // Step 2: Call webhook and get score data
                        console.log('🔥 STEP 2: Calling webhook for score calculation...');
                        
                        const webhookResponse = await fetch('https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            athleteProfile: profileData,
                            deliverable: 'score'
                          })
                        });
                        
                        console.log('🔥 STEP 2: Webhook status:', webhookResponse.status);
                        
                        if (!webhookResponse.ok) {
                          throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
                        }
                        
                        const webhookData = await webhookResponse.json();
                        const scoreData = Array.isArray(webhookData) ? webhookData[0] : webhookData;
                        console.log('🔥 STEP 2 SUCCESS: Score data received:', scoreData);
                        
                        // Step 3: Store score data in database
                        console.log('🔥 STEP 3: Storing score data in database...');
                        
                        try {
                          if (user && session) {
                            // User authenticated - include auth header
                            await axios.post(`${BACKEND_URL}/api/athlete-profile/${profileId}/score`, scoreData, {
                              headers: {
                                'Authorization': `Bearer ${session.access_token}`,
                                'Content-Type': 'application/json'
                              }
                            });
                          } else {
                            // User not authenticated - public submission
                            await axios.post(`${BACKEND_URL}/api/athlete-profile/${profileId}/score`, scoreData, {
                              headers: { 'Content-Type': 'application/json' }
                            });
                          }
                          console.log('🔥 STEP 3 SUCCESS: Score data stored in database');
                        } catch (scoreError) {
                          console.warn('🔥 STEP 3 WARNING: Could not store score in database:', scoreError.message);
                          // Continue anyway - we have the score data
                        }
                        
                        // Step 4: Navigate to results page
                        console.log('🔥 STEP 4: Navigating to results page...');
                        console.log('🔥 STEP 4: Profile ID:', profileId);
                        console.log('🔥 STEP 4: Hybrid Score:', scoreData.hybridScore);
                        
                        toast({
                          title: "Success! 🎉",
                          description: `Hybrid Score calculated: ${scoreData.hybridScore || 'N/A'}`,
                          duration: 5000,
                        });
                        
                        // Navigate to results page with real profile ID
                        navigate(`/hybrid-score/${profileId}`);
                        
                      } catch (error) {
                        console.error('🔥 ERROR in Calculate button:', error);
                        console.error('🔥 ERROR message:', error.message);
                        console.error('🔥 ERROR stack:', error.stack);
                        
                        toast({
                          title: "Error",
                          description: error.message || "Failed to calculate score. Please try again.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
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