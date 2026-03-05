import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './TelnetTerminal.css';

export function TelnetTerminal() {
  const terminalRef = useRef(null);
  const wsRef = useRef(null);
  const terminalRef2 = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Create xterm terminal
    const term = new Terminal({
      cols: 120,
      rows: 30,
      theme: {
        background: '#0a0e27',
        foreground: '#00ff41',
      },
      fontFamily: 'Courier New, monospace',
      fontSize: 13,
      cursorBlink: true,
    });

    // Apply fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Open terminal in container
    term.open(terminalRef.current);
    fitAddon.fit();
    terminalRef2.current = term;

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

    // Handle terminal input
    term.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Send data to backend
        ws.send(JSON.stringify({
          type: 'command',
          command: data
        }));
      }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      term.dispose();
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
      <div ref={terminalRef} className="telnet-terminal"></div>
    </div>
  );
}
