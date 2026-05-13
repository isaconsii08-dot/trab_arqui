// ============================================================
// BiblioFlow — PM2 Ecosystem Config
// Gestiona todos los microservicios en producción
// ============================================================

module.exports = {
  apps: [
    // ── API Gateway ──────────────────────────────────────
    {
      name: 'api-gateway',
      cwd: '/home/ubuntu/biblioflow/services/api-gateway',
      script: 'node',
      args: 'dist/main',
      env: { NODE_ENV: 'production' },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: '/home/ubuntu/logs/api-gateway-error.log',
      out_file: '/home/ubuntu/logs/api-gateway-out.log',
    },

    // ── Patron Service ───────────────────────────────────
    {
      name: 'patron-service',
      cwd: '/home/ubuntu/biblioflow/services/patron-service',
      script: 'node',
      args: 'dist/main',
      env: { NODE_ENV: 'production' },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: '/home/ubuntu/logs/patron-error.log',
      out_file: '/home/ubuntu/logs/patron-out.log',
    },

    // ── Catalog Service ──────────────────────────────────
    {
      name: 'catalog-service',
      cwd: '/home/ubuntu/biblioflow/services/catalog-service',
      script: 'node',
      args: 'dist/main',
      env: { NODE_ENV: 'production' },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: '/home/ubuntu/logs/catalog-error.log',
      out_file: '/home/ubuntu/logs/catalog-out.log',
    },

    // ── Holdings Service ─────────────────────────────────
    {
      name: 'holdings-service',
      cwd: '/home/ubuntu/biblioflow/services/holdings-service',
      script: 'node',
      args: 'dist/main',
      env: { NODE_ENV: 'production' },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: '/home/ubuntu/logs/holdings-error.log',
      out_file: '/home/ubuntu/logs/holdings-out.log',
    },

    // ── Circulation Service ──────────────────────────────
    {
      name: 'circulation-service',
      cwd: '/home/ubuntu/biblioflow/services/circulation-service',
      script: 'node',
      args: 'dist/main',
      env: { NODE_ENV: 'production' },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: '/home/ubuntu/logs/circulation-error.log',
      out_file: '/home/ubuntu/logs/circulation-out.log',
    },
  ],
};
