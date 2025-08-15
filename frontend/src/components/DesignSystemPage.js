import React, { useState } from 'react';
import { User, Activity, Target, Dumbbell, Info, Heart, Zap, Award } from 'lucide-react';

const DesignSystemPage = () => {
  const [selectedPill, setSelectedPill] = useState('Apple Watch');
  const [formValues, setFormValues] = useState({
    name: 'Alex Thompson',
    email: 'alex.thompson@hybridlab.io',
    weight: '185',
    vo2max: '58'
  });

  const handleInputChange = (field, value) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen" style={{ background: '#0E0E11' }}>
      <style>
        {`
        /* Unified Design System */
        :root {
          --bg: #0E0E11;
          --card: #15161A;
          --card-secondary: #1A1B20;
          --border: #1F2025;
          --border-subtle: #2A2B30;
          --txt: #F5FAFF;
          --txt-muted: #8D9299;
          --txt-subtle: #6B7280;
          --neon-primary: #08F0FF;
          --neon-secondary: #00FF88;
          --neon-accent: #FFA42D;
          --gradient-primary: linear-gradient(135deg, #08F0FF 0%, #0EA5E9 100%);
          --shadow-glow: 0 0 20px rgba(8, 240, 255, 0.15);
          --shadow-glow-hover: 0 0 30px rgba(8, 240, 255, 0.25);
        }

        .design-system-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .design-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .design-title {
          color: var(--txt);
          font-size: 48px;
          font-weight: 700;
          margin: 0 0 16px 0;
          letter-spacing: -0.02em;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .design-subtitle {
          color: var(--txt-muted);
          font-size: 20px;
          margin: 0;
          font-weight: 400;
        }

        .design-section {
          margin-bottom: 80px;
        }

        .section-header {
          margin-bottom: 40px;
        }

        .section-title {
          color: var(--neon-primary);
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }

        .section-description {
          color: var(--txt-muted);
          font-size: 16px;
          margin: 0;
          line-height: 1.6;
        }

        /* Color Palette */
        .color-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }

        .color-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .color-card:hover {
          transform: translateY(-4px);
          border-color: var(--neon-primary);
          box-shadow: var(--shadow-glow);
        }

        .color-swatch {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          margin: 0 auto 16px;
          border: 2px solid var(--border-subtle);
        }

        .color-name {
          color: var(--txt);
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .color-value {
          color: var(--txt-muted);
          font-size: 14px;
          font-family: 'Courier New', monospace;
          margin: 0;
        }

        /* Typography */
        .typography-sample {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
        }

        .h1-sample { font-size: 48px; font-weight: 700; color: var(--txt); margin: 0 0 8px 0; letter-spacing: -0.02em; }
        .h2-sample { font-size: 32px; font-weight: 700; color: var(--neon-primary); margin: 0 0 8px 0; }
        .h3-sample { font-size: 28px; font-weight: 700; color: var(--txt); margin: 0 0 8px 0; }
        .h4-sample { font-size: 20px; font-weight: 600; color: var(--txt); margin: 0 0 8px 0; }
        .body-sample { font-size: 16px; font-weight: 400; color: var(--txt-muted); margin: 0; line-height: 1.6; }

        /* Assessment Sections */
        .assessment-section {
          background: var(--card-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          transition: all 0.4s ease;
          box-shadow: var(--shadow-glow);
        }

        .assessment-section:hover {
          border-color: var(--neon-primary);
          box-shadow: var(--shadow-glow-hover);
          transform: translateY(-2px);
        }

        .mock-section-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .mock-section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--gradient-primary);
          color: #000000;
        }

        .mock-section-title {
          color: var(--txt);
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .mock-section-subtitle {
          color: var(--txt-muted);
          font-size: 16px;
          margin: 4px 0 0 0;
          font-weight: 400;
        }

        /* Form Controls */
        .form-showcase {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 32px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--txt);
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .required-indicator {
          color: var(--neon-primary);
          font-size: 18px;
        }

        .optional-indicator {
          color: var(--txt-subtle);
          font-size: 14px;
          font-weight: 400;
          font-style: italic;
          margin-left: 8px;
        }

        .form-description {
          color: var(--txt-muted);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .form-description-highlight {
          color: var(--neon-primary);
          font-weight: 600;
        }

        .form-input {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--txt);
          padding: 16px;
          font-size: 16px;
          transition: all 0.3s ease;
          width: 100%;
          font-weight: 400;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--neon-primary);
          box-shadow: 0 0 0 3px rgba(8, 240, 255, 0.1);
          background: var(--card-secondary);
        }

        .form-select {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--txt);
          padding: 16px;
          font-size: 16px;
          transition: all 0.3s ease;
          width: 100%;
          cursor: pointer;
          font-weight: 400;
        }

        .form-select:focus {
          outline: none;
          border-color: var(--neon-primary);
          box-shadow: 0 0 0 3px rgba(8, 240, 255, 0.1);
          background: var(--card-secondary);
        }

        /* Pills */
        .pills-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 12px;
        }

        .pill-chip {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 25px;
          color: var(--txt);
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 40px;
        }

        .pill-chip:hover {
          border-color: var(--neon-primary);
          background: rgba(8, 240, 255, 0.05);
          transform: translateY(-1px);
        }

        .pill-chip.selected {
          background: var(--neon-primary);
          color: #000000;
          border-color: var(--neon-primary);
          box-shadow: var(--shadow-glow);
        }

        /* Buttons */
        .buttons-showcase {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          align-items: start;
        }

        .button-primary {
          background: var(--neon-primary);
          color: #000000;
          border: none;
          border-radius: 12px;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 
            0 0 20px rgba(8, 240, 255, 0.4),
            0 0 40px rgba(8, 240, 255, 0.2),
            0 4px 16px rgba(8, 240, 255, 0.3);
        }

        .button-primary:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 0 30px rgba(8, 240, 255, 0.6),
            0 0 60px rgba(8, 240, 255, 0.3),
            0 8px 32px rgba(8, 240, 255, 0.4);
        }

        .button-secondary {
          background: var(--card);
          color: var(--txt);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .button-secondary:hover {
          border-color: var(--neon-primary);
          background: rgba(8, 240, 255, 0.05);
          transform: translateY(-1px);
        }

        /* Tips */
        .device-tips {
          background: rgba(0, 255, 136, 0.06);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-top: 12px;
        }

        .device-tips-header {
          color: var(--neon-secondary);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .device-tip-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }

        .device-tip-device {
          color: var(--neon-secondary);
          font-weight: 600;
          font-size: 13px;
        }

        .device-tip-instruction {
          color: var(--txt);
          font-size: 13px;
          line-height: 1.5;
          padding-left: 12px;
          border-left: 2px solid rgba(0, 255, 136, 0.3);
        }

        .app-tips {
          background: rgba(255, 164, 45, 0.06);
          border: 1px solid rgba(255, 164, 45, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-top: 12px;
        }

        .app-tips-header {
          color: var(--neon-accent);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .app-tip-instruction {
          color: var(--txt);
          font-size: 14px;
          line-height: 1.6;
        }

        /* Welcome Message */
        .welcome-message {
          background: rgba(8, 240, 255, 0.06);
          border: 1px solid rgba(8, 240, 255, 0.2);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .welcome-icon {
          color: var(--neon-primary);
          margin-top: 2px;
        }

        .welcome-content h3 {
          color: var(--neon-primary);
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .welcome-content p {
          color: var(--txt);
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }

        .stat-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: var(--neon-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow);
        }

        .stat-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: var(--gradient-primary);
          color: #000000;
          margin-bottom: 16px;
        }

        .stat-value {
          color: var(--neon-primary);
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .stat-label {
          color: var(--txt-muted);
          font-size: 14px;
          font-weight: 500;
          margin: 0;
        }

        /* Loading States */
        .loading-demo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 32px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border);
          border-top: 3px solid var(--neon-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          color: var(--txt);
          font-size: 16px;
          font-weight: 500;
        }

        /* Neon Score Circle */
        .score-circle {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 200px;
          height: 200px;
          margin: 0 auto;
        }

        .score-circle-bg {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(8, 240, 255, 0.1) 0%, rgba(8, 240, 255, 0.05) 40%, transparent 70%);
          border: 3px solid rgba(8, 240, 255, 0.3);
        }

        .score-circle-ring {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: conic-gradient(var(--neon-primary) 0deg, var(--neon-primary) calc(var(--score-percentage) * 3.6deg), rgba(8, 240, 255, 0.2) calc(var(--score-percentage) * 3.6deg), rgba(8, 240, 255, 0.2) 360deg);
          mask: radial-gradient(circle, transparent 85px, black 88px);
          -webkit-mask: radial-gradient(circle, transparent 85px, black 88px);
        }

        .score-circle-glow {
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(8, 240, 255, 0.4) 0%, rgba(8, 240, 255, 0.2) 30%, rgba(8, 240, 255, 0.1) 60%, transparent 80%);
          filter: blur(8px);
          animation: pulse-glow 2s ease-in-out infinite alternate;
        }

        @keyframes pulse-glow {
          0% { 
            transform: scale(1);
            opacity: 0.6;
          }
          100% { 
            transform: scale(1.05);
            opacity: 1;
          }
        }

        .score-content {
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .score-value-large {
          color: var(--neon-primary);
          font-size: 64px;
          font-weight: 700;
          margin: 0;
          line-height: 1;
          text-shadow: 0 0 20px rgba(8, 240, 255, 0.8);
        }

        .score-label-large {
          color: var(--txt);
          font-size: 18px;
          font-weight: 600;
          margin: 8px 0 0 0;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .score-circles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 40px;
          align-items: center;
          justify-items: center;
        }

        /* Neon Score Circle */
        .score-circle {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 200px;
          height: 200px;
          margin: 0 auto;
        }

        .score-circle-bg {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(8, 240, 255, 0.1) 0%, rgba(8, 240, 255, 0.05) 40%, transparent 70%);
          border: 3px solid rgba(8, 240, 255, 0.3);
        }

        .score-circle-ring {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: conic-gradient(var(--neon-primary) 0deg, var(--neon-primary) calc(var(--score-percentage) * 3.6deg), rgba(8, 240, 255, 0.2) calc(var(--score-percentage) * 3.6deg), rgba(8, 240, 255, 0.2) 360deg);
          mask: radial-gradient(circle, transparent 85px, black 88px);
          -webkit-mask: radial-gradient(circle, transparent 85px, black 88px);
        }

        .score-circle-glow {
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(8, 240, 255, 0.4) 0%, rgba(8, 240, 255, 0.2) 30%, rgba(8, 240, 255, 0.1) 60%, transparent 80%);
          filter: blur(8px);
          animation: pulse-glow 2s ease-in-out infinite alternate;
        }

        @keyframes pulse-glow {
          0% { 
            transform: scale(1);
            opacity: 0.6;
          }
          100% { 
            transform: scale(1.05);
            opacity: 1;
          }
        }

        .score-content {
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .score-value-large {
          color: var(--neon-primary);
          font-size: 64px;
          font-weight: 700;
          margin: 0;
          line-height: 1;
          text-shadow: 0 0 20px rgba(8, 240, 255, 0.8);
        }

        .score-label-large {
          color: var(--txt);
          font-size: 18px;
          font-weight: 600;
          margin: 8px 0 0 0;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .score-circles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 40px;
          align-items: center;
          justify-items: center;
        }

        @media (max-width: 768px) {
          .design-title {
            font-size: 36px;
          }
          
          .section-title {
            font-size: 28px;
          }
          
          .form-showcase {
            grid-template-columns: 1fr;
          }
          
          .pills-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .buttons-showcase {
            grid-template-columns: 1fr;
          }
        }
        `}
      </style>

      <div className="design-system-container">
        {/* Header */}
        <div className="design-header">
          <h1 className="design-title">Hybrid Lab Design System</h1>
          <p className="design-subtitle">A premium sports science interface combining scientific precision with neon-futuristic aesthetics</p>
        </div>

        {/* Color Palette */}
        <div className="design-section">
          <div className="section-header">
            <h2 className="section-title">Color Palette</h2>
            <p className="section-description">Deep space backgrounds with neon accent system for maximum contrast and focus</p>
          </div>
          
          <div className="color-grid">
            <div className="color-card">
              <div className="color-swatch" style={{ backgroundColor: '#0E0E11' }}></div>
              <h3 className="color-name">Deep Space</h3>
              <p className="color-value">#0E0E11</p>
            </div>
            <div className="color-card">
              <div className="color-swatch" style={{ backgroundColor: '#15161A' }}></div>
              <h3 className="color-name">Charcoal</h3>
              <p className="color-value">#15161A</p>
            </div>
            <div className="color-card">
              <div className="color-swatch" style={{ backgroundColor: '#08F0FF' }}></div>
              <h3 className="color-name">Neon Primary</h3>
              <p className="color-value">#08F0FF</p>
            </div>
            <div className="color-card">
              <div className="color-swatch" style={{ backgroundColor: '#00FF88' }}></div>
              <h3 className="color-name">Electric Green</h3>
              <p className="color-value">#00FF88</p>
            </div>
            <div className="color-card">
              <div className="color-swatch" style={{ backgroundColor: '#FFA42D' }}></div>
              <h3 className="color-name">Amber Orange</h3>
              <p className="color-value">#FFA42D</p>
            </div>
            <div className="color-card">
              <div className="color-swatch" style={{ backgroundColor: '#F5FAFF' }}></div>
              <h3 className="color-name">Pure White</h3>
              <p className="color-value">#F5FAFF</p>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="design-section">
          <div className="section-header">
            <h2 className="section-title">Typography Scale</h2>
            <p className="section-description">Clean, technical typography with optimized readability and visual hierarchy</p>
          </div>
          
          <div className="typography-sample">
            <h1 className="h1-sample">Primary Heading - Hybrid Lab Assessment</h1>
            <h2 className="h2-sample">Section Title - Performance Metrics</h2>
            <h3 className="h3-sample">Component Title - Personal Foundation</h3>
            <h4 className="h4-sample">Field Label - VO₂ Max Reading</h4>
            <p className="body-sample">Body text explaining the importance of cardiovascular metrics in hybrid athletic performance. This text maintains readability while providing detailed scientific information to elite athletes.</p>
          </div>
        </div>

        {/* Assessment Sections */}
        <div className="design-section">
          <div className="section-header">
            <h2 className="section-title">Assessment Sections</h2>
            <p className="section-description">Glass morphism cards with interactive hover states and scientific iconography</p>
          </div>
          
          <div className="assessment-section">
            <div className="mock-section-header">
              <div className="mock-section-icon">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="mock-section-title">Body Metrics Analysis</h3>
                <p className="mock-section-subtitle">Physiological measurements and performance indicators</p>
              </div>
            </div>
            
            <div className="welcome-message">
              <div className="welcome-icon">
                <Zap className="w-5 h-5" />
              </div>
              <div className="welcome-content">
                <h3>Advanced Metrics Detected!</h3>
                <p>Your wearable data has been integrated successfully. These readings will provide enhanced accuracy for your hybrid performance assessment.</p>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <Heart className="w-6 h-6" />
                </div>
                <div className="stat-value">58</div>
                <div className="stat-label">VO₂ Max</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="stat-value">42</div>
                <div className="stat-label">Resting HR</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="stat-value">195</div>
                <div className="stat-label">HRV (ms)</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Award className="w-6 h-6" />
                </div>
                <div className="stat-value">87</div>
                <div className="stat-label">Hybrid Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Controls */}
        <div className="design-section">
          <div className="section-header">
            <h2 className="section-title">Form Controls</h2>
            <p className="section-description">Interactive inputs with focus states, validation, and contextual help</p>
          </div>
          
          <div className="form-showcase">
            <div className="form-group">
              <label className="form-label">
                <span>Athlete Name</span>
                <span className="required-indicator">*</span>
              </label>
              <p className="form-description">
                Your display name for the global <span className="form-description-highlight">leaderboard rankings</span> and performance tracking.
              </p>
              <input
                type="text"
                className="form-input"
                value={formValues.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Alex Thompson"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>VO₂ Max</span>
                <span className="optional-indicator">optional</span>
              </label>
              <p className="form-description">
                Contributes <span className="form-description-highlight">25% of your endurance score</span>, compared against elite standards (70 for males, 60 for females).
              </p>
              <input
                type="number"
                className="form-input"
                value={formValues.vo2max}
                onChange={(e) => handleInputChange('vo2max', e.target.value)}
                placeholder="58"
              />
              <div className="device-tips">
                <div className="device-tips-header">
                  <Info className="w-4 h-4" />
                  How to Find on Your Device
                </div>
                <div className="device-tip-item">
                  <span className="device-tip-device">Apple Watch</span>
                  <span className="device-tip-instruction">Health app → Browse → Heart → Cardio Fitness → Your VO₂ max readings</span>
                </div>
                <div className="device-tip-item">
                  <span className="device-tip-device">Garmin</span>
                  <span className="device-tip-instruction">Garmin Connect app → Health Stats → VO₂ Max</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Primary Running App</span>
                <span className="optional-indicator">optional</span>
              </label>
              <select className="form-select" defaultValue="Strava">
                <option value="">Select running app</option>
                <option value="Strava">Strava</option>
                <option value="Nike Run Club">Nike Run Club</option>
                <option value="Garmin Connect">Garmin Connect</option>
                <option value="Apple Fitness">Apple Fitness/Health</option>
              </select>
              <div className="app-tips">
                <div className="app-tips-header">
                  How to Find Your Best Times in Strava
                </div>
                <div className="app-tip-instruction">
                  Go to Profile → My Activities → Filter by 'Run' → Sort by 'Best Effort' to see your personal records for each distance.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Pills */}
        <div className="design-section">
          <div className="section-header">
            <h2 className="section-title">Interactive Pills</h2>
            <p className="section-description">Rounded selection chips with solid neon states and hover effects</p>
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <span>Wearable Devices</span>
              <span className="optional-indicator">select all that apply</span>
            </label>
            <p className="form-description">
              Help us provide device-specific instructions for finding your health metrics.
            </p>
            <div className="pills-grid">
              {['Apple Watch', 'Garmin', 'Whoop', 'Ultrahuman Ring', 'Fitbit', 'Oura', 'None', 'Other'].map((device) => (
                <div
                  key={device}
                  className={`pill-chip ${selectedPill === device ? 'selected' : ''}`}
                  onClick={() => setSelectedPill(device)}
                >
                  {device}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Button System */}
        <div className="design-section">
          <div className="section-header">
            <h2 className="section-title">Button System</h2>
            <p className="section-description">Multi-layer glow effects with elevation on interaction</p>
          </div>
          
          <div className="buttons-showcase">
            <button className="button-primary">
              <Target className="w-5 h-5" />
              Calculate Hybrid Score
            </button>
            <button className="button-secondary">
              <User className="w-5 h-5" />
              View Profile
            </button>
            <button className="button-secondary">
              <Activity className="w-5 h-5" />
              Performance History
            </button>
            <button className="button-secondary">
              <Award className="w-5 h-5" />
              Global Leaderboard
            </button>
          </div>
        </div>

        {/* Loading States */}
        <div className="design-section">
          <div className="section-header">
            <h2 className="section-title">Loading States</h2>
            <p className="section-description">Branded loading indicators with neon accents</p>
          </div>
          
          <div className="loading-demo">
            <div className="spinner"></div>
            <span className="loading-text">Analyzing performance data...</span>
          </div>
        </div>

        {/* Performance Assessment Example */}
        <div className="design-section">
          <div className="section-header">
            <h2 className="section-title">Complete Assessment Flow</h2>
            <p className="section-description">Full section example showing integrated design system</p>
          </div>
          
          <div className="assessment-section">
            <div className="mock-section-header">
              <div className="mock-section-icon">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="mock-section-title">Running Performance</h3>
                <p className="mock-section-subtitle">Your personal records and training volume</p>
              </div>
            </div>
            
            <div className="form-showcase">
              <div className="form-group">
                <label className="form-label">
                  <span>Mile PR (MM:SS)</span>
                  <span className="optional-indicator">optional</span>
                </label>
                <p className="form-description">
                  Determines your speed score (25% of endurance). Elite targets: <span className="form-description-highlight">sub-5:30 for males, sub-6:15 for females</span>.
                </p>
                <input
                  type="text"
                  className="form-input"
                  defaultValue="5:45"
                  placeholder="4:59"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <span>Marathon PR (HH:MM:SS)</span>
                  <span className="optional-indicator">optional</span>
                </label>
                <p className="form-description">
                  Elite targets: <span className="form-description-highlight">sub-3:00 for males, sub-3:30 for females</span>. Marathon performance demonstrates exceptional endurance.
                </p>
                <input
                  type="text"
                  className="form-input"
                  defaultValue="3:15:00"
                  placeholder="3:15:00"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <span>Weekly Miles</span>
                  <span className="optional-indicator">optional</span>
                </label>
                <p className="form-description">
                  Creates your volume score with thresholds at <span className="form-description-highlight">20/40/50+ miles</span>. Higher weekly mileage indicates greater aerobic base.
                </p>
                <input
                  type="number"
                  className="form-input"
                  defaultValue="45"
                  placeholder="40"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignSystemPage;