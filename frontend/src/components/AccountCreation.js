import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Trophy, User, Mail, Lock, ArrowLeft } from 'lucide-react';

const AccountCreation = () => {
  const { signUpWithEmail, signInWithEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isCreating) return;

    // Validation
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      console.log('Creating new account...');
      
      const authResult = await signUpWithEmail(formData.email, formData.password);
      
      if (authResult.error) {
        throw new Error(authResult.error.message);
      }

      // Sign in the newly created user
      const signInResult = await signInWithEmail(formData.email, formData.password);
      
      if (signInResult.error) {
        throw new Error('Failed to sign in after account creation');
      }

      toast({
        title: "Account Created Successfully! 🎉",
        description: "Welcome to Hybrid House! Now let's collect your data.",
        duration: 3000,
      });

      // Navigate to hybrid score form
      navigate('/hybrid-score-form');

    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: "Account Creation Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <style jsx>{`
        .neon-button {
          background: linear-gradient(135deg, var(--neon-primary), var(--neon-secondary));
          color: #000000;
          border: none;
          font-weight: 600;
          transition: all 0.3s ease;
          text-shadow: none;
        }

        .neon-button:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 32px rgba(8, 240, 255, 0.4),
            0 4px 16px rgba(255, 45, 222, 0.3);
        }

        .neon-button:disabled {
          opacity: 0.6;
          transform: none;
          cursor: not-allowed;
        }

        .form-input {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--txt);
          padding: 12px 16px;
          font-size: 14px;
          transition: all 0.3s ease;
          width: 100%;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--neon-primary);
          box-shadow: 0 0 0 2px rgba(8, 240, 255, 0.2);
        }

        .back-button {
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--txt);
          padding: 8px 16px;
          font-size: 14px;
          transition: all 0.3s ease;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .back-button:hover {
          border-color: var(--neon-primary);
          color: var(--neon-primary);
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-gray-800" style={{ background: 'var(--bg)' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-6 h-6" style={{ color: 'var(--neon-primary)' }} />
              <h1 className="text-xl font-bold" style={{ color: 'var(--neon-primary)' }}>
                Create Your Account
              </h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="back-button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-md mx-auto">
          <Card className="p-8" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                   style={{ background: 'rgba(8, 240, 255, 0.1)', border: '2px solid var(--neon-primary)' }}>
                <User className="w-8 h-8" style={{ color: 'var(--neon-primary)' }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--txt)' }}>
                Join Hybrid House
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Create your account to start tracking your hybrid fitness score
              </p>
            </div>

            {/* Account Creation Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password *
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a secure password"
                  required
                  minLength={6}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Minimum 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--txt)' }}>
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirm Password *
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={isCreating}
                className="neon-button w-full py-3 text-base font-semibold"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account & Continue'
                )}
              </Button>

            </form>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                After creating your account, you'll be able to complete the hybrid score form and see your results on the leaderboard.
              </p>
            </div>

          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountCreation;