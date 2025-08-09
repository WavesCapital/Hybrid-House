import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const TOTAL_QUESTIONS = 55; // Updated to new 55-question system

const InterviewFlow = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [showStreakBadge, setShowStreakBadge] = useState(false);
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const progress = Math.min((currentIndex / TOTAL_QUESTIONS) * 100, 100);
  
  // Calculate section progress for better UX - Updated for 55-question system
  const getSectionInfo = (index) => {
    if (index <= 7) return { section: "Identity", sectionProgress: index, sectionTotal: 7 };
    if (index <= 12) return { section: "Motivation", sectionProgress: index - 7, sectionTotal: 5 };
    if (index <= 18) return { section: "Set-up", sectionProgress: index - 12, sectionTotal: 6 };
    if (index <= 23) return { section: "Backstory", sectionProgress: index - 18, sectionTotal: 5 };
    if (index <= 28) return { section: "Recovery", sectionProgress: index - 23, sectionTotal: 5 };
    if (index <= 29) return { section: "Body Metrics", sectionProgress: index - 28, sectionTotal: 1 };
    if (index <= 41) return { section: "Fuel & Kitchen", sectionProgress: index - 29, sectionTotal: 12 };
    if (index <= 45) return { section: "Injuries & Mileage", sectionProgress: index - 41, sectionTotal: 4 };
    if (index <= 52) return { section: "Brag Zone", sectionProgress: index - 45, sectionTotal: 7 };
    return { section: "Sign-off", sectionProgress: index - 52, sectionTotal: 3 };
  };
  
  const sectionInfo = getSectionInfo(currentIndex);

  // Start interview session
  const startInterview = async () => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start your interview.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/interview/start`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSessionId(response.data.session_id);
      setMessages(response.data.messages.filter(m => m.role !== 'system'));
      setCurrentIndex(response.data.current_index);
      
      toast({
        title: "Interview Started",
        description: response.data.status === 'resumed' ? "Resuming your previous interview..." : "Let's build your athlete profile!",
      });
      
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
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
        `${BACKEND_URL}/api/interview/chat`,
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
        // Navigate to the original AthleteProfile page to display scores
        setTimeout(() => {
          navigate('/paste');
        }, 2000); // Give a moment for the completion message to be seen
      }

      // Auto-save toast
      toast({
        title: "Answers auto-saved ✓",
        description: "Your progress has been saved.",
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Skip current question
  const skipQuestion = () => {
    if (isLoading) return;
    
    // Prevent rapid successive requests
    const now = Date.now();
    if (now - lastRequestTime < 1000) {
      console.log('Skip request too soon, ignoring...');
      return;
    }
    
    sendMessage('skip');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0B0C' }}>
        <Card className="w-full max-w-md p-8 text-center neo-card">
          <h2 className="text-2xl font-bold text-primary mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Please log in to start your athlete profile interview.</p>
          <Button onClick={() => window.location.href = '/'} className="w-full neo-btn-primary">
            Return to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0B0C' }}>
      <style jsx>{`
        .neo-text-primary { color: #D9D9D9; }
        .neo-text-secondary { color: #9FA1A3; }
        .neo-text-muted { color: #6B6E71; }
        .neo-primary { color: #79CFF7; }
        .neo-card {
          background: #181B1D;
          border: 1px solid #1A1C1D;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(8px);
        }
        .neo-input {
          background: #0F1112;
          border: 1px solid #1A1C1D;
          color: #D9D9D9;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 16px;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
        }
        .neo-input:focus {
          outline: none;
          border-color: #79CFF7;
          box-shadow: 0 0 0 3px rgba(121, 207, 247, 0.15);
        }
        .neo-btn-primary {
          background: rgba(121, 207, 247, 0.2);
          color: #79CFF7;
          border: 2px solid #79CFF7;
          border-radius: 8px;
          padding: 12px 20px;
          font-weight: 600;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 0 12px rgba(121, 207, 247, 0.25);
          backdrop-filter: blur(8px);
        }
        .neo-btn-primary:hover {
          background: rgba(121, 207, 247, 0.3);
          box-shadow: 0 0 20px rgba(121, 207, 247, 0.4);
          transform: translateY(-1px);
        }
        .neo-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .neo-btn-secondary {
          background: rgba(159, 161, 163, 0.1);
          color: #9FA1A3;
          border: 1px solid #1A1C1D;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 500;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
          backdrop-filter: blur(8px);
        }
        .neo-btn-secondary:hover {
          background: rgba(159, 161, 163, 0.15);
          border-color: #79CFF7;
        }
        .neo-progress-bar {
          background: #0F1112;
          border-radius: 8px;
          overflow: hidden;
          height: 8px;
        }
        .neo-progress-fill {
          background: linear-gradient(90deg, #79CFF7, #4FC3F7);
          height: 100%;
          transition: width 0.3s ease;
          box-shadow: 0 0 8px rgba(121, 207, 247, 0.3);
        }
        .chat-bubble-user {
          background: rgba(121, 207, 247, 0.15);
          color: #79CFF7;
          border: 1px solid rgba(121, 207, 247, 0.3);
          backdrop-filter: blur(8px);
        }
        .chat-bubble-assistant {
          background: #181B1D;
          color: #D9D9D9;
          border: 1px solid #1A1C1D;
          backdrop-filter: blur(8px);
        }
        .loading-dots {
          animation: loading-dots 1.5s infinite;
        }
        @keyframes loading-dots {
          0%, 60%, 100% { transform: scale(1); opacity: 0.4; }
          30% { transform: scale(1.2); opacity: 1; }
        }
        .gradient-border {
          background: linear-gradient(45deg, #79CFF7, #4FC3F7);
          padding: 1px;
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
      `}</style>
      {/* Header with Progress */}
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b" style={{ 
        background: 'rgba(24, 27, 29, 0.8)', 
        borderColor: '#1A1C1D' 
      }}>
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold neo-primary">Hybrid Lab Interview</h1>
              <p className="neo-text-secondary">Building your personalized athlete profile</p>
            </div>
            <div className="text-right">
              <div className="text-sm neo-text-secondary mb-1">
                {sectionInfo.section} • {currentIndex} of {TOTAL_QUESTIONS}
              </div>
              <div className="text-xs neo-text-muted">
                Section {sectionInfo.sectionProgress}/{sectionInfo.sectionTotal}
              </div>
            </div>
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
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {!sessionId ? (
          <div className="gradient-border max-w-2xl mx-auto">
            <div className="gradient-border-inner p-12 text-center">
              <h2 className="text-4xl font-bold neo-primary mb-6">
                Ready to Build Your Profile?
              </h2>
              <p className="neo-text-secondary mb-8 text-lg leading-relaxed">
                I'm your high-energy Hybrid Lab Coach! I'll ask you ~55 quick questions to build your 
                personalized athlete profile and compute your Hybrid Score. We'll chat about your training, 
                goals, and what makes you tick. Most athletes finish in about 8 minutes. Ready to roll? 💪
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 neo-text-secondary">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Intelligent conversation flow</span>
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
                {isLoading ? 'Starting...' : 'Start Interview 🚀'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Messages */}
            <div className="space-y-6 min-h-[400px] pb-6">
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
                      <div className="text-xs opacity-60 mt-3">
                        {new Date(message.timestamp).toLocaleTimeString()}
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
                        <div className="w-2 h-2 bg-primary rounded-full loading-dots"></div>
                        <div className="w-2 h-2 bg-primary rounded-full loading-dots" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full loading-dots" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className="neo-text-secondary text-sm">Coach is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {!isCompleted && (
              <div className="sticky bottom-0 backdrop-blur-lg border-t pt-6" style={{ 
                background: 'rgba(10, 11, 12, 0.9)', 
                borderColor: '#1A1C1D' 
              }}>
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <textarea
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your answer here..."
                      className="neo-input w-full resize-none"
                      rows="3"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex flex-col space-y-3">
                    <Button
                      onClick={() => sendMessage()}
                      disabled={isLoading || !currentMessage.trim()}
                      className="neo-btn-primary h-12 px-8"
                    >
                      {isLoading ? 'Sending...' : 'Send'}
                    </Button>
                    <Button
                      onClick={skipQuestion}
                      disabled={isLoading}
                      className="neo-btn-secondary h-10 px-6"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={() => sendMessage('FORCE_COMPLETE')}
                      disabled={isLoading}
                      className="neo-btn-secondary h-8 px-4 text-xs"
                    >
                      Finish Early
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Completion Message */}
            {isCompleted && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ 
                background: 'rgba(10, 11, 12, 0.8)' 
              }}>
                <div className="gradient-border max-w-md w-full mx-6">
                  <div className="gradient-border-inner p-12 text-center">
                    <h2 className="text-3xl font-bold neo-primary mb-6">
                      Interview Complete! 🎉
                    </h2>
                    <p className="neo-text-secondary mb-8 leading-relaxed">
                      Thanks for completing your profile! We're now computing your Hybrid Athlete Score.
                      Redirecting you to the score page...
                    </p>
                    <div className="text-sm neo-text-muted">
                      Taking you to your results in a moment...
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

      {/* Streak Badge Overlay */}
      {showStreakBadge && (
        <div className="streak-badge">
          🔥 {streakCount} Streak! 🔥
        </div>
      )}
    </div>
  );
};

export default InterviewFlow;