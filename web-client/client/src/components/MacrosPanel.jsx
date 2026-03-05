import React, { useState } from 'react';
import { useGameStore } from '../store';
import './MacrosPanel.css';

export function MacrosPanel() {
  const macros = useGameStore((state) => state.macros);

  return (
    <div className="macros-panel">
      <h4>Macros & Hotkeys ({macros.length})</h4>
      <div className="macros-list">
        {macros.length > 0 ? (
          macros.map((macro) => (
            <div key={macro.id} className="macro-item">
              <div className="macro-key">{macro.key}</div>
              <div className="macro-info">
                <div className="macro-name">{macro.name}</div>
                <div className="macro-command">{macro.command}</div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-macros">No macros configured</p>
        )}
      </div>
    </div>
  );
}
