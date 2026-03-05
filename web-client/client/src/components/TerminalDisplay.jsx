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
    // Add text before this color code
    if (match.index > lastIndex) {
      const part = text.substring(lastIndex, match.index);
      parts.push(
        <span key={`text_${lastIndex}`} className={`ansi-${currentColor}`}>
          {part}
        </span>
      );
    }

    // Handle ROM color code {X}
    if (match[1]) {
      const romCode = match[1];
      currentColor = romColorMap[romCode] || 'default';
    }
    // Handle ANSI escape sequence
    else if (match[2]) {
      const ansiCode = match[2];
      const codes = ansiCode.split(';');
      let newColor = currentColor;

      for (const code of codes) {
        // Standard ANSI colors
        if (code === '31' || code === '1;31') newColor = 'red';
        else if (code === '32' || code === '1;32') newColor = 'green';
        else if (code === '33' || code === '1;33') newColor = 'yellow';
        else if (code === '34' || code === '1;34') newColor = 'blue';
        else if (code === '35' || code === '1;35') newColor = 'magenta';
        else if (code === '36' || code === '1;36') newColor = 'cyan';
        else if (code === '37' || code === '1;37') newColor = 'white';
        else if (code === '30' || code === '1;30') newColor = 'dark-grey';
        else if (code === '0') newColor = 'default'; // Reset
        else if (code === '1') {
          // Bright/bold - enhance current color if not reset
          if (currentColor !== 'default' && !currentColor.includes('bright')) {
            newColor = currentColor + '-bright';
          }
        }
      }
      currentColor = newColor;
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text_${lastIndex}`} className={`ansi-${currentColor}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : text;
}
