#!/bin/bash

# Kloud-scaler K8s Monitoring Dashboard Setup Script
# Created by Abhinash Dubey

set -e

echo "🚀 Setting up Kloud-scaler K8s Monitoring Dashboard..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed."
fi

echo "✅ Prerequisites check completed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Setup environment
echo "⚙️  Setting up environment..."
if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo "📝 Created server/.env file. Please update it with your database credentials."
fi

# Database setup
echo "🗄️  Setting up database..."
read -p "Do you want to create the database now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter PostgreSQL username (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -p "Enter database name (default: k8s_monitoring): " DB_NAME
    DB_NAME=${DB_NAME:-k8s_monitoring}
    
    echo "Creating database..."
    createdb -U $DB_USER $DB_NAME || echo "Database might already exist"
    echo "✅ Database setup completed"
fi

# Build frontend
echo "🏗️  Building frontend..."
npm run build

echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update server/.env with your database credentials"
echo "2. Start the server: npm run server"
echo "3. Start the frontend: npm run dev"
echo "4. Visit http://localhost:5173"
echo ""
echo "📚 For deployment instructions, see DEPLOYMENT.md"