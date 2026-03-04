# ROM World Builder Startup Script (PowerShell)
# Starts both backend and frontend servers

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗"
Write-Host "║  ROM World Builder - Startup Script        ║"
Write-Host "║  Starting Backend and Frontend...          ║"
Write-Host "╚════════════════════════════════════════════╝"
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js detected: $nodeVersion"
}
catch {
    Write-Host "✗ Error: Node.js is not installed or not in PATH"
    Write-Host "Please install Node.js from https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Install backend dependencies if needed
if (-not (Test-Path "backend/node_modules")) {
    Write-Host ""
    Write-Host "Installing backend dependencies..."
    Push-Location backend
    npm install
    Pop-Location
}

# Install frontend dependencies if needed
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host ""
    Write-Host "Installing frontend dependencies..."
    Push-Location frontend
    npm install
    Pop-Location
}

# Start backend in new process
Write-Host ""
Write-Host "Starting Backend API on http://localhost:5000..."
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -PassThru -NoNewWindow
Write-Host "✓ Backend process started (PID: $($backendProcess.Id))"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend in new process  
Write-Host "Starting Frontend on http://localhost:3000..."
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start" -PassThru -NoNewWindow
Write-Host "✓ Frontend process started (PID: $($frontendProcess.Id))"

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗"
Write-Host "║  World Builder is running!                 ║"
Write-Host "║  Backend:  http://localhost:5000           ║"
Write-Host "║  Frontend: http://localhost:3000           ║"
Write-Host "║                                            ║"
Write-Host "║  Browser should open automatically         ║"
Write-Host "│  (if not, open http://localhost:3000)      ║"
Write-Host "║                                            ║"
Write-Host "║  Press Ctrl+C in terminal to stop          ║"
Write-Host "╚════════════════════════════════════════════╝"
Write-Host ""

# Wait for user input before closing
Read-Host "Press Enter to stop servers"

# Kill processes
Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
Stop-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue

Write-Host "✓ Servers stopped"
