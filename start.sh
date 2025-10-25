#!/bin/bash

# LearnQuest Proctoring System - Quick Start Script

echo "🚀 LearnQuest Proctoring System - Quick Start"
echo "=============================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB or use Docker."
    echo "   Docker command: docker run -d -p 27017:27017 --name mongodb mongo:latest"
fi

echo "✅ Prerequisites check completed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "To start the application:"
echo "1. Start MongoDB (if not already running):"
echo "   docker run -d -p 27017:27017 --name mongodb mongo:latest"
echo ""
echo "2. Start the backend server:"
echo "   cd backend && python main.py"
echo ""
echo "3. Start the frontend server (in a new terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Open your browser and go to: http://localhost:5173"
echo ""
echo "📚 For detailed instructions, see INSTALLATION.md"
echo "🐛 For troubleshooting, see README.md"
