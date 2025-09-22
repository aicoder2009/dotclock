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
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound, soundSettings, setVolume, toggleSound } = useFlipDotSound();

  // Calculate grid dimensions based on viewport
  useEffect(() => {
    const calculateDimensions = () => {
      const dotSize = window.innerWidth > 1024 ? 15 :
                      window.innerWidth > 768 ? 13 :
                      window.innerWidth > 640 ? 11 : 9;
      const gap = 2;

      const cols = Math.floor((window.innerWidth - 40) / (dotSize + gap));
      const rows = Math.floor((window.innerHeight - 200) / (dotSize + gap));

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

      {/* Control Panel */}
      <div className="relative z-10 p-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-yellow-400 font-mono font-bold text-lg">FLIP DOT MATRIX</h1>
            <span className="text-gray-500 text-sm font-mono">{dimensions.cols}×{dimensions.rows}</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
              className="bg-gray-800 text-gray-300 px-3 py-1 rounded font-mono text-sm border border-gray-700"
            >
              <option value="clock">Clock Mode</option>
              <option value="text">Text Mode</option>
              <option value="ascii-art">ASCII Art</option>
              <option value="direct">Direct Matrix</option>
            </select>

            {displayMode !== 'clock' && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-yellow-500 text-black px-4 py-1 rounded font-mono text-sm hover:bg-yellow-400 transition-colors"
              >
                {isEditing ? 'DISPLAY' : 'EDIT'}
              </button>
            )}

            {/* Sound Controls */}
            <div className="relative flex items-center gap-2 volume-control-container">
              <button
                onClick={toggleSound}
                className={`p-1.5 rounded transition-colors ${
                  soundSettings.enabled
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                    : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                }`}
                title={soundSettings.enabled ? 'Mute' : 'Unmute'}
              >
                {soundSettings.enabled ? '🔊' : '🔇'}
              </button>

              <button
                onClick={() => setShowVolumeControl(!showVolumeControl)}
                className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-700"
                title="Volume Control"
              >
                VOL
              </button>

              {showVolumeControl && (
                <div className="absolute top-full mt-2 right-0 bg-gray-900 border border-gray-700 rounded-lg p-3 z-20 shadow-xl">
                  <div className="flex items-center gap-2">
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

            <div className="flex gap-1 ml-2">
              <button
                onClick={() => loadPreset('smile')}
                className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-700"
                title="Smile"
              >
                😊
              </button>
              <button
                onClick={() => loadPreset('heart')}
                className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-700"
                title="Heart"
              >
                ❤️
              </button>
              <button
                onClick={() => loadPreset('wave')}
                className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-700"
                title="Wave"
              >
                〰️
              </button>
              <button
                onClick={() => loadPreset('scrolling')}
                className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-700"
                title="Text"
              >
                ABC
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="relative w-full h-[calc(100%-80px)] flex items-center justify-center p-4">
        {isEditing && displayMode !== 'clock' ? (
          <div className="w-full max-w-4xl h-full flex flex-col gap-4">
            <div className="text-gray-400 font-mono text-sm">
              {displayMode === 'text' && 'Enter text to display (supports all ASCII characters):'}
              {displayMode === 'ascii-art' && 'Draw with any characters (non-space = lit dot):'}
              {displayMode === 'direct' && 'Enter matrix (1 or * = on, 0 or space = off):'}
            </div>
            <textarea
              value={inputText}
              onChange={handleInputChange}
              className="flex-1 bg-gray-900 text-green-400 font-mono p-4 rounded border border-gray-700 resize-none"
              placeholder={
                displayMode === 'text' ? 'Type your message here...' :
                displayMode === 'ascii-art' ? 'Draw your ASCII art here...' :
                'Enter 0s and 1s to create patterns...'
              }
              spellCheck={false}
            />
            <div className="text-gray-500 text-xs font-mono">
              Press DISPLAY to see your creation on the flip-dot matrix
            </div>
          </div>
        ) : (
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${dimensions.cols}, minmax(0, 1fr))`
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
    </div>
  );
}