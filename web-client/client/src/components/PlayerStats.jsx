import React from 'react';
import { useGameStore } from '../store';
import './PlayerStats.css';

export function PlayerStats() {
  const stats = useGameStore((state) => state.playerStats);

  const hpPercent = (stats.hp / stats.maxHp) * 100;
  const manaPercent = (stats.mana / stats.maxMana) * 100;
  const movesPercent = (stats.moves / stats.maxMoves) * 100;
  const expPercent = (stats.experience / stats.nextLevel) * 100;

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h3>{stats.name || 'Your Character'}</h3>
        <div className="stats-badges">
          <span className="badge level">Level {stats.level}</span>
          <span className="badge race">{stats.race}</span>
          <span className="badge class">{stats.class}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">HP</div>
          <div className="stat-bar hp-bar">
            <div className="stat-fill" style={{ width: `${hpPercent}%` }}></div>
          </div>
          <div className="stat-value">{stats.hp}/{stats.maxHp}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Mana</div>
          <div className="stat-bar mana-bar">
            <div className="stat-fill" style={{ width: `${manaPercent}%` }}></div>
          </div>
          <div className="stat-value">{stats.mana}/{stats.maxMana}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Moves</div>
          <div className="stat-bar moves-bar">
            <div className="stat-fill" style={{ width: `${movesPercent}%` }}></div>
          </div>
          <div className="stat-value">{stats.moves}/{stats.maxMoves}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Experience</div>
          <div className="stat-bar exp-bar">
            <div className="stat-fill" style={{ width: `${expPercent}%` }}></div>
          </div>
          <div className="stat-value">{stats.experience}/{stats.nextLevel}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Gold</div>
          <div className="stat-box-value">{stats.gold.toLocaleString()}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Alignment</div>
          <div className="stat-box-value">{stats.alignment}</div>
        </div>
      </div>
    </div>
  );
}
