import React from 'react';
import { useGameStore } from '../store';
import './EquipmentPanel.css';

export function EquipmentPanel() {
  const playerStats = useGameStore((state) => state.playerStats);
  const equipment = playerStats.equipment || {};
  const inventory = playerStats.inventory || [];

  const slots = [
    'head', 'neck', 'chest', 'hands', 'wrists',
    'waist', 'legs', 'feet', 'mainhand', 'offhand'
  ];

  const getSlotIcon = (slot) => {
    const icons = {
      head: '👑', neck: '💍', chest: '🛡️', hands: '🤚', wrists: '⌚',
      waist: '⚔️', legs: '🦵', feet: '👢', mainhand: '⚔️', offhand: '🛡️'
    };
    return icons[slot] || '📦';
  };

  return (
    <div className="equipment-panel">
      <h4>Equipment</h4>
      <div className="equipment-slots">
        {slots.map((slot) => (
          <div key={slot} className="equipment-slot">
            <div className="slot-icon">{getSlotIcon(slot)}</div>
            <div className="slot-label">{slot}</div>
            {equipment[slot] && (
              <div className="equipped-item">{equipment[slot].name}</div>
            )}
          </div>
        ))}
      </div>

      <h4 style={{ marginTop: '15px' }}>Inventory ({inventory.length})</h4>
      <div className="inventory-list">
        {inventory.length > 0 ? (
          inventory.map((item, idx) => (
            <div key={idx} className="inventory-item">
              <span className="item-icon">📦</span>
              <span className="item-name">{item.name}</span>
            </div>
          ))
        ) : (
          <p className="empty-inventory">No items in inventory</p>
        )}
      </div>
    </div>
  );
}
