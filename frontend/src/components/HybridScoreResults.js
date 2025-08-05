import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { 
  Trophy, Target, AlertCircle, Dumbbell, Zap, Heart, MapPin, 
  BarChart3, Activity, Moon, Share2
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const HybridScoreResults = () => {
  const { profileId } = useParams();
  const [scoreData, setScoreData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedScores, setAnimatedScores] = useState({});
  const [leaderboardPosition, setLeaderboardPosition] = useState(null);
  const [totalAthletes, setTotalAthletes] = useState(null);
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Memoize score array to prevent recreation on every render
  const scoreBreakdown = useMemo(() => [
    { key: 'strength', label: 'Strength', value: scoreData?.strengthScore, comment: scoreData?.strengthComment, color: '#79CFF7', icon: Dumbbell },
    { key: 'speed', label: 'Speed', value: scoreData?.speedScore, comment: scoreData?.speedComment, color: '#85E26E', icon: Zap },
    { key: 'vo2', label: 'VO₂ Max', value: scoreData?.vo2Score, comment: scoreData?.vo2Comment, color: '#8D5CFF', icon: Heart },
    { key: 'distance', label: 'Distance', value: scoreData?.distanceScore, comment: scoreData?.distanceComment, color: '#79CFF7', icon: MapPin },
    { key: 'volume', label: 'Volume', value: scoreData?.volumeScore, comment: scoreData?.volumeComment, color: '#85E26E', icon: BarChart3 },
    { key: 'endurance', label: 'Endurance', value: scoreData?.enduranceScore, comment: scoreData?.enduranceComment, color: '#8D5CFF', icon: Activity },
    { key: 'recovery', label: 'Recovery', value: scoreData?.recoveryScore, comment: scoreData?.recoveryComment, color: '#79CFF7', icon: Moon }
  ], [scoreData]);

  // Memoize hybrid score calculation
  const hybridScoreValue = useMemo(() => {
    return scoreData ? Math.round(parseFloat(scoreData.hybridScore)) : 0;
  }, [scoreData]);

  // Generate share image (memoized)
  const generateShareImage = useCallback(async () => {
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
      ctx.fillStyle = `rgba(121, 207, 247, ${Math.random() * 0.02})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
    
    // Title
    ctx.fillStyle = '#D9D9D9';
    ctx.font = 'bold 48px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('My Hybrid Athlete Score', canvas.width / 2, 80);
    
    // Main score with Neo blue
    const hybridScore = hybridScoreValue;
    ctx.fillStyle = '#79CFF7';
    ctx.font = 'bold 120px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(hybridScore.toString(), canvas.width / 2, 220);
    
    // Subtitle
    ctx.fillStyle = '#9FA1A3';
    ctx.font = '24px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('Overall hybrid-fitness score', canvas.width / 2, 260);
    
    // Component scores
    const scores = [
      { label: 'Strength', value: Math.round(parseFloat(scoreData.strengthScore)), color: '#79CFF7' },
      { label: 'Speed', value: Math.round(parseFloat(scoreData.speedScore)), color: '#85E26E' },
      { label: 'VO₂', value: Math.round(parseFloat(scoreData.vo2Score)), color: '#8D5CFF' },
      { label: 'Endurance', value: Math.round(parseFloat(scoreData.enduranceScore)), color: '#79CFF7' }
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
  }, [scoreData]);

  // Handle share functionality (same as AthleteProfile)
  const handleShare = async () => {
    try {
      const imageDataUrl = await generateShareImage();
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      const shareText = `🏆 My Hybrid Athlete Score: ${hybridScoreValue}/100\n\nStrength: ${Math.round(parseFloat(scoreData.strengthScore))} | Speed: ${Math.round(parseFloat(scoreData.speedScore))} | VO₂: ${Math.round(parseFloat(scoreData.vo2Score))} | Endurance: ${Math.round(parseFloat(scoreData.enduranceScore))}\n\nGet your score at HybridHouse.ai`;
      
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
      const shareText = `🏆 My Hybrid Athlete Score: ${hybridScoreValue}/100 - Get yours at HybridHouse.ai`;
      if (navigator.share) {
        navigator.share({
          title: 'My Hybrid Athlete Score',
          text: shareText
        });
      }
    }
  };

  // Show share options modal (same as AthleteProfile)
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

  // Animate score numbers
  const animateScores = useCallback((data) => {
    const scoresToAnimate = [
      { key: 'hybrid', value: data.hybridScore },
      { key: 'strength', value: data.strengthScore },
      { key: 'speed', value: data.speedScore },
      { key: 'vo2', value: data.vo2Score },
      { key: 'distance', value: data.distanceScore },
      { key: 'volume', value: data.volumeScore },
      { key: 'endurance', value: data.enduranceScore },
      { key: 'recovery', value: data.recoveryScore }
    ];

    scoresToAnimate.forEach(({ key, value }) => {
      if (value) {
        const targetValue = parseFloat(value);
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const currentValue = targetValue * progress;
          
          setAnimatedScores(prev => ({
            ...prev,
            [key]: currentValue
          }));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    });
  }, []);

  // Fetch leaderboard position
  // Fetch leaderboard position using enhanced ranking service
  const fetchLeaderboardPosition = useCallback(async (userHybridScore, userProfileId) => {
    try {
      // Try to get ranking from the dedicated ranking endpoint first
      const rankingResponse = await axios.get(`${BACKEND_URL}/api/ranking/${userProfileId}`);
      
      if (rankingResponse.status === 200 && rankingResponse.data.ranking) {
        const ranking = rankingResponse.data.ranking;
        setLeaderboardPosition(ranking.position);
        setTotalAthletes(ranking.total_athletes);
        return;
      }
    } catch (error) {
      // If ranking endpoint fails, fall back to leaderboard endpoint
      console.log('Ranking endpoint failed, falling back to leaderboard calculation');
    }
    
    try {
      // Fallback: Use enhanced leaderboard endpoint
      const response = await axios.get(`${BACKEND_URL}/api/leaderboard`);
      
      if (response.data.leaderboard) {
        const leaderboard = response.data.leaderboard;
        const totalPublicAthletes = response.data.total_public_athletes || leaderboard.length;
        
        // Check if user is on public leaderboard
        const userPosition = leaderboard.findIndex(athlete => athlete.profile_id === userProfileId);
        
        if (userPosition !== -1) {
          // User is on public leaderboard - show actual position
          setLeaderboardPosition(userPosition + 1);
          setTotalAthletes(totalPublicAthletes);
        } else {
          // User is private - calculate hypothetical position
          let hypotheticalPosition = 1;
          for (const athlete of leaderboard) {
            if (athlete.score > userHybridScore) {
              hypotheticalPosition++;
            } else {
              break; // Since leaderboard is sorted, we can break early
            }
          }
          // Show their hypothetical position among all public athletes + themselves
          setLeaderboardPosition(hypotheticalPosition);
          setTotalAthletes(totalPublicAthletes + 1); // Include user in total count
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard position:', error);
      // Don't show error to user, just leave position as null
    }
  }, []);

  // Fetch score data from Supabase
  useEffect(() => {
    const fetchScoreData = async () => {
      if (!profileId) return;

      try {
        setIsLoading(true);
        
        const config = {};
        // Add authentication headers if user is logged in
        if (session) {
          config.headers = {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          };
        }
        
        const response = await axios.get(
          `${BACKEND_URL}/api/athlete-profile/${profileId}`,
          config
        );

        const { profile_json, score_data } = response.data;
        
        if (score_data) {
          setScoreData(score_data);
          setProfileData(profile_json);
          // Animate scores
          setTimeout(() => animateScores(score_data), 500);
          // Fetch leaderboard position
          fetchLeaderboardPosition(score_data.hybridScore, profileId);
        } else {
          toast({
            title: "Score data not found",
            description: "The score data for this profile is not available.",
            variant: "destructive",
          });
          navigate('/');
        }
        
      } catch (error) {
        console.error('Error fetching score data:', error);
        toast({
          title: "Error loading score data",
          description: "Failed to load your hybrid score. Please try again.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScoreData();
  }, [profileId, navigate, toast, fetchLeaderboardPosition]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0B0C' }}>
        <div className="text-center">
          <div className="neo-primary text-xl mb-4">Loading your hybrid score...</div>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0B0C' }}>
        <div className="text-center">
          <div className="neo-primary text-xl mb-4">Score data not found</div>
          <Button onClick={() => navigate('/')} className="neo-btn-primary">
            Go Back to Interview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0B0C' }}>
      <style>
        {`
        :root {
          --neon-primary: #08F0FF;
        }
        
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
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          .grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .grid.grid-cols-1.lg\\:grid-cols-2 {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .text-8xl {
            font-size: 3.5rem;
            line-height: 1;
          }
          
          .text-5xl {
            font-size: 2.5rem;
            line-height: 1.1;
          }
          
          .text-4xl {
            font-size: 2rem;
            line-height: 1.2;
          }
          
          .text-3xl {
            font-size: 1.875rem;
            line-height: 1.2;
          }
          
          .text-2xl {
            font-size: 1.5rem;
            line-height: 1.3;
          }
          
          .text-xl {
            font-size: 1.25rem;
            line-height: 1.4;
          }
          
          .text-lg {
            font-size: 1.125rem;
            line-height: 1.4;
          }
          
          /* Mobile padding adjustments */
          .p-12 {
            padding: 2rem;
          }
          
          .p-8 {
            padding: 1.5rem;
          }
          
          .p-6 {
            padding: 1rem;
          }
          
          .py-24 {
            padding-top: 3rem;
            padding-bottom: 3rem;
          }
          
          .py-8 {
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
          }
          
          .mb-16 {
            margin-bottom: 2rem;
          }
          
          .mb-8 {
            margin-bottom: 1.5rem;
          }
          
          .mb-6 {
            margin-bottom: 1rem;
          }
          
          /* Mobile button adjustments */
          .flex.flex-col.sm\\:flex-row {
            flex-direction: column;
            gap: 1rem;
          }
          
          .flex.items-center.justify-center.space-x-3 {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .flex.items-center.justify-center.space-x-3 button {
            width: 100%;
            min-height: 44px;
          }
          
          /* Mobile header adjustments */}
          .px-6.py-4 {
            padding: 0.75rem 1rem;
          }
          
          .flex.items-center.space-x-4 {
            gap: 0.5rem;
          }
          
          .flex.items-center.space-x-3 button {
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            min-height: 40px;
            min-width: 60px;
          }
        }
        
        @media (max-width: 480px) {
          .text-8xl {
            font-size: 3rem;
          }
          
          .text-5xl {
            font-size: 2rem;
          }
          
          .text-4xl {
            font-size: 1.75rem;
          }
          
          .text-3xl {
            font-size: 1.5rem;
          }
          
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          .p-12 {
            padding: 1.5rem;
          }
          
          .p-8 {
            padding: 1rem;
          }
          
          .p-6 {
            padding: 0.75rem;
          }
          
          /* Very small screen header */
          .flex.items-center.space-x-3 button {
            padding: 0.5rem;
            font-size: 0.75rem;
            min-width: 50px;
          }
          
          .text-xl {
            font-size: 1rem;
          }
        }
        `}
      </style>

      {/* Header - Same as Home Page */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold" style={{ color: 'var(--neon-primary)' }}>
                Hybrid House
              </h3>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-4 py-2 border border-[#08F0FF] rounded-lg text-[#08F0FF] hover:bg-[#08F0FF]/10 transition-colors text-sm font-medium"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => navigate('/logout')}
                    className="px-4 py-2 bg-[#08F0FF] rounded-lg text-black hover:shadow-lg transition-all text-sm font-medium"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 border border-[#08F0FF] rounded-lg text-[#08F0FF] hover:bg-[#08F0FF]/10 transition-colors text-sm font-medium"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => navigate('/auth?mode=signup')}
                    className="px-4 py-2 bg-[#08F0FF] rounded-lg text-black hover:shadow-lg transition-all text-sm font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl" style={{ paddingTop: '100px' }}>
        {/* Score Display */}
        <div className="space-y-8">
          {/* Hybrid Score Section */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-5xl font-bold neo-text-primary mb-4">Your Hybrid Score</h2>
              <div className="text-8xl font-bold neo-primary mb-6" style={{ lineHeight: '1' }}>
                {animatedScores.hybrid ? Math.round(animatedScores.hybrid) : hybridScoreValue}
              </div>
              <p className="text-xl neo-text-secondary max-w-2xl mx-auto mb-6">
                Your overall hybrid-fitness score on a 0-100 scale
              </p>
              
              {/* Leaderboard Position and Buttons */}
              <div className="mb-6">
                {/* Show ranking only if user is on public leaderboard */}
                {leaderboardPosition && totalAthletes && (
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span className="text-lg neo-text-primary">
                      Ranked #{leaderboardPosition} out of {totalAthletes} athletes
                    </span>
                  </div>
                )}
                
                {/* Always show buttons */}
                <div className="flex items-center justify-center space-x-3">
                  <Button 
                    onClick={() => navigate('/leaderboard')} 
                    className="neo-btn-secondary"
                    size="sm"
                  >
                    View Leaderboard
                  </Button>
                  <Button onClick={handleShare} className="neo-btn-secondary" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Score
                  </Button>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {scoreBreakdown.map((score) => {
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
            {(scoreData.balanceBonus > 0 || scoreData.hybridPenalty > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {scoreData.balanceBonus > 0 && (
                  <div className="rounded-xl p-6" style={{ 
                    background: 'linear-gradient(135deg, rgba(121, 207, 247, 0.1), rgba(133, 226, 110, 0.1))',
                    border: '1px solid rgba(121, 207, 247, 0.3)'
                  }}>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ 
                        background: 'rgba(121, 207, 247, 0.2)',
                        border: '2px solid #79CFF7' 
                      }}>
                        <Trophy className="h-5 w-5 neo-primary" />
                      </div>
                      <h4 className="text-lg font-semibold neo-primary">Balance Bonus: +{Math.round(scoreData.balanceBonus)}</h4>
                    </div>
                    <p className="neo-text-secondary">{scoreData.balanceComment}</p>
                  </div>
                )}
                
                {scoreData.hybridPenalty > 0 && (
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
                      <h4 className="text-lg font-semibold" style={{ color: '#FF4B4B' }}>Penalty: -{Math.round(scoreData.hybridPenalty)}</h4>
                    </div>
                    <p className="neo-text-secondary">{scoreData.penaltyComment}</p>
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
                {scoreData.hybridComment}
              </p>
            </div>

            {/* Actionable Tips */}
            {scoreData.tips && scoreData.tips.length > 0 && (
              <div className="neo-card rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold neo-text-primary mb-6 flex items-center space-x-2">
                  <Target className="h-6 w-6 neo-primary" />
                  <span>Action Plan</span>
                </h3>
                <div className="space-y-4">
                  {scoreData.tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ 
                        background: 'rgba(121, 207, 247, 0.2)',
                        border: '2px solid #79CFF7' 
                      }}>
                        <span className="text-xs font-bold neo-primary">{index + 1}</span>
                      </div>
                      <p className="neo-text-secondary leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/profile')}
                className="neo-btn-primary px-8 py-3"
              >
                View All Scores
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="neo-btn-secondary px-8 py-3"
              >
                Take Another Assessment
              </Button>
              <Button
                onClick={() => navigate('/full-interview')}
                className="neo-btn-secondary px-8 py-3"
              >
                Try Full Interview (55 Questions)
              </Button>
            </div>
          </section>
        </div>
      </div>
      
      {/* Hidden canvas for share image generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default HybridScoreResults;