import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { 
  User, Edit3, Save, X, Plus, Calendar, Trophy, 
  BarChart3, Trash2, RefreshCw, TrendingUp
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ProfilePage = () => {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load user profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!session) return;

      try {
        setIsLoading(true);
        
        const response = await axios.get(
          `${BACKEND_URL}/api/athlete-profiles`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        setProfiles(response.data.profiles || []);
        
      } catch (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error loading profiles",
          description: "Failed to load your athlete profiles. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [session, toast]);

  // Memoize statistics to prevent recalculation on every render
  const profileStats = useMemo(() => {
    const totalProfiles = profiles.length;
    const latestScore = totalProfiles > 0 && profiles[0].score_data 
      ? Math.round(parseFloat(profiles[0].score_data.hybridScore)) 
      : '-';
    const scoredProfiles = profiles.filter(p => p.score_data).length;
    
    return { totalProfiles, latestScore, scoredProfiles };
  }, [profiles]);

  // Memoize format date function
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Memoize functions to prevent unnecessary re-renders
  const startEditing = useCallback((profile) => {
    setEditingProfile(profile.id);
    setEditForm({
      first_name: profile.profile_json.first_name || '',
      sex: profile.profile_json.sex || '',
      body_metrics: profile.profile_json.body_metrics || '',
      pb_mile: profile.profile_json.pb_mile || '',
      weekly_miles: profile.profile_json.weekly_miles || '',
      long_run: profile.profile_json.long_run || '',
      pb_bench_1rm: profile.profile_json.pb_bench_1rm || '',
      pb_squat_1rm: profile.profile_json.pb_squat_1rm || '',
      pb_deadlift_1rm: profile.profile_json.pb_deadlift_1rm || ''
    });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingProfile(null);
    setEditForm({});
  }, []);

  // Save profile changes
  const saveProfile = useCallback(async (profileId) => {
    try {
      setIsCalculating(true);
      
      // Update profile
      await axios.put(
        `${BACKEND_URL}/api/athlete-profile/${profileId}`,
        {
          ...editForm,
          schema_version: "v1.0",
          updated_at: new Date().toISOString()
        },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Trigger webhook for new score calculation
      const response = await fetch('https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          athleteProfile: editForm,
          deliverable: 'score'
        })
      });

      if (response.ok) {
        const scoreData = await response.json();
        const finalScoreData = Array.isArray(scoreData) ? scoreData[0] : scoreData;
        
        // Update profile with new score
        await axios.post(
          `${BACKEND_URL}/api/athlete-profile/${profileId}/score`,
          finalScoreData,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Refresh profiles
        window.location.reload();
        
        toast({
          title: "Profile Updated!",
          description: "Your profile has been updated and score recalculated.",
        });
      }
      
      setEditingProfile(null);
      setEditForm({});
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  }, [editForm, session, toast]);

  // Delete profile
  const deleteProfile = useCallback(async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(
        `${BACKEND_URL}/api/athlete-profile/${profileId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setProfiles(profiles.filter(p => p.id !== profileId));
      
      toast({
        title: "Profile Deleted",
        description: "Your profile has been deleted successfully.",
      });
      
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Error deleting profile",
        description: "Failed to delete your profile. Please try again.",
        variant: "destructive",
      });
    }
  }, [profiles, session, toast]);

  // Format date function was moved to be memoized above

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
          padding: 8px 12px;
        }
        .neo-input:focus {
          outline: none;
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
            <User className="h-8 w-8 neo-primary" />
            <div>
              <h1 className="text-3xl font-bold neo-primary">Your Profile</h1>
              <p className="neo-text-secondary">
                Manage your athlete profiles and track your hybrid scores
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/')}
            className="neo-btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Assessment
          </Button>
        </div>

        {/* Profile Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="neo-card rounded-xl p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center">
                <Trophy className="h-6 w-6 neo-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold neo-text-primary">{profiles.length}</div>
                <div className="text-sm neo-text-secondary">Total Assessments</div>
              </div>
            </div>
          </div>

          <div className="neo-card rounded-xl p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6" style={{ color: '#85E26E' }} />
              </div>
              <div>
                <div className="text-2xl font-bold neo-text-primary">
                  {profiles.length > 0 && profiles[0].score_data ? Math.round(parseFloat(profiles[0].score_data.hybridScore)) : '-'}
                </div>
                <div className="text-sm neo-text-secondary">Latest Score</div>
              </div>
            </div>
          </div>

          <div className="neo-card rounded-xl p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-purple-500 bg-opacity-20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" style={{ color: '#8D5CFF' }} />
              </div>
              <div>
                <div className="text-2xl font-bold neo-text-primary">
                  {profiles.filter(p => p.score_data).length}
                </div>
                <div className="text-sm neo-text-secondary">Scored Profiles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Profiles List */}
        <div className="space-y-6">
          {profiles.length === 0 ? (
            <div className="neo-card rounded-xl p-12 text-center">
              <Trophy className="h-16 w-16 neo-primary mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold neo-text-primary mb-2">No profiles yet</h3>
              <p className="neo-text-secondary mb-6">Take your first hybrid assessment to get started!</p>
              <Button 
                onClick={() => navigate('/')}
                className="neo-btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Take Assessment
              </Button>
            </div>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="neo-card rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <User className="h-6 w-6 neo-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold neo-text-primary">
                        {profile.profile_json.first_name || 'Unnamed Profile'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm neo-text-secondary">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(profile.created_at)}
                        </span>
                        {profile.score_data && (
                          <span className="flex items-center">
                            <Trophy className="h-4 w-4 mr-1" />
                            Score: {Math.round(parseFloat(profile.score_data.hybridScore))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {profile.score_data && (
                      <Button
                        onClick={() => navigate(`/hybrid-score/${profile.id}`)}
                        className="neo-btn-secondary"
                        size="sm"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => startEditing(profile)}
                      className="neo-btn-secondary"
                      size="sm"
                      disabled={editingProfile === profile.id}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deleteProfile(profile.id)}
                      className="neo-btn-secondary hover:bg-red-500 hover:bg-opacity-20"
                      size="sm"
                      disabled={editingProfile === profile.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {editingProfile === profile.id ? (
                  <div className="space-y-4 border-t border-gray-700 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium neo-text-secondary mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={editForm.first_name}
                          onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                          className="neo-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium neo-text-secondary mb-1">
                          Sex
                        </label>
                        <select
                          value={editForm.sex}
                          onChange={(e) => setEditForm({...editForm, sex: e.target.value})}
                          className="neo-input w-full"
                        >
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium neo-text-secondary mb-1">
                          Body Metrics
                        </label>
                        <input
                          type="text"
                          value={editForm.body_metrics}
                          onChange={(e) => setEditForm({...editForm, body_metrics: e.target.value})}
                          className="neo-input w-full"
                          placeholder="e.g., 163 lbs, VO2 max 54, resting HR 42"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium neo-text-secondary mb-1">
                          Mile PR
                        </label>
                        <input
                          type="text"
                          value={editForm.pb_mile}
                          onChange={(e) => setEditForm({...editForm, pb_mile: e.target.value})}
                          className="neo-input w-full"
                          placeholder="e.g., 7:43"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium neo-text-secondary mb-1">
                          Weekly Miles
                        </label>
                        <input
                          type="number"
                          value={editForm.weekly_miles}
                          onChange={(e) => setEditForm({...editForm, weekly_miles: parseInt(e.target.value) || ''})}
                          className="neo-input w-full"
                          placeholder="e.g., 15"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium neo-text-secondary mb-1">
                          Long Run
                        </label>
                        <input
                          type="number"
                          value={editForm.long_run}
                          onChange={(e) => setEditForm({...editForm, long_run: parseInt(e.target.value) || ''})}
                          className="neo-input w-full"
                          placeholder="e.g., 7"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium neo-text-secondary mb-1">
                          Bench Press 1RM
                        </label>
                        <input
                          type="text"
                          value={editForm.pb_bench_1rm}
                          onChange={(e) => setEditForm({...editForm, pb_bench_1rm: e.target.value})}
                          className="neo-input w-full"
                          placeholder="e.g., 225 lbs x 3 reps"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium neo-text-secondary mb-1">
                          Squat 1RM
                        </label>
                        <input
                          type="text"
                          value={editForm.pb_squat_1rm}
                          onChange={(e) => setEditForm({...editForm, pb_squat_1rm: e.target.value})}
                          className="neo-input w-full"
                          placeholder="e.g., 315 lbs"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium neo-text-secondary mb-1">
                          Deadlift 1RM
                        </label>
                        <input
                          type="text"
                          value={editForm.pb_deadlift_1rm}
                          onChange={(e) => setEditForm({...editForm, pb_deadlift_1rm: e.target.value})}
                          className="neo-input w-full"
                          placeholder="e.g., 405 lbs"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={() => saveProfile(profile.id)}
                        className="neo-btn-primary"
                        disabled={isCalculating}
                      >
                        {isCalculating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Recalculating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save & Recalculate
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={cancelEditing}
                        className="neo-btn-secondary"
                        disabled={isCalculating}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="neo-text-secondary">Sex:</span>
                      <span className="neo-text-primary ml-2">{profile.profile_json.sex || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="neo-text-secondary">Mile PR:</span>
                      <span className="neo-text-primary ml-2">{profile.profile_json.pb_mile || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="neo-text-secondary">Weekly Miles:</span>
                      <span className="neo-text-primary ml-2">{profile.profile_json.weekly_miles || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="neo-text-secondary">Long Run:</span>
                      <span className="neo-text-primary ml-2">{profile.profile_json.long_run || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="neo-text-secondary">Bench Press:</span>
                      <span className="neo-text-primary ml-2">{profile.profile_json.pb_bench_1rm || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="neo-text-secondary">Updated:</span>
                      <span className="neo-text-primary ml-2">{formatDate(profile.updated_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;