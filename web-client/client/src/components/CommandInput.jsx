import React, { useRef, useState } from 'react';
import { useGameStore } from '../store';
import './CommandInput.css';

export function CommandInput() {
  const [input, setInput] = useState('');
  const ws = useGameStore((state) => state.ws);
  const addOutput = useGameStore((state) => state.addOutput);
  const addCommand = useGameStore((state) => state.addCommand);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Send command to server
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'command',
        command: input
      }));
      addCommand(input);
      addOutput(`> ${input}`);
      setInput('');
    } else {
      addOutput('ERROR: Not connected to server');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // TODO: implement command history navigation
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // TODO: implement command history navigation
    }
  };

  return (
    <form className="command-input-form" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <span className="input-prompt">></span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          className="command-input"
          autoFocus
        />
      </div>
      <button type="submit" className="send-button">Send</button>
    </form>
  );
}
