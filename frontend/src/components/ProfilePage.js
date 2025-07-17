import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';
import { 
  User, Calendar, Trophy, BarChart3, Plus, Target, 
  Zap, RefreshCw, ArrowRight, Award, TrendingUp, Camera, 
  Save, Edit, MapPin, Globe, Mail, Settings, Upload, X
} from 'lucide-react';
import axios from 'axios';
import { v4 as uuid } from 'uuid';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ProfilePage = () => {
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // User Profile Management States
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
          
          // Extract body metrics from various sources
          let bodyMetrics = {};
          
          // Check individual columns
          if (bestProfile.weight_lb) bodyMetrics.weight_lb = bestProfile.weight_lb;
          if (bestProfile.vo2_max) bodyMetrics.vo2_max = bestProfile.vo2_max;
          if (bestProfile.resting_hr) bodyMetrics.resting_hr = bestProfile.resting_hr;
          if (bestProfile.hrv) bodyMetrics.hrv = bestProfile.hrv;
          
          // Check profile_json body_metrics
          if (bestProfile.profile_json?.body_metrics) {
            const jsonBodyMetrics = bestProfile.profile_json.body_metrics;
            if (typeof jsonBodyMetrics === 'object') {
              bodyMetrics = { ...bodyMetrics, ...jsonBodyMetrics };
            }
          }
          
          // Check individual weight_lb field in profile_json
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
          
          // Build the form data
          const formData = {
            // Body Metrics (individual fields)
            weight_lb: bodyMetrics.weight_lb || bodyMetrics.weight || '170',
            vo2_max: bodyMetrics.vo2_max || bodyMetrics.vo2max || '50',
            resting_hr: bodyMetrics.resting_hr || bodyMetrics.resting_hr_bpm || '60',
            hrv: bodyMetrics.hrv || bodyMetrics.hrv_ms || '45',
            
            // Running Performance
            pb_mile: getFieldValue('pb_mile_seconds') ? 
              `${Math.floor(getFieldValue('pb_mile_seconds') / 60)}:${String(getFieldValue('pb_mile_seconds') % 60).padStart(2, '0')}` : 
              getFieldValue('pb_mile') || '7:30',
            weekly_miles: getFieldValue('weekly_miles') || '20',
            long_run: getFieldValue('long_run_miles') || getFieldValue('long_run') || '8',
            
            // Strength Performance
            pb_bench_1rm: extractWeight(getFieldValue('pb_bench_1rm_lb') || getFieldValue('pb_bench_1rm')) || '185',
            pb_squat_1rm: extractWeight(getFieldValue('pb_squat_1rm_lb') || getFieldValue('pb_squat_1rm')) || '225',
            pb_deadlift_1rm: extractWeight(getFieldValue('pb_deadlift_1rm_lb') || getFieldValue('pb_deadlift_1rm')) || '275'
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

  // Generate new athlete profile
  const generateNewProfile = useCallback(async () => {
    // Check if user is authenticated for name and gender
    if (!user || !userProfile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate a profile with your information",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);

      // Create profile JSON using user profile data and form inputs
      const profileJson = {
        // Use data from user profile
        first_name: userProfile.name || userProfile.display_name || 'User',
        sex: userProfile.gender || 'Not specified',
        
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

      // Store profile in database - use authenticated endpoint if user is signed in
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

      // Call webhook for score computation
      const webhookPayload = {
        profile_data: profileJson,
        deliverable: 'score'
      };

      console.log('Calling webhook with payload:', webhookPayload);
      
      const webhookResponse = await axios.post(
        'https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c',
        webhookPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 150000 // 2.5 minutes
        }
      );

      console.log('Webhook response:', webhookResponse.data);

      // Store score data
      await axios.post(`${BACKEND_URL}/api/athlete-profile/${profileId}/score`, webhookResponse.data);

      // Navigate to the new score page
      navigate(`/hybrid-score/${profileId}`);
      
    } catch (error) {
      console.error('Error generating profile:', error);
      toast({
        title: "Error generating profile",
        description: "Failed to generate your athlete profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0B0C' }}>
        <div className="text-center">
          <div className="neo-primary text-xl mb-4">Loading authentication...</div>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isLoadingProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0B0C' }}>
        <div className="text-center">
          <div className="neo-primary text-xl mb-4">Loading your profiles...</div>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0B0C' }}>
      <style>
        {`
        .neo-card {
          background: linear-gradient(135deg, rgba(217, 217, 217, 0.1) 0%, rgba(159, 161, 163, 0.05) 100%);
          border: 1px solid rgba(217, 217, 217, 0.2);
          backdrop-filter: blur(10px);
        }
        .neo-primary {
          color: #79CFF7;
        }
        .neo-text-primary {
          color: #D9D9D9;
        }
        .neo-text-secondary {
          color: #9FA1A3;
        }
        .neo-text-muted {
          color: #6B7280;
        }
        .neo-btn-primary {
          background: linear-gradient(135deg, #79CFF7 0%, #4FC3F7 100%);
          color: #0A0B0C;
          border: none;
          font-weight: 600;
        }
        .neo-btn-primary:hover {
          background: linear-gradient(135deg, #4FC3F7 0%, #79CFF7 100%);
          transform: translateY(-1px);
        }
        .neo-btn-secondary {
          background: rgba(159, 161, 163, 0.1);
          color: #D9D9D9;
          border: 1px solid rgba(159, 161, 163, 0.3);
        }
        .neo-btn-secondary:hover {
          background: rgba(159, 161, 163, 0.2);
          color: #D9D9D9;
        }
        .neo-input {
          background: rgba(159, 161, 163, 0.1);
          border: 1px solid rgba(159, 161, 163, 0.3);
          color: #D9D9D9;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 14px;
        }
        .neo-input:focus {
          outline: none;
          border-color: #79CFF7;
          box-shadow: 0 0 0 3px rgba(121, 207, 247, 0.1);
        }
        .neo-input::placeholder {
          color: #6B7280;
        }
        .profile-card {
          transition: all 0.3s ease;
        }
        .profile-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .editable-field {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .editable-field:hover {
          background-color: rgba(159, 161, 163, 0.1);
          border-color: rgba(121, 207, 247, 0.3);
        }
        .editable-field.editing {
          background-color: rgba(159, 161, 163, 0.1);
          border-color: #79CFF7;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          .grid {
            grid-template-columns: 1fr;
          }
        }
        `}
      </style>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold neo-primary">Athlete Profiles</h1>
              <p className="neo-text-secondary">
                View your past scores and create new athlete profiles
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/')}
            className="neo-btn-secondary"
          >
            Back to Interview
          </Button>
        </div>

        {/* User Profile Section - Inline Editing */}
        {(!loading && user) && (
          <div className="mb-8">
            <div className="neo-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold neo-primary flex items-center">
                  <Settings className="h-6 w-6 mr-3" />
                  Your Profile
                </h2>
                <span className="text-sm neo-text-secondary">
                  Click any field to edit
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Avatar Section */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    
                    <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors">
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
                    <p className="text-sm font-medium neo-text-primary">
                      {userProfile?.display_name || userProfile?.name || 'User'}
                    </p>
                    <p className="text-xs neo-text-secondary">
                      {userProfile?.email}
                    </p>
                  </div>
                  
                  {avatarFile && (
                    <div className="mt-2 space-y-1">
                      <Button onClick={handleAvatarUpload} disabled={isLoadingProfiles} className="w-full text-xs">
                        <Upload className="w-3 h-3 mr-1" />
                        Upload
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} 
                        className="w-full text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                {/* Profile Information - Inline Editing */}
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium neo-text-secondary mb-1">
                        Name
                      </label>
                      <EditableField
                        fieldName="name"
                        label="Name"
                        value={userProfile?.name}
                        placeholder="Enter your name"
                      />
                      {fieldErrors.name && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium neo-text-secondary mb-1">
                        Display Name
                      </label>
                      <EditableField
                        fieldName="display_name"
                        label="Display Name"
                        value={userProfile?.display_name}
                        placeholder="Enter your display name"
                      />
                      {fieldErrors.display_name && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.display_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium neo-text-secondary mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Location
                      </label>
                      <EditableField
                        fieldName="location"
                        label="Location"
                        value={userProfile?.location}
                        placeholder="City, Country"
                      />
                      {fieldErrors.location && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.location}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium neo-text-secondary mb-1">
                        <Globe className="w-4 h-4 inline mr-1" />
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
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.website}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium neo-text-secondary mb-1">
                        Gender
                      </label>
                      <EditableField
                        fieldName="gender"
                        label="Gender"
                        value={userProfile?.gender}
                        type="select"
                        options={[
                          { value: '', label: 'Select Gender' },
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                          { value: 'other', label: 'Other' },
                          { value: 'prefer-not-to-say', label: 'Prefer not to say' }
                        ]}
                      />
                      {fieldErrors.gender && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.gender}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium neo-text-secondary mb-1">
                        Units Preference
                      </label>
                      <EditableField
                        fieldName="units_preference"
                        label="Units Preference"
                        value={userProfile?.units_preference}
                        type="select"
                        options={[
                          { value: 'imperial', label: 'Imperial (lbs, miles, ft)' },
                          { value: 'metric', label: 'Metric (kg, km, m)' }
                        ]}
                      />
                      {fieldErrors.units_preference && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.units_preference}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium neo-text-secondary mb-1">
                        Privacy Level
                      </label>
                      <EditableField
                        fieldName="privacy_level"
                        label="Privacy Level"
                        value={userProfile?.privacy_level}
                        type="select"
                        options={[
                          { value: 'private', label: 'Private' },
                          { value: 'friends', label: 'Friends Only' },
                          { value: 'public', label: 'Public' }
                        ]}
                      />
                      {fieldErrors.privacy_level && (
                        <p className="text-red-400 text-xs mt-1">{fieldErrors.privacy_level}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Manual Input Form */}
          <div className="space-y-6">
            <div className="neo-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold neo-primary flex items-center">
                    <Plus className="h-6 w-6 mr-3" />
                    Generate New Profile
                  </h2>
                  {user && userProfile && (
                    <p className="text-sm neo-text-secondary mt-1">
                      Creating profile for: <span className="neo-text-primary">{userProfile.display_name || userProfile.name}</span> 
                      ({userProfile.gender || 'Gender not specified'})
                    </p>
                  )}
                  {(!user || !userProfile) && (
                    <p className="text-sm text-yellow-400 mt-1">
                      Sign in to create profiles linked to your account
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Body Metrics - Individual Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold neo-text-primary">Body Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium neo-text-secondary mb-2">
                        Weight (lbs)
                      </label>
                      <input
                        type="number"
                        value={inputForm.weight_lb}
                        onChange={(e) => setInputForm({...inputForm, weight_lb: e.target.value})}
                        className="neo-input w-full"
                        placeholder="e.g., 163"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium neo-text-secondary mb-2">
                        VO2 Max
                      </label>
                      <input
                        type="number"
                        value={inputForm.vo2_max}
                        onChange={(e) => setInputForm({...inputForm, vo2_max: e.target.value})}
                        className="neo-input w-full"
                        placeholder="e.g., 54"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium neo-text-secondary mb-2">
                        Resting HR (bpm)
                      </label>
                      <input
                        type="number"
                        value={inputForm.resting_hr}
                        onChange={(e) => setInputForm({...inputForm, resting_hr: e.target.value})}
                        className="neo-input w-full"
                        placeholder="e.g., 42"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium neo-text-secondary mb-2">
                        HRV (ms)
                      </label>
                      <input
                        type="number"
                        value={inputForm.hrv}
                        onChange={(e) => setInputForm({...inputForm, hrv: e.target.value})}
                        className="neo-input w-full"
                        placeholder="e.g., 64"
                      />
                    </div>
                  </div>
                </div>

                {/* Running Performance */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium neo-text-secondary mb-2">
                      Mile PR
                    </label>
                    <input
                      type="text"
                      value={inputForm.pb_mile}
                      onChange={(e) => setInputForm({...inputForm, pb_mile: e.target.value})}
                      className="neo-input w-full"
                      placeholder="e.g., 7:43"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium neo-text-secondary mb-2">
                      Weekly Miles
                    </label>
                    <input
                      type="number"
                      value={inputForm.weekly_miles}
                      onChange={(e) => setInputForm({...inputForm, weekly_miles: e.target.value})}
                      className="neo-input w-full"
                      placeholder="e.g., 15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium neo-text-secondary mb-2">
                      Long Run (miles)
                    </label>
                    <input
                      type="number"
                      value={inputForm.long_run}
                      onChange={(e) => setInputForm({...inputForm, long_run: e.target.value})}
                      className="neo-input w-full"
                      placeholder="e.g., 7"
                    />
                  </div>
                </div>

                {/* Strength Performance */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium neo-text-secondary mb-2">
                      Bench Press 1RM
                    </label>
                    <input
                      type="text"
                      value={inputForm.pb_bench_1rm}
                      onChange={(e) => setInputForm({...inputForm, pb_bench_1rm: e.target.value})}
                      className="neo-input w-full"
                      placeholder="e.g., 225 lbs x 3 reps"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium neo-text-secondary mb-2">
                      Squat 1RM
                    </label>
                    <input
                      type="text"
                      value={inputForm.pb_squat_1rm}
                      onChange={(e) => setInputForm({...inputForm, pb_squat_1rm: e.target.value})}
                      className="neo-input w-full"
                      placeholder="e.g., 315 lbs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium neo-text-secondary mb-2">
                      Deadlift 1RM
                    </label>
                    <input
                      type="text"
                      value={inputForm.pb_deadlift_1rm}
                      onChange={(e) => setInputForm({...inputForm, pb_deadlift_1rm: e.target.value})}
                      className="neo-input w-full"
                      placeholder="e.g., 405 lbs"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <Button
                    onClick={generateNewProfile}
                    className="neo-btn-primary w-full py-4 text-lg"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                        Generating Profile...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-3" />
                        Generate Hybrid Score
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Past Profiles */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold neo-primary flex items-center">
                <Trophy className="h-6 w-6 mr-3" />
                Past Profiles
              </h2>
              <span className="text-sm neo-text-secondary">
                {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-4 max-h-[800px] overflow-y-auto">
              {profiles.length === 0 ? (
                <div className="neo-card rounded-xl p-8 text-center">
                  <Award className="h-12 w-12 neo-primary mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold neo-text-primary mb-2">No profiles yet</h3>
                  <p className="neo-text-secondary">Create your first profile using the form on the left!</p>
                </div>
              ) : (
                profiles.map((profile) => {
                  const score = profile.score_data ? Math.round(parseFloat(profile.score_data.hybridScore)) : null;
                  const scoreColor = score ? getScoreColor(score) : '#6B7280';
                  
                  return (
                    <div key={profile.id} className="neo-card rounded-xl p-6 profile-card">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold neo-text-primary">
                              {profile.profile_json?.first_name || profile.first_name || 'Unnamed Profile'}
                            </h3>
                            <p className="text-sm neo-text-secondary flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(profile.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {score && (
                            <div className="text-right">
                              <div className="text-2xl font-bold" style={{ color: scoreColor }}>
                                {score}
                              </div>
                              <div className="text-xs neo-text-secondary">Hybrid Score</div>
                            </div>
                          )}
                          
                          <Button
                            onClick={() => {
                              if (score) {
                                navigate(`/hybrid-score/${profile.id}`);
                              } else {
                                toast({
                                  title: "No Score Available",
                                  description: "This profile doesn't have a calculated score yet.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="neo-btn-secondary"
                            size="sm"
                          >
                            {score ? (
                              <>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Score
                              </>
                            ) : (
                              <>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                No Score
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Profile Data Preview */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="neo-text-secondary">Sex:</span>
                          <span className="neo-text-primary ml-2">{renderProfileField(profile.sex || profile.profile_json?.sex)}</span>
                        </div>
                        <div>
                          <span className="neo-text-secondary">Mile PR:</span>
                          <span className="neo-text-primary ml-2">{renderProfileField(
                            profile.pb_mile_seconds ? 
                              `${Math.floor(profile.pb_mile_seconds / 60)}:${String(profile.pb_mile_seconds % 60).padStart(2, '0')}` : 
                              profile.profile_json?.pb_mile
                          )}</span>
                        </div>
                        <div>
                          <span className="neo-text-secondary">Weekly Miles:</span>
                          <span className="neo-text-primary ml-2">{renderProfileField(profile.weekly_miles || profile.profile_json?.weekly_miles)}</span>
                        </div>
                        <div>
                          <span className="neo-text-secondary">Long Run:</span>
                          <span className="neo-text-primary ml-2">{renderProfileField(profile.long_run_miles || profile.profile_json?.long_run)}</span>
                        </div>
                        <div>
                          <span className="neo-text-secondary">Bench:</span>
                          <span className="neo-text-primary ml-2">{renderProfileField(profile.pb_bench_1rm_lb || profile.profile_json?.pb_bench_1rm)}</span>
                        </div>
                        <div>
                          <span className="neo-text-secondary">Status:</span>
                          <span className="neo-text-primary ml-2">{score ? 'Scored' : 'Pending'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;