# BiblioFlow – Architecture Reference

**Autor:** Isabella UCC  
**Email:** juanguillermomarinco@gmail.com  
**Repositorio:** github.com/juanguillermomarinco/biblioflow  
**Fecha:** Abril 2026

---

## Visión General

BiblioFlow es un sistema integral de gestión bibliotecaria construido con una
**arquitectura de microservicios** y siguiendo los principios de **Clean Architecture**,
**Domain-Driven Design (DDD)** y **SOLID**.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                    │
│   Portal Socio (Next.js)    Intranet Staff (Next.js)               │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY :3000                              │
│         JWT validation · Rate limiting · Proxy routing              │
└──┬──────┬──────┬──────┬──────┬───────┬───────┬──────────────────────┘
   │      │      │      │      │       │       │
   ▼      ▼      ▼      ▼      ▼       ▼       ▼
 :3001  :3002  :3003  :3004  :3005   :3006   :3007
Patron Catalog Holdings Circ. Space  Acquis. Analytics
  DB     DB      DB      DB    DB     DB       DB
  (PG)  (PG)   (PG)    (PG)  (PG)  (PG)     (PG)

                    ┌──────────┐
                    │  Redis   │  ← Async events (Pub/Sub)
                    │ Pub/Sub  │
                    └────┬─────┘
                         │ Subscribes
                         ▼
                    Notification Service
                    Analytics Service
```

---

## Decisiones de arquitectura

### 1. Clean Architecture por servicio

```
src/
├── domain/            ← Sin dependencias externas. Entidades, VOs, interfaces de repos
│   ├── entities/
│   ├── value-objects/
│   └── repositories/  (interfaces = puertos)
│
├── application/       ← Casos de uso, orquestan el dominio. Depende SOLO del dominio
│   ├── use-cases/
│   ├── sagas/         (transacciones distribuidas con compensación)
│   ├── dtos/
│   └── ports/         (interfaces para servicios externos)
│
├── infrastructure/    ← Adaptadores. Depende de frameworks y librerías
│   ├── persistence/   (Prisma repositories)
│   ├── messaging/     (Redis publisher/subscriber)
│   └── http/          (HTTP clients hacia otros servicios)
│
└── presentation/      ← Controllers, guards, filtros, decorators
    ├── controllers/
    ├── guards/
    ├── filters/
    └── decorators/
```

### 2. Dependency Inversion (SOLID – D)

Los casos de uso dependen de **interfaces** (puertos), no de implementaciones:

```typescript
// domain/repositories/patron.repository.interface.ts
export interface IPatronRepository { ... }
export const PATRON_REPOSITORY = Symbol('IPatronRepository');

// infrastructure/persistence/patron.repository.ts (adaptador)
@Injectable()
export class PrismaPatronRepository implements IPatronRepository { ... }

// app.module.ts (inyección)
{ provide: PATRON_REPOSITORY, useClass: PrismaPatronRepository }
```

### 3. Saga Pattern (Circulation Service)

El préstamo de un material implica múltiples servicios y debe ser atómico:

```
CreateLoanSaga:
  1. Verify patron → PatronService (sync REST)
  2. Reserve item  → HoldingsService (sync REST) ←── compensación si falla step 3
  3. Persist loan  → Circulation DB
  4. Publish event → Redis (loan.created)

Compensación: Si step 3 falla → liberar item en HoldingsService
```

### 4. Comunicación asíncrona (Outbox Pattern)

Para garantizar at-least-once delivery de eventos:

```
Circulation DB ─── outbox_events table
                        │
                   Outbox Processor (cron)
                        │
                     Redis Pub/Sub
```

---

## Pila tecnológica

| Capa            | Tecnología                      |
|-----------------|---------------------------------|
| Backend         | NestJS 10 + TypeScript 5        |
| ORM             | Prisma 5                        |
| Base de datos   | PostgreSQL 16 (1 DB/servicio)   |
| Event bus       | Redis 7 (Pub/Sub)               |
| Search          | Elasticsearch 8 (Catalog)       |
| API Frontend    | Next.js 14 (App Router)         |
| Styling         | TailwindCSS 3                   |
| Auth            | JWT (passport-jwt)              |
| Monorepo        | pnpm + Turborepo                |
| Containers      | Docker + Docker Compose         |
| CI/CD           | GitHub Actions → GHCR → Render  |
| Frontend deploy | Vercel                          |

---

## Principios SOLID aplicados

| Principio | Aplicación en BiblioFlow |
|-----------|--------------------------|
| **S** – Single Responsibility | Cada use case tiene una única responsabilidad (`RegisterPatronUseCase`, `AuthenticateUseCase`) |
| **O** – Open/Closed | Entidades de dominio son inmutables; se extienden devolviendo nuevas instancias |
| **L** – Liskov Substitution | `PrismaPatronRepository` puede reemplazarse por cualquier `IPatronRepository` |
| **I** – Interface Segregation | `IPatronRepository` ≠ `IStaffRepository`; separados por responsabilidad |
| **D** – Dependency Inversion | Use cases dependen de interfaces (symbols), no de clases concretas |
