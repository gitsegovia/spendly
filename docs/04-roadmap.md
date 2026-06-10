# Roadmap — Spendly
_Fase 4 completada: 2026-06-10_

## Resumen de fases

| Fase | Descripción | Duración estimada | Hito de cierre |
|------|-------------|-------------------|----------------|
| Fase 0 | Setup e infraestructura | 1 semana | Repo, Supabase y Expo configurados con ambientes dev/staging/prod operativos |
| Fase 1 | MVP — uso personal | 3-4 semanas | Usuario puede registrarse, registrar gastos e ingresos, y ver su balance mensual en producción |
| Fase 2 | Consolidación core | 3 semanas | Estadísticas funcionando, sync offline completo, modelo freemium activo con RevenueCat |
| Fase 3 | Lanzamiento a stores | 2 semanas | App publicada en App Store y Google Play con política de privacidad y términos de uso |
| Fase 4 | Post-lanzamiento | Continuo | Módulos de créditos, ahorros, inversiones y notificaciones push |

**Total estimado hasta lanzamiento público: ~10 semanas** (tiempo parcial + AI agents)

---

## Desglose por fase

### Fase 0 — Setup (1 semana)
- [ ] Crear repositorio GitHub (monorepo o repo único)
- [ ] Inicializar proyecto Expo con TypeScript
- [ ] Configurar Supabase: proyecto dev + staging + prod
- [ ] Configurar EAS Build (desarrollo, preview, producción)
- [ ] Configurar WatermelonDB en el proyecto
- [ ] Setup i18next con archivos ES/EN base
- [ ] Configurar estructura de carpetas del proyecto
- [ ] Variables de entorno por ambiente (.env.local, .env.staging, .env.production)

**Hito:** `expo start` corre sin errores, Supabase conectado, EAS build exitoso en modo development.

---

### Fase 1 — MVP: uso personal (3-4 semanas)
- [ ] Módulo Auth: Google Sign-In + Apple Sign-In
- [ ] Onboarding: selección de moneda e idioma
- [ ] Módulo Categorías: categorías predefinidas (gasto e ingreso)
- [ ] Módulo Gastos: CRUD de transacciones con detalle de artículos
- [ ] Módulo Ingresos: CRUD de ingresos fijos y variables
- [ ] Dashboard: resumen mensual con balance ingreso vs gasto
- [ ] WatermelonDB: persistencia local básica + sync con Supabase
- [ ] Row-Level Security en Supabase para aislamiento de datos por usuario
- [ ] Deploy a producción (EAS Submit)

**Hito:** Usuario puede registrarse con Google o Apple, crear categorías, registrar gastos e ingresos, y ver su balance mensual — funciona offline y sincroniza al reconectar.

---

### Fase 2 — Consolidación core (3 semanas)
- [ ] Módulo Estadísticas: gráficas de distribución por categoría y evolución mensual
- [ ] Sync offline completo: resolución de conflictos, cola de operaciones pendientes
- [ ] Categorías personalizadas: crear, editar, eliminar
- [ ] Integración RevenueCat: suscripción premium, gate de features
- [ ] Límite de historial para usuarios Free (3 meses)
- [ ] i18n completo: todas las pantallas en ES y EN
- [ ] Testing en dispositivos reales (iOS y Android)

**Hito:** App con todas las features core funcionando, modelo freemium activo, historial limitado para Free y sin límite para Premium.

---

### Fase 3 — Lanzamiento a stores (2 semanas)
- [ ] Módulo Exportación: generación PDF y CSV (solo Premium)
- [ ] Política de privacidad y términos de uso (documentos estáticos)
- [ ] Assets de stores: íconos, screenshots, descripciones en ES/EN
- [ ] Submit a App Store (Apple Review)
- [ ] Submit a Google Play
- [ ] Smoke testing en producción post-lanzamiento

**Hito:** Spendly disponible públicamente en App Store y Google Play.

---

### Fase 4 — Post-lanzamiento (continuo)
- [ ] Módulo Créditos y pagos pendientes
- [ ] Módulo Ahorros
- [ ] Módulo Inversiones y rendimientos
- [ ] Notificaciones push (alertas de gastos, recordatorios)
- [ ] Soporte multi-moneda
- [ ] Admin panel custom (si la base de usuarios lo requiere)
- [ ] Web app (versión futura)

---

## Dependencias críticas

- **Auth** debe completarse antes de cualquier módulo de datos (Gastos, Ingresos, Dashboard)
- **WatermelonDB + schema** debe definirse antes de implementar los módulos de datos
- **Row-Level Security en Supabase** debe estar antes del deploy a producción
- **RevenueCat** requiere cuentas de developer activas en App Store Connect y Google Play Console antes de integrarlo
- **Submit a stores** requiere política de privacidad publicada en URL pública

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Apple Review rechaza la app (falta de política de privacidad o permisos mal declarados) | Media | Alto | Preparar política de privacidad desde Fase 2; revisar guidelines de Apple antes del submit |
| WatermelonDB sync genera conflictos de datos difíciles de resolver | Media | Medio | Definir estrategia de resolución de conflictos (last-write-wins) desde el diseño del schema |
| RevenueCat requiere cuentas de developer activas con tiempo de aprobación | Baja | Medio | Crear cuentas de App Store Connect y Google Play Console al inicio de Fase 2 |
| Tiempo parcial genera interrupciones frecuentes que alargan las fases | Alta | Medio | AI agents para acelerar implementación; fases cortas con hitos claros para mantener momentum |

## Timeline

```
Semana 1:      Fase 0 — Setup e infraestructura
Semana 2-5:    Fase 1 — MVP (uso personal urgente)
Semana 6-8:    Fase 2 — Consolidación core + freemium
Semana 9-10:   Fase 3 — Lanzamiento a stores
Semana 11+:    Fase 4 — Post-lanzamiento (continuo)
```
