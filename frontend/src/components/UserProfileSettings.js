import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { 
  User, Camera, Save, Edit, MapPin, Globe, Calendar, 
  Phone, Mail, Settings, Upload, X 
} from 'lucide-react';
import axios from 'axios';

const UserProfileSettings = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
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

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    if (user && session) {
      fetchUserProfile();
    }
  }, [user, session]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${backendUrl}/api/user-profile/me`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const profile = response.data.profile;
      setUserProfile(profile);
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        units_preference: profile.units_preference || 'imperial',
        privacy_level: profile.privacy_level || 'private'
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.put(`${backendUrl}/api/user-profile/me`, profileForm, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      setUserProfile(response.data.profile);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
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
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', avatarFile);

      const response = await axios.post(`${backendUrl}/api/user-profile/me/avatar`, formData, {
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
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    // Reset form to original values
    if (userProfile) {
      setProfileForm({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        display_name: userProfile.display_name || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        website: userProfile.website || '',
        phone: userProfile.phone || '',
        gender: userProfile.gender || '',
        units_preference: userProfile.units_preference || 'imperial',
        privacy_level: userProfile.privacy_level || 'private'
      });
    }
  };

  if (isLoading && !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold neo-text-primary flex items-center">
          <Settings className="mr-3" />
          Profile Settings
        </h1>
        <p className="text-sm neo-text-secondary mt-2">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <Card className="neo-card-secondary p-6">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-500" />
                )}
              </div>
              
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            <h2 className="mt-4 text-xl font-semibold neo-text-primary">
              {userProfile?.display_name || userProfile?.first_name || 'User'}
            </h2>
            <p className="text-sm neo-text-secondary">
              {userProfile?.email}
            </p>
            
            {avatarFile && (
              <div className="mt-4 space-y-2">
                <Button onClick={handleAvatarUpload} disabled={isLoading} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Avatar
                </Button>
                <Button variant="outline" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Profile Information */}
        <Card className="lg:col-span-2 neo-card-secondary p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold neo-text-primary">Personal Information</h3>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="space-x-2">
                <Button onClick={handleUpdateProfile} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={handleCancelEdit} variant="outline">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium neo-text-secondary mb-1">
                First Name
              </label>
              <Input
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                disabled={!isEditing}
                className="neo-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium neo-text-secondary mb-1">
                Last Name
              </label>
              <Input
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                disabled={!isEditing}
                className="neo-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium neo-text-secondary mb-1">
                Display Name
              </label>
              <Input
                value={profileForm.display_name}
                onChange={(e) => setProfileForm({...profileForm, display_name: e.target.value})}
                disabled={!isEditing}
                className="neo-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium neo-text-secondary mb-1">
                Bio
              </label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                disabled={!isEditing}
                rows={3}
                className="w-full px-3 py-2 border rounded-md neo-input"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium neo-text-secondary mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <Input
                value={profileForm.location}
                onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                disabled={!isEditing}
                className="neo-input"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium neo-text-secondary mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                Website
              </label>
              <Input
                value={profileForm.website}
                onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                disabled={!isEditing}
                className="neo-input"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium neo-text-secondary mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                disabled={!isEditing}
                className="neo-input"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium neo-text-secondary mb-1">
                Gender
              </label>
              <select
                value={profileForm.gender}
                onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-md neo-input"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium neo-text-secondary mb-1">
                Units Preference
              </label>
              <select
                value={profileForm.units_preference}
                onChange={(e) => setProfileForm({...profileForm, units_preference: e.target.value})}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-md neo-input"
              >
                <option value="imperial">Imperial (lbs, miles, ft)</option>
                <option value="metric">Metric (kg, km, m)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium neo-text-secondary mb-1">
                Privacy Level
              </label>
              <select
                value={profileForm.privacy_level}
                onChange={(e) => setProfileForm({...profileForm, privacy_level: e.target.value})}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-md neo-input"
              >
                <option value="private">Private</option>
                <option value="friends">Friends Only</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserProfileSettings;