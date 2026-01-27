#!/bin/bash

# Stop ADHEERAA Development Servers
# Kills any processes running on ports 3001 (backend) and 5173 (frontend)

echo "🛑 Stopping ADHEERAA Development Servers..."
echo ""

# Kill backend (port 3001)
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "   Stopping backend server (port 3001)..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    echo "   ✅ Backend stopped"
else
    echo "   ℹ️  No process running on port 3001"
fi

# Kill frontend (port 5173)
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "   Stopping frontend server (port 5173)..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    echo "   ✅ Frontend stopped"
else
    echo "   ℹ️  No process running on port 5173"
fi

echo ""
echo "✅ Done!"




