#!/bin/bash
# ROM Deployment Script - Start all services in tmux
# Usage: ./deploy.sh

REPO_DIR="/root/ropreborn"

echo "🚀 Deploying ROM services..."

# Kill existing sessions if they exist
tmux kill-session -t rom 2>/dev/null
tmux kill-session -t web-api 2>/dev/null
tmux kill-session -t web-ui 2>/dev/null
tmux kill-session -t wb-api 2>/dev/null
tmux kill-session -t wb-ui 2>/dev/null

echo "📦 Installing dependencies..."

# Install web client dependencies
cd "$REPO_DIR/web-client/server" && npm install --silent
cd "$REPO_DIR/web-client/client" && npm install --silent

# Install world builder dependencies
cd "$REPO_DIR/world-builder/backend" && npm install --silent
cd "$REPO_DIR/world-builder/frontend" && npm install --silent

echo "🎮 Starting ROM server..."
tmux new -d -s rom -c "$REPO_DIR/src" './startup'

echo "🌐 Starting web client backend (port 5001)..."
tmux new -d -s web-api -c "$REPO_DIR/web-client/server" 'npm start'

echo "🖥️  Starting web client frontend (port 3000)..."
tmux new -d -s web-ui -c "$REPO_DIR/web-client/client" 'npm start'

echo "🔧 Starting world builder API (port 5000)..."
tmux new -d -s wb-api -c "$REPO_DIR/world-builder/backend" 'npm start'

echo "🏗️  Starting world builder UI (port 3001)..."
tmux new -d -s wb-ui -c "$REPO_DIR/world-builder/frontend" 'PORT=3001 npm start'

# Wait a moment for services to initialize
sleep 2

echo ""
echo "✅ All services started!"
echo ""
echo "Running sessions:"
tmux list-sessions
echo ""
echo "📍 Access points:"
echo "   ROM Web Client:  http://$(hostname -I | awk '{print $1}'):3000"
echo "   World Builder:   http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "📺 View logs:"
echo "   tmux attach -t rom       # ROM server"
echo "   tmux attach -t web-api   # Web client backend"
echo "   tmux attach -t web-ui    # Web client frontend"
echo "   tmux attach -t wb-api    # World builder API"
echo "   tmux attach -t wb-ui     # World builder UI"
echo ""
echo "🛑 Stop all:"
echo "   tmux kill-session -t rom && tmux kill-session -t web-api && tmux kill-session -t web-ui && tmux kill-session -t wb-api && tmux kill-session -t wb-ui"
