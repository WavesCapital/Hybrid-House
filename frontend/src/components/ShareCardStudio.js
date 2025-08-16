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
import { useAuth } from '../contexts/AuthContext';
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
  Layers,
  X
} from 'lucide-react';
import axios from 'axios';

// Import individual component renderers
import HybridScoreDial from './share/HybridScoreDial';
import HybridScoreDial2 from './share/HybridScoreDial2';
import ScoreChip from './share/ScoreChip';
import PRLifts from './share/PRLifts';
import PRLiftsHorizontal from './share/PRLiftsHorizontal';
import PRRuns from './share/PRRuns';
import BalanceChips from './share/BalanceChips';
import Nameplate from './share/Nameplate';
import EditPRsModal from './share/EditPRsModal';

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
  dial2: 'dial2',
  scoreChip: 'scoreChip', 
  prLifts: 'prLifts',
  prLiftsHorizontal: 'prLiftsHorizontal',
  prRuns: 'prRuns',
  balanceChips: 'balanceChips',
  nameplate: 'nameplate'
};

// Default positions and sizes for smart anchoring (iPhone Pro Max real dimensions: 375x812)
const DEFAULT_POSITIONS = {
  dial: { x: 80, y: 150, width: 220, height: 180 }, // Upper center third
  dial2: { x: 80, y: 150, width: 220, height: 180 }, // Upper center third
  scoreChip: { x: 95, y: 100, width: 185, height: 40 }, // Above dial
  prLifts: { x: 20, y: 580, width: 160, height: 140 }, // Bottom-left
  prLiftsHorizontal: { x: 30, y: 480, width: 315, height: 80 }, // Horizontal layout
  prRuns: { x: 195, y: 580, width: 160, height: 140 }, // Bottom-right
  balanceChips: { x: 60, y: 350, width: 255, height: 60 }, // Below dial
  nameplate: { x: 75, y: 730, width: 225, height: 50 } // Bottom-center
};

// Optimal fixed sizes for each component type (these are the "native" dimensions)
const OPTIMAL_SIZES = {
  dial: { width: 280, height: 280 },
  dial2: { width: 280, height: 280 },
  scoreChip: { width: 300, height: 60 },
  prLifts: { width: 240, height: 200 },
  prLiftsHorizontal: { width: 350, height: 100 },
  prRuns: { width: 240, height: 200 },
  balanceChips: { width: 400, height: 80 },
  nameplate: { width: 300, height: 80 }
};

