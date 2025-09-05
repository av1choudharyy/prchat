# PRChat Port Killer Script
# This script helps you find and kill processes using port 5000

Write-Host "🔍 PRChat Port Conflict Resolver" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Navigate to project directory
Set-Location "D:\prchat\prchat"
Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Cyan

# Check what's using port 5000
Write-Host "`n📋 Checking what's using port 5000..." -ForegroundColor Yellow
Write-Host "D:\prchat\prchat> netstat -ano | findstr `":5000`"" -ForegroundColor Gray

$portInfo = netstat -ano | findstr ":5000"

if ($portInfo) {
    Write-Host "Found processes using port 5000:" -ForegroundColor Red
    $portInfo | ForEach-Object {
        Write-Host "  $_" -ForegroundColor White
        
        # Extract PID from the line (last number)
        if ($_ -match '\s+(\d+)\s*$') {
            $pid = $matches[1]
            
            Write-Host "D:\prchat\prchat> Get-Process -Id $pid" -ForegroundColor Gray
            try {
                $process = Get-Process -Id $pid -ErrorAction Stop
                Write-Host "    Process: $($process.ProcessName) (PID: $pid)" -ForegroundColor Cyan
                
                # Ask user if they want to kill this process
                $response = Read-Host "    Kill this process? (y/n)"
                if ($response -eq 'y' -or $response -eq 'Y') {
                    Write-Host "D:\prchat\prchat> taskkill /F /PID $pid" -ForegroundColor Gray
                    taskkill /F /PID $pid
                    Write-Host "    ✅ Process killed successfully!" -ForegroundColor Green
                }
            }
            catch {
                Write-Host "    ⚠️ Could not get process info for PID: $pid" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "✅ Port 5000 is available!" -ForegroundColor Green
}

# Verify port is free
Write-Host "`n� Verifying port 5000 is now free..." -ForegroundColor Yellow
Write-Host "D:\prchat\prchat> netstat -ano | findstr `":5000`"" -ForegroundColor Gray
$checkPort = netstat -ano | findstr ":5000"
if (-not $checkPort) {
    Write-Host "✅ Port 5000 is now available!" -ForegroundColor Green
} else {
    Write-Host "❌ Port 5000 is still in use:" -ForegroundColor Red
    Write-Host "  $checkPort" -ForegroundColor White
}

Write-Host "`n🚀 You can now start your PRChat server!" -ForegroundColor Green
Write-Host "Choose one option:" -ForegroundColor Yellow
Write-Host "  Docker: docker-compose up --build" -ForegroundColor Cyan
Write-Host "  Local:  npm run server" -ForegroundColor Cyan
