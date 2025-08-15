import React, { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

const EditPRsModal = ({ prsData, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    strength: {
      squat_lb: prsData?.strength?.squat_lb || '',
      bench_lb: prsData?.strength?.bench_lb || '',
      deadlift_lb: prsData?.strength?.deadlift_lb || '',
      bodyweight_lb: prsData?.strength?.bodyweight_lb || ''
    },
    running: {
      mile_s: prsData?.running?.mile_s || '',
      '5k_s': prsData?.running?.['5k_s'] || '',
      '10k_s': prsData?.running?.['10k_s'] || '',
      half_s: prsData?.running?.half_s || '',
      marathon_s: prsData?.running?.marathon_s || ''
    },
    meta: {
      vo2max: prsData?.meta?.vo2max || ''
    }
  });
  
  const [units, setUnits] = useState('imperial'); // lb↔kg, mi↔km
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Unit conversion helpers
  const lbToKg = (lb) => lb ? (lb * 0.453592).toFixed(1) : '';
  const kgToLb = (kg) => kg ? (kg / 0.453592).toFixed(1) : '';
  
  const secondsToTime = (seconds) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };
  
  const timeToSeconds = (timeStr) => {
    if (!timeStr) return '';
    
    try {
      const parts = timeStr.split(':');
      if (parts.length === 2) {
        // MM:SS format
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 3) {
        // HH:MM:SS format
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
      return parseInt(timeStr); // Raw seconds
    } catch (e) {
      return '';
    }
  };

  const handleStrengthChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      strength: {
        ...prev.strength,
        [field]: value
      }
    }));
  };

  const handleRunningChange = (field, value) => {
    // Convert time format to seconds on blur
    const seconds = timeToSeconds(value);
    
    setFormData(prev => ({
      ...prev,
      running: {
        ...prev.running,
        [field]: seconds || value // Keep original if conversion fails
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const token = localStorage.getItem('access_token');
      
      // Prepare data for API
      const apiData = {
        strength: {
          squat_lb: parseFloat(formData.strength.squat_lb) || null,
          bench_lb: parseFloat(formData.strength.bench_lb) || null,
          deadlift_lb: parseFloat(formData.strength.deadlift_lb) || null,
          bodyweight_lb: parseFloat(formData.strength.bodyweight_lb) || null
        },
        running: {
          mile_s: formData.running.mile_s ? parseInt(formData.running.mile_s) : null,
          '5k_s': formData.running['5k_s'] ? parseInt(formData.running['5k_s']) : null,
          '10k_s': formData.running['10k_s'] ? parseInt(formData.running['10k_s']) : null,
          half_s: formData.running.half_s ? parseInt(formData.running.half_s) : null,
          marathon_s: formData.running.marathon_s ? parseInt(formData.running.marathon_s) : null
        },
        meta: {
          vo2max: parseFloat(formData.meta.vo2max) || null
        }
      };

      const response = await axios.post(`${backendUrl}/api/me/prs`, apiData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      onSave(response.data);
      toast({
        title: "Profile updated",
        description: "Your personal records have been saved successfully."
      });
      
    } catch (error) {
      console.error('Error saving PRs:', error);
      toast({
        title: "Save failed", 
        description: "There was an error saving your personal records.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0A0B0C] border-white/20">
      <DialogHeader className="border-b border-white/20 pb-4">
        <DialogTitle className="text-white text-xl">Edit Personal Records</DialogTitle>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-white/70">Units:</Label>
            <Switch
              checked={units === 'metric'}
              onCheckedChange={(checked) => setUnits(checked ? 'metric' : 'imperial')}
            />
            <span className="text-sm text-white/70">
              {units === 'metric' ? 'kg / km' : 'lb / mi'}
            </span>
          </div>
        </div>
      </DialogHeader>

      <Tabs defaultValue="lifting" className="mt-4">
        <TabsList className="grid w-full grid-cols-2 bg-[#0E0E11]">
          <TabsTrigger value="lifting" className="text-white data-[state=active]:bg-[#FFA42D] data-[state=active]:text-black">
            Lifting
          </TabsTrigger>
          <TabsTrigger value="running" className="text-white data-[state=active]:bg-[#00FF88] data-[state=active]:text-black">
            Running
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lifting" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-white">
                Squat 1RM ({units === 'metric' ? 'kg' : 'lb'})
              </Label>
              <Input
                type="number"
                placeholder="315"
                value={units === 'metric' ? lbToKg(formData.strength.squat_lb) : formData.strength.squat_lb}
                onChange={(e) => {
                  const value = units === 'metric' ? kgToLb(e.target.value) : e.target.value;
                  handleStrengthChange('squat_lb', value);
                }}
                className="bg-[#0E0E11] border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">
                Bench 1RM ({units === 'metric' ? 'kg' : 'lb'})
              </Label>
              <Input
                type="number"
                placeholder="225"
                value={units === 'metric' ? lbToKg(formData.strength.bench_lb) : formData.strength.bench_lb}
                onChange={(e) => {
                  const value = units === 'metric' ? kgToLb(e.target.value) : e.target.value;
                  handleStrengthChange('bench_lb', value);
                }}
                className="bg-[#0E0E11] border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">
                Deadlift 1RM ({units === 'metric' ? 'kg' : 'lb'})
              </Label>
              <Input
                type="number"
                placeholder="405"
                value={units === 'metric' ? lbToKg(formData.strength.deadlift_lb) : formData.strength.deadlift_lb}
                onChange={(e) => {
                  const value = units === 'metric' ? kgToLb(e.target.value) : e.target.value;
                  handleStrengthChange('deadlift_lb', value);
                }}
                className="bg-[#0E0E11] border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">
                Bodyweight ({units === 'metric' ? 'kg' : 'lb'})
              </Label>
              <Input
                type="number"
                placeholder="180"
                value={units === 'metric' ? lbToKg(formData.strength.bodyweight_lb) : formData.strength.bodyweight_lb}
                onChange={(e) => {
                  const value = units === 'metric' ? kgToLb(e.target.value) : e.target.value;
                  handleStrengthChange('bodyweight_lb', value);
                }}
                className="bg-[#0E0E11] border-white/20 text-white"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="running" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-white">Mile Time (MM:SS)</Label>
              <Input
                type="text"
                placeholder="6:30"
                value={secondsToTime(formData.running.mile_s)}
                onChange={(e) => handleRunningChange('mile_s', e.target.value)}
                onBlur={(e) => handleRunningChange('mile_s', e.target.value)}
                className="bg-[#0E0E11] border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">5K Time (MM:SS)</Label>
              <Input
                type="text"
                placeholder="20:30"
                value={secondsToTime(formData.running['5k_s'])}
                onChange={(e) => handleRunningChange('5k_s', e.target.value)}
                onBlur={(e) => handleRunningChange('5k_s', e.target.value)}
                className="bg-[#0E0E11] border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">10K Time (MM:SS)</Label>
              <Input
                type="text"
                placeholder="42:15"
                value={secondsToTime(formData.running['10k_s'])}
                onChange={(e) => handleRunningChange('10k_s', e.target.value)}
                onBlur={(e) => handleRunningChange('10k_s', e.target.value)}
                className="bg-[#0E0E11] border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Half Marathon (H:MM:SS)</Label>
              <Input
                type="text"
                placeholder="1:35:00"
                value={secondsToTime(formData.running.half_s)}
                onChange={(e) => handleRunningChange('half_s', e.target.value)}
                onBlur={(e) => handleRunningChange('half_s', e.target.value)}
                className="bg-[#0E0E11] border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Marathon (H:MM:SS)</Label>
              <Input
                type="text"
                placeholder="3:15:00"
                value={secondsToTime(formData.running.marathon_s)}
                onChange={(e) => handleRunningChange('marathon_s', e.target.value)}
                onBlur={(e) => handleRunningChange('marathon_s', e.target.value)}
                className="bg-[#0E0E11] border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">VO2 Max</Label>
              <Input
                type="number"
                placeholder="55"
                value={formData.meta.vo2max}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  meta: { ...prev.meta, vo2max: e.target.value }
                }))}
                className="bg-[#0E0E11] border-white/20 text-white"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/20">
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-white hover:bg-white/10"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#08F0FF] hover:bg-[#08F0FF]/80 text-black font-medium"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </DialogContent>
  );
};

export default EditPRsModal;