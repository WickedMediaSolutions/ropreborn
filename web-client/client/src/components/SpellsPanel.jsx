import React from 'react';
import { useGameStore } from '../store';
import './SpellsPanel.css';

export function SpellsPanel() {
  const spells = useGameStore((state) => state.spells);
  const playerStats = useGameStore((state) => state.playerStats);

  return (
    <div className="spells-panel">
      <h4>Spells & Skills ({spells.length})</h4>
      <div className="spells-grid">
        {spells.length > 0 ? (
          spells.map((spell) => (
            <div key={spell.id} className="spell-button" title={spell.description}>
              <div className="spell-name">{spell.name}</div>
              {spell.mana && <div className="spell-cost">⚡ {spell.mana}</div>}
              {spell.cooldown && spell.cooldown > 0 && <div className="spell-cooldown">{spell.cooldown}s</div>}
            </div>
          ))
        ) : (
          <p className="no-spells">No spells learned yet</p>
        )}
      </div>
    </div>
  );
}
