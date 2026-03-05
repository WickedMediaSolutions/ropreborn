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
    if (e) e.preventDefault();
    const trimmedInput = input.trim();
    
    if (!trimmedInput) return;

    console.log('Submitting command:', trimmedInput); // DEBUG
    
    // Send command to server
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'command',
        command: trimmedInput
      }));
      addCommand(trimmedInput);
      addOutput(`> ${trimmedInput}`);
      setInput('');
      inputRef.current?.focus();
    } else {
      addOutput('ERROR: Not connected to server');
      console.error('WebSocket not connected'); // DEBUG
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      console.log('Enter key pressed'); // DEBUG
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
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
