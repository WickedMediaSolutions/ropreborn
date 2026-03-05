#!/bin/bash
# Check status of all ROM services

echo "🔍 Checking ROM Services Status"
echo "================================"
echo ""

echo "📋 Tmux Sessions:"
tmux list-sessions 2>/dev/null || echo "   No tmux sessions running"
echo ""

echo "🔌 Port Status:"
netstat -tuln | grep -E ':(3000|3001|4000|5000|5001)' || ss -tuln | grep -E ':(3000|3001|4000|5000|5001)'
echo ""

echo "🌐 Service Check:"
curl -s http://localhost:3000 > /dev/null && echo "   ✓ Web Client (3000): Running" || echo "   ✗ Web Client (3000): Not responding"
curl -s http://localhost:3001 > /dev/null && echo "   ✓ World Builder (3001): Running" || echo "   ✗ World Builder (3001): Not responding"
curl -s http://localhost:5000/health > /dev/null && echo "   ✓ World Builder API (5000): Running" || echo "   ✗ World Builder API (5000): Not responding"
curl -s http://localhost:5001/health > /dev/null && echo "   ✓ Web Client API (5001): Running" || echo "   ✗ Web Client API (5001): Not responding"
nc -zv localhost 4000 2>&1 | grep -q succeeded && echo "   ✓ ROM Server (4000): Running" || echo "   ✗ ROM Server (4000): Not responding"
echo ""

echo "🔥 Firewall Status (UFW):"
ufw status 2>/dev/null | grep -E '(3000|3001|4000|5000|5001)' || echo "   UFW not active or ports not explicitly allowed"
echo ""

echo "📊 Process Info:"
ps aux | grep -E 'node|rom' | grep -v grep | head -10
echo ""

echo "💡 Troubleshooting Tips:"
echo "   - Check tmux logs: tmux attach -t <session-name>"
echo "   - Open firewall: ufw allow 3000,3001,4000,5000,5001/tcp"
echo "   - View service logs above for errors"
echo "   - Ensure React apps use HOST=0.0.0.0 to bind all interfaces"
