# WhatsApp Landing Page System

Sistema multi-marca de landing pages para derivar clientes a WhatsApp. Rotación global de vendedores, cooldown por IP y tracking server-side via Edge Function + Supabase.

## Arquitectura

```
landing-whatsapp/
├── index.html                       # Landing principal
├── styles.css                       # Estilos globales + temas
├── main.js                          # Lógica de frontend (módulo ES)
├── brands.js                        # Configuración visual de marcas
├── services/
│   └── api.js                       # Cliente fetch para /assign-vendor
├── apps/
│   └── admin/                       # Panel de control
│       ├── index.html
│       ├── styles.css
│       ├── main.js
│       └── services/
│           └── api.js
├── netlify.toml                     # Configuración de Edge Functions
├── netlify/
│   └── edge-functions/
│       ├── assign-vendor.ts         # Asignación + rotación + cooldown
│       ├── get-stats.ts             # Métricas del panel
│       ├── get-vendors.ts           # Listado de vendedores
│       └── update-vendor.ts         # Activar/desactivar vendedor
├── supabase/
│   └── schema.sql                   # Esquema de base de datos
├── media/
│   ├── logo/                        # Logos SVG por marca
│   └── background/                  # Fondos (desktop y mobile)
├── .env.example                     # Variables de entorno requeridas
├── .gitignore
└── README.md
```

## Flujo del cliente

```
1. ACCESO
   └─ Usuario ingresa vía dominio propio o ?brand=slug

2. CARGA INICIAL (client-side)
   ├─ Se detecta la marca (brands.js) para tema visual
   ├─ Logo, fondo y estilos específicos
   └─ Se muestra overlay de carga

3. ASIGNACIÓN (server-side via Edge Function)
   ├─ GET /assign-vendor
   ├─ Detecta brand por dominio o ?brand=slug
   ├─ Verifica cooldown por IP (5 min en Supabase)
   ├─ Asigna vendedor con rotación global
   ├─ Genera mensaje dinámico aleatorio
   └─ Registra evento de tracking

4. DERIVACIÓN
   ├─ Redirección a wa.me/[phone]?text=[mensaje]
   └─ Si está en cooldown → mensaje de espera
```

## Marcas disponibles

| Slug          | Negocio        | Vendedores | ¿Con dominio? |
|---------------|----------------|------------|---------------|
| aventus       | Perfumería     | 3          | Sí            |
| maggiestore   | Indumentaria   | 1          | Sí            |
| tuslibrosya   | Librería       | 3          | Sí            |
| default       | Genérica       | 3          | Netlify.app   |

## Probar en desarrollo

```bash
# Servir local
npx serve .

# Probar marca específica (solo UI local, sin backend)
http://localhost:3000/?brand=aventus

# En producción (Netlify) si llama a la Edge Function real
https://wsprotador.netlify.app/?brand=maggiestore
```

## Características técnicas

- **Rotación global** — No hackeable desde el cliente, estado en Supabase
- **Cooldown server-side** — Por IP, 5 min, responde HTTP 429
- **Tracking en base de datos** — Eventos con IP, user-agent, vendor
- **Multi-tenant flexible** — `?brand=slug` sin dominio propio, o dominio real
- **100% serverless** — Netlify Edge Functions + Supabase, sin servidor propio
- **CSP estricto** — Solo permite recursos propios y Google Fonts
- **Panel de administración** — Métricas, vendedores, activar/desactivar
- **Sin dependencias frontend** — Vanilla JS, CSS puro
- **Responsive** — Desktop y mobile con breakpoints específicos

## Configuración

### 1. Supabase

Ejecutar `supabase/schema.sql` en SQL Editor y poblar datos:

```sql
INSERT INTO brands (name, domain, slug) VALUES
  ('Aventus Perfumería', 'aventus.com', 'aventus'),
  ('MaggieStore Indumentaria', 'maggiestore.com', 'maggiestore'),
  ('TusLibrosYa Librería', 'tuslibrosya.com', 'tuslibrosya'),
  ('Netlify Test', 'wsprotador.netlify.app', 'default');

INSERT INTO vendors (brand_id, name, phone) VALUES
  ((SELECT id FROM brands WHERE slug='aventus'), 'Dario', '5493815272820'),
  ((SELECT id FROM brands WHERE slug='aventus'), 'Neo', '5493813583226'),
  ((SELECT id FROM brands WHERE slug='aventus'), 'Facundo', '5493812114879'),
  ((SELECT id FROM brands WHERE slug='maggiestore'), 'Dario', '5493815272820'),
  ((SELECT id FROM brands WHERE slug='tuslibrosya'), 'Dario', '5493815272820'),
  ((SELECT id FROM brands WHERE slug='tuslibrosya'), 'Neo', '5493813583226'),
  ((SELECT id FROM brands WHERE slug='tuslibrosya'), 'Facundo', '5493812114879'),
  ((SELECT id FROM brands WHERE slug='default'), 'Dario', '5493815272820'),
  ((SELECT id FROM brands WHERE slug='default'), 'Neo', '5493813583226'),
  ((SELECT id FROM brands WHERE slug='default'), 'Facundo', '5493812114879');
```

Si la API Data está expuesta, otorgar permisos:

```sql
grant all on public.brands to anon;
grant all on public.vendors to anon;
grant all on public.rotation_state to anon;
grant all on public.events to anon;
```

### 2. Netlify

Setear en Site settings → Environment variables:

```
SUPABASE_URL = https://[ref].supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJ...
```

### 3. Agregar dominio propio

```
Netlify → Site settings → Domain management → Add custom domain
```

```sql
UPDATE brands SET domain = 'maggiestore.com' WHERE slug = 'maggiestore';
```

## Panel de administración

Accedé vía `https://wsprotador.netlify.app/apps/admin/` (o `?brand=slug` para ver datos de una marca específica).

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/apps/admin/` | GET | Interfaz del panel |
| `/get-stats` | GET | Devuelve `{ "Vendedor": cantidad }` |
| `/get-vendors` | GET | Lista de vendedores con estado |
| `/update-vendor` | POST | Activa/desactiva vendedor (`{ id, active }`) |

> ⚠️ Sin auth implementada. Para producción, proteger con password simple, header secreto o Supabase Auth.