const ShareCardStudio = () => {
  // Auth context for user data
  const { user } = useAuth();
  
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
  const [uploadedBackgrounds, setUploadedBackgrounds] = useState({});
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  
  // Canvas dimensions
  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1920;

  // Load PRs data on mount and set up keyboard listeners
  useEffect(() => {
    loadPrsData();
    
    // Add keyboard event listener for delete functionality
    const handleKeyDown = (event) => {
      // Delete key (Delete or Backspace) when component is selected
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedComponent) {
        event.preventDefault();
        console.log('Deleting component:', selectedComponent.id);
        
        // Remove component from canvas
        setComponents(prev => prev.filter(comp => comp.id !== selectedComponent.id));
        setSelectedComponent(null);
        
        // Save to history
        setTimeout(() => {
          saveToHistory();
        }, 100);
        
        toast({
          title: "Component deleted",
          description: `${selectedComponent.type} component removed from canvas.`,
          duration: 2000
        });
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedComponent]); // Re-run when selectedComponent changes

  const loadPrsData = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const token = localStorage.getItem('access_token');
      
      console.log('Loading PRs data...', { backendUrl, hasToken: !!token });
      
      const response = await axios.get(`${backendUrl}/api/me/prs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('PRs data loaded:', response.data);
      setPrsData(response.data);
      
      toast({
        title: "PRs loaded from Profile",
        description: "Edit anytime using the Edit PRs button.",
        duration: 3000
      });
    } catch (error) {
      console.error('Error loading PRs:', error);
      
      // For testing, let's use mock data if the API fails
      const mockData = {
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
          half_s: 5400, // 1:30:00
          marathon_s: 10800 // 3:00:00
        },
        meta: {
          hybrid_score: 85,
          first_name: 'John',
          last_name: 'Doe',
          display_name: 'John Doe'
        }
      };
      
      console.log('Using mock data for testing:', mockData);
      setPrsData(mockData);
      
      toast({
        title: "Using mock data",
        description: "Real data will load after authentication.",
        duration: 3000
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

  // Function to remove glow from all existing components except HybridScoreDial
  const removeGlowFromExistingComponents = () => {
    setComponents(prev => {
      const updated = prev.map(component => ({
        ...component,
        style: {
          ...component.style,
          glow: component.type === 'dial' ? 'standard' : 'off'
        }
      }));
      return updated;
    });
    
    toast({
      title: "Components updated",
      description: "Removed blue glow from all components except Hybrid Score Dial."
    });
  };

  // Auto-fix existing components on load
  useEffect(() => {
    if (components.length > 0) {
      const hasGlowIssues = components.some(comp => 
        comp.type !== 'dial' && (!comp.style.glow || comp.style.glow !== 'off')
      );
      
      if (hasGlowIssues) {
        console.log('Auto-fixing glow issues in existing components');
        removeGlowFromExistingComponents();
      }
    }
  }, []); // Run once on component mount

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
    console.log('Adding component:', type, 'PRs Data:', prsData);
    
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

    console.log('New component created:', newComponent);
    
    setComponents(prev => {
      const updated = [...prev, newComponent];
      console.log('Updated components:', updated);
      return updated;
    });
    
    // Save to history after state update
    setTimeout(() => {
      saveToHistory();
    }, 100);
    
    toast({
      title: "Component added",
      description: `${type} component added to canvas.`
    });
  };

  const getDefaultStyle = (type) => {
    const base = {
      opacity: 0.9,
      glow: 'off'
    };

    switch (type) {
      case 'dial':
      case 'dial2':
        return { ...base, ringThickness: 'M', ticks: true, glow: 'standard' };
      case 'scoreChip':
      case 'nameplate':
        return { ...base, textSize: 'M', align: 'center' };
      case 'prLifts':
      case 'prLiftsHorizontal':
      case 'prRuns':
        return { ...base, glassBlur: 8 };
      default:
        return base;
    }
  };

  const updateComponent = (id, updates) => {
    console.log('Updating component:', id, updates);
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

  // Background upload functionality
  const handleBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      const backgroundId = `uploaded_${Date.now()}`;
      
      // Add to uploaded backgrounds
      setUploadedBackgrounds(prev => ({
        ...prev,
        [backgroundId]: {
          name: file.name.split('.')[0],
          css: `url(${imageUrl})`,
          type: 'image',
          size: 'cover'
        }
      }));

      // Automatically select the new background
      setBackgroundId(backgroundId);
      saveToHistory();

      toast({
        title: "Background uploaded",
        description: `${file.name} uploaded successfully.`
      });
    };

    reader.readAsDataURL(file);
    
    // Clear the input
    event.target.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const deleteUploadedBackground = (uploadId) => {
    setUploadedBackgrounds(prev => {
      const updated = { ...prev };
      delete updated[uploadId];
      return updated;
    });

    // If the deleted background was selected, switch to default
    if (uploadId === backgroundId) {
      setBackgroundId('cyanDrift');
      saveToHistory();
    }

    toast({
      title: "Background deleted",
      description: "Background removed successfully."
    });
  };

  // Get current background style (gradient or uploaded image)
  const getCurrentBackgroundStyle = () => {
    if (uploadedBackgrounds[backgroundId]) {
      const bg = uploadedBackgrounds[backgroundId];
      return bg.type === 'image' 
        ? `${bg.css} center/cover no-repeat`
        : bg.css;
    }
    return GRADIENTS[backgroundId]?.css || GRADIENTS.cyanDrift.css;
  };

  // Export functionality
  const exportCanvas = async () => {
    if (!canvasRef.current) return;

    setExporting(true);
    try {
      // Create a temporary full-size canvas for export
      const tempCanvas = document.createElement('div');
      tempCanvas.style.position = 'fixed';
      tempCanvas.style.top = '-9999px';
      tempCanvas.style.left = '-9999px';
      tempCanvas.style.width = `${CANVAS_WIDTH}px`;
      tempCanvas.style.height = `${CANVAS_HEIGHT}px`;
      tempCanvas.style.background = getCurrentBackgroundStyle();
      
      // Add grid glow if enabled
      if (gridGlow) {
        const gridOverlay = document.createElement('div');
        gridOverlay.style.position = 'absolute';
        gridOverlay.style.inset = '0';
        gridOverlay.style.pointerEvents = 'none';
        gridOverlay.style.backgroundImage = `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `;
        gridOverlay.style.backgroundSize = '48px 48px';
        tempCanvas.appendChild(gridOverlay);
      }
      
      // Render components at full size
      components.forEach(component => {
        const componentDiv = document.createElement('div');
        componentDiv.style.position = 'absolute';
        componentDiv.style.left = `${component.x}px`;
        componentDiv.style.top = `${component.y}px`;
        componentDiv.style.width = `${component.width}px`;
        componentDiv.style.height = `${component.height}px`;
        componentDiv.style.opacity = component.style.opacity;
        componentDiv.style.transform = `rotate(${component.rotationDeg || 0}deg)`;
        componentDiv.style.zIndex = component.z;
        
        // Render component content (this would need to be implemented)
        // For now, we'll use the scaled canvas approach
        tempCanvas.appendChild(componentDiv);
      });
      
      document.body.appendChild(tempCanvas);
      
      const dataUrl = await toPng(tempCanvas, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        quality: 0.8,
        pixelRatio: 1
      });
      
      document.body.removeChild(tempCanvas);

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

      <div className="flex h-[calc(100vh-73px)] bg-[#0E0E11]">
        {/* Left Dock */}
        <div className="w-[336px] bg-[#0A0B0C] border-r border-white/10 flex flex-col h-full">
          <Tabs defaultValue="backgrounds" className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#0E0E11] border-b border-white/10 flex-shrink-0">
              <TabsTrigger value="backgrounds" className="text-white data-[state=active]:bg-[#08F0FF] data-[state=active]:text-black">
                Backgrounds
              </TabsTrigger>
              <TabsTrigger value="components" className="text-white data-[state=active]:bg-[#08F0FF] data-[state=active]:text-black">
                Components
              </TabsTrigger>
            </TabsList>

            <TabsContent value="backgrounds" className="bg-[#0A0B0C] flex-1 overflow-hidden">
              <div className="h-full p-4 space-y-4 overflow-y-auto">
                <div className="text-sm text-white/60 mb-4">
                  Click a gradient to apply it to your canvas
                </div>

                {/* Upload Button */}
                <div className="mb-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={triggerFileUpload}
                    className="w-full bg-[#08F0FF]/10 hover:bg-[#08F0FF]/20 border border-[#08F0FF] text-[#08F0FF] font-medium"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Background
                  </Button>
                </div>

                {/* Uploaded Backgrounds */}
                {Object.keys(uploadedBackgrounds).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-white/80 mb-3">Your Uploads</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {Object.entries(uploadedBackgrounds).map(([id, background]) => (
                        <UploadedBackgroundTile
                          key={id}
                          id={id}
                          background={background}
                          isSelected={backgroundId === id}
                          onClick={() => {
                            setBackgroundId(id);
                            saveToHistory();
                            toast({
                              title: "Background applied",
                              description: `${background.name} applied to canvas.`
                            });
                          }}
                          onDelete={() => deleteUploadedBackground(id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Gradient Backgrounds */}
                <div>
                  <h4 className="text-sm font-medium text-white/80 mb-3">Gradients</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(GRADIENTS).map(([id, gradient]) => (
                      <GradientTile
                        key={id}
                        id={id}
                        gradient={gradient}
                        isSelected={backgroundId === id}
                        onClick={() => {
                          setBackgroundId(id);
                          saveToHistory();
                          toast({
                            title: "Background applied",
                            description: `${gradient.name} gradient applied to canvas.`
                          });
                        }}
                      />
                    ))}
                  </div>
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
              </div>
            </TabsContent>

            <TabsContent value="components" className="bg-[#0A0B0C] flex-1 overflow-hidden">
              <div className="h-full p-4 space-y-6 overflow-y-auto">
                {/* Score Components */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/20 pb-2">
                    Score Display
                  </h3>
                  <div className="space-y-3">
                    <ComponentPreviewTile
                      type="dial"
                      title="Hybrid Score Dial"
                      prsData={prsData}
                      onAdd={() => addComponent('dial')}
                      preview={<HybridScoreDialPreview prsData={prsData} />}
                    />
                    <ComponentPreviewTile
                      type="dial2"
                      title="Hybrid Score Dial 2"
                      prsData={prsData}
                      onAdd={() => addComponent('dial2')}
                      preview={<HybridScoreDial2Preview prsData={prsData} />}
                    />
                    <ComponentPreviewTile
                      type="scoreChip"
                      title="Score Chip"
                      prsData={prsData}
                      onAdd={() => addComponent('scoreChip')}
                      preview={<ScoreChipPreview prsData={prsData} />}
                    />
                  </div>
                </div>

                {/* Strength PRs */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/20 pb-2">
                    Strength PRs
                  </h3>
                  <div className="space-y-3">
                    <ComponentPreviewTile
                      type="prLifts"
                      title="Strength PRs"
                      prsData={prsData}
                      onAdd={() => addComponent('prLifts')}
                      preview={<PRLiftsPreview prsData={prsData} />}
                    />
                    <ComponentPreviewTile
                      type="prLiftsHorizontal"
                      title="Strength PRs 2"
                      prsData={prsData}
                      onAdd={() => addComponent('prLiftsHorizontal')}
                      preview={<PRLiftsHorizontalPreview prsData={prsData} />}
                    />
                  </div>
                </div>

                {/* Running PRs */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/20 pb-2">
                    Running PRs
                  </h3>
                  <div className="space-y-3">
                    <ComponentPreviewTile
                      type="prRuns"
                      title="Running PRs"
                      prsData={prsData}
                      onAdd={() => addComponent('prRuns')}
                      preview={<PRRunsPreview prsData={prsData} />}
                    />
                  </div>
                </div>

                {/* Identity & Style */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/20 pb-2">
                    Identity & Style
                  </h3>
                  <div className="space-y-3">
                    <ComponentPreviewTile
                      type="nameplate"
                      title="Nameplate"
                      prsData={prsData}
                      onAdd={() => addComponent('nameplate')}
                      preview={<NameplatePreview prsData={prsData} />}
                    />
                    <ComponentPreviewTile
                      type="balanceChips"
                      title="Balance Chips"
                      prsData={prsData}
                      onAdd={() => addComponent('balanceChips')}
                      preview={<BalanceChipsPreview prsData={prsData} />}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 bg-[#0E0E11] min-h-full">
          {/* iPhone Pro Max Realistic Mockup */}
          <div className="relative">
            {/* iPhone Device Frame */}
            <div className="relative" style={{
              width: '375px',
              height: '812px',
              background: 'linear-gradient(145deg, #3a3a3c 0%, #2c2c2e 50%, #1c1c1e 100%)',
              borderRadius: '60px',
              padding: '6px',
              boxShadow: `
                0 25px 50px rgba(0,0,0,0.4),
                0 12px 24px rgba(0,0,0,0.3),
                inset 0 1px 0 rgba(255,255,255,0.1),
                inset 0 -1px 0 rgba(0,0,0,0.2)
              `
            }}>
              
              {/* Screen Container */}
              <div className="relative w-full h-full bg-black rounded-[54px] overflow-hidden" style={{
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)'
              }}>
                
                {/* Dynamic Island */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20" style={{
                  width: '126px',
                  height: '37px',
                  background: '#000',
                  borderRadius: '19px'
                }}></div>
                
                {/* Canvas - iPhone 14 Pro Max actual screen ratio */}
                <div
                  ref={canvasRef}
                  className="relative w-full h-full"
                  style={{
                    background: getCurrentBackgroundStyle(),
                  }}
                  onDrop={(e) => e.preventDefault()}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={(e) => {
                    // Only deselect if clicking on canvas background (not on components)
                    if (e.target === e.currentTarget) {
                      setSelectedComponent(null);
                    }
                  }}
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
                        backgroundSize: '24px 24px'
                      }}
                    />
                  )}

                  {/* Safe Zones Overlay */}
                  {safeZones && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 border-2 border-dashed border-yellow-400/30 rounded-[54px]" />
                      <div 
                        className="absolute border-2 border-dashed border-red-400/50 rounded-xl"
                        style={{
                          top: '50px',  // Account for dynamic island
                          bottom: '34px', // Account for home indicator
                          left: '20px',
                          right: '20px'
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
                
                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20" style={{
                  width: '134px',
                  height: '5px',
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: '3px'
                }}></div>
              </div>
              
              {/* Power Button - seamless with frame */}
              <div className="absolute right-0 top-[180px]" style={{
                width: '3px',
                height: '80px',
                background: 'linear-gradient(90deg, rgba(58,58,60,0.8) 0%, rgba(44,44,46,0.9) 50%, rgba(28,28,30,1) 100%)',
                borderRadius: '0 2px 2px 0',
                transform: 'translateX(1px)'
              }}></div>
              
              {/* Volume Up Button */}
              <div className="absolute left-0 top-[160px]" style={{
                width: '3px',
                height: '32px',
                background: 'linear-gradient(270deg, rgba(58,58,60,0.8) 0%, rgba(44,44,46,0.9) 50%, rgba(28,28,30,1) 100%)',
                borderRadius: '2px 0 0 2px',
                transform: 'translateX(-1px)'
              }}></div>
              
              {/* Volume Down Button */}
              <div className="absolute left-0 top-[200px]" style={{
                width: '3px',
                height: '32px',
                background: 'linear-gradient(270deg, rgba(58,58,60,0.8) 0%, rgba(44,44,46,0.9) 50%, rgba(28,28,30,1) 100%)',
                borderRadius: '2px 0 0 2px',
                transform: 'translateX(-1px)'
              }}></div>
              
              {/* Silent Switch */}
              <div className="absolute left-0 top-[130px]" style={{
                width: '2px',
                height: '20px',
                background: 'linear-gradient(270deg, rgba(58,58,60,0.6) 0%, rgba(28,28,30,0.9) 100%)',
                borderRadius: '1px 0 0 1px',
                transform: 'translateX(-0.5px)'
              }}></div>
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
const GradientTile = ({ id, gradient, isSelected, onClick }) => {
  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 ${
        isSelected ? '' : 'hover:ring-1 hover:ring-[#08F0FF]/50'
      }`}
      onClick={onClick}
    >
      <div
        className={`w-full h-24 rounded-lg border transition-all duration-200 ${
          isSelected ? 'border-[#08F0FF]' : 'border-white/20 group-hover:border-[#08F0FF]/50'
        }`}
        style={{ background: gradient.css }}
      />
      <p className={`text-xs mt-2 text-center transition-colors ${
        isSelected ? 'text-[#08F0FF] font-medium' : 'text-white/70 group-hover:text-white'
      }`}>
        {gradient.name}
      </p>
    </div>
  );
};

