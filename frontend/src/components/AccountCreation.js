import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AccountCreation = () => {
  const { signUpWithEmail, signInWithEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState('');
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

    // Clear any previous messages
    setMessage('');

    // Validation
    if (!formData.email || !formData.password) {
      setMessage('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match.');
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

      setMessage('Account created successfully! Redirecting...');

      toast({
        title: "Account Created Successfully! 🎉",
        description: "Welcome to Hybrid Lab! Now let's collect your data.",
        duration: 3000,
      });

      // Navigate to hybrid score form after a short delay
      setTimeout(() => {
        navigate('/hybrid-score-form');
      }, 1000);

    } catch (error) {
      console.error('Error creating account:', error);
      setMessage(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8" style={{ background: '#0A0B0C' }}>
      <style jsx>{`
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
          color: #79CFF7;
        }
        .neo-card {
          background: #181B1D;
          border: 1px solid #1A1C1D;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
        .error-message {
          color: #FF4B4B;
          background: rgba(255, 75, 75, 0.1);
          border: 1px solid rgba(255, 75, 75, 0.2);
        }
        .success-message {
          color: #85E26E;
          background: rgba(133, 226, 110, 0.1);
          border: 1px solid rgba(133, 226, 110, 0.2);
        }
        .back-link {
          color: #79CFF7;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #79CFF7;
          border-radius: 8px;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
        }
        @media (max-width: 768px) {
          .neo-card {
            margin: 0 16px;
            padding: 24px 20px;
          }
          
          .neo-input {
            font-size: 16px; /* Prevent zoom on iOS */
            padding: 14px 16px;
            min-height: 48px;
          }
          
          .neo-btn-primary {
            font-size: 16px;
            padding: 14px 20px;
            min-height: 48px;
          }
        }
        
        @media (max-width: 480px) {
          h1 {
            font-size: 2.5rem !important;
            line-height: 1.1 !important;
          }
          
          h2 {
            font-size: 1.5rem !important;
          }
          
          .neo-card {
            margin: 0 12px;
            padding: 20px 16px;
          }
          
          .back-link {
            font-size: 14px;
            padding: 6px 12px;
          }
        }
      `}</style>
      
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home Link */}
        <div className="flex justify-center">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 neo-primary" style={{ lineHeight: '1.1' }}>
            Hybrid Lab
          </h1>
          <h2 className="text-2xl font-semibold neo-text-primary mb-2">
            Create Your Account
          </h2>
          <p className="neo-text-secondary">
            Join thousands of hybrid athletes tracking their performance
          </p>
        </div>
        
        {/* Account Creation Card */}
        <div className="neo-card rounded-xl p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold neo-text-primary mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="neo-input w-full"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isCreating}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold neo-text-primary mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="neo-input w-full"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isCreating}
                minLength={6}
              />
              <p className="text-xs neo-text-muted mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold neo-text-primary mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="neo-input w-full"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={isCreating}
                minLength={6}
              />
            </div>

            {message && (
              <div className={`text-sm text-center p-3 rounded-lg ${
                message.includes('error') || message.includes('Failed') || message.includes('must') || message.includes('not match')
                  ? 'error-message' 
                  : 'success-message'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isCreating}
              className="neo-btn-primary w-full py-3 text-lg font-semibold"
            >
              {isCreating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center pt-4 border-t border-gray-700">
            <p className="neo-text-secondary text-sm">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="neo-primary font-semibold hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs neo-text-muted">
            After creating your account, you'll complete the hybrid score form and see your results on the leaderboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountCreation;