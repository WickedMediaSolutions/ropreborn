import React, { useState } from 'react';
import { useGameStore } from '../store';
import './EquipmentPanel.css';

export function EquipmentPanel() {
  const equipment = useGameStore((state) => state.equipment);
  const inventory = useGameStore((state) => state.inventory);
  const equipItem = useGameStore((state) => state.equipItem);
  const [draggedItem, setDraggedItem] = useState(null);

  const slots = [
    'head', 'neck', 'chest', 'hands', 'wrists',
    'waist', 'legs', 'feet', 'mainHand', 'offHand'
  ];

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (slot) => {
    if (draggedItem && draggedItem.slot === slot) {
      equipItem(draggedItem.id);
      setDraggedItem(null);
    }
  };

  const getSlotIcon = (slot) => {
    const icons = {
      head: '👑', neck: '💍', chest: '🛡️', hands: '🤚', wrists: '⌚',
      waist: '⚔️', legs: '🦵', feet: '👢', mainHand: '⚔️', offHand: '🛡️'
    };
    return icons[slot] || '📦';
  };

  return (
    <div className="equipment-panel">
      <h4>Equipment</h4>
      <div className="equipment-slots">
        {slots.map((slot) => (
          <div
            key={slot}
            className="equipment-slot"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(slot)}
          >
            <div className="slot-icon">{getSlotIcon(slot)}</div>
            <div className="slot-label">{slot}</div>
            {equipment[slot] && (
              <div className="equipped-item">{equipment[slot].name}</div>
            )}
          </div>
        ))}
      </div>

      <h4 style={{ marginTop: '15px' }}>Inventory</h4>
      <div className="inventory-list">
        {inventory.map((item) => (
          <div
            key={item.id}
            className="inventory-item"
            draggable
            onDragStart={() => handleDragStart(item)}
          >
            <span className="item-icon">📦</span>
            <span className="item-name">{item.name}</span>
            <span className={`item-type ${item.type}`}>{item.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
