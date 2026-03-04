@echo off
REM ROM World Builder Startup Script (Windows)
REM Starts both backend and frontend servers

echo.
echo ╔════════════════════════════════════════════╗
echo ║  ROM World Builder - Startup Script        ║
echo ║  Starting Backend and Frontend...          ║
echo ╚════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js detected: 
node --version

REM Check if dependencies are installed
if not exist "backend\node_modules" (
    echo.
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo.
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Start backend in new window
echo.
echo Starting Backend API on http://localhost:5000...
start "ROM World Builder [Backend]" cmd /k "cd backend && npm start"

REM Wait for backend to start
timeout /t 3 /nobreak

REM Start frontend in new window
echo Starting Frontend on http://localhost:3000...
start "ROM World Builder [Frontend]" cmd /k "cd frontend && npm start"

echo.
echo ╔════════════════════════════════════════════╗
echo ║  World Builder is starting!                ║
echo ║  Backend:  http://localhost:5000           ║
echo ║  Frontend: http://localhost:3000           ║
echo ║                                            ║
echo ║  Both windows will open in new terminals   ║
echo ║  Close them to stop the servers            ║
echo ╚════════════════════════════════════════════╝
echo.
pause
