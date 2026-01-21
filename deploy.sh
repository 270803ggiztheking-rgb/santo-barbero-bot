#!/bin/bash
# Script de Deploy Automático para Santo Bot

echo "🦅 Desplegando Santo Bot al VPS..."

SSH_KEY="$HOME/.ssh/id_rsa_santo_key"
VPS_IP="76.13.25.51"
VPS_USER="root"
BOT_DIR="/docker/santo-bot-v2"

# Instalar dependencias en el VPS
echo ""
echo "📦 Instalando dependencias en el servidor..."
ssh -i "$SSH_KEY" "${VPS_USER}@${VPS_IP}" << 'ENDSSH'
cd /docker/santo-bot-v2
apt update
apt install -y chromium-browser libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2
npm install
npm install -g pm2
ENDSSH

# Iniciar el bot con PM2
echo ""
echo "🚀 Iniciando Santo Bot..."
ssh -i "$SSH_KEY" "${VPS_USER}@${VPS_IP}" << 'ENDSSH'
cd /docker/santo-bot-v2
pm2 delete santo-bot 2>/dev/null || true
pm2 start index.js --name santo-bot
pm2 save
pm2 startup
ENDSSH

echo ""
echo "✅ Santo Bot está corriendo en el VPS!"
echo "Para ver los logs: ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} 'pm2 logs santo-bot'"
