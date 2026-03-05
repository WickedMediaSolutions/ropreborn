import React, { useState } from 'react';
import { useGameStore } from '../store';
import './MacrosPanel.css';

export function MacrosPanel() {
  const macros = useGameStore((state) => state.macros);
  const addMacro = useGameStore((state) => state.addMacro);
  const updateMacro = useGameStore((state) => state.updateMacro);
  const deleteMacro = useGameStore((state) => state.deleteMacro);
  const [showForm, setShowForm] = useState(false);
  const [newMacro, setNewMacro] = useState({ key: '', name: '', command: '' });

  const handleCreate = () => {
    if (newMacro.key && newMacro.name && newMacro.command) {
      addMacro(newMacro);
      setNewMacro({ key: '', name: '', command: '' });
      setShowForm(false);
    }
  };

  return (
    <div className="macros-panel">
      <div className="macros-header">
        <h4>Macros</h4>
        <button className="add-macro-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕' : '➕'}
        </button>
      </div>

      {showForm && (
        <div className="macro-form">
          <input
            type="text"
            placeholder="Key (e.g., F1)"
            value={newMacro.key}
            onChange={(e) => setNewMacro({ ...newMacro, key: e.target.value })}
          />
          <input
            type="text"
            placeholder="Name"
            value={newMacro.name}
            onChange={(e) => setNewMacro({ ...newMacro, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Command"
            value={newMacro.command}
            onChange={(e) => setNewMacro({ ...newMacro, command: e.target.value })}
          />
          <button onClick={handleCreate} className="create-btn">Create</button>
        </div>
      )}

      <div className="macros-list">
        {macros.map((macro) => (
          <div key={macro.id} className="macro-item">
            <div className="macro-key">{macro.key}</div>
            <div className="macro-info">
              <div className="macro-name">{macro.name}</div>
              <div className="macro-command">{macro.command}</div>
            </div>
            <button 
              className="delete-btn"
              onClick={() => deleteMacro(macro.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
