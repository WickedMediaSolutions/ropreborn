import React from 'react';
import { useGameStore } from '../store';
import './PlayerStats.css';

export function PlayerStats() {
  const stats = useGameStore((state) => state.playerStats);

  const hpPercent = stats.maxHp > 0 ? (stats.hp / stats.maxHp) * 100 : 0;
  const manaPercent = stats.maxMana > 0 ? (stats.mana / stats.maxMana) * 100 : 0;
  const movesPercent = stats.maxMoves > 0 ? (stats.moves / stats.maxMoves) * 100 : 0;
  const totalExpForLevel = (stats.experience || 0) + (stats.nextLevel || 0);
  const expPercent = totalExpForLevel > 0 ? (stats.experience / totalExpForLevel) * 100 : 0;

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
          <div className="stat-label">Experience Progress</div>
          <div className="stat-bar exp-bar">
            <div className="stat-fill" style={{ width: `${expPercent}%` }}></div>
          </div>
          <div className="stat-value">{Math.round(expPercent)}%</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Current EXP</div>
          <div className="stat-box-value">{(stats.experience || 0).toLocaleString()}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">EXP To Level</div>
          <div className="stat-box-value">{(stats.nextLevel || 0).toLocaleString()}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Gold</div>
          <div className="stat-box-value">{stats.gold.toLocaleString()}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Silver</div>
          <div className="stat-box-value">{stats.silver.toLocaleString()}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Alignment</div>
          <div className="stat-box-value">{stats.alignment > 0 ? '+' : ''}{stats.alignment}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Practices</div>
          <div className="stat-box-value">{stats.practice}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Damage Bonus</div>
          <div className="stat-box-value">{stats.damroll > 0 ? '+' : ''}{stats.damroll}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Hit Bonus</div>
          <div className="stat-box-value">{stats.hitroll > 0 ? '+' : ''}{stats.hitroll}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Evasion</div>
          <div className="stat-box-value">{stats.evasion}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">War Points</div>
          <div className="stat-box-value">{stats.warpoint}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Wimpy</div>
          <div className="stat-box-value">{stats.wimpy}%</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Remorts</div>
          <div className="stat-box-value">{stats.remorts}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Age</div>
          <div className="stat-box-value">{stats.age || 0}</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Playtime</div>
          <div className="stat-box-value">{stats.playtime || 0}h</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">Weight</div>
          <div className="stat-box-value">{stats.weight || 0}kg</div>
        </div>
      </div>
    </div>
  );
}
