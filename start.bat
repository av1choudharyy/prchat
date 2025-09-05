@echo off
REM PRChat Application Startup Script for Windows

echo 🚀 Starting PRChat Application...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Build and start the application
echo 📦 Building and starting containers...
docker-compose up --build

echo ✅ PRChat is starting up!
echo.
echo 📝 Access the application at:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo.
echo 👥 Test Users Available:
echo    📧 test1@example.com / 🔑 password123
echo    📧 test2@example.com / 🔑 password123
echo    📧 test3@example.com / 🔑 password123
echo    📧 guest@example.com / 🔑 123456
echo.
echo 🛑 To stop the application, press Ctrl+C
pause
