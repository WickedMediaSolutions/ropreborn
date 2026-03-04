#!/bin/bash
# Docker startup wrapper for ROM MUD

cd /opt/rom/area

# Set the port number
PORT=${1:-4000}

# Set limits and run the MUD
while true; do
    # Find next available log file
    INDEX=1000
    while [ -f "../log/$INDEX.log" ]; do
        INDEX=$((INDEX + 1))
    done
    
    LOGFILE="../log/$INDEX.log"
    
    # Remove shutdown file if it exists
    rm -f shutdown.txt
    
    # Run the ROM MUD (use image-built binary, not bind-mounted area binary)
    /opt/rom/bin/rom $PORT > "$LOGFILE" 2>&1
    
    # Check for shutdown signal
    if [ -f "shutdown.txt" ]; then
        rm -f shutdown.txt
        exit 0
    fi
    
    # Wait before restarting
    sleep 10
done