// Uploaded Background Tile Component
const UploadedBackgroundTile = ({ id, background, isSelected, onClick, onDelete }) => {
  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 ${
        isSelected ? '' : 'hover:ring-1 hover:ring-[#08F0FF]/50'
      }`}
    >
      <div
        className={`w-full h-24 rounded-lg border transition-all duration-200 ${
          isSelected ? 'border-[#08F0FF]' : 'border-white/20 group-hover:border-[#08F0FF]/50'
        }`}
        style={{ 
          background: background.type === 'image' 
            ? `${background.css} center/cover no-repeat`
            : background.css 
        }}
        onClick={onClick}
      />
      
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
      >
        <X size={12} className="text-white" />
      </button>
      
      <p className={`text-xs mt-2 text-center transition-colors truncate ${
        isSelected ? 'text-[#08F0FF] font-medium' : 'text-white/70 group-hover:text-white'
      }`}>
        {background.name}
      </p>
    </div>
  );
};

// Component Preview Tile - Clean visual-only approach
const ComponentPreviewTile = ({ type, title, prsData, onAdd, preview }) => {
  const handleClick = () => {
    console.log('Component tile clicked:', type);
    onAdd();
  };

  return (
    <Card className="bg-[#0E0E11] border-white/20 hover:border-[#08F0FF]/50 transition-all duration-200 cursor-pointer overflow-hidden" onClick={handleClick}>
      <CardContent className="p-0">
        {/* Enlarged Preview Area */}
        <div className="h-32 bg-gradient-to-r from-[#0A0B0C] to-[#0E0E11] flex items-center justify-center border-b border-white/10 relative">
          <div className="scale-75 transform-gpu">
            {preview}
          </div>
          {/* Add Button Overlay */}
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-[#08F0FF] rounded-full flex items-center justify-center">
              <Plus className="w-3 h-3 text-black" />
            </div>
          </div>
        </div>
        
        {/* Title Only - No Description */}
        <div className="p-3">
          <h4 className="text-sm font-medium text-white text-center">{title}</h4>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Preview Components with Better Data Visibility
const HybridScoreDialPreview = ({ prsData }) => {
  const hybridScore = prsData?.meta?.hybrid_score || 85; // Default for preview
  return (
    <div className="w-24 h-24 relative">
      <svg width="96" height="96" viewBox="0 0 96 96" className="transform -rotate-90">
        <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
        <circle
          cx="48" cy="48" r="40"
          stroke="#08F0FF"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${hybridScore * 2.51} 251`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{Math.round(hybridScore)}</div>
          <div className="text-xs text-white/60 uppercase">SCORE</div>
        </div>
      </div>
    </div>
  );
};

