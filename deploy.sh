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

echo -e "$OK_ICON Deployment complete. Use ./stop.sh to stop all services."
