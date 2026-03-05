import React, { useState } from 'react';
import { TelnetTerminal } from './components/TelnetTerminal';
import { PlayerStats } from './components/PlayerStats';
import { GameMap } from './components/GameMap';
import { SpellsPanel } from './components/SpellsPanel';
import { EquipmentPanel } from './components/EquipmentPanel';
import { PartyPanel } from './components/PartyPanel';
import { MacrosPanel } from './components/MacrosPanel';
import { MessageHistory } from './components/MessageHistory';
import './App.css';

function App() {
  const [activePanel, setActivePanel] = useState('stats');
  
  const panels = {
    stats: <PlayerStats />,
    map: <GameMap />,
    spells: <SpellsPanel />,
    equipment: <EquipmentPanel />,
    party: <PartyPanel />,
    macros: <MacrosPanel />,
    history: <MessageHistory />
  };

  const panelButtons = [
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'spells', label: 'Spells', icon: '✨' },
    { id: 'equipment', label: 'Gear', icon: '🛡️' },
    { id: 'party', label: 'Party', icon: '👥' },
    { id: 'macros', label: 'Macros', icon: '⚙️' },
    { id: 'history', label: 'History', icon: '📜' }
  ];

  return (
    <div className="app">
      <div className="main-container">
        {/* Main Game Terminal */}
        <div className="game-section">
          <TelnetTerminal />
        </div>

        {/* Side Panels */}
        <div className="side-panel">
          <div className="panel-tabs">
            {panelButtons.map(btn => (
              <button
                key={btn.id}
                className={`tab-button ${activePanel === btn.id ? 'active' : ''}`}
                onClick={() => setActivePanel(btn.id)}
                title={btn.label}
              >
                {btn.icon}
              </button>
            ))}
          </div>
          <div className="panel-content">
            {panels[activePanel]}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
