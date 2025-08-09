import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Logout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('🚪 Logging out user...');
        
        // Clear any stored authentication data
        localStorage.clear();
        sessionStorage.clear();
        
        // Sign out from Supabase
        await signOut();
        
        console.log('✅ Logout completed');
        
        // Redirect to home page after logout
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      } catch (error) {
        console.error('❌ Error during logout:', error);
        // Still redirect even if logout fails
        navigate('/', { replace: true });
      }
    };

    performLogout();
  }, [signOut, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0E0E11' }}>
      <div className="glass-card max-w-md w-full mx-6 p-12 text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#08F0FF] to-[#00FF88] rounded-full mx-auto mb-6">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--txt)' }}>
          Signing You Out...
        </h2>
        <p className="mb-8 leading-relaxed" style={{ color: 'var(--muted)' }}>
          Thanks for using Hybrid House! You're being signed out safely.
        </p>
      </div>
    </div>
  );
};

export default Logout;