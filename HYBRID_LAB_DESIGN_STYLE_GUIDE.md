# Hybrid Lab Design System & Style Guide

## Brand Overview
**Hybrid Lab** is a cutting-edge sports science platform that combines scientific precision with modern technology. The brand aesthetic merges sleek minimalism with neon-futuristic elements, creating a premium lab-like experience for hybrid athletes.

---

## 🎨 Color Palette

### Primary Colors
```css
--bg: #0E0E11                    /* Deep Space Black - Main background */
--card: #15161A                  /* Charcoal Gray - Card backgrounds */
--card-secondary: #1A1B20        /* Slate Gray - Secondary card backgrounds */
--txt: #F5FAFF                   /* Pure White - Primary text */
```

### Border & Structure
```css
--border: #1F2025                /* Steel Gray - Primary borders */
--border-subtle: #2A2B30         /* Muted Steel - Subtle dividers */
```

### Text Hierarchy
```css
--txt: #F5FAFF                   /* Primary Text - High contrast white */
--txt-muted: #8D9299             /* Secondary Text - Medium gray */
--txt-subtle: #6B7280            /* Tertiary Text - Light gray */
```

### Neon Accent System
```css
--neon-primary: #08F0FF          /* Cyan Blue - Primary brand color */
--neon-secondary: #00FF88        /* Electric Green - Success/positive */
--neon-accent: #FFA42D           /* Amber Orange - Warnings/tips */
```

### Brand Gradients
```css
--gradient-primary: linear-gradient(135deg, #08F0FF 0%, #0EA5E9 100%)
```

---

## ✨ Visual Effects

### Glow System
```css
/* Subtle ambient glow */
--shadow-glow: 0 0 20px rgba(8, 240, 255, 0.15)

/* Enhanced interaction glow */
--shadow-glow-hover: 0 0 30px rgba(8, 240, 255, 0.25)
```

### Multi-Layer Button Glow
```css
/* Primary Action Button */
box-shadow: 
  0 0 20px rgba(8, 240, 255, 0.4),    /* Inner glow */
  0 0 40px rgba(8, 240, 255, 0.2),    /* Outer glow */
  0 4px 16px rgba(8, 240, 255, 0.3);  /* Drop shadow */

/* Hover Enhancement */
box-shadow: 
  0 0 30px rgba(8, 240, 255, 0.6),    /* Stronger inner */
  0 0 60px rgba(8, 240, 255, 0.3),    /* Larger outer */
  0 8px 32px rgba(8, 240, 255, 0.4);  /* Enhanced drop */
```

---

## 📝 Typography System

### Font Hierarchy
```css
/* Section Headers */
.section-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Section Subtitles */
.section-subtitle {
  font-size: 16px;
  font-weight: 400;
}

/* Field Labels */
.field-label {
  font-size: 16px;
  font-weight: 600;
}

/* Body Text */
.field-description {
  font-size: 14px;
  line-height: 1.6;
}

/* Button Text */
.submit-button {
  font-size: 18px;
  font-weight: 500;
}
```

### Responsive Typography
```css
/* Mobile (≤768px) */
.section-title { font-size: 24px; }
.section-subtitle { font-size: 14px; }

/* Small Mobile (≤480px) */
.section-title { font-size: 22px; }
```

---

## 🏗️ Layout System

### Grid Structure
```css
/* Desktop Fields Grid */
.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
}

/* Wearables Grid */
.wearables-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
```

### Spacing Scale
```css
/* Micro Spacing */
gap: 8px;              /* Small elements */
gap: 12px;             /* Medium elements */
gap: 16px;             /* Large elements */

/* Macro Spacing */
margin-bottom: 24px;   /* Section separation */
margin-bottom: 32px;   /* Major section breaks */
margin-bottom: 48px;   /* Page-level spacing */
```

---

## 🎛️ Component Specifications

### Assessment Sections
```css
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
```

### Form Controls
```css
.form-input {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: var(--neon-primary);
  box-shadow: 0 0 0 3px rgba(8, 240, 255, 0.1);
  background: var(--card-secondary);
}
```

### Interactive Pills
```css
.wearable-chip {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 25px;          /* Full pill shape */
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  min-height: 40px;
  transition: all 0.3s ease;
}

.wearable-chip.selected {
  background: var(--neon-primary);
  color: #000000;
  border-color: var(--neon-primary);
  box-shadow: var(--shadow-glow);
}
```

