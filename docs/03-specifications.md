# Especificaciones Técnicas — Spendly
_Fase 3 completada: 2026-06-10_

## Nombre del proyecto
**Spendly**
_Nombre provisional usado hasta esta fase: control-de-gasto_

## Stack

| Capa | Tecnología | Justificación |
|---|---|---|
| Mobile | React Native + Expo (SDK 51+) | Cross-platform iOS/Android desde una base de código. Expo simplifica build y deploy a stores. Stack TS alineado con CCI. |
| Base de datos local | WatermelonDB | Offline-first diseñado para React Native. Sincronización con backend, alto rendimiento en mobile. |
| Backend / BaaS | Supabase | PostgreSQL + Auth + Realtime + Storage en uno. Reduce tiempo de desarrollo. Row-Level Security nativa. |
| Base de datos | PostgreSQL (vía Supabase) | Relacional, ideal para datos financieros. RLS para aislamiento de datos por usuario. |
| Autenticación | Supabase Auth + Google OAuth + Apple Sign-In | Integración nativa con providers requeridos. JWT incluido. |
| Suscripciones | RevenueCat SDK (React Native) | Gestión unificada de suscripciones iOS y Android. Webhooks a Supabase para sincronizar plan. |
| i18n | i18next + react-i18next | Estándar de industria para React Native. Soporte ES/EN desde v1. |
| CI/CD mobile | Expo EAS Build + EAS Submit | Build y publicación automatizada en App Store y Google Play. |
| Admin | Supabase Studio | Sin desarrollo adicional. Gestión de usuarios, datos y métricas directamente desde el dashboard de Supabase. |

## Arquitectura

Arquitectura **BaaS monolito serverless**: la app móvil se comunica directamente con Supabase. No hay servidor custom en v1. RevenueCat se integra via SDK en el cliente y via webhooks a Supabase para actualizar el plan del usuario.

```
┌─────────────────────────────────────────────┐
│               SPENDLY (React Native)         │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │  WatermelonDB  │  │ RevenueCat │  │  i18next  │ │
│  │ (local DB) │  │   SDK    │  │  ES / EN  │ │
│  └─────┬────┘  └─────┬────┘  └───────────┘ │
│        │ sync        │ purchases            │
└────────┼─────────────┼─────────────────────┘
         │             │ webhook
         ▼             ▼
┌─────────────────────────────────────────────┐
│                  SUPABASE                   │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ PostgreSQL│  │   Auth   │  │  Storage  │ │
│  │  + RLS   │  │ Google/  │  │ (exports) │ │
│  │          │  │  Apple   │  │           │ │
│  └──────────┘  └──────────┘  └───────────┘ │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Supabase Studio │  ← Admin (sin desarrollo extra)
└─────────────────┘
```

## Módulos del sistema

| Módulo | Descripción | Complejidad |
|--------|-------------|-------------|
| Auth | Login con Google y Apple, gestión de sesión, onboarding inicial | Media |
| Categorías | CRUD de categorías (predefinidas + personalizadas), iconos y colores | Baja |
| Gastos | CRUD de transacciones de gasto con categoría asignada y detalle de artículos | Media |
| Ingresos | CRUD de ingresos fijos y variables | Media |
| Dashboard | Resumen mensual: balance ingreso vs gasto, totales por categoría | Media |
| Estadísticas | Gráficas de distribución por categoría, evolución mensual, comparativas | Alta |
| Sync offline | WatermelonDB como DB local, sync bidireccional con Supabase al reconectar | Alta |
| Suscripciones | Integración RevenueCat, gate de features premium, manejo de estado del plan | Media |
| Exportación | Generación de PDF y CSV del resumen de datos — solo usuarios Premium | Media |
| i18n | Soporte ES/EN con detección de idioma del dispositivo y cambio manual | Baja |

## Entidades principales

```
User
├── id (UUID, Supabase Auth)
├── plan: free | premium
├── currency: string (una moneda, v1)
├── language: es | en
└── created_at

Category
├── id
├── user_id → User
├── name
├── icon
├── color
├── type: expense | income
└── is_default: boolean

Transaction
├── id
├── user_id → User
├── category_id → Category
├── type: expense | income
├── amount: decimal
├── date
├── notes
└── created_at

TransactionItem
├── id
├── transaction_id → Transaction
├── name
├── amount: decimal
└── quantity

Subscription (estado sincronizado desde RevenueCat via webhook)
├── user_id → User
├── plan: free | premium
├── status: active | expired | cancelled
├── expires_at
└── provider: apple | google
```

## Infraestructura

- **Ambientes**: desarrollo local (Supabase local via CLI) → staging (proyecto Supabase separado) → producción (proyecto Supabase separado)
- **Proveedor**: Supabase Cloud (managed) + Expo EAS (builds móviles)
- **CI/CD**: Expo EAS Build y EAS Submit desde v1 para automatizar builds y envíos a stores
- **Backups**: Supabase Pro incluye backups diarios automáticos
- **Admin**: Supabase Studio (sin desarrollo adicional en v1)

## Decisiones técnicas clave

| Decisión | Alternativas consideradas | Razón de la elección |
|----------|--------------------------|----------------------|
| Supabase como BaaS | NestJS + PostgreSQL custom, Firebase | Reduce tiempo de desarrollo, RLS nativa para seguridad por usuario, sin servidor a mantener |
| WatermelonDB para offline | MMKV + sync manual, AsyncStorage | Diseñado específicamente para offline-first en React Native, sync robusto con backends |
| Supabase Studio como admin | Next.js admin custom, Retool | Cero tiempo de desarrollo, suficiente para v1, siempre actualizado con los datos reales |
| RevenueCat | In-app purchases directo | Abstrae la complejidad de StoreKit (iOS) y Google Billing, panel unificado de suscripciones |
| React Native + Expo | Flutter, nativo iOS/Android | Stack TS alineado con CCI, Expo simplifica builds y OTA updates |

## Deuda técnica aceptada (consciente)

- **Admin en Supabase Studio**: no hay panel admin custom. Aceptado en v1 por velocidad; se construirá si la base de usuarios crece y se requieren métricas propias.
- **Una moneda fija**: sin conversión de divisas. Aceptado en v1; requiere campo `currency` en User desde el inicio para facilitar la futura implementación.
- **Exportación sin plantilla de marca**: PDF/CSV generados con formato básico en v1. Diseño de marca puede incorporarse en v2.
