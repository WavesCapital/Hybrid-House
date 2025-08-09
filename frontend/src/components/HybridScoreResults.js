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
import SharedHeader from './SharedHeader';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const HybridScoreResults = () => {
  const { profileId } = useParams();
  const [scoreData, setScoreData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedScores, setAnimatedScores] = useState({});
  const [circleProgress, setCircleProgress] = useState(0);
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

  // Generate beautiful share image with neon theme
  const generateShareImage = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size for social media (Instagram/Twitter optimal)
    canvas.width = 1080;
    canvas.height = 1080;
    
    // Clear canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create clean dark gradient background
    const bgGradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
    bgGradient.addColorStop(0, '#1A1B23');
    bgGradient.addColorStop(0.8, '#0F1419');
    bgGradient.addColorStop(1, '#000000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle grid pattern
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.06)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let i = 0; i < canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    
    // Add subtle decorative corner circles (minimal and out of the way)
    const decorCircles = [
      { x: 100, y: 100, r: 50, alpha: 0.06, color: [0, 255, 136] },
      { x: canvas.width - 100, y: 100, r: 40, alpha: 0.05, color: [0, 240, 255] },
      { x: 100, y: canvas.height - 100, r: 60, alpha: 0.06, color: [136, 255, 0] },
      { x: canvas.width - 100, y: canvas.height - 100, r: 45, alpha: 0.05, color: [255, 136, 0] }
    ];
    
    decorCircles.forEach(circle => {
      // Very subtle glow
      const glowGradient = ctx.createRadialGradient(circle.x, circle.y, 0, circle.x, circle.y, circle.r * 1.2);
      const [r, g, b] = circle.color;
      glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${circle.alpha})`);
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.r * 1.2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Very subtle circle border
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${circle.alpha * 1.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
      ctx.stroke();
    });
    
    // Perfect spacing and positioning
    const centerX = canvas.width / 2;
    const titleY = 160;
    const mainScoreY = 400;
    const breakdownY = 650;
    const ctaY = 800;
    const websiteY = 860;
    
    // Get display name from user_profiles table (userProfileData) linked by user_id
    const getDisplayName = () => {
      // First try to get display_name from user_profiles table
      if (userProfileData?.display_name && userProfileData.display_name !== 'N/A') {
        return userProfileData.display_name;
      }
      // Fallback to constructing name from user_profiles table
      if (userProfileData?.first_name && userProfileData?.last_name) {
        return `${userProfileData.first_name} ${userProfileData.last_name}`;
      }
      if (userProfileData?.first_name) {
        return userProfileData.first_name;
      }
      // Final fallback to profile_json if no user_profiles data available
      if (profileData?.display_name && profileData.display_name !== 'N/A') {
        return profileData.display_name;
      }
      if (profileData?.first_name && profileData?.last_name) {
        return `${profileData.first_name} ${profileData.last_name}`;
      }
      if (profileData?.first_name) {
        return profileData.first_name;
      }
      return 'HYBRID ATHLETE'; // Final fallback
    };
    
    const displayName = getDisplayName();
    
    // Title with display name
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px Inter, Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 255, 136, 0.6)';
    ctx.shadowBlur = 20;
    ctx.fillText(displayName.toUpperCase(), centerX, titleY);
    ctx.shadowBlur = 0;
    
    // Main score circle - perfectly centered
    const mainRadius = 140;
    
    // Clean outer ring - also blue tint
    ctx.strokeStyle = 'rgba(0, 224, 255, 0.3)'; // Changed to blue tint
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, mainScoreY, mainRadius + 15, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Progress ring - now glowing blue
    const progress = (hybridScoreValue / 100) * 2 * Math.PI;
    ctx.strokeStyle = '#00E0FF'; // Changed from green to blue
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0, 224, 255, 0.8)'; // Blue glow
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(centerX, mainScoreY, mainRadius, -Math.PI/2, -Math.PI/2 + progress);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Main score number - now glowing blue
    ctx.fillStyle = '#00E0FF'; // Changed from green to blue
    ctx.font = 'bold 110px Inter, Arial, sans-serif';
    ctx.shadowColor = 'rgba(0, 224, 255, 0.8)'; // Blue glow
    ctx.shadowBlur = 25;
    ctx.fillText(hybridScoreValue.toString(), centerX, mainScoreY + 15);
    ctx.shadowBlur = 0;
    
    // Score label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 24px Inter, Arial, sans-serif';
    ctx.fillText('HYBRID SCORE', centerX, mainScoreY + 55);
    
    // Breakdown scores - perfectly spaced in a clean row
    const breakdownSpacing = 180; // Increased spacing for better layout
    const totalWidth = 3 * breakdownSpacing; // Width for 4 items with 3 gaps
    const startX = centerX - (totalWidth / 2);
    
    const breakdownData = [
      { label: 'STR', value: Math.round(parseFloat(scoreData.strengthScore || 0)), color: '#00FF88' },
      { label: 'SPD', value: Math.round(parseFloat(scoreData.speedScore || 0)), color: '#00E0FF' },
      { label: 'VO₂', value: Math.round(parseFloat(scoreData.vo2Score || 0)), color: '#FF88E0' },
      { label: 'END', value: Math.round(parseFloat(scoreData.enduranceScore || scoreData.recoveryScore || 0)), color: '#FFE000' }
    ];
    
    breakdownData.forEach((item, index) => {
      const x = startX + (index * breakdownSpacing);
      const y = breakdownY;
      const radius = 40;
      
      // Clean circle background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Circle border
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Value
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), x, y + 8);
      
      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 14px Inter, Arial, sans-serif';
      ctx.fillText(item.label, x, y - 55);
    });
    
    // Ranking badge removed as requested
    // (No ranking badge will be displayed)
    
    // Call to action - perfectly spaced
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 32px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('What\'s Your Score?', centerX, ctaY);
    
    // Website - clean with blue glow to match main score
    ctx.fillStyle = '#00E0FF'; // Changed to blue
    ctx.font = 'bold 28px Inter, Arial, sans-serif';
    ctx.shadowColor = 'rgba(0, 224, 255, 0.6)'; // Blue glow
    ctx.shadowBlur = 12;
    ctx.fillText('HybridLab.io', centerX, websiteY);
    ctx.shadowBlur = 0;
    
    return canvas.toDataURL('image/png', 0.95);
  }, [scoreData, hybridScoreValue, leaderboardPosition, totalAthletes, profileData, userProfileData]);

  // Handle share functionality with proper image-first ordering
  const handleShare = async () => {
    try {
      const imageDataUrl = await generateShareImage();
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      const punchyShareText = `💥 Hybrid Athlete Score: ${hybridScoreValue}/100

🔥 STR ${Math.round(parseFloat(scoreData.strengthScore || 0))} | SPD ${Math.round(parseFloat(scoreData.speedScore || 0))} | VO₂ ${Math.round(parseFloat(scoreData.vo2Score || 0))} | END ${Math.round(parseFloat(scoreData.enduranceScore || scoreData.recoveryScore || 0))}

Think you can beat this? Get scored at HybridLab.io 🚀`;
      
      // Check if native sharing is available
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'hybrid-score.png', { type: 'image/png' })] })) {
        // Try sharing with a specific filename that includes metadata to encourage image-first ordering
        const shareFile = new File([blob], 'hybrid-athlete-score.png', { 
          type: 'image/png',
          lastModified: Date.now()
        });
        
        // Share with minimal text to ensure image precedence
        await navigator.share({
          files: [shareFile],
          text: punchyShareText,
          title: '🏆 My Hybrid Athlete Score'
        });
      } else {
        // Fallback: Show enhanced share options with image ABOVE text (proper order)
        showShareOptions(imageDataUrl, punchyShareText);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to simple text share
      const fallbackText = `💥 Just scored ${hybridScoreValue}/100 on the Hybrid Athlete test! Think you can beat it? HybridLab.ai 🚀`;
      if (navigator.share) {
        navigator.share({
          title: '🏆 My Hybrid Athlete Score',
          text: fallbackText
        });
      }
    }
  };

  // Show beautiful share options modal with neon theme
  const showShareOptions = (imageDataUrl, shareText) => {
    // Create enhanced modal with neon design
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(10px);
      animation: fadeIn 0.3s ease-out;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: linear-gradient(135deg, #111314, #0A0B0C);
      padding: 40px;
      border-radius: 24px;
      max-width: 520px;
      width: 90%;
      text-align: center;
      border: 2px solid rgba(0, 255, 136, 0.3);
      box-shadow: 
        0 0 30px rgba(0, 255, 136, 0.2),
        0 20px 40px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    `;
    
    // Add subtle animated background pattern
    const bgPattern = document.createElement('div');
    bgPattern.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 20% 20%, rgba(0, 255, 136, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(0, 255, 136, 0.08) 0%, transparent 50%);
      pointer-events: none;
    `;
    content.appendChild(bgPattern);
    
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent('https://HybridLab.ai');
    
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
        // Show success feedback
        const button = document.getElementById('copyImageBtn');
        button.innerHTML = '✓ Copied!';
        button.style.background = 'rgba(0, 255, 136, 0.3)';
        button.style.color = '#00FF88';
        setTimeout(() => {
          button.innerHTML = '📋 Copy Image';
          button.style.background = 'rgba(255, 255, 255, 0.1)';
          button.style.color = '#FFFFFF';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy image: ', err);
        alert('Failed to copy image to clipboard');
      }
    };
    
    const copyText = () => {
      navigator.clipboard.writeText(shareText);
      const button = document.getElementById('copyTextBtn');
      button.innerHTML = '✓ Copied!';
      button.style.background = 'rgba(0, 255, 136, 0.3)';
      button.style.color = '#00FF88';
      setTimeout(() => {
        button.innerHTML = '📝 Copy Text';
        button.style.background = 'rgba(255, 255, 255, 0.1)';
        button.style.color = '#FFFFFF';
      }, 2000);
    };
    
    content.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes neonPulse {
          0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.5), 0 0 10px rgba(0, 255, 136, 0.3), 0 0 15px rgba(0, 255, 136, 0.1); }
          50% { box-shadow: 0 0 10px rgba(0, 255, 136, 0.8), 0 0 20px rgba(0, 255, 136, 0.5), 0 0 30px rgba(0, 255, 136, 0.2); }
        }
        
        .share-button {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .share-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .share-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .share-button:hover::before {
          left: 100%;
        }
      </style>
      
      <div style="position: relative; z-index: 1;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 24px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(45deg, #00FF88, #00E0FF); display: flex; align-items: center; justify-content: center; animation: neonPulse 2s infinite;">
            <span style="font-size: 20px;">🚀</span>
          </div>
          <h3 style="color: #FFFFFF; margin: 0; font-family: Inter, sans-serif; font-size: 28px; font-weight: 700; text-shadow: 0 0 10px rgba(0, 255, 136, 0.3);">
            Share Your Score
          </h3>
        </div>
        
        <!-- IMAGE APPEARS FIRST -->
        <div style="margin-bottom: 32px; border-radius: 16px; overflow: hidden; border: 2px solid rgba(0, 255, 136, 0.3); box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);">
          <img src="${imageDataUrl}" style="width: 100%; height: auto; display: block;" alt="Hybrid Score Card" />
        </div>
        
        <!-- TEXT APPEARS BELOW IMAGE -->
        <div style="background: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #FFFFFF; font-family: Inter, sans-serif; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">${shareText}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px;">
          <a href="https://twitter.com/intent/tweet?text=${encodedText}" target="_blank" style="
            background: linear-gradient(135deg, #1DA1F2, #1a91da);
            color: #FFFFFF;
            padding: 16px 12px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            font-family: Inter, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;" 
            class="share-button">
            <span style="font-size: 16px;">🐦</span>
            Twitter
          </a>
          
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}" target="_blank" style="
            background: linear-gradient(135deg, #4267B2, #365899);
            color: #FFFFFF;
            padding: 16px 12px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            font-family: Inter, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;" 
            class="share-button">
            <span style="font-size: 16px;">📘</span>
            Facebook
          </a>
          
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}" target="_blank" style="
            background: linear-gradient(135deg, #0077b5, #005885);
            color: #FFFFFF;
            padding: 16px 12px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            font-family: Inter, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;" 
            class="share-button">
            <span style="font-size: 16px;">💼</span>
            LinkedIn
          </a>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
          <button id="copyImageBtn" style="
            background: rgba(255, 255, 255, 0.1);
            color: #FFFFFF;
            padding: 14px 16px;
            border-radius: 10px;
            border: 1px solid rgba(0, 255, 136, 0.3);
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            font-family: Inter, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;" 
            class="share-button">
            📋 Copy Image
          </button>
          
          <button id="copyTextBtn" onclick="this.copyText()" style="
            background: rgba(255, 255, 255, 0.1);
            color: #FFFFFF;
            padding: 14px 16px;
            border-radius: 10px;
            border: 1px solid rgba(0, 255, 136, 0.3);
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            font-family: Inter, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;" 
            class="share-button">
            📝 Copy Text
          </button>
        </div>
        
        <a href="${imageDataUrl}" download="hybrid-athlete-score.png" style="
          background: linear-gradient(135deg, #00FF88, #00E0FF);
          color: #000000;
          padding: 16px 24px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          font-family: Inter, sans-serif;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);" 
          class="share-button">
          ⬇️ Download Score Card
        </a>
        
        <div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: transparent;
            color: rgba(255, 255, 255, 0.7);
            padding: 12px 24px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            font-family: Inter, sans-serif;
            font-size: 14px;
            transition: all 0.3s ease;">
            ✕ Close
          </button>
        </div>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Add event listeners
    const copyImageBtn = content.querySelector('#copyImageBtn');
    copyImageBtn.addEventListener('click', copyImageToClipboard);
    
    const copyTextBtn = content.querySelector('#copyTextBtn');
    copyTextBtn.copyText = copyText;
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  };

  // Animate score numbers and circle
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

    // Animate the circle progress separately
    const hybridScore = parseFloat(data.hybridScore);
    if (hybridScore) {
      const duration = 2500; // 2.5 seconds for smoother animation
      const startTime = Date.now();
      
      // Smooth easing function (ease-out)
      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
      
      const animateCircle = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const currentProgress = hybridScore * easedProgress;
        
        setCircleProgress(currentProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animateCircle);
        }
      };
      
      // Start circle animation with a slight delay for smoother effect
      setTimeout(() => animateCircle(), 200);
    }

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

        const { profile_json, score_data, user_id, user_profile } = response.data;
        
        if (score_data) {
          setScoreData(score_data);
          setProfileData(profile_json);
          
          // Set user profile data if available (now directly from the response)
          if (user_profile) {
            setUserProfileData(user_profile);
          }
          
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
  }, [profileId, navigate, toast, fetchLeaderboardPosition, session]);

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
    <>
      <SharedHeader 
        title="Hybrid Score Results"
        contextualActions={[
          {
            label: 'Get New Score',
            icon: <Activity className="w-4 h-4" />,
            onClick: () => navigate('/hybrid-score-form'),
            variant: 'primary'
          }
        ]}
      />
      
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
        
        /* Hero Dial Styles */
        .hero-dial {
          width: 280px;
          height: 280px;
          filter: drop-shadow(0 0 10px #08F0FFAA);
        }

        .hero-dial svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .hero-dial .dial-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .hero-dial .score-number {
          font-size: 4rem;
          font-weight: 800;
          color: var(--neon-primary);
          line-height: 1;
          margin-bottom: 8px;
        }

        .hero-dial .score-label {
          font-size: 1.2rem;
          color: var(--txt);
          font-weight: 600;
        }

        /* Mobile Hero Dial */
        @media (max-width: 768px) {
          .hero-dial {
            width: 200px;
            height: 200px;
          }
          
          .hero-dial .score-number {
            font-size: 3rem;
          }
        }
        
        @media (max-width: 480px) {
          .hero-dial {
            width: 160px;
            height: 160px;
          }
          
          .hero-dial .score-number {
            font-size: 2.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-dial svg circle {
            animation: none !important;
          }
        }
        `}
      </style>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Score Display */}
        <div className="space-y-8">
          {/* Hybrid Score Section */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold neo-text-primary mb-8">Your Results</h2>
              
              {/* Circular Score Display */}
              <div className="flex justify-center mb-8">
                <div className="hero-dial relative">
                  <svg viewBox="0 0 280 280">
                    <circle
                      cx="140"
                      cy="140"
                      r="120"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="140"
                      cy="140"
                      r="120"
                      fill="none"
                      stroke="var(--neon-primary)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(circleProgress / 100) * 754} 754`}
                      style={{
                        filter: 'drop-shadow(0 0 10px #08F0FFAA)'
                      }}
                    />
                  </svg>
                  <div className="dial-value">
                    <div className="score-number" style={{
                      textShadow: '0 0 10px rgba(8, 240, 255, 0.4), 0 0 20px rgba(8, 240, 255, 0.2)'
                    }}>
                      {animatedScores.hybrid ? Math.round(animatedScores.hybrid) : hybridScoreValue}
                    </div>
                    <div className="score-label" style={{ color: '#FFFFFF' }}>Hybrid Score</div>
                  </div>
                </div>
              </div>
              
              {/* Leaderboard Position and Buttons */}
              <div className="mb-4 sm:mb-6">
                {/* Show ranking only if user is on public leaderboard */}
                {leaderboardPosition && totalAthletes && (
                  <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                    <span className="text-base sm:text-lg neo-text-primary">
                      Ranked #{leaderboardPosition} out of {totalAthletes} athletes
                    </span>
                  </div>
                )}
                
                {/* Always show buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
                  <Button 
                    onClick={() => navigate('/leaderboard')} 
                    className="neo-btn-secondary w-full sm:w-auto"
                    size="sm"
                  >
                    View Leaderboard
                  </Button>
                  <Button onClick={handleShare} className="w-full sm:w-auto" size="sm" style={{
                    background: '#00E0FF',  // Solid blue instead of gradient
                    color: '#000000',
                    border: 'none',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',  // Subtle shadow
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 0 25px rgba(0, 224, 255, 0.6), 0 4px 15px rgba(0, 0, 0, 0.3)';  // Blue glow on hover
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';  // Return to subtle shadow
                    e.target.style.transform = 'translateY(0px)';
                  }}>
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
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button
                onClick={() => navigate('/profile')}
                className="neo-btn-primary px-6 sm:px-8 py-3"
              >
                View All Scores
              </Button>
            </div>
          </section>
        </div>
      </div>
      
      {/* Hidden canvas for share image generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
    </>
  );
};

export default HybridScoreResults;