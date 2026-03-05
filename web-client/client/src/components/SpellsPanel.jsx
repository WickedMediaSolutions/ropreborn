import React from 'react';
import { useGameStore } from '../store';
import './SpellsPanel.css';

export function SpellsPanel() {
  const spells = useGameStore((state) => state.spells);
  const castSpell = useGameStore((state) => state.castSpell);
  const playerStats = useGameStore((state) => state.playerStats);

  const canCast = (spell) => {
    return playerStats.mana >= spell.mana && spell.cooldown === 0;
  };

  return (
    <div className="spells-panel">
      <h4>Spells & Skills</h4>
      <div className="spells-grid">
        {spells.map((spell) => (
          <button
            key={spell.id}
            className={`spell-button ${canCast(spell) ? 'available' : 'unavailable'}`}
            onClick={() => canCast(spell) && castSpell(spell.id)}
            disabled={!canCast(spell)}
            title={spell.description}
          >
            <div className="spell-name">{spell.name}</div>
            <div className="spell-cost">⚡ {spell.mana}</div>
            {spell.cooldown > 0 && <div className="spell-cooldown">{spell.cooldown}s</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
