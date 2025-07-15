import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Target, AlertCircle, Dumbbell, Zap, Heart, MapPin, 
  BarChart3, Activity, Moon, Scale, CheckCircle, Loader2 
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const TOTAL_QUESTIONS = 11; // Essential questions for hybrid score

const HybridInterviewFlow = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [showStreakBadge, setShowStreakBadge] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState(null);
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Trigger webhook for score calculation
  const triggerWebhookForScore = async (athleteProfileData, profileId) => {
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
      
      // Store score data in Supabase
      await storeScoreDataInSupabase(scoreData, profileId);
      
      // Redirect to score results page using the profileId parameter
      if (profileId) {
        console.log('Redirecting to /hybrid-score/' + profileId);
        navigate(`/hybrid-score/${profileId}`);
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
        console.error('Webhook request timed out after 2.5 minutes');
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
      setIsCalculatingScore(false);
    }
  };

  // Store score data in Supabase
  const storeScoreDataInSupabase = async (scoreData, profileId) => {
    try {
      if (!profileId) {
        console.error('No profile ID available to store score data');
        return;
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
      
    } catch (error) {
      console.error('Error storing score data in Supabase:', error);
      toast({
        title: "Warning",
        description: "Score calculated but may not be saved. Please contact support if this persists.",
        variant: "destructive",
      });
    }
  };

  // Confetti animation function
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#79CFF7', '#4FC3F7', '#D9D9D9', '#9FA1A3']
    });
  };

  // Streak animation function
  const triggerStreakAnimation = () => {
    setShowStreakBadge(true);
    setTimeout(() => setShowStreakBadge(false), 3000);
    
    // Fire streak confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.4 },
      colors: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1']
    });
  };

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

  // Send message
  const sendMessage = async (messageContent = null) => {
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

      // Handle confetti milestones
      if (response.data.milestone_detected) {
        setTimeout(() => {
          triggerConfetti();
          toast({
            title: "Milestone Reached! 🎉",
            description: `Great progress! You're ${Math.round((response.data.current_index / TOTAL_QUESTIONS) * 100)}% done!`,
          });
        }, 1000);
      }

      // Handle streak detection
      if (response.data.streak_detected) {
        setStreakCount(prev => prev + 1);
        setTimeout(() => {
          triggerStreakAnimation();
          toast({
            title: "Streak Bonus! 🔥",
            description: "You're on fire! Keep the momentum going!",
          });
        }, 1000);
      }

      // Update streak count based on user message
      if (content.toLowerCase() !== 'skip') {
        setStreakCount(prev => prev + 1);
      } else {
        setStreakCount(0);
      }

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
  };

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

  // Calculate section progress for better UX - Updated for 11-question system
  const progress = Math.min((currentIndex / TOTAL_QUESTIONS) * 100, 100);

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
        .neo-progress-bar {
          height: 8px;
          background: rgba(159, 161, 163, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }
        .neo-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #79CFF7 0%, #4FC3F7 100%);
          transition: width 0.3s ease;
        }
        .chat-bubble-user {
          background: linear-gradient(135deg, #79CFF7 0%, #4FC3F7 100%);
          color: #0A0B0C;
          font-weight: 500;
        }
        .chat-bubble-assistant {
          background: linear-gradient(135deg, rgba(217, 217, 217, 0.1) 0%, rgba(159, 161, 163, 0.05) 100%);
          border: 1px solid rgba(217, 217, 217, 0.2);
          color: #D9D9D9;
          backdrop-filter: blur(10px);
        }
        .gradient-border {
          padding: 2px;
          background: linear-gradient(135deg, #79CFF7 0%, #4FC3F7 50%, #D9D9D9 100%);
          border-radius: 12px;
        }
        .gradient-border-inner {
          background: #181B1D;
          border-radius: 11px;
          height: 100%;
        }
        .streak-badge {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(45deg, #FF6B6B, #FFE66D);
          color: white;
          padding: 20px 40px;
          border-radius: 50px;
          font-size: 24px;
          font-weight: bold;
          box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
          animation: streak-bounce 0.6s ease-out;
          z-index: 1000;
        }
        @keyframes streak-bounce {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        .mono-progress {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          letter-spacing: 1px;
        }
        `}
      </style>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {!sessionId ? (
          <div className="gradient-border max-w-2xl mx-auto">
            <div className="gradient-border-inner p-12 text-center">
              <h2 className="text-4xl font-bold neo-primary mb-6">
                Ready for Your Hybrid Score?
              </h2>
              <p className="neo-text-secondary mb-8 text-lg leading-relaxed">
                I'm your high-energy Hybrid House Coach! I'll ask you just 11 essential questions to 
                calculate your Hybrid Score quickly. This focused assessment covers the core metrics 
                that matter most. Takes about 3 minutes. Let's get your score! 🏃‍♂️💪
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 neo-text-secondary">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>11 essential questions only</span>
                </div>
                <div className="flex items-center space-x-3 neo-text-secondary">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Auto-save your progress</span>
                </div>
                <div className="flex items-center space-x-3 neo-text-secondary">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Skip any question anytime</span>
                </div>
              </div>
              
              <Button
                onClick={startInterview}
                disabled={isLoading}
                className="neo-btn-primary w-full max-w-xs h-14 text-lg font-semibold"
              >
                {isLoading ? 'Starting...' : 'Start Hybrid Interview 🚀'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold neo-primary">Hybrid Score - Essential Questions</h1>
                <p className="neo-text-secondary">Quick assessment for your hybrid athlete score</p>
              </div>
            </div>

            {/* Sticky Progress Bar */}
            <div className="sticky top-0 z-10 bg-opacity-95 backdrop-blur-sm py-4 mb-8" style={{ background: 'rgba(10, 11, 12, 0.95)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm neo-text-secondary font-medium">
                  Progress
                </span>
                <span className="text-sm neo-text-muted">
                  {currentIndex} of {TOTAL_QUESTIONS} questions
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 neo-progress-bar">
                  <div 
                    className="neo-progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold neo-primary min-w-[40px]">
                  {Math.round(progress)}%
                </span>
                {streakCount >= 3 && (
                  <div className="flex items-center space-x-1 text-xs neo-text-secondary">
                    <span>🔥</span>
                    <span>{streakCount}</span>
                  </div>
                )}
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
                      <span className="text-sm neo-text-secondary">Coach is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Sticky Input Area */}
            {!isCompleted && (
              <div className="fixed bottom-0 left-0 right-0 z-10 bg-opacity-95 backdrop-blur-sm border-t border-gray-700 p-6" style={{ background: 'rgba(10, 11, 12, 0.95)' }}>
                <div className="container mx-auto max-w-4xl">
                  <div className="flex space-x-4">
                    <textarea
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your answer here..."
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                      rows="2"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={isLoading || !currentMessage.trim()}
                      className="neo-btn-primary px-8 py-3 rounded-xl h-auto"
                    >
                      Send
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex space-x-3">
                      <Button
                        onClick={skipQuestion}
                        disabled={isLoading}
                        className="neo-btn-secondary text-sm px-4 py-2"
                      >
                        Skip
                      </Button>
                      <Button
                        onClick={forceComplete}
                        disabled={isLoading}
                        className="neo-btn-secondary text-sm px-4 py-2"
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
                background: 'rgba(10, 11, 12, 0.8)' 
              }}>
                <div className="gradient-border max-w-md w-full mx-6">
                  <div className="gradient-border-inner p-12 text-center">
                    <h2 className="text-3xl font-bold neo-primary mb-6">
                      Calculating Your Hybrid Score! 🎉
                    </h2>
                    <p className="neo-text-secondary mb-8 leading-relaxed">
                      Thanks for completing the essential questions! We're now computing your Hybrid Athlete Score and will redirect you to your results.
                    </p>
                    <div className="flex items-center justify-center space-x-3">
                      <Loader2 className="h-6 w-6 neo-cyan animate-spin" />
                      <span className="text-sm neo-text-muted">Analyzing your profile...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Streak Badge Overlay */}
            {showStreakBadge && (
              <div className="streak-badge">
                🔥 {streakCount} Streak! 🔥
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HybridInterviewFlow;