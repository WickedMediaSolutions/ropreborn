#!/bin/bash

# Stop all tmux sessions related to the game
tmux kill-session -t mud 2>/dev/null || true
tmux kill-session -t world 2>/dev/null || true
tmux kill-session -t webui 2>/dev/null || true

echo "All game services stopped."
