# BiblioFlow – GitFlow Strategy

**Autor:** Isabella UCC  
**Email de contacto:** juanguillermomarinco@gmail.com  
**Repositorio:** github.com/juanguillermomarinco/biblioflow

---

## Modelo de Branches

Este proyecto utiliza **GitFlow** adaptado para un monorepo con múltiples microservicios.

```
main
  └── develop
        ├── feature/patron-auth
        ├── feature/catalog-search
        ├── feature/circulation-saga
        └── ...
        
main ←── release/1.0.0
  └── hotfix/fix-loan-overdue-calc
```

---

## Branches permanentes

| Branch    | Propósito                              | Deploy automático |
|-----------|----------------------------------------|-------------------|
| `main`    | Código en producción, estable siempre  | ✅ Render + Vercel |
| `develop` | Integración continua, siempre verde    | ✅ Staging         |

---

## Branches temporales

### `feature/*`
- **Desde:** `develop`
- **Hacia:** `develop` (via Pull Request)
- **Naming:** `feature/<service>-<descripcion-breve>`
- **Ejemplos:**
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b feature/patron-register-use-case
  ```

### `release/*`
- **Desde:** `develop`
- **Hacia:** `main` y `develop`
- **Propósito:** Preparación de release (bump de versión, changelog, smoke tests)
- **Naming:** `release/<semver>`
  ```bash
  git checkout develop
  git checkout -b release/1.0.0
  # Actualizar versiones, generar changelog
  git commit -m "chore: bump version to 1.0.0"
  # PR → main, luego merge back a develop
  ```

### `hotfix/*`
- **Desde:** `main`
- **Hacia:** `main` y `develop`
- **Propósito:** Correcciones críticas en producción
  ```bash
  git checkout main
  git checkout -b hotfix/circulation-fine-calculation
  ```

---

## Flujo de trabajo diario

```bash
# 1. Empezar una nueva feature
git checkout develop && git pull origin develop
git checkout -b feature/catalog-elasticsearch-sync

# 2. Desarrollar con commits atómicos y descriptivos
git add services/catalog-service/src/...
git commit -m "feat(catalog): add Elasticsearch sync on record create"

# 3. Mantener el branch actualizado
git fetch origin develop
git rebase origin/develop

# 4. Abrir Pull Request a develop
# → CI debe pasar (lint + tests + docker build)
# → Requiere al menos 1 review

# 5. Merge con squash o merge commit (no fast-forward)
git checkout develop && git merge --no-ff feature/catalog-elasticsearch-sync
git branch -d feature/catalog-elasticsearch-sync
```

---

## Convención de commits (Conventional Commits)

```
<tipo>(<scope>): <descripción corta>

[cuerpo opcional]

[footer opcional: Breaking Changes, Closes #issue]
```

### Tipos permitidos

| Tipo       | Cuándo usarlo                                    |
|------------|--------------------------------------------------|
| `feat`     | Nueva funcionalidad                              |
| `fix`      | Corrección de bug                                |
| `refactor` | Refactorización sin cambio de comportamiento     |
| `test`     | Añadir o corregir tests                          |
| `docs`     | Documentación                                    |
| `chore`    | Tareas de mantenimiento (deps, config, CI)       |
| `perf`     | Mejora de rendimiento                            |
| `ci`       | Cambios en CI/CD                                 |

### Scopes (microservicios)

`patron`, `catalog`, `holdings`, `circulation`, `notification`,
`acquisitions`, `space`, `analytics`, `gateway`, `shared`, `portal`, `intranet`

### Ejemplos

```
feat(circulation): implement CreateLoanSaga with compensation
fix(patron): prevent duplicate card number generation
refactor(catalog): extract search to use case class
test(circulation): add integration test for concurrent loans
chore(deps): upgrade NestJS to 10.3.1
ci: add Circulation Service integration tests to CI pipeline
```

---

## Pull Request checklist

Antes de abrir un PR, verificar:

- [ ] El branch está actualizado con `develop` (rebase preferible a merge)
- [ ] Todos los tests pasan localmente (`pnpm test`)
- [ ] El código sigue la Clean Architecture del servicio
- [ ] No hay `any` sin justificación en TypeScript
- [ ] Variables de entorno nuevas documentadas en `.env.example`
- [ ] La API documentada en Swagger (si aplica)
- [ ] No se incluyen credenciales ni secrets en el código

---

## Semantic Versioning

```
MAJOR.MINOR.PATCH
  │      │     └── Bug fix (hotfix/)
  │      └──────── Nueva feature retro-compatible (feature/)
  └─────────────── Breaking change (release/ con MAJOR bump)
```
