# VRISH API Platform — Startup
$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host "Starting VRISH API Platform..."

# Start Backend
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$backend'; python -m uvicorn main:app --reload --port 8000"

# Start Frontend
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$frontend'; npm run dev"

Start-Sleep -Seconds 5

# Open Browser
Start-Process "http://localhost:5173/"
