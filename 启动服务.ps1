Write-Host "Starting Resume Analysis System..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting backend service..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
$pythonPath = "$env:USERPROFILE\AppData\Local\Programs\Python\Python311\python.exe"
$backendProcess = Start-Process -FilePath $pythonPath -ArgumentList "app.py" -PassThru -WindowStyle Normal

Write-Host "Backend service started (PID: $($backendProcess.Id))" -ForegroundColor Green
Write-Host ""

Write-Host "Waiting 3 seconds for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Starting frontend service..." -ForegroundColor Yellow
Set-Location "my-resume-analyzer-frontend"
npm run dev

Write-Host ""
Write-Host "Services started!" -ForegroundColor Green
Write-Host "Backend service: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend service: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")