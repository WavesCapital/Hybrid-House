import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Target, AlertCircle, Dumbbell, Zap, Heart, MapPin, 
  BarChart3, Activity, Moon, Scale, CheckCircle, Loader2, User 
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const TOTAL_QUESTIONS = 11; // Essential questions for hybrid score

const HybridInterviewFlow = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const [completedProfileId, setCompletedProfileId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [currentProfileId, setCurrentProfileId] = useState(null);
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Memoized trigger webhook function
  const triggerWebhookForScore = useCallback(async (athleteProfileData, profileId) => {
    try {
      console.log('triggerWebhookForScore called with:', {
        athleteProfileData: athleteProfileData ? 'Present' : 'Missing',
        profileId: profileId
      });
      
      setIsCalculatingScore(true);
      
      // Set up abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minutes

      const response = await fetch('https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          athleteProfile: athleteProfileData,
          deliverable: 'score'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Webhook request failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle the response - it's an array with the score data
      const scoreData = Array.isArray(data) ? data[0] : data;
      
      // Store score data in Supabase FIRST
      const storeSuccess = await storeScoreDataInSupabase(scoreData, profileId);
      
      // Then redirect to score results page using the profileId parameter
      if (profileId) {
        console.log('Redirecting to /hybrid-score/' + profileId);
        setCompletedProfileId(profileId);
        
        // Use multiple methods to ensure redirect works on all browsers
        try {
          // Method 1: React Router navigate
          navigate(`/hybrid-score/${profileId}`);
          
          // Method 2: Fallback with setTimeout to ensure execution
          setTimeout(() => {
            if (window.location.pathname !== `/hybrid-score/${profileId}`) {
              console.log('Fallback redirect triggered');
              navigate(`/hybrid-score/${profileId}`, { replace: true });
            }
          }, 100);
          
          // Method 3: Last resort - native browser navigation
          setTimeout(() => {
            if (window.location.pathname !== `/hybrid-score/${profileId}`) {
              console.log('Native redirect triggered');
              window.location.href = `/hybrid-score/${profileId}`;
            }
          }, 500);
          
          // Method 4: Show manual button if redirect failed
          setTimeout(() => {
            if (window.location.pathname !== `/hybrid-score/${profileId}`) {
              console.log('All redirect methods failed, showing manual button');
              setRedirectFailed(true);
            }
          }, 2000);
          
        } catch (navError) {
          console.error('Navigation error:', navError);
          // Force navigation as last resort
          window.location.href = `/hybrid-score/${profileId}`;
        }
      } else {
        console.error('No profile ID available for redirect');
        toast({
          title: "Error",
          description: "Unable to redirect to score results. Profile ID missing.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Webhook request timed out after 4 minutes');
        toast({
          title: "Score calculation timed out",
          description: "The analysis is taking longer than expected. Please try again.",
          variant: "destructive",
        });
      } else {
        console.error('Error calling webhook:', error);
        toast({
          title: "Error calculating score",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      // Don't immediately set calculating to false - let the redirect happen first
      setTimeout(() => {
        setIsCalculatingScore(false);
      }, 1000);
    }
  }, [navigate, session, toast]);

  // Memoized store score function
  const storeScoreDataInSupabase = useCallback(async (scoreData, profileId) => {
    try {
      if (!profileId) {
        console.error('No profile ID available to store score data');
        throw new Error('No profile ID available');
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/athlete-profile/${profileId}/score`,
        scoreData,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Score data stored successfully:', response.data);
      return true;
      
    } catch (error) {
      console.error('Error storing score data in Supabase:', error);
      toast({
        title: "Warning",
        description: "Score calculated but may not be saved. Please contact support if this persists.",
        variant: "destructive",
      });
      return false;
    }
  }, [session, toast]);

  // Confetti and streak functions removed to clean up UI

  // Generate progress bar with filled and empty blocks
  const generateProgressBar = (current, total) => {
    const filled = Math.floor((current / total) * 10);
    const empty = 10 - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startInterview = async () => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start your hybrid interview.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/hybrid-interview/start`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSessionId(response.data.session_id);
      setMessages(response.data.messages ? response.data.messages.filter(m => m.role !== 'system') : []);
      setCurrentIndex(response.data.current_index || 0);
      
      toast({
        title: "Hybrid Interview Started! 🚀",
        description: "Your answers will be auto-saved as we go.",
      });
      
    } catch (error) {
      console.error('Error starting hybrid interview:', error);
      toast({
        title: "Error",
        description: "Failed to start hybrid interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize sendMessage function to prevent unnecessary re-renders
  const sendMessage = useCallback(async (messageContent = null) => {
    const content = messageContent || currentMessage.trim();
    if (!content || !sessionId || isLoading) return;

    // Prevent rapid successive requests (debounce)
    const now = Date.now();
    if (now - lastRequestTime < 1000) {
      console.log('Request too soon, ignoring...');
      return;
    }
    setLastRequestTime(now);

    // Prevent multiple simultaneous requests
    if (isLoading) {
      console.log('Already processing a request, ignoring...');
      return;
    }

    const userMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/hybrid-interview/chat`,
        {
          messages: [userMessage],
          session_id: sessionId,
        },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentIndex(response.data.current_index || currentIndex + 1);

      // Handle confetti milestones - REMOVED
      // Handle streak detection - REMOVED

      // Update streak count based on user message - REMOVED

      if (response.data.completed) {
        setIsCompleted(true);
        
        // Store profile ID for score storage
        const profileId = response.data.profile_id;
        console.log('Completion response received:', {
          completed: response.data.completed,
          profile_id: profileId,
          profile_data: response.data.profile_data ? 'Present' : 'Missing',
          full_response: response.data
        });
        
        if (profileId) {
          setCurrentProfileId(profileId);
          console.log('Set currentProfileId to:', profileId);
        } else {
          console.error('No profile_id in completion response!', response.data);
          // Fallback: Try to manually trigger completion and get profile ID
          toast({
            title: "Processing...",
            description: "Finalizing your profile data...",
          });
          
          // Wait a moment and try to force completion
          setTimeout(() => {
            sendMessage('FORCE_COMPLETE');
          }, 1000);
          return;
        }
        
        // Call webhook with the actual athlete profile JSON data
        if (!isCalculatingScore && response.data.profile_data) {
          console.log('Calling webhook with profileId:', profileId);
          triggerWebhookForScore(response.data.profile_data, profileId);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentMessage, isLoading, lastRequestTime, sessionId, session, isCalculatingScore, toast, triggerWebhookForScore]);

  const skipQuestion = () => {
    if (isLoading) return;
    sendMessage('skip');
  };

  const forceComplete = () => {
    if (isLoading) return;
    sendMessage('done');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !(e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Memoize expensive calculations
  const progress = useMemo(() => {
    return Math.min((currentIndex / TOTAL_QUESTIONS) * 100, 100);
  }, [currentIndex]);

  return (
    <div className="min-h-screen" style={{ background: '#0E0E11' }}>
      <style>
        {`
        /* Flat-Neon "Laser Pop" Color System */
        :root {
          --bg: #0E0E11;
          --card: #15161A;
          --border: #1F2025;
          --txt: #F5FAFF;
          --muted: #8D9299;
          --neon-primary: #08F0FF;
          --neon-secondary: #FF2DDE;
          --strength: #5CFF5C;
          --speed: #FFA42D;
          --vo2: #B96DFF;
          --distance: #16D7FF;
          --volume: #F9F871;
          --recovery: #2EFFC0;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-variant-numeric: tabular-nums;
        }

        .glass-card {
          background: var(--card);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 
            0 12px 32px -24px rgba(0,0,0,.65),
            0 0 0 1px var(--border) inset;
        }

        .neon-button {
          background: var(--neon-primary);
          border: none;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          padding: 16px 32px;
          font-size: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .neon-button:hover {
          transform: translateY(-2px);
          background: var(--neon-secondary);
          box-shadow: 
            0 8px 32px rgba(8, 240, 255, 0.4),
            0 4px 16px rgba(255, 45, 222, 0.3);
        }

        .neon-button:disabled {
          opacity: 0.6;
          transform: none;
          cursor: not-allowed;
        }

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

        .pillar-ring {
          width: 150px;
          height: 150px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pillar-ring:hover {
          transform: translateY(-2px);
          filter: drop-shadow(0 0 20px currentColor);
        }

        .pillar-ring svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .pillar-ring .ring-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .pillar-ring .ring-number {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 4px;
        }

        .pillar-ring .ring-label {
          font-size: 0.875rem;
          color: var(--muted);
          font-weight: 500;
        }

        .sticky-cta {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(14, 14, 17, 0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid var(--border);
          padding: 16px 24px;
          transform: translateY(100%);
          transition: transform 0.3s ease;
        }

        .sticky-cta.visible {
          transform: translateY(0);
        }

        .authority-logos {
          opacity: 0.6;
          filter: grayscale(100%);
          transition: opacity 0.3s ease;
        }

        .authority-logos:hover {
          opacity: 0.8;
        }

        .step-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .step-card:hover {
          transform: translateY(-4px);
          border-color: var(--neon-primary);
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: var(--neon-primary);
          color: #000000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 auto 24px;
        }

        .faq-item {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .faq-item:hover {
          border-color: var(--neon-primary);
        }

        .testimonial-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .hero-dial {
            width: 180px;
            height: 180px;
          }
          
          .hero-dial .score-number {
            font-size: 2.5rem;
          }
          
          .pillar-ring {
            width: 120px;
            height: 120px;
          }
          
          .step-card {
            padding: 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-dial svg circle,
          .pillar-ring svg circle {
            animation: none !important;
          }
        }
        `}
      </style>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Radial Highlight */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at center, #08F0FF22 0%, transparent 420px)`
          }}
        />
        
        <div className="container mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            {/* Left Column - Copy */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight" style={{ color: 'var(--txt)' }}>
                  Build Muscle.<br />
                  Shave Minutes.<br />
                  <span style={{ color: 'var(--neon-primary)' }}>Know Your Score.</span>
                </h1>
                <p className="text-xl lg:text-2xl leading-relaxed" style={{ color: 'var(--muted)' }}>
                  The only 0-100 metric built for athletes who deadlift at dawn and hit tempo runs by dusk.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={startInterview}
                  disabled={isLoading}
                  className="neon-button text-lg"
                >
                  {isLoading ? 'Starting...' : 'Start Hybrid Interview'}
                </button>
                <button 
                  className="px-8 py-4 border border-gray-600 rounded-lg text-gray-300 hover:border-gray-400 transition-colors"
                  onClick={() => {/* Navigate to sample report */}}
                >
                  See Sample Report
                </button>
              </div>

              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Backed by peer-reviewed concurrent-training studies and used by &gt;8,000 athletes.
              </p>
            </div>

            {/* Right Column - Hero Dial */}
            <div className="flex justify-center">
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
                    strokeDasharray={`${(91 / 100) * 754} 754`}
                    style={{
                      transition: 'stroke-dasharray 320ms cubic-bezier(.2,1.4,.3,1)',
                      filter: 'drop-shadow(0 0 10px #08F0FFAA)'
                    }}
                  />
                </svg>
                <div className="dial-value">
                  <div className="score-number">91</div>
                  <div className="score-label">Hybrid Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Authority Bar */}
      <section className="py-8 border-t border-b border-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex justify-center items-center space-x-12 authority-logos">
            <div className="text-gray-500 font-semibold">Men's Health</div>
            <div className="text-gray-500 font-semibold">HYROX</div>
            <div className="text-gray-500 font-semibold">CrossFit Community</div>
            <div className="text-gray-500 font-semibold">Bare Performance</div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-12 text-center">
              <h2 className="text-4xl font-bold mb-16" style={{ color: 'var(--txt)' }}>
                Strength or endurance? <span style={{ color: 'var(--neon-primary)' }}>Stop choosing.</span>
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mx-auto">
                    <RefreshCw className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--txt)' }}>Training plans conflict</h3>
                  <p style={{ color: 'var(--muted)' }}>Algorithm balances volume automatically</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--txt)' }}>No single progress marker</h3>
                  <p style={{ color: 'var(--muted)' }}>Hybrid Score = one benchmark</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mx-auto">
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--txt)' }}>Time-crunched schedules</h3>
                  <p style={{ color: 'var(--muted)' }}>11-question interview &lt; 3 min to complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16" style={{ color: 'var(--txt)' }}>
              How It Works
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--txt)' }}>Answer 11 essentials</h3>
                <p style={{ color: 'var(--muted)' }}>Weight, mile time, lifts, and key metrics</p>
              </div>
              
              <div className="step-card">
                <div className="step-number">2</div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--txt)' }}>AI crunches data</h3>
                <p style={{ color: 'var(--muted)' }}>Coach-GPT normalizes data → algorithm v5.0</p>
              </div>
              
              <div className="step-card">
                <div className="step-number">3</div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--txt)' }}>Score + plan</h3>
                <p style={{ color: 'var(--muted)' }}>Dial, pillar scores, and 5 actionable tips</p>
              </div>
            </div>
            
            <div className="text-center">
              <button 
                onClick={startInterview}
                disabled={isLoading}
                className="neon-button text-lg"
              >
                {isLoading ? 'Starting...' : 'Start Hybrid Interview 🚀'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Score Breakdown Grid */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16" style={{ color: 'var(--txt)' }}>
              Your Complete Performance Picture
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { pillar: 'Strength', color: 'var(--strength)', description: 'Bench, squat & deadlift relative to body weight' },
                { pillar: 'Speed', color: 'var(--speed)', description: 'Fastest mile pace' },
                { pillar: 'VO₂ Max', color: 'var(--vo2)', description: 'Engine capacity straight from your watch' },
                { pillar: 'Distance', color: 'var(--distance)', description: 'Longest run (last 60 days)' },
                { pillar: 'Volume', color: 'var(--volume)', description: 'Weekly mileage signal' },
                { pillar: 'Recovery', color: 'var(--recovery)', description: 'HRV & resting HR stability' }
              ].map((item, index) => (
                <div key={index} className="glass-card p-8 text-center">
                  <div className="pillar-ring relative mx-auto mb-6" style={{ color: item.color }}>
                    <svg viewBox="0 0 150 150">
                      <circle
                        cx="75"
                        cy="75"
                        r="65"
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="75"
                        cy="75"
                        r="65"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(85 / 100) * 408} 408`}
                        style={{ transition: 'stroke-dasharray 180ms linear' }}
                      />
                    </svg>
                    <div className="ring-value">
                      <div className="ring-number" style={{ color: item.color }}>85</div>
                      <div className="ring-label">{item.pillar}</div>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl font-bold" style={{ color: 'var(--txt)' }}>
                  Real Results from Real Athletes
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-5 h-5 text-yellow-400">★</div>
                    ))}
                  </div>
                  <span style={{ color: 'var(--muted)' }}>4.9/5 from 8,000+ athletes</span>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="testimonial-card">
                  <p className="text-lg mb-4" style={{ color: 'var(--txt)' }}>
                    "Hybrid Score nailed where I lagged. 8-week focus block and my marathon split dropped by 9 min while my deadlift PR rose 20 lb."
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--txt)' }}>Sam</div>
                      <div className="text-sm" style={{ color: 'var(--muted)' }}>HYROX age-group champ</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">#AppleWatch</span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">#CrossFit</span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">#Marathon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16" style={{ color: 'var(--txt)' }}>
              Frequently Asked Questions
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="faq-item">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--txt)' }}>Is it really free?</h3>
                <p style={{ color: 'var(--muted)' }}>Yes, completely free. No hidden costs or subscription required.</p>
              </div>
              
              <div className="faq-item">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--txt)' }}>Do I need a smartwatch?</h3>
                <p style={{ color: 'var(--muted)' }}>No, but having HRV and VO₂ data improves accuracy significantly.</p>
              </div>
              
              <div className="faq-item">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--txt)' }}>How accurate is it for women?</h3>
                <p style={{ color: 'var(--muted)' }}>Algorithm accounts for gender differences in strength and endurance ratios.</p>
              </div>
              
              <div className="faq-item">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--txt)' }}>Can I retake the assessment?</h3>
                <p style={{ color: 'var(--muted)' }}>Yes, track your progress by retaking monthly or after training blocks.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky CTA Bar */}
      <div className="sticky-cta">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">🏆</div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--txt)' }}>Ready to claim your score?</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>3-min assessment • zero cost</div>
              </div>
            </div>
            <button 
              onClick={startInterview}
              disabled={isLoading}
              className="neon-button"
            >
              {isLoading ? 'Starting...' : 'Start Hybrid Interview'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HybridInterviewFlow;