import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import './TerminalDisplay.css';

export function TerminalDisplay() {
  const outputLog = useGameStore((state) => state.outputLog);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [outputLog]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <span className="terminal-title">⚔️ ROM MUD - Rites of Passage</span>
        <span className="terminal-info">Connected • Active</span>
      </div>
      <div className="terminal-display" ref={scrollRef}>
        {outputLog.map((line) => (
          <div key={line.id} className="terminal-line">
            {parseAnsi(line.text)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Parse both ROM color codes {R}, {G}, etc. and ANSI escape sequences
function parseAnsi(text) {
  if (!text) return '';
  
  const parts = [];
  let lastIndex = 0;
  let currentColor = 'default';
  let currentBright = false;

  // ROM color code map: {X} format
  const romColorMap = {
    'R': 'red',      // {R} = Red
    'G': 'green',    // {G} = Green
    'B': 'blue',     // {B} = Blue
    'Y': 'yellow',   // {Y} = Yellow
    'M': 'magenta',  // {M} = Magenta
    'C': 'cyan',     // {C} = Cyan
    'W': 'white',    // {W} = White
    'D': 'dark-grey',// {D} = Dark Grey
    'x': 'default'   // {x} = Reset
  };

  // Combined regex to match both ROM codes {X} and ANSI codes \x1b[...m
  const colorRegex = /\{([RGBYMCWDx])\}|\x1b\[([0-9;]*)m/g;

  let match;
  while ((match = colorRegex.exec(text)) !== null) {
    // Add text before this color code with current color
    if (match.index > lastIndex) {
      const part = text.substring(lastIndex, match.index);
      const className = currentBright ? `${currentColor}-bright` : currentColor;
      parts.push(
        <span key={`text_${lastIndex}`} className={`ansi-${className}`}>
          {part}
        </span>
      );
    }

    // Handle ROM color code {X}
    if (match[1]) {
      const romCode = match[1];
      if (romCode === 'x') {
        currentColor = 'default';
        currentBright = false;
      } else {
        currentColor = romColorMap[romCode] || 'default';
        currentBright = false;
      }
      console.log('ROM color code:', romCode, '-> color:', currentColor); // DEBUG
    }
    // Handle ANSI escape sequence
    else if (match[2] !== undefined) {
      const ansiCodes = match[2].split(';').filter(c => c);
      
      for (const code of ansiCodes) {
        // Standard ANSI color codes
        switch(code) {
          case '30': currentColor = 'dark-grey'; currentBright = false; break;
          case '31': currentColor = 'red'; currentBright = false; break;
          case '32': currentColor = 'green'; currentBright = false; break;
          case '33': currentColor = 'yellow'; currentBright = false; break;
          case '34': currentColor = 'blue'; currentBright = false; break;
          case '35': currentColor = 'magenta'; currentBright = false; break;
          case '36': currentColor = 'cyan'; currentBright = false; break;
          case '37': currentColor = 'white'; currentBright = false; break;
          case '1': currentBright = true; break; // Bold
          case '0': currentColor = 'default'; currentBright = false; break; // Reset
        }
      }
      console.log('ANSI codes:', ansiCodes, '-> color:', currentColor, 'bright:', currentBright); // DEBUG
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    const className = currentBright ? `${currentColor}-bright` : currentColor;
    parts.push(
      <span key={`text_${lastIndex}`} className={`ansi-${className}`}>
        {remaining}
      </span>
    );
  }

  return parts.length > 0 ? parts : text;
}