const HybridScoreDial2Preview = ({ prsData }) => {
  const hybridScore = prsData?.meta?.hybrid_score || 85; // Default for preview
  return (
    <div className="w-24 h-24 relative p-1" style={{ 
      filter: 'drop-shadow(0 0 6px rgba(8,240,255,0.4))' 
    }}>
      <svg width="88" height="88" viewBox="0 0 88 88" className="transform -rotate-90">
        {/* Background ring */}
        <circle cx="44" cy="44" r="36" stroke="rgba(8,240,255,0.1)" strokeWidth="5" fill="none" />
        {/* Segmented progress ring */}
        <circle
          cx="44" cy="44" r="36"
          stroke="#08F0FF"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="4 1"
          strokeDashoffset={`${226 - (hybridScore * 2.26)}`}
          style={{
            filter: 'drop-shadow(0 0 3px rgba(8,240,255,0.6))'
          }}
        />
        {/* Outer glow ring */}
        <circle
          cx="44" cy="44" r="40"
          stroke="rgba(8,240,255,0.08)"
          strokeWidth="1"
          fill="none"
          className="animate-pulse"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-white" style={{ 
            textShadow: '0 0 6px rgba(8,240,255,0.4)' 
          }}>
            {Math.round(hybridScore)}
          </div>
          <div className="text-xs text-white/60 uppercase">SCORE</div>
        </div>
      </div>
    </div>
  );
};

