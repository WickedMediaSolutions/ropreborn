import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './TelnetTerminal.css';

export function TelnetTerminal() {
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Ensure container exists and has dimensions
    if (!containerRef.current) return;

    // Create xterm terminal
    const term = new Terminal({
      cols: 140,
      rows: 40,
      theme: {
        background: '#0a0e27',
        foreground: '#00ff41',
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
      const fitAddon = new FitAddon();
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
      const handleResize = () => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.warn('FitAddon resize error:', e);
        }
      };

      window.addEventListener('resize', handleResize);

      return () => window.removeEventListener('resize', handleResize);
    } catch (e) {
      console.error('FitAddon error:', e);
    }
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
        } else if (data.type === 'status') {
          term.writeln(`\r\n[${data.message}]\r\n`);
        } else if (data.type === 'error') {
          term.writeln(`\r\n❌ ERROR: ${data.message}\r\n`);
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
    term.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Send raw data to backend (includes Enter as \r)
        ws.send(JSON.stringify({
          type: 'command',
          command: data
        }));
      }
    });

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

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
