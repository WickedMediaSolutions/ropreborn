#!/bin/bash
# Stop all ROM services
echo "🛑 Stopping all ROM services..."

tmux kill-session -t rom 2>/dev/null && echo "   ✓ ROM server stopped"
tmux kill-session -t web-api 2>/dev/null && echo "   ✓ Web client backend stopped"
tmux kill-session -t web-ui 2>/dev/null && echo "   ✓ Web client frontend stopped"
tmux kill-session -t wb-api 2>/dev/null && echo "   ✓ World builder API stopped"
tmux kill-session -t wb-ui 2>/dev/null && echo "   ✓ World builder UI stopped"

echo ""
echo "All services stopped."
