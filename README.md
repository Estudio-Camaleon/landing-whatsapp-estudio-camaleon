# WhatsApp Landing Page System

Sistema multi-marca de landing pages para derivar clientes a WhatsApp. Rotación round-robin de vendedores, cooldown por IP y tracking via Supabase.

## Arquitectura

```
landing-whatsapp/
├── index.html                       # Landing principal
├── styles.css                       # Estilos globales + temas
├── main.js                          # Lógica de frontend (ES module)
├── brands.js                        # Configuración visual de marcas
├── services/api.js                  # Cliente fetch para /assign-vendor
├── api/                             # Vercel Serverless Functions (TypeScript)
│   ├── _lib/
│   │   ├── auth.ts                  # JWT sign/verify (HMAC-SHA256)
│   │   ├── brands-data.ts           # Configuración visual estática por marca
│   │   ├── store.ts                 # Capa de persistencia (Supabase)
│   │   └── supabase.ts             # Cliente Supabase
│   ├── assign-vendor.ts             # Asignación + rotación + cooldown
│   ├── brand-config.ts              # Configuración pública de marca
│   ├── brands.ts                    # CRUD marcas (admin)
│   ├── vendors.ts                   # CRUD vendedores (admin)
│   ├── sucursales.ts               # CRUD sucursales (admin)
│   ├── events.ts                    # Historial de eventos (admin)
│   ├── public-brands.ts             # Listado público de marcas
│   ├── get-stats.ts                 # Métricas (admin)
│   ├── get-vendors.ts               # Vendedores (admin)
│   └── upload-asset.ts              # Upload de assets a Supabase Storage
├── apps/admin/                      # Panel de administración SPA
├── supabase/
│   └── schema.sql                   # Esquema completo + RLS
├── public/api.js                    # API helper público
├── tests/                           # Tests unitarios (Vitest)
├── .github/                         # GitHub Actions (semantic-release)
├── dev-server.ts                    # Servidor de desarrollo local
├── vercel.json                      # Configuración Vercel
├── tsconfig.json
├── vitest.config.ts
├── .nvmrc                           # Node 24
├── .releaserc.json                  # Config semantic-release
├── .vercelignore
└── .env.example
```

## Flujo del cliente

```
1. ACCESO → Usuario ingresa vía dominio propio o ?brand=slug
2. CARGA  → Se detecta la marca, aplica tema visual (logo, fondo, colores)
3. SUCURSAL → Selecciona sucursal (si aplica)
4. ASIGNACIÓN → GET /assign-vendor → rotación round-robin + cooldown 5min por IP
5. DERIVACIÓN → Redirección a wa.me/[phone]?text=[mensaje]
```

## Marcas incluidas

| Slug          | Negocio        | Rubro         | Vendedores |
|---------------|----------------|---------------|------------|
| aventus       | Perfumería     | perfumes      | 3          |
| maggiestore   | Indumentaria   | indumentaria  | 1          |
| tuslibrosya   | Librería       | libreria      | 4          |

Cada marca tiene tema visual propio (fondos, logos, colores, espaciado).

## Requisitos

- Node.js 24+
- Supabase proyecto (gratuito)
- Vercel CLI (`npm i -g vercel`) para desarrollo local

## Configuración

### 1. Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar `supabase/schema.sql` en SQL Editor
3. Crear bucket `brand-assets` en Storage (público)

### 2. Variables de entorno

```bash
# .env.local
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJ...
ADMIN_USER=admin
ADMIN_PASSWORD=<contraseña_segura>
```

### 3. Desarrollo local

```bash
vercel dev          # Inicia servidor local
```

Probar marcas:
```
http://localhost:3000/                          → Selector de marcas
http://localhost:3000/?brand=aventus            → Marca específica
http://localhost:3000/?brand=maggiestore        → MaggieStore
http://localhost:3000/?brand=tuslibrosya        → TusLibrosYa!
```

### 4. Deploy en Vercel

```bash
vercel --prod
```

Configurar Environment Variables en Vercel Dashboard.

### 5. Dominio propio

```
Vercel → Project → Domains → Add
```

La detección automática de marca por dominio funciona mapeando `dominio.com` al slug en Supabase.

## Panel de administración

```
/login          → Inicio de sesión
/apps/admin/    → Dashboard, Marcas, Sucursales, Vendedores, Eventos
```

### Endpoints admin (requieren token Bearer)

| Endpoint | Métodos | Descripción |
|----------|---------|-------------|
| `/api/brands` | GET/POST/PUT/DELETE | CRUD marcas |
| `/api/vendors` | GET/POST/PUT/DELETE | CRUD vendedores |
| `/api/sucursales` | GET/POST/PUT/DELETE | CRUD sucursales |
| `/api/events` | GET | Historial con filtros |
| `/api/upload-asset` | POST | Subir logo/fondo a Supabase Storage |
| `/get-stats` | GET | Métricas por vendedor |
| `/get-vendors` | GET | Vendedores por marca |

## Multi-tenant / Multi-rubro

- Cada marca es un tenant aislado con su propia configuración visual
- Rubros: `perfumes`, `indumentaria`, `libreria` (cada uno con tema único)
- Detección de marca: `?brand=slug` → dominio personalizado → fallback a default
- RLS policies en Supabase aseguran aislamiento de datos
- Sucursales permiten sub-división dentro de cada marca
- Rotación round-robin independiente por marca
- Cooldown de 5 minutos por IP (persistente en Supabase)

## Troubleshooting

### Las APIs devuelven 500 / FUNCTION_INVOCATION_FAILED

1. Verificar que las variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén configuradas en **Vercel → Settings → Environment Variables**
2. Si aparece `FUNCTION_INVOCATION_FAILED`, revisar que los archivos `api/*.ts` no tengan errores de compilación TypeScript (`strict: true` exige manejo correcto de `catch (e: unknown)`)
3. Para depurar errores de API, revisar los Logs en Vercel Dashboard

### Content Security Policy (CSP) bloquea estilos

Si se agrega un CSP restrictivo (`style-src 'self'`), los estilos inline en `main.js` serán bloqueados. Solución:
- Reemplazar atributos `style="..."` por clases CSS definidas en `styles.css`
- El spinner y mensaje de error ya usan las clases `.spinner` y `.error-message`

## Stack

- **Frontend:** HTML + CSS + Vanilla JS (sin frameworks)
- **Backend:** TypeScript + Vercel Serverless Functions
- **Base de datos:** Supabase (PostgreSQL + Storage)
- **Deploy:** Vercel
