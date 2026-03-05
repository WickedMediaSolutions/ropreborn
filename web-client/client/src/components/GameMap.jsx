import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import './GameMap.css';

export function GameMap() {
  const currentRoom = useGameStore((state) => state.currentRoom);
  const mapZoom = useGameStore((state) => state.mapZoom);
  const setMapZoom = useGameStore((state) => state.setMapZoom);
  const [mapData, setMapData] = useState([]);

  // Generate simple map grid based on current room
  useEffect(() => {
    // This is a simplified 2D map - you can enhance with actual coordinate system
    const grid = [];
    const centerY = 2;
    const centerX = 2;
    
    for (let y = 0; y < 5; y++) {
      let row = [];
      for (let x = 0; x < 5; x++) {
        if (y === centerY && x === centerX) {
          row.push({ type: 'player', room: currentRoom });
        } else {
          row.push({ type: 'empty' });
        }
      }
      grid.push(row);
    }
    
    // Add exits
    if (currentRoom.exits.includes('north')) grid[centerY-1][centerX].type = 'room';
    if (currentRoom.exits.includes('south')) grid[centerY+1][centerX].type = 'room';
    if (currentRoom.exits.includes('west')) grid[centerY][centerX-1].type = 'room';
    if (currentRoom.exits.includes('east')) grid[centerY][centerX+1].type = 'room';
    
    setMapData(grid);
  }, [currentRoom]);

  const handleZoom = (delta) => {
    setMapZoom(mapZoom + delta);
  };

  return (
    <div className="map-panel">
      <div className="map-header">
        <h4>Map</h4>
        <div className="map-controls">
          <button onClick={() => handleZoom(-0.1)}>🔍-</button>
          <span className="zoom-level">{Math.round(mapZoom * 100)}%</span>
          <button onClick={() => handleZoom(0.1)}>🔍+</button>
        </div>
      </div>

      <div className="map-container" style={{ transform: `scale(${mapZoom})` }}>
        <div className="map-grid">
          {mapData.map((row, y) => (
            <div key={y} className="map-row">
              {row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={`map-cell map-cell-${cell.type}`}
                  title={cell.type === 'player' ? currentRoom.name : 'Unknown'}
                >
                  {cell.type === 'player' && '🧙'}
                  {cell.type === 'room' && '🚪'}
                  {cell.type === 'empty' && '·'}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="map-legend">
        <div className="legend-item">🧙 You</div>
        <div className="legend-item">🚪 Room</div>
        <div className="legend-item">~ Water</div>
        <div className="legend-item">🗻 Mountain</div>
      </div>

      <div className="current-location">
        <strong>{currentRoom.name}</strong>
        <p>{currentRoom.description}</p>
        {currentRoom.exits.length > 0 && (
          <div className="exits">
            Exits: {currentRoom.exits.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
