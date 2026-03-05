import React, { useEffect, useState } from 'react';
import { useGameStore } from './store';
import { TerminalDisplay } from './components/TerminalDisplay';
import { PlayerStats } from './components/PlayerStats';
import { CommandInput } from './components/CommandInput';
import { GameMap } from './components/GameMap';
import { SpellsPanel } from './components/SpellsPanel';
import { EquipmentPanel } from './components/EquipmentPanel';
import { PartyPanel } from './components/PartyPanel';
import { MacrosPanel } from './components/MacrosPanel';
import { MessageHistory } from './components/MessageHistory';
import './App.css';

function App() {
  const connected = useGameStore((state) => state.connected);
  const setConnected = useGameStore((state) => state.setConnected);
  const setWs = useGameStore((state) => state.setWs);
  const addOutput = useGameStore((state) => state.addOutput);
  const updateStats = useGameStore((state) => state.updateStats);
  const togglePanel = useGameStore((state) => state.togglePanel);
  const executeMacro = useGameStore((state) => state.executeMacro);
  const keybindings = useGameStore((state) => state.keybindings);
  
  const [showMap, setShowMap] = useState(false);
  const [showSpells, setShowSpells] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [showParty, setShowParty] = useState(false);
  const [showMacros, setShowMacros] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:5001/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to server');
      setConnected(true);
      setWs(ws);
      addOutput('='.repeat(60));
      addOutput('⚔️ Welcome to ROM MUD - Rites of Passage ⚔️');
      addOutput('A web-based multiplayer text adventure game');
      addOutput('Press F1-F3 for macros, E for equipment, I for inventory');
      addOutput('='.repeat(60));
      addOutput('');
      
      ws.send(JSON.stringify({ type: 'connect' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'output') {
          addOutput(data.data);
          if (data.stats) {
            updateStats(data.stats);
          }
        } else if (data.type === 'status') {
          addOutput(`[${data.message}]`);
        } else if (data.type === 'error') {
          addOutput(`ERROR: ${data.message}`);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addOutput('🔴 Connection error - check console for details');
      setConnected(false);
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
      setConnected(false);
      addOutput('🔴 Disconnected from server');
    };

    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.key === 'F1') { e.preventDefault(); executeMacro('F1'); }
      if (e.key === 'F2') { e.preventDefault(); executeMacro('F2'); }
      if (e.key === 'F3') { e.preventDefault(); executeMacro('F3'); }
      if (e.key === 'e' && e.ctrlKey === false) { e.preventDefault(); setShowEquipment(!showEquipment); }
      if (e.key === 'i' && e.ctrlKey === false) { e.preventDefault(); setShowParty(!showParty); }
      if (e.key === 'm' && e.ctrlKey === false) { e.preventDefault(); setShowMap(!showMap); }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚔️ Rites of Passage MUD ⚔️</h1>
        <p>A Web-Based Multiplayer Text Adventure</p>
      </header>

      <div className="app-container">
        <div className="main-section">
          <div className="terminal-section">
            <TerminalDisplay />
            <CommandInput />
          </div>

          {/* Right Panel - Dynamic Modules */}
          <div className="right-panel">
            <div className="panel-tabs">
              <button 
                className={`tab-btn ${showMap ? 'active' : ''}`}
                onClick={() => setShowMap(!showMap)}
              >
                🗺️ Map
              </button>
              <button 
                className={`tab-btn ${showSpells ? 'active' : ''}`}
                onClick={() => setShowSpells(!showSpells)}
              >
                ✨ Spells
              </button>
              <button 
                className={`tab-btn ${showEquipment ? 'active' : ''}`}
                onClick={() => setShowEquipment(!showEquipment)}
              >
                ⚔️ Gear
              </button>
              <button 
                className={`tab-btn ${showParty ? 'active' : ''}`}
                onClick={() => setShowParty(!showParty)}
              >
                👥 Party
              </button>
              <button 
                className={`tab-btn ${showMacros ? 'active' : ''}`}
                onClick={() => setShowMacros(!showMacros)}
              >
                🎮 Macros
              </button>
              <button 
                className={`tab-btn ${showHistory ? 'active' : ''}`}
                onClick={() => setShowHistory(!showHistory)}
              >
                📜 History
              </button>
            </div>

            <div className="panel-content">
              {showMap && <GameMap />}
              {showSpells && <SpellsPanel />}
              {showEquipment && <EquipmentPanel />}
              {showParty && <PartyPanel />}
              {showMacros && <MacrosPanel />}
              {showHistory && <MessageHistory />}
              {!showMap && !showSpells && !showEquipment && !showParty && !showMacros && !showHistory && (
                <div className="stats-panel"><PlayerStats /></div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
        <span>{connected ? '🟢 Connected' : '🔴 Offline'}</span>
        <span className="footer-tips">F1-F3: Macros | E: Equipment | I: Party | M: Map</span>
      </footer>
    </div>
  );
}

export default App;
