# 🚀 Arquitectura y Despliegue de BiblioFlow

Este documento detalla la arquitectura de despliegue en producción para el sistema **BiblioFlow**, cumpliendo con todos los requerimientos de la rúbrica, incluyendo el pipeline automatizado (CI/CD) y el stack de observabilidad (Monitoreo).

---

## 1. Infraestructura General

El proyecto ha sido desplegado en un servidor **AWS EC2 (Elastic Compute Cloud)** de tipo `t3.small` (Ubuntu 22.04 LTS), al cual se le asignó una IP Elástica fija para garantizar su disponibilidad pública.

*   **Dirección IP Pública:** `100.24.233.220`
*   **Gestor de Procesos:** PM2 (Para los 5 microservicios de NestJS).
*   **Orquestador de Infraestructura:** Docker Compose (Para las bases de datos y monitoreo).

El sistema utiliza un enfoque de **Microservicios**, compuesto por:
1.  `api-gateway` (Puerto 3000)
2.  `patron-service` (Puerto 3001)
3.  `catalog-service` (Puerto 3002)
4.  `holdings-service` (Puerto 3003)
5.  `circulation-service` (Puerto 3004)

Las Bases de Datos (PostgreSQL), la Caché (Redis) y el Motor de Búsqueda (Elasticsearch) se ejecutan de manera aislada y segura en contenedores Docker dentro del mismo servidor.

---

## 2. CI/CD: Despliegue Continuo Automatizado

Todo el proceso de entrega de código ha sido automatizado mediante **GitHub Actions**.

### 🛠️ Integración Continua (CI)
*Archivo:* `.github/workflows/ci.yml`

Cada vez que se sube código a las ramas principales, el servidor de GitHub levanta un entorno en la nube que se encarga de:
1.  Instalar las dependencias de manera determinista (`pnpm install`).
2.  Verificar que todo el tipado de TypeScript sea correcto en los 5 microservicios (`Type Check`).
3.  Pasar las reglas de estilo (`Lint`).
4.  Ejecutar las pruebas unitarias y de integración para asegurar que el nuevo código no rompa el funcionamiento actual.

### 🚀 Despliegue Continuo (CD)
*Archivo:* `.github/workflows/cd.yml`

Si el código llega a la rama `main`, se activa el Despliegue Continuo.
En este proceso, GitHub utiliza credenciales seguras (Variables de Entorno Secrets) para conectarse por SSH directamente al servidor AWS EC2. Una vez conectado, ejecuta el script de despliegue (`deploy/deploy.sh`) que:
*   Descarga el último código de GitHub (`git pull`).
*   Construye las nuevas versiones del backend de NestJS (`pnpm build`).
*   Reinicia los procesos de PM2 sin que se caiga el sistema (Zero-Downtime Reload).

---

## 3. Stack de Monitoreo: Prometheus y Grafana (10% Rúbrica)

Para cumplir con el hito de Observabilidad, se implementó un sistema de monitoreo en tiempo real utilizando el estándar de la industria.

### 📡 Prometheus (Recolección de Métricas)
Se instaló la librería `@willsoto/nestjs-prometheus` en todos los microservicios. Ahora, cada uno expone una ruta `/api/v1/metrics` (o `/metrics` en el Gateway).
Prometheus, ejecutándose en un contenedor Docker en el puerto `9090`, escrapea automáticamente esta información cada 15 segundos siguiendo la configuración definida en `deploy/prometheus.yml`.

### 📊 Grafana (Visualización de Datos)
Grafana se ejecuta en el puerto `3005` y se conecta directamente a Prometheus.
*   **Enlace de acceso:** [http://100.24.233.220:3005](http://100.24.233.220:3005)
*   **Credenciales:** `admin` / `admin`

Para este proyecto, se ha aprovisionado (Auto-Provisioning) de manera nativa un **Dashboard Profesional ("BiblioFlow - System Overview")**, el cual utiliza técnicas de *Templates* y *Repeating Rows*. Este Dashboard muestra una sección independiente para **cada microservicio**, midiendo en tiempo real:
*   **Uso de CPU:** Porcentaje de tiempo de procesamiento utilizado por cada proceso de PM2.
*   **Uso de Memoria RAM:** Cantidad en bytes que está consumiendo cada microservicio del servidor EC2.

---

## 4. Despliegue del Frontend (Vercel)

El sistema cuenta con dos aplicaciones frontend desarrolladas en **Next.js**:
1. `patron-portal` (Portal público para los socios)
2. `staff-intranet` (Sistema administrativo interno)

Ambos frentes han sido diseñados para ser desplegados en **Vercel**, la plataforma oficial y óptima para aplicaciones Next.js.

### 🌐 Proceso de Despliegue en Vercel
1. **Integración con GitHub:** Los proyectos en Vercel se conectan directamente al repositorio de GitHub (`isaconsii08-dot/trab_arqui`).
2. **Configuración del Monorepo:** En la configuración del proyecto en Vercel, se especifica el "Root Directory" apuntando a la carpeta de cada frontend respectivo (`apps/patron-portal` y `apps/staff-intranet`). Vercel detecta automáticamente que es un entorno gestionado por TurboRepo y pnpm.
3. **Variables de Entorno:** Durante el despliegue, se configuran las variables de entorno necesarias (ej: `API_URL`, `NEXT_PUBLIC_API_URL`) para que el frontend pueda comunicarse correctamente con el `api-gateway` desplegado en la instancia EC2 (`http://100.24.233.220:3000`).
4. **Despliegues Automáticos:** Al igual que el backend, Vercel provee CI/CD out-of-the-box. Cada `push` a la rama `main` dispara automáticamente un nuevo build y despliegue del frontend, generando una URL pública segura (`https`) instantáneamente.

---

*Despliegue finalizado exitosamente.*
