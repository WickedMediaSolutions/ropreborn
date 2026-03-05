import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const DIRECTION_OPTIONS = ['north', 'south', 'east', 'west', 'up', 'down'];
const ENTITY_TABS = ['rooms', 'mobiles', 'objects', 'resets', 'shops', 'specials'];

const DEFAULT_NEW_AREA = {
  name: '',
  author: 'Builder',
  levelRange: '0 101',
  vnumRange: '1000 1099',
};

const DEFAULT_NEW_EXIT = {
  direction: 'north',
  targetVnum: '',
  autoLink: true,
  doorType: 'none',
};

const DIRECTION_DELTAS = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
  up: { x: 2, y: -1 },
  down: { x: -2, y: 1 },
};

const ARROW_TO_DIRECTION = {
  ArrowUp: 'north',
  ArrowDown: 'south',
  ArrowLeft: 'west',
  ArrowRight: 'east',
};

function buildRoomMap(rooms, centerVnum) {
  if (!rooms?.length) {
    return { nodes: [], minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const roomByVnum = new Map(rooms.map((room) => [room.vnum, room]));
  const startRoom = roomByVnum.get(centerVnum) || rooms[0];
  const positioned = new Map();
  const queue = [{ vnum: startRoom.vnum, x: 0, y: 0 }];
  positioned.set(startRoom.vnum, { x: 0, y: 0 });

  while (queue.length > 0) {
    const current = queue.shift();
    const room = roomByVnum.get(current.vnum);
    if (!room) continue;

    (room.exits || []).forEach((exit) => {
      const direction = normalizeDirection(exit.direction);
      const delta = DIRECTION_DELTAS[direction];
      if (!delta) return;

      const targetRoom = roomByVnum.get(exit.targetVnum);
      if (!targetRoom) return;

      if (!positioned.has(targetRoom.vnum)) {
        const nextPosition = { x: current.x + delta.x, y: current.y + delta.y };
        positioned.set(targetRoom.vnum, nextPosition);
        queue.push({ vnum: targetRoom.vnum, ...nextPosition });
      }
    });
  }

  let extraX = Math.max(...Array.from(positioned.values()).map((entry) => entry.x), 0) + 3;
  let extraY = 0;

  rooms.forEach((room) => {
    if (positioned.has(room.vnum)) return;
    positioned.set(room.vnum, { x: extraX, y: extraY });
    extraY += 1;
  });

  const nodes = rooms.map((room) => {
    const pos = positioned.get(room.vnum) || { x: 0, y: 0 };
    return {
      ...room,
      x: pos.x,
      y: pos.y,
      exitDirections: (room.exits || []).map((exit) => normalizeDirection(exit.direction)).filter(Boolean),
    };
  });

  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);

  return {
    nodes,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function toInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function normalizeDirection(value) {
  return String(value || '').trim().toLowerCase();
}

function summarizeEntity(tab, entity, index) {
  if (!entity) return '';
  switch (tab) {
    case 'rooms':
      return `${entity.vnum} ${entity.name || '(unnamed room)'}`;
    case 'mobiles':
      return `${entity.vnum} ${entity.shortDesc || entity.name || entity.keywords || '(mobile)'}`;
    case 'objects':
      return `${entity.vnum} ${entity.shortDesc || entity.name || entity.keywords || '(object)'}`;
    case 'resets':
      return `${index} ${entity.command || '?'} ${(entity.values || []).join(' ')}`;
    case 'shops':
      return `${entity.vnum ?? index} keeper:${entity.keeperVnum ?? '?'} `;
    case 'specials':
      return `${index} ${entity.type || '?'} ${entity.vnum || '?'} ${entity.specName || ''}`;
    default:
      return JSON.stringify(entity);
  }
}

export default function App() {
  const [health, setHealth] = useState('checking');
  const [areas, setAreas] = useState([]);
  const [currentAreaName, setCurrentAreaName] = useState('');
  const [areaData, setAreaData] = useState(null);
  const [activeTab, setActiveTab] = useState('rooms');
  const [selectedKey, setSelectedKey] = useState(null);
  const [newArea, setNewArea] = useState(DEFAULT_NEW_AREA);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingArea, setLoadingArea] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newExit, setNewExit] = useState(DEFAULT_NEW_EXIT);
  const [jsonDraft, setJsonDraft] = useState('');

  const entities = useMemo(() => {
    if (!areaData) return [];
    if (activeTab === 'rooms') return [...(areaData.rooms || [])].sort((a, b) => (a.vnum || 0) - (b.vnum || 0));
    if (activeTab === 'mobiles') return [...(areaData.mobiles || [])].sort((a, b) => (a.vnum || 0) - (b.vnum || 0));
    if (activeTab === 'objects') return [...(areaData.objects || [])].sort((a, b) => (a.vnum || 0) - (b.vnum || 0));
    if (activeTab === 'resets') return areaData.resets || [];
    if (activeTab === 'shops') return [...(areaData.shops || [])].sort((a, b) => (a.vnum || 0) - (b.vnum || 0));
    return areaData.specials || [];
  }, [areaData, activeTab]);

  const selectedEntity = useMemo(() => {
    if (!areaData || selectedKey == null) return null;
    if (activeTab === 'rooms' || activeTab === 'mobiles' || activeTab === 'objects' || activeTab === 'shops') {
      return entities.find((item) => item.vnum === selectedKey) || null;
    }
    return entities[selectedKey] || null;
  }, [areaData, activeTab, entities, selectedKey]);

  const selectedRoom = useMemo(() => {
    if (!areaData || activeTab !== 'rooms' || selectedKey == null) return null;
    return (areaData.rooms || []).find((room) => room.vnum === selectedKey) || null;
  }, [areaData, activeTab, selectedKey]);

  const roomMap = useMemo(() => {
    if (!areaData || activeTab !== 'rooms') {
      return { nodes: [], minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    return buildRoomMap(areaData.rooms || [], selectedRoom?.vnum);
  }, [areaData, activeTab, selectedRoom]);

  useEffect(() => {
    fetchHealth();
    loadAreas();
  }, []);

  useEffect(() => {
    setSelectedKey(null);
  }, [activeTab, currentAreaName]);

  useEffect(() => {
    if (!selectedEntity) {
      setJsonDraft('');
      return;
    }
    if (activeTab !== 'rooms') {
      setJsonDraft(JSON.stringify(selectedEntity, null, 2));
    }
  }, [activeTab, selectedEntity]);

  async function fetchHealth() {
    try {
      const response = await axios.get('/health');
      setHealth(response?.data?.status || 'unknown');
    } catch {
      setHealth('offline');
    }
  }

  async function loadAreas() {
    setLoadingAreas(true);
    setError('');
    try {
      const response = await axios.get('/api/areas');
      setAreas(response.data?.areas || []);
    } catch (areasError) {
      setError(areasError?.response?.data?.error || areasError.message || 'Failed to load areas');
    } finally {
      setLoadingAreas(false);
    }
  }

  async function loadArea(areaName) {
    if (!areaName) return;

    setLoadingArea(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.get(`/api/areas/${encodeURIComponent(areaName)}`);
      const nextAreaData = response.data?.areaData;
      setAreaData(nextAreaData);
      setCurrentAreaName(areaName);
      setActiveTab('rooms');
      if (nextAreaData?.rooms?.length > 0) {
        setSelectedKey(nextAreaData.rooms[0].vnum);
      } else {
        setSelectedKey(null);
      }
    } catch (loadError) {
      setError(loadError?.response?.data?.error || loadError.message || 'Failed to load area');
    } finally {
      setLoadingArea(false);
    }
  }

  function updateEntityInArea(nextEntity, currentTab = activeTab, key = selectedKey) {
    setAreaData((previous) => {
      if (!previous || nextEntity == null) return previous;
      const next = clone(previous);

      if (currentTab === 'rooms') {
        next.rooms = next.rooms.map((room) => (room.vnum === key ? nextEntity : room));
      } else if (currentTab === 'mobiles') {
        next.mobiles = next.mobiles.map((mobile) => (mobile.vnum === key ? nextEntity : mobile));
      } else if (currentTab === 'objects') {
        next.objects = next.objects.map((obj) => (obj.vnum === key ? nextEntity : obj));
      } else if (currentTab === 'resets') {
        next.resets[key] = nextEntity;
      } else if (currentTab === 'shops') {
        next.shops = next.shops.map((shop) => (shop.vnum === key ? nextEntity : shop));
      } else if (currentTab === 'specials') {
        next.specials[key] = nextEntity;
      }

      return next;
    });
  }

  async function handleCreateArea(event) {
    event.preventDefault();
    setBusyAction('create-area');
    setError('');
    setMessage('');

    try {
      const payload = {
        name: newArea.name.trim(),
        author: newArea.author.trim(),
        levelRange: newArea.levelRange.trim(),
        vnumRange: newArea.vnumRange.trim(),
      };

      await axios.post('/api/areas', payload);
      setMessage(`Created area ${payload.name}`);
      setNewArea(DEFAULT_NEW_AREA);
      await loadAreas();
      await loadArea(payload.name);
    } catch (createError) {
      setError(createError?.response?.data?.error || createError.message || 'Failed to create area');
    } finally {
      setBusyAction('');
    }
  }

  async function handleDeleteArea(areaName) {
    if (!window.confirm(`Delete area "${areaName}"? This cannot be undone.`)) return;

    setBusyAction('delete-area');
    setError('');
    setMessage('');

    try {
      await axios.delete(`/api/areas/${encodeURIComponent(areaName)}`);
      setMessage(`Deleted area ${areaName}`);
      if (currentAreaName === areaName) {
        setCurrentAreaName('');
        setAreaData(null);
        setSelectedKey(null);
      }
      await loadAreas();
    } catch (deleteError) {
      setError(deleteError?.response?.data?.error || deleteError.message || 'Failed to delete area');
    } finally {
      setBusyAction('');
    }
  }

  async function handleSaveArea() {
    if (!areaData || !currentAreaName) return;

    setBusyAction('save-area');
    setError('');
    setMessage('');

    try {
      const response = await axios.put(`/api/areas/${encodeURIComponent(currentAreaName)}`, { areaData });
      const warningCount = response.data?.validation?.warningCount || 0;
      setMessage(`Saved ${currentAreaName}${warningCount ? ` with ${warningCount} warning(s)` : ''}`);
      await loadAreas();
    } catch (saveError) {
      const serverMessage = saveError?.response?.data?.error;
      const validation = saveError?.response?.data?.validation;
      if (validation?.errors?.length) {
        setError(`${serverMessage}: ${validation.errors[0].message}`);
      } else {
        setError(serverMessage || saveError.message || 'Failed to save area');
      }
    } finally {
      setBusyAction('');
    }
  }

  async function handleValidateArea() {
    if (!areaData || !currentAreaName) return;

    setBusyAction('validate-area');
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`/api/validate/${encodeURIComponent(currentAreaName)}/validate`, { areaData });
      const validation = response.data?.validation;
      setMessage(
        `Validation: ${validation?.errorCount || 0} error(s), ${validation?.warningCount || 0} warning(s)`
      );
    } catch (validateError) {
      setError(validateError?.response?.data?.error || validateError.message || 'Failed to validate area');
    } finally {
      setBusyAction('');
    }
  }

  async function handleAddRoom() {
    if (!areaData) return;

    setBusyAction('add-room');
    setError('');
    setMessage('');

    try {
      const existingVnums = areaData.rooms.map((room) => room.vnum);
      const nextVnum = existingVnums.length > 0 ? Math.max(...existingVnums) + 1 : 1000;
      const room = {
        vnum: nextVnum,
        name: `Room ${nextVnum}`,
        desc: 'A newly created room.',
        rawRoomFlags: '0 0 0',
        exits: [],
      };

      const response = await axios.post('/api/rooms', { areaData, room });
      setAreaData(response.data?.areaData || areaData);
      setActiveTab('rooms');
      setSelectedKey(nextVnum);
      setMessage(`Added room ${nextVnum}`);
    } catch (addRoomError) {
      setError(addRoomError?.response?.data?.error || addRoomError.message || 'Failed to add room');
    } finally {
      setBusyAction('');
    }
  }

  async function handleDeleteRoom() {
    if (!areaData || !selectedRoom || activeTab !== 'rooms') return;
    if (!window.confirm(`Delete room ${selectedRoom.vnum}?`)) return;

    setBusyAction('delete-room');
    setError('');
    setMessage('');

    try {
      const response = await axios.delete(`/api/rooms/${selectedRoom.vnum}`, { data: { areaData } });
      const nextAreaData = response.data?.areaData || areaData;
      setAreaData(nextAreaData);
      setSelectedKey(nextAreaData.rooms?.[0]?.vnum ?? null);
      setMessage(`Deleted room ${selectedRoom.vnum}`);
    } catch (deleteRoomError) {
      setError(deleteRoomError?.response?.data?.error || deleteRoomError.message || 'Failed to delete room');
    } finally {
      setBusyAction('');
    }
  }

  const createRoomFromDirection = useCallback(async (direction) => {
    if (!areaData || !currentAreaName || !selectedRoom) return;

    setBusyAction('map-create-room');
    setError('');

    try {
      const existingVnums = (areaData.rooms || []).map((room) => room.vnum);
      const nextVnum = existingVnums.length > 0 ? Math.max(...existingVnums) + 1 : 1000;
      const room = {
        vnum: nextVnum,
        name: `Room ${nextVnum}`,
        desc: 'A newly created room.',
        rawRoomFlags: '0 0 0',
        exits: [],
      };

      const createRoomResponse = await axios.post('/api/rooms', { areaData, room });
      let nextAreaData = createRoomResponse.data?.areaData || areaData;

      const addExitResponse = await axios.post(`/api/rooms/${selectedRoom.vnum}/exits`, {
        areaData: nextAreaData,
        exit: {
          direction,
          targetVnum: nextVnum,
          autoLink: true,
          doorType: 'none',
          lockFlags: 0,
          keyVnum: -1,
        },
      });
      nextAreaData = addExitResponse.data?.areaData || nextAreaData;

      setAreaData(nextAreaData);
      setSelectedKey(nextVnum);
      setMessage(`Created room ${nextVnum} to the ${direction} with reverse link.`);
    } catch (createError) {
      setError(createError?.response?.data?.error || createError.message || 'Failed to create mapped room');
    } finally {
      setBusyAction('');
    }
  }, [areaData, currentAreaName, selectedRoom]);

  const handleDirectionalMove = useCallback(async (direction) => {
    if (!areaData || !selectedRoom || activeTab !== 'rooms') return;

    const existingExit = (selectedRoom.exits || []).find(
      (exit) => normalizeDirection(exit.direction) === normalizeDirection(direction)
    );

    if (existingExit) {
      const targetRoom = (areaData.rooms || []).find((room) => room.vnum === existingExit.targetVnum);
      if (!targetRoom) {
        setError(`Exit exists but target room ${existingExit.targetVnum} was not found.`);
        return;
      }
      setSelectedKey(targetRoom.vnum);
      setMessage(`Moved ${direction} to room ${targetRoom.vnum}.`);
      return;
    }

    await createRoomFromDirection(direction);
  }, [areaData, selectedRoom, activeTab, createRoomFromDirection]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (activeTab !== 'rooms' || !selectedRoom || !areaData || busyAction) return;

      const target = event.target;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;

      const direction = ARROW_TO_DIRECTION[event.key];
      if (!direction) return;

      event.preventDefault();
      handleDirectionalMove(direction);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, selectedRoom, areaData, busyAction, handleDirectionalMove]);

  async function handleAddExit(event) {
    event.preventDefault();
    if (!selectedRoom || activeTab !== 'rooms' || !areaData) return;

    const targetVnum = toInt(newExit.targetVnum);
    if (!Number.isInteger(targetVnum)) {
      setError('Target room vnum must be a valid number');
      return;
    }

    setBusyAction('add-exit');
    setError('');
    setMessage('');

    try {
      const payload = {
        areaData,
        exit: {
          direction: normalizeDirection(newExit.direction),
          targetVnum,
          autoLink: Boolean(newExit.autoLink),
          doorType: newExit.doorType,
          lockFlags: 0,
          keyVnum: -1,
        },
      };

      const response = await axios.post(`/api/rooms/${selectedRoom.vnum}/exits`, payload);
      setAreaData(response.data?.areaData || areaData);
      setNewExit((previous) => ({ ...previous, targetVnum: '' }));
      setMessage(`Added ${payload.exit.direction} exit from room ${selectedRoom.vnum}`);
    } catch (addExitError) {
      setError(addExitError?.response?.data?.error || addExitError.message || 'Failed to add exit');
    } finally {
      setBusyAction('');
    }
  }

  async function handleRemoveExit(direction) {
    if (!selectedRoom || activeTab !== 'rooms' || !areaData) return;

    setBusyAction('delete-exit');
    setError('');
    setMessage('');

    try {
      const response = await axios.delete(`/api/rooms/${selectedRoom.vnum}/exits/${direction}`, {
        data: { areaData, autoUnlink: true },
      });
      setAreaData(response.data?.areaData || areaData);
      setMessage(`Removed ${direction} exit from room ${selectedRoom.vnum}`);
    } catch (removeExitError) {
      setError(removeExitError?.response?.data?.error || removeExitError.message || 'Failed to remove exit');
    } finally {
      setBusyAction('');
    }
  }

  async function handleCreateEntity() {
    if (!areaData || !currentAreaName) return;

    try {
      if (activeTab === 'mobiles') {
        const vnum = toInt(window.prompt('New mobile vnum:'));
        if (!vnum) return;
        const mobile = { vnum, keywords: 'new mobile', shortDesc: 'a new mobile', longDesc: 'A new mobile is here.' };
        const response = await axios.post(`/api/areas/${encodeURIComponent(currentAreaName)}/mobiles`, {
          areaData,
          mobile,
        });
        setAreaData(response.data?.areaData || areaData);
        setSelectedKey(vnum);
        setMessage(`Created mobile ${vnum}`);
      } else if (activeTab === 'objects') {
        const vnum = toInt(window.prompt('New object vnum:'));
        if (!vnum) return;
        const object = { vnum, keywords: 'new object', shortDesc: 'a new object', desc: 'A new object lies here.' };
        const response = await axios.post(`/api/areas/${encodeURIComponent(currentAreaName)}/objects`, {
          areaData,
          object,
        });
        setAreaData(response.data?.areaData || areaData);
        setSelectedKey(vnum);
        setMessage(`Created object ${vnum}`);
      } else if (activeTab === 'resets') {
        const command = String(window.prompt('Reset command (M/O/E/G/P/D/R):') || '').trim().toUpperCase();
        if (!command) return;
        const reset = { command, values: [0, 0, 0, 0], comment: 'new reset' };
        const response = await axios.post(`/api/areas/${encodeURIComponent(currentAreaName)}/resets`, {
          areaData,
          reset,
        });
        setAreaData(response.data?.areaData || areaData);
        setSelectedKey((response.data?.areaData?.resets || []).length - 1);
        setMessage('Created reset');
      } else if (activeTab === 'shops') {
        const vnum = toInt(window.prompt('New shop vnum:'));
        const keeperVnum = toInt(window.prompt('Keeper mobile vnum:'));
        if (!vnum || !keeperVnum) return;
        const shop = { vnum, keeperVnum, buyTypes: [0, 0, 0, 0, 0], profitBuy: 100, profitSell: 100, openHour: 0, closeHour: 23 };
        const response = await axios.post(`/api/areas/${encodeURIComponent(currentAreaName)}/shops`, {
          areaData,
          shop,
        });
        setAreaData(response.data?.areaData || areaData);
        setSelectedKey(vnum);
        setMessage(`Created shop ${vnum}`);
      } else if (activeTab === 'specials') {
        const type = String(window.prompt('Special type (M/O/R):') || '').trim().toUpperCase();
        const vnum = toInt(window.prompt('Entity vnum:'));
        const specName = String(window.prompt('Spec function name:') || '').trim();
        if (!type || !vnum || !specName) return;
        const special = { type, vnum, specName };
        const response = await axios.post(`/api/areas/${encodeURIComponent(currentAreaName)}/specials`, {
          areaData,
          special,
        });
        setAreaData(response.data?.areaData || areaData);
        setSelectedKey((response.data?.areaData?.specials || []).length - 1);
        setMessage('Created special');
      }
    } catch (createError) {
      setError(createError?.response?.data?.error || createError.message || 'Failed to create entity');
    }
  }

  async function handleDeleteEntity() {
    if (!areaData || !currentAreaName || selectedEntity == null) return;
    if (!window.confirm('Delete selected entry?')) return;

    setBusyAction('delete-entity');
    setError('');
    setMessage('');

    try {
      let response;
      if (activeTab === 'mobiles') {
        response = await axios.delete(`/api/areas/${encodeURIComponent(currentAreaName)}/mobiles/${selectedEntity.vnum}`, { data: { areaData } });
      } else if (activeTab === 'objects') {
        response = await axios.delete(`/api/areas/${encodeURIComponent(currentAreaName)}/objects/${selectedEntity.vnum}`, { data: { areaData } });
      } else if (activeTab === 'resets') {
        response = await axios.delete(`/api/areas/${encodeURIComponent(currentAreaName)}/resets/${selectedKey}`, { data: { areaData } });
      } else if (activeTab === 'shops') {
        response = await axios.delete(`/api/areas/${encodeURIComponent(currentAreaName)}/shops/${selectedEntity.vnum}`, { data: { areaData } });
      } else if (activeTab === 'specials') {
        response = await axios.delete(`/api/areas/${encodeURIComponent(currentAreaName)}/specials/${selectedKey}`, { data: { areaData } });
      }

      if (response?.data?.areaData) {
        setAreaData(response.data.areaData);
        setSelectedKey(null);
      }
      setMessage('Deleted selected entry');
    } catch (deleteError) {
      setError(deleteError?.response?.data?.error || deleteError.message || 'Failed to delete entity');
    } finally {
      setBusyAction('');
    }
  }

  async function handleApplyJsonEditor() {
    if (!selectedEntity || !areaData || !currentAreaName || activeTab === 'rooms') return;

    let parsed;
    try {
      parsed = JSON.parse(jsonDraft);
    } catch {
      setError('Invalid JSON');
      return;
    }

    setBusyAction('update-entity');
    setError('');
    setMessage('');

    try {
      let response;
      if (activeTab === 'mobiles') {
        response = await axios.put(`/api/areas/${encodeURIComponent(currentAreaName)}/mobiles/${selectedEntity.vnum}`, {
          areaData,
          mobile: parsed,
        });
      } else if (activeTab === 'objects') {
        response = await axios.put(`/api/areas/${encodeURIComponent(currentAreaName)}/objects/${selectedEntity.vnum}`, {
          areaData,
          object: parsed,
        });
      } else if (activeTab === 'resets') {
        response = await axios.put(`/api/areas/${encodeURIComponent(currentAreaName)}/resets/${selectedKey}`, {
          areaData,
          reset: parsed,
        });
      } else if (activeTab === 'shops') {
        response = await axios.put(`/api/areas/${encodeURIComponent(currentAreaName)}/shops/${selectedEntity.vnum}`, {
          areaData,
          shop: parsed,
        });
      } else if (activeTab === 'specials') {
        response = await axios.put(`/api/areas/${encodeURIComponent(currentAreaName)}/specials/${selectedKey}`, {
          areaData,
          special: parsed,
        });
      }

      if (response?.data?.areaData) {
        setAreaData(response.data.areaData);
      } else {
        updateEntityInArea(parsed);
      }
      setMessage('Updated selected entry');
    } catch (updateError) {
      setError(updateError?.response?.data?.error || updateError.message || 'Failed to update entity');
    } finally {
      setBusyAction('');
    }
  }

  const canCreateEntity = ['mobiles', 'objects', 'resets', 'shops', 'specials'].includes(activeTab);
  const canDeleteEntity = canCreateEntity && selectedEntity;

  return (
    <main className="layout">
      <header className="header">
        <h1>ROM World Builder</h1>
        <div className="status-group">
          <span className={`status status-${health}`}>API: {health}</span>
          {busyAction ? <span className="status status-busy">Working: {busyAction}</span> : null}
        </div>
      </header>

      {message ? <div className="banner banner-success">{message}</div> : null}
      {error ? <div className="banner banner-error">{error}</div> : null}

      <section className="workspace">
        <aside className="panel left-panel">
          <div className="panel-head">
            <h2>Areas</h2>
            <button type="button" onClick={loadAreas} disabled={loadingAreas || Boolean(busyAction)}>
              Refresh
            </button>
          </div>

          <div className="list">
            {areas.map((area) => (
              <div key={area.name} className={`list-row ${currentAreaName === area.name ? 'active' : ''}`}>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => loadArea(area.name)}
                  disabled={loadingArea || Boolean(busyAction)}
                >
                  {area.name}
                </button>
                <span className="meta">{area.counts?.rooms || 0}r {area.counts?.mobiles || 0}m {area.counts?.objects || 0}o</span>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDeleteArea(area.name)}
                  disabled={Boolean(busyAction)}
                >
                  Delete
                </button>
              </div>
            ))}
            {areas.length === 0 && !loadingAreas ? <p className="empty">No areas found.</p> : null}
          </div>

          <form className="stack" onSubmit={handleCreateArea}>
            <h3>Create Area</h3>
            <label>
              Name
              <input
                value={newArea.name}
                onChange={(event) => setNewArea((previous) => ({ ...previous, name: event.target.value }))}
                required
              />
            </label>
            <label>
              Author
              <input
                value={newArea.author}
                onChange={(event) => setNewArea((previous) => ({ ...previous, author: event.target.value }))}
              />
            </label>
            <label>
              Level Range
              <input
                value={newArea.levelRange}
                onChange={(event) => setNewArea((previous) => ({ ...previous, levelRange: event.target.value }))}
              />
            </label>
            <label>
              Vnum Range
              <input
                value={newArea.vnumRange}
                onChange={(event) => setNewArea((previous) => ({ ...previous, vnumRange: event.target.value }))}
              />
            </label>
            <button type="submit" disabled={Boolean(busyAction)}>
              Create Area
            </button>
          </form>
        </aside>

        <section className="panel middle-panel">
          <div className="panel-head">
            <h2>{currentAreaName || 'No Area Loaded'}</h2>
            <div className="actions">
              <button type="button" onClick={handleAddRoom} disabled={!areaData || Boolean(busyAction)}>
                Add Room
              </button>
              <button type="button" onClick={handleValidateArea} disabled={!areaData || Boolean(busyAction)}>
                Validate
              </button>
              <button type="button" onClick={handleSaveArea} disabled={!areaData || Boolean(busyAction)}>
                Save Area
              </button>
            </div>
          </div>

          <div className="tabs">
            {ENTITY_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
                disabled={!areaData}
              >
                {tab}
              </button>
            ))}
          </div>

          {areaData && activeTab === 'rooms' ? (
            <div className="stack map-stack">
              <div className="map-head">
                <h3>Map Editor</h3>
                <span className="meta">Arrow keys: move; auto-create if direction is missing.</span>
              </div>
              <div className="map-controls">
                <button type="button" onClick={() => handleDirectionalMove('north')} disabled={!selectedRoom || Boolean(busyAction)}>
                  ↑ North
                </button>
                <button type="button" onClick={() => handleDirectionalMove('west')} disabled={!selectedRoom || Boolean(busyAction)}>
                  ← West
                </button>
                <button type="button" onClick={() => handleDirectionalMove('south')} disabled={!selectedRoom || Boolean(busyAction)}>
                  ↓ South
                </button>
                <button type="button" onClick={() => handleDirectionalMove('east')} disabled={!selectedRoom || Boolean(busyAction)}>
                  → East
                </button>
                <button type="button" onClick={() => handleDirectionalMove('up')} disabled={!selectedRoom || Boolean(busyAction)}>
                  Up
                </button>
                <button type="button" onClick={() => handleDirectionalMove('down')} disabled={!selectedRoom || Boolean(busyAction)}>
                  Down
                </button>
              </div>
              <div className="map-viewport">
                <div
                  className="map-grid"
                  style={{
                    gridTemplateColumns: `repeat(${roomMap.maxX - roomMap.minX + 1}, minmax(84px, 1fr))`,
                    gridTemplateRows: `repeat(${roomMap.maxY - roomMap.minY + 1}, minmax(56px, auto))`,
                  }}
                >
                  {roomMap.nodes.map((roomNode) => (
                    <button
                      type="button"
                      key={`map-room-${roomNode.vnum}`}
                      className={`map-room ${selectedRoom?.vnum === roomNode.vnum ? 'active' : ''}`}
                      style={{
                        gridColumn: roomNode.x - roomMap.minX + 1,
                        gridRow: roomNode.y - roomMap.minY + 1,
                      }}
                      onClick={() => setSelectedKey(roomNode.vnum)}
                    >
                      <strong>{roomNode.vnum}</strong>
                      <small>{roomNode.name || '(room)'}</small>
                      <small className="map-exits">{roomNode.exitDirections.join(', ')}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="list">
            {entities.map((entity, index) => {
              const key = ['rooms', 'mobiles', 'objects', 'shops'].includes(activeTab) ? entity.vnum : index;
              return (
                <button
                  type="button"
                  key={`${activeTab}-${key}`}
                  className={`room-button ${selectedKey === key ? 'active' : ''}`}
                  onClick={() => setSelectedKey(key)}
                >
                  <span>{['resets', 'specials'].includes(activeTab) ? index : entity.vnum}</span>
                  <span>{summarizeEntity(activeTab, entity, index)}</span>
                </button>
              );
            })}
            {areaData && entities.length === 0 ? <p className="empty">No entries in this section yet.</p> : null}
            {!areaData ? <p className="empty">Load an area to begin editing.</p> : null}
          </div>
        </section>

        <section className="panel right-panel">
          <div className="panel-head">
            <h2>{activeTab === 'rooms' ? 'Room Editor' : `${activeTab} Editor`}</h2>
            <div className="actions">
              {canCreateEntity ? (
                <button type="button" onClick={handleCreateEntity} disabled={!areaData || Boolean(busyAction)}>
                  Add
                </button>
              ) : null}
              {activeTab === 'rooms' ? (
                <button type="button" className="danger" onClick={handleDeleteRoom} disabled={!selectedRoom || Boolean(busyAction)}>
                  Delete Room
                </button>
              ) : null}
              {canDeleteEntity ? (
                <button type="button" className="danger" onClick={handleDeleteEntity} disabled={Boolean(busyAction)}>
                  Delete
                </button>
              ) : null}
            </div>
          </div>

          {!selectedEntity ? (
            <p className="empty pad">Select an entry to edit its details.</p>
          ) : null}

          {selectedRoom && activeTab === 'rooms' ? (
            <>
              <div className="stack">
                <label>
                  Vnum
                  <input value={selectedRoom.vnum} disabled />
                </label>
                <label>
                  Name
                  <input
                    value={selectedRoom.name || ''}
                    onChange={(event) => updateEntityInArea({ ...selectedRoom, name: event.target.value })}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows={7}
                    value={selectedRoom.desc || ''}
                    onChange={(event) => updateEntityInArea({ ...selectedRoom, desc: event.target.value })}
                  />
                </label>
                <label>
                  Raw Room Flags
                  <input
                    value={selectedRoom.rawRoomFlags || ''}
                    onChange={(event) => updateEntityInArea({ ...selectedRoom, rawRoomFlags: event.target.value })}
                  />
                </label>
              </div>

              <div className="stack exits-section">
                <h3>Exits</h3>
                <div className="list exits-list">
                  {(selectedRoom.exits || []).map((exit) => (
                    <div key={exit.direction} className="list-row">
                      <span>
                        {exit.direction} → {exit.targetVnum}
                      </span>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleRemoveExit(exit.direction)}
                        disabled={Boolean(busyAction)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(selectedRoom.exits || []).length === 0 ? <p className="empty">No exits configured.</p> : null}
                </div>

                <form className="inline-form" onSubmit={handleAddExit}>
                  <label>
                    Direction
                    <select
                      value={newExit.direction}
                      onChange={(event) => setNewExit((previous) => ({ ...previous, direction: event.target.value }))}
                    >
                      {DIRECTION_OPTIONS.map((direction) => (
                        <option key={direction} value={direction}>
                          {direction}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Target Vnum
                    <input
                      value={newExit.targetVnum}
                      onChange={(event) => setNewExit((previous) => ({ ...previous, targetVnum: event.target.value }))}
                      placeholder="1001"
                    />
                  </label>
                  <label>
                    Door Type
                    <select
                      value={newExit.doorType}
                      onChange={(event) => setNewExit((previous) => ({ ...previous, doorType: event.target.value }))}
                    >
                      <option value="none">none</option>
                      <option value="door">door</option>
                    </select>
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={newExit.autoLink}
                      onChange={(event) => setNewExit((previous) => ({ ...previous, autoLink: event.target.checked }))}
                    />
                    Auto-link reverse exit
                  </label>
                  <button type="submit" disabled={Boolean(busyAction)}>
                    Add Exit
                  </button>
                </form>
              </div>
            </>
          ) : null}

          {selectedEntity && activeTab !== 'rooms' ? (
            <div className="stack">
              <h3>JSON Editor</h3>
              <label>
                Edit selected entry
                <textarea rows={18} value={jsonDraft} onChange={(event) => setJsonDraft(event.target.value)} />
              </label>
              <button type="button" onClick={handleApplyJsonEditor} disabled={Boolean(busyAction)}>
                Apply Update
              </button>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
