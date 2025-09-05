#!/bin/bash

# PRChat Application Startup Script

echo "🚀 Starting PRChat Application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start the application
echo "📦 Building and starting containers..."
docker-compose up --build

echo "✅ PRChat is starting up!"
echo ""
echo "📝 Access the application at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "👥 Test Users Available:"
echo "   📧 test1@example.com / 🔑 password123"
echo "   📧 test2@example.com / 🔑 password123"
echo "   📧 test3@example.com / 🔑 password123"
echo "   📧 guest@example.com / 🔑 123456"
echo ""
echo "🛑 To stop the application, press Ctrl+C"