const ScoreChipPreview = ({ prsData }) => {
  const hybridScore = prsData?.meta?.hybrid_score || 85; // Default for preview
  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
      <span className="text-sm font-bold text-white">HYBRID {Math.round(hybridScore)}</span>
    </div>
  );
};

const PRLiftsPreview = ({ prsData }) => {
  const strength = prsData?.strength || {};
  // Use real data or defaults for preview
  const squat = strength.squat_lb || 315;
  const bench = strength.bench_lb || 225;
  const deadlift = strength.deadlift_lb || 405;
  
  return (
    <div className="bg-black/20 border border-white/20 rounded-xl p-3 w-36 backdrop-blur-sm">
      <div className="text-xs text-white/90 font-bold mb-2 text-left uppercase tracking-wider">
        MAXES
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/80">Bench</span>
          <span className="text-xs text-white font-bold">{Math.round(bench)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/80">Squat</span>
          <span className="text-xs text-white font-bold">{Math.round(squat)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/80">Dead</span>
          <span className="text-xs text-white font-bold">{Math.round(deadlift)}</span>
        </div>
      </div>
    </div>
  );
};

const PRLiftsHorizontalPreview = ({ prsData }) => {
  const strength = prsData?.strength || {};
  // Use real data or defaults for preview
  const bench = strength.bench_lb || 225;
  const squat = strength.squat_lb || 315;
  const deadlift = strength.deadlift_lb || 405;
  
  return (
    <div className="bg-black/20 border border-white/20 rounded-xl p-4 w-44 backdrop-blur-sm">
      {/* Header */}
      <div className="text-xs text-white/90 font-bold mb-3 text-left uppercase tracking-wider">
        MAXES
      </div>
      
      {/* Lifts Grid - Left aligned */}
      <div className="grid grid-cols-3 gap-3 text-left">
        <div className="space-y-1">
          <div className="text-xs text-white/70 uppercase font-medium">Bench</div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-white font-bold">{Math.round(bench)}</span>
            <span className="text-xs text-white/50 text-[10px]">lbs</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-white/70 uppercase font-medium">Squat</div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-white font-bold">{Math.round(squat)}</span>
            <span className="text-xs text-white/50 text-[10px]">lbs</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-white/70 uppercase font-medium">Dead</div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-white font-bold">{Math.round(deadlift)}</span>
            <span className="text-xs text-white/50 text-[10px]">lbs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PRRunsPreview = ({ prsData }) => {
  const running = prsData?.running || {};
  // Use real data or defaults for preview
  const mile = running.mile_s || 390; // 6:30 mile
  const fiveK = running['5k_s'] || 1230; // 20:30 5k
  const marathon = running.marathon_s || 10800; // 3:00:00 marathon
  
  const formatTime = (seconds) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // For times over an hour, show h:mm format (no seconds)
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}`;
    }
    
    // For times under an hour, show mm:ss format
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="bg-black/20 border border-white/20 rounded-xl p-3 w-36 backdrop-blur-sm">
      <div className="text-xs text-white/90 font-bold mb-2 text-left uppercase tracking-wider">
        BEST TIMES
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/80">Mile</span>
          <span className="text-xs text-white font-bold">{formatTime(mile)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/80">5K</span>
          <span className="text-xs text-white font-bold">{formatTime(fiveK)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/80">Marathon</span>
          <span className="text-xs text-white font-bold">{formatTime(marathon)}</span>
        </div>
      </div>
    </div>
  );
};

const NameplatePreview = ({ prsData }) => {
  const firstName = prsData?.meta?.first_name || 'John';
  const lastName = prsData?.meta?.last_name || 'Doe';
  const displayName = prsData?.meta?.display_name || `${firstName} ${lastName}`.trim();
  
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-white truncate max-w-[140px]">
        {displayName}
      </div>
    </div>
  );
};

const BalanceChipsPreview = ({ prsData }) => {
  // These would come from actual balance analysis
  const strengthScore = 75;
  const enduranceScore = 68;
  const recoveryScore = 82;
  
  return (
    <div className="flex gap-2 justify-center">
      <div className="bg-black/30 border border-white/20 rounded-full px-3 py-1 flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-[#FFA42D]" />
        <span className="text-xs text-white font-medium">{strengthScore}</span>
      </div>
      <div className="bg-black/30 border border-white/20 rounded-full px-3 py-1 flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-[#00FF88]" />
        <span className="text-xs text-white font-medium">{enduranceScore}</span>
      </div>
      <div className="bg-black/30 border border-white/20 rounded-full px-3 py-1 flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-[#08F0FF]" />
        <span className="text-xs text-white font-medium">{recoveryScore}</span>
      </div>
    </div>
  );
};

// Component Renderer with CSS Transform Scaling
const ComponentRenderer = ({ component, prsData, isSelected, onSelect, onUpdate, onDelete, onDuplicate }) => {
  console.log('Rendering component:', component.type, 'size:', { width: component.width, height: component.height });
  
  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(component);
  };

  const handleDragStop = (e, d) => {
    console.log('Drag stopped at:', d);
    onUpdate(component.id, { x: d.x, y: d.y });
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    console.log('Resize stopped:', { 
      direction, 
      width: ref.offsetWidth, 
      height: ref.offsetHeight, 
      position 
    });
    
    onUpdate(component.id, {
      width: ref.offsetWidth,
      height: ref.offsetHeight,
      x: position.x,
      y: position.y
    });
  };

  // Calculate scale factor for true image-like scaling
  const optimalSize = OPTIMAL_SIZES[component.type];
  const scaleX = component.width / optimalSize.width;
  const scaleY = component.height / optimalSize.height;
  const scaleFactor = Math.min(scaleX, scaleY); // Maintain aspect ratio
  
  console.log(`${component.type} scaling:`, {
    container: { width: component.width, height: component.height },
    optimal: optimalSize,
    scaleFactor
  });

  return (
    <Rnd
      size={{ width: component.width, height: component.height }}
      position={{ x: component.x, y: component.y }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      bounds="parent"
      minWidth={50}
      minHeight={30}
      className={`rnd-container ${isSelected ? 'selected' : ''} ${component.locked ? 'cursor-not-allowed' : 'cursor-move'}`}
      disableDragging={component.locked}
      enableResizing={!component.locked ? {
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      } : false}
      resizeHandleStyles={isSelected ? {
        topLeft: { 
          width: '18px', 
          height: '18px', 
          backgroundColor: '#ffffff',
          border: '2px solid #08F0FF',
          borderRadius: '50%',
          top: '-9px',
          left: '-9px',
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          transition: 'all 0.2s ease',
          cursor: 'nwse-resize'
        },
        top: { 
          width: '18px', 
          height: '18px', 
          backgroundColor: '#ffffff',
          border: '2px solid #08F0FF',
          borderRadius: '50%',
          top: '-9px',
          left: '50%',
          marginLeft: '-9px',
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          transition: 'all 0.2s ease',
          cursor: 'ns-resize'
        },
        topRight: { 
          width: '18px', 
          height: '18px', 
          backgroundColor: '#ffffff',
          border: '2px solid #08F0FF',
          borderRadius: '50%',
          top: '-9px',
          right: '-9px',
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          transition: 'all 0.2s ease',
          cursor: 'nesw-resize'
        },
        right: { 
          width: '18px', 
          height: '18px', 
          backgroundColor: '#ffffff',
          border: '2px solid #08F0FF',
          borderRadius: '50%',
          right: '-9px',
          top: '50%',
          marginTop: '-9px',
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          transition: 'all 0.2s ease',
          cursor: 'ew-resize'
        },
        bottomRight: { 
          width: '18px', 
          height: '18px', 
          backgroundColor: '#ffffff',
          border: '2px solid #08F0FF',
          borderRadius: '50%',
          bottom: '-9px',
          right: '-9px',
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          transition: 'all 0.2s ease',
          cursor: 'nwse-resize'
        },
        bottom: { 
          width: '18px', 
          height: '18px', 
          backgroundColor: '#ffffff',
          border: '2px solid #08F0FF',
          borderRadius: '50%',
          bottom: '-9px',
          left: '50%',
          marginLeft: '-9px',
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          transition: 'all 0.2s ease',
          cursor: 'ns-resize'
        },
        bottomLeft: { 
          width: '18px', 
          height: '18px', 
          backgroundColor: '#ffffff',
          border: '2px solid #08F0FF',
          borderRadius: '50%',
          bottom: '-9px',
          left: '-9px',
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          transition: 'all 0.2s ease',
          cursor: 'nesw-resize'
        },
        left: { 
          width: '18px', 
          height: '18px', 
          backgroundColor: '#ffffff',
          border: '2px solid #08F0FF',
          borderRadius: '50%',
          left: '-9px',
          top: '50%',
          marginTop: '-9px',
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          transition: 'all 0.2s ease',
          cursor: 'ew-resize'
        }
      } : {}}
      onClick={handleSelect}
      style={{
        zIndex: component.z + 10,
        opacity: component.style.opacity,
        transform: `rotate(${component.rotationDeg || 0}deg)`,
        border: isSelected ? '2px solid rgba(8,240,255,0.6)' : 'none',
        borderRadius: '4px'
      }}
    >
      <div 
        className="component-content" 
        style={{ 
          width: optimalSize.width,
          height: optimalSize.height,
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'center center',
          overflow: 'visible',
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: `-${optimalSize.height / 2}px`,
          marginLeft: `-${optimalSize.width / 2}px`
        }}
      >
        <ComponentContent 
          component={component} 
          prsData={prsData} 
          isSelected={isSelected}
        />
      </div>
    </Rnd>
  );
};

// Component Content Renderer - Fixed Size with CSS Transform Scaling
const ComponentContent = ({ component, prsData, isSelected }) => {
  const { type, style } = component;
  
  const getGlowStyle = (glowLevel) => {
    const glowMap = {
      off: '',
      subtle: 'drop-shadow(0 0 8px rgba(8,240,255,0.3))',
      standard: 'drop-shadow(0 0 16px rgba(8,240,255,0.5))',
      max: 'drop-shadow(0 0 24px rgba(8,240,255,0.8))'
    };
    return glowMap[glowLevel] || glowMap.off;  // Default to 'off' instead of 'standard'
  };

  const baseStyle = {
    filter: getGlowStyle(style?.glow || 'off'),  // Ensure we always pass a valid glow level
    width: '100%',
    height: '100%'
  };

  // Pass only essential props - no container dimensions needed
  const componentProps = {
    prsData,
    style,
    baseStyle,
    isSelected
  };

  switch (type) {
    case 'dial':
      return <HybridScoreDial {...componentProps} />;
    case 'dial2':
      return <HybridScoreDial2 {...componentProps} />;
    case 'scoreChip':
      return <ScoreChip {...componentProps} />;
    case 'prLifts':
      return <PRLifts {...componentProps} />;
    case 'prLiftsHorizontal':
      return <PRLiftsHorizontal {...componentProps} />;
    case 'prRuns':
      return <PRRuns {...componentProps} />;
    case 'balanceChips':
      return <BalanceChips {...componentProps} />;
    case 'nameplate':
      return <Nameplate {...componentProps} />;
    default:
      return <div style={baseStyle}>Unknown component: {type}</div>;
  }
};

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

export default ShareCardStudio;