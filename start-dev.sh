#!/bin/bash

# ADHEERAA Development Server Startup Script
# This script starts both the backend and frontend servers

echo "🎭 Starting ADHEERAA Development Servers..."
echo ""

# Check if backend .env exists
if [ ! -f "server/.env" ]; then
    echo "❌ Error: server/.env file not found!"
    echo "   Please create server/.env with your Stripe keys"
    exit 1
fi

# Kill any existing processes on ports 3001 and 5173
echo "🧹 Cleaning up existing processes..."
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "   Stopping process on port 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    echo "   Stopping process on port 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
fi
echo ""

# Start backend server in background
echo "🚀 Starting backend server on http://localhost:3001..."
cd server
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo "🚀 Starting frontend server on http://localhost:5173..."
echo ""
echo "✅ Servers starting..."
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start frontend (this will block)
npm run dev

# Cleanup: kill backend when frontend stops
kill $BACKEND_PID 2>/dev/null

