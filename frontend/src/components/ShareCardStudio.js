import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { toPng } from 'html-to-image';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';
import { 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  Grid3X3, 
  Edit, 
  Download, 
  Share, 
  Minus, 
  Plus,
  RotateCcw,
  Move,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Layers
} from 'lucide-react';
import axios from 'axios';

// Gradient definitions
const GRADIENTS = {
  cyanDrift: {
    name: 'Cyan Drift',
    css: 'linear-gradient(135deg, rgba(8,240,255,.20) 0%, #0E0E11 60%)'
  },
  neoGreen: {
    name: 'Neo Green', 
    css: 'linear-gradient(135deg, rgba(0,255,136,.20) 0%, #0E0E11 60%)'
  },
  amberEdge: {
    name: 'Amber Edge',
    css: 'linear-gradient(135deg, rgba(255,164,45,.18) 0%, #0E0E11 60%)'
  },
  stealthNight: {
    name: 'Stealth Night',
    css: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,.06) 0%, #0E0E11 55%)'
  },
  cyanGreenPulse: {
    name: 'Cyan→Green Pulse',
    css: 'linear-gradient(135deg, rgba(8,240,255,.18) 0%, rgba(0,255,136,.18) 30%, #0E0E11 70%)'
  }
};

// Component types
const COMPONENT_TYPES = {
  dial: 'dial',
  scoreChip: 'scoreChip', 
  prLifts: 'prLifts',
  prRuns: 'prRuns',
  balanceChips: 'balanceChips',
  nameplate: 'nameplate'
};

// Default positions and sizes for smart anchoring
const DEFAULT_POSITIONS = {
  dial: { x: 162, y: 200, width: 756, height: 400 }, // Upper center third
  scoreChip: { x: 324, y: 150, width: 432, height: 80 }, // Above dial
  prLifts: { x: 54, y: 1200, width: 432, height: 300 }, // Bottom-left
  prRuns: { x: 594, y: 1200, width: 432, height: 300 }, // Bottom-right
  balanceChips: { x: 270, y: 650, width: 540, height: 120 }, // Below dial
  nameplate: { x: 216, y: 1650, width: 648, height: 120 } // Bottom-center
};

