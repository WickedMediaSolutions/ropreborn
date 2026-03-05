import React from 'react';
import { useGameStore } from '../store';
import './PartyPanel.css';

export function PartyPanel() {
  const party = useGameStore((state) => state.party);

  return (
    <div className="party-panel">
      <h4>Party</h4>
      <div className="party-members">
        {party.map((member, idx) => (
          <div key={idx} className="member-card">
            <div className="member-name">{member.name}</div>
            <div className="member-level">Lvl {member.level}</div>
            <div className="member-hp-bar">
              <div 
                className="hp-fill"
                style={{ width: `${(member.hp / member.maxHp) * 100}%` }}
              ></div>
            </div>
            <div className="member-hp-text">{member.hp}/{member.maxHp}</div>
          </div>
        ))}
      </div>
      {party.length === 1 && (
        <p className="no-party">You are adventuring solo</p>
      )}
    </div>
  );
}
