#!/bin/bash
# Quick startup script for ROM Web Client on Ubuntu VPS
# Run from web-client directory: ./start.sh

echo "🚀 Starting ROM Web Client..."

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "tmux not found. Installing..."
    sudo apt-get install -y tmux
fi

# Kill existing sessions if any
tmux kill-session -t rom-web 2>/dev/null || true

# Create new tmux session
tmux new-session -d -s rom-web

# Start backend in window 0
tmux send-keys -t rom-web:0 "cd ~/ropreborn/web-client/server && npm start" C-m
echo "✅ Backend started (port 5001)"

# Create window 1 for frontend
tmux new-window -t rom-web:1
tmux send-keys -t rom-web:1 "cd ~/ropreborn/web-client/client && npm start" C-m
echo "✅ Frontend started (port 3000)"

echo ""
echo "📱 ROM Web Client is starting!"
echo "🌐 Open your browser to: http://localhost:3000"
echo "📡 WebSocket API: ws://localhost:5001/ws"
echo ""
echo "To attach to tmux: tmux attach -t rom-web"
echo "Switch windows: Ctrl+B then 0/1"
echo "Detach: Ctrl+B then D"
