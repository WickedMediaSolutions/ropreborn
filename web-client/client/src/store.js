import create from 'zustand';

export const useGameStore = create((set, get) => ({
  // Connection state
  connected: false,
  setConnected: (connected) => set({ connected }),

  // Player data
  playerStats: {
    name: 'Loading...',
    level: 1,
    hp: 100,
    maxHp: 100,
    mana: 100,
    maxMana: 100,
    moves: 100,
    maxMoves: 100,
    experience: 0,
    nextLevel: 1000,
    gold: 0,
    silver: 0,
    alignment: 0,
    race: 'Human',
    class: 'Warrior',
    str: 10,
    int: 10,
    wis: 10,
    dex: 10,
    con: 10,
    luk: 10,
    practice: 0,
    damroll: 0,
    hitroll: 0,
    evasion: 0,
    warpoint: 0,
    wimpy: 10,
    remorts: 0,
    age: 0,
    playtime: 0,
    weight: 0,
    equipment: {},
    inventory: [],
    skills: []
  },
  updateStats: (stats) => set({ playerStats: stats }),

  // Game output log
  outputLog: [],
  addOutput: (text) =>
    set((state) => ({
      outputLog: [...state.outputLog.slice(-200), { id: Date.now(), text }]
    })),
  clearOutput: () => set({ outputLog: [] }),
  searchOutput: (query) => {
    const log = get().outputLog;
    return log.filter(line => 
      line.text.toLowerCase().includes(query.toLowerCase())
    );
  },

  // Connection handling
  ws: null,
  setWs: (ws) => set({ ws }),

  // Current location
  currentRoom: {
    id: 0,
    name: 'Unknown',
    description: 'You are lost in the void.',
    exits: []
  },
  updateRoom: (room) => set({ currentRoom: room }),

  // Spells & Skills
  spells: [
    { id: 1, name: 'Fireball', mana: 50, cooldown: 0, description: 'Deal fire damage' },
    { id: 2, name: 'Heal', mana: 30, cooldown: 0, description: 'Restore health' },
    { id: 3, name: 'Lightning', mana: 60, cooldown: 0, description: 'Strike with lightning' },
    { id: 4, name: 'Teleport', mana: 80, cooldown: 5, description: 'Blink away' },
    { id: 5, name: 'Summon', mana: 100, cooldown: 10, description: 'Summon ally' }
  ],
  castSpell: (spellId) => {
    const ws = get().ws;
    const spell = get().spells.find(s => s.id === spellId);
    if (spell && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'command',
        command: `cast ${spell.name.toLowerCase()}`
      }));
    }
  },

  // Equipment
  equipment: {
    head: null,
    neck: null,
    chest: null,
    hands: null,
    wrists: null,
    waist: null,
    legs: null,
    feet: null,
    mainHand: null,
    offHand: null
  },
  inventory: [
    { id: 1, name: 'Iron Sword', type: 'weapon', slot: 'mainHand' },
    { id: 2, name: 'Leather Armor', type: 'armor', slot: 'chest' },
    { id: 3, name: 'Health Potion', type: 'consumable' },
    { id: 4, name: 'Mana Potion', type: 'consumable' }
  ],
  equipItem: (itemId) =>
    set((state) => {
      const item = state.inventory.find(i => i.id === itemId);
      if (item && item.slot) {
        return {
          equipment: { ...state.equipment, [item.slot]: item }
        };
      }
      return state;
    }),

  // Party system
  party: [
    { name: 'You', level: 10, hp: 100, maxHp: 100 }
  ],
  addPartyMember: (member) =>
    set((state) => ({
      party: [...state.party, member]
    })),
  removePartyMember: (name) =>
    set((state) => ({
      party: state.party.filter(m => m.name !== name)
    })),

  // Message history
  messageHistory: [],
  addMessage: (msg) =>
    set((state) => ({
      messageHistory: [...state.messageHistory.slice(-500), { id: Date.now(), text: msg, timestamp: new Date() }]
    })),

  // Macros
  macros: [
    { id: 1, key: 'F1', name: 'Attack', command: 'kill' },
    { id: 2, key: 'F2', name: 'Flee', command: 'flee' },
    { id: 3, key: 'F3', name: 'Cast Heal', command: 'cast heal' }
  ],
  executeMacro: (key) => {
    const ws = get().ws;
    const macro = get().macros.find(m => m.key === key);
    if (macro && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'command',
        command: macro.command
      }));
    }
  },
  addMacro: (macro) =>
    set((state) => ({
      macros: [...state.macros, { ...macro, id: Date.now() }]
    })),
  updateMacro: (id, updates) =>
    set((state) => ({
      macros: state.macros.map(m => m.id === id ? { ...m, ...updates } : m)
    })),
  deleteMacro: (id) =>
    set((state) => ({
      macros: state.macros.filter(m => m.id !== id)
    })),

  // Keybindings
  keybindings: {
    'w': 'north',
    'a': 'west',
    's': 'south',
    'd': 'east',
    'e': 'equipment',
    'i': 'inventory',
    'p': 'cast heal'
  },
  setKeybinding: (key, command) =>
    set((state) => ({
      keybindings: { ...state.keybindings, [key]: command }
    })),

  // Characters
  characters: [
    { id: 1, name: 'Warrior', level: 25, class: 'Fighter', race: 'Human' },
    { id: 2, name: 'Wizard', level: 18, class: 'Mage', race: 'Elf' }
  ],
  currentCharacter: null,
  selectCharacter: (charId) => set({ currentCharacter: charId }),
  addCharacter: (char) =>
    set((state) => ({
      characters: [...state.characters, { ...char, id: Date.now() }]
    })),

  // UI State
  showEquipment: false,
  showInventory: false,
  showSpells: false,
  showMap: false,
  showParty: false,
  showMacros: false,
  showCharSelect: false,
  togglePanel: (panel) =>
    set((state) => ({
      [panel]: !state[panel]
    })),

  // Input history for command recall
  commandHistory: [],
  historyIndex: -1,
  addCommand: (cmd) =>
    set((state) => ({
      commandHistory: [...state.commandHistory, cmd],
      historyIndex: -1
    })),

  // Settings
  soundEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  mapZoom: 1,
  setMapZoom: (zoom) => set({ mapZoom: Math.max(0.5, Math.min(2, zoom)) })
}));
