import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home as HomeIcon, User, Trophy, Home, LogOut, Eye, Settings, 
  ChevronDown, ArrowLeft, Menu, X 
} from 'lucide-react';

const SharedHeader = ({ 
  title = null,
  contextualActions = []
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleViewPublicProfile = () => {
    if (user?.id) {
      navigate(`/athlete/${user.id}`);
    }
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    navigate('/logout');
    setIsDropdownOpen(false);
  };

  const isCurrentPage = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <style jsx>{`
        .header-gradient {
          background: #0E0E11;
          backdrop-filter: blur(20px);
        }
        
        .brand-text {
          color: #08F0FF;
        }
        
        .nav-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .nav-button:hover {
          transform: translateY(-1px);
        }
        
        .nav-button.active {
          background: rgba(8, 240, 255, 0.1);
          border-color: rgba(8, 240, 255, 0.3);
          color: #08F0FF;
        }
        
        .nav-button.active::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #08F0FF;
        }
        
        .dropdown-menu {
          animation: slideDown 0.2s ease-out;
          transform-origin: top;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scaleY(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }
        
        .mobile-menu {
          animation: slideInRight 0.3s ease-out;
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .mobile-overlay {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .desktop-nav {
            display: none;
          }
          
          .mobile-nav {
            display: flex;
          }
        }
        
        @media (min-width: 769px) {
          .desktop-nav {
            display: flex;
          }
          
          .mobile-nav {
            display: none;
          }
        }
      `}</style>

      {/* Header */}
      <header className="header-gradient border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            
            {/* Left Side - Brand/Title */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Brand/Logo */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div 
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center cursor-pointer nav-button bg-gray-800 hover:bg-gray-700"
                  onClick={() => navigate('/')}
                >
                  <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#08F0FF]" />
                </div>
                <div>
                  <h1 
                    className="text-lg sm:text-xl font-bold brand-text cursor-pointer"
                    onClick={() => navigate('/')}
                  >
                    Hybrid House
                  </h1>
                  {title && (
                    <p className="text-xs sm:text-sm text-gray-400">{title}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Desktop Navigation */}
            <div className="desktop-nav items-center space-x-3 sm:space-x-4">
              {/* Contextual Actions */}
              {contextualActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`nav-button px-3 py-2 text-sm border rounded-lg transition-colors flex items-center gap-2 ${action.variant === 'primary' 
                    ? 'bg-[#08F0FF] text-black hover:bg-[#08F0FF]/90 border-[#08F0FF]' 
                    : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {action.icon}
                  <span className="hidden lg:inline">{action.label}</span>
                </button>
              ))}

              {user ? (
                <>
                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`nav-button w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all bg-gray-800 hover:bg-gray-700 ${
                        isCurrentPage('/profile') ? 'active' : ''
                      }`}
                    >
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-black border border-gray-700 rounded-lg shadow-lg z-50">
                        <div className="py-2">
                          <button
                            onClick={() => {
                              navigate('/profile');
                              setIsDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Profile Settings
                          </button>
                          <button
                            onClick={handleViewPublicProfile}
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Public Profile
                          </button>
                          <div className="border-t border-gray-700 my-1"></div>
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Login Button */}
                  <button
                    onClick={() => navigate('/login')}
                    className="nav-button px-3 py-2 text-sm border border-[#08F0FF] rounded-lg text-[#08F0FF] hover:bg-[#08F0FF]/10 transition-colors"
                  >
                    Log In
                  </button>

                  {/* Sign Up Button */}
                  <button
                    onClick={() => navigate('/create-account')}
                    className="nav-button px-3 py-2 text-sm bg-[#08F0FF] rounded-lg text-black hover:bg-[#08F0FF]/90 transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Navigation Button */}
            <div className="mobile-nav">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="nav-button p-2 border border-gray-600 rounded-lg text-gray-300 hover:border-[#08F0FF] hover:text-[#08F0FF]"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="mobile-overlay fixed inset-0 bg-black/80 z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="mobile-menu fixed top-0 right-0 h-full w-80 bg-black border-l border-gray-700 z-50 md:hidden">
            <div className="p-4">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800">
                    <HomeIcon className="w-5 h-5 text-[#08F0FF]" />
                  </div>
                  <h2 className="text-lg font-bold brand-text">Hybrid House</h2>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Menu Items */}
              <div className="space-y-2">
                {/* Contextual Actions */}
                {contextualActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${action.variant === 'primary' 
                      ? 'bg-[#08F0FF] text-black hover:bg-[#08F0FF]/90' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}

                {user ? (
                  <>
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        isCurrentPage('/profile') ? 'bg-[#08F0FF]/10 text-[#08F0FF]' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Settings className="w-5 h-5" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        handleViewPublicProfile();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3"
                    >
                      <Eye className="w-5 h-5" />
                      View Public Profile
                    </button>
                    <div className="border-t border-white/10 my-2"></div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="w-5 h-5" />
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        navigate('/leaderboard');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        isCurrentPage('/leaderboard') ? 'bg-[#08F0FF]/10 text-[#08F0FF]' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Trophy className="w-5 h-5" />
                      Leaderboard
                    </button>
                    <div className="border-t border-white/10 my-2"></div>
                    <button
                      onClick={() => {
                        navigate('/login');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg border border-[#08F0FF] text-[#08F0FF] hover:bg-[#08F0FF]/10 transition-colors flex items-center gap-3"
                    >
                      <User className="w-5 h-5" />
                      Log In
                    </button>
                    <button
                      onClick={() => {
                        navigate('/create-account');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg bg-[#08F0FF] text-black hover:bg-[#08F0FF]/90 transition-colors flex items-center gap-3"
                    >
                      <User className="w-5 h-5" />
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SharedHeader;