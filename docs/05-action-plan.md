# Plan de Acción — Spendly
_Fase 5 completada: 2026-06-10_

## Equipo

| Rol | Nombre | Dedicación |
|-----|--------|------------|
| Lead Developer / Product Owner | Jose Segovia | Parcial (+ AI agents) |

## Definición de Done

- [ ] Feature funciona en dispositivo real (iOS o Android)
- [ ] Probado en staging antes de merge a main
- [ ] Sin errores en consola relacionados a la tarea
- [ ] i18n cubierto: texto disponible en ES y EN
- [ ] EAS build exitoso en preview antes de producción

---

## Sprint 0 — Setup y Fundación
**Duración:** 1 semana (Semana 1)
**Objetivo:** Proyecto configurado, ambientes levantados, listo para desarrollar features.

| # | Tarea | Prioridad | Criterio de completitud |
|---|-------|-----------|-------------------------|
| S0-01 | Crear repo GitHub + estructura de carpetas del proyecto Expo | Crítico | Repo en GitHub, rama main con protección básica |
| S0-02 | Inicializar proyecto Expo con TypeScript + EAS configurado | Crítico | `npx expo start` corre sin errores, EAS build modo development exitoso |
| S0-03 | Crear proyectos Supabase: dev + staging + prod | Crítico | 3 proyectos Supabase activos con variables de entorno configuradas por ambiente |
| S0-04 | Configurar WatermelonDB en el proyecto | Crítico | WatermelonDB instalado y schema base definido (tablas vacías) |
| S0-05 | Schema inicial en Supabase: tablas User, Category, Transaction, TransactionItem, Subscription | Crítico | Migraciones aplicadas en DB dev, RLS habilitado por tabla |
| S0-06 | Setup i18next con archivos base ES/EN | Alto | Traducción de 5 strings de prueba funcionando en ES y EN |
| S0-07 | Crear cuentas de developer: App Store Connect + Google Play Console | Alto | Cuentas activas (necesarias para RevenueCat en Sprint 3+) |
| S0-08 | README inicial del proyecto | Normal | Nuevo dev puede entender el proyecto y levantarlo con las instrucciones |

**Hito:** `expo start` corre, Supabase conectado, WatermelonDB con schema base, i18n operativo.

---

## Sprint 1 — Auth y estructura base
**Duración:** 2 semanas (Semana 2-3)
**Objetivo:** Usuario puede registrarse, iniciar sesión y tiene su cuenta aislada en Supabase.

| # | Épica | Tarea | Estimación | Prioridad |
|---|-------|-------|------------|-----------|
| 1-01 | Auth | Configurar Google Sign-In con Supabase Auth | 2 días | Crítico |
| 1-02 | Auth | Configurar Apple Sign-In con Supabase Auth | 2 días | Crítico |
| 1-03 | Auth | Pantallas de login y onboarding (selección moneda e idioma) | 2 días | Crítico |
| 1-04 | Auth | Gestión de sesión: persistencia, logout, refresh token | 1 día | Crítico |
| 1-05 | Categorías | Seed de categorías predefinidas por usuario al registrarse (gasto e ingreso) | 1 día | Alto |
| 1-06 | Categorías | Pantalla de listado de categorías | 1 día | Alto |
| 1-07 | Infraestructura | Row-Level Security validado en todas las tablas | 1 día | Crítico |
| 1-08 | Infraestructura | Sync base WatermelonDB ↔ Supabase para tabla User y Category | 2 días | Alto |

**Hito:** Usuario puede registrarse con Google o Apple, ver sus categorías predefinidas y los datos quedan aislados por usuario en Supabase.

---

## Sprint 2 — Gastos, Ingresos y Dashboard
**Duración:** 2 semanas (Semana 4-5)
**Objetivo:** MVP funcional — registrar gastos, ingresos y ver el balance mensual.

| # | Épica | Tarea | Estimación | Prioridad |
|---|-------|-------|------------|-----------|
| 2-01 | Gastos | CRUD de transacciones de gasto con categoría asignada | 3 días | Crítico |
| 2-02 | Gastos | Detalle de artículos dentro de una transacción (TransactionItem) | 2 días | Crítico |
| 2-03 | Ingresos | CRUD de ingresos fijos y variables | 2 días | Crítico |
| 2-04 | Dashboard | Pantalla de resumen mensual: total gastos, total ingresos, balance | 2 días | Crítico |
| 2-05 | Dashboard | Navegación por mes (mes anterior / siguiente) | 1 día | Alto |
| 2-06 | Sync | WatermelonDB sync para Transaction y TransactionItem | 2 días | Crítico |
| 2-07 | Offline | Modo offline: registro funciona sin conexión, sync al reconectar | 2 días | Alto |

**Hito:** Usuario puede registrar gastos con detalle de artículos, registrar ingresos y ver su balance mensual. Funciona offline y sincroniza al reconectar.

---

## Sprint 3 — Estadísticas y Sync robusto
**Duración:** 2 semanas (Semana 6-7)
**Objetivo:** Estadísticas visuales y sync offline completo con manejo de conflictos.

| # | Épica | Tarea | Estimación | Prioridad |
|---|-------|-------|------------|-----------|
| 3-01 | Estadísticas | Gráfica de distribución de gastos por categoría (pie/donut chart) | 2 días | Alto |
| 3-02 | Estadísticas | Gráfica de evolución mensual de gastos e ingresos (bar chart) | 2 días | Alto |
| 3-03 | Estadísticas | Pantalla de estadísticas con filtro por período | 2 días | Alto |
| 3-04 | Categorías | CRUD de categorías personalizadas (crear, editar, eliminar) | 2 días | Medio |
| 3-05 | Sync | Resolución de conflictos en WatermelonDB (last-write-wins) | 2 días | Alto |
| 3-06 | Sync | Cola de operaciones offline pendientes + retry automático | 2 días | Alto |

