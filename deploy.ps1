# Script de Deploy Automático para Santo Bot
Write-Host "🦅 Desplegando Santo Bot al VPS..." -ForegroundColor Cyan

$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa_santo_key"
$VPS_IP = "76.13.25.51"
$VPS_USER = "root"
$BOT_DIR = "/docker/santo-bot-v2"

# Instalar dependencias en el VPS
Write-Host "`n📦 Instalando dependencias en el servidor..." -ForegroundColor Yellow
ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "cd $BOT_DIR && apt update && apt install -y chromium-browser libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 && npm install && npm install -g pm2"

# Iniciar el bot con PM2
Write-Host "`n🚀 Iniciando Santo Bot..." -ForegroundColor Green
ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "cd $BOT_DIR && pm2 delete santo-bot 2>/dev/null || true && pm2 start index.js --name santo-bot && pm2 save && pm2 startup"

Write-Host "`n✅ Santo Bot está corriendo en el VPS!" -ForegroundColor Green
Write-Host "Para ver los logs: ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} 'pm2 logs santo-bot'" -ForegroundColor Cyan
