#!/bin/bash
cd "$(dirname "$0")"
# Kill any existing server on 8000
pkill -f "http.server 8000" 2>/dev/null
# Start server in background
nohup python3 -m http.server 8000 > /dev/null 2>&1 &
# Open browser
open http://localhost:8000
# Close this terminal window
osascript -e 'tell application "Terminal" to close front window' &
exit 0
