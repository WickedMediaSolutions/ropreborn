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

// Parse ANSI color codes and render as styled text
function parseAnsi(text) {
  // ANSI color codes: \x1b[0m (reset), \x1b[31m (red), \x1b[32m (green), etc.
  const ansiRegex = /\x1b\[([0-9;]*)m/g;
  const parts = [];
  let lastIndex = 0;
  let currentColor = null;

  const colorMap = {
    '0': 'reset',
    '31': 'red',
    '32': 'green',
    '33': 'yellow',
    '34': 'blue',
    '35': 'magenta',
    '36': 'cyan',
    '37': 'white',
    '1': 'bright'
  };

  let match;
  while ((match = ansiRegex.exec(text)) !== null) {
    // Add text before this ANSI code
    if (match.index > lastIndex) {
      const part = text.substring(lastIndex, match.index);
      parts.push(
        <span key={`text_${lastIndex}`} className={`ansi-${currentColor || 'default'}`}>
          {part}
        </span>
      );
    }

    // Update current color based on ANSI code
    const codes = match[1].split(';');
    for (const code of codes) {
      if (colorMap[code]) {
        if (code === '0') {
          currentColor = null;
        } else {
          currentColor = colorMap[code];
        }
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text_${lastIndex}`} className={`ansi-${currentColor || 'default'}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : text;
}
