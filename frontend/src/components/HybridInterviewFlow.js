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
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <style>
        {`
        /* Flat-Neon Palette ("Laser Pop") */
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
        
        .text-positive { color: #32FF7A; }
        .text-negative { color: #FF5E5E; }
        .text-primary { color: #F5FAFF; }
        .text-secondary { color: rgba(245, 250, 255, 0.7); }
        .text-muted { color: #8D9299; }
        
        .neon-button {
          background: #08F0FF;
          border: none;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          padding: 16px 24px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .neon-button:hover {
          transform: translateY(-2px);
          background: #FF2DDE;
          color: #000000;
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
        
        .neon-progress-bar {
          height: 8px;
          background: #1F2025;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .neon-progress-fill {
          height: 100%;
          background: #08F0FF;
          transition: width 0.3s ease;
        }
        
        .chat-bubble-user {
          background: #08F0FF;
          color: #000000;
          font-weight: 500;
        }
        
        .chat-bubble-assistant {
          background: #15161A;
          border: 1px solid #1F2025;
          color: #F5FAFF;
          backdrop-filter: blur(10px);
        }
        
        .neon-btn-secondary {
          background: #15161A;
          color: #F5FAFF;
          border: 1px solid #1F2025;
        }
        
        .neon-btn-secondary:hover {
          background: #15161A;
          border-color: rgba(8, 240, 255, 0.3);
          color: #F5FAFF;
        }
        
        .feature-dot {
          width: 6px;
          height: 6px;
          background: #08F0FF;
          border-radius: 50%;
        }
        `}
      </style>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#08F0FF] to-[#FF2DDE] rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">Hybrid House</h1>
                  <p className="text-xs text-muted">Performance Analytics</p>
                </div>
              </div>
              <div className="h-6 w-px bg-white/20"></div>
              <h2 className="text-lg font-semibold text-secondary">Home</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#08F0FF] to-[#FF2DDE] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {!sessionId ? (
          <div className="glass-card max-w-2xl mx-auto p-12 text-center">
            <h2 className="text-4xl font-bold text-primary mb-6">
              Ready for Your Hybrid Score?
            </h2>
            <p className="text-secondary mb-8 text-lg leading-relaxed">
              I'm your high-energy Hybrid House Coach! I'll ask you just 11 essential questions to 
              calculate your Hybrid Score quickly. This focused assessment covers the core metrics 
              that matter most. Takes about 3 minutes. Let's get your score! 🏃‍♂️💪
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-secondary">
                <div className="feature-dot"></div>
                <span>11 essential questions only</span>
              </div>
              <div className="flex items-center space-x-3 text-secondary">
                <div className="feature-dot"></div>
                <span>Auto-save your progress</span>
              </div>
              <div className="flex items-center space-x-3 text-secondary">
                <div className="feature-dot"></div>
                <span>Skip any question anytime</span>
              </div>
            </div>
            
            <Button
              onClick={startInterview}
              disabled={isLoading}
              className="neon-button w-full max-w-xs h-14 text-lg font-semibold"
            >
              {isLoading ? 'Starting...' : 'Start Hybrid Interview 🚀'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-primary">Hybrid Score - Essential Questions</h1>
                <p className="text-secondary">Quick assessment for your hybrid athlete score</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => navigate('/profile')}
                  className="neon-btn-secondary"
                  size="sm"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#08F0FF] to-[#FF2DDE] flex items-center justify-center mr-2">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  Profile
                </Button>
              </div>
            </div>

            {/* Sticky Progress Bar */}
            <div className="sticky top-0 z-10 bg-opacity-95 backdrop-blur-sm py-4 mb-8" style={{ background: 'rgba(0, 0, 0, 0.95)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-secondary font-medium">
                  Progress
                </span>
                <span className="text-sm text-muted">
                  {currentIndex} of {TOTAL_QUESTIONS} questions
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 neon-progress-bar">
                  <div 
                    className="neon-progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-primary min-w-[40px]">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Messages - with bottom padding for sticky input */}
            <div className="space-y-6 min-h-[400px] pb-32">
              {(() => {
                // Filter messages to only show first assistant message when multiple consecutive assistant messages exist
                const getDisplayMessages = (messages) => {
                  const filteredMessages = [];
                  let lastRole = null;
                  
                  for (const message of messages) {
                    // If this is an assistant message and the last message was also assistant, skip it
                    if (message.role === 'assistant' && lastRole === 'assistant') {
                      console.log('Skipping duplicate assistant message:', message.content.substring(0, 50) + '...');
                      continue;
                    }
                    
                    filteredMessages.push(message);
                    lastRole = message.role;
                  }
                  
                  return filteredMessages;
                };

                const displayMessages = getDisplayMessages(messages);
                return displayMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-6 rounded-2xl ${
                        message.role === 'user'
                          ? 'chat-bubble-user ml-16'
                          : 'chat-bubble-assistant mr-16'
                      }`}
                    >
                      <div className="text-base leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ));
              })()}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="chat-bubble-assistant p-6 rounded-2xl mr-16">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-secondary">Coach is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Sticky Input Area */}
            {!isCompleted && (
              <div className="fixed bottom-0 left-0 right-0 z-10 bg-opacity-95 backdrop-blur-sm border-t border-gray-700 p-6" style={{ background: 'rgba(0, 0, 0, 0.95)' }}>
                <div className="container mx-auto max-w-4xl">
                  <div className="flex space-x-4">
                    <textarea
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your answer here..."
                      className="neon-input flex-1 resize-none"
                      rows="2"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={isLoading || !currentMessage.trim()}
                      className="neon-button px-8 py-3 rounded-xl h-auto"
                    >
                      Send
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex space-x-3">
                      <Button
                        onClick={skipQuestion}
                        disabled={isLoading}
                        className="neon-btn-secondary text-sm px-4 py-2"
                      >
                        Skip
                      </Button>
                      <Button
                        onClick={forceComplete}
                        disabled={isLoading}
                        className="neon-btn-secondary text-sm px-4 py-2"
                      >
                        Finish Early
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Completion Loading */}
            {isCompleted && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ 
                background: 'rgba(0, 0, 0, 0.8)' 
              }}>
                <div className="glass-card max-w-md w-full mx-6 p-12 text-center">
                  <h2 className="text-3xl font-bold text-primary mb-6">
                    {redirectFailed ? 'Score Ready!' : 'Calculating Your Hybrid Score!'} 🎉
                  </h2>
                  <p className="text-secondary mb-8 leading-relaxed">
                    {redirectFailed 
                      ? 'Your hybrid score has been calculated and saved! Click below to view your results.'
                      : 'Thanks for completing the essential questions! We\'re now computing your Hybrid Athlete Score and will redirect you to your results.'
                    }
                  </p>
                  
                  {redirectFailed && completedProfileId ? (
                    <Button
                      onClick={() => {
                        navigate(`/hybrid-score/${completedProfileId}`);
                        // Also try direct navigation as backup
                        setTimeout(() => {
                          if (window.location.pathname !== `/hybrid-score/${completedProfileId}`) {
                            window.location.href = `/hybrid-score/${completedProfileId}`;
                          }
                        }, 100);
                      }}
                      className="neon-button mb-6"
                    >
                      View Your Score
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      <span className="text-sm text-muted">Coach is thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HybridInterviewFlow;