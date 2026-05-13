#!/bin/bash
# ============================================================
# BiblioFlow — Deploy completo en EC2
# Ejecutar DESPUÉS de ec2-setup.sh
# Uso: bash deploy/deploy.sh
# ============================================================

set -e

REPO_URL="https://github.com/isaconsii08-dot/trab_arqui.git"
APP_DIR="/home/ubuntu/biblioflow"

echo "=================================================="
echo "  BiblioFlow — Deploy en producción"
echo "=================================================="

# ── 1. Clonar o actualizar repositorio ───────────────────
echo ""
echo ">>> [1/6] Clonando repositorio..."
if [ -d "$APP_DIR" ]; then
  echo "  Repo ya existe, actualizando..."
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi
cd "$APP_DIR"

# ── 2. Copiar .env de producción ─────────────────────────
echo ""
echo ">>> [2/6] Configurando variables de entorno..."
cp deploy/env/api-gateway.env         services/api-gateway/.env
cp deploy/env/patron-service.env      services/patron-service/.env
cp deploy/env/catalog-service.env     services/catalog-service/.env
cp deploy/env/holdings-service.env    services/holdings-service/.env
cp deploy/env/circulation-service.env services/circulation-service/.env
echo "  ✅ Variables de entorno copiadas"

# ── 3. Levantar bases de datos con Docker ────────────────
echo ""
echo ">>> [3/6] Levantando bases de datos (PostgreSQL + Redis)..."
docker compose up -d
echo "  Esperando 20 segundos para que inicien las DBs..."
sleep 20

# ── 4. Instalar dependencias ─────────────────────────────
echo ""
echo ">>> [4/6] Instalando dependencias..."
pnpm install --config.confirmModulesPurge=false

# ── 5. Generar Prisma y migrar BDs ───────────────────────
echo ""
echo ">>> [5/6] Generando Prisma y aplicando migraciones..."

for svc in patron-service catalog-service holdings-service circulation-service; do
  echo "  → Procesando $svc..."
  cd "services/$svc"
  npx prisma generate
  npx prisma migrate deploy
  cd "../.."
done
echo "  ✅ Bases de datos listas"

# ── 5.5 Construir servicios ─────────────────────────────────
echo ""
echo ">>> [5.5/6] Construyendo microservicios..."
pnpm --filter "@biblioflow/shared-*" build
for svc in api-gateway patron-service catalog-service holdings-service circulation-service notification-service; do
  pnpm --filter "@biblioflow/$svc" build
done

# ── 6. Iniciar servicios con PM2 ─────────────────────────
echo ""
echo ">>> [6/6] Iniciando microservicios con PM2..."
pm2 delete all 2>/dev/null || true
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash  # Autostart al reiniciar EC2

echo ""
echo "=================================================="
echo "  ✅ Deploy completado"
echo ""
pm2 list
echo ""
echo "  Servicios corriendo:"
echo "  - API Gateway:        http://$(curl -s ifconfig.me):3000"
echo "  - Patron Service:     http://$(curl -s ifconfig.me):3001"
echo "  - Catalog Service:    http://$(curl -s ifconfig.me):3002"
echo "  - Holdings Service:   http://$(curl -s ifconfig.me):3003"
echo "  - Circulation Svc:    http://$(curl -s ifconfig.me):3004"
echo "=================================================="
