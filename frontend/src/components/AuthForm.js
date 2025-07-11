import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let result;
      if (isLogin) {
        result = await signInWithEmail(email, password);
      } else {
        result = await signUpWithEmail(email, password);
      }

      if (result.error) {
        setMessage(result.error.message);
      } else {
        if (!isLogin) {
          // With email confirmation disabled, user should be signed in immediately
          setMessage('Account created successfully! Redirecting...');
          setTimeout(() => {
            // The auth context will handle the redirect automatically
          }, 1000);
        } else {
          setMessage('Welcome back! Redirecting...');
        }
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: '#0A0B0C' }}>
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
        }
        .success-message {
          color: #85E26E;
        }
      `}</style>
      
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 neo-primary" style={{ lineHeight: '1.1' }}>
            Hybrid House
          </h1>
          <h2 className="text-2xl font-semibold neo-text-primary mb-2">
            {isLogin ? 'Welcome back' : 'Join the community'}
          </h2>
          <p className="neo-text-secondary">
            {isLogin ? 'Sign in to access your hybrid athlete profile' : 'Create your account to get started'}
          </p>
        </div>
        
        {/* Auth Card */}
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
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
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
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                className="neo-input w-full"
                placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {!isLogin && (
                <p className="mt-2 text-xs neo-text-muted">
                  Password should be at least 6 characters long
                </p>
              )}
            </div>

            {message && (
              <div className={`text-sm text-center p-3 rounded-lg ${
                message.includes('error') || message.includes('Invalid') || message.includes('not') 
                  ? 'error-message bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20' 
                  : 'success-message bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="neo-btn-primary w-full py-3 text-lg font-semibold"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="text-center pt-4 border-t border-gray-700">
            <button
              type="button"
              className="neo-text-secondary hover:neo-primary transition-colors duration-200 text-sm font-medium"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage('');
                setEmail('');
                setPassword('');
              }}
              disabled={loading}
            >
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <span className="neo-primary font-semibold">
                {isLogin ? 'Sign up' : 'Sign in'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs neo-text-muted">
            By {isLogin ? 'signing in' : 'creating an account'}, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}