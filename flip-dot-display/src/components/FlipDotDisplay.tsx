'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import FlipDot from './FlipDot';
import { textToMatrix, asciiArtToMatrix } from '@/lib/asciiFont';
import { useFlipDotSound } from '@/hooks/useFlipDotSound';

type DisplayMode = 'text' | 'ascii-art' | 'direct' | 'clock';

export default function FlipDotDisplay() {
  const [displayMatrix, setDisplayMatrix] = useState<boolean[][]>([]);
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });
  const [inputText, setInputText] = useState('HELLO WORLD\nFLIP DOT DISPLAY');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('clock');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound, soundSettings, setVolume, toggleSound } = useFlipDotSound();

  // Calculate grid dimensions for full viewport coverage
  useEffect(() => {
    const calculateDimensions = () => {
      const dotSize = window.innerWidth > 1024 ? 12 :
                      window.innerWidth > 768 ? 10 :
                      window.innerWidth > 640 ? 8 : 7;
      const gap = 1.5; // Smaller gap for higher density

      const cols = Math.floor((window.innerWidth - 10) / (dotSize + gap));
      const rows = Math.floor((window.innerHeight - 10) / (dotSize + gap));

      setDimensions({ cols, rows });
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, []);

  // Update clock
  useEffect(() => {
    if (displayMode === 'clock') {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [displayMode]);

  // Auto-hide controls system
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);

    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }

    const timeout = setTimeout(() => {
      setShowControls(false);
      setShowVolumeControl(false);
    }, 3000);

    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  // Show controls on mouse movement or key press
  useEffect(() => {
    const handleMouseMove = () => {
      showControlsTemporarily();
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Escape') {
        event.preventDefault();
        showControlsTemporarily();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [showControlsTemporarily, controlsTimeout]);

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
  }, [dimensions, inputText, displayMode, currentTime]);

  useEffect(() => {
    updateDisplay();
  }, [updateDisplay]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const loadPreset = (preset: string) => {
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
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-950" />

      {/* Full-Screen Dot Matrix */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isEditing && displayMode !== 'clock' ? (
          <div className="w-full max-w-4xl h-full flex flex-col items-center justify-center gap-4 p-8">
            <div className="text-gray-400 font-mono text-sm text-center">
              {displayMode === 'text' && 'Enter text to display (supports all ASCII characters):'}
              {displayMode === 'ascii-art' && 'Draw with any characters (non-space = lit dot):'}
              {displayMode === 'direct' && 'Enter matrix (1 or * = on, 0 or space = off):'}
            </div>
            <textarea
              value={inputText}
              onChange={handleInputChange}
              className="w-full h-96 bg-gray-900/80 backdrop-blur-sm text-green-400 font-mono p-4 rounded-xl border border-gray-700/50 resize-none"
              placeholder={
                displayMode === 'text' ? 'Type your message here...' :
                displayMode === 'ascii-art' ? 'Draw your ASCII art here...' :
                'Enter 0s and 1s to create patterns...'
              }
              spellCheck={false}
            />
            <div className="text-gray-500 text-xs font-mono text-center">
              Press DISPLAY to see your creation on the flip-dot matrix
            </div>
          </div>
        ) : (
          <div
            className="grid gap-[1.5px]"
            style={{
              gridTemplateColumns: `repeat(${dimensions.cols}, minmax(0, 1fr))`,
              width: '100vw',
              height: '100vh',
              padding: '5px'
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
                const delay = distance * 2;

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
        )}
      </div>

      {/* Floating Controls */}
      <div className={`transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

        {/* Top-left: Mode Selector */}
        <div className="absolute top-4 left-4 z-50">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-gray-700/50 p-3 shadow-2xl">
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
              className="bg-gray-800/80 text-gray-300 px-3 py-2 rounded-xl font-mono text-sm border border-gray-600/50 backdrop-blur-sm"
            >
              <option value="clock">🕐 Clock</option>
              <option value="text">📝 Text</option>
              <option value="ascii-art">🎨 ASCII Art</option>
              <option value="direct">⚡ Direct</option>
            </select>
          </div>
        </div>

        {/* Top-right: Sound Controls */}
        <div className="absolute top-4 right-4 z-50">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-gray-700/50 p-3 shadow-2xl volume-control-container">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSound}
                className={`p-2 rounded-xl transition-all ${
                  soundSettings.enabled
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-gray-700/50 text-gray-500 hover:bg-gray-600/50'
                }`}
                title={soundSettings.enabled ? 'Mute' : 'Unmute'}
              >
                {soundSettings.enabled ? '🔊' : '🔇'}
              </button>

              <button
                onClick={() => setShowVolumeControl(!showVolumeControl)}
                className="bg-gray-700/50 text-gray-300 px-3 py-2 rounded-xl text-xs hover:bg-gray-600/50 transition-all"
                title="Volume Control"
              >
                VOL
              </button>

              {showVolumeControl && (
                <div className="absolute top-full mt-2 right-0 bg-black/60 backdrop-blur-md border border-gray-700/50 rounded-xl p-4 z-20 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs font-mono">Volume:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={soundSettings.volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-24 accent-yellow-400"
                    />
                    <span className="text-gray-300 text-xs font-mono w-8">
                      {soundSettings.volume}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom-right: Edit Button */}
        {displayMode !== 'clock' && (
          <div className="absolute bottom-4 right-4 z-50">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-yellow-500/90 backdrop-blur-md text-black px-6 py-3 rounded-2xl font-mono text-sm hover:bg-yellow-400/90 transition-all shadow-2xl border border-yellow-400/50"
            >
              {isEditing ? '👁️ DISPLAY' : '✏️ EDIT'}
            </button>
          </div>
        )}


        {/* Top-center: Glassmorphism Island Toolbox */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Glass effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative px-6 py-4">
              <div className="flex items-center gap-6">
                {/* Matrix Display */}
                <div className="flex flex-col items-center">
                  <span className="text-yellow-400/80 text-[10px] font-mono uppercase tracking-wider">Matrix</span>
                  <span className="text-white/90 text-sm font-mono font-bold">{dimensions.cols}×{dimensions.rows}</span>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                {/* Current Mode */}
                <div className="flex flex-col items-center">
                  <span className="text-yellow-400/80 text-[10px] font-mono uppercase tracking-wider">Mode</span>
                  <span className="text-white/90 text-sm font-bold capitalize">
                    {displayMode === 'clock' && '🕐'}
                    {displayMode === 'text' && '📝'}
                    {displayMode === 'ascii-art' && '🎨'}
                    {displayMode === 'direct' && '⚡'}
                    {' '}
                    {displayMode === 'ascii-art' ? 'ASCII' : displayMode}
                  </span>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                {/* Status Indicator */}
                <div className="flex flex-col items-center">
                  <span className="text-yellow-400/80 text-[10px] font-mono uppercase tracking-wider">Status</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${isEditing ? 'bg-orange-400' : 'bg-green-400'} shadow-lg ${!isEditing && 'animate-pulse'}`} />
                    <span className="text-white/90 text-sm font-bold">
                      {isEditing ? 'Editing' : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                {/* Sound Status */}
                <div className="flex flex-col items-center">
                  <span className="text-yellow-400/80 text-[10px] font-mono uppercase tracking-wider">Sound</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-white/90 text-sm">
                      {soundSettings.enabled ? '🔊' : '🔇'}
                    </span>
                    <span className="text-white/60 text-xs font-mono">
                      {soundSettings.enabled ? `${soundSettings.volume}%` : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-center gap-2">
                  {displayMode === 'clock' ? (
                    <>
                      <button
                        onClick={() => setDisplayMode('text')}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs font-mono transition-all"
                      >
                        Switch to Text
                      </button>
                      <button
                        onClick={() => setDisplayMode('ascii-art')}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs font-mono transition-all"
                      >
                        Draw ASCII
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-white/40 text-[10px] font-mono uppercase mr-2">Presets:</span>
                      <button
                        onClick={() => loadPreset('smile')}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-all"
                        title="Smile Pattern"
                      >
                        😊
                      </button>
                      <button
                        onClick={() => loadPreset('heart')}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-all"
                        title="Heart Pattern"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={() => loadPreset('wave')}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-all"
                        title="Wave Pattern"
                      >
                        〰️
                      </button>
                      <button
                        onClick={() => loadPreset('scrolling')}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-all"
                        title="Text Demo"
                      >
                        ABC
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}