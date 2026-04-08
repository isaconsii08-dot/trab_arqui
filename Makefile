# ─────────────────────────────────────────────────────────────────────────────
# BiblioFlow — Makefile
# Autor: Isabella UCC
# Uso:   make <target>   |   make help
#
# Este archivo define todos los comandos de desarrollo del proyecto.
# Cada "target" (objetivo) es una tarea que puedes ejecutar con `make <nombre>`.
# La sintaxis es:
#
#   nombre-del-target: ## Descripción que aparece en `make help`
#   [TAB] comando que se ejecuta
#
# IMPORTANTE: la indentación de los comandos debe ser con TAB, no espacios.
# ─────────────────────────────────────────────────────────────────────────────

# .DEFAULT_GOAL define qué target se ejecuta cuando escribes `make` sin argumentos.
# En este caso ejecutará `help`, que imprime la lista de comandos disponibles.
.DEFAULT_GOAL := help

# .PHONY le indica a Make que estos nombres NO son archivos del sistema de ficheros.
# Sin esto, si existiera un archivo llamado "install", Make pensaría que ya está
# "construido" y no ejecutaría el comando.
.PHONY: help install dev build test lint type-check clean \
        infra infra-down infra-logs infra-obs infra-reset \
        db-setup db-migrate db-seed db-generate \
        db-migrate-patron db-migrate-catalog db-migrate-holdings db-migrate-circulation \
        dev-patron dev-catalog dev-holdings dev-circulation \
        dev-notification dev-acquisitions dev-space dev-analytics \
        dev-portal dev-staff build-packages env-setup setup

