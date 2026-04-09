# BiblioFlow — Sistema Integral de Gestión Bibliotecaria

**Autora:** Isabella UCC  
**Repositorio:** [github.com/juanguillermomarinco/biblioflow](https://github.com/juanguillermomarinco/biblioflow)  
**Contacto:** juanguillermomarinco@gmail.com

---

BiblioFlow es una plataforma digital que moderniza la gestión de bibliotecas, centros de documentación y archivos. Cubre el ciclo de vida completo de los materiales bibliográficos: catalogación, préstamo, devolución, reservas, adquisiciones y estadísticas.

La plataforma sirve a dos audiencias:

- **Socios** — portal web para consultar el catálogo, ver sus préstamos activos, reservar espacios y gestionar multas.
- **Personal bibliotecario** — intranet de gestión para registrar préstamos/devoluciones, administrar el fondo, socios y generar informes.

Construido con una **arquitectura de microservicios**, **Clean Architecture**, **DDD** y **SOLID** sobre un monorepo pnpm + Turborepo.

---

## Stack tecnológico

Cada tecnología fue elegida con un propósito específico dentro de la arquitectura.

### Backend

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **NestJS** | 10 | Framework Node.js con inyección de dependencias, decoradores y módulos — ideal para Clean Architecture. Cada microservicio es una aplicación NestJS independiente. |
| **TypeScript** | 5 | Tipado estático end-to-end. Los tipos del dominio (`shared-types`) se comparten entre servicios y frontends. Elimina errores en tiempo de compilación. |
| **Prisma** | 5 | ORM con generación de código a partir del esquema. Gestiona migraciones (`prisma migrate`), seed (`prisma db seed`) y el cliente de base de datos fuertemente tipado. |

### Bases de datos y mensajería

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **PostgreSQL** | 16 | Base de datos relacional. **Una instancia por microservicio** — aislamiento total, sin joins entre servicios. Cada servicio es dueño de sus datos. |
| **Redis** | 7 | Bus de eventos (Pub/Sub). Los microservicios publican eventos de dominio (`loan.created`, `fine.paid`) y los suscriptores reaccionan de forma asíncrona. También sirve de caché. |
| **Elasticsearch** | 8 | Motor de búsqueda de texto completo para el catálogo bibliográfico. Permite búsquedas por título, autor, ISBN y sinopsis con ranking de relevancia. |

### Frontend

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **Next.js** | 14 | Framework React con App Router. Se usa para los dos frontends: portal del socio (`:4000`) e intranet del staff (`:4001`). Server Components reducen el JavaScript enviado al cliente. |
| **TailwindCSS** | 3 | Utilidades CSS. Sistema de diseño coherente entre los dos frontends a través de tokens de color y tipografía compartidos. |

### Infraestructura y herramientas

| Tecnología | Para qué se usa |
|---|---|
| **Docker + Docker Compose** | Contenedores para toda la infraestructura local: PostgreSQL × 7 instancias, Redis y Elasticsearch. Un solo `docker compose up` levanta el entorno completo. |
| **pnpm** | Gestor de paquetes con workspaces. Comparte dependencias entre paquetes del monorepo y evita duplicados (`node_modules` hoisting). |
| **Turborepo** | Orquestador de tareas del monorepo. Ejecuta `build`, `lint` y `test` en paralelo respetando el grafo de dependencias entre paquetes. Cachea los resultados. |
| **GitHub Actions** | CI/CD: ejecuta lint, type-check y tests en cada PR. En merge a `main` construye imágenes Docker y las publica en GHCR para despliegue en Render/Vercel. |

---

## Requisitos previos

Antes de iniciar el proyecto asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Node.js | 20.x | `node --version` |
| pnpm | 9.x | `pnpm --version` |
| Docker Desktop | 24.x | `docker --version` |
| Docker Compose | incluido en Docker Desktop | `docker compose version` |
| Make | cualquiera | `make --version` |
| Git | 2.x | `git --version` |

### Instalar Make

Make es la herramienta que unifica todos los comandos del proyecto. Si aún no lo tienes:

**Windows**

```powershell
# Opción 1 — Chocolatey (recomendado)
choco install make

# Opción 2 — Winget
winget install GnuWin32.Make

# Opción 3 — Git Bash
# Git for Windows incluye make. Abre Git Bash y verifica: make --version

# Opción 4 — WSL2 (Ubuntu)
sudo apt update && sudo apt install make
```

> Después de instalar con Chocolatey o Winget, abre una terminal nueva para que el PATH se actualice.

**macOS**

```bash
# Opción 1 — Xcode Command Line Tools (ya incluye make, recomendado)
xcode-select --install

# Opción 2 — Homebrew
brew install make
```

**Linux**

```bash
# Debian / Ubuntu
sudo apt update && sudo apt install make

# Fedora / RHEL
sudo dnf install make

# Arch Linux
sudo pacman -S make
```

---

## Inicio rápido

### Primera instalación (máquina nueva)

Cada desarrollador tiene su propia base de datos local corriendo en Docker. Al clonar el repositorio por primera vez sigue estos pasos en orden:

```bash
# 1. Clonar el repositorio
git clone https://github.com/juanguillermomarinco/biblioflow.git
cd biblioflow

# 2. Instalar dependencias del monorepo
pnpm install

# 3. Copiar .env.example → .env en cada servicio
make env-setup

# 4. Generar los clientes Prisma
#    OBLIGATORIO antes de compilar — sin este paso TypeScript no encuentra los tipos
pnpm turbo run db:generate

# 5. Levantar la infraestructura Docker (PostgreSQL × 7, Redis, Elasticsearch)
make infra

# 6. Crear las tablas en la base de datos
make db-migrate

# 7. Crear la cuenta de servicio de la intranet (OBLIGATORIO)
#    Sin este paso la intranet no puede autenticarse con los microservicios
make db-seed

# 8. Iniciar todos los servicios en modo desarrollo
make dev
```

> **Base de datos local:** cada máquina tiene sus propios volúmenes Docker. Los datos no se comparten entre desarrolladores — cada uno empieza con las tablas vacías y crea sus propios datos desde la interfaz.

> **¿Por qué `db:generate`?** Prisma genera código TypeScript a partir del esquema de cada servicio. Sin ese paso el compilador lanza `Cannot find module '../../generated/prisma'`.

Al ejecutar `make dev` se abre automáticamente una ventana secundaria que espera a que todos los servicios arranquen y muestra su estado final. Si alguno falla, lo reintenta abriendo una ventana independiente para ese servicio. También puedes verificar el estado en cualquier momento con:

```bash
make status
```

---

### Arranque diario (después de la instalación inicial)

```bash
make infra   # solo si Docker no está corriendo (tras reiniciar el PC, por ejemplo)
make dev     # mata procesos en puertos, limpia caché Next.js e inicia todo
```

---

Después de `make dev` los servicios estarán disponibles en:

| Aplicación | URL |
|---|---|
| Portal del Socio | http://localhost:4000 |
| Intranet Staff | http://localhost:4001 |
| API Gateway | http://localhost:3000 |
| Swagger (Patron) | http://localhost:3001/api/docs |
| Swagger (Catalog) | http://localhost:3002/api/docs |
| Swagger (Holdings) | http://localhost:3003/api/docs |
| Swagger (Circulation) | http://localhost:3004/api/docs |

---

## Endpoints disponibles

Todos los servicios exponen sus rutas bajo el prefijo `/api/v1/`. Los Swagger interactivos están en las URLs indicadas arriba.

### Patron Service — `:3001`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Autenticación, devuelve JWT |
| `POST` | `/api/v1/patrons` | Crear nuevo socio |
| `GET` | `/api/v1/patrons` | Listar socios (paginado, filtros) |
| `GET` | `/api/v1/patrons/stats` | Estadísticas globales de socios |
| `GET` | `/api/v1/patrons/me` | Perfil del socio autenticado |
| `GET` | `/api/v1/patrons/card/:cardNumber` | Buscar socio por número de carnet |
| `GET` | `/api/v1/patrons/:id` | Obtener socio por ID |
| `PATCH` | `/api/v1/patrons/:id` | Actualizar datos del socio |
| `DELETE` | `/api/v1/patrons/:id` | Eliminar socio |
| `POST` | `/api/v1/patrons/:id/fines` | Crear multa manual al socio |
| `GET` | `/api/v1/patrons/:id/fines` | Listar multas del socio |
| `POST` | `/api/v1/patrons/:id/fines/pay-all` | Saldar todas las multas pendientes |
| `PATCH` | `/api/v1/patrons/:id/fines/:fineId` | Actualizar estado de una multa |

### Catalog Service — `:3002`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/catalog/search` | Búsqueda por texto (título, autor, ISBN) |
| `GET` | `/api/v1/catalog/:id` | Obtener registro bibliográfico |
| `POST` | `/api/v1/catalog` | Crear registro bibliográfico |
| `PUT` | `/api/v1/catalog/:id` | Actualizar registro completo |
| `DELETE` | `/api/v1/catalog/:id` | Eliminar registro |
| `PATCH` | `/api/v1/catalog/:id/activate` | Activar / desactivar registro |

### Holdings Service — `:3003`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/holdings/availability` | Disponibilidad de ejemplares (por `recordId`) |
| `GET` | `/api/v1/holdings/items/:barcode` | Obtener ejemplar por código de barras |
| `GET` | `/api/v1/holdings/records/:recordId/items` | Todos los ejemplares de un registro |
| `GET` | `/api/v1/holdings/items` | Listar ejemplares (paginado, filtros) |
| `POST` | `/api/v1/holdings/items` | Crear nuevo ejemplar físico |
| `PATCH` | `/api/v1/holdings/items/:barcode/reserve` | Marcar ejemplar como reservado |
| `PATCH` | `/api/v1/holdings/items/:barcode/release` | Liberar ejemplar reservado |

### Circulation Service — `:3004`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/circulation/loans` | Registrar nuevo préstamo |
| `POST` | `/api/v1/circulation/returns` | Registrar devolución |
| `GET` | `/api/v1/circulation/loans/patron/:patronId` | Préstamos de un socio (paginado) |
| `GET` | `/api/v1/circulation/loans/active` | Todos los préstamos activos |
| `GET` | `/api/v1/circulation/stats` | Estadísticas de circulación |
| `GET` | `/api/v1/circulation/loans/:id` | Detalle de un préstamo |
| `PATCH` | `/api/v1/circulation/loans/:id` | Actualizar préstamo (fecha, estado) |
| `DELETE` | `/api/v1/circulation/loans/:id` | Eliminar préstamo |

---

## Variables de entorno

Cada servicio requiere un archivo `.env` en su directorio. Copia los ejemplos:

```bash
make env-setup
# equivalente a copiar .env.example → .env en cada servicio
```

Variables principales del **Patron Service** (`services/patron-service/.env`):

```env
DATABASE_URL="postgresql://patron_user:patron_secret@localhost:5432/patron_db"
JWT_SECRET="tu_secreto_seguro"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
REDIS_URL="redis://localhost:6379"
ALLOWED_ORIGINS="http://localhost:4000,http://localhost:4001"
```

> Consulta el `.env.example` de cada servicio para la lista completa de variables.

---

## Comandos disponibles

Todos los comandos se ejecutan desde la raíz del proyecto:

```bash
make help          # muestra todos los comandos disponibles

make install       # instala dependencias (pnpm install)
make dev           # inicia todos los servicios en modo watch
make build         # compila todos los paquetes y servicios
make test          # ejecuta tests unitarios
make lint          # linting en todo el monorepo
make type-check    # verificación de tipos TypeScript
make clean         # elimina dist/ y node_modules

make infra         # levanta Docker (DBs + Redis + Elasticsearch)
make infra-down    # detiene la infraestructura Docker
make infra-logs    # sigue los logs de Docker
make infra-obs     # levanta infraestructura + Kibana + RedisInsight

make db-setup      # migra y siembra TODOS los servicios
make db-migrate    # ejecuta migraciones pendientes en todos los servicios
make db-seed       # ejecuta seeds en todos los servicios

# Comandos individuales por servicio
make dev-patron        # solo patron-service
make dev-catalog       # solo catalog-service
make dev-holdings      # solo holdings-service
make dev-circulation   # solo circulation-service
make dev-portal        # solo patron-portal (frontend)
make dev-staff         # solo staff-intranet (frontend)
```

---

## Estructura del proyecto

```
biblioflow/
├── apps/
│   ├── patron-portal/       # Portal socio (Next.js :4000)
│   └── staff-intranet/      # Intranet staff (Next.js :4001)
├── services/
│   ├── api-gateway/         # Entrada única, JWT, rate limiting (:3000)
│   ├── patron-service/      # Socios, auth, multas (:3001)
│   ├── catalog-service/     # Catálogo bibliográfico (:3002)
│   ├── holdings-service/    # Ejemplares físicos (:3003)
│   ├── circulation-service/ # Préstamos y devoluciones (:3004)
│   ├── notification-service/# Emails y notificaciones (:3005)
│   ├── acquisitions-service/# Pedidos y adquisiciones (:3006)
│   ├── space-service/       # Reserva de salas (:3007)
│   └── analytics-service/   # Informes y métricas (:3008)
├── packages/
│   ├── shared-types/        # Tipos TypeScript compartidos
│   ├── shared-events/       # Contratos de eventos Redis
│   └── shared-errors/       # Errores de dominio estandarizados
├── docker-compose.yml
├── Makefile
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Documentación adicional

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Arquitectura detallada: Clean Architecture, SOLID, Saga pattern, Outbox, bases de datos, seguridad, observabilidad.
- **[GITFLOW.md](./GITFLOW.md)** — Convenciones de ramas, commits y Pull Requests.

---

## Licencia

Proyecto académico — Universidad Cooperativa de Colombia.
