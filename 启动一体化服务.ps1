# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 设置Python路径
$pythonPath = "$env:USERPROFILE\AppData\Local\Programs\Python\Python311\python.exe"

# 构建前端
Write-Host "Building frontend..." -ForegroundColor Green
Set-Location "my-resume-analyzer-frontend"
npm run build
Set-Location ".."

# 启动后端服务
Write-Host "Starting integrated service..." -ForegroundColor Green
& $pythonPath app.py