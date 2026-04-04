# BiblioFlow — Sistema Integral de Gestión Bibliotecaria

**Autora:** Isabella UCC  
**Repositorio:** [github.com/juanguillermomarinco/biblioflow](https://github.com/juanguillermomarinco/biblioflow)  
**Contacto:** juanguillermomarinco@gmail.com

---

## Stack

- **Backend:** NestJS · TypeScript · Prisma · PostgreSQL
- **Frontend:** Next.js 14 · TailwindCSS · TypeScript
- **Mensajería:** Redis Pub/Sub
- **Monorepo:** pnpm + Turborepo
- **CI/CD:** GitHub Actions → GHCR → Render / Vercel

## Inicio rápido

```bash
# Instalar dependencias
pnpm install

# Levantar infraestructura (DBs + Redis + Elasticsearch)
pnpm docker:up

# Desarrollar todos los servicios en paralelo
pnpm dev
```

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) y [GITFLOW.md](./GITFLOW.md) para más detalles.