# ─── Variables de color para la terminal ─────────────────────────────────────
# Estos códigos ANSI colorean la salida: verde para éxito, amarillo para
# advertencias y cian para títulos. $(RESET) vuelve al color normal.
CYAN   := \033[0;36m
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RESET  := \033[0m


# ═════════════════════════════════════════════════════════════════════════════
# AYUDA
# ═════════════════════════════════════════════════════════════════════════════

# help: muestra todos los comandos disponibles.
# Se usa echo puro (sin grep/awk) para ser compatible con Windows cmd y PowerShell.
help: ## Muestra todos los comandos disponibles
	@echo ""
	@echo "  BiblioFlow - Sistema Integral de Gestion Bibliotecaria"
	@echo ""
	@echo "  Uso: make <target>"
	@echo ""
	@echo "  --- Dependencias ---"
	@echo "  install              Instala todas las dependencias del monorepo"
	@echo "  env-setup            Copia .env.example -> .env en cada servicio"
	@echo "  setup                Configuracion completa: env + install + infra + db"
	@echo ""
	@echo "  --- Desarrollo ---"
	@echo "  dev                  Inicia todos los servicios en modo watch"
	@echo "  dev-patron           Solo patron-service"
	@echo "  dev-catalog          Solo catalog-service"
	@echo "  dev-holdings         Solo holdings-service"
	@echo "  dev-circulation      Solo circulation-service"
	@echo "  dev-notification     Solo notification-service"
	@echo "  dev-acquisitions     Solo acquisitions-service"
	@echo "  dev-space            Solo space-service"
	@echo "  dev-analytics        Solo analytics-service"
	@echo "  dev-portal           Solo patron-portal (frontend)"
	@echo "  dev-staff            Solo staff-intranet (frontend)"
	@echo ""
	@echo "  --- Build y calidad ---"
	@echo "  build                Compila todos los paquetes y servicios"
	@echo "  build-packages       Solo paquetes compartidos (shared-*)"
	@echo "  lint                 Linting en todo el monorepo"
	@echo "  type-check           Verificacion de tipos TypeScript"
	@echo "  test                 Tests unitarios"
	@echo "  test-e2e             Tests de integracion (Circulation Service)"
	@echo "  format               Formatea con Prettier"
	@echo "  format-check         Verifica formato sin aplicar cambios"
	@echo "  clean                Elimina dist/ y node_modules"
	@echo ""
	@echo "  --- Infraestructura Docker ---"
	@echo "  infra                Levanta PostgreSQL x7, Redis y Elasticsearch"
	@echo "  infra-down           Detiene todos los contenedores"
	@echo "  infra-logs           Sigue los logs en tiempo real"
	@echo "  infra-obs            Infra + Kibana + RedisInsight (observabilidad)"
	@echo "  infra-reset          Destruye volumenes y levanta desde cero"
	@echo ""
	@echo "  --- Base de datos ---"
	@echo "  db-setup             Migra y siembra todos los servicios"
	@echo "  db-migrate           Migraciones pendientes en todos los servicios"
	@echo "  db-seed              Seeds en todos los servicios"
	@echo "  db-generate          Genera clientes Prisma en todos los servicios"
	@echo "  db-migrate-patron    Solo migraciones de patron-service"
	@echo "  db-migrate-catalog   Solo migraciones de catalog-service"
	@echo "  db-migrate-holdings  Solo migraciones de holdings-service"
	@echo "  db-migrate-circulation Solo migraciones de circulation-service"
	@echo ""


# ═════════════════════════════════════════════════════════════════════════════
# DEPENDENCIAS
# ═════════════════════════════════════════════════════════════════════════════

# install: ejecuta `pnpm install` en la raíz del monorepo.
# pnpm lee el archivo pnpm-workspace.yaml y sabe que debe instalar dependencias
# para todos los paquetes en apps/*, services/* y packages/*.
# Turborepo se encarga de que las dependencias internas (shared-*) se resuelvan
# correctamente entre los distintos workspaces.
install: ## Instala las dependencias de todos los workspaces (pnpm install)
	@echo "$(GREEN)▶ Instalando dependencias del monorepo...$(RESET)"
	pnpm install
	@echo "$(GREEN)✓ Dependencias instaladas$(RESET)"


# ═════════════════════════════════════════════════════════════════════════════
# DESARROLLO
# ═════════════════════════════════════════════════════════════════════════════

# dev: lanza `pnpm dev` en todos los workspaces en paralelo usando Turborepo.
# Turborepo resuelve el orden correcto de inicio según las dependencias declaradas
# en turbo.json (los paquetes shared-* arrancan antes que los servicios que los usan).
# Cada servicio corre en modo watch: detecta cambios en el código y se reinicia solo.
# Necesita que la infraestructura Docker esté levantada (`make infra`) antes.
dev: ## Inicia TODOS los servicios en modo watch (requiere `make infra` previo)
	@echo "$(GREEN)▶ Iniciando todos los servicios en modo desarrollo...$(RESET)"
	@echo "  Asegúrate de haber ejecutado $(CYAN)make infra$(RESET) antes."
	pnpm dev

# build: compila todos los paquetes y servicios en orden de dependencias.
# Turborepo ejecuta `npm run build` en cada workspace respetando el grafo:
# primero shared-types, shared-events y shared-errors (sin dependencias internas),
# luego los servicios NestJS (que dependen de los shared-*),
# y finalmente los frontends Next.js (que dependen de shared-types).
# El resultado son carpetas dist/ en cada servicio y .next/ en cada frontend.
build: ## Compila todos los paquetes y servicios en orden correcto
	@echo "$(GREEN)▶ Compilando el monorepo...$(RESET)"
	pnpm build
	@echo "$(GREEN)✓ Build completado$(RESET)"

# build-packages: compila solo los tres paquetes compartidos del monorepo.
# Útil cuando modificas shared-types, shared-events o shared-errors y quieres
# recompilarlos sin tener que hacer el build completo de todos los servicios.
# Ejecuta `tsc` en cada paquete y genera las carpetas dist/ con los .js y .d.ts.
build-packages: ## Recompila solo los paquetes shared-* (shared-types, shared-events, shared-errors)
	@echo "$(GREEN)▶ Compilando paquetes compartidos...$(RESET)"
	pnpm --filter @biblioflow/shared-types  build
	pnpm --filter @biblioflow/shared-events build
	pnpm --filter @biblioflow/shared-errors build
	@echo "$(GREEN)✓ Paquetes compartidos compilados$(RESET)"

# ─── Servicios individuales ──────────────────────────────────────────────────
# Los siguientes targets inician un único servicio en modo desarrollo.
# `pnpm --filter <nombre>` selecciona solo ese workspace del monorepo.
# Útil cuando trabajas en un servicio concreto y no quieres arrancar los 9.

# dev-patron: inicia patron-service en el puerto 3001.
# Gestiona socios, personal, autenticación JWT y multas.
dev-patron: ## Inicia solo patron-service en modo watch (:3001)
	pnpm --filter @biblioflow/patron-service dev

# dev-catalog: inicia catalog-service en el puerto 3002.
# Gestiona el catálogo bibliográfico (títulos, autores, materias, portadas).
dev-catalog: ## Inicia solo catalog-service en modo watch (:3002)
	pnpm --filter @biblioflow/catalog-service dev

# dev-holdings: inicia holdings-service en el puerto 3003.
# Gestiona los ejemplares físicos y digitales asociados a cada registro.
dev-holdings: ## Inicia solo holdings-service en modo watch (:3003)
	pnpm --filter @biblioflow/holdings-service dev

# dev-circulation: inicia circulation-service en el puerto 3004.
# Es el servicio crítico de préstamos, devoluciones y multas automáticas.
dev-circulation: ## Inicia solo circulation-service en modo watch (:3004)
	pnpm --filter @biblioflow/circulation-service dev

# dev-notification: inicia notification-service en el puerto 3005.
# Se suscribe a eventos Redis (loan.created, hold.available) y envía emails/push.
dev-notification: ## Inicia solo notification-service en modo watch (:3005)
	pnpm --filter @biblioflow/notification-service dev

# dev-acquisitions: inicia acquisitions-service en el puerto 3006.
# Gestiona pedidos a proveedores y sugerencias de compra de socios.
dev-acquisitions: ## Inicia solo acquisitions-service en modo watch (:3006)
	pnpm --filter @biblioflow/acquisitions-service dev

# dev-space: inicia space-service en el puerto 3007.
# Gestiona la reserva de salas de estudio y espacios colaborativos.
dev-space: ## Inicia solo space-service en modo watch (:3007)
	pnpm --filter @biblioflow/space-service dev

# dev-analytics: inicia analytics-service en el puerto 3008.
# Genera informes y estadísticas de uso de la colección y servicios.
dev-analytics: ## Inicia solo analytics-service en modo watch (:3008)
	pnpm --filter @biblioflow/analytics-service dev

# dev-portal: inicia el portal del socio (Next.js) en el puerto 4000.
# Aplicación web pública donde los socios consultan el catálogo y sus préstamos.
dev-portal: ## Inicia solo patron-portal (frontend socio) en modo watch (:4000)
	pnpm --filter @biblioflow/patron-portal dev

# dev-staff: inicia la intranet del personal (Next.js) en el puerto 4001.
# Aplicación privada para que los bibliotecarios gestionen el sistema.
dev-staff: ## Inicia solo staff-intranet (frontend staff) en modo watch (:4001)
	pnpm --filter @biblioflow/staff-intranet dev


# ═════════════════════════════════════════════════════════════════════════════
# CALIDAD DE CÓDIGO
# ═════════════════════════════════════════════════════════════════════════════

# lint: ejecuta ESLint en todos los archivos .ts del monorepo vía Turborepo.
# Detecta errores de estilo, patrones problemáticos y violaciones de las reglas
# configuradas en cada .eslintrc. Falla si hay errores sin corregir.
lint: ## Ejecuta ESLint en todo el monorepo
	@echo "$(GREEN)▶ Ejecutando linter...$(RESET)"
	pnpm lint

# type-check: ejecuta `tsc --noEmit` en cada workspace.
# Verifica que el código TypeScript sea válido sin generar ningún archivo de salida.
# `--noEmit` significa que solo comprueba los tipos, no produce dist/.
# Útil en CI para detectar errores de tipo antes de hacer build completo.
type-check: ## Verifica tipos TypeScript en todo el monorepo (sin generar archivos)
	@echo "$(GREEN)▶ Verificando tipos TypeScript...$(RESET)"
	pnpm type-check

# test: ejecuta Jest en todos los servicios que tengan tests unitarios.
# `--passWithNoTests` evita que falle si un servicio aún no tiene tests escritos.
# Los tests están en src/**/*.spec.ts y simulan la infraestructura con mocks
# (repositorios en memoria, publishers falsos) siguiendo el patrón de ports.
test: ## Ejecuta los tests unitarios en todos los servicios
	@echo "$(GREEN)▶ Ejecutando tests unitarios...$(RESET)"
	pnpm test

# test-e2e: ejecuta los tests de integración (end-to-end).
# A diferencia de los unitarios, los e2e levantan la aplicación NestJS completa
# y hacen peticiones HTTP reales contra una base de datos de prueba.
# Requieren que la infraestructura Docker esté corriendo.
test-e2e: ## Ejecuta los tests de integración (requiere infra Docker activa)
	@echo "$(GREEN)▶ Ejecutando tests e2e...$(RESET)"
	pnpm test:e2e

# format: aplica Prettier a todos los archivos .ts, .tsx, .json y .md.
# Prettier reescribe el archivo con el formato correcto de forma automática.
# Se ejecuta también automáticamente en el pre-commit hook via lint-staged.
format: ## Formatea todo el código con Prettier (modifica archivos)
	@echo "$(GREEN)▶ Formateando código...$(RESET)"
	pnpm format

# format-check: verifica el formato con Prettier sin modificar ningún archivo.
# Útil en CI para validar que el código está bien formateado antes de mergear.
# Si hay diferencias, devuelve un error con los archivos que no pasan.
format-check: ## Verifica el formato Prettier sin modificar archivos (para CI)
	pnpm format:check

# clean: elimina todos los artefactos de compilación del monorepo.
# Borra las carpetas dist/ de cada servicio y .next/ de los frontends.
# También elimina node_modules de todos los workspaces.
# Útil para forzar un build desde cero o resolver problemas de caché.
clean: ## Elimina dist/, .next/ y node_modules en todo el monorepo
	@echo "$(YELLOW)▶ Limpiando artefactos de build y dependencias...$(RESET)"
	pnpm clean
	@echo "$(GREEN)✓ Limpieza completada. Ejecuta $(CYAN)make install$(RESET)$(GREEN) para reinstalar.$(RESET)"


# ═════════════════════════════════════════════════════════════════════════════
# INFRAESTRUCTURA DOCKER
# ═════════════════════════════════════════════════════════════════════════════

# infra: levanta todos los servicios de infraestructura definidos en docker-compose.yml.
# Inicia en segundo plano (-d = detached) los siguientes contenedores:
#   - 7 instancias de PostgreSQL 16 (una por microservicio, puertos 5432–5438)
#   - Redis 7 con persistencia AOF activada (puerto 6379)
#   - Elasticsearch 8.12 en modo single-node (puerto 9200)
# Los servicios tienen healthchecks: Make espera a que estén "healthy" antes de continuar.
infra: ## Levanta PostgreSQL ×7, Redis y Elasticsearch en Docker (background)
	@echo "$(GREEN)▶ Levantando infraestructura Docker...$(RESET)"
	docker compose up -d
	@echo "$(GREEN)✓ Infraestructura iniciada$(RESET)"
	@echo "  PostgreSQL (patron)      → localhost:5432"
	@echo "  PostgreSQL (catalog)     → localhost:5433"
	@echo "  PostgreSQL (holdings)    → localhost:5434"
	@echo "  PostgreSQL (circulation) → localhost:5435"
	@echo "  PostgreSQL (acquis.)     → localhost:5436"
	@echo "  PostgreSQL (space)       → localhost:5437"
	@echo "  PostgreSQL (analytics)   → localhost:5438"
	@echo "  Redis                    → localhost:6379"
	@echo "  Elasticsearch            → localhost:9200"

# infra-down: detiene y elimina todos los contenedores Docker.
# Los volúmenes de datos (bases de datos) se conservan, por lo que la próxima
# vez que ejecutes `make infra` los datos seguirán ahí.
# Para eliminar también los datos usa `make infra-reset`.
infra-down: ## Detiene los contenedores Docker (conserva los datos en volúmenes)
	@echo "$(YELLOW)▶ Deteniendo infraestructura...$(RESET)"
	docker compose down
	@echo "$(GREEN)✓ Infraestructura detenida$(RESET)"

# infra-logs: muestra y sigue en tiempo real los logs de todos los contenedores.
# Ctrl+C para salir. Útil para diagnosticar problemas de conexión o errores
# en las bases de datos al arrancar.
infra-logs: ## Muestra los logs de Docker en tiempo real (Ctrl+C para salir)
	docker compose logs -f

# infra-obs: levanta la infraestructura base más las herramientas de observabilidad.
# Además de los contenedores normales, activa el perfil "observability" que añade:
#   - Kibana :5601  → interfaz web para explorar datos de Elasticsearch
#   - RedisInsight :5540 → interfaz web para inspeccionar Redis en tiempo real
# Estas herramientas son solo para desarrollo; no se despliegan en producción.
infra-obs: ## Levanta infra + Kibana (:5601) + RedisInsight (:5540) para observabilidad
	@echo "$(GREEN)▶ Levantando infraestructura con herramientas de observabilidad...$(RESET)"
	docker compose --profile observability up -d
	@echo "$(GREEN)✓ Listo$(RESET)"
	@echo "  Kibana       → http://localhost:5601"
	@echo "  RedisInsight → http://localhost:5540"

# infra-reset: detiene los contenedores Y elimina los volúmenes de datos.
# ⚠ DESTRUCTIVO: borra completamente todas las bases de datos PostgreSQL,
# los datos de Redis y el índice de Elasticsearch. Después necesitarás
# ejecutar `make db-setup` para recrear y poblar las bases de datos.
# Útil para empezar desde cero o resolver inconsistencias de datos en desarrollo.
infra-reset: ## ⚠ DESTRUCTIVO — Elimina contenedores y TODOS los datos de los volúmenes
	@echo "$(YELLOW)▶ ATENCIÓN: se eliminarán todos los datos de las bases de datos.$(RESET)"
	docker compose down -v
	@echo "$(GREEN)✓ Contenedores y volúmenes eliminados$(RESET)"
	@echo "  Ejecuta $(CYAN)make infra && make db-setup$(RESET) para recrear todo."


# ═════════════════════════════════════════════════════════════════════════════
# BASE DE DATOS
# ═════════════════════════════════════════════════════════════════════════════

# db-setup: atajo que ejecuta migraciones y seeds en todos los servicios de una vez.
# Es el comando que debes usar la primera vez que montas el proyecto, o después
# de ejecutar `make infra-reset`. Llama internamente a db-migrate y db-seed.
db-setup: ## Migra + siembra TODOS los servicios (usar tras `make infra` por primera vez)
	@echo "$(GREEN)▶ Configurando todas las bases de datos...$(RESET)"
	@$(MAKE) db-migrate
	@$(MAKE) db-seed
	@echo "$(GREEN)✓ Todas las bases de datos están listas$(RESET)"

# db-migrate: aplica las migraciones Prisma pendientes en cada servicio.
# Una migración es un archivo SQL generado por Prisma que describe los cambios
# de esquema (crear tablas, añadir columnas, índices…). Se ejecutan en orden
# y Prisma registra cuáles ya se han aplicado para no repetirlas.
# Se ejecuta en los 7 servicios que tienen base de datos propia.
db-migrate: ## Aplica las migraciones Prisma pendientes en todos los servicios
	@echo "$(GREEN)▶ Ejecutando migraciones Prisma...$(RESET)"
	pnpm --filter @biblioflow/patron-service       db:migrate
	pnpm --filter @biblioflow/catalog-service      db:migrate
	pnpm --filter @biblioflow/holdings-service     db:migrate
	pnpm --filter @biblioflow/circulation-service  db:migrate
	pnpm --filter @biblioflow/acquisitions-service db:migrate
	pnpm --filter @biblioflow/space-service        db:migrate
	pnpm --filter @biblioflow/analytics-service    db:migrate
	@echo "$(GREEN)✓ Migraciones completadas$(RESET)"

# db-seed: ejecuta los scripts de seed de datos de prueba.
# Los seeds insertan registros iniciales necesarios para desarrollar y probar:
# socios de ejemplo, libros en el catálogo, ejemplares, préstamos activos, etc.
# Solo se aplica a los servicios que tienen datos de prueba definidos.
db-seed: ## Inserta datos de prueba (socios, libros, ejemplares, préstamos) en las DBs
	@echo "$(GREEN)▶ Ejecutando seeds de datos de prueba...$(RESET)"
	pnpm --filter @biblioflow/patron-service       db:seed
	pnpm --filter @biblioflow/catalog-service      db:seed
	pnpm --filter @biblioflow/holdings-service     db:seed
	pnpm --filter @biblioflow/circulation-service  db:seed
	@echo "$(GREEN)✓ Seeds completados$(RESET)"

# db-generate: regenera los clientes TypeScript de Prisma en todos los servicios.
# Cuando modificas un archivo schema.prisma (añades un modelo, cambias un campo),
# debes ejecutar este comando para que Prisma genere los tipos TypeScript actualizados
# y el cliente de base de datos que refleja el nuevo esquema.
# Nota: esto NO aplica migraciones; solo actualiza el código generado.
db-generate: ## Regenera los clientes Prisma tras modificar un schema.prisma
	@echo "$(GREEN)▶ Generando clientes Prisma...$(RESET)"
	pnpm --filter @biblioflow/patron-service       db:generate
	pnpm --filter @biblioflow/catalog-service      db:generate
	pnpm --filter @biblioflow/holdings-service     db:generate
	pnpm --filter @biblioflow/circulation-service  db:generate
	pnpm --filter @biblioflow/acquisitions-service db:generate
	pnpm --filter @biblioflow/space-service        db:generate
	pnpm --filter @biblioflow/analytics-service    db:generate
	@echo "$(GREEN)✓ Clientes Prisma actualizados$(RESET)"

# ─── Migraciones por servicio individual ─────────────────────────────────────
# Útil cuando solo has modificado el schema de un servicio concreto y no quieres
# ejecutar las migraciones de todos los demás.

# db-migrate-patron: migra solo la base de datos de patron-service (puerto 5432).
# Aplica cambios en las tablas patrons, staff y fines.
db-migrate-patron: ## Migra solo la DB de patron-service (patrons, staff, fines)
	pnpm --filter @biblioflow/patron-service db:migrate

# db-migrate-catalog: migra solo la base de datos de catalog-service (puerto 5433).
# Aplica cambios en bibliographic_records, authors, subjects y sus tablas de relación.
db-migrate-catalog: ## Migra solo la DB de catalog-service (bibliographic_records, authors)
	pnpm --filter @biblioflow/catalog-service db:migrate

# db-migrate-holdings: migra solo la base de datos de holdings-service (puerto 5434).
# Aplica cambios en las tablas items y digital_items.
db-migrate-holdings: ## Migra solo la DB de holdings-service (items, digital_items)
	pnpm --filter @biblioflow/holdings-service db:migrate

# db-migrate-circulation: migra solo la base de datos de circulation-service (puerto 5435).
# Aplica cambios en loans, reserves, fines y outbox_events (Outbox Pattern).
db-migrate-circulation: ## Migra solo la DB de circulation-service (loans, reserves, fines)
	pnpm --filter @biblioflow/circulation-service db:migrate


# ═════════════════════════════════════════════════════════════════════════════
# VARIABLES DE ENTORNO
# ═════════════════════════════════════════════════════════════════════════════

# env-setup: copia los archivos .env.example como .env en cada servicio y app.
# Solo crea el .env si no existe ya, para no sobreescribir configuración local.
# Cada .env contiene las variables necesarias para conectar a la base de datos
# local, Redis, JWT secret, etc. Debes revisar y ajustar los valores si es necesario.
env-setup: ## Copia .env.example → .env en cada servicio (solo si no existe)
	@echo "$(GREEN)▶ Creando archivos de entorno...$(RESET)"
	@for dir in services/*/; do \
		if [ -f "$$dir.env.example" ] && [ ! -f "$$dir.env" ]; then \
			cp "$$dir.env.example" "$$dir.env"; \
			echo "  ✓ $$dir.env"; \
		fi; \
	done
	@for dir in apps/*/; do \
		if [ -f "$$dir.env.example" ] && [ ! -f "$$dir.env.local" ]; then \
			cp "$$dir.env.example" "$$dir.env.local"; \
			echo "  ✓ $$dir.env.local"; \
		fi; \
	done
	@echo "$(YELLOW)  Revisa los archivos .env generados y ajusta los valores si es necesario.$(RESET)"


# ═════════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN INICIAL COMPLETA
# ═════════════════════════════════════════════════════════════════════════════

# setup: ejecuta todos los pasos necesarios para poner el proyecto en marcha
# por primera vez, en el orden correcto:
#   1. install   → instala todas las dependencias npm del monorepo
#   2. env-setup → crea los archivos .env a partir de los .env.example
#   3. infra     → levanta PostgreSQL, Redis y Elasticsearch en Docker
#   4. (espera 10 segundos a que las bases de datos arranquen)
#   5. db-setup  → aplica migraciones y seeds en todas las bases de datos
#
# Al terminar, el proyecto está listo para ejecutar `make dev`.
setup: ## ⭐ Configura el proyecto desde cero (install + env + infra + db). Solo la primera vez.
	@echo "$(CYAN)════════════════════════════════════════$(RESET)"
	@echo "$(CYAN)  BiblioFlow — Configuración inicial    $(RESET)"
	@echo "$(CYAN)════════════════════════════════════════$(RESET)"
	@$(MAKE) install
	@$(MAKE) env-setup
	@$(MAKE) infra
	@echo "$(YELLOW)▶ Esperando que las bases de datos arranquen (10s)...$(RESET)"
	@sleep 10
	@$(MAKE) db-setup
	@echo ""
	@echo "$(GREEN)════════════════════════════════════════$(RESET)"
	@echo "$(GREEN)  ✓ BiblioFlow está listo               $(RESET)"
	@echo "$(GREEN)════════════════════════════════════════$(RESET)"
	@echo ""
	@echo "  Ejecuta $(CYAN)make dev$(RESET) para iniciar todos los servicios."
	@echo ""
	@echo "  Portal Socio   → http://localhost:4000"
	@echo "  Staff Intranet → http://localhost:4001"
	@echo "  API Gateway    → http://localhost:3000"
	@echo "  Swagger Patron → http://localhost:3001/api/docs"
	@echo ""
