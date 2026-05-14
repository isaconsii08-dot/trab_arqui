#!/bin/bash
# ============================================================
# BiblioFlow — Script de instalación en EC2 (Ubuntu 22.04)
# Ejecutar como: sudo bash ec2-setup.sh
# ============================================================

set -e  # Detener si hay error

echo "=================================================="
echo "  BiblioFlow — Instalación en EC2"
echo "=================================================="

# ── 1. Actualizar sistema ─────────────────────────────────
echo ""
echo ">>> [1/7] Actualizando sistema..."
apt-get update -y && apt-get upgrade -y

# ── 1.5. Configurar Memoria Swap (CRÍTICO para t3.small) ───
echo ""
echo ">>> [1.5/7] Configurando Memoria Swap (4GB)..."
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' | tee -a /etc/sysctl.conf
  echo "  ✅ Memoria Swap activada"
else
  echo "  Swap ya existe"
fi

# ── 2. Instalar Docker ────────────────────────────────────
echo ""
echo ">>> [2/7] Instalando Docker..."
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
usermod -aG docker ubuntu
systemctl enable docker
systemctl start docker

# ── 3. Instalar Node.js 22 ────────────────────────────────
echo ""
echo ">>> [3/7] Instalando Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# ── 4. Instalar pnpm ─────────────────────────────────────
echo ""
echo ">>> [4/7] Instalando pnpm..."
npm install -g pnpm@10.33.0

# ── 5. Instalar PM2 ──────────────────────────────────────
echo ""
echo ">>> [5/7] Instalando PM2 (gestor de procesos)..."
npm install -g pm2

# ── 6. Instalar git ───────────────────────────────────────
echo ""
echo ">>> [6/7] Instalando Git..."
apt-get install -y git

# ── 7. Configurar firewall ────────────────────────────────
echo ""
echo ">>> [7/7] Configurando firewall UFW..."
ufw allow 22    # SSH
ufw allow 3000  # API Gateway
ufw allow 3001  # patron-service
ufw allow 3002  # catalog-service
ufw allow 3003  # holdings-service
ufw allow 3004  # circulation-service
ufw allow 3005
ufw allow 9090
ufw --force enable

echo ""
echo "=================================================="
echo "  ✅ Instalación completada"
echo "  Node: $(node --version)"
echo "  pnpm: $(pnpm --version)"
echo "  Docker: $(docker --version)"
echo "  PM2: $(pm2 --version)"
echo "=================================================="
echo ""
echo "  Próximo paso: ejecutar deploy/deploy.sh"
echo "=================================================="
