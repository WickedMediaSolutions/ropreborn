import React, { useState } from 'react';
import { useGameStore } from '../store';
import './MessageHistory.css';

export function MessageHistory() {
  const messageHistory = useGameStore((state) => state.messageHistory);
  const searchOutput = useGameStore((state) => state.searchOutput);
  const [searchQuery, setSearchQuery] = useState('');

  const results = searchQuery ? searchOutput(searchQuery) : messageHistory;

  return (
    <div className="message-history">
      <h4>Message History</h4>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button 
            className="clear-search"
            onClick={() => setSearchQuery('')}
          >
            ✕
          </button>
        )}
      </div>

      <div className="message-list">
        {results.length > 0 ? (
          results.map((msg) => (
            <div key={msg.id} className="message-item">
              {msg.timestamp && (
                <span className="timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              )}
              <span className="message-text">{msg.text}</span>
            </div>
          ))
        ) : (
          <p className="no-messages">
            {searchQuery ? 'No messages found' : 'No messages yet'}
          </p>
        )}
      </div>
    </div>
  );
}