---

## 🎯 Interactive States

### Hover Effects
```css
/* Gentle elevation */
transform: translateY(-1px);

/* Strong elevation (primary actions) */
transform: translateY(-2px);

/* Transition timing */
transition: all 0.3s ease;
```

### Focus States
```css
/* Form inputs */
outline: none;
border-color: var(--neon-primary);
box-shadow: 0 0 0 3px rgba(8, 240, 255, 0.1);
```

### Loading States
```css
/* Spinner */
border: 2px solid var(--neon-primary);
border-t: transparent;
border-radius: 50%;
animation: spin 1s linear infinite;
```

---

## 📱 Responsive Breakpoints

### Mobile First Approach
```css
/* Default: Mobile */
/* Small screens handled by default styles */

/* Tablet (≥768px) */
@media (max-width: 768px) {
  .assessment-section {
    padding: 24px 20px;
    border-radius: 12px;
  }
  .fields-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

/* Small Mobile (≤480px) */
@media (max-width: 480px) {
  .assessment-section {
    padding: 20px 16px;
  }
  .form-input, .form-select {
    font-size: 16px; /* Prevent iOS zoom */
    padding: 14px;
  }
}
```

---

## 💡 Information Architecture

### Visual Hierarchy
1. **Section Headers** - Bold, large titles with icons
2. **Field Labels** - Medium weight, clear identification
3. **Field Descriptions** - Explanatory content with highlighted key terms
4. **Device Tips** - Color-coded instructional content
5. **Optional Indicators** - Subtle, italicized supplementary info

### Content Patterns
```css
/* Highlighted Information */
.field-description-highlight {
  color: var(--neon-primary);
  font-weight: 600;
}

/* Optional Labels */
.optional-indicator {
  color: var(--txt-subtle);
  font-size: 14px;
  font-weight: 400;
  font-style: italic;
  margin-left: 8px;
}

/* Required Indicators */
.required-indicator {
  color: var(--neon-primary);
  font-size: 18px;
}
```

---

## 🌈 Contextual Color Usage

### Device Tips (Green)
```css
background: rgba(0, 255, 136, 0.06);
border: 1px solid rgba(0, 255, 136, 0.2);
```

### App Instructions (Amber)
```css
background: rgba(255, 164, 45, 0.06);
border: 1px solid rgba(255, 164, 45, 0.2);
```

### Welcome Messages (Cyan)
```css
background: rgba(8, 240, 255, 0.06);
border: 1px solid rgba(8, 240, 255, 0.2);
```

---

## 🎮 Animation System

### Micro-Interactions
```css
/* Standard transition */
transition: all 0.3s ease;

/* Smooth section transitions */
transition: all 0.4s ease;

/* Button elevation */
transform: translateY(-2px);

/* Spinner animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## 🧪 Brand Personality

### Core Values
- **Scientific Precision**: Clean, measured layouts with clear data hierarchy
- **Cutting-Edge Technology**: Neon accents and futuristic glow effects
- **Premium Experience**: High-quality materials (glass morphism effects)
- **Athletic Performance**: Bold, energetic color choices

### Visual Language
- **Dark Mode First**: Deep space backgrounds create focus
- **Neon Accents**: Cyan blue primary with strategic green/amber secondary
- **Glass Morphism**: Subtle transparency with glowing borders
- **Pill Shapes**: Rounded, friendly interactive elements
- **Scientific Icons**: Clean, technical iconography

---

## 🔧 Implementation Guidelines

### CSS Custom Properties
Always use CSS custom properties for consistency:
```css
color: var(--txt);              /* ✅ Good */
color: #F5FAFF;                /* ❌ Avoid hardcoding */
```

### Responsive Design
```css
/* Mobile-first approach */
.element {
  /* Mobile styles here */
}

@media (max-width: 768px) {
  /* Tablet adjustments */
}

@media (max-width: 480px) {
  /* Small mobile adjustments */
}
```

### Accessibility
```css
/* iOS zoom prevention */
font-size: 16px; /* Minimum for form inputs */

/* High contrast ratios */
/* Primary text: #F5FAFF on #0E0E11 (15.8:1) */
/* Secondary text: #8D9299 on #0E0E11 (4.5:1) */
```

---

This design system ensures consistent, brand-aligned experiences across all Hybrid Lab interfaces while maintaining accessibility, performance, and technical excellence.