import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import HybridScoreDial from './share/HybridScoreDial';
import ScoreChip from './share/ScoreChip';
import PRLifts from './share/PRLifts';
import PRRuns from './share/PRRuns';
import BalanceChips from './share/BalanceChips';
import Nameplate from './share/Nameplate';

const GRADIENTS = {
  cyanDrift: {
    name: 'Cyan Drift',
    css: 'linear-gradient(135deg, rgba(8,240,255,.20) 0%, #0E0E11 60%)'
  }
};

// Mock data for testing
const mockPrsData = {
  strength: {
    squat_lb: 315,
    bench_lb: 225,
    deadlift_lb: 405,
    bodyweight_lb: 180
  },
  running: {
    mile_s: 390, // 6:30
    '5k_s': 1230, // 20:30
    '10k_s': 2520, // 42:00
    half_s: 5400 // 1:30:00
  },
  meta: {
    hybrid_score: 85,
    first_name: 'John',
    last_name: 'Doe',
    display_name: 'John Doe'
  }
};

const DEFAULT_POSITIONS = {
  dial: { x: 80, y: 150, width: 220, height: 180 },
  scoreChip: { x: 95, y: 100, width: 185, height: 40 },
  prLifts: { x: 20, y: 580, width: 160, height: 140 },
  prRuns: { x: 195, y: 580, width: 160, height: 140 },
  balanceChips: { x: 60, y: 350, width: 255, height: 60 },
  nameplate: { x: 75, y: 730, width: 225, height: 50 }
};

const ShareTest = () => {
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);

  const addComponent = (type) => {
    console.log('Adding component:', type);
    
    const position = DEFAULT_POSITIONS[type];
    const newComponent = {
      id: `${type}_${Date.now()}`,
      type,
      ...position,
      rotationDeg: 0,
      z: components.length,
      locked: false,
      style: {
        opacity: 0.9,
        glow: 'standard'
      }
    };

    console.log('New component:', newComponent);
    setComponents(prev => [...prev, newComponent]);
  };

  const updateComponent = (id, updates) => {
    console.log('Updating component:', id, updates);
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, ...updates } : comp
    ));
  };

  const ComponentRenderer = ({ component }) => {
    const isSelected = selectedComponent?.id === component.id;
    
    const handleSelect = (e) => {
      e.stopPropagation();
      setSelectedComponent(component);
      console.log('Component selected:', component.id);
    };

    const handleDragStop = (e, d) => {
      console.log('Drag stopped at:', d);
      updateComponent(component.id, { x: d.x, y: d.y });
    };

    const handleResizeStop = (e, direction, ref, delta, position) => {
      console.log('Resize stopped:', { width: ref.offsetWidth, height: ref.offsetHeight, position });
      updateComponent(component.id, {
        width: ref.offsetWidth,
        height: ref.offsetHeight,
        x: position.x,
        y: position.y
      });
    };

    return (
      <Rnd
        size={{ width: component.width, height: component.height }}
        position={{ x: component.x, y: component.y }}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        bounds="parent"
        minWidth={50}
        minHeight={30}
        className={`rnd-container ${isSelected ? 'selected' : ''} cursor-move`}
        enableResizing={isSelected}
        onClick={handleSelect}
        style={{
          zIndex: component.z + 10,
          opacity: component.style.opacity,
          border: isSelected ? '2px solid rgba(8,240,255,0.6)' : 'none',
          borderRadius: '4px'
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>
          <ComponentContent component={component} prsData={mockPrsData} />
        </div>
      </Rnd>
    );
  };

  const ComponentContent = ({ component, prsData }) => {
    const { type } = component;
    
    const baseStyle = {
      width: '100%',
      height: '100%'
    };

    switch (type) {
      case 'dial':
        return <HybridScoreDial prsData={prsData} style={component.style} baseStyle={baseStyle} />;
      case 'scoreChip':
        return <ScoreChip prsData={prsData} style={component.style} baseStyle={baseStyle} />;
      case 'prLifts':
        return <PRLifts prsData={prsData} style={component.style} baseStyle={baseStyle} />;
      case 'prRuns':
        return <PRRuns prsData={prsData} style={component.style} baseStyle={baseStyle} />;
      case 'balanceChips':
        return <BalanceChips prsData={prsData} style={component.style} baseStyle={baseStyle} />;
      case 'nameplate':
        return <Nameplate prsData={prsData} style={component.style} baseStyle={baseStyle} />;
      default:
        return <div style={baseStyle}>Unknown component: {type}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E11] text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Resize Test - Click components to see handles</h1>
      
      <div className="flex gap-8">
        {/* Controls */}
        <div className="w-64 space-y-4">
          <h2 className="text-lg font-semibold">Add Components:</h2>
          
          <div className="space-y-2">
            {Object.keys(DEFAULT_POSITIONS).map(type => (
              <Button
                key={type}
                onClick={() => addComponent(type)}
                className="w-full justify-start"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                {type}
              </Button>
            ))}
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">Components: {components.length}</h3>
            <div className="text-sm text-white/60">
              Selected: {selectedComponent?.type || 'None'}
            </div>
            {components.map(comp => (
              <div key={comp.id} className="text-xs text-white/40">
                {comp.type} ({comp.width}×{comp.height})
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <div 
            className="relative border-2 border-gray-600" 
            style={{
              width: '375px',
              height: '812px',
              background: GRADIENTS.cyanDrift.css,
              borderRadius: '20px'
            }}
            onClick={() => setSelectedComponent(null)}
          >
            {components.map((component) => (
              <ComponentRenderer
                key={component.id}
                component={component}
              />
            ))}
            
            {components.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-white/40">
                Click buttons to add components
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareTest;