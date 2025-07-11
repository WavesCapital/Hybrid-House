import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const TOTAL_QUESTIONS = 48; // Updated to full interview system

const InterviewFlow = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scoreData, setScoreData] = useState(null);
  const [isComputingScore, setIsComputingScore] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const { user, session } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const progress = Math.min((currentIndex / TOTAL_QUESTIONS) * 100, 100);
  
  // Calculate section progress for better UX
  const getSectionInfo = (index) => {
    if (index <= 7) return { section: "Profile", sectionProgress: index, sectionTotal: 7 };
    if (index <= 13) return { section: "Goals", sectionProgress: index - 7, sectionTotal: 6 };
    if (index <= 19) return { section: "Training", sectionProgress: index - 13, sectionTotal: 6 };
    if (index <= 24) return { section: "History", sectionProgress: index - 19, sectionTotal: 5 };
    if (index <= 29) return { section: "Recovery", sectionProgress: index - 24, sectionTotal: 5 };
    if (index <= 30) return { section: "Metrics", sectionProgress: index - 29, sectionTotal: 1 };
    if (index <= 42) return { section: "Nutrition", sectionProgress: index - 30, sectionTotal: 12 };
    if (index <= 46) return { section: "Injuries", sectionProgress: index - 42, sectionTotal: 4 };
    if (index <= 52) return { section: "Brag Zone", sectionProgress: index - 46, sectionTotal: 6 };
    return { section: "Final", sectionProgress: index - 52, sectionTotal: 3 };
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

  const handleInterviewCompletion = async (profileId) => {
    setIsComputingScore(true);
    
    try {
      // Poll for score computation results
      const checkScore = async () => {
        const response = await axios.get(
          `${BACKEND_URL}/api/athlete-profiles/${profileId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );
        
        if (response.data.score_data) {
          setScoreData(response.data.score_data);
          setIsComputingScore(false);
          toast({
            title: "Score Ready! 🎉",
            description: "Your Hybrid Athlete Score has been computed.",
          });
        } else {
          // Continue polling
          setTimeout(checkScore, 3000);
        }
      };
      
      // Start polling after a short delay
      setTimeout(checkScore, 2000);
      
    } catch (error) {
      console.error('Error checking score:', error);
      setIsComputingScore(false);
      toast({
        title: "Score Computation Error",
        description: "There was an issue computing your score. Please try again.",
        variant: "destructive",
      });
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

      if (response.data.completed) {
        setIsCompleted(true);
        // Start score computation and display
        await handleInterviewCompletion(response.data.profile_id);
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
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Please log in to start your athlete profile interview.</p>
          <Button onClick={() => window.location.href = '/'} className="w-full">
            Return to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-background-primary/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold text-foreground">Hybrid House Interview</h1>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{sectionInfo.section}</span>
              {" • "}
              {currentIndex} of {TOTAL_QUESTIONS} questions
            </div>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Section {sectionInfo.sectionProgress}/{sectionInfo.sectionTotal} • {sectionInfo.section}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {!sessionId ? (
          <Card className="w-full max-w-2xl mx-auto p-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Welcome to Your Athlete Profile Interview
            </h2>
            <p className="text-muted-foreground mb-6 text-lg">
              I'm your Hybrid House Coach. I'll ask you a few quick questions to build your personalized athlete profile.
            </p>
            <Button
              onClick={startInterview}
              disabled={isLoading}
              className="w-full max-w-xs h-12 text-lg"
            >
              {isLoading ? 'Starting...' : 'Start Interview'}
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Messages */}
            <div className="space-y-4 min-h-[400px]">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-12'
                        : 'bg-surface-secondary text-foreground mr-12'
                    }`}
                  >
                    <p className="text-base leading-6 whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <div className="text-xs opacity-70 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface-secondary p-4 rounded-2xl mr-12">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {!isCompleted && (
              <div className="sticky bottom-0 bg-background-primary/80 backdrop-blur-sm border-t border-border pt-4">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your answer here..."
                      className="w-full p-3 border border-border rounded-xl bg-surface-secondary text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows="3"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      onClick={() => sendMessage()}
                      disabled={isLoading || !currentMessage.trim()}
                      className="h-12 px-6"
                    >
                      {isLoading ? 'Sending...' : 'Send'}
                    </Button>
                    <Button
                      onClick={skipQuestion}
                      disabled={isLoading}
                      variant="outline"
                      className="h-12 px-6"
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Score Display */}
            {scoreData && (
              <div className="fixed inset-0 bg-background-primary z-50 overflow-y-auto">
                <div className="container mx-auto px-4 py-6 max-w-4xl">
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary mb-2">
                      Your Hybrid Athlete Score
                    </h1>
                    <p className="text-xl text-muted-foreground">
                      Complete analysis of your athletic profile
                    </p>
                  </div>
                  
                  {/* Score cards would go here - using the existing AthleteProfile component structure */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(scoreData).map(([key, value]) => (
                      <Card key={key} className="p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <div className="text-2xl font-bold text-primary">
                          {typeof value === 'number' ? Math.round(value) : value}
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="text-center mt-8">
                    <Button 
                      onClick={() => window.location.href = '/'}
                      className="w-full max-w-xs h-12"
                    >
                      Return to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Score Computing Loading */}
            {isComputingScore && (
              <div className="fixed inset-0 bg-background-primary/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <Card className="w-full max-w-md p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <h2 className="text-2xl font-bold text-primary mb-4">
                    Computing Your Score! 🚀
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    We're analyzing your profile and calculating your Hybrid Athlete Score. This usually takes about 30 seconds.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Please wait while we crunch the numbers...
                  </div>
                </Card>
              </div>
            )}

            {/* Completion Message */}
            {isCompleted && !isComputingScore && !scoreData && (
              <Card className="w-full max-w-2xl mx-auto p-8 text-center">
                <h2 className="text-2xl font-bold text-primary mb-4">
                  Interview Complete! 🎉
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your athlete profile has been created and we're computing your Hybrid Athlete Score. 
                  You'll see your results in just a moment.
                </p>
                <div className="animate-pulse">
                  <div className="h-2 bg-primary rounded-full"></div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewFlow;