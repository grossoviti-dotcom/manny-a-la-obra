# Manny a la Obra — MVP

**Encontrá. Compará. Confiá.** Plataforma web que conecta a personas que necesitan contratar un servicio con profesionales verificados de Rosario y su área de influencia: reputación basada en trabajos reales, comparación de presupuestos y respaldo ante problemas.

Proyecto de la Licenciatura en Gestión de Negocios Digitales (UCA Rosario) · Alesio Seijas, Luisina Borgogno, Valentino Perez, Vito Grosso.

> ⚠️ Los profesionales, clientes, reseñas y pedidos cargados son **datos de demostración** (`users.is_demo = true`). Los textos legales son **borradores a revisar por un abogado**.

## Stack

| Capa | Elección | Por qué |
|---|---|---|
| Web | Next.js 16 (App Router, Server Actions) + TypeScript | SSR para SEO y un solo despliegue para sitio público + app |
| Estilos | Tailwind CSS v4 con tokens de marca en `src/app/globals.css` | Sistema de diseño de la sección 3 |
| Base de datos | PostgreSQL en **Neon** + Drizzle ORM | Serverless, ramas para pruebas, integración con Vercel |
| Auth | Email + contraseña (bcrypt) y sesión JWT en cookie httpOnly (`jose`) | Simple, sin dependencias externas; el rol se lee siempre de la base |
| Archivos | Guardados en Postgres (`files.data`, bytea) y servidos por `/api/archivos/[id]` con control de acceso | Documentos de verificación privados sin un bucket extra; límite 5 MB y validación por firma real del archivo |
| Deploy | Vercel (conectado al repo de GitHub) | |

Se eligió Neon en lugar de Supabase porque el equipo ya lo usa y Vercel lo integra de forma nativa. La autenticación propia reemplaza a Supabase Auth. El login con Google queda como gancho (ver "Próximos pasos").

## Correr localmente

Requisitos: Node 20.9+ y una base Postgres (Neon recomendado).

```bash
npm install
cp .env.example .env.local   # completar DATABASE_URL, AUTH_SECRET y SEED_ADMIN_PASSWORD
npm run db:migrate           # crea las tablas
npm run db:seed              # carga datos de demostración (borra todo antes)
npm run dev
```

### Cuentas de demostración

| Rol | Email | Contraseña |
|---|---|---|
| Cliente ("Lucía", con pedidos en todos los estados) | `lucia@manny.example` | `demo1234` |
| Profesional verificado (tiene un pedido para responder) | `carlos.medina@manny.example` | `demo1234` |
| Profesional en revisión | `franco.ledesma@manny.example` | `demo1234` |
| Profesional pendiente / rechazado | `matias.correa@…` / `sergio.paredes@manny.example` | `demo1234` |
| Admin | `SEED_ADMIN_EMAIL` (por defecto `admin@manny.example`) | el valor de `SEED_ADMIN_PASSWORD` (no está en el repo) |

### Scripts

- `npm run dev` / `build` / `start`
- `npm run typecheck`, `npm run lint`
- `npm test`: pruebas de los flujos críticos contra una **rama aislada de Neon** (`.env.test` o `TEST_DATABASE_URL`). Nunca apuntar a producción.
- `npm run db:generate` (nueva migración tras cambiar `src/db/schema.ts`), `db:migrate` y `db:seed`

## Estructura

```
src/
  app/                    rutas (sitio público, /cliente, /profesional, /admin, /pedidos/[id], /reclamos/[id])
    actions/              Server Actions (validan sesión y delegan en servicios)
    api/archivos/[id]     descarga de archivos con control de acceso
  components/             UI (botones, insignia Verificado, estrellas, chips, tarjetas)
  db/schema.ts            modelo de datos (Drizzle)
  lib/
    services/             lógica de negocio y reglas de integridad (testeables, sin Next)
    adapters/             email (mock → consola + tabla email_log) e identidad (mock)
    analytics.ts          eventos de producto
    validation.ts         esquemas zod (validación en servidor)
  proxy.ts                chequeo optimista de sesión + cookie anónima de analítica
scripts/seed.ts           datos de demostración
tests/                    pruebas de flujos y roles (vitest)
```

