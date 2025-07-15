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
const TOTAL_QUESTIONS = 11; // Essential questions for hybrid score

const HybridInterviewFlow = () => {
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

  // Send the initial message to start the conversation
  const sendFirstMessage = async (sessionId) => {
    const userMessage = {
      role: 'user',
      content: "Let's get started",
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
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
      setCurrentIndex(response.data.current_index || 1);

    } catch (error) {
      console.error('Error sending first message:', error);
      toast({
        title: "Error starting conversation",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const sendMessage = async (messageContent = null) => {
    const content = messageContent || currentMessage.trim();
    
    if (!content || isLoading) return;

    // Debounce requests to prevent spam
    const now = Date.now();
    if (now - lastRequestTime < 1000) {
      return;
    }
    setLastRequestTime(now);

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
        // Navigate to the original AthleteProfile page to display scores
        setTimeout(() => {
          navigate('/paste');
        }, 2000); // Give a moment for the completion message to be seen
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Calculate section progress for better UX - Updated for 11-question system
  const getSectionInfo = (index) => {
    if (index <= 2) return { section: "Basic Info", sectionProgress: index, sectionTotal: 2 };
    if (index <= 5) return { section: "Body Metrics", sectionProgress: index - 2, sectionTotal: 3 };
    if (index <= 8) return { section: "Running Performance", sectionProgress: index - 5, sectionTotal: 3 };
    return { section: "Strength Performance", sectionProgress: index - 8, sectionTotal: 3 };
  };

  const sectionInfo = getSectionInfo(currentIndex);
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
        <Card className="neo-card">
          <div className="p-8">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold neo-primary">Hybrid Score - Essential Questions</h1>
                <p className="neo-text-secondary">Quick assessment for your hybrid athlete score</p>
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

            {/* Progress Bar */}
            <div className="mb-8">
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
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm neo-text-secondary">Typing...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {!isCompleted && (
              <div className="border-t border-gray-700 pt-6">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your answer here..."
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none"
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
            )}

            {/* Completion Message */}
            {isCompleted && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ 
                background: 'rgba(10, 11, 12, 0.8)' 
              }}>
                <div className="gradient-border max-w-md w-full mx-6">
                  <div className="gradient-border-inner p-12 text-center">
                    <h2 className="text-3xl font-bold neo-primary mb-6">
                      Hybrid Score Complete! 🎉
                    </h2>
                    <p className="neo-text-secondary mb-8 leading-relaxed">
                      Thanks for completing the essential questions! We're now computing your Hybrid Athlete Score.
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
        </Card>
      </div>
    </div>
  );
};

export default HybridInterviewFlow;