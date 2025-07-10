import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Loader2, Trophy, Target, Calendar, Apple, Zap, Heart, Activity, 
  CheckCircle, Clock, MapPin, Utensils, Dumbbell, Timer, 
  TrendingUp, Star, Award, BarChart3, Scale, Brain, ExternalLink,
  Flame, Droplets, Moon, Coffee, AlertCircle, ChevronRight, Shield,
  CheckCircle2, Bed, Smartphone, Info, Pill, Plus, Share2, Download
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AthleteProfile = () => {
  const [athleteProfile, setAthleteProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [scoreData, setScoreData] = useState(null);
  const [error, setError] = useState(null);
  const [animatedScores, setAnimatedScores] = useState({});
  const [progressInterval, setProgressInterval] = useState(null);
  const canvasRef = useRef(null);

  const callWebhook = async (athleteProfileData, deliverable) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000);

    try {
      const response = await fetch('https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          athleteProfile: athleteProfileData,
          deliverable: deliverable
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout for ${deliverable} (4 minutes)`);
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!athleteProfile.trim()) return;

    setLoading(true);
    setError(null);
    setScoreData(null);
    setLoadingProgress(0);
    
    // Clear any existing interval
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    // Start progress animation for 55 seconds
    let progress = 0;
    const interval = setInterval(() => {
      progress += (100 / 55); // 55 seconds for score
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setLoadingProgress(Math.min(progress, 100));
    }, 1000);
    setProgressInterval(interval);

    try {
      let athleteProfileData;
      try {
        athleteProfileData = JSON.parse(athleteProfile);
      } catch {
        athleteProfileData = athleteProfile;
      }

      // Only call score webhook
      const data = await callWebhook(athleteProfileData, 'score');
      
      // Clear interval and set progress to 100%
      if (interval) {
        clearInterval(interval);
      }
      setLoadingProgress(100);
      setScoreData(data);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      if (interval) {
        clearInterval(interval);
      }
    } finally {
      setLoading(false);
    }
  };

  // Animate score counters
  useEffect(() => {
    const data = scoreData?.[0] || scoreData;
    if (data) {
      const scores = {
        hybrid: parseFloat(data.hybridScore),
        strength: parseFloat(data.strengthScore),
        speed: parseFloat(data.speedScore),
        vo2: parseFloat(data.vo2Score),
        distance: parseFloat(data.distanceScore),
        volume: parseFloat(data.volumeScore),
        endurance: parseFloat(data.enduranceScore),
        recovery: parseFloat(data.recoveryScore),
        balance: parseFloat(data.balanceBonus || 0)
      };

      Object.entries(scores).forEach(([key, targetValue]) => {
        let currentValue = 0;
        const increment = targetValue / 50;
        const timer = setInterval(() => {
          currentValue += increment;
          if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
          }
          setAnimatedScores(prev => ({ ...prev, [key]: currentValue }));
        }, 20);
      });
    }
  }, [scoreData]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);

  const generateShareImage = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 1200;
    canvas.height = 600;
    
    // Create gradient background matching Neo design
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0A0B0C');
    gradient.addColorStop(0.5, '#111314');
    gradient.addColorStop(1, '#0A0B0C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle texture
    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = `rgba(133, 226, 110, ${Math.random() * 0.02})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
    
    // Title
    ctx.fillStyle = '#D9D9D9';
    ctx.font = 'bold 48px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('My Hybrid Athlete Score', canvas.width / 2, 80);
    
    // Main score with Neo green
    const hybridScore = Math.round(parseFloat(data.hybridScore));
    ctx.fillStyle = '#85E26E';
    ctx.font = 'bold 120px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(hybridScore.toString(), canvas.width / 2, 220);
    
    // Subtitle
    ctx.fillStyle = '#9FA1A3';
    ctx.font = '24px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('Overall hybrid-fitness score', canvas.width / 2, 260);
    
    // Component scores
    const scores = [
      { label: 'Strength', value: Math.round(parseFloat(data.strengthScore)), color: '#79CFF7' },
      { label: 'Endurance', value: Math.round(parseFloat(data.enduranceScore)), color: '#85E26E' },
      { label: 'Body Comp', value: Math.round(parseFloat(data.bodyCompScore)), color: '#8D5CFF' },
      { label: 'Recovery', value: Math.round(parseFloat(data.recoveryScore)), color: '#79CFF7' }
    ];
    
    const startX = 150;
    const scoreWidth = (canvas.width - 300) / 4;
    
    scores.forEach((score, index) => {
      const x = startX + (index * scoreWidth) + (scoreWidth / 2);
      const y = 380;
      
      // Score circle background
      ctx.beginPath();
      ctx.arc(x, y, 60, 0, 2 * Math.PI);
      ctx.fillStyle = '#111314';
      ctx.fill();
      
      // Score value
      ctx.fillStyle = score.color;
      ctx.font = 'bold 36px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(score.value.toString(), x, y + 12);
      
      // Score label
      ctx.fillStyle = '#9FA1A3';
      ctx.font = '18px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(score.label, x, y + 90);
    });
    
    // Branding
    ctx.fillStyle = '#6B6E71';
    ctx.font = '20px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Get your score at HybridHouse.ai', canvas.width / 2, canvas.height - 30);
    
    return canvas.toDataURL('image/png', 0.9);
  };

  const handleShare = async () => {
    try {
      const imageDataUrl = await generateShareImage();
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      const shareText = `🏆 My Hybrid Athlete Score: ${Math.round(parseFloat(data.hybridScore))}/100\n\nStrength: ${Math.round(parseFloat(data.strengthScore))} | Endurance: ${Math.round(parseFloat(data.enduranceScore))} | Body Comp: ${Math.round(parseFloat(data.bodyCompScore))} | Recovery: ${Math.round(parseFloat(data.recoveryScore))}\n\nGet your score at HybridHouse.ai`;
      
      // Check if native sharing is available
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'hybrid-score.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: 'My Hybrid Athlete Score',
          text: shareText,
          files: [new File([blob], 'hybrid-score.png', { type: 'image/png' })]
        });
      } else {
        // Fallback: Show share options
        showShareOptions(imageDataUrl, shareText);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to simple text share
      const shareText = `🏆 My Hybrid Athlete Score: ${Math.round(parseFloat(data.hybridScore))}/100 - Get yours at HybridHouse.ai`;
      if (navigator.share) {
        navigator.share({
          title: 'My Hybrid Athlete Score',
          text: shareText
        });
      }
    }
  };

  const showShareOptions = (imageDataUrl, shareText) => {
    // Create a temporary modal with share options using Neo design
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: #111314;
      padding: 32px;
      border-radius: 16px;
      max-width: 480px;
      width: 90%;
      text-align: center;
      border: 1px solid #1A1C1D;
      box-shadow: 0 2px 6px rgba(0,0,0,0.8);
    `;
    
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent('https://HybridHouse.ai');
    
    // Function to copy image to clipboard
    const copyImageToClipboard = async () => {
      try {
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        alert('Image copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy image: ', err);
        alert('Failed to copy image to clipboard');
      }
    };
    
    content.innerHTML = `
      <h3 style="color: #D9D9D9; margin-bottom: 24px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 24px; font-weight: 600;">Share Your Hybrid Score</h3>
      <div style="margin-bottom: 24px;">
        <img src="${imageDataUrl}" style="max-width: 100%; height: auto; border-radius: 12px; border: 1px solid #1A1C1D;" alt="Hybrid Score" />
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 12px; margin-bottom: 24px;">
        <a href="https://twitter.com/intent/tweet?text=${encodedText}" target="_blank" style="background: #79CFF7; color: #0A0B0C; padding: 12px 8px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 12px; font-family: Inter, sans-serif; transition: all 200ms ease-out;">Twitter</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}" target="_blank" style="background: #8D5CFF; color: #D9D9D9; padding: 12px 8px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 12px; font-family: Inter, sans-serif; transition: all 200ms ease-out;">Facebook</a>
        <a href="instagram://library?AssetPath=${encodeURIComponent(imageDataUrl)}" style="background: #85E26E; color: #0A0B0C; padding: 12px 8px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 12px; font-family: Inter, sans-serif; transition: all 200ms ease-out;">Instagram</a>
        <button id="copyImageBtn" style="background: #1A1C1D; color: #9FA1A3; padding: 12px 8px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; font-size: 12px; font-family: Inter, sans-serif; transition: all 200ms ease-out;">Copy Image</button>
        <button onclick="navigator.clipboard.writeText('${shareText.replace(/'/g, "\\'")}'); alert('Text copied to clipboard!')" style="background: #1A1C1D; color: #9FA1A3; padding: 12px 8px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; font-size: 12px; font-family: Inter, sans-serif; transition: all 200ms ease-out;">Copy Text</button>
        <a href="${imageDataUrl}" download="hybrid-score.png" style="background: #85E26E; color: #0A0B0C; padding: 12px 8px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 12px; font-family: Inter, sans-serif; transition: all 200ms ease-out;">Download</a>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="background: transparent; color: #6B6E71; padding: 8px 16px; border-radius: 8px; border: 2px solid #6B6E71; cursor: pointer; font-family: Inter, sans-serif; transition: all 200ms ease-out;">Close</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Add event listener for copy image button
    const copyImageBtn = content.querySelector('#copyImageBtn');
    copyImageBtn.addEventListener('click', copyImageToClipboard);
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  };

  const data = scoreData?.[0] || scoreData;
  const showCheckmark = !loading && loadingProgress === 100;

  return (
    <div className="min-h-screen" style={{ 
      background: '#0A0B0C',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#D9D9D9'
    }}>
      <style jsx>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .neo-card {
          background: #111314;
          border: 1px solid #1A1C1D;
          box-shadow: 0 1px 3px rgba(0,0,0,0.6);
        }
        .neo-surface-2 {
          background: #1A1C1D;
        }
        .neo-text-primary {
          color: #D9D9D9;
        }
        .neo-text-secondary {
          color: #9FA1A3;
        }
        .neo-text-muted {
          color: #6B6E71;
        }
        .neo-primary {
          color: #85E26E;
        }
        .neo-cyan {
          color: #79CFF7;
        }
        .neo-violet {
          color: #8D5CFF;
        }
        .neo-btn-primary {
          background: #85E26E;
          color: #0A0B0C;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-weight: 600;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 0 8px rgba(133, 226, 110, 0.35);
        }
        .neo-btn-primary:hover {
          background: #69B258;
          transform: translateY(-1px);
        }
        .neo-btn-secondary {
          background: transparent;
          color: #85E26E;
          border: 2px solid #85E26E;
          border-radius: 8px;
          padding: 10px 18px;
          font-weight: 600;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
        }
        .neo-btn-secondary:hover {
          background: rgba(133, 226, 110, 0.1);
        }
        .neo-input {
          background: #1A1C1D;
          border: 1px solid #1A1C1D;
          border-radius: 8px;
          color: #D9D9D9;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
        }
        .neo-input:focus {
          outline: none;
          border-color: #85E26E;
          box-shadow: 0 0 0 2px rgba(133, 226, 110, 0.35);
        }
        .neo-chip {
          background: #85E26E;
          color: #0A0B0C;
          border-radius: 12px;
          padding: 0 8px;
          height: 22px;
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          font-weight: 600;
        }
        .neo-progress-bar {
          background: #1A1C1D;
          border-radius: 10px;
          overflow: hidden;
        }
        .neo-progress-fill {
          background: #79CFF7;
          height: 100%;
          transition: width 400ms ease-in-out;
        }
      `}</style>

      {/* Header with action buttons when results are shown */}
      {data && (
        <div className="fixed top-0 left-0 right-0 z-50 neo-surface-2" style={{ borderBottom: '1px solid #1A1C1D' }}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold neo-primary">
                Hybrid House
              </h1>
              <div className="flex space-x-3">
                <button
                  className="neo-btn-secondary text-sm px-4 py-2"
                  onClick={() => {/* TODO: Navigate to training plan creation */}}
                >
                  Training Plan
                </button>
                <button
                  className="neo-btn-secondary text-sm px-4 py-2"
                  onClick={() => {/* TODO: Navigate to nutrition plan creation */}}
                >
                  Nutrition Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hidden canvas for image generation */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Header - Only show when no results */}
          {!data && (
            <div className="text-center mb-12 px-4">
              <h1 className="text-6xl font-bold mb-6 neo-primary" style={{ lineHeight: '1.1' }}>
                Hybrid House
              </h1>
              <p className="text-xl neo-text-secondary mb-8 max-w-2xl mx-auto">
                Get your hybrid athlete score and unlock your athletic potential
              </p>
              
              {/* Create Profile Button */}
              <div className="mb-8">
                <a
                  href="https://chatgpt.com/g/g-686e85594828819185c3264c65086ae2-hybrid-house-interviewer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn-primary inline-block text-base"
                >
                  Create Profile
                </a>
              </div>

              {/* Input Form */}
              <div className="neo-card rounded-xl max-w-4xl mx-auto p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold neo-text-primary mb-2 flex items-center justify-center gap-3">
                    <Target className="h-6 w-6 neo-primary" />
                    Paste your athlete profile
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <textarea
                    placeholder="Paste your athlete profile here..."
                    value={athleteProfile}
                    onChange={(e) => setAthleteProfile(e.target.value)}
                    className="neo-input w-full min-h-[140px] p-4 resize-none"
                    style={{ fontSize: '16px', lineHeight: '1.5' }}
                    disabled={loading}
                  />
                  <button 
                    type="submit" 
                    className="neo-btn-primary w-full text-lg py-4"
                    disabled={loading || !athleteProfile.trim()}
                  >
                    {loading ? (
                      <>
                        Analyzing Profile...
                      </>
                    ) : (
                      <>
                        Get My Hybrid Score
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Loading Status */}
          {loading && (
            <div className={`space-y-8 px-4 ${data ? 'pt-20' : ''}`}>
              <div className="text-center">
                <h2 className="text-3xl font-bold neo-text-primary mb-2">Calculating Your Hybrid Score</h2>
                <p className="neo-text-secondary">Analyzing your athletic profile...</p>
              </div>
              <div className="max-w-2xl mx-auto">
                <div className="neo-card rounded-xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full" style={{
                      background: showCheckmark ? 'rgba(133, 226, 110, 0.2)' : 'rgba(121, 207, 247, 0.2)'
                    }}>
                      {showCheckmark ? (
                        <CheckCircle className="h-6 w-6 neo-primary animate-pulse" />
                      ) : (
                        <Loader2 className="h-6 w-6 neo-cyan animate-spin" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${showCheckmark ? 'neo-primary' : 'neo-cyan'} transition-colors duration-300`}>
                        Performance Analysis
                      </h3>
                      <div className="neo-progress-bar w-full h-3 mt-2">
                        <div 
                          className="neo-progress-fill"
                          style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                        />
                      </div>
                      {!showCheckmark && (
                        <div className="text-xs neo-text-muted mt-1">
                          {Math.round(loadingProgress)}% complete
                        </div>
                      )}
                      {showCheckmark && (
                        <div className="text-xs neo-primary mt-1 animate-fade-in">
                          ✓ Complete
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="neo-card rounded-xl mb-8 p-6" style={{ borderColor: '#FF4B4B' }}>
              <p className="flex items-center space-x-2" style={{ color: '#FF4B4B' }}>
                <AlertCircle className="h-5 w-5" />
                <span>Error: {error}</span>
              </p>
            </div>
          )}

          {/* Hybrid Score Results */}
          {data && (
            <div className={`space-y-8 px-4 ${loading ? '' : 'pt-20'}`}>
              
              {/* Hybrid Score Section */}
              <section className="space-y-8">
                <div className="text-center">
                  <h2 className="text-5xl font-bold neo-text-primary mb-4">Your Hybrid Score</h2>
                  <div className="text-8xl font-bold neo-primary mb-6" style={{ lineHeight: '1' }}>
                    {animatedScores.hybrid ? Math.round(animatedScores.hybrid) : Math.round(parseFloat(data.hybridScore))}
                  </div>
                  <p className="text-xl neo-text-secondary max-w-2xl mx-auto mb-6">
                    Your overall hybrid-fitness score on a 0-100 scale
                  </p>
                  
                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className="neo-btn-primary px-6 py-3"
                  >
                    Share My Score
                  </button>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {[
                    { key: 'strength', label: 'Strength', value: data.strengthScore, comment: data.strengthComment, color: '#79CFF7', icon: Dumbbell },
                    { key: 'speed', label: 'Speed', value: data.speedScore, comment: data.speedComment, color: '#85E26E', icon: Zap },
                    { key: 'vo2', label: 'VO₂ Max', value: data.vo2Score, comment: data.vo2Comment, color: '#8D5CFF', icon: Heart },
                    { key: 'distance', label: 'Distance', value: data.distanceScore, comment: data.distanceComment, color: '#79CFF7', icon: MapPin },
                    { key: 'volume', label: 'Volume', value: data.volumeScore, comment: data.volumeComment, color: '#85E26E', icon: BarChart3 },
                    { key: 'endurance', label: 'Endurance', value: data.enduranceScore, comment: data.enduranceComment, color: '#8D5CFF', icon: Activity },
                    { key: 'recovery', label: 'Recovery', value: data.recoveryScore, comment: data.recoveryComment, color: '#79CFF7', icon: Moon }
                  ].map((score) => {
                    const IconComponent = score.icon;
                    return (
                      <div key={score.key} className="neo-card rounded-xl p-6 hover:scale-105 transition-transform duration-200">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ 
                            background: `${score.color}20`,
                            border: `2px solid ${score.color}` 
                          }}>
                            <IconComponent className="h-6 w-6" style={{ color: score.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="neo-text-primary font-semibold">{score.label}</h3>
                              <div className="text-2xl font-bold neo-text-primary">
                                {animatedScores[score.key] ? Math.round(animatedScores[score.key]) : Math.round(parseFloat(score.value))}
                              </div>
                            </div>
                            <p className="neo-text-secondary text-sm leading-relaxed">
                              {score.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Balance & Penalty Information */}
                {(data.balanceBonus > 0 || data.hybridPenalty > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {data.balanceBonus > 0 && (
                      <div className="rounded-xl p-6" style={{ 
                        background: 'linear-gradient(135deg, rgba(133, 226, 110, 0.1), rgba(121, 207, 247, 0.1))',
                        border: '1px solid rgba(133, 226, 110, 0.3)'
                      }}>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ 
                            background: 'rgba(133, 226, 110, 0.2)',
                            border: '2px solid #85E26E' 
                          }}>
                            <Trophy className="h-5 w-5 neo-primary" />
                          </div>
                          <h4 className="text-lg font-semibold neo-primary">Balance Bonus: +{Math.round(data.balanceBonus)}</h4>
                        </div>
                        <p className="neo-text-secondary">{data.balanceComment}</p>
                      </div>
                    )}
                    
                    {data.hybridPenalty > 0 && (
                      <div className="rounded-xl p-6" style={{ 
                        background: 'linear-gradient(135deg, rgba(255, 75, 75, 0.1), rgba(255, 75, 75, 0.05))',
                        border: '1px solid rgba(255, 75, 75, 0.3)'
                      }}>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ 
                            background: 'rgba(255, 75, 75, 0.2)',
                            border: '2px solid #FF4B4B' 
                          }}>
                            <AlertCircle className="h-5 w-5" style={{ color: '#FF4B4B' }} />
                          </div>
                          <h4 className="text-lg font-semibold" style={{ color: '#FF4B4B' }}>Penalty: -{Math.round(data.hybridPenalty)}</h4>
                        </div>
                        <p className="neo-text-secondary">{data.penaltyComment}</p>
                      </div>
                    )}
                    
                    {data.balanceBonus === 0 && data.balanceComment && (
                      <div className="rounded-xl p-6" style={{ 
                        background: 'linear-gradient(135deg, rgba(107, 110, 113, 0.1), rgba(107, 110, 113, 0.05))',
                        border: '1px solid rgba(107, 110, 113, 0.3)'
                      }}>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ 
                            background: 'rgba(107, 110, 113, 0.2)',
                            border: '2px solid #6B6E71' 
                          }}>
                            <Scale className="h-5 w-5 neo-text-muted" />
                          </div>
                          <h4 className="text-lg font-semibold neo-text-muted">Balance Status</h4>
                        </div>
                        <p className="neo-text-secondary">{data.balanceComment}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Hybrid Score Commentary */}
                <div className="neo-card rounded-xl p-6 mb-8">
                  <h3 className="text-xl font-semibold neo-text-primary mb-4 flex items-center space-x-2">
                    <Trophy className="h-6 w-6 neo-primary" />
                    <span>Your Hybrid Profile</span>
                  </h3>
                  <p className="neo-text-secondary text-lg leading-relaxed">
                    {data.hybridComment}
                  </p>
                </div>

                {/* Actionable Tips */}
                {data.tips && data.tips.length > 0 && (
                  <div className="neo-card rounded-xl p-6 mb-8">
                    <h3 className="text-xl font-semibold neo-text-primary mb-6 flex items-center space-x-2">
                      <Target className="h-6 w-6 neo-primary" />
                      <span>Action Plan</span>
                    </h3>
                    <div className="space-y-4">
                      {data.tips.map((tip, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ 
                            background: 'rgba(133, 226, 110, 0.2)',
                            border: '1px solid #85E26E' 
                          }}>
                            <span className="text-xs font-bold neo-primary">{index + 1}</span>
                          </div>
                          <p className="neo-text-secondary leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score Explanation */}
                <div className="neo-card rounded-xl p-8">
                  <h3 className="text-2xl font-semibold neo-text-primary mb-6">What's the Hybrid Athlete Score?</h3>
                  
                  <p className="neo-text-secondary text-lg mb-8">
                    Think of it as your <strong className="neo-primary">overall "hybrid-fitness GPA"</strong> on a 0 – 100 scale:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-6">
                      <div className="neo-surface-2 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Dumbbell className="h-5 w-5 neo-cyan" />
                          <h4 className="neo-text-primary font-semibold">Strength</h4>
                        </div>
                        <p className="neo-text-secondary text-sm mb-2">How much weight you can lift relative to your body-weight (bench, squat, deadlift).</p>
                        <p className="neo-cyan text-sm">Power for sprints, hills, injury-proofing.</p>
                      </div>
                      
                      <div className="neo-surface-2 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Heart className="h-5 w-5 neo-primary" />
                          <h4 className="neo-text-primary font-semibold">Endurance</h4>
                        </div>
                        <p className="neo-text-secondary text-sm mb-2">Your engine—VO₂ max plus best mile time.</p>
                        <p className="neo-primary text-sm">Determines how long and how hard you can keep moving.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="neo-surface-2 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Scale className="h-5 w-5 neo-violet" />
                          <h4 className="neo-text-primary font-semibold">Body-comp</h4>
                        </div>
                        <p className="neo-text-secondary text-sm mb-2">How close you are to a healthy, performance-lean body-fat range.</p>
                        <p className="neo-violet text-sm">Better power-to-weight and joint health.</p>
                      </div>
                      
                      <div className="neo-surface-2 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Moon className="h-5 w-5 neo-cyan" />
                          <h4 className="neo-text-primary font-semibold">Recovery</h4>
                        </div>
                        <p className="neo-text-secondary text-sm mb-2">HRV and resting heart-rate—how well your body bounces back.</p>
                        <p className="neo-cyan text-sm">Faster gains, fewer burn-outs.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg p-6" style={{ 
                    background: 'linear-gradient(135deg, rgba(133, 226, 110, 0.1), rgba(121, 207, 247, 0.1))',
                    border: '1px solid rgba(133, 226, 110, 0.2)'
                  }}>
                    <h4 className="neo-text-primary font-semibold mb-4">The Balance Bonus</h4>
                    <p className="neo-text-secondary mb-6">
                      We average those slices, then add a <strong className="neo-primary">"balance bonus."</strong> If your strength and endurance levels are close together, you score extra points—because true hybrid athletes aren't one-sided.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold neo-primary">100 points</div>
                        <p className="neo-text-secondary">Elite strength, elite cardio, dialed-in body-comp, and stellar recovery with good balance.</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold neo-cyan">50 points</div>
                        <p className="neo-text-secondary">Recreational lifter or runner with room to grow in other areas.</p>
                      </div>
                    </div>
                    <p className="neo-primary mt-6 text-center">
                      Your score helps you see <strong>which dial to turn next</strong>—lift heavier, run faster, lean out, or sleep/recover better—to level up as a complete hybrid athlete.
                    </p>
                  </div>

                  {/* Detailed Metrics */}
                  <div className="neo-card rounded-xl mt-8 p-6">
                    <h4 className="text-xl font-semibold neo-text-primary mb-6 flex items-center space-x-2">
                      <Activity className="h-6 w-6 neo-primary" />
                      <span>Your Metrics</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[
                        { 
                          label: 'Body Weight', 
                          value: data.inputsUsed?.bodyWeightLb || 'N/A', 
                          unit: 'lbs', 
                          color: '#79CFF7' 
                        },
                        { 
                          label: 'VO2 Max', 
                          value: data.inputsUsed?.vo2Max || 'N/A', 
                          unit: 'ml/kg/min', 
                          color: '#85E26E' 
                        },
                        { 
                          label: 'Mile Time', 
                          value: data.inputsUsed?.mileSeconds ? `${Math.floor(data.inputsUsed.mileSeconds / 60)}:${String(Math.round(data.inputsUsed.mileSeconds % 60)).padStart(2, '0')}` : 'N/A', 
                          unit: '', 
                          color: '#8D5CFF' 
                        },
                        { 
                          label: 'Long Run', 
                          value: data.inputsUsed?.longRunMiles || 'N/A', 
                          unit: data.inputsUsed?.longRunMiles ? 'mi' : '', 
                          color: '#79CFF7' 
                        },
                        { 
                          label: 'Weekly Miles', 
                          value: data.inputsUsed?.weeklyMiles || 'N/A', 
                          unit: data.inputsUsed?.weeklyMiles ? 'mi/wk' : '', 
                          color: '#85E26E' 
                        },
                        { 
                          label: 'HRV', 
                          value: data.inputsUsed?.hrvMs || 'N/A', 
                          unit: data.inputsUsed?.hrvMs ? 'ms' : '', 
                          color: '#8D5CFF' 
                        },
                        { 
                          label: 'Resting HR', 
                          value: data.inputsUsed?.restingHrBpm || 'N/A', 
                          unit: data.inputsUsed?.restingHrBpm ? 'bpm' : '', 
                          color: '#79CFF7' 
                        },
                        { 
                          label: 'Bench 1RM', 
                          value: data.inputsUsed?.bench1RmLb || 'N/A', 
                          unit: data.inputsUsed?.bench1RmLb ? 'lbs' : '', 
                          color: '#85E26E' 
                        },
                        { 
                          label: 'Squat 1RM', 
                          value: data.inputsUsed?.squat1RmLb || 'N/A', 
                          unit: data.inputsUsed?.squat1RmLb ? 'lbs' : '', 
                          color: '#8D5CFF' 
                        },
                        { 
                          label: 'Dead 1RM', 
                          value: data.inputsUsed?.dead1RmLb || 'N/A', 
                          unit: data.inputsUsed?.dead1RmLb ? 'lbs' : '', 
                          color: '#79CFF7' 
                        }
                      ].map((metric, index) => (
                        <div key={index} className="neo-surface-2 rounded-lg p-4 text-center">
                          <div className="text-xl font-bold mb-1" style={{ color: metric.color }}>
                            {metric.value}
                          </div>
                          {metric.unit && <div className="text-xs neo-text-muted">{metric.unit}</div>}
                          <div className="text-xs neo-text-secondary mt-1">{metric.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="rounded-xl mt-8 p-6" style={{ 
                    background: 'linear-gradient(135deg, rgba(133, 226, 110, 0.1), rgba(141, 92, 255, 0.1))',
                    border: '1px solid rgba(133, 226, 110, 0.3)'
                  }}>
                    <h4 className="text-xl font-semibold neo-text-primary mb-4 flex items-center space-x-2">
                      <ChevronRight className="h-6 w-6 neo-primary" />
                      <span>Ready for the Next Step?</span>
                    </h4>
                    <p className="neo-text-secondary mb-6">
                      Now that you know your hybrid score, create personalized training and nutrition plans to improve your weakest areas and maintain your strengths.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        className="neo-btn-primary flex-1"
                        onClick={() => {/* TODO: Navigate to training plan creation */}}
                      >
                        Create Training Plan
                      </button>
                      <button
                        className="neo-btn-secondary flex-1"
                        onClick={() => {/* TODO: Navigate to nutrition plan creation */}}
                      >
                        Create Nutrition Plan
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;