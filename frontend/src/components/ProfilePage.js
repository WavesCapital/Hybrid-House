import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Calendar, Trophy, BarChart3, Plus, Target, Activity,
  Zap, RefreshCw, ArrowRight, Award, TrendingUp, Camera, 
  Save, Edit, MapPin, Globe, Mail, Settings, Upload, X, Eye, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { v4 as uuid } from 'uuid';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ProfilePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  
  // User Profile Management States (optional - only for authenticated users)
  const [userProfile, setUserProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    display_name: '',
    location: '',
    website: '',
    gender: '',
    date_of_birth: '',
    country: '',
    units_preference: 'imperial',
    privacy_level: 'private'
  });
  
  // Auto-save states
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  // Profile editing states - individual field management
  const [editingFields, setEditingFields] = useState({});
  const [savingFields, setSavingFields] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [tempFieldValues, setTempFieldValues] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Privacy settings state
  const [updatingPrivacy, setUpdatingPrivacy] = useState({});
  
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
        
        let response;
        
        if (user && session) {
          // If authenticated, get user's own profiles
          console.log('Fetching user-specific profiles...');
          response = await axios.get(`${BACKEND_URL}/api/user-profile/me/athlete-profiles`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
        } else {
          // If not authenticated, get all public profiles
          console.log('Fetching all profiles without authentication...');
          response = await axios.get(`${BACKEND_URL}/api/athlete-profiles`);
        }

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
  }, [toast, user, session]); // Added user and session as dependencies

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
          date_of_birth: profile.date_of_birth || '',
          country: profile.country || '',
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
          date_of_birth: profile.date_of_birth || '',
          country: profile.country || '',
          units_preference: profile.units_preference || 'imperial',
          privacy_level: profile.privacy_level || 'private'
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        console.log('Error details:', error.response?.data);
        console.log('User profile does not exist yet - creating default profile for editing');
        // Create a default user profile to enable editing
        // This allows the form to be visible even if the backend profile doesn't exist yet
        const defaultProfile = {
          name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
          email: user.email || '',
          location: '',
          website: '',
          gender: '',
          date_of_birth: '',
          country: '',
          units_preference: 'imperial',
          privacy_level: 'private'
        };
        setUserProfile(defaultProfile);
        setProfileForm(defaultProfile);
        setTempFieldValues(defaultProfile);
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

  // Auto-save profile form with debouncing
  const autoSaveProfile = useCallback(async (formData) => {
    if (!user || !session) {
      return;
    }

    try {
      setIsAutoSaving(true);
      
      // Include all fields including country (now that database column exists)
      const safeFormData = {
        name: formData.name || null,
        display_name: formData.display_name || null,
        location: formData.location || null,
        website: formData.website || null,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        country: formData.country || null, // Now including country!
        units_preference: formData.units_preference || 'imperial',
        privacy_level: formData.privacy_level || 'private'
      };
      
      // Remove any fields that are still empty strings after conversion
      Object.keys(safeFormData).forEach(key => {
        if (safeFormData[key] === '') {
          safeFormData[key] = null;
        }
      });
      
      const response = await axios.put(`${BACKEND_URL}/api/user-profile/me`, safeFormData, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      setUserProfile(response.data.profile);
      
      // Show success indication
      toast({
        title: "Saved",
        description: "Profile updated automatically",
        variant: "default",
        duration: 2000,
      });
      
    } catch (error) {
      console.error('Error auto-saving profile:', error);
      
      let errorMessage = "Auto-save failed";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please sign in again.";
      }
      
      toast({
        title: "Auto-save Error",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsAutoSaving(false);
    }
  }, [user, session, BACKEND_URL, toast]);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback((formData) => {
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      autoSaveProfile(formData);
    }, 1500); // Wait 1.5 seconds after user stops typing

    setAutoSaveTimeout(timeoutId);
  }, [autoSaveProfile]); // Remove autoSaveTimeout from dependency array

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Handle profile form field changes with auto-save
  const handleProfileFormChange = useCallback((fieldName, value) => {
    const updatedForm = { ...profileForm, [fieldName]: value };
    setProfileForm(updatedForm);
    
    // Trigger auto-save with debouncing
    debouncedAutoSave(updatedForm);
  }, [profileForm, debouncedAutoSave]);

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

  // Update athlete profile privacy setting
  const updateProfilePrivacy = useCallback(async (profileId, isPublic) => {
    console.log('🔄 updateProfilePrivacy called:', { profileId, isPublic, user: !!user, session: !!session });
    
    if (!user || !session) {
      console.error('❌ No user or session available for privacy update');
      toast({
        title: "Authentication Required",
        description: "Please sign in to update privacy settings",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('🚀 Starting privacy update request...');
      setUpdatingPrivacy(prev => ({ ...prev, [profileId]: true }));
      
      const response = await axios.put(
        `${BACKEND_URL}/api/athlete-profile/${profileId}/privacy`,
        { is_public: isPublic },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Privacy update response:', response.data);

      // Update the local state
      setProfiles(prevProfiles => 
        prevProfiles.map(profile => 
          profile.id === profileId 
            ? { ...profile, is_public: isPublic }
            : profile
        )
      );
      
      toast({
        title: "Privacy Updated",
        description: `Profile is now ${isPublic ? 'public and will appear on the leaderboard' : 'private and hidden from the leaderboard'}`,
        variant: "default",
      });
    } catch (error) {
      console.error('❌ Error updating privacy:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      let errorMessage = "Failed to update privacy setting";
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = "Authentication required. Please sign in again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Profile not found or you don't have permission to edit it.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdatingPrivacy(prev => ({ ...prev, [profileId]: false }));
    }
  }, [user, session, toast]);

  // Delete athlete profile
  const deleteAthleteProfile = useCallback(async (profileId, profileDate) => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete profiles",
        variant: "destructive",
      });
      return;
    }
    
    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete the profile created on ${profileDate}? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      const response = await axios.delete(
        `${BACKEND_URL}/api/athlete-profile/${profileId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      // Update the local state to remove the deleted profile
      setProfiles(prevProfiles => 
        prevProfiles.filter(profile => profile.id !== profileId)
      );
      
      toast({
        title: "Profile Deleted",
        description: "The athlete profile has been successfully deleted",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
      let errorMessage = "Failed to delete profile";
      if (error.response?.status === 404) {
        errorMessage = "Profile not found or already deleted";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please sign in again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [user, session, toast]);

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
        
        /* Flat-Neon Palette ("Laser Pop") */
        .neon-noir-canvas {
          background: #000000;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          min-height: 100vh;
        }
        
        /* Glass Cards */
        .glass-card {
          background: #15161A;
          backdrop-filter: blur(16px);
          border: 1px solid #1F2025;
          border-radius: 8px;
          box-shadow: 
            0 12px 32px -24px rgba(0,0,0,.65),
            0 0 0 1px #1F2025 inset;
          transition: all 0.3s ease;
          overflow: visible;
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
          border-bottom: 2px solid #08F0FF;
          border-image: none;
          position: sticky;
          top: 0;
          z-index: 10;
          text-align: right;
          font-variant-numeric: tabular-nums;
          color: #F5FAFF;
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
          background: transparent;
          transform: none;
          border-bottom: none;
          border-image: none;
        }
        
        .score-archive-table tr:focus {
          outline: 2px solid rgba(8, 240, 255, 0.5);
          outline-offset: -2px;
        }
        
        .most-recent-row {
          background: transparent;
          border-left: none;
        }
        
        .em-dash {
          color: #8D9299;
        }
        
        /* Table Score Colors */
        .score-archive-table .hybrid-score {
          color: #08F0FF;
          font-weight: 700;
        }
        
        .score-archive-table .sub-score {
          color: #4BFF7A;
          font-weight: 600;
        }
        
        /* Reduced spacing - 48px desktop, 24px mobile */
        .space-y-12 > * + * { margin-top: 3rem; }
        
        @media (max-width: 768px) {
          .space-y-12 > * + * { margin-top: 1.5rem; }
        }
        

        
        /* Colors */
        .text-positive { color: #32FF7A; }
        .text-negative { color: #FF5E5E; }
        .text-primary { color: #F5FAFF; }
        .text-secondary { color: rgba(245, 250, 255, 0.7); }
        .text-muted { color: #8D9299; }
        
        /* Flat Accent Colors (no gradients) */
        .accent-gradient {
          background: #08F0FF;
        }
        
        .accent-gradient-text {
          background: #08F0FF;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Buttons */
        .neon-button {
          background: #08F0FF;
          border: none;
          border-radius: 8px;
          color: #0E0E11;
          font-weight: 600;
          padding: 16px 24px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .neon-button:hover {
          transform: translateY(-2px);
          background: #FF2DDE;
          color: #0E0E11;
          box-shadow: 
            0 8px 32px rgba(8, 240, 255, 0.4),
            0 4px 16px rgba(255, 45, 222, 0.3);
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
          background: #15161A;
          border: 1px solid #1F2025;
          border-radius: 6px;
          color: #F5FAFF;
          padding: 12px 16px;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }
        
        .neon-input:focus {
          outline: none;
          border-color: transparent;
          box-shadow: 
            0 0 0 2px rgba(8, 240, 255, 0.3),
            0 0 16px rgba(8, 240, 255, 0.2);
        }
        
        .neon-input::placeholder {
          color: #8D9299;
        }
        
        /* Radar Cluster - Iron-Man HUD Style - Improved Proportions */
        .radar-cluster-container {
          position: relative;
          width: 100%;
          padding: 40px 0;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: visible;
        }
        
        .cluster {
          position: relative;
          width: 500px;
          height: 500px;
          margin: 0;
          overflow: visible;
        }
        
        .cluster-vignette {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 350px;
          height: 350px;
          background: radial-gradient(circle at 50% 50%, #08F0FF15 0%, transparent 70%);
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
        }
        
        .dial {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 1;
          overflow: visible;
        }
        
        .dial.big {
          width: 200px;
          height: 200px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .dial.mini {
          width: 140px;
          height: 140px;
        }
        
        /* Perfect Circle Positioning (180px radius from center) */
        .dial.pos-1 { /* Top-center (0°) */
          top: calc(50% - 180px);
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .dial.pos-2 { /* Top-right (60°) */
          top: calc(50% - 90px);
          left: calc(50% + 156px);
          transform: translate(-50%, -50%);
        }
        
        .dial.pos-3 { /* Bottom-right (120°) */
          top: calc(50% + 90px);
          left: calc(50% + 156px);
          transform: translate(-50%, -50%);
        }
        
        .dial.pos-4 { /* Bottom-center (180°) */
          top: calc(50% + 180px);
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .dial.pos-5 { /* Bottom-left (240°) */
          top: calc(50% + 90px);
          left: calc(50% - 156px);
          transform: translate(-50%, -50%);
        }
        
        .dial.pos-6 { /* Top-left (300°) */
          top: calc(50% - 90px);
          left: calc(50% - 156px);
          transform: translate(-50%, -50%);
        }
        
        .dial-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        
        .dial-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
          overflow: visible;
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
          color: #08F0FF;
          line-height: 1;
          margin-bottom: 6px;
        }
        
        .dial.big .score-label {
          font-size: 1rem;
          color: #8D9299;
          font-weight: 500;
        }
        
        .dial.mini .score-number {
          font-size: 1.75rem;
          font-weight: bold;
          line-height: 1;
          margin-bottom: 4px;
        }
        
        .dial.mini .score-label {
          font-size: 0.75rem;
          color: #8D9299;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          text-align: center;
        }
        
        /* Remove the external dial-label since labels are now inside circles */
        .dial-label {
          display: none;
        }
        
        /* Hover Interactions */
        .dial.big:hover {
          transform: translate(-50%, -50%) scale(1.05);
        }
        
        .dial.big:hover ~ .dial.mini {
          transform: translate(-50%, -50%) translateY(-6px);
        }
        
        .dial.big:hover ~ .dial.pos-1 {
          transform: translate(-50%, -50%) translateY(-6px);
        }
        
        .dial.big:hover ~ .dial.pos-2 {
          transform: translate(-50%, -50%) translate(6px, -3px);
        }
        
        .dial.big:hover ~ .dial.pos-3 {
          transform: translate(-50%, -50%) translate(6px, 3px);
        }
        
        .dial.big:hover ~ .dial.pos-4 {
          transform: translate(-50%, -50%) translateY(6px);
        }
        
        .dial.big:hover ~ .dial.pos-5 {
          transform: translate(-50%, -50%) translate(-6px, 3px);
        }
        
        .dial.big:hover ~ .dial.pos-6 {
          transform: translate(-50%, -50%) translate(-6px, -3px);
        }
        
        .dial.mini:hover {
          transform: translate(-50%, -50%) translateY(-4px);
        }
        
        .cluster:hover .cluster-vignette {
          background: radial-gradient(circle at 50% 50%, #08F0FF33 0%, transparent 70%);
        }
        
        /* Responsive Design */
        @media (max-width: 1200px) {
          .cluster {
            width: 600px;
            height: 600px;
          }
          
          .dial.big {
            width: 240px;
            height: 240px;
          }
          
          .dial.mini {
            width: 120px;
            height: 120px;
          }
          
          .dial.big .score-number {
            font-size: 3.5rem;
          }
          
          .dial.mini .score-number {
            font-size: 1.5rem;
          }
          
          /* Reduce circle radius to 180px */
          .dial.pos-1 { top: calc(50% - 180px); }
          .dial.pos-2 { top: calc(50% - 90px); left: calc(50% + 156px); }
          .dial.pos-3 { top: calc(50% + 90px); left: calc(50% + 156px); }
          .dial.pos-4 { top: calc(50% + 180px); }
          .dial.pos-5 { top: calc(50% + 90px); left: calc(50% - 156px); }
          .dial.pos-6 { top: calc(50% - 90px); left: calc(50% - 156px); }
        }
        
        @media (max-width: 768px) {
          .cluster {
            width: 500px;
            height: 500px;
          }
          
          .dial.big {
            width: 200px;
            height: 200px;
          }
          
          .dial.mini {
            width: 100px;
            height: 100px;
          }
          
          .dial.big .score-number {
            font-size: 2.75rem;
          }
          
          .dial.mini .score-number {
            font-size: 1.25rem;
          }
          
          /* Reduce circle radius to 140px */
          .dial.pos-1 { top: calc(50% - 140px); }
          .dial.pos-2 { top: calc(50% - 70px); left: calc(50% + 121px); }
          .dial.pos-3 { top: calc(50% + 70px); left: calc(50% + 121px); }
          .dial.pos-4 { top: calc(50% + 140px); }
          .dial.pos-5 { top: calc(50% + 70px); left: calc(50% - 121px); }
          .dial.pos-6 { top: calc(50% - 70px); left: calc(50% - 121px); }
        }
        
        @media (max-width: 480px) {
          .radar-cluster-container {
            padding: 40px 0;
          }
          
          .cluster {
            width: 100%;
            height: auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
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
            width: 200px;
            height: 200px;
          }
          
          .dial.mini {
            width: 120px;
            height: 120px;
            justify-self: center;
          }
          
          .dial.big .score-number {
            font-size: 2.5rem;
          }
          
          .dial.mini .score-number {
            font-size: 1.125rem;
          }
          
          .cluster-vignette {
            display: none;
          }
        }
        
        /* Mini KPI Cards */
        .mini-kpi {
          background: #15161A;
          border: 1px solid #1F2025;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .mini-kpi:hover {
          border-color: rgba(8, 240, 255, 0.3);
          box-shadow: 0 4px 16px rgba(8, 240, 255, 0.1);
        }
        
        /* Archive Cards */
        .archive-card {
          background: #15161A;
          border: 1px solid #1F2025;
          border-radius: 6px;
          padding: 16px;
          transition: all 0.3s ease;
        }
        
        .archive-card:hover {
          background: #15161A;
          border-color: rgba(8, 240, 255, 0.3);
          transform: translateX(4px);
        }
        
        /* Inline Editing */
        .inline-edit-field {
          background: #15161A;
          border: 1px solid #1F2025;
          border-radius: 4px;
          color: #F5FAFF;
          padding: 8px 12px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .inline-edit-field:hover {
          background: #15161A;
          border-color: rgba(8, 240, 255, 0.3);
        }
        
        .inline-edit-field.editing {
          border-color: #08F0FF;
          box-shadow: 0 0 0 2px rgba(8, 240, 255, 0.2);
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
          font-variant-numeric: tabular-nums;
          font-family: 'Inter', sans-serif;
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
        
        /* Mobile optimizations */
        @media (max-width: 1024px) {
          .lg\\:space-y-16 > * + * { margin-top: 2rem; }
          .hero-row { flex-direction: column; }
          .main-grid { grid-template-columns: 1fr; }
        }
        
        @media (max-width: 768px) {
          .neon-noir-canvas { padding: 1rem; }
          .hero-row { gap: 1rem; flex-direction: column; }
          .main-grid { gap: 1rem; grid-template-columns: 1fr; }
          .space-y-16 > * + * { margin-top: 1.5rem; }
          .md\\:space-y-8 > * + * { margin-top: 1.5rem; }
          
          /* Mobile header */
          .px-6.py-4 {
            padding: 0.75rem 1rem;
          }
          
          .flex.items-center.space-x-4 {
            gap: 0.5rem;
          }
          
          .text-xl {
            font-size: 1.125rem;
          }
          
          .text-lg {
            font-size: 1rem;
          }
          
          /* Mobile radar cluster - convert to grid */
          .cluster {
            width: 100%;
            height: auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            padding: 1rem;
          }
          
          .dial {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            transform: none !important;
          }
          
          .dial.big {
            grid-column: 1 / -1;
            justify-self: center;
            width: 180px;
            height: 180px;
          }
          
          .dial.mini {
            width: 100px;
            height: 100px;
            justify-self: center;
          }
          
          .dial.big .score-number {
            font-size: 2.5rem;
          }
          
          .dial.mini .score-number {
            font-size: 1rem;
          }
          
          .dial.mini .score-label {
            font-size: 0.625rem;
          }
          
          .cluster-vignette {
            display: none;
          }
          
          /* Mobile glass cards */
          .glass-card {
            padding: 1rem;
            margin: 0.5rem 0;
          }
          
          /* Mobile forms */
          .grid.grid-cols-1.lg\\:grid-cols-2 {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .space-y-4 > * + * {
            margin-top: 1rem;
          }
          
          .space-y-6 > * + * {
            margin-top: 1.5rem;
          }
          
          /* Mobile table */
          .score-archive-table {
            min-width: 800px;
            font-size: 0.875rem;
          }
          
          .score-archive-table th:first-child,
          .score-archive-table td:first-child {
            position: sticky;
            left: 0;
            background: rgba(20, 20, 25, 0.95);
            z-index: 5;
          }
          
          .score-archive-table th:first-child {
            z-index: 15;
          }
          
          /* Mobile buttons */
          .neon-button {
            width: 100%;
            padding: 0.875rem 1.5rem;
            font-size: 1rem;
          }
        }
        
        @media (max-width: 480px) {
          .dial.big {
            width: 160px;
            height: 160px;
          }
          
          .dial.mini {
            width: 90px;
            height: 90px;
          }
          
          .dial.big .score-number {
            font-size: 2rem;
          }
          
          .dial.mini .score-number {
            font-size: 0.875rem;
          }
          
          .dial.mini .score-label {
            font-size: 0.5rem;
          }
          
          .glass-card {
            padding: 0.75rem;
          }
          
          .text-2xl {
            font-size: 1.5rem;
          }
          
          .text-xl {
            font-size: 1.25rem;
          }
          
          .text-lg {
            font-size: 1.125rem;
          }
          
          /* Very small screen adjustments */
          .px-6.py-8 {
            padding: 1rem;
          }
          
          .container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
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
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 accent-gradient rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-primary">Hybrid House</h1>
                  <p className="text-xs text-muted hidden sm:block">Performance Analytics</p>
                </div>
              </div>
              <div className="h-4 sm:h-6 w-px bg-white/20"></div>
              <h2 className="text-base sm:text-lg font-semibold text-secondary">Profile</h2>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 accent-gradient rounded-full flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl space-y-6 sm:space-y-8">
        
        {/* Main Section - Two Column Layout */}
        {/* Hero Row - Latest Hybrid Score (Left) + Generate New Score (Right) */}
        <div className="hero-row flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          
          {/* Latest Hybrid Score (Left Column - 60% width) */}
          <div className="w-full lg:w-[60%]">
            <div className="glass-card p-4 sm:p-6">
              <div className="flex items-center justify-center mb-3">
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
                                <stop offset="0%" stopColor="#08F0FF" />
                                <stop offset="100%" stopColor="#08F0FF" />
                              </linearGradient>
                            </defs>
                            <circle cx="110" cy="110" r="95" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="14" fill="none" />
                            <circle 
                              cx="110" cy="110" r="95" 
                              stroke="url(#hybridGradient)" 
                              strokeWidth="14" 
                              fill="none" 
                              strokeLinecap="round"
                              strokeDasharray={`${(Math.round(profiles[0].score_data.hybridScore) / 100) * 596.9} 596.9`}
                              style={{ 
                                transition: 'stroke-dasharray 320ms cubic-bezier(.2,1.4,.3,1)',
                                filter: 'drop-shadow(0 0 8px rgba(8, 240, 255, 0.6))'
                              }}
                            />
                          </svg>
                          <div className="dial-value">
                            <div className="score-number">{Math.round(profiles[0].score_data.hybridScore)}</div>
                            <div className="score-label">Hybrid Score</div>
                          </div>
                        </div>
                      </div>

                      {/* Mini Dials in Perfect Circle */}
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
                              <svg className="dial-svg" viewBox="0 0 140 140">
                                <circle cx="70" cy="70" r="60" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="9" fill="none" />
                                <circle 
                                  cx="70" cy="70" r="60" 
                                  stroke="#4BFF7AD9" 
                                  strokeWidth="9" 
                                  fill="none" 
                                  strokeLinecap="round"
                                  strokeDasharray={`${(roundedValue / 100) * 377} 377`}
                                  style={{ 
                                    transition: 'stroke-dasharray 180ms ease-out',
                                    filter: 'drop-shadow(0 0 4px rgba(75, 255, 122, 0.3))'
                                  }}
                                />
                              </svg>
                              <div className="dial-value">
                                <div className="score-number" style={{ color: '#D7DFE7', fontWeight: '700' }}>{roundedValue}</div>
                                <div className="score-label" style={{ color: '#8D9299', fontWeight: '500', letterSpacing: '0.02em' }}>{item.label}</div>
                              </div>
                            </div>
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

          {/* Edit Profile (Right Column - 40% width) */}
          <div className="w-full lg:w-[40%]">
            <div className="glass-card p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-primary flex items-center">
                    Edit Profile
                  </h3>
                  {user && userProfile && (
                    <p className="text-sm text-secondary mt-2">
                      Editing profile for: <span className="text-primary">{userProfile.display_name || userProfile.name}</span>
                    </p>
                  )}
                  {!user && (
                    <p className="text-sm text-secondary mt-2">
                      Please log in to edit your profile
                    </p>
                  )}
                  {user && !userProfile && (
                    <p className="text-sm text-secondary mt-2">
                      Loading your profile data...
                    </p>
                  )}
                </div>
              </div>

              {user && (userProfile || !isLoadingProfiles) ? (
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {/* Personal Info */}
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="text-base sm:text-lg font-semibold text-primary">Personal Info</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Name</label>
                      <Input
                        type="text"
                        value={profileForm.name || ''}
                        onChange={(e) => handleProfileFormChange('name', e.target.value)}
                        placeholder="Your full name"
                        className="neon-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Display Name</label>
                      <Input
                        type="text"
                        value={profileForm.display_name || ''}
                        onChange={(e) => handleProfileFormChange('display_name', e.target.value)}
                        placeholder="Public display name"
                        className="neon-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Location</label>
                      <Input
                        type="text"
                        value={profileForm.location || ''}
                        onChange={(e) => handleProfileFormChange('location', e.target.value)}
                        placeholder="City, Country"
                        className="neon-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Date of Birth</label>
                      <Input
                        type="date"
                        value={profileForm.date_of_birth || ''}
                        onChange={(e) => handleProfileFormChange('date_of_birth', e.target.value)}
                        className="neon-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Country</label>
                      <select
                        value={profileForm.country || ''}
                        onChange={(e) => handleProfileFormChange('country', e.target.value)}
                        className="neon-input w-full"
                      >
                        <option value="">Select country</option>
                        <option value="US">🇺🇸 United States</option>
                        <option value="CA">🇨🇦 Canada</option>
                        <option value="GB">🇬🇧 United Kingdom</option>
                        <option value="AU">🇦🇺 Australia</option>
                        <option value="NZ">🇳🇿 New Zealand</option>
                        <option value="DE">🇩🇪 Germany</option>
                        <option value="FR">🇫🇷 France</option>
                        <option value="IT">🇮🇹 Italy</option>
                        <option value="ES">🇪🇸 Spain</option>
                        <option value="NL">🇳🇱 Netherlands</option>
                        <option value="SE">🇸🇪 Sweden</option>
                        <option value="NO">🇳🇴 Norway</option>
                        <option value="DK">🇩🇰 Denmark</option>
                        <option value="JP">🇯🇵 Japan</option>
                        <option value="KR">🇰🇷 South Korea</option>
                        <option value="CN">🇨🇳 China</option>
                        <option value="IN">🇮🇳 India</option>
                        <option value="BR">🇧🇷 Brazil</option>
                        <option value="MX">🇲🇽 Mexico</option>
                        <option value="AR">🇦🇷 Argentina</option>
                        <option value="ZA">🇿🇦 South Africa</option>
                        <option value="OTHER">🌍 Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Website</label>
                      <Input
                        type="url"
                        value={profileForm.website || ''}
                        onChange={(e) => handleProfileFormChange('website', e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="neon-input"
                      />
                    </div>
                    
                    {/* Physical Attributes */}
                    <div className="border-t border-white/10 pt-4">
                      <h5 className="text-sm font-medium text-primary mb-3">Physical Attributes</h5>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">Height (inches)</label>
                          <Input
                            type="number"
                            step="0.5"
                            min="48"
                            max="96"
                            value={profileForm.height_in || ''}
                            onChange={(e) => handleProfileFormChange('height_in', e.target.value)}
                            placeholder="e.g. 70"
                            className="neon-input"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">Weight (lbs)</label>
                          <Input
                            type="number"
                            step="0.5"
                            min="80"
                            max="400"
                            value={profileForm.weight_lb || ''}
                            onChange={(e) => handleProfileFormChange('weight_lb', e.target.value)}
                            placeholder="e.g. 180"
                            className="neon-input"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-secondary mb-2">Wearable Devices</label>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {['Apple Watch', 'Garmin', 'Whoop', 'Oura Ring', 'Fitbit', 'Polar', 'Suunto', 'COROS'].map(device => (
                              <label key={device} className="flex items-center space-x-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={(profileForm.wearables || []).includes(device)}
                                  onChange={(e) => {
                                    const currentWearables = profileForm.wearables || [];
                                    if (e.target.checked) {
                                      handleProfileFormChange('wearables', [...currentWearables, device]);
                                    } else {
                                      handleProfileFormChange('wearables', currentWearables.filter(w => w !== device));
                                    }
                                  }}
                                  className="rounded border-gray-600 text-[#08F0FF] focus:ring-[#08F0FF] focus:ring-1"
                                />
                                <span className="text-secondary">{device}</span>
                              </label>
                            ))}
                          </div>
                          {profileForm.wearables && profileForm.wearables.length > 0 && (
                            <div className="text-xs text-muted">
                              Selected: {profileForm.wearables.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preferences */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-primary">Preferences</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Gender</label>
                      <select
                        value={profileForm.gender || ''}
                        onChange={(e) => handleProfileFormChange('gender', e.target.value)}
                        className="neon-input w-full"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Units</label>
                      <select
                        value={profileForm.units_preference || 'imperial'}
                        onChange={(e) => handleProfileFormChange('units_preference', e.target.value)}
                        className="neon-input w-full"
                      >
                        <option value="imperial">Imperial</option>
                        <option value="metric">Metric</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Privacy</label>
                      <select
                        value={profileForm.privacy_level || 'private'}
                        onChange={(e) => handleProfileFormChange('privacy_level', e.target.value)}
                        className="neon-input w-full"
                      >
                        <option value="private">Private</option>
                        <option value="friends">Friends</option>
                        <option value="public">Public</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted">
                    {!user ? 'Please log in to edit your profile' : 'Loading your profile...'}
                  </div>
                  {user && !userProfile && (
                    <div className="text-xs text-muted mt-2">
                      Debug: User is logged in but profile not loaded yet
                    </div>
                  )}
                </div>
              )}
              
              {/* Auto-save indicator */}
              {user && (userProfile || !isLoadingProfiles) && (
                <div className="mt-6 flex justify-center">
                  <div className="flex items-center space-x-2 text-sm">
                    {isAutoSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#08F0FF] border-t-transparent rounded-full animate-spin"></div>
                        <span style={{ color: 'var(--neon-primary)' }}>Saving changes...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" style={{ color: 'var(--recovery)' }} />
                        <span style={{ color: 'var(--muted)' }}>Changes saved automatically</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Generate New Score - Full Width Section */}
        <div className="space-y-12">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-primary flex items-center">
                  Generate New Score
                </h3>
                {user && userProfile && (
                  <p className="text-sm text-secondary mt-2">
                    Creating profile for: <span className="text-primary">{userProfile.display_name || userProfile.name}</span> 
                    ({userProfile.gender || 'Gender not specified'})
                  </p>
                )}
                {!user && (
                  <p className="text-sm text-secondary mt-2">
                    Create an anonymous athlete profile
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Body Metrics */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-primary">Body Metrics</h4>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Weight (lbs)</label>
                  <Input
                    type="number"
                    value={inputForm.weight_lb}
                    onChange={(e) => setInputForm({...inputForm, weight_lb: e.target.value})}
                    placeholder="e.g., 180"
                    className="neon-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">VO₂ Max (ml/kg/min)</label>
                  <Input
                    type="number"
                    value={inputForm.vo2_max}
                    onChange={(e) => setInputForm({...inputForm, vo2_max: e.target.value})}
                    placeholder="e.g., 45"
                    className="neon-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Resting HR (bpm)</label>
                  <Input
                    type="number"
                    value={inputForm.resting_hr}
                    onChange={(e) => setInputForm({...inputForm, resting_hr: e.target.value})}
                    placeholder="e.g., 60"
                    className="neon-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">HRV (ms)</label>
                  <Input
                    type="number"
                    value={inputForm.hrv}
                    onChange={(e) => setInputForm({...inputForm, hrv: e.target.value})}
                    placeholder="e.g., 35"
                    className="neon-input"
                  />
                </div>
              </div>
              
              {/* Performance Metrics */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-primary">Performance</h4>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Mile PR (m:ss)</label>
                  <Input
                    type="text"
                    value={inputForm.pb_mile}
                    onChange={(e) => setInputForm({...inputForm, pb_mile: e.target.value})}
                    placeholder="e.g., 6:30"
                    className="neon-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Weekly Miles</label>
                  <Input
                    type="number"
                    value={inputForm.weekly_miles}
                    onChange={(e) => setInputForm({...inputForm, weekly_miles: e.target.value})}
                    placeholder="e.g., 25"
                    className="neon-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Long Run (miles)</label>
                  <Input
                    type="number"
                    value={inputForm.long_run}
                    onChange={(e) => setInputForm({...inputForm, long_run: e.target.value})}
                    placeholder="e.g., 12"
                    className="neon-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Bench 1RM (lbs)</label>
                  <Input
                    type="number"
                    value={inputForm.pb_bench_1rm}
                    onChange={(e) => setInputForm({...inputForm, pb_bench_1rm: e.target.value})}
                    placeholder="e.g., 225"
                    className="neon-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Squat 1RM (lbs)</label>
                  <Input
                    type="number"
                    value={inputForm.pb_squat_1rm}
                    onChange={(e) => setInputForm({...inputForm, pb_squat_1rm: e.target.value})}
                    placeholder="e.g., 315"
                    className="neon-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Deadlift 1RM (lbs)</label>
                  <Input
                    type="number"
                    value={inputForm.pb_deadlift_1rm}
                    onChange={(e) => setInputForm({...inputForm, pb_deadlift_1rm: e.target.value})}
                    placeholder="e.g., 405"
                    className="neon-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button 
                onClick={generateNewProfile}
                disabled={isGenerating}
                className="neon-button min-w-[180px]"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Section - Stack with reduced spacing */}
        <div className="space-y-12">{/* Reduced spacing: 48px desktop, 24px mobile */}
          
          {/* Hybrid Score History - Table Format */}
          <div className="glass-card p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h3 className="text-xl sm:text-2xl font-bold text-primary flex items-center">
                Hybrid Score History
              </h3>
              
              {/* Privacy Controls */}
              {profiles.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="text-sm text-secondary">
                    Leaderboard Visibility:
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Show privacy status for the latest profile */}
                    {profiles[0] && (
                      <div className="flex items-center space-x-3 px-4 py-2 rounded-lg border border-[#08F0FF]/30 bg-[#08F0FF]/5">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${profiles[0].is_public ? 'bg-[#08F0FF] shadow-[0_0_6px_#08F0FFAA]' : 'bg-gray-500'}`}></div>
                          <span className="text-sm font-medium" style={{ color: profiles[0].is_public ? '#08F0FF' : 'var(--muted)' }}>
                            {profiles[0].is_public ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <button
                          onClick={() => updateProfilePrivacy(profiles[0].id, !profiles[0].is_public)}
                          disabled={updatingPrivacy[profiles[0].id]}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#08F0FF] focus:ring-offset-2
                            ${profiles[0].is_public 
                              ? 'bg-gradient-to-r from-[#08F0FF] to-[#FF2DDE] shadow-[0_0_15px_#08F0FFAA]' 
                              : 'bg-gray-600 hover:bg-gray-500'
                            }
                            ${updatingPrivacy[profiles[0].id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          title={profiles[0].is_public ? 'Click to make private (hide from leaderboard)' : 'Click to make public (show on leaderboard)'}
                        >
                          <span
                            className={`
                              inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ease-in-out shadow-lg
                              ${profiles[0].is_public ? 'translate-x-6 shadow-[0_0_8px_#08F0FFAA]' : 'translate-x-1'}
                            `}
                          />
                        </button>
                        {updatingPrivacy[profiles[0].id] && (
                          <div className="animate-spin w-4 h-4 border-2 border-[#08F0FF] border-t-transparent rounded-full"></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
              <div className="min-w-[800px] px-4 sm:px-6 lg:px-8">
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
                    <th className="text-center p-3 text-xs font-semibold text-secondary">Privacy</th>
                    <th className="text-right p-3 text-xs font-semibold text-secondary">Actions</th>
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
                          <td className="p-3 text-xs font-semibold hybrid-score">
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
                          <td className="p-3 text-xs sub-score">
                            {scoreData.strengthScore ? Math.round(scoreData.strengthScore) : <span className="em-dash">—</span>}
                          </td>
                          <td className="p-3 text-xs sub-score">
                            {scoreData.speedScore ? Math.round(scoreData.speedScore) : <span className="em-dash">—</span>}
                          </td>
                          <td className="p-3 text-xs sub-score">
                            {scoreData.vo2Score ? Math.round(scoreData.vo2Score) : <span className="em-dash">—</span>}
                          </td>
                          <td className="p-3 text-xs sub-score">
                            {scoreData.distanceScore ? Math.round(scoreData.distanceScore) : <span className="em-dash">—</span>}
                          </td>
                          <td className="p-3 text-xs sub-score">
                            {scoreData.volumeScore ? Math.round(scoreData.volumeScore) : <span className="em-dash">—</span>}
                          </td>
                          <td className="p-3 text-xs sub-score">
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
                          <td className="p-3 text-center">
                            {user && session ? (
                              // Show privacy toggle for authenticated users (viewing their own profiles)
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <button
                                  onClick={() => updateProfilePrivacy(profile.id, !profile.is_public)}
                                  disabled={updatingPrivacy[profile.id]}
                                  className={`
                                    relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#08F0FF] focus:ring-offset-2
                                    ${profile.is_public 
                                      ? 'bg-[#08F0FF] shadow-[0_0_10px_#08F0FFAA]' 
                                      : 'bg-gray-600'
                                    }
                                    ${updatingPrivacy[profile.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                                  `}
                                  title={profile.is_public ? 'Click to make private (hide from leaderboard)' : 'Click to make public (show on leaderboard)'}
                                >
                                  <span
                                    className={`
                                      inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out
                                      ${profile.is_public ? 'translate-x-5' : 'translate-x-1'}
                                    `}
                                  />
                                </button>
                                <div className="text-xs">
                                  {profile.is_public ? (
                                    <span className="text-[#08F0FF] font-medium">Public</span>
                                  ) : (
                                    <span className="text-gray-400">Private</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Show read-only status for non-authenticated users
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <div className={`
                                  relative inline-flex h-5 w-9 items-center rounded-full
                                  ${profile.is_public 
                                    ? 'bg-[#08F0FF] shadow-[0_0_10px_#08F0FFAA]' 
                                    : 'bg-gray-600'
                                  }
                                `}>
                                  <span
                                    className={`
                                      inline-block h-3 w-3 rounded-full bg-white
                                      ${profile.is_public ? 'translate-x-5' : 'translate-x-1'}
                                    `}
                                  />
                                </div>
                                <div className="text-xs">
                                  {profile.is_public ? (
                                    <span className="text-[#08F0FF] font-medium">Public</span>
                                  ) : (
                                    <span className="text-gray-400">Private</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => navigate(`/hybrid-score/${profile.id}`)}
                                className="p-1 text-secondary hover:text-primary transition-colors"
                                aria-label={`View score details for ${new Date(profile.created_at).toLocaleDateString()}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {user && session && (
                                <button 
                                  onClick={() => deleteAthleteProfile(profile.id, new Date(profile.created_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  }))}
                                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                  aria-label={`Delete profile from ${new Date(profile.created_at).toLocaleDateString()}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              </div>
            </div>
            
            {profiles.length > 0 && (
              <div className="mt-4 text-xs text-muted text-center">
                {profiles.length} {profiles.length === 1 ? 'score' : 'scores'} • 
                Use arrow keys to navigate table rows
              </div>
            )}
            
            {/* Privacy Explanation */}
            {profiles.length > 0 && (
              <div className="mb-6 p-4 rounded-lg border border-[#08F0FF]/20 bg-gradient-to-r from-[#08F0FF]/5 to-[#FF2DDE]/5">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#08F0FF] to-[#FF2DDE] flex items-center justify-center">
                      <Globe className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-primary mb-1">Privacy Control</div>
                    <div className="text-xs text-secondary leading-relaxed">
                      <span className="font-medium text-[#08F0FF]">Public:</span> Your highest score appears on the global leaderboard for other athletes to see. 
                      <span className="font-medium text-gray-400 ml-3">Private:</span> Your scores stay hidden and won't appear on any public rankings.
                    </div>
                  </div>
                </div>
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