@echo off
REM LearnQuest Proctoring System - Quick Start Script for Windows

echo 🚀 LearnQuest Proctoring System - Quick Start
echo ==============================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check completed

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed successfully

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed successfully

echo.
echo 🎉 Installation completed successfully!
echo.
echo To start the application:
echo 1. Start MongoDB (if not already running):
echo    docker run -d -p 27017:27017 --name mongodb mongo:latest
echo.
echo 2. Start the backend server:
echo    cd backend ^&^& python main.py
echo.
echo 3. Start the frontend server (in a new terminal):
echo    cd frontend ^&^& npm run dev
echo.
echo 4. Open your browser and go to: http://localhost:5173
echo.
echo 📚 For detailed instructions, see INSTALLATION.md
echo 🐛 For troubleshooting, see README.md
pause
