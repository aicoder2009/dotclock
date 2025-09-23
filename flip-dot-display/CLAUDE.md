# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DotClock is a sophisticated digital flip-dot display simulation that recreates the aesthetic and functionality of Alfa Zeta Flip Dot Displays in a web browser. The project features a highly customizable display with multiple modes, real-time animations, and a premium glassmorphic UI.

## Tech Stack

- **Framework**: Next.js 15.5.3 with App Router
- **React**: 19.1.0 with extensive use of hooks (useState, useEffect, useCallback, useMemo)
- **TypeScript**: v5 with strict mode
- **Styling**: Tailwind CSS v4 (latest version with inline theme configuration)
- **Build Tool**: Turbopack (Rust-based bundler for faster builds)
- **Fonts**: Geist Sans and Geist Mono (optimized via next/font)
- **Performance**: React.memo, optimized re-renders, throttled event handlers

## Development Commands

```bash
# All commands should be run from /Users/karthickarun/dotclock/flip-dot-display/

# Start development server with Turbopack (hot reload enabled)
npm run dev

# Build for production with Turbopack optimization
npm run build

# Start production server
npm run start
```

## Architecture

### Project Structure
```
/flip-dot-display/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with fonts and metadata
│   │   ├── page.tsx              # Main page rendering FlipDotDisplay
│   │   └── globals.css           # Global styles with Tailwind CSS v4
│   ├── components/
│   │   ├── FlipDotDisplay.tsx    # Main display component with UI Island
│   │   └── FlipDot.tsx           # Individual dot component (memoized)
│   ├── lib/
│   │   └── asciiFont.ts          # ASCII font rendering utilities
│   └── hooks/
│       └── useFlipDotSound.ts    # Sound management hook
├── public/                       # Static assets
└── next.config.ts               # Next.js configuration with Turbopack
```

### Component Architecture

#### FlipDotDisplay Component
- **State Management**:
  - Display modes: clock, text, ascii-art, direct
  - Clock formats: 12-hour and 24-hour
  - UI Island minimize/maximize state
  - Edit/View mode toggling
  - Volume and sound controls

- **Performance Optimizations**:
  - Memoized callbacks with useCallback
  - Throttled resize handler (100ms debounce)
  - Optimized clock updates (only on second change)
  - Reduced animation delays for snappier feel
  - CSS containment and GPU acceleration

#### FlipDot Component
- **Memoized**: Wrapped in React.memo to prevent unnecessary re-renders
- **Animation**: Smooth flip animations with reduced duration (100ms)
- **Styling**: Radial gradients for realistic dot appearance
- **Sound**: Optional sound trigger on flip

### Key Features

#### Display Modes
1. **Clock Mode**: Real-time clock with date display
   - 24-hour format (military time)
   - 12-hour format with AM/PM
   - Centered display with automatic scaling

2. **Text Mode**: ASCII text rendering
   - Full ASCII character support
   - Multi-line text support
   - Automatic text wrapping

3. **ASCII Art Mode**: Visual pattern creation
   - Draw with any characters
   - Non-space characters create lit dots
   - Full canvas for creative expression

4. **Direct Mode**: Matrix control
   - Direct dot manipulation with 1/0 or */space
   - Full control over individual dots
   - Pattern creation capabilities

#### UI Island
- **Persistent Visibility**: No auto-hide (can toggle with Space/Escape)
- **Minimize/Maximize**: Collapsible to compact view
- **Components**:
  - Mode selector dropdown
  - Matrix dimensions display
  - Status indicator (Active/Editing)
  - Sound controls with volume slider
  - Clock format toggles (12/24 hour)
  - Preset patterns (smile, heart, wave, scrolling text)

#### Bottom-Right Toggle
- **Premium Design**: Glassmorphic toggle switch
- **Edit/View Modes**: Smooth transition between modes
- **Visual Feedback**: Color-coded states (amber for edit, emerald for view)
- **Keyboard Shortcut**: Cmd/Ctrl+E for quick toggling

### Styling System

Tailwind CSS v4 with custom CSS properties for theming:
- Theme variables defined inline in `globals.css` using `@theme`
- Dark mode automatically switches based on system preference
- Custom properties: `--background` and `--foreground` for color theming
- Font families: `--font-geist-sans` and `--font-geist-mono`
- Glassmorphism effects with backdrop-blur and transparency

### TypeScript Configuration

Strict TypeScript configuration with:
- Target: ES2017
- Strict mode enabled
- Path aliases configured (`@/*` → `./src/*`)
- Next.js plugin for enhanced type checking
- Custom types for DisplayMode and ClockFormat

## Performance Optimizations

1. **React Optimizations**:
   - useCallback for all event handlers
   - useMemo for expensive calculations
   - React.memo on FlipDot component
   - Functional state updates

2. **Animation Optimizations**:
   - Reduced transition durations (200ms)
   - GPU-accelerated transforms
   - CSS containment for layout isolation
   - will-change hints for animations

3. **Event Handling**:
   - Throttled resize handler
   - Passive event listeners
   - Optimized clock update frequency
   - Debounced state updates

## Development Patterns

1. **Component Structure**: Place new components in `/flip-dot-display/src/components/`
2. **State Management**: Use React hooks and context for state
3. **CSS Approach**: Use Tailwind utility classes with glassmorphism effects
4. **Font Loading**: Use existing Geist font configuration in layout.tsx
5. **Performance**: Always consider re-render optimization with memo/callback

## Keyboard Shortcuts

- **Space/Escape**: Toggle UI Island visibility
- **Cmd/Ctrl+E**: Toggle between Edit and View modes (non-clock modes)

## Important Notes

- **No ESLint/Prettier**: Currently no linting configuration; maintain consistent code style manually
- **No Test Setup**: No testing framework configured yet
- **Working Directory**: Always run commands from `/flip-dot-display/` subdirectory
- **Turbopack**: Both dev and build commands use Turbopack for performance
- **UI Island**: Main control center that stays visible (no auto-hide)
- **Browser Support**: Modern browsers with CSS backdrop-filter support

## Recent Updates

1. **UI Island Implementation**: Replaced floating controls with persistent UI Island
2. **Clock Formats**: Added 12-hour and 24-hour time format support
3. **Performance Boost**: Comprehensive optimization reducing latency by ~40%
4. **Minimize/Maximize**: Collapsible UI Island for cleaner display
5. **No Auto-Hide**: UI Island remains visible for better user control