**Hito:** Estadísticas funcionando con datos reales, sync offline robusto con resolución de conflictos.

---

## Sprint 4 — Freemium e i18n completo
**Duración:** 2 semanas (Semana 8-9)
**Objetivo:** Modelo freemium activo, app completamente traducida en ES y EN.

| # | Épica | Tarea | Estimación | Prioridad |
|---|-------|-------|------------|-----------|
| 4-01 | Suscripciones | Integrar RevenueCat SDK en React Native | 2 días | Crítico |
| 4-02 | Suscripciones | Configurar productos in-app en App Store Connect y Google Play | 1 día | Crítico |
| 4-03 | Suscripciones | Webhook RevenueCat → Supabase para actualizar plan del usuario | 1 día | Crítico |
| 4-04 | Suscripciones | Gate de features Premium (historial ilimitado, exportación) | 1 día | Crítico |
| 4-05 | Suscripciones | Pantalla de upgrade a Premium | 1 día | Alto |
| 4-06 | Suscripciones | Límite de historial a 3 meses para usuarios Free | 1 día | Alto |
| 4-07 | i18n | Traducción completa de todas las pantallas al inglés | 2 días | Alto |
| 4-08 | i18n | Cambio de idioma desde configuración de la app | 1 día | Medio |

**Hito:** Modelo freemium activo con RevenueCat, historial limitado para Free, app 100% traducida en ES/EN.

---

## Sprint 5 — Exportación y lanzamiento a stores
**Duración:** 2 semanas (Semana 10-11)
**Objetivo:** Exportación Premium implementada, app publicada en ambas stores.

| # | Épica | Tarea | Estimación | Prioridad |
|---|-------|-------|------------|-----------|
| 5-01 | Exportación | Generación de PDF del resumen mensual (solo Premium) | 2 días | Alto |
| 5-02 | Exportación | Exportación CSV de transacciones (solo Premium) | 1 día | Alto |
| 5-03 | Legal | Redactar política de privacidad y publicar en URL pública | 1 día | Crítico |
| 5-04 | Legal | Redactar términos de uso y publicar en URL pública | 1 día | Crítico |
| 5-05 | Stores | Preparar assets: íconos, screenshots, descripciones ES/EN | 2 días | Crítico |
| 5-06 | Stores | EAS Submit a App Store (Apple Review) | 1 día | Crítico |
| 5-07 | Stores | EAS Submit a Google Play | 1 día | Crítico |
| 5-08 | QA | Smoke testing en producción post-lanzamiento | 1 día | Crítico |

**Hito:** Spendly disponible públicamente en App Store y Google Play.

---

## Backlog — Post-lanzamiento (Fase 4)

| ID | Descripción | Épica | Prioridad |
|----|-------------|-------|-----------|
| B-01 | Módulo de créditos y pagos pendientes | Créditos | Alta |
| B-02 | Módulo de ahorros | Ahorros | Alta |
| B-03 | Módulo de inversiones y rendimientos | Inversiones | Media |
| B-04 | Notificaciones push (alertas de gastos, recordatorios) | Push | Alta |
| B-05 | Soporte multi-moneda | Configuración | Media |
| B-06 | Admin panel custom (si la base de usuarios lo requiere) | Admin | Baja |
| B-07 | Web app | Plataforma | Baja |

---

## Prerrequisitos — Antes de iniciar Sprint 0

Estas cuentas y herramientas deben estar activas antes de ejecutar cualquier tarea del Sprint 0.

### Cuentas requeridas
| Cuenta | URL | Costo | Para qué |
|--------|-----|-------|----------|
| GitHub | github.com | Gratis | Repositorio del proyecto |
| Supabase | supabase.com | Gratis | Backend, DB, Auth |
| Expo / EAS | expo.dev | Gratis | Build y deploy de la app |
| RevenueCat | revenuecat.com | Gratis | Gestión de suscripciones |
| Apple Developer Program | developer.apple.com | $99/año | Apple Sign-In + App Store |
| Google Play Console | play.google.com/console | $25 único | Google Play + Android billing |

### Entorno local requerido
| Herramienta | Comando de verificación |
|-------------|------------------------|
| Node.js 18+ | `node -v` |
| npm / yarn | `npm -v` |
| Expo CLI | `npx expo --version` |
| Supabase CLI | `supabase --version` |
| Xcode (iOS) | Instalar desde App Store (Mac) |
| Android Studio | Instalar desde developer.android.com |
| Git | `git --version` |

> Una vez que todas las cuentas están creadas y el entorno local está operativo, se puede iniciar el Sprint 0.

---

## Próximos pasos inmediatos

1. **Crear cuentas**: GitHub, Supabase, Expo/EAS y RevenueCat (todas gratuitas — hacerlo hoy)
2. **Cuentas de stores**: Apple Developer Program ($99/año) y Google Play Console ($25 único) — necesarias desde Sprint 4, pero conviene crearlas pronto por tiempos de aprobación
3. **Verificar entorno local**: Node.js 18+, Xcode y Android Studio instalados y funcionando
4. **Con todo lo anterior listo**: iniciar Sprint 0