const ShareCardStudio = () => {
  // State management
  const [prsData, setPrsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backgroundId, setBackgroundId] = useState('cyanDrift');
  const [gridGlow, setGridGlow] = useState(false);
  const [safeZones, setSafeZones] = useState(false);
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const canvasRef = useRef(null);
  const { toast } = useToast();
  
  // Canvas dimensions
  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1920;

  // Load PRs data on mount
  useEffect(() => {
    loadPrsData();
  }, []);

  const loadPrsData = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const token = localStorage.getItem('access_token');
      
      const response = await axios.get(`${backendUrl}/api/me/prs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setPrsData(response.data);
      toast({
        title: "PRs loaded from Profile",
        description: "Edit anytime using the Edit PRs button.",
        duration: 3000
      });
    } catch (error) {
      console.error('Error loading PRs:', error);
      toast({
        title: "Error loading PRs",
        description: "Please ensure you have completed a hybrid score assessment.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // History management
  const saveToHistory = useCallback(() => {
    const state = { backgroundId, gridGlow, components };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(state)));
    
    if (newHistory.length > 50) { // Limit history size
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [backgroundId, gridGlow, components, history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setBackgroundId(prevState.backgroundId);
      setGridGlow(prevState.gridGlow);
      setComponents(prevState.components);
      setHistoryIndex(prev => prev - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setBackgroundId(nextState.backgroundId);
      setGridGlow(nextState.gridGlow);
      setComponents(nextState.components);
      setHistoryIndex(prev => prev + 1);
    }
  };

  // Component management
  const addComponent = (type) => {
    if (!prsData) {
      toast({
        title: "No data available",
        description: "Please complete a hybrid score assessment first.",
        variant: "destructive"
      });
      return;
    }

    const position = DEFAULT_POSITIONS[type];
    const newComponent = {
      id: `${type}_${Date.now()}`,
      type,
      ...position,
      rotationDeg: 0,
      z: components.length,
      locked: false,
      style: getDefaultStyle(type)
    };

    setComponents(prev => [...prev, newComponent]);
    saveToHistory();
  };

  const getDefaultStyle = (type) => {
    const base = {
      opacity: 0.9,
      glow: 'standard'
    };

    switch (type) {
      case 'dial':
        return { ...base, ringThickness: 'M', ticks: true };
      case 'scoreChip':
      case 'nameplate':
        return { ...base, textSize: 'M', align: 'center' };
      case 'prLifts':
      case 'prRuns':
        return { ...base, glassBlur: 8 };
      default:
        return base;
    }
  };

  const updateComponent = (id, updates) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, ...updates } : comp
    ));
  };

  const deleteComponent = (id) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
    saveToHistory();
  };

  const duplicateComponent = (id) => {
    const component = components.find(comp => comp.id === id);
    if (component) {
      const newComponent = {
        ...component,
        id: `${component.type}_${Date.now()}`,
        x: component.x + 20,
        y: component.y + 20,
        z: components.length
      };
      setComponents(prev => [...prev, newComponent]);
      saveToHistory();
    }
  };

  // Background drag handler
  const handleBackgroundDrop = (gradientId, e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if dropped on canvas
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      setBackgroundId(gradientId);
      saveToHistory();
      toast({
        title: "Background applied",
        description: `${GRADIENTS[gradientId].name} gradient applied to canvas.`
      });
    }
  };

  // Export functionality
  const exportCanvas = async () => {
    if (!canvasRef.current) return;

    setExporting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        quality: 0.8,
        pixelRatio: 1
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `hybrid-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "PNG exported",
        description: "Your hybrid card has been downloaded successfully."
      });

      // Try native sharing if available
      if (navigator.canShare && dataUrl) {
        try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const file = new File([blob], 'hybrid-card.png', { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'My Hybrid Score Card'
            });
          }
        } catch (shareError) {
          console.log('Native sharing not available:', shareError);
          toast({
            title: "Share functionality",
            description: "PNG downloaded. Share from your Downloads or drag into Messages/WhatsApp.",
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your card. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E11] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#08F0FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Share Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E11] text-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-[#0E0E11]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="text-white hover:bg-white/10"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="text-white hover:bg-white/10"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSafeZones(!safeZones)}
              className={`text-white hover:bg-white/10 ${safeZones ? 'bg-white/20' : ''}`}
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Safe Zones
            </Button>
            
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit PRs
                </Button>
              </DialogTrigger>
              <EditPRsModal 
                prsData={prsData}
                onSave={(newPrsData) => {
                  setPrsData(newPrsData);
                  setEditModalOpen(false);
                  toast({
                    title: "Profile updated",
                    description: "Your personal records have been saved to your profile."
                  });
                }}
                onClose={() => setEditModalOpen(false)}
              />
            </Dialog>

            <Button
              onClick={exportCanvas}
              disabled={exporting}
              className="bg-[#08F0FF] hover:bg-[#08F0FF]/80 text-black font-medium"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Share className="w-4 h-4 mr-2" />
              )}
              Export / Share
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Dock */}
        <div className="w-[336px] bg-[#0A0B0C] border-r border-white/10 flex flex-col">
          <Tabs defaultValue="backgrounds" className="flex-1">
            <TabsList className="grid w-full grid-cols-2 bg-[#0E0E11] border-b border-white/10">
              <TabsTrigger value="backgrounds" className="text-white data-[state=active]:bg-[#08F0FF] data-[state=active]:text-black">
                Backgrounds
              </TabsTrigger>
              <TabsTrigger value="components" className="text-white data-[state=active]:bg-[#08F0FF] data-[state=active]:text-black">
                Components
              </TabsTrigger>
            </TabsList>

            <TabsContent value="backgrounds" className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(GRADIENTS).map(([id, gradient]) => (
                  <GradientTile
                    key={id}
                    id={id}
                    gradient={gradient}
                    onDrop={handleBackgroundDrop}
                  />
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="grid-glow" className="text-sm text-white/70">
                  Grid Glow
                </Label>
                <Switch
                  id="grid-glow"
                  checked={gridGlow}
                  onCheckedChange={setGridGlow}
                />
              </div>
            </TabsContent>

            <TabsContent value="components" className="p-4 space-y-4">
              <div className="space-y-3">
                <ComponentTile
                  type="dial"
                  title="Hybrid Score Dial"
                  description="Neon ring with score"
                  prsData={prsData}
                  onAdd={() => addComponent('dial')}
                />
                <ComponentTile
                  type="scoreChip"
                  title="Score Chip"
                  description="Text-only score display"
                  prsData={prsData}
                  onAdd={() => addComponent('scoreChip')}
                />
                <ComponentTile
                  type="prLifts"
                  title="PR — Lifts"
                  description="Squat, Bench, Deadlift"
                  prsData={prsData}
                  onAdd={() => addComponent('prLifts')}
                />
                <ComponentTile
                  type="prRuns"
                  title="PR — Runs" 
                  description="Mile, 5K, 10K times"
                  prsData={prsData}
                  onAdd={() => addComponent('prRuns')}
                />
                <ComponentTile
                  type="balanceChips"
                  title="Balance Chips"
                  description="Strength/Endurance/Recovery"
                  prsData={prsData}
                  onAdd={() => addComponent('balanceChips')}
                />
                <ComponentTile
                  type="nameplate"
                  title="Nameplate"
                  description="First & Last name"
                  prsData={prsData}
                  onAdd={() => addComponent('nameplate')}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 bg-[#0E0E11]">
          <div className="relative">
            <div
              ref={canvasRef}
              className="relative overflow-hidden rounded-2xl"
              style={{
                width: CANVAS_WIDTH / 2, // Display at 50% for better fit
                height: CANVAS_HEIGHT / 2,
                background: GRADIENTS[backgroundId].css,
                transform: 'scale(0.5)',
                transformOrigin: 'top left'
              }}
              onDrop={(e) => e.preventDefault()}
              onDragOver={(e) => e.preventDefault()}
            >
              {/* Grid Glow Overlay */}
              {gridGlow && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '48px 48px'
                  }}
                />
              )}

              {/* Safe Zones Overlay */}
              {safeZones && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-dashed border-yellow-400/30" />
                  <div 
                    className="absolute border-2 border-dashed border-red-400/50"
                    style={{
                      top: '150px',
                      bottom: '250px', 
                      left: '64px',
                      right: '64px'
                    }}
                  />
                </div>
              )}

              {/* Components */}
              {components.map((component) => (
                <ComponentRenderer
                  key={component.id}
                  component={component}
                  prsData={prsData}
                  isSelected={selectedComponent?.id === component.id}
                  onSelect={setSelectedComponent}
                  onUpdate={updateComponent}
                  onDelete={deleteComponent}
                  onDuplicate={duplicateComponent}
                />
              ))}
            </div>

            {/* Component Quick Bar */}
            {selectedComponent && (
              <ComponentQuickBar
                component={selectedComponent}
                onUpdate={(updates) => updateComponent(selectedComponent.id, updates)}
                onDelete={() => deleteComponent(selectedComponent.id)}
                onDuplicate={() => duplicateComponent(selectedComponent.id)}
                onDeselect={() => setSelectedComponent(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Gradient Tile Component
const GradientTile = ({ id, gradient, onDrop }) => {
  return (
    <div
      className="relative group cursor-grab active:cursor-grabbing"
      draggable
      onDragEnd={(e) => onDrop(id, e)}
    >
      <div
        className="w-full h-32 rounded-lg border border-white/20 transition-all duration-200 group-hover:border-[#08F0FF]/50 group-hover:shadow-lg group-hover:shadow-[#08F0FF]/20"
        style={{ background: gradient.css }}
      />
      <p className="text-xs text-white/70 mt-2 text-center group-hover:text-white transition-colors">
        {gradient.name}
      </p>
    </div>
  );
};

// Component Tile
const ComponentTile = ({ type, title, description, prsData, onAdd }) => {
  return (
    <Card className="bg-[#0E0E11] border-white/20 hover:border-[#08F0FF]/50 transition-all duration-200 cursor-pointer" onClick={onAdd}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">{title}</h3>
            <p className="text-xs text-white/60 mt-1">{description}</p>
          </div>
          <Plus className="w-4 h-4 text-[#08F0FF]" />
        </div>
      </CardContent>
    </Card>
  );
};

// Component Renderer
const ComponentRenderer = ({ component, prsData, isSelected, onSelect, onUpdate, onDelete, onDuplicate }) => {
  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(component);
  };

  return (
    <Rnd
      size={{ width: component.width, height: component.height }}
      position={{ x: component.x, y: component.y }}
      onDragStop={(e, d) => {
        onUpdate(component.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate(component.id, {
          width: ref.style.width,
          height: ref.style.height,
          ...position
        });
      }}
      className={`${isSelected ? 'ring-2 ring-[#08F0FF]' : ''} ${component.locked ? 'cursor-not-allowed' : ''}`}
      disableDragging={component.locked}
      onClick={handleSelect}
      style={{
        zIndex: component.z,
        opacity: component.style.opacity,
        transform: `rotate(${component.rotationDeg || 0}deg)`
      }}
    >
      <ComponentContent component={component} prsData={prsData} />
    </Rnd>
  );
};

// Component Content Renderer
const ComponentContent = ({ component, prsData }) => {
  const { type, style } = component;
  
  const getGlowStyle = (glowLevel) => {
    const glowMap = {
      off: '',
      subtle: 'drop-shadow(0 0 8px rgba(8,240,255,0.3))',
      standard: 'drop-shadow(0 0 16px rgba(8,240,255,0.5))',
      max: 'drop-shadow(0 0 24px rgba(8,240,255,0.8))'
    };
    return glowMap[glowLevel] || glowMap.standard;
  };

  const baseStyle = {
    filter: getGlowStyle(style.glow),
    width: '100%',
    height: '100%'
  };

  switch (type) {
    case 'dial':
      return <HybridScoreDial prsData={prsData} style={style} baseStyle={baseStyle} />;
    case 'scoreChip':
      return <ScoreChip prsData={prsData} style={style} baseStyle={baseStyle} />;
    case 'prLifts':
      return <PRLifts prsData={prsData} style={style} baseStyle={baseStyle} />;
    case 'prRuns':
      return <PRRuns prsData={prsData} style={style} baseStyle={baseStyle} />;
    case 'balanceChips':
      return <BalanceChips prsData={prsData} style={style} baseStyle={baseStyle} />;
    case 'nameplate':
      return <Nameplate prsData={prsData} style={style} baseStyle={baseStyle} />;
    default:
      return <div style={baseStyle}>Unknown component</div>;
  }
};

// Individual Component Implementations will go here...
// [These would be separate components for each type - HybridScoreDial, ScoreChip, etc.]

// Component Quick Bar
const ComponentQuickBar = ({ component, onUpdate, onDelete, onDuplicate, onDeselect }) => {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0A0B0C]/90 backdrop-blur-md border border-white/20 rounded-lg p-2 flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Label className="text-xs text-white/70">Opacity</Label>
        <Slider
          value={[component.style.opacity * 100]}
          onValueChange={([value]) => onUpdate({ style: { ...component.style, opacity: value / 100 } })}
          max={100}
          min={60}
          step={10}
          className="w-16"
        />
      </div>
      
      <Separator orientation="vertical" className="h-6" />
      
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onUpdate({ locked: !component.locked })}>
          {component.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDuplicate()}>
          <Copy className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete()}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <Button size="sm" variant="ghost" onClick={onDeselect}>
        ×
      </Button>
    </div>
  );
};

// Edit PRs Modal (placeholder - would need full implementation)
const EditPRsModal = ({ prsData, onSave, onClose }) => {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Edit Personal Records</DialogTitle>
      </DialogHeader>
      <div className="p-4">
        <p className="text-white/70">PR editing modal would go here...</p>
        {/* Full implementation would include tabs for Lifting/Running with proper form fields */}
      </div>
    </DialogContent>
  );
};

export default ShareCardStudio;