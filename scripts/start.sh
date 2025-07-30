#!/bin/bash

# Start script for Kloud-scaler K8s Monitoring Dashboard

echo "🚀 Starting Kloud-scaler K8s Monitoring Dashboard..."

# Check if .env exists
if [ ! -f server/.env ]; then
    echo "❌ server/.env file not found. Please run setup.sh first."
    exit 1
fi

# Start PostgreSQL if using Docker
if command -v docker &> /dev/null; then
    echo "🐳 Starting PostgreSQL container..."
    cd server
    docker-compose up -d postgres
    cd ..
    sleep 5
fi

# Start backend server
echo "🖥️  Starting backend server..."
cd server
npm start &
SERVER_PID=$!
cd ..

# Wait for server to start
sleep 3

# Start frontend
echo "🌐 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Dashboard started successfully!"
echo "📊 Frontend: http://localhost:5173"
echo "🔌 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo "🛑 Stopping services..."
    kill $SERVER_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait