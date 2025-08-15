import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import LoginPage from './components/LoginPage';
import AccountCreation from './components/AccountCreation';
import AthleteProfile from './components/AthleteProfile';
import InterviewFlow from './components/InterviewFlow';
import HybridInterviewFlow from './components/HybridInterviewFlow';
import HybridScoreForm from './components/HybridScoreForm';
import HybridScoreResults from './components/HybridScoreResults';
import ProfilePage from './components/ProfilePage';
import PublicProfileView from './components/PublicProfileView';
import UserProfileSettings from './components/UserProfileSettings';
import Leaderboard from './components/Leaderboard';
import DesignSystemPage from './components/DesignSystemPage';
import ShareCardStudio from './components/ShareCardStudio';
import Logout from './components/Logout';
import './App.css';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0B0C' }}>
        <div className="text-center">
          <div className="neo-primary text-xl">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/create-account" replace />;
  }
  
  return children;
}

// Main App Content
function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/auth" 
            element={user ? <Navigate to="/" replace /> : <AuthForm />} 
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" replace /> : <LoginPage />} 
          />
          <Route 
            path="/logout" 
            element={<Logout />} 
          />
          <Route 
            path="/leaderboard" 
            element={<Leaderboard />} 
          />
          <Route 
            path="/" 
            element={<HybridInterviewFlow />} 
          />
          <Route 
            path="/full-interview" 
            element={
              <ProtectedRoute>
                <InterviewFlow interviewType="full" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hybrid-interview" 
            element={<HybridInterviewFlow />}
          />
          <Route 
            path="/create-account" 
            element={user ? <Navigate to="/hybrid-score-form" replace /> : <AccountCreation />}
          />
          <Route 
            path="/hybrid-score-form" 
            element={<HybridScoreForm />}
          />
          <Route 
            path="/profile" 
            element={<ProfilePage />} 
          />
          <Route 
            path="/athlete/:userId" 
            element={<PublicProfileView />} 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <UserProfileSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hybrid-score/:profileId" 
            element={<HybridScoreResults />} 
          />
          <Route 
            path="/design-system" 
            element={<DesignSystemPage />} 
          />
          <Route 
            path="/interview" 
            element={
              <ProtectedRoute>
                <InterviewFlow />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/paste" 
            element={
              <ProtectedRoute>
                <AthleteProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;