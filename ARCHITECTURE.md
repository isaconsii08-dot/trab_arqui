# BiblioFlow — Arquitectura Técnica Detallada

**Autora:** Isabella UCC  
**Email:** juanguillermomarinco@gmail.com  
**Repositorio:** github.com/juanguillermomarinco/biblioflow  
**Fecha:** Abril 2026

---

## Índice

1. [Visión del Sistema](#1-visión-del-sistema)
2. [Estructura del Monorepo](#2-estructura-del-monorepo)
3. [Diagrama de Arquitectura](#3-diagrama-de-arquitectura)
4. [Microservicios — Responsabilidades](#4-microservicios--responsabilidades)
5. [Clean Architecture por Servicio](#5-clean-architecture-por-servicio)
6. [Principios SOLID](#6-principios-solid)
7. [Estrategia de Base de Datos](#7-estrategia-de-base-de-datos)
8. [Comunicación entre Servicios](#8-comunicación-entre-servicios)
9. [Patrón Saga — Préstamo Distribuido](#9-patrón-saga--préstamo-distribuido)
10. [Outbox Pattern — Entrega Garantizada](#10-outbox-pattern--entrega-garantizada)
11. [Paquetes Compartidos](#11-paquetes-compartidos)
12. [Frontend — Portal y Staff Intranet](#12-frontend--portal-y-staff-intranet)
13. [Seguridad](#13-seguridad)
14. [Observabilidad](#14-observabilidad)
15. [DevOps y CI/CD](#15-devops-y-cicd)
16. [Puertos y Servicios](#16-puertos-y-servicios)
17. [Referencia de Endpoints](#17-referencia-de-endpoints)
18. [Pila Tecnológica](#18-pila-tecnológica)

---

## 1. Visión del Sistema

**BiblioFlow** es un ecosistema integral de gestión bibliotecaria diseñado para modernizar la operativa de bibliotecas, centros de documentación y archivos. Cubre el ciclo de vida completo de los materiales: catalogación, disponibilidad, préstamo, devolución, adquisición y baja.

La plataforma sirve a dos tipos de usuario:
- **Socios (patrons):** acceden mediante el portal web para consultar el catálogo, gestionar sus préstamos, reservar espacios y pagar multas.
- **Personal bibliotecario (staff):** opera a través de la intranet para registrar préstamos, gestionar el fondo, adquisiciones y generar informes.

La arquitectura elegida es **microservicios**, con cada dominio de negocio encapsulado en un servicio independiente con su propia base de datos, comunicándose de forma síncrona (REST) para operaciones inmediatas y asíncrona (Redis Pub/Sub) para eventos secundarios.

---

## 2. Estructura del Monorepo

El proyecto utiliza **pnpm workspaces** + **Turborepo** para gestionar el monorepo. Turborepo se encarga de la caché de builds, la ejecución en paralelo con dependencias correctas y la orquestación de pipelines.

```
biblioflow/
├── apps/                          # Frontends (Next.js)
│   ├── patron-portal/             # Portal del socio  → :4000
│   └── staff-intranet/            # Intranet del personal → :4001
│
├── services/                      # Backends (NestJS)
│   ├── api-gateway/               # Punto de entrada único → :3000
│   ├── patron-service/            # Socios, staff, auth, multas → :3001
│   ├── catalog-service/           # Catálogo bibliográfico → :3002
│   ├── holdings-service/          # Ejemplares físicos/digitales → :3003
│   ├── circulation-service/       # Préstamos y devoluciones → :3004
│   ├── notification-service/      # Notificaciones push/email → :3005
│   ├── acquisitions-service/      # Pedidos y adquisiciones → :3006
│   ├── space-service/             # Reserva de salas → :3007
│   └── analytics-service/         # Informes y estadísticas → :3008
│
├── packages/                      # Código compartido (librerías internas)
│   ├── shared-types/              # Tipos e interfaces TypeScript comunes
│   ├── shared-events/             # Contratos de eventos Redis Pub/Sub
│   └── shared-errors/             # Errores de dominio estandarizados
│
├── docker-compose.yml             # Infraestructura local (DBs, Redis, ES)
├── turbo.json                     # Pipeline de Turborepo
├── pnpm-workspace.yaml            # Definición de workspaces
├── tsconfig.base.json             # TypeScript base compartido
├── Makefile                       # Comandos de desarrollo
└── package.json                   # Scripts raíz del monorepo
```

### Turborepo Pipeline

```json
// turbo.json
{
  "tasks": {
    "build":      { "dependsOn": ["^build"] },   // build deps primero
    "dev":        { "cache": false, "persistent": true },
    "lint":       { "dependsOn": ["^build"] },
    "test":       { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] }
  }
}
```

`^build` significa "primero construye todas las dependencias de este paquete". Los paquetes `shared-*` se compilan antes que los servicios que los consumen.

---

## 3. Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             CLIENTES                                    │
│                                                                         │
│   Portal Socio (Next.js :4000)      Intranet Staff (Next.js :4001)    │
└────────────────────────┬────────────────────────────────────────────────┘
                         │ HTTPS / REST
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY  :3000                                 │
│        JWT validation · Rate limiting · Proxy routing                   │
└──┬───────┬───────┬───────┬────────┬────────┬────────┬──────────────────┘
   │       │       │       │        │        │        │
   ▼       ▼       ▼       ▼        ▼        ▼        ▼
:3001   :3002   :3003   :3004    :3005    :3006    :3007 / :3008
Patron  Catalog Holdings Circ.   Notif.  Acquis.  Space / Analytics
  │       │       │       │
 PG1    PG2     PG3     PG4    (cada servicio = su propia PostgreSQL)


                    ┌──────────────┐
                    │  Redis :6379 │  ← Event Bus (Pub/Sub)
                    └──────┬───────┘
              ┌────────────┼────────────────┐
              ▼            ▼                ▼
         Notification   Analytics      Holdings
          Service        Service        Service
         (loan.created) (loan.created) (usage counter)


                    ┌──────────────────────┐
                    │  Elasticsearch :9200  │  ← Full-text search
                    └──────────────────────┘
                              ▲
                        Catalog Service
                     (sincroniza vía eventos)
```

---

## 4. Microservicios — Responsabilidades

### 4.1 API Gateway `:3000`
Punto de entrada único para todos los clientes. Responsabilidades:
- Validación y decodificación de JWT.
- Rate limiting por IP/usuario.
- Enrutamiento por prefijo hacia el servicio correspondiente (`/api/v1/patrons` → Patron Service).
- No contiene lógica de negocio.

### 4.2 Patron Service `:3001`
**Fuente de verdad para identidad y roles.** Gestiona:
- Perfiles de socios (`patrons`): datos personales, número de carnet, estado, historial.
- Personal (`staff`): roles de bibliotecario y administrador con permisos granulares.
- Autenticación: login con credenciales, emisión de JWT.
- Multas (`fines`): registro, estado (pending/paid/waived) y total pendiente por socio.

### 4.3 Catalog Service `:3002`
Registro bibliográfico siguiendo estándares MARC21/Dublin Core. Gestiona:
- Registros bibliográficos: título, autores, ISBN/ISSN, editorial, materias, resumen, portada.
- Autoridades: autores y materias normalizadas para garantizar consistencia.
- Búsqueda avanzada: filtros por materia, autor, año, tipo de material.
- Integración con Elasticsearch para búsqueda full-text.

### 4.4 Holdings Service `:3003`
Gestiona los **ejemplares físicos y digitales** asociados a cada registro bibliográfico:
- Relación `1 registro bibliográfico → N ejemplares`.
- Estados: `available`, `loaned`, `reserved`, `in_repair`, `lost`.
- Ubicación física (sala, estante, depósito).
- Para materiales digitales: control de licencias concurrentes.

### 4.5 Circulation Service `:3004`
**Servicio de alta concurrencia.** Motor de préstamos y devoluciones:
- Préstamos a domicilio con plazos según tipo de socio/material.
- Renovaciones (máximo configurable).
- Devoluciones con cálculo automático de multas por día de retraso.
- Gestión de reservas de ejemplares prestados.
- Implementa el patrón **Saga** para garantizar atomicidad distribuida.

### 4.6 Notification Service `:3005`
Servicio transversal dirigido por eventos. Se suscribe a Redis y envía:
- Recordatorios de devolución (24h antes del vencimiento).
- Avisos de multa generada.
- Notificación cuando un ejemplar reservado está disponible.
- Canal: email (SMTP), push notifications.

### 4.7 Acquisitions Service `:3006`
Gestión del desarrollo de la colección:
- Solicitudes de compra (del personal o sugeridas por socios).
- Pedidos a proveedores con seguimiento de estado.
- Recepción de materiales → desencadena creación en Catalog + Holdings.
- Registro del presupuesto ejecutado.

### 4.8 Space Service `:3007`
Reserva de salas de estudio y espacios colaborativos:
- Disponibilidad en tiempo real.
- Reservas por socios con confirmación automática.
- Reglas de uso: duración máxima, aforo, equipamiento.

### 4.9 Analytics Service `:3008`
Informes y estadísticas para la gestión bibliotecaria:
- Ejecuta procesos ETL sobre réplicas de solo lectura.
- Métricas: préstamos por materia, socios más activos, rotación de colección, uso de espacios.
- No afecta el rendimiento de los servicios transaccionales.

---

## 5. Clean Architecture por Servicio

Cada servicio backend sigue la misma estructura de capas, basada en **Clean Architecture** de Robert C. Martin. Las dependencias apuntan siempre **hacia adentro** (hacia el dominio).

```
src/
├── domain/                    ← Núcleo. Sin dependencias externas
│   ├── entities/              # Aggregate roots con lógica de negocio
│   ├── value-objects/         # Objetos inmutables (Email, CardNumber, Money)
│   └── repositories/          # Interfaces (puertos) — NO implementaciones
│
├── application/               ← Casos de uso. Orquestan el dominio
│   ├── use-cases/             # Un archivo por caso de uso
│   ├── sagas/                 # Transacciones distribuidas con compensación
│   ├── dtos/                  # Data Transfer Objects (entrada/salida)
│   ├── mappers/               # Entidad ↔ DTO ↔ Persistencia
│   └── ports/                 # Interfaces para servicios externos (HTTP, Redis)
│
├── infrastructure/            ← Adaptadores externos. Implementa interfaces
│   ├── persistence/           # PrismaRepository implements IRepository
│   ├── messaging/             # RedisPublisher, RedisSubscriber
│   ├── http/                  # HTTP clients hacia otros microservicios
│   ├── auth/                  # Estrategias Passport (JWT, Local)
│   └── prisma/                # Schema Prisma y migraciones
│
└── presentation/              ← Capa HTTP. Solo recibe y devuelve DTOs
    ├── controllers/           # @Controller — delega a use cases
    ├── guards/                # @UseGuards — autenticación/autorización
    ├── filters/               # @Catch — mapeo de errores de dominio a HTTP
    └── decorators/            # @CurrentUser, @Roles, etc.
```

### Flujo de una petición

```
HTTP Request
     │
     ▼
[Controller]          → valida DTO con class-validator
     │
     ▼
[Use Case]            → orquesta: llama al repo (interfaz) y publica eventos
     │
     ├──▶ [IRepository]    → implementado por PrismaRepository (infrastructure)
     │
     └──▶ [IEventPublisher] → implementado por RedisPublisher (infrastructure)
```

### Ejemplo real — Patron Entity

```typescript
// domain/entities/patron.entity.ts
export class Patron {
  private constructor(private readonly props: PatronProps) {}

  static create(props: PatronProps): Patron {
    return new Patron(props);
  }

  // Lógica de negocio encapsulada en la entidad
  canBorrow(): boolean {
    if (this.props.status !== PatronStatus.ACTIVE) {
      throw new PatronSuspendedError(this.props.id);
    }
    if (this.props.pendingFinesAmount > 0) {
      throw new PatronHasPendingFinesError(this.props.id);
    }
    return true;
  }

  suspend(): Patron {
    return new Patron({ ...this.props, status: PatronStatus.SUSPENDED });
  }
}
```

### Ejemplo real — Value Object

```typescript
// domain/value-objects/email.vo.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(raw: string): Email {
    if (!raw.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new InvalidEmailError(raw);
    }
    return new Email(raw.toLowerCase().trim());
  }

  toString(): string { return this.value; }
}
```

---

## 6. Principios SOLID

### S — Single Responsibility
Cada caso de uso tiene **una sola razón para cambiar**:

```
application/use-cases/
├── register-patron.use-case.ts    ← solo registra socios
├── authenticate.use-case.ts       ← solo autentica
├── update-patron.use-case.ts      ← solo actualiza datos
└── get-patron-fines.use-case.ts   ← solo consulta multas
```

Un `RegisterPatronUseCase` no sabe nada de autenticación ni de multas.

### O — Open/Closed
Las entidades de dominio son **inmutables**. Para "modificarlas" se devuelven nuevas instancias, sin alterar el comportamiento existente:

```typescript
// ❌ Mutación directa (viola OCP)
patron.status = PatronStatus.SUSPENDED;

// ✅ Nueva instancia (respeta OCP)
const suspendedPatron = patron.suspend();
// suspend() → return new Patron({ ...this.props, status: SUSPENDED })
```

Agregar un nuevo estado (`EXPIRED`) no modifica el código existente — se añade un método nuevo.

### L — Liskov Substitution
Cualquier implementación de `IPatronRepository` puede sustituir a otra sin que los casos de uso lo noten:

```typescript
// application depende de la interfaz
export interface IPatronRepository {
  findById(id: string): Promise<Patron | null>;
  save(patron: Patron): Promise<void>;
}

// En tests: InMemoryPatronRepository implements IPatronRepository
// En prod:  PrismaPatronRepository implements IPatronRepository
```

Los tests de la capa de aplicación usan el repositorio en memoria — sin base de datos real.

### I — Interface Segregation
Las interfaces están divididas por responsabilidad, no agrupadas en un "super-repositorio":

```typescript
// ✅ Interfaces específicas
export interface IPatronRepository { findById, save, findByCardNumber }
export interface IStaffRepository  { findById, save, findByEmail }
export interface IFineRepository   { findPendingByPatron, markAsPaid }

// ❌ No existe un IUserRepository que mezcle socios, staff y multas
```

### D — Dependency Inversion
Los casos de uso dependen de **símbolos (tokens de inyección)**, no de clases concretas:

```typescript
// domain/repositories/patron.repository.interface.ts
export const PATRON_REPOSITORY = Symbol('IPatronRepository');

// application/use-cases/register-patron.use-case.ts
@Injectable()
export class RegisterPatronUseCase {
  constructor(
    @Inject(PATRON_REPOSITORY) private readonly repo: IPatronRepository,
    @Inject(EVENT_PUBLISHER)   private readonly events: IEventPublisher,
  ) {}
}

// app.module.ts — el "cableado" está solo en infrastructure
{
  provide: PATRON_REPOSITORY,
  useClass: PrismaPatronRepository,   // ← única mención de Prisma fuera de infrastructure
}
```

---

## 7. Estrategia de Base de Datos

Cada microservicio tiene su **propia base de datos PostgreSQL**. Ningún servicio accede directamente a la base de datos de otro — la comunicación es siempre a través de la API.

| Servicio | DB | Puerto local |
|---|---|---|
| patron-service | `patron_db` | 5432 |
| catalog-service | `catalog_db` | 5433 |
| holdings-service | `holdings_db` | 5434 |
| circulation-service | `circulation_db` | 5435 |
| acquisitions-service | `acquisitions_db` | 5436 |
| space-service | `space_db` | 5437 |
| analytics-service | `analytics_db` | 5438 |

### Esquemas principales

**Patron DB**
```
patrons (id, library_id, card_number, full_name, email, phone, address,
         registration_date, status, password_hash)
staff   (id, library_id, user_id, role, permissions)
fines   (id, patron_id, loan_id, amount, reason, status, created_at, paid_at)
```

**Catalog DB**
```
bibliographic_records (id, title, uniform_title, edition, publication_year,
                       publisher, isbn, issn, summary, cover_image_url)
authors               (id, name, authority_id)
record_authors        (record_id, author_id, role)
subjects              (id, term, authority_id)
record_subjects       (record_id, subject_id)
```

**Holdings DB**
```
items          (id, bibliographic_record_id, barcode, call_number, collection,
               location, status, acquisition_date, price)
digital_items  (id, bibliographic_record_id, license_type, concurrent_users, file_url)
```

**Circulation DB**
```
loans     (id, item_id, patron_id, loan_date, due_date, return_date,
           status, renewed_count)
reserves  (id, item_id, patron_id, reserve_date, expiry_date, status)
fines     (id, loan_id, amount, reason, status)
outbox_events (id, event_type, payload, published, created_at)  ← Outbox Pattern
```

### ORM: Prisma

Cada servicio gestiona su propio `schema.prisma` con sus migraciones independientes. Prisma aporta type-safety completa en las queries y facilita el modelado de relaciones complejas (como las del catálogo MARC21).

---

## 8. Comunicación entre Servicios

### 8.1 Síncrona — REST entre servicios

Para operaciones que requieren respuesta inmediata:

```
Circulation Service                    Holdings Service
       │                                      │
       │  PATCH /api/v1/holdings/items/:id    │
       │──────────────────────────────────────▶│
       │  { status: "loaned" }                 │
       │◀──────────────────────────────────────│
       │  200 OK / 409 Conflict                │
```

Los HTTP clients están en `infrastructure/http/` e implementan interfaces de `application/ports/`, manteniendo la capa de aplicación desacoplada del transporte.

### 8.2 Asíncrona — Redis Pub/Sub

Para desacoplar procesos secundarios:

```
Circulation Service  ──publishes──▶  Redis Channel: loan.created
                                            │
                           ┌────────────────┼────────────────┐
                           ▼                ▼                ▼
                    Notification       Analytics         Holdings
                     Service           Service            Service
                  (programa           (actualiza        (actualiza
                  recordatorio)        métricas)        contador uso)
```

Los contratos de eventos están en el paquete compartido `@biblioflow/shared-events`:

```typescript
// packages/shared-events/src/index.ts
export interface LoanCreatedEvent {
  eventType: 'loan.created';
  loanId: string;
  patronId: string;
  itemId: string;
  dueDate: string;
  timestamp: string;
}
```

---

## 9. Patrón Saga — Préstamo Distribuido

El préstamo de un material involucra múltiples servicios y debe ser **atómico**. Se implementa una Saga coreografiada:

```
CreateLoanSaga (Circulation Service):
─────────────────────────────────────────────────────────────

  PASO 1: Verificar socio
    → GET /api/v1/patrons/:id  (Patron Service)
    ← OK: socio activo, sin multas pendientes
    ← ERROR: PatronSuspended / PatronHasFines → ABORT

  PASO 2: Reservar ejemplar
    → PATCH /api/v1/holdings/items/:barcode  { status: "loaned" }
    ← OK: ejemplar reservado
    ← ERROR: ItemNotAvailable → ABORT

  PASO 3: Persistir préstamo
    → INSERT loans (Circulation DB)
    ← OK
    ← ERROR → COMPENSAR: liberar ejemplar (revertir PASO 2)

  PASO 4: Publicar evento
    → Redis PUBLISH loan.created { loanId, patronId, itemId, dueDate }

─────────────────────────────────────────────────────────────
Compensación: Si PASO 3 falla → PATCH /items/:barcode { status: "available" }
```

---

## 10. Outbox Pattern — Entrega Garantizada

Para garantizar que los eventos se publiquen incluso si Redis falla momentáneamente:

```
Circulation DB:
┌──────────────┐          ┌────────────────┐
│    loans     │          │  outbox_events  │
│  (commit)    │          │  id, event_type │
│              │──mismo──▶│  payload        │
│              │  tx       │  published=false│
└──────────────┘          └────────┬────────┘
                                   │
                          Outbox Processor
                          (cron cada 5s)
                                   │
                                   ▼
                              Redis Pub/Sub
                                   │
                        published=true ✓
```

La transacción de base de datos incluye tanto la creación del préstamo como el registro del evento en `outbox_events`. El procesador periódico lee los eventos no publicados y los envía a Redis, garantizando **at-least-once delivery**.

---

## 11. Paquetes Compartidos

Los paquetes en `packages/` son librerías TypeScript puras que se compilan independientemente y son consumidas por los servicios como dependencias de workspace.

### `@biblioflow/shared-types`
Tipos e interfaces TypeScript compartidos entre servicios y frontends:
```typescript
// patron.types.ts
export enum PatronStatus { ACTIVE = 'active', SUSPENDED = 'suspended', EXPIRED = 'expired' }

// circulation.types.ts
export enum LoanStatus { ACTIVE = 'active', OVERDUE = 'overdue', RETURNED = 'returned' }
```

### `@biblioflow/shared-events`
Contratos de eventos para el bus Redis. Garantiza que publisher y subscriber usen el mismo esquema:
```typescript
export const LOAN_CREATED   = 'loan.created';
export const HOLD_AVAILABLE = 'hold.available';
export interface LoanCreatedEvent { ... }
```

### `@biblioflow/shared-errors`
Errores de dominio con código HTTP y mensaje estandarizado:
```typescript
export class PatronSuspendedError extends DomainException {
  constructor(patronId: string) {
    super(`Patron ${patronId} is suspended`, 'PATRON_SUSPENDED', 403);
  }
}
```

El `DomainExceptionFilter` en cada servicio captura estos errores y los convierte en respuestas HTTP con el código correcto.

---

## 12. Frontend — Portal y Staff Intranet

Ambas aplicaciones son **Next.js 14** con **App Router**, **TypeScript** y **TailwindCSS**.

### Portal del Socio (`apps/patron-portal` → `:4000`)
- Acceso público para socios registrados.
- Server Components para SEO (catálogo, libros).
- Client Components para interactividad (botón de solicitud de préstamo, dashboard).
- Autenticación mediante cookies HTTP-only (`bf_token`, `bf_user`).
- Patrón **BFF (Backend for Frontend)**: los API routes de Next.js (`/api/*`) actúan como proxy hacia los microservicios backend, protegiendo credenciales y adaptando respuestas.

### Intranet del Staff (`apps/staff-intranet` → `:4001`)
- Aplicación privada para el personal bibliotecario.
- Server Components para páginas de gestión (socios, catálogo, préstamos activos).
- Token de servicio para las llamadas entre Next.js server-side y los microservicios.
- Layout con sidebar, navegación por módulos (Circulación, Catálogo, Socios, Multas, Analytics).

### Diseño UI
- **Patron Portal:** paleta editorial biblioteca (parchment, amber, emerald, rust). Tipografía: Playfair Display + DM Sans + JetBrains Mono.
- **Staff Intranet:** misma paleta y tokens que el portal, con adaptaciones para interfaces de gestión densas. Tipografía idéntica.
- **Token system:** colores semánticos en `tailwind.config.ts` (`surface-base`, `text-primary`, `accent-amber`, `accent-red`…) que permiten theming sin tocar componentes.

---

## 13. Seguridad

### Autenticación JWT
- El Patron Service emite JWTs firmados al hacer login.
- El API Gateway valida el JWT en cada petición antes de hacer proxy.
- Los frontends almacenan el token en cookies HTTP-only (no accesibles desde JS).

### Autorización por Roles
- Middleware `RolesGuard` en cada servicio verifica el rol del token (`admin`, `librarian`, `patron`).
- Ejemplo: solo `librarian` y `admin` pueden crear préstamos en el Circulation Service.

### Seguridad de Transporte
- **Helmet** en cada servicio NestJS: headers de seguridad (CSP, HSTS, X-Frame-Options).
- **CORS** configurado por lista blanca de orígenes (`ALLOWED_ORIGINS` env var).
- **Rate Limiting** en el API Gateway: protege el catálogo público de scraping masivo.

### Protección de Datos
- Contraseñas hasheadas con **bcrypt** (cost factor 12).
- Datos sensibles cifrados en reposo.
- Auditoría de acciones críticas (préstamos, bajas de ejemplares) en tablas de log.
- Cumplimiento GDPR: gestión de consentimientos y derecho al olvido.

### Validación de Entrada
- `ValidationPipe` global con `whitelist: true` + `forbidNonWhitelisted: true`: cualquier campo no declarado en el DTO es rechazado.
- `class-validator` + `class-transformer` en todos los DTOs de entrada.

---

## 14. Observabilidad

### Métricas (Prometheus)
- Exposición de métricas `/metrics` en cada servicio.
- Métricas clave del Circulation Service: préstamos/minuto, tiempo de respuesta, tasa de éxito de la Saga.

### Visualización (Grafana)
- Dashboards para operaciones: salud de servicios, latencia por endpoint.
- Dashboards para bibliotecarios: materiales más prestados, ocupación de salas, actividad de socios.

### Logs Centralizados
- Correlación de logs por `traceId` en todas las peticiones.
- Nivel de log configurable por entorno (`LOG_LEVEL` env var).
- En desarrollo: `docker compose --profile observability up` levanta Kibana y RedisInsight.

### Trazabilidad Distribuida
- `traceId` propagado en headers HTTP entre microservicios.
- Permite seguir el flujo completo de un préstamo: `API Gateway → Circulation → Patron → Holdings → Redis`.

---

## 15. DevOps y CI/CD

### GitHub Flow
- Rama principal: `main` (producción).
- Desarrollo en ramas de feature (`feature/`, `fix/`, `chore/`).
- Pull Requests obligatorios para mergear a `main`.
- Ver [GITFLOW.md](./GITFLOW.md) para convenciones de ramas y commits.

### CI — GitHub Actions
Por cada Pull Request se ejecuta un pipeline por servicio:
1. **Lint** (`eslint`) y **format check** (`prettier`).
2. **Type check** (`tsc --noEmit`).
3. **Tests unitarios** (`jest --passWithNoTests`).
4. **Build** Docker image multi-stage.

### CD — Despliegue Continuo
Al hacer merge a `main`:
1. Build de imagen Docker final.
2. Push a **GHCR** (GitHub Container Registry).
3. Despliegue automático en **Render** (rolling update, cero downtime).

### Entornos
| Capa | Plataforma |
|---|---|
| Frontends (portal + intranet) | Vercel |
| Microservicios backend | Render |
| PostgreSQL (1 por servicio) | Render Managed PostgreSQL |
| Redis | Render Redis |
| Elasticsearch | Render / servicio externo |

---

## 16. Puertos y Servicios

| Servicio | Puerto | URL local |
|---|---|---|
| API Gateway | 3000 | http://localhost:3000 |
| Patron Service | 3001 | http://localhost:3001/api/v1 |
| Catalog Service | 3002 | http://localhost:3002/api/v1 |
| Holdings Service | 3003 | http://localhost:3003/api/v1 |
| Circulation Service | 3004 | http://localhost:3004/api/v1 |
| Notification Service | 3005 | http://localhost:3005/api/v1 |
| Acquisitions Service | 3006 | http://localhost:3006/api/v1 |
| Space Service | 3007 | http://localhost:3007/api/v1 |
| Analytics Service | 3008 | http://localhost:3008/api/v1 |
| Patron Portal | 4000 | http://localhost:4000 |
| Staff Intranet | 4001 | http://localhost:4001 |
| PostgreSQL (patron) | 5432 | localhost:5432 |
| PostgreSQL (catalog) | 5433 | localhost:5433 |
| PostgreSQL (holdings) | 5434 | localhost:5434 |
| PostgreSQL (circulation) | 5435 | localhost:5435 |
| PostgreSQL (acquisitions) | 5436 | localhost:5436 |
| PostgreSQL (space) | 5437 | localhost:5437 |
| PostgreSQL (analytics) | 5438 | localhost:5438 |
| Redis | 6379 | localhost:6379 |
| Elasticsearch | 9200 | http://localhost:9200 |
| Kibana (dev) | 5601 | http://localhost:5601 |
| RedisInsight (dev) | 5540 | http://localhost:5540 |

Swagger UI disponible en cada servicio en `/api/docs` (solo en desarrollo).

---

## 17. Referencia de Endpoints

Todos los servicios exponen sus rutas bajo el prefijo `/api/v1/`. Los Swagger interactivos están disponibles en `/api/docs` en entorno de desarrollo.

### 17.1 Patron Service — `:3001`

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Autenticación, devuelve JWT | Público |
| `POST` | `/api/v1/patrons` | Crear nuevo socio | `librarian`, `admin` |
| `GET` | `/api/v1/patrons` | Listar socios (paginado, filtros) | `librarian`, `admin` |
| `GET` | `/api/v1/patrons/stats` | Estadísticas globales de socios | `librarian`, `admin` |
| `GET` | `/api/v1/patrons/me` | Perfil del socio autenticado | `patron` |
| `GET` | `/api/v1/patrons/card/:cardNumber` | Buscar socio por número de carnet | `librarian`, `admin` |
| `GET` | `/api/v1/patrons/:id` | Obtener socio por ID | `librarian`, `admin` |
| `PATCH` | `/api/v1/patrons/:id` | Actualizar datos del socio | `librarian`, `admin` |
| `DELETE` | `/api/v1/patrons/:id` | Eliminar socio | `admin` |
| `POST` | `/api/v1/patrons/:id/fines` | Crear multa manual al socio | `librarian`, `admin` |
| `GET` | `/api/v1/patrons/:id/fines` | Listar multas del socio | `librarian`, `admin`, `patron` (propio) |
| `POST` | `/api/v1/patrons/:id/fines/pay-all` | Saldar todas las multas pendientes | `librarian`, `admin` |
| `PATCH` | `/api/v1/patrons/:id/fines/:fineId` | Actualizar estado de una multa | `librarian`, `admin` |

### 17.2 Catalog Service — `:3002`

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| `GET` | `/api/v1/catalog/search` | Búsqueda por texto (título, autor, ISBN) | Público |
| `GET` | `/api/v1/catalog/:id` | Obtener registro bibliográfico completo | Público |
| `POST` | `/api/v1/catalog` | Crear registro bibliográfico | `librarian`, `admin` |
| `PUT` | `/api/v1/catalog/:id` | Actualizar registro completo | `librarian`, `admin` |
| `DELETE` | `/api/v1/catalog/:id` | Eliminar registro | `admin` |
| `PATCH` | `/api/v1/catalog/:id/activate` | Activar o desactivar un registro | `librarian`, `admin` |

### 17.3 Holdings Service — `:3003`

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| `GET` | `/api/v1/holdings/availability` | Disponibilidad de ejemplares por `recordId` | Público |
| `GET` | `/api/v1/holdings/items/:barcode` | Obtener ejemplar por código de barras | `librarian`, `admin` |
| `GET` | `/api/v1/holdings/records/:recordId/items` | Todos los ejemplares de un registro | `librarian`, `admin` |
| `GET` | `/api/v1/holdings/items` | Listar ejemplares (paginado, filtros) | `librarian`, `admin` |
| `POST` | `/api/v1/holdings/items` | Crear nuevo ejemplar físico | `librarian`, `admin` |
| `PATCH` | `/api/v1/holdings/items/:barcode/reserve` | Marcar ejemplar como reservado | Interno (Circulation Service) |
| `PATCH` | `/api/v1/holdings/items/:barcode/release` | Liberar ejemplar reservado | Interno (Circulation Service) |

### 17.4 Circulation Service — `:3004`

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/api/v1/circulation/loans` | Registrar nuevo préstamo (ejecuta Saga) | `librarian`, `admin` |
| `POST` | `/api/v1/circulation/returns` | Registrar devolución y calcular multa | `librarian`, `admin` |
| `GET` | `/api/v1/circulation/loans/patron/:patronId` | Préstamos de un socio (paginado) | `librarian`, `admin`, `patron` (propio) |
| `GET` | `/api/v1/circulation/loans/active` | Todos los préstamos activos | `librarian`, `admin` |
| `GET` | `/api/v1/circulation/stats` | Estadísticas de circulación | `librarian`, `admin` |
| `GET` | `/api/v1/circulation/loans/:id` | Detalle de un préstamo | `librarian`, `admin` |
| `PATCH` | `/api/v1/circulation/loans/:id` | Actualizar préstamo (fecha de vencimiento, estado) | `librarian`, `admin` |
| `DELETE` | `/api/v1/circulation/loans/:id` | Eliminar préstamo | `admin` |

### 17.5 Convenciones de Respuesta

Todos los endpoints siguen el mismo esquema de respuesta:

```json
// Éxito — recurso único
{ "id": "...", "field": "value", ... }

// Éxito — colección paginada
{
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 10
}

// Error de dominio
{
  "statusCode": 403,
  "error": "PATRON_SUSPENDED",
  "message": "Patron pat-011 is suspended"
}
```

---

## 18. Pila Tecnológica

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | ≥ 20 |
| Lenguaje | TypeScript | ^5.3 |
| Backend framework | NestJS | ^10.3 |
| ORM | Prisma | ^5.9 |
| Base de datos | PostgreSQL | 16 |
| Event bus / caché | Redis | 7 |
| Búsqueda full-text | Elasticsearch | 8.12 |
| Frontend framework | Next.js (App Router) | ^14.2 |
| Styling | TailwindCSS | ^3 |
| Autenticación | passport-jwt + JWT | - |
| Validación | class-validator + class-transformer | - |
| HTTP seguridad | Helmet | ^7 |
| Monorepo | pnpm workspaces + Turborepo | pnpm 10 / turbo 2 |
| Contenedores | Docker + Docker Compose | - |
| CI/CD | GitHub Actions → GHCR | - |
| Deploy frontend | Vercel | - |
| Deploy backend | Render | - |
| Git hooks | Husky + lint-staged | - |
