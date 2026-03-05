import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useGameStore } from '../store';
import 'xterm/css/xterm.css';
import './TelnetTerminal.css';

export function TelnetTerminal() {
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const wsRef = useRef(null);
  
  // Get store functions
  const updateStats = useGameStore((state) => state.updateStats);
  const setConnected = useGameStore((state) => state.setConnected);
  const setWs = useGameStore((state) => state.setWs);
  const connected = useGameStore((state) => state.connected);
  const updateRoom = useGameStore((state) => state.updateRoom);

  useEffect(() => {
    // Ensure container exists and has dimensions
    if (!containerRef.current) return;

    // Prevent duplicate xterm mounts in React StrictMode/dev remount cycles.
    if (terminalRef.current) return;

    // If anything was previously rendered in this host, clear it first.
    containerRef.current.innerHTML = '';

    let fitAddon = null;
    let handleResize = null;

    // Create xterm terminal
    const term = new Terminal({
      cols: 140,
      rows: 40,
      theme: {
        background: '#0a0e27',
        // Don't set foreground - let ANSI codes control text color
        cursor: '#00ff41',
      },
      fontFamily: 'Courier New, monospace',
      fontSize: 12,
      fontWeight: 'normal',
      cursorBlink: true,
      cursorStyle: 'block',
    });

    terminalRef.current = term;

    // Open terminal FIRST
    term.open(containerRef.current);

    // Apply fit addon AFTER opening
    try {
      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      // Fit with a small delay to ensure DOM is ready
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.warn('FitAddon fit error (non-critical):', e);
        }
      }, 100);

      // Handle window resize
      handleResize = () => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.warn('FitAddon resize error:', e);
        }
      };

      window.addEventListener('resize', handleResize);
    } catch (e) {
      console.error('FitAddon error:', e);
    }

    return () => {
      if (handleResize) {
        window.removeEventListener('resize', handleResize);
      }
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = terminalRef.current;

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:5001/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✓ Connected to ROM bridge');
      term.writeln('\r\n⚔️ Connecting to ROM server...\r\n');
      setConnected(true);
      setWs(ws);  // Store WebSocket in store for spells/inventory panels
      wsRef.current = ws;
      
      // Send connect command
      ws.send(JSON.stringify({ type: 'connect' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'output') {
          // Write raw data to terminal - xterm handles ANSI
          term.write(data.data);
          
          // If stats came with the output, update the store
          if (data.stats) {
            updateStats(data.stats);
          }
        } else if (data.type === 'status') {
          term.writeln(`\r\n[${data.message}]\r\n`);
          setConnected(true);
        } else if (data.type === 'error') {
          term.writeln(`\r\n❌ ERROR: ${data.message}\r\n`);
          setConnected(false);
        }
      } catch (err) {
        console.error('Message error:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      term.writeln('\r\n❌ Connection error\r\n');
      setConnected(false);
    };

    ws.onclose = () => {
      console.log('Disconnected from ROM bridge');
      term.writeln('\r\n❌ Disconnected from server\r\n');
      setConnected(false);
    };

    // Handle terminal input - raw key data
    const dataDisposable = term.onData((data) => {
      // Echo characters back to terminal (local echo)
      // For printable characters, show them; for special keys (Enter, Backspace, etc.) just send
      if (data.length === 1 && data.charCodeAt(0) >= 32 && data.charCodeAt(0) < 127) {
        // Printable ASCII - echo it back to terminal
        term.write(data);
      } else if (data === '\r') {
        // Enter - echo newline but don't echo the character
        term.write('\r\n');
      } else if (data === '\x7f' || data === '\b') {
        // Backspace - xterm handles this visually already
      }
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Send raw data to backend (includes Enter as \r)
        ws.send(JSON.stringify({
          type: 'command',
          command: data
        }));
      }
    });

    return () => {
      dataDisposable.dispose();
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      setWs(null);
    };
  }, [setConnected, setWs, updateStats]);

  return (
    <div className="telnet-terminal-container">
      <div className="telnet-terminal-header">
        <h2>⚔️ ROM MUD - Rites of Passage</h2>
        <div className="telnet-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      <div ref={containerRef} className="telnet-terminal-inner"></div>
    </div>
  );
}
