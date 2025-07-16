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
  Save, Edit, MapPin, Globe, Phone, Mail, Settings, Upload, X
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ProfilePage = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // User Profile Management States
  const [userProfile, setUserProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    gender: '',
    units_preference: 'imperial',
    privacy_level: 'private'
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Athlete Profile Management States
  const [profiles, setProfiles] = useState([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputForm, setInputForm] = useState({
    first_name: '',
    sex: '',
    body_metrics: '',
    pb_mile: '',
    weekly_miles: '',
    long_run: '',
    pb_bench_1rm: '',
    pb_squat_1rm: '',
    pb_deadlift_1rm: ''
  });

  // Load profiles and populate form with most recent data
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
          const mostRecent = profilesData[0];
          
          // Helper function to get field value from either individual column or JSON
          const getFieldValue = (fieldName, jsonPath) => {
            if (mostRecent[fieldName] !== undefined && mostRecent[fieldName] !== null) {
              return mostRecent[fieldName];
            }
            if (mostRecent.profile_json && mostRecent.profile_json[jsonPath || fieldName]) {
              return mostRecent.profile_json[jsonPath || fieldName];
            }
            return '';
          };
          
          // Convert body_metrics object to string if it's an object
          let bodyMetricsStr = '';
          const bodyMetrics = mostRecent.body_metrics || mostRecent.profile_json?.body_metrics;
          if (bodyMetrics) {
            if (typeof bodyMetrics === 'object') {
              bodyMetricsStr = Object.entries(bodyMetrics)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            } else {
              bodyMetricsStr = bodyMetrics.toString();
            }
          }
          
          // Helper function to convert object to string
          const convertToString = (value) => {
            if (!value) return '';
            if (typeof value === 'object') {
              return JSON.stringify(value);
            }
            return value.toString();
          };
          
          setInputForm({
            first_name: getFieldValue('first_name'),
            sex: getFieldValue('sex'), 
            body_metrics: bodyMetricsStr,
            pb_mile: convertToString(getFieldValue('pb_mile_seconds') ? 
              `${Math.floor(getFieldValue('pb_mile_seconds') / 60)}:${String(getFieldValue('pb_mile_seconds') % 60).padStart(2, '0')}` : 
              getFieldValue('pb_mile')),
            weekly_miles: convertToString(getFieldValue('weekly_miles')),
            long_run: convertToString(getFieldValue('long_run_miles') || getFieldValue('long_run')),
            pb_bench_1rm: convertToString(getFieldValue('pb_bench_1rm_lb') || getFieldValue('pb_bench_1rm')),
            pb_squat_1rm: convertToString(getFieldValue('pb_squat_1rm_lb') || getFieldValue('pb_squat_1rm')),
            pb_deadlift_1rm: convertToString(getFieldValue('pb_deadlift_1rm_lb') || getFieldValue('pb_deadlift_1rm'))
          });
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

  // Generate new athlete profile
  const generateNewProfile = useCallback(async () => {
    try {
      setIsGenerating(true);
      
      // Validate required fields
      if (!inputForm.first_name.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter your first name.",
          variant: "destructive",
        });
        return;
      }

      // Prepare profile data
      const profileData = {
        ...inputForm,
        schema_version: "v1.0",
        meta_session_id: `manual-${Date.now()}`,
        weekly_miles: parseInt(inputForm.weekly_miles) || 0,
        long_run: parseInt(inputForm.long_run) || 0
      };

      // Call webhook to generate score
      const webhookResponse = await fetch('https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          athleteProfile: profileData,
          deliverable: 'score'
        })
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook request failed with status: ${webhookResponse.status}`);
      }

      const scoreData = await webhookResponse.json();
      const finalScoreData = Array.isArray(scoreData) ? scoreData[0] : scoreData;

      // Create new profile in database
      const profileId = `manual-${Date.now()}`;
      const newProfile = {
        id: profileId,
        profile_json: profileData,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store profile in database
      await axios.post(`${BACKEND_URL}/api/athlete-profiles`, newProfile);

      // Store score data
      await axios.post(`${BACKEND_URL}/api/athlete-profile/${profileId}/score`, finalScoreData);

      toast({
        title: "Profile Generated! 🎉",
        description: "Your new athlete profile has been created successfully.",
      });

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
  }, [inputForm, navigate, toast]);

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

  if (isLoading) {
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Manual Input Form */}
          <div className="space-y-6">
            <div className="neo-card rounded-xl p-6">
              <h2 className="text-2xl font-bold neo-primary mb-6 flex items-center">
                <Target className="h-6 w-6 mr-3" />
                Generate New Profile
              </h2>
              
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium neo-text-secondary mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={inputForm.first_name}
                      onChange={(e) => setInputForm({...inputForm, first_name: e.target.value})}
                      className="neo-input w-full"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium neo-text-secondary mb-2">
                      Sex
                    </label>
                    <select
                      value={inputForm.sex}
                      onChange={(e) => setInputForm({...inputForm, sex: e.target.value})}
                      className="neo-input w-full"
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Body Metrics */}
                <div>
                  <label className="block text-sm font-medium neo-text-secondary mb-2">
                    Body Metrics
                  </label>
                  <input
                    type="text"
                    value={inputForm.body_metrics}
                    onChange={(e) => setInputForm({...inputForm, body_metrics: e.target.value})}
                    className="neo-input w-full"
                    placeholder="e.g., 163 lbs, VO2 max 54, resting HR 42, HRV 64"
                  />
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