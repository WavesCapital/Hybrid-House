import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';
import { 
  User, Calendar, Trophy, BarChart3, Plus, Target, Activity,
  Zap, RefreshCw, ArrowRight, Award, TrendingUp, Camera, 
  Save, Edit, MapPin, Globe, Mail, Settings, Upload, X, Eye
} from 'lucide-react';
import axios from 'axios';
import { v4 as uuid } from 'uuid';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ProfilePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Authentication states (optional - set to null for public access)
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // User Profile Management States (optional - only for authenticated users)
  const [userProfile, setUserProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    display_name: '',
    location: '',
    website: '',
    gender: '',
    units_preference: 'imperial',
    privacy_level: 'private'
  });
  // Profile editing states - individual field management
  const [editingFields, setEditingFields] = useState({});
  const [savingFields, setSavingFields] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [tempFieldValues, setTempFieldValues] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Athlete Profile Management States
  const [profiles, setProfiles] = useState([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  // Form state for new profile generation (updated structure)
  const [inputForm, setInputForm] = useState({
    // Body Metrics (individual fields)
    weight_lb: '',
    vo2_max: '',
    resting_hr: '',
    hrv: '',
    
    // Running Performance
    pb_mile: '',
    weekly_miles: '',
    long_run: '',
    
    // Strength Performance
    pb_bench_1rm: '',
    pb_squat_1rm: '',
    pb_deadlift_1rm: ''
  });

  // Load profiles and user profile data
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoadingProfiles(true);
        
        console.log('Fetching profiles without authentication...');
        
        const response = await axios.get(`${BACKEND_URL}/api/athlete-profiles`);

        console.log('Profile response received:', response.data);
        const profilesData = response.data.profiles || [];
        setProfiles(profilesData);
        
        // Populate form with most recent profile data
        if (profilesData.length > 0) {
          console.log('🔄 Pre-populating form with most recent profile data...');
          
          // Find the profile with the most complete data
          let bestProfile = profilesData[0]; // Start with most recent
          
          // Look for a profile with more complete data
          for (const profile of profilesData) {
            const hasPerformanceData = profile.profile_json && (
              profile.profile_json.pb_mile ||
              profile.profile_json.weekly_miles ||
              profile.profile_json.pb_bench_1rm ||
              profile.profile_json.pb_squat_1rm ||
              profile.profile_json.pb_deadlift_1rm
            );
            
            if (hasPerformanceData) {
              bestProfile = profile;
              console.log(`📊 Using profile ${profile.id.substring(0, 8)}... for pre-population (has performance data)`);
              break;
            }
          }
          
          console.log(`📋 Selected profile: ${bestProfile.id.substring(0, 8)}...`);
          console.log('📊 Profile data:', bestProfile);
          
          // Helper function to get field value from multiple sources
          const getFieldValue = (fieldName, jsonPath) => {
            // Check individual database columns first
            if (bestProfile[fieldName] !== undefined && bestProfile[fieldName] !== null && bestProfile[fieldName] !== '') {
              return bestProfile[fieldName].toString();
            }
            
            // Check profile_json
            if (bestProfile.profile_json) {
              const jsonField = bestProfile.profile_json[jsonPath || fieldName];
              if (jsonField !== undefined && jsonField !== null && jsonField !== '') {
                return jsonField.toString();
              }
            }
            
            return '';
          };
          
          // Extract body metrics from various sources (only if they exist)
          let bodyMetrics = {};
          
          // Check individual columns (only add if they have values)
          if (bestProfile.weight_lb) bodyMetrics.weight_lb = bestProfile.weight_lb;
          if (bestProfile.vo2_max) bodyMetrics.vo2_max = bestProfile.vo2_max;
          if (bestProfile.resting_hr) bodyMetrics.resting_hr = bestProfile.resting_hr;
          if (bestProfile.hrv) bodyMetrics.hrv = bestProfile.hrv;
          
          // Check profile_json body_metrics (only add if they have values)
          if (bestProfile.profile_json?.body_metrics) {
            const jsonBodyMetrics = bestProfile.profile_json.body_metrics;
            if (typeof jsonBodyMetrics === 'object') {
              Object.keys(jsonBodyMetrics).forEach(key => {
                if (jsonBodyMetrics[key] !== null && jsonBodyMetrics[key] !== undefined && jsonBodyMetrics[key] !== '') {
                  bodyMetrics[key] = jsonBodyMetrics[key];
                }
              });
            }
          }
          
          // Check individual weight_lb field in profile_json (only if it has a value)
          if (bestProfile.profile_json?.weight_lb) {
            bodyMetrics.weight_lb = bestProfile.profile_json.weight_lb;
          }
          
          console.log('📊 Extracted body metrics:', bodyMetrics);
          
          // Helper function to extract weight from complex objects
          const extractWeight = (value) => {
            if (!value) return '';
            if (typeof value === 'object') {
              return value.weight_lb || value.weight || '';
            }
            return value.toString();
          };
          
          // Build the form data - NO DEFAULT VALUES, only use actual data from profile
          const formData = {
            // Body Metrics (individual fields) - only populate if data exists
            weight_lb: bodyMetrics.weight_lb || bodyMetrics.weight || '',
            vo2_max: bodyMetrics.vo2_max || bodyMetrics.vo2max || '',
            resting_hr: bodyMetrics.resting_hr || bodyMetrics.resting_hr_bpm || '',
            hrv: bodyMetrics.hrv || bodyMetrics.hrv_ms || '',
            
            // Running Performance - only populate if data exists
            pb_mile: getFieldValue('pb_mile_seconds') ? 
              `${Math.floor(getFieldValue('pb_mile_seconds') / 60)}:${String(getFieldValue('pb_mile_seconds') % 60).padStart(2, '0')}` : 
              getFieldValue('pb_mile') || '',
            weekly_miles: getFieldValue('weekly_miles') || '',
            long_run: getFieldValue('long_run_miles') || getFieldValue('long_run') || '',
            
            // Strength Performance - only populate if data exists
            pb_bench_1rm: extractWeight(getFieldValue('pb_bench_1rm_lb') || getFieldValue('pb_bench_1rm')) || '',
            pb_squat_1rm: extractWeight(getFieldValue('pb_squat_1rm_lb') || getFieldValue('pb_squat_1rm')) || '',
            pb_deadlift_1rm: extractWeight(getFieldValue('pb_deadlift_1rm_lb') || getFieldValue('pb_deadlift_1rm')) || ''
          };
          
          console.log('📝 Pre-populated form data:', formData);
          setInputForm(formData);
        } else {
          console.log('❌ No profiles available for pre-population');
        }
        
      } catch (error) {
        console.error('Error fetching profiles:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        toast({
          title: "Error loading profiles",
          description: "Failed to load athlete profiles. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    fetchProfiles();
  }, [toast]);

  // Load user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !session) {
        console.log('No user or session found:', { user: !!user, session: !!session });
        return;
      }
      
      try {
        console.log('Fetching user profile for user:', user.sub);
        const response = await axios.get(`${BACKEND_URL}/api/user-profile/me`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        console.log('User profile fetched:', response.data);
        const profile = response.data.profile;
        setUserProfile(profile);
        // Initialize temp field values for inline editing
        setTempFieldValues({
          name: profile.name || '',
          display_name: profile.display_name || '',
          location: profile.location || '',
          website: profile.website || '',
          gender: profile.gender || '',
          units_preference: profile.units_preference || 'imperial',
          privacy_level: profile.privacy_level || 'private'
        });
        // Initialize profile form for edit mode
        setProfileForm({
          name: profile.name || '',
          display_name: profile.display_name || '',
          location: profile.location || '',
          website: profile.website || '',
          gender: profile.gender || '',
          units_preference: profile.units_preference || 'imperial',
          privacy_level: profile.privacy_level || 'private'
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        console.log('User profile does not exist yet - will be created on first save');
        // User profile might not exist yet, which is fine
      }
    };

    fetchUserProfile();
  }, [user, session]);

  // State for score calculation loading
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);

  // Generate new athlete profile
  const generateNewProfile = useCallback(async () => {
    try {
      setIsGenerating(true);

      // Create profile JSON using form inputs (works with or without auth)
      const profileJson = {
        // Use data from user profile if available, otherwise use defaults
        first_name: userProfile?.name || userProfile?.display_name || 'Anonymous User',
        sex: userProfile?.gender || 'Not specified',
        
        // Body metrics from individual form fields
        body_metrics: {
          weight_lb: inputForm.weight_lb,
          vo2_max: inputForm.vo2_max,
          resting_hr: inputForm.resting_hr,
          hrv: inputForm.hrv
        },
        
        // Performance data from form
        pb_mile: inputForm.pb_mile,
        weekly_miles: inputForm.weekly_miles,
        long_run: inputForm.long_run,
        pb_bench_1rm: inputForm.pb_bench_1rm,
        pb_squat_1rm: inputForm.pb_squat_1rm,
        pb_deadlift_1rm: inputForm.pb_deadlift_1rm,
        
        // Metadata
        schema_version: 'v1.0',
        created_via: 'manual_input'
      };

      console.log('Generated profile JSON:', profileJson);

      // Create the new profile with unique ID
      const profileId = uuid();
      const newProfile = {
        id: profileId,
        profile_json: profileJson,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store profile in database - use public endpoint for non-authenticated users
      if (user && session) {
        await axios.post(`${BACKEND_URL}/api/athlete-profiles`, newProfile, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        toast({
          title: "Profile Generated! 🎉",
          description: "Your new athlete profile has been created and linked to your account.",
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/athlete-profiles/public`, newProfile);
        
        toast({
          title: "Profile Generated! 🎉",
          description: "Your new athlete profile has been created successfully.",
        });
      }

      // Set loading state for score calculation (like interview)
      setIsCalculatingScore(true);
      setIsGenerating(false); // Stop profile creation loading, start score calculation loading

      // Call webhook for score computation (same format as interview)
      console.log('Calling webhook with athleteProfile payload...');
      
      // Set up abort controller for timeout (4 minutes like interview)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 240000);

      const webhookResponse = await fetch(
        'https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            athleteProfile: profileJson,  // FIXED: Use athleteProfile field like interview
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
      console.log('Webhook response:', webhookData);

      // Handle the response - it's an array with the score data (like interview)
      const scoreData = Array.isArray(webhookData) ? webhookData[0] : webhookData;

      // Store score data
      await axios.post(`${BACKEND_URL}/api/athlete-profile/${profileId}/score`, scoreData);

      // Navigate to the new score page
      navigate(`/hybrid-score/${profileId}`);
      
    } catch (error) {
      console.error('Error generating profile:', error);
      
      let errorMessage = "Failed to generate your athlete profile. Please try again.";
      if (error.name === 'AbortError') {
        errorMessage = "Score calculation timed out. Please try again.";
      } else if (error.message.includes('Webhook')) {
        errorMessage = "Score calculation failed. Please try again.";
      }
      
      toast({
        title: "Error generating profile",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Don't immediately set calculating to false - let the redirect happen first (like interview)
      setTimeout(() => {
        setIsCalculatingScore(false);
        setIsGenerating(false);
      }, 1000);
    }
  }, [inputForm, navigate, toast, user, session, userProfile]);

  // Inline editing functions
  const startEditing = useCallback((fieldName) => {
    setEditingFields(prev => ({...prev, [fieldName]: true}));
    setTempFieldValues(prev => ({
      ...prev,
      [fieldName]: userProfile?.[fieldName] || ''
    }));
  }, [userProfile]);

  const cancelEditing = useCallback((fieldName) => {
    setEditingFields(prev => ({...prev, [fieldName]: false}));
    setFieldErrors(prev => ({...prev, [fieldName]: null}));
    setTempFieldValues(prev => ({
      ...prev,
      [fieldName]: userProfile?.[fieldName] || ''
    }));
  }, [userProfile]);

  const saveField = useCallback(async (fieldName, value) => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save changes",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingFields(prev => ({...prev, [fieldName]: true}));
      setFieldErrors(prev => ({...prev, [fieldName]: null}));
      
      const response = await axios.put(`${BACKEND_URL}/api/user-profile/me`, {
        [fieldName]: value
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update user profile with new data
      setUserProfile(response.data.profile);
      setEditingFields(prev => ({...prev, [fieldName]: false}));
      
      // Show success feedback
      toast({
        title: "Saved",
        description: `${fieldName.replace('_', ' ')} updated successfully`,
        variant: "default",
      });
      
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
      
      let errorMessage = "Failed to save changes";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please sign in again.";
      }
      
      setFieldErrors(prev => ({...prev, [fieldName]: errorMessage}));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSavingFields(prev => ({...prev, [fieldName]: false}));
    }
  }, [user, session, BACKEND_URL, toast]);

  const handleFieldBlur = useCallback((fieldName) => {
    const currentValue = tempFieldValues[fieldName];
    const originalValue = userProfile?.[fieldName] || '';
    
    if (currentValue !== originalValue) {
      saveField(fieldName, currentValue);
    } else {
      setEditingFields(prev => ({...prev, [fieldName]: false}));
    }
  }, [tempFieldValues, userProfile, saveField]);

  const handleFieldChange = useCallback((fieldName, value) => {
    setTempFieldValues(prev => ({...prev, [fieldName]: value}));
  }, []);

  const handleFieldKeyDown = useCallback((e, fieldName) => {
    if (e.key === 'Enter') {
      e.target.blur(); // Trigger onBlur to save
    } else if (e.key === 'Escape') {
      cancelEditing(fieldName);
    }
  }, [cancelEditing]);

  // Legacy profile form update function (for the edit profile form)
  const handleUpdateProfile = useCallback(async () => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your profile changes",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingProfiles(true);
      
      const response = await axios.put(`${BACKEND_URL}/api/user-profile/me`, profileForm, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      setUserProfile(response.data.profile);
      setIsEditingProfile(false);
      toast({
        title: "Success",
        description: response.data.message || "Profile updated successfully",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let errorMessage = "Failed to update profile";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please sign in again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [profileForm, user, session, BACKEND_URL, toast]);

  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const handleAvatarUpload = useCallback(async () => {
    if (!avatarFile || !user || !session) return;

    try {
      setIsLoadingProfiles(true);
      const formData = new FormData();
      formData.append('file', avatarFile);

      const response = await axios.post(`${BACKEND_URL}/api/user-profile/me/avatar`, formData, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUserProfile(prev => ({
        ...prev,
        avatar_url: response.data.avatar_url
      }));
      
      setAvatarFile(null);
      setAvatarPreview(null);
      
      toast({
        title: "Success",
        description: "Avatar updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [avatarFile, user, session, toast]);

  // Create editable field component
  const EditableField = useCallback(({ fieldName, label, value, type = 'text', options = null, placeholder = '' }) => {
    const isEditing = editingFields[fieldName];
    const isSaving = savingFields[fieldName];
    const error = fieldErrors[fieldName];
    const tempValue = tempFieldValues[fieldName] || value || '';

    if (isEditing) {
      if (type === 'select') {
        return (
          <div className="relative">
            <select
              value={tempValue}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              onBlur={() => handleFieldBlur(fieldName)}
              onKeyDown={(e) => handleFieldKeyDown(e, fieldName)}
              className="w-full px-3 py-2 border rounded-md bg-gray-900 border-gray-700 text-white focus:outline-none focus:border-blue-500"
              autoFocus
              disabled={isSaving}
            >
              {options?.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {isSaving && (
              <div className="absolute right-2 top-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className="relative">
            <input
              type={type}
              value={tempValue}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              onBlur={() => handleFieldBlur(fieldName)}
              onKeyDown={(e) => handleFieldKeyDown(e, fieldName)}
              className="w-full px-3 py-2 border rounded-md bg-gray-900 border-gray-700 text-white focus:outline-none focus:border-blue-500"
              placeholder={placeholder}
              autoFocus
              disabled={isSaving}
            />
            {isSaving && (
              <div className="absolute right-2 top-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        );
      }
    } else {
      return (
        <div 
          onClick={() => startEditing(fieldName)}
          className="w-full px-3 py-2 border rounded-md bg-gray-900 border-gray-700 text-white cursor-pointer hover:bg-gray-800 transition-colors min-h-[42px] flex items-center"
        >
          <span className={!value ? 'text-gray-400' : ''}>
            {value || placeholder || 'Click to edit'}
          </span>
          {isSaving && (
            <div className="ml-auto">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      );
    }
  }, [editingFields, savingFields, fieldErrors, tempFieldValues, handleFieldChange, handleFieldBlur, handleFieldKeyDown, startEditing]);

  // Format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Helper function to render profile fields safely
  const renderProfileField = useCallback((value) => {
    if (!value) return 'Not specified';
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value.toString();
  }, []);

  // Get profile score color
  const getScoreColor = useCallback((score) => {
    if (score >= 80) return '#85E26E'; // Green
    if (score >= 60) return '#79CFF7'; // Blue
    if (score >= 40) return '#FFD700'; // Yellow
    return '#FF6B6B'; // Red
  }, []);

  // Only show loading when actually loading profiles
  if (isLoadingProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0B0C' }}>
        <div className="text-center">
          <div className="neo-primary text-xl mb-4">Loading profiles...</div>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neon-noir-canvas">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        /* Neon-Noir Performance Cockpit Styles */
        .neon-noir-canvas {
          background: #0E0E11;
          background-image: 
            linear-gradient(45deg, rgba(27, 109, 255, 0.03) 0%, transparent 50%),
            linear-gradient(-45deg, rgba(214, 78, 249, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(27, 109, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(214, 78, 249, 0.05) 0%, transparent 50%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          min-height: 100vh;
        }
        
        /* Glass Cards */
        .glass-card {
          background: rgba(20, 20, 25, 0.96);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .glass-card:hover {
          transform: translateY(-3px);
          box-shadow: 
            0 8px 32px rgba(27, 109, 255, 0.2),
            0 4px 16px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        

        
        /* Data Points */
        .chart-point {
          r: 6;
          fill: url(#trendGradient);
          filter: drop-shadow(0 0 4px rgba(27, 109, 255, 0.5));
          transition: all 0.3s ease;
        }
        
        .chart-point:hover {
          r: 8;
          filter: drop-shadow(0 0 8px rgba(27, 109, 255, 0.8));
        }
        
        /* Table Enhancements */
        .score-archive-table {
          border-collapse: separate;
          border-spacing: 0;
          font-variant-numeric: tabular-nums;
          font-family: 'Inter', sans-serif;
        }
        
        .score-archive-table th {
          background: linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.6));
          border-bottom: 2px solid;
          border-image: linear-gradient(90deg, #1B6DFF, #D64EF9) 1;
          position: sticky;
          top: 0;
          z-index: 10;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        
        .score-archive-table th:first-child {
          text-align: left;
        }
        
        .score-archive-table td {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        
        .score-archive-table td:first-child {
          text-align: left;
        }
        
        .score-archive-table tr:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-1px);
          border-bottom: 1px solid;
          border-image: linear-gradient(90deg, #1B6DFF, #D64EF9) 1;
        }
        
        .score-archive-table tr:focus {
          outline: 2px solid rgba(27, 109, 255, 0.5);
          outline-offset: -2px;
        }
        
        .most-recent-row {
          background: rgba(27, 109, 255, 0.13);
        }
        
        .em-dash {
          color: #7A7D83;
        }
        
        /* Reduced spacing - 48px desktop, 24px mobile */
        .space-y-12 > * + * { margin-top: 3rem; }
        
        @media (max-width: 768px) {
          .space-y-12 > * + * { margin-top: 1.5rem; }
        }
        

        
        /* Gradient Elements */
        .accent-gradient {
          background: linear-gradient(135deg, #1B6DFF 0%, #D64EF9 100%);
        }
        
        .accent-gradient-text {
          background: linear-gradient(135deg, #1B6DFF 0%, #D64EF9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Colors */
        .text-positive { color: #00FF90; }
        .text-negative { color: #FF4F70; }
        .text-primary { color: #FFFFFF; }
        .text-secondary { color: rgba(255, 255, 255, 0.7); }
        .text-muted { color: rgba(255, 255, 255, 0.5); }
        
        /* Buttons */
        .neon-button {
          background: linear-gradient(135deg, #1B6DFF 0%, #D64EF9 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          padding: 16px 24px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .neon-button:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 32px rgba(27, 109, 255, 0.4),
            0 4px 16px rgba(214, 78, 249, 0.3);
        }
        
        .neon-button:active {
          transform: translateY(0);
        }
        
        .neon-button:disabled {
          opacity: 0.6;
          transform: none;
          box-shadow: none;
        }
        
        /* Input Fields */
        .neon-input {
          background: rgba(20, 20, 25, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #FFFFFF;
          padding: 12px 16px;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }
        
        .neon-input:focus {
          outline: none;
          border-color: transparent;
          box-shadow: 
            0 0 0 2px rgba(27, 109, 255, 0.3),
            0 0 16px rgba(27, 109, 255, 0.2);
        }
        
        .neon-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        
        /* Radar Cluster - Iron-Man HUD Style */
        .radar-cluster-container {
          position: relative;
          width: 100%;
          padding: 60px 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .cluster {
          position: relative;
          width: 540px;
          height: 540px;
          margin: 0;
        }
        
        .cluster-vignette {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(27, 109, 255, 0.067) 0%, transparent 70%);
          border-radius: 50%;
          z-index: 0;
        }
        
        .dial {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 1;
        }
        
        .dial.big {
          width: 220px;
          height: 220px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .dial.mini {
          width: 96px;
          height: 96px;
        }
        
        /* Hexagon Positioning (160px radius from center) */
        .dial.pos-1 { /* Top-center (0°) */
          top: calc(50% - 160px);
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .dial.pos-2 { /* Top-right (60°) */
          top: calc(50% - 138px);
          left: calc(50% + 80px);
          transform: translate(-50%, -50%);
        }
        
        .dial.pos-3 { /* Bottom-right (120°) */
          top: calc(50% + 138px);
          left: calc(50% + 80px);
          transform: translate(-50%, -50%);
        }
        
        .dial.pos-4 { /* Bottom-center (180°) */
          top: calc(50% + 160px);
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .dial.pos-5 { /* Bottom-left (240°) */
          top: calc(50% + 138px);
          left: calc(50% - 80px);
          transform: translate(-50%, -50%);
        }
        
        .dial.pos-6 { /* Top-left (300°) */
          top: calc(50% - 138px);
          left: calc(50% - 80px);
          transform: translate(-50%, -50%);
        }
        
        .dial-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .dial-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        
        .dial-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: white;
          font-variant-numeric: tabular-nums;
        }
        
        .dial.big .score-number {
          font-size: 3rem;
          font-weight: bold;
          background: linear-gradient(45deg, #1B6DFF, #D64EF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: 4px;
        }
        
        .dial.big .score-label {
          font-size: 0.875rem;
          color: #C9CDD2;
          font-weight: 500;
        }
        
        .dial.mini .score-number {
          font-size: 1.125rem;
          font-weight: bold;
          color: #1B6DFF;
        }
        
        .dial-label {
          margin-top: 8px;
          font-size: 14px;
          color: #C9CDD2;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          text-align: center;
        }
        
        /* Hover Interactions */
        .dial.big:hover {
          transform: translate(-50%, -50%) scale(1.05);
        }
        
        .dial.big:hover ~ .dial.mini {
          transform: translate(-50%, -50%) translateY(-4px);
        }
        
        .dial.big:hover ~ .dial.pos-1 {
          transform: translate(-50%, -50%) translateY(-4px);
        }
        
        .dial.big:hover ~ .dial.pos-2 {
          transform: translate(-50%, -50%) translate(4px, -2px);
        }
        
        .dial.big:hover ~ .dial.pos-3 {
          transform: translate(-50%, -50%) translate(4px, 2px);
        }
        
        .dial.big:hover ~ .dial.pos-4 {
          transform: translate(-50%, -50%) translateY(4px);
        }
        
        .dial.big:hover ~ .dial.pos-5 {
          transform: translate(-50%, -50%) translate(-4px, 2px);
        }
        
        .dial.big:hover ~ .dial.pos-6 {
          transform: translate(-50%, -50%) translate(-4px, -2px);
        }
        
        .dial.mini:hover {
          transform: translate(-50%, -50%) translateY(-3px);
          filter: drop-shadow(0 0 12px rgba(27, 109, 255, 0.4));
        }
        
        .cluster:hover .cluster-vignette {
          background: radial-gradient(circle, rgba(27, 109, 255, 0.133) 0%, transparent 70%);
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .cluster {
            width: 400px;
            height: 400px;
          }
          
          .dial.big {
            width: 160px;
            height: 160px;
          }
          
          .dial.mini {
            width: 72px;
            height: 72px;
          }
          
          .dial.big .score-number {
            font-size: 2.25rem;
          }
          
          .dial.mini .score-number {
            font-size: 1rem;
          }
          
          .dial-label {
            font-size: 12px;
          }
          
          /* Reduce hexagon radius to 110px */
          .dial.pos-1 { top: calc(50% - 110px); }
          .dial.pos-2 { top: calc(50% - 95px); left: calc(50% + 55px); }
          .dial.pos-3 { top: calc(50% + 95px); left: calc(50% + 55px); }
          .dial.pos-4 { top: calc(50% + 110px); }
          .dial.pos-5 { top: calc(50% + 95px); left: calc(50% - 55px); }
          .dial.pos-6 { top: calc(50% - 95px); left: calc(50% - 55px); }
        }
        
        @media (max-width: 480px) {
          .radar-cluster-container {
            padding: 30px 0;
          }
          
          .cluster {
            width: 100%;
            height: auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 20px;
          }
          
          .dial {
            position: relative;
            top: auto;
            left: auto;
            transform: none;
          }
          
          .dial.big {
            grid-column: 1 / -1;
            justify-self: center;
            width: 180px;
            height: 180px;
          }
          
          .dial.mini {
            width: 80px;
            height: 80px;
            justify-self: center;
          }
          
          .cluster-vignette {
            display: none;
          }
        }
        
        /* Mini KPI Cards */
        .mini-kpi {
          background: rgba(20, 20, 25, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 12px;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .mini-kpi:hover {
          border-color: rgba(27, 109, 255, 0.3);
          box-shadow: 0 4px 16px rgba(27, 109, 255, 0.1);
        }
        
        /* Archive Cards */
        .archive-card {
          background: rgba(20, 20, 25, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 16px;
          transition: all 0.3s ease;
        }
        
        .archive-card:hover {
          background: rgba(20, 20, 25, 0.6);
          border-color: rgba(27, 109, 255, 0.3);
          transform: translateX(4px);
        }
        
        /* Inline Editing */
        .inline-edit-field {
          background: rgba(20, 20, 25, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          color: #FFFFFF;
          padding: 8px 12px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .inline-edit-field:hover {
          background: rgba(20, 20, 25, 0.6);
          border-color: rgba(27, 109, 255, 0.3);
        }
        
        .inline-edit-field.editing {
          border-color: #1B6DFF;
          box-shadow: 0 0 0 2px rgba(27, 109, 255, 0.2);
          cursor: text;
        }
        
        /* Animations */
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(27, 109, 255, 0.3); }
          50% { box-shadow: 0 0 16px rgba(27, 109, 255, 0.6); }
        }
        
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }
        
        .ripple::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          animation: ripple 0.6s ease-out;
        }
        
        /* Responsive spacing */
        .space-y-16 > * + * { margin-top: 4rem; }
        .lg\\:space-y-16 > * + * { margin-top: 4rem; }
        .md\\:space-y-8 > * + * { margin-top: 2rem; }
        .sm\\:space-y-6 > * + * { margin-top: 1.5rem; }
        
        @media (max-width: 1024px) {
          .lg\\:space-y-16 > * + * { margin-top: 2rem; }
        }
        
        @media (max-width: 768px) {
          .space-y-16 > * + * { margin-top: 1.5rem; }
          .md\\:space-y-8 > * + * { margin-top: 1.5rem; }
        }
        
        /* Table styling */
        .score-archive-table {
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .score-archive-table th {
          background: linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.6));
          border-bottom: 2px solid;
          border-image: linear-gradient(90deg, #1B6DFF, #D64EF9) 1;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .score-archive-table tr:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .score-archive-table tr:focus {
          outline: 2px solid rgba(27, 109, 255, 0.5);
          outline-offset: -2px;
        }
        
        /* Mobile table scroll */
        @media (max-width: 768px) {
          .score-archive-table {
            min-width: 800px;
          }
          
          .score-archive-table th:first-child,
          .score-archive-table td:first-child {
            position: sticky;
            left: 0;
            background: rgba(20, 20, 25, 0.9);
            z-index: 5;
          }
          
          .score-archive-table th:first-child {
            z-index: 15;
          }
        }
        
        /* Chart animations */
        @keyframes drawLine {
          from { stroke-dasharray: 0 1000; }
          to { stroke-dasharray: 1000 0; }
        }
        
        .trend-line {
          animation: drawLine 2s ease-out;
        }
        
        /* Mobile optimizations */
        
        /* Mobile FAB */
        .mobile-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1B6DFF 0%, #D64EF9 100%);
          border: none;
          box-shadow: 
            0 4px 16px rgba(27, 109, 255, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          display: none;
        }
        
        @media (max-width: 768px) {
          .mobile-fab { display: flex; }
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
          .hero-row { flex-direction: column; }
          .main-grid { grid-template-columns: 1fr; }
        }
        
        @media (max-width: 768px) {
          .neon-noir-canvas { padding: 16px; }
          .hero-row { gap: 16px; }
          .main-grid { gap: 16px; }
        }
        `}
      </style>

      {/* Full-screen Score Calculation Loading (preserved) */}
      {isCalculatingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ 
          background: 'rgba(14, 14, 17, 0.9)' 
        }}>
          <div className="glass-card max-w-md w-full mx-6">
            <div className="p-12 text-center">
              <h2 className="text-3xl font-bold accent-gradient-text mb-6">
                Calculating Your Hybrid Score! 🎉
              </h2>
              <p className="text-secondary mb-8 leading-relaxed">
                We're analyzing your athlete profile to generate your personalized hybrid score and recommendations.
              </p>
              <div className="flex justify-center items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <p className="text-sm text-muted">
                This may take up to 2 minutes...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 accent-gradient rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">Hybrid House</h1>
                  <p className="text-xs text-muted">Performance Analytics</p>
                </div>
              </div>
              <div className="h-6 w-px bg-white/20"></div>
              <h2 className="text-lg font-semibold text-secondary">Profile</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-secondary" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Calendar className="w-5 h-5 text-secondary" />
              </button>
              <div className="w-8 h-8 accent-gradient rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl space-y-8">
        
        {/* Main Section - Stack with proper spacing */}
        {/* Hero Row - Profile Card + Hybrid Score Dial */}
        <div className="hero-row flex gap-8">
          
          {/* Profile Card (30% width) - Only shown for authenticated users */}
          {user && userProfile && (
            <div className="w-full lg:w-[30%]">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-primary flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Your Profile
                  </h3>
                  <span className="text-xs text-muted">
                    Click any field to edit
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        ) : userProfile?.avatar_url ? (
                          <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      
                      <label className="absolute bottom-0 right-0 accent-gradient rounded-full p-1.5 cursor-pointer hover:scale-110 transition-transform">
                        <Camera className="w-3 h-3 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium text-primary">
                        {userProfile?.display_name || userProfile?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted">
                        {userProfile?.email}
                      </p>
                    </div>
                    
                    {avatarFile && (
                      <div className="mt-3 space-y-2">
                        <button onClick={handleAvatarUpload} disabled={isLoadingProfiles} className="neon-button text-xs px-3 py-1">
                          <Upload className="w-3 h-3 mr-1" />
                          Upload
                        </button>
                        <button 
                          onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} 
                          className="block w-full text-xs text-muted hover:text-secondary transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile Fields - Inline Editing Preserved */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Name</label>
                      <EditableField
                        fieldName="name"
                        label="Name"
                        value={userProfile?.name}
                        placeholder="Enter your name"
                      />
                      {fieldErrors.name && (
                        <p className="text-negative text-xs mt-1">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Display Name</label>
                      <EditableField
                        fieldName="display_name"
                        label="Display Name"
                        value={userProfile?.display_name}
                        placeholder="Enter your display name"
                      />
                      {fieldErrors.display_name && (
                        <p className="text-negative text-xs mt-1">{fieldErrors.display_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        Location
                      </label>
                      <EditableField
                        fieldName="location"
                        label="Location"
                        value={userProfile?.location}
                        placeholder="City, Country"
                      />
                      {fieldErrors.location && (
                        <p className="text-negative text-xs mt-1">{fieldErrors.location}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">
                        <Globe className="w-3 h-3 inline mr-1" />
                        Website
                      </label>
                      <EditableField
                        fieldName="website"
                        label="Website"
                        value={userProfile?.website}
                        placeholder="https://yourwebsite.com"
                        type="url"
                      />
                      {fieldErrors.website && (
                        <p className="text-negative text-xs mt-1">{fieldErrors.website}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">Units</label>
                        <EditableField
                          fieldName="units_preference"
                          label="Units"
                          value={userProfile?.units_preference}
                          type="select"
                          options={[
                            { value: 'imperial', label: 'Imperial' },
                            { value: 'metric', label: 'Metric' }
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">Privacy</label>
                        <EditableField
                          fieldName="privacy_level"
                          label="Privacy"
                          value={userProfile?.privacy_level}
                          type="select"
                          options={[
                            { value: 'private', label: 'Private' },
                            { value: 'friends', label: 'Friends' },
                            { value: 'public', label: 'Public' }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hybrid Score Dial (70% width) */}
          <div className="flex-1">
            <div className="glass-card p-8 pt-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-1">Latest Hybrid Score</h3>
                  <p className="text-sm text-secondary">
                    {profiles.length > 0 ? `Updated ${new Date(profiles[0]?.created_at).toLocaleDateString()}` : 'No scores yet'}
                  </p>
                </div>
                {profiles.length > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-muted">Trend</div>
                    <div className="text-positive text-sm font-semibold">+2.4 ↗</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center mb-3 pt-8">
                {profiles.length > 0 && profiles[0]?.score_data?.hybridScore ? (
                  <div className="radar-cluster-container">
                    {/* Radar Cluster Layout */}
                    <figure className="cluster">
                      {/* Faint radial vignette for depth */}
                      <div className="cluster-vignette"></div>
                      
                      {/* Central Hybrid Dial */}
                      <div id="dial-hybrid" className="dial big" 
                        aria-label={`Hybrid score ${Math.round(profiles[0].score_data.hybridScore)}. Strength ${profiles[0].score_data.strengthScore ? Math.round(profiles[0].score_data.strengthScore) : 0}. Speed ${profiles[0].score_data.speedScore ? Math.round(profiles[0].score_data.speedScore) : 0}. VO₂ ${profiles[0].score_data.vo2Score ? Math.round(profiles[0].score_data.vo2Score) : 0}. Distance ${profiles[0].score_data.distanceScore ? Math.round(profiles[0].score_data.distanceScore) : 0}. Volume ${profiles[0].score_data.volumeScore ? Math.round(profiles[0].score_data.volumeScore) : 0}. Recovery ${profiles[0].score_data.recoveryScore ? Math.round(profiles[0].score_data.recoveryScore) : 0}.`}
                      >
                        <div className="dial-content">
                          <svg className="dial-svg" viewBox="0 0 220 220">
                            <defs>
                              <linearGradient id="hybridGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#1B6DFF" />
                                <stop offset="100%" stopColor="#D64EF9" />
                              </linearGradient>
                            </defs>
                            <circle cx="110" cy="110" r="95" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="10" fill="none" />
                            <circle 
                              cx="110" cy="110" r="95" 
                              stroke="url(#hybridGradient)" 
                              strokeWidth="10" 
                              fill="none" 
                              strokeLinecap="round"
                              strokeDasharray={`${(Math.round(profiles[0].score_data.hybridScore) / 100) * 596.9} 596.9`}
                              style={{ transition: 'stroke-dasharray 1s ease-out' }}
                            />
                          </svg>
                          <div className="dial-value">
                            <div className="score-number">{Math.round(profiles[0].score_data.hybridScore)}</div>
                            <div className="score-label">Hybrid Score</div>
                          </div>
                        </div>
                      </div>

                      {/* Mini Dials in Hexagon */}
                      {[
                        { label: 'Strength', key: 'strengthScore', pos: 'pos-1' },
                        { label: 'Speed', key: 'speedScore', pos: 'pos-2' },
                        { label: 'VO₂ Max', key: 'vo2Score', pos: 'pos-3' },
                        { label: 'Distance', key: 'distanceScore', pos: 'pos-4' },
                        { label: 'Volume', key: 'volumeScore', pos: 'pos-5' },
                        { label: 'Recovery', key: 'recoveryScore', pos: 'pos-6' }
                      ].map((item, index) => {
                        const value = profiles[0].score_data[item.key] || 0;
                        const roundedValue = Math.round(value);
                        return (
                          <div 
                            key={item.key} 
                            id={`dial-${item.key.replace('Score', '').toLowerCase()}`}
                            className={`dial mini ${item.pos}`}
                            aria-label={`${item.label} score ${roundedValue} out of 100`}
                            title={`${item.label} ${roundedValue}/100`}
                          >
                            <div className="dial-content">
                              <svg className="dial-svg" viewBox="0 0 96 96">
                                <defs>
                                  <linearGradient id={`miniGradient${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#1B6DFF" />
                                    <stop offset="100%" stopColor="#D64EF9" />
                                  </linearGradient>
                                </defs>
                                <circle cx="48" cy="48" r="40" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="5" fill="none" />
                                <circle 
                                  cx="48" cy="48" r="40" 
                                  stroke={`url(#miniGradient${index})`} 
                                  strokeWidth="5" 
                                  fill="none" 
                                  strokeLinecap="round"
                                  strokeDasharray={`${(roundedValue / 100) * 251.33} 251.33`}
                                  style={{ transition: 'stroke-dasharray 0.6s ease-out' }}
                                />
                              </svg>
                              <div className="dial-value">
                                <div className="score-number">{roundedValue}</div>
                              </div>
                            </div>
                            <div className="dial-label">{item.label}</div>
                          </div>
                        );
                      })}
                    </figure>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 accent-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-primary mb-2">No Scores Yet</h4>
                    <p className="text-sm text-secondary">Generate your first hybrid score to see your performance analytics</p>
                  </div>
                )}
              </div>

              {/* Remove old sub-score grid since it's now integrated into the radar cluster */}
            </div>
          </div>
        </div>

        {/* Main Section - Stack with reduced spacing */}
        <div className="space-y-12">{/* Reduced spacing: 48px desktop, 24px mobile */}
          
          {/* A. Generate New Score - Full Width Card */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-primary flex items-center">
                  🛠️ Generate New Score
                </h3>
                {user && userProfile && (
                  <p className="text-sm text-secondary mt-2">
                    Creating profile for: <span className="text-primary">{userProfile.display_name || userProfile.name}</span> 
                    ({userProfile.gender || 'Gender not specified'})
                  </p>
                )}
                {(!user || !userProfile) && (
                  <p className="text-sm text-secondary mt-2">
                    Enter your stats below to generate a new hybrid score
                  </p>
                )}
              </div>
            </div>
            
            {/* 10 inputs in 2×5 grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Weight (lbs)</label>
                <input
                  type="number"
                  value={inputForm.weight_lb}
                  onChange={(e) => setInputForm({...inputForm, weight_lb: e.target.value})}
                  className="neon-input w-full"
                  placeholder="163"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">VO₂ Max</label>
                <input
                  type="number"
                  value={inputForm.vo2_max}
                  onChange={(e) => setInputForm({...inputForm, vo2_max: e.target.value})}
                  className="neon-input w-full"
                  placeholder="54"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">RHR (bpm)</label>
                <input
                  type="number"
                  value={inputForm.resting_hr}
                  onChange={(e) => setInputForm({...inputForm, resting_hr: e.target.value})}
                  className="neon-input w-full"
                  placeholder="42"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">HRV (ms)</label>
                <input
                  type="number"
                  value={inputForm.hrv}
                  onChange={(e) => setInputForm({...inputForm, hrv: e.target.value})}
                  className="neon-input w-full"
                  placeholder="64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Mile PR</label>
                <input
                  type="text"
                  value={inputForm.pb_mile}
                  onChange={(e) => setInputForm({...inputForm, pb_mile: e.target.value})}
                  className="neon-input w-full"
                  placeholder="7:43"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Weekly Miles</label>
                <input
                  type="number"
                  value={inputForm.weekly_miles}
                  onChange={(e) => setInputForm({...inputForm, weekly_miles: e.target.value})}
                  className="neon-input w-full"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Long Run (mi)</label>
                <input
                  type="number"
                  value={inputForm.long_run}
                  onChange={(e) => setInputForm({...inputForm, long_run: e.target.value})}
                  className="neon-input w-full"
                  placeholder="7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Bench 1RM</label>
                <input
                  type="text"
                  value={inputForm.pb_bench_1rm}
                  onChange={(e) => setInputForm({...inputForm, pb_bench_1rm: e.target.value})}
                  className="neon-input w-full"
                  placeholder="225 lbs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Squat 1RM</label>
                <input
                  type="text"
                  value={inputForm.pb_squat_1rm}
                  onChange={(e) => setInputForm({...inputForm, pb_squat_1rm: e.target.value})}
                  className="neon-input w-full"
                  placeholder="315 lbs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Deadlift 1RM</label>
                <input
                  type="text"
                  value={inputForm.pb_deadlift_1rm}
                  onChange={(e) => setInputForm({...inputForm, pb_deadlift_1rm: e.target.value})}
                  className="neon-input w-full"
                  placeholder="405 lbs"
                />
              </div>
            </div>

            {/* Full-width gradient button - preserving exact onClick */}
            <button 
              onClick={generateNewProfile} 
              disabled={isGenerating || isCalculatingScore} 
              className="neon-button w-full py-4 text-lg font-semibold flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Creating Profile...
                </>
              ) : isCalculatingScore ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Calculating Score...
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 mr-3" />
                  Generate Hybrid Score
                </>
              )}
            </button>
          </div>

          {/* C. Score Archive - Table Format */}
          <div className="glass-card p-8">
            <h3 className="text-2xl font-bold text-primary mb-6 flex items-center">
              📜 Score Archive
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full score-archive-table">
                {/* Sticky header with comprehensive columns */}
                <thead>
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-secondary">Date</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Hybrid</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Str</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Spd</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">VO₂</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Dist</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Vol</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Rec</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">BW (lb)</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">VO₂-max</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Mile PR</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Long Run (mi)</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Wk Miles</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">HRV (ms)</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">RHR (bpm)</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Bench 1RM</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Squat 1RM</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Deadlift 1RM</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Action</th>
                  </tr>
                </thead>
                
                {/* Table body with comprehensive data */}
                <tbody>
                  {profiles.length === 0 ? (
                    <tr>
                      <td colSpan="19" className="text-center py-12">
                        <div className="text-muted">
                          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No scores yet. Generate your first one above!</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    profiles.map((profile, index) => {
                      const isFirstRow = index === 0;
                      const scoreData = profile?.score_data || {};
                      const profileJson = profile?.profile_json || {};
                      const bodyMetrics = profileJson?.body_metrics || {};
                      
                      // Helper function to format values safely
                      const formatValue = (value) => {
                        if (value === null || value === undefined || value === 0 || value === '') {
                          return <span className="em-dash">—</span>;
                        }
                        // Handle objects by extracting meaningful values
                        if (typeof value === 'object') {
                          if (value.weight_lb || value.weight) {
                            return value.weight_lb || value.weight;
                          }
                          if (value.vo2_max || value.vo2max) {
                            return value.vo2_max || value.vo2max;
                          }
                          // For any other objects, return em-dash to prevent React errors
                          return <span className="em-dash">—</span>;
                        }
                        return value;
                      };
                      
                      // Format mile time from seconds
                      const formatMileTime = (seconds) => {
                        if (!seconds || seconds === 0) return <span className="em-dash">—</span>;
                        const minutes = Math.floor(seconds / 60);
                        const remainingSeconds = seconds % 60;
                        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                      };
                      
                      // Safe profile field renderer
                      const safeRenderField = (value) => {
                        if (value === null || value === undefined || value === 0 || value === '') {
                          return <span className="em-dash">—</span>;
                        }
                        if (typeof value === 'object') {
                          return <span className="em-dash">—</span>;
                        }
                        return value.toString();
                      };
                      
                      return (
                        <tr 
                          key={profile.id} 
                          className={`hover:bg-white/5 transition-colors border-b border-white/5 ${isFirstRow ? 'most-recent-row' : ''}`}
                          tabIndex={0}
                          role="row"
                        >
                          <td className="p-3 text-xs text-primary">
                            {new Date(profile.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="p-3 text-xs font-semibold accent-gradient-text">
                            {scoreData.hybridScore ? (
                              <button 
                                onClick={() => navigate(`/hybrid-score/${profile.id}`)}
                                className="hover:text-primary transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
                                aria-label={`View detailed score breakdown for ${Math.round(scoreData.hybridScore)}`}
                              >
                                {Math.round(scoreData.hybridScore)}
                              </button>
                            ) : (
                              <span className="inline-block px-2 py-1 bg-gray-600 text-gray-200 rounded-full text-xs">Pending</span>
                            )}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {scoreData.strengthScore ? Math.round(scoreData.strengthScore) : <span className="em-dash">—</span>}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {scoreData.speedScore ? Math.round(scoreData.speedScore) : <span className="em-dash">—</span>}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {scoreData.vo2Score ? Math.round(scoreData.vo2Score) : <span className="em-dash">—</span>}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {scoreData.distanceScore ? Math.round(scoreData.distanceScore) : <span className="em-dash">—</span>}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {scoreData.volumeScore ? Math.round(scoreData.volumeScore) : <span className="em-dash">—</span>}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {scoreData.recoveryScore ? Math.round(scoreData.recoveryScore) : <span className="em-dash">—</span>}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {formatValue(profile.weight_lb || bodyMetrics.weight_lb || bodyMetrics.weight)}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {formatValue(profile.vo2_max || bodyMetrics.vo2_max || bodyMetrics.vo2max)}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {profile.pb_mile_seconds ? formatMileTime(profile.pb_mile_seconds) : 
                             safeRenderField(profileJson.pb_mile)}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {formatValue(profile.long_run_miles || profileJson.long_run)}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {formatValue(profile.weekly_miles || profileJson.weekly_miles)}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {formatValue(profile.hrv_ms || profile.hrv || bodyMetrics.hrv || bodyMetrics.hrv_ms)}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {formatValue(profile.resting_hr_bpm || profile.resting_hr || bodyMetrics.resting_hr || bodyMetrics.resting_hr_bpm)}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {safeRenderField(profile.pb_bench_1rm_lb || profileJson.pb_bench_1rm)}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {safeRenderField(profile.pb_squat_1rm_lb || profileJson.pb_squat_1rm)}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {safeRenderField(profile.pb_deadlift_1rm_lb || profileJson.pb_deadlift_1rm)}
                          </td>
                          <td className="p-3">
                            <button 
                              onClick={() => navigate(`/hybrid-score/${profile.id}`)}
                              className="p-1 text-secondary hover:text-primary transition-colors"
                              aria-label={`View score details for ${new Date(profile.created_at).toLocaleDateString()}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {profiles.length > 0 && (
              <div className="mt-4 text-xs text-muted text-center">
                {profiles.length} {profiles.length === 1 ? 'score' : 'scores'} • 
                Use arrow keys to navigate table rows
              </div>
            )}
          </div>
        </div>

        {/* Mobile FAB (Hidden on desktop) */}
        <button className="mobile-fab items-center justify-center">
          <Plus className="w-6 h-6 text-white" />
        </button>

      </div>
    </div>
  );
};

export default ProfilePage;