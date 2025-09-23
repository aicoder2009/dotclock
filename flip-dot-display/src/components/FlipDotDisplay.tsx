'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import FlipDot from './FlipDot';
import { textToMatrix, asciiArtToMatrix } from '@/lib/asciiFont';
import { useFlipDotSound } from '@/hooks/useFlipDotSound';

type DisplayMode = 'text' | 'ascii-art' | 'direct' | 'clock';
type ClockFormat = '12' | '24';

export default function FlipDotDisplay() {
  const [displayMatrix, setDisplayMatrix] = useState<boolean[][]>([]);
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });
  const [inputText, setInputText] = useState('HELLO WORLD\nFLIP DOT DISPLAY');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('clock');
  const [clockFormat, setClockFormat] = useState<ClockFormat>('24');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound, soundSettings, setVolume, toggleSound } = useFlipDotSound();

  // Calculate grid dimensions for full viewport coverage with throttling
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const calculateDimensions = () => {
      const dotSize = window.innerWidth > 1024 ? 12 :
                      window.innerWidth > 768 ? 10 :
                      window.innerWidth > 640 ? 8 : 7;
      const gap = 1.5; // Smaller gap for higher density

      const cols = Math.floor((window.innerWidth - 10) / (dotSize + gap));
      const rows = Math.floor((window.innerHeight - 10) / (dotSize + gap));

      setDimensions({ cols, rows });
    };

    const throttledResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateDimensions, 100);
    };

    calculateDimensions();
    window.addEventListener('resize', throttledResize, { passive: true });
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Update clock with optimized frequency
  useEffect(() => {
    if (displayMode === 'clock') {
      const timer = setInterval(() => {
        const newTime = new Date();
        // Only update if seconds have actually changed to reduce re-renders
        setCurrentTime(prevTime => {
          if (prevTime.getSeconds() !== newTime.getSeconds()) {
            return newTime;
          }
          return prevTime;
        });
      }, 500); // Check more frequently but update less frequently
      return () => clearInterval(timer);
    }
  }, [displayMode]);

  // UI Island visibility system (no longer auto-hiding)
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    // Removed auto-hide functionality - UI Island stays visible
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Toggle UI Island visibility with Space or Escape
      if (event.code === 'Space' || event.code === 'Escape') {
        event.preventDefault();
        setShowControls(!showControls);
      }

      // Toggle edit mode with Ctrl+E or Cmd+E
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyE' && displayMode !== 'clock') {
        event.preventDefault();
        setIsEditing(!isEditing);
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isEditing, displayMode, showControls]);

  // Close volume control when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showVolumeControl && !(event.target as Element).closest('.volume-control-container')) {
        setShowVolumeControl(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showVolumeControl]);

  const updateDisplay = useCallback(() => {
    const { cols, rows } = dimensions;
    if (cols === 0 || rows === 0) return;

    let matrix: boolean[][];

    switch (displayMode) {
      case 'text':
        matrix = textToMatrix(inputText, cols, rows);
        break;
      case 'ascii-art':
        matrix = asciiArtToMatrix(inputText, cols, rows);
        break;
      case 'direct':
        // Parse direct matrix input (0s and 1s)
        const directLines = inputText.split('\n');
        matrix = Array(rows).fill(null).map(() => Array(cols).fill(false));
        for (let r = 0; r < Math.min(directLines.length, rows); r++) {
          for (let c = 0; c < Math.min(directLines[r].length, cols); c++) {
            matrix[r][c] = directLines[r][c] === '1' || directLines[r][c] === '*';
          }
        }
        break;
      case 'clock':
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        const seconds = currentTime.getSeconds().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}:${seconds}`;
        const dateString = currentTime.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }).toUpperCase();

        // Center the time display
        const fullText = `\n\n\n${timeString}\n\n${dateString}`;
        const clockLines = fullText.split('\n');
        matrix = Array(rows).fill(null).map(() => Array(cols).fill(false));

        // Calculate vertical centering
        const totalHeight = clockLines.length * 8;
        const startRow = Math.max(0, Math.floor((rows - totalHeight) / 2));

        clockLines.forEach((line, lineIndex) => {
          // Calculate horizontal centering for each line
          const lineWidth = line.length * 6;
          const startCol = Math.max(0, Math.floor((cols - lineWidth) / 2));

          // Render the line
          const lineMatrix = textToMatrix(line, cols, 7);
          for (let r = 0; r < 7; r++) {
            for (let c = 0; c < lineMatrix[r].length; c++) {
              const targetRow = startRow + lineIndex * 8 + r;
              const targetCol = startCol + c;
              if (targetRow < rows && targetCol < cols) {
                matrix[targetRow][targetCol] = lineMatrix[r][c];
              }
            }
          }
        });
        break;
      default:
        matrix = Array(rows).fill(null).map(() => Array(cols).fill(false));
    }

    setDisplayMatrix(matrix);
  }, [dimensions, inputText, displayMode, currentTime, clockFormat]);

  useEffect(() => {
    updateDisplay();
  }, [updateDisplay]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  }, []);

  const handleModeChange = useCallback((newMode: DisplayMode) => {
    setDisplayMode(newMode);
  }, []);

  const handleClockFormatChange = useCallback((format: ClockFormat) => {
    setClockFormat(format);
  }, []);

  const handleToggleEditing = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const loadPreset = useCallback((preset: string) => {
    switch (preset) {
      case 'smile':
        setDisplayMode('ascii-art');
        setInputText(`
     ****
   **    **
  *        *
 *  *    *  *
 *          *
 *  *    *  *
  *  ****  *
   **    **
     ****
`);
        break;
      case 'heart':
        setDisplayMode('ascii-art');
        setInputText(`
   ***   ***
  ***** *****
 *************
 *************
  ***********
   *********
    *******
     *****
      ***
       *
`);
        break;
      case 'wave':
        setDisplayMode('ascii-art');
        setInputText(`
*     *     *     *     *
 *   * *   * *   * *   *
  * *   * *   * *   * *
   *     *     *     *
`);
        break;
      case 'scrolling':
        setDisplayMode('text');
        setInputText('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG 1234567890 !@#$%^&*()');
        break;
    }
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-950" />

      {/* Full-Screen Dot Matrix */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`transition-all duration-200 ease-in-out ${
          isEditing && displayMode !== 'clock'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none absolute'
        }`}>
          <div className="w-full max-w-4xl h-full flex flex-col items-center justify-center gap-4 p-8">
            <div className="text-gray-400 font-mono text-sm text-center">
              {displayMode === 'text' && 'Enter text to display (supports all ASCII characters):'}
              {displayMode === 'ascii-art' && 'Draw with any characters (non-space = lit dot):'}
              {displayMode === 'direct' && 'Enter matrix (1 or * = on, 0 or space = off):'}
            </div>
            <textarea
              value={inputText}
              onChange={handleInputChange}
              className="w-full h-96 bg-gray-900/80 backdrop-blur-sm text-green-400 font-mono p-4 rounded-xl border border-gray-700/50 resize-none transition-all duration-200"
              placeholder={
                displayMode === 'text' ? 'Type your message here...' :
                displayMode === 'ascii-art' ? 'Draw your ASCII art here...' :
                'Enter 0s and 1s to create patterns...'
              }
              spellCheck={false}
            />
            <div className="text-gray-500 text-xs font-mono text-center">
              Use Ctrl+E to toggle back to display mode
            </div>
          </div>
        </div>

        <div className={`transition-all duration-200 ease-in-out ${
          !isEditing || displayMode === 'clock'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none absolute'
        }`}>
          <div
            className="grid gap-[1.5px]"
            style={{
              gridTemplateColumns: `repeat(${dimensions.cols}, minmax(0, 1fr))`,
              width: '100vw',
              height: '100vh',
              padding: '5px',
              willChange: 'transform',
              contain: 'layout style paint'
            }}
          >
            {displayMatrix.map((row, rowIndex) =>
              row.map((isActive, colIndex) => {
                const centerRow = Math.floor(dimensions.rows / 2);
                const centerCol = Math.floor(dimensions.cols / 2);
                const distance = Math.sqrt(
                  Math.pow(rowIndex - centerRow, 2) +
                  Math.pow(colIndex - centerCol, 2)
                );
                const delay = distance * 1; // Reduced from 2 to 1 for faster animations

                return (
                  <FlipDot
                    key={`${rowIndex}-${colIndex}-${dimensions.cols}`}
                    isActive={isActive}
                    delay={delay}
                    onFlip={playSound}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* UI Island Controls */}
      <div className={`transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>


        {/* Bottom-right: Premium Edit/Display Toggle */}
        {displayMode !== 'clock' && (
          <div className="absolute bottom-4 right-4 z-50">
            <div className="group bg-gray-900/20 backdrop-blur-2xl rounded-3xl border border-white/10 p-5 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-gray-900/30">
              {/* State indicator and label */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end min-w-0">
                  <div className="text-white/40 text-[9px] font-mono uppercase tracking-[0.1em] mb-1">Mode</div>
                  <div className={`text-sm font-semibold transition-all duration-300 ${
                    isEditing
                      ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  }`}>
                    {isEditing ? 'Edit' : 'View'}
                  </div>
                </div>

                {/* Premium toggle switch */}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="relative w-14 h-8 rounded-full transition-all duration-300 ease-out group-hover:scale-[1.05] focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent"
                  style={{
                    background: isEditing
                      ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)'
                      : 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
                    boxShadow: isEditing
                      ? '0 6px 20px -2px rgba(251, 191, 36, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                      : '0 6px 20px -2px rgba(52, 211, 153, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                  title={`Switch to ${isEditing ? 'View' : 'Edit'} mode (⌘E)`}
                >
                  {/* Sliding indicator */}
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ease-out transform ${
                      isEditing ? 'translate-x-7' : 'translate-x-1'
                    }`}
                    style={{
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <span className={`text-xs transition-all duration-200 ${
                        isEditing ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {isEditing ? '✏' : '👁'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Keyboard shortcut hint (appears on hover) */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <div className="bg-black/60 backdrop-blur-lg px-2.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
                    <span className="text-white/60 text-[10px] font-mono tracking-wider">⌘E</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* UI Island - Main Control Center */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`bg-gray-900/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl transition-all duration-300 ease-in-out ${
            isMinimized ? 'overflow-hidden' : ''
          }`}>
            <div className={`${isMinimized ? 'px-3 py-2' : 'px-6 py-4'}`}>
              {/* UI Island Minimize/Maximize Toggle */}
              <div className="flex items-start gap-4">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 group"
                  title={isMinimized ? 'Expand UI Island' : 'Minimize UI Island'}
                >
                  <svg
                    className={`w-4 h-4 text-white/60 group-hover:text-white/90 transition-all duration-200 ${
                      isMinimized ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    {isMinimized ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    )}
                  </svg>
                </button>

                {/* UI Island Minimized View - Compact Info */}
                {isMinimized ? (
                  <div className="flex items-center gap-3">
                    {/* Mode indicator with better styling */}
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                      <span className="text-lg">
                        {displayMode === 'clock' && '🕐'}
                        {displayMode === 'text' && '📝'}
                        {displayMode === 'ascii-art' && '🎨'}
                        {displayMode === 'direct' && '⚡'}
                      </span>
                      <span className="text-white/90 text-sm font-mono font-semibold">
                        {displayMode === 'ascii-art' ? 'ASCII' : displayMode.charAt(0).toUpperCase() + displayMode.slice(1)}
                      </span>
                    </div>

                    {/* Matrix dimensions with better visual hierarchy */}
                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                      <span className="text-white/50 text-[10px] font-mono uppercase tracking-wider">Grid</span>
                      <span className="text-white/90 text-sm font-mono font-bold">{dimensions.cols}×{dimensions.rows}</span>
                    </div>

                    {/* Status indicator with label */}
                    <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                      <div className={`w-2 h-2 rounded-full ${isEditing ? 'bg-amber-400' : 'bg-emerald-400'} ${!isEditing && 'animate-pulse'}`} />
                      <span className={`text-xs font-medium ${
                        isEditing ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {isEditing ? 'Edit' : 'Live'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    {/* UI Island Primary Controls Row */}
                    <div className="flex items-center gap-8">
                {/* Mode Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-white/50 text-xs font-mono uppercase tracking-wider">Mode</span>
                  <select
                    value={displayMode}
                    onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
                    className="bg-gray-800/60 text-white px-3 py-1.5 rounded-lg font-mono text-sm border border-gray-600/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="clock">🕐 Clock</option>
                    <option value="text">📝 Text</option>
                    <option value="ascii-art">🎨 ASCII</option>
                    <option value="direct">⚡ Direct</option>
                  </select>
                </div>

                {/* Matrix Info */}
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs font-mono">Matrix</span>
                  <span className="text-white/90 text-sm font-mono font-semibold">{dimensions.cols}×{dimensions.rows}</span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isEditing ? 'bg-amber-400' : 'bg-emerald-400'} ${!isEditing && 'animate-pulse'}`} />
                  <span className={`text-sm font-medium ${
                    isEditing ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {isEditing ? 'Editing' : 'Active'}
                  </span>
                </div>

                {/* Sound Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSound}
                    className={`p-2 rounded-lg transition-all ${
                      soundSettings.enabled
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                    }`}
                    title={soundSettings.enabled ? 'Mute' : 'Unmute'}
                  >
                    {soundSettings.enabled ? '🔊' : '🔇'}
                  </button>

                  <div className="relative volume-control-container">
                    <button
                      onClick={() => setShowVolumeControl(!showVolumeControl)}
                      className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded-lg text-xs hover:bg-gray-600/50 transition-all"
                      title="Volume"
                    >
                      {soundSettings.volume}%
                    </button>

                    {showVolumeControl && (
                      <div className="absolute top-full mt-2 right-0 bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-xl z-20">
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={soundSettings.volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="w-20 accent-yellow-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

                    {/* UI Island Secondary Actions (Presets/Mode switches) */}
                    {!isMinimized && (displayMode !== 'clock' || displayMode === 'clock') && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2">
                    {displayMode === 'clock' ? (
                      <>
                        <span className="text-white/40 text-[10px] font-mono uppercase mr-2">Format:</span>
                        <button
                          onClick={() => setClockFormat('24')}
                          className={`px-3 py-1 rounded-lg text-xs transition-all ${
                            clockFormat === '24'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          24 Hour
                        </button>
                        <button
                          onClick={() => setClockFormat('12')}
                          className={`px-3 py-1 rounded-lg text-xs transition-all ${
                            clockFormat === '12'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          12 Hour
                        </button>
                        <div className="w-px h-4 bg-white/20 mx-1" />
                        <button
                          onClick={() => setDisplayMode('text')}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-all"
                        >
                          Text Mode
                        </button>
                        <button
                          onClick={() => setDisplayMode('ascii-art')}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-all"
                        >
                          ASCII Art
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-white/40 text-[10px] font-mono uppercase mr-2">Quick:</span>
                        <button
                          onClick={() => loadPreset('smile')}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-all"
                          title="Smile"
                        >
                          😊
                        </button>
                        <button
                          onClick={() => loadPreset('heart')}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-all"
                          title="Heart"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={() => loadPreset('wave')}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-all"
                          title="Wave"
                        >
                          〰️
                        </button>
                        <button
                          onClick={() => loadPreset('scrolling')}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-all"
                          title="Demo Text"
                        >
                          ABC
                        </button>
                      </>
                    )}
                  </div>
                </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}