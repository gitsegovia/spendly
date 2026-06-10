# Spendly — Project Brief
_Generado por CORE — Core Code Innovation | 2026-06-10_
_Directorio del proyecto: /Users/josesegovia/CoreCodeInnovations/control-de-gasto_

---

## 1. Contexto y Visión

### Idea central
App móvil de control financiero personal que permite registrar gastos categorizados (con detalle por artículo), ingresos fijos y variables, créditos, pagos pendientes, ahorros e inversiones. Incluye resumen mensual, balance ingreso vs gasto y estadísticas. Modelo freemium: funcionalidad básica gratuita, features avanzadas por suscripción.

### Tipo
Producto propio CCI — uso personal inicial, con proyección de publicación pública.
Responsable: Jose Segovia (fundador CCI)

### Problema que resuelve
No existe un registro activo de finanzas personales. La alternativa más común (Excel) es torpe para uso móvil y cotidiano. El usuario no tiene visibilidad clara de si sus ingresos cubren sus gastos mensuales.

### Usuario objetivo
- Perfil: Público general adulto en edad laboral, no técnico
- Plataforma: Mobile-first (iOS y Android)
- Idioma: ES / EN desde v1
- Volumen inicial: personal, con proyección a usuarios públicos

### Visión de éxito
- **MVP**: Registro de gastos + ingresos + balance mensual
- **Largo plazo**: App pública en stores con modelo freemium activo, inversiones, créditos, estadísticas históricas y alertas financieras

---

## 2. Requerimientos

### 2.1 Funcionales

| ID | Descripción | Prioridad | Rol |
|----|-------------|-----------|-----|
| RF-01 | Registro de gastos por categoría | Alta | Free / Premium |
| RF-02 | Detalle de artículos dentro de cada categoría de gasto | Alta | Free / Premium |
| RF-03 | Registro de ingresos fijos y variables | Alta | Free / Premium |
| RF-04 | Resumen mensual con balance ingreso vs gasto | Alta | Free / Premium |
| RF-05 | Estadísticas de gastos e ingresos | Alta | Free / Premium |
| RF-06 | Autenticación con Google Sign-In y Apple Sign-In | Alta | Todos |
| RF-07 | Sincronización de datos en la nube por usuario | Alta | Free / Premium |
| RF-08 | Modo offline con sync al reconectar | Alta | Free / Premium |
| RF-09 | Exportación en PDF | Alta | Premium |
| RF-10 | Exportación en CSV | Alta | Premium |
| RF-11 | Historial limitado a 3 meses | Alta | Free |
| RF-12 | Historial ilimitado | Alta | Premium |
| RF-13 | Panel de administración vía Supabase Studio | Alta | Admin |
| RF-14 | Integración RevenueCat para suscripciones | Alta | Sistema |
| RF-15 | Soporte multilenguaje ES/EN | Alta | Todos |
| RF-16 | Categorías personalizadas | Media | Free / Premium |

### 2.2 No Funcionales

| ID | Categoría | Descripción |
|----|-----------|-------------|
| RNF-01 | Performance | Carga de pantallas principales < 2 segundos |
| RNF-02 | Offline | Lectura y registro disponibles sin conexión |
| RNF-03 | Sincronización | Sync automático al recuperar conexión |
| RNF-04 | Seguridad | Cifrado en tránsito (TLS) y en reposo; RLS por usuario |
| RNF-05 | Disponibilidad | 99.5% uptime para servicios cloud |
| RNF-06 | Legal | Política de privacidad y términos de uso publicados |
| RNF-07 | Plataforma | Mobile-first iOS y Android, moneda única en v1 |
| RNF-08 | i18n | Arquitectura multilenguaje desde la base |

### Roles

| Rol | Permisos clave |
|-----|----------------|
| Free | Gastos, ingresos, resumen mensual, estadísticas, historial 3 meses |
| Premium | Todo lo de Free + historial ilimitado + exportación PDF/CSV |
| Admin | Gestión de usuarios y suscripciones vía Supabase Studio |

### Fuera de alcance (v1)
- Créditos y pagos pendientes
- Módulo de ahorros
- Módulo de inversiones
- Notificaciones push
- Multi-moneda
- Gastos compartidos o grupales
- Integración bancaria automática
- Web app o versión desktop

---

## 3. Especificaciones Técnicas

### Stack

| Capa | Tecnología |
|------|------------|
| Mobile | React Native + Expo (TypeScript) |
| DB local / Offline | WatermelonDB |
| Backend / BaaS | Supabase (PostgreSQL + Auth + Storage) |
| Autenticación | Supabase Auth + Google OAuth + Apple Sign-In |
| Suscripciones | RevenueCat SDK |
| i18n | i18next + react-i18next |
| CI/CD | Expo EAS Build + EAS Submit |
| Admin | Supabase Studio |

### Arquitectura
BaaS monolito serverless: la app móvil habla directo con Supabase. Sin servidor custom en v1. RevenueCat via SDK en cliente + webhook a Supabase para actualizar plan.

### Módulos

| Módulo | Complejidad |
|--------|-------------|
| Auth | Media |
| Categorías | Baja |
| Gastos | Media |
| Ingresos | Media |
| Dashboard | Media |
| Estadísticas | Alta |
| Sync offline | Alta |
| Suscripciones | Media |
| Exportación (Premium) | Media |
| i18n | Baja |

### Entidades principales
`User` → `Category` → `Transaction` → `TransactionItem`
`Subscription` (estado sincronizado desde RevenueCat)

---

## 4. Roadmap

| Fase | Descripción | Duración | Hito |
|------|-------------|----------|------|
| Fase 0 | Setup e infraestructura | 1 semana | Repo + Supabase + EAS operativos |
| Fase 1 | MVP — uso personal | 3-4 semanas | Auth + Gastos + Ingresos + Dashboard en producción |
| Fase 2 | Consolidación core | 3 semanas | Estadísticas + Sync robusto + Freemium activo |
| Fase 3 | Lanzamiento a stores | 2 semanas | App publicada en App Store y Google Play |
| Fase 4 | Post-lanzamiento | Continuo | Créditos, ahorros, inversiones, push |

**Total estimado hasta lanzamiento: ~10 semanas** (tiempo parcial + AI agents)

---

## 5. Plan de Acción

### Equipo
Jose Segovia — Lead Developer / Product Owner (dedicación parcial + AI agents)

### Sprints

| Sprint | Objetivo | Duración |
|--------|----------|----------|
| Sprint 0 | Setup: repo, Supabase, Expo, WatermelonDB, i18n, EAS | Semana 1 |
| Sprint 1 | Auth (Google + Apple) + categorías predefinidas + RLS + sync base | Semanas 2-3 |
| Sprint 2 | CRUD Gastos + CRUD Ingresos + Dashboard + Offline | Semanas 4-5 |
| Sprint 3 | Estadísticas + Sync robusto + Categorías personalizadas | Semanas 6-7 |
| Sprint 4 | RevenueCat + Freemium + i18n completo | Semanas 8-9 |
| Sprint 5 | Exportación Premium + Legal + Submit a stores | Semanas 10-11 |

### Próximos pasos inmediatos
1. **Hoy**: Crear repositorio en GitHub + `npx create-expo-app spendly --template blank-typescript`
2. **Mañana**: Crear 3 proyectos Supabase (dev / staging / prod) + variables de entorno
3. **Esta semana**: Completar Sprint 0 — WatermelonDB, schema base, i18next y EAS build operativos
