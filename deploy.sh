#!/bin/bash
set -e

# Pull latest code
git pull origin master

# Build the ROM binary
cd src
make clean && make
cd ..

# Move binary to area folder (adjust binary name if needed)
cp src/rom area/rom

# Start MUD in tmux session 'mud'
tmux kill-session -t mud 2>/dev/null || true
tmux new-session -d -s mud 'cd area && ./rom'

# Start world builder in tmux session 'world'
tmux kill-session -t world 2>/dev/null || true
tmux new-session -d -s world 'cd world-builder/backend && npm start'

# Start web UI in tmux session 'webui'
tmux kill-session -t webui 2>/dev/null || true
tmux new-session -d -s webui 'cd world-builder/frontend && npm start'

echo "Deployment complete. Use ./stop.sh to stop all services."
