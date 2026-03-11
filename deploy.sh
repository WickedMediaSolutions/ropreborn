#!/bin/bash
set -e

#!/bin/bash
set -e

# Emojis/icons for clarity
GIT_ICON="🌐"
BUILD_ICON="🔨"
START_ICON="🚀"
OK_ICON="✅"
ERR_ICON="❌"

cd "$(dirname "$0")"

# Pull latest code
echo -e "$GIT_ICON Checking for updates..."
GIT_OUTPUT=$(git pull origin master)
UPDATED=0
if [[ "$GIT_OUTPUT" != *"Already up to date."* ]]; then
	UPDATED=1
	echo -e "$OK_ICON Updates found."
else
	echo -e "$OK_ICON Already up to date."
fi

# Only build if there was an update
echo -e "$BUILD_ICON Checking if build is needed..."
if [[ $UPDATED -eq 1 ]]; then
	echo -e "$BUILD_ICON Building... (hidden output)"
	if ! (cd src && make clean && make >../build_output.txt 2>&1); then
		echo -e "$ERR_ICON Build failed! See build_output.txt for details."
		exit 1
	fi
	cp src/rom area/rom
	echo -e "$OK_ICON Build complete."
else
	echo -e "$OK_ICON No build needed."
fi

# Start MUD in tmux session 'mud'
echo -e "$START_ICON Starting MUD server..."
tmux kill-session -t mud 2>/dev/null || true
tmux new-session -d -s mud 'cd area && ./rom'

# Start world builder in tmux session 'world'
echo -e "$START_ICON Starting World Builder..."
tmux kill-session -t world 2>/dev/null || true
tmux new-session -d -s world 'cd world-builder/backend && npm start'

# Start web UI in tmux session 'webui'
echo -e "$START_ICON Starting Web UI..."
tmux kill-session -t webui 2>/dev/null || true
tmux new-session -d -s webui 'cd world-builder/frontend && npm start'


# --- Service Verification and Info ---
sleep 2

# Check MUD (ROM) server (default port 4000)
MUD_PORT=4000
MUD_STATUS=$(ss -ltn 2>/dev/null | grep ":$MUD_PORT " || netstat -an 2>/dev/null | grep ":$MUD_PORT ")
if [[ -n "$MUD_STATUS" ]]; then
	echo -e "$OK_ICON MUD server running on port $MUD_PORT"
else
	echo -e "$ERR_ICON MUD server not detected on port $MUD_PORT (check logs)"
fi

# Check World Builder backend (Node.js, port 5000)
BACKEND_PORT=5000
BACKEND_STATUS=$(ss -ltn 2>/dev/null | grep ":$BACKEND_PORT " || netstat -an 2>/dev/null | grep ":$BACKEND_PORT ")
if [[ -n "$BACKEND_STATUS" ]]; then
	echo -e "$OK_ICON World Builder backend running: http://localhost:$BACKEND_PORT/api"
else
	echo -e "$ERR_ICON World Builder backend not detected on port $BACKEND_PORT (check logs)"
fi

# Check Web UI (frontend, default React port 3000)
FRONTEND_PORT=3000
FRONTEND_STATUS=$(ss -ltn 2>/dev/null | grep ":$FRONTEND_PORT " || netstat -an 2>/dev/null | grep ":$FRONTEND_PORT ")
if [[ -n "$FRONTEND_STATUS" ]]; then
	echo -e "$OK_ICON Web UI running: http://localhost:$FRONTEND_PORT/"
else
	echo -e "$ERR_ICON Web UI not detected on port $FRONTEND_PORT (check logs)"
fi

echo -e "\n$OK_ICON Deployment complete.\n"
echo "Connect to your services:"
echo "  MUD (telnet):      telnet <host> $MUD_PORT"
echo "  World Builder API: http://<host>:$BACKEND_PORT/api"
echo "  Web UI:            http://<host>:$FRONTEND_PORT/"
echo -e "\nUse ./stop.sh to stop all services."
