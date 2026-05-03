# 🟡 DotClock - Flip Dot Display Simulator

**Live:** https://flip-dot-display.vercel.app

A sophisticated web-based flip-dot display simulator that recreates the mesmerizing aesthetic of classic electromechanical displays with modern web technologies.

![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06b6d4?style=flat-square&logo=tailwindcss)

## ✨ Features

### 🎯 Display Modes

- **🕐 Clock Mode**: Real-time digital clock with date
  - 24-hour format (military time)
  - 12-hour format with AM/PM indicator
  - Auto-centered display with smooth updates

- **📝 Text Mode**: Full ASCII text rendering
  - Multi-line text support
  - All ASCII characters supported
  - Perfect for messages and announcements

- **🎨 ASCII Art Mode**: Creative pattern drawing
  - Draw with any characters
  - Create pixel art and patterns
  - Full canvas for artistic expression

- **⚡ Direct Mode**: Matrix-level control
  - Direct dot manipulation (1/0 or */space)
  - Create custom patterns
  - Full control over individual dots

### 🎛️ UI Island

The main control center featuring:
- **Persistent visibility** - no auto-hide behavior
- **Minimize/Maximize toggle** - collapse to compact view
- **Mode selector** - quick switching between display modes
- **Matrix info** - real-time grid dimensions
- **Status indicator** - Active/Editing states with visual feedback
- **Sound controls** - Volume slider and mute toggle
- **Quick presets** - Instant patterns (smile, heart, wave, text demo)

### 🔄 Edit/View Toggle

Premium glassmorphic toggle switch:
- **Smooth transitions** between edit and view modes
- **Color-coded states** - Amber for edit, Emerald for view
- **Keyboard shortcut** - `Cmd/Ctrl+E` for quick switching

### ⚡ Performance Features

- **Optimized rendering** with React.memo and useCallback
- **GPU-accelerated animations**
- **Throttled resize handling**
- **Smart clock updates** - only re-render on second change
- **Reduced animation delays** for snappier feel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dotclock.git
cd dotclock/flip-dot-display
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

```bash
npm run build
npm run start
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` or `Esc` | Toggle UI Island visibility |
| `Cmd/Ctrl + E` | Switch between Edit/View modes |

## 🎨 Customization

### Adding Custom Presets

Edit `loadPreset()` function in `FlipDotDisplay.tsx`:

```typescript
case 'custom':
  setDisplayMode('ascii-art');
  setInputText(`Your ASCII art here`);
  break;
```

### Modifying Grid Size

The grid automatically adjusts to viewport size. Modify the calculation in `calculateDimensions()`:

```typescript
const dotSize = window.innerWidth > 1024 ? 12 : 10; // Adjust sizes
const gap = 1.5; // Adjust gap between dots
```

## 🏗️ Architecture

### Tech Stack
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling with custom theme
- **Turbopack** - Fast bundler

### Project Structure
```
flip-dot-display/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   │   ├── FlipDotDisplay.tsx
│   │   └── FlipDot.tsx
│   ├── lib/             # Utilities
│   └── hooks/           # Custom hooks
└── public/              # Static assets
```

### Key Components

- **FlipDotDisplay**: Main display controller with UI Island
- **FlipDot**: Individual dot component (memoized for performance)
- **UI Island**: Glassmorphic control center
- **Sound System**: Audio feedback for dot flips

## 🎯 Performance Optimizations

- React.memo on FlipDot components
- useCallback for event handlers
- useMemo for expensive calculations
- Throttled resize handlers (100ms debounce)
- CSS containment for layout isolation
- GPU-accelerated transforms

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by classic Alfa Zeta flip-dot displays
- Built with Next.js and React
- Styled with Tailwind CSS
- Sound effects for authentic mechanical feel

## 📞 Contact

Project Link: [https://github.com/yourusername/dotclock](https://github.com/yourusername/dotclock)

---

Built with ❤️ using modern web technologies