## Reglas de negocio implementadas

- **Visibilidad:** sólo aparecen en búsquedas y perfiles los profesionales `verificado` con `verification_expires_at` vigente (revalidación anual) y cuenta activa.
- **Verificación:** pendiente → en revisión → verificado | rechazado. Hacen falta DNI frente/dorso y selfie, y además matrícula para gas y electricidad. La decide un admin. `IdentityVerificationProvider` (`src/lib/adapters/identity.ts`) deja enchufable un proveedor externo.
- **Documentos privados:** sólo los ven el propio profesional y los admins. Cualquier otro recibe 404.
- **Flujo:** solicitado → presupuestado → contratado → en curso → finalizado → calificado | en reclamo. Un profesional nunca ve los presupuestos de la competencia. Al contratar, los demás presupuestos se descartan.
- **Reseñas:** una por trabajo, sólo del cliente que contrató y únicamente con el trabajo finalizado. Las sospechosas (enlaces, teléfonos, insultos, 1★ sin detalle) quedan en revisión. Los profesionales pueden denunciarlas, pero no borrarlas.
- **Reclamos:** abierto → en mediación → resuelto | cerrado, con transiciones validadas, resolución obligatoria al cerrar, notas internas y seguimiento visible para el cliente.
- **Auditoría:** las acciones sensibles quedan registradas en `audit_log`.

## Métricas del MVP (panel `/admin`)

Eventos en `analytics_events` (ver `src/lib/analytics.ts`):

| Meta | Cálculo |
|---|---|
| ≥ 60% de profesionales completan la verificación | verificados vigentes / perfiles profesionales creados (`pro_signup_started`) |
| ≥ 30% de búsquedas derivan en pedido | visitantes (cookie anónima) con `search_performed` que luego tienen `quote_request_created` |
| ≥ 20% de pedidos terminan en contratación | trabajos / pedidos |
| Calificación ≥ 4,5 | promedio de reseñas publicadas |

También se ven: usuarios registrados, profesionales verificados y por vencer, solicitudes, tiempo hasta contratar, reclamos abiertos y tiempo de resolución, % de trabajos concretados dentro de la plataforma y los últimos emails del adaptador mock. Los números del seed son ilustrativos.

## Seguridad

- Validación con zod en el servidor en todas las acciones; autorización por rol dentro de los servicios. El proxy sólo hace una redirección optimista.
- Cookies `httpOnly`, `sameSite=lax` y `secure` en producción. Mismo mensaje de error para email inexistente o contraseña incorrecta.
- Archivos: máx. 5 MB, tipo validado por la firma binaria (JPG/PNG/WEBP, más PDF para documentos), servidos con `nosniff` y CSP `sandbox`.
- Encabezados de seguridad globales en `next.config.ts`. Sin secretos en el repo: ver `.env.example`.

## Deploy

- Repo: GitHub (`grossoviti-dotcom/manny-a-la-obra`). Cada push a `main` despliega en Vercel.
- Variables en Vercel: `DATABASE_URL` (Neon, rama principal), `AUTH_SECRET` y `NEXT_PUBLIC_SITE_URL`.
- Las migraciones se aplican con `npm run db:migrate` apuntando a la base de producción. No corren en el build.

## Próximos pasos (fuera del MVP, con ganchos listos)

- Login con Google: agregar un proveedor OAuth y crear la sesión con `createSession()`.
- Email real: implementar `EmailProvider` (Resend, SES, etc.) en `src/lib/adapters/email.ts`.
- Verificación automática: implementar `IdentityVerificationProvider`.
- Pagos con retención y garantía con aseguradora: la tabla `jobs` ya modela los estados. Falta agregar `payments`.
- Archivos en almacenamiento de objetos (S3/R2/Vercel Blob privado) cuando crezca el volumen.
- Notificaciones push, app nativa, chat en tiempo real (hoy se refresca cada 20 s), rate limiting del login y modo oscuro.
