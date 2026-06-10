# Discovery — control-de-gasto
_Fase 1 completada: 2026-06-10_

## Idea central
App móvil de control financiero personal que permite registrar gastos categorizados (con detalle por artículo), ingresos fijos y variables, créditos, pagos pendientes, ahorros e inversiones. Incluye resumen mensual, balance ingreso vs gasto y estadísticas. Modelo freemium: funcionalidad básica gratuita, features avanzadas por suscripción.

## Tipo
Producto propio CCI — uso personal inicial, con proyección de publicación pública como producto de CCI.
Cliente/stakeholder: Jose Segovia (fundador CCI)

## Problema que resuelve
No existe un registro activo de finanzas personales. La alternativa más común (Excel) es torpe para uso móvil y cotidiano. El usuario no tiene visibilidad clara de si sus ingresos cubren sus gastos mensuales.

## Situación actual
No se lleva ningún control financiero en este momento. Sin herramienta previa ni proceso manual establecido.

## Usuario objetivo
- Perfil: Público general adulto en edad laboral, no técnico
- Contexto: Personas que necesitan saber a dónde va su dinero y si sus ingresos alcanzan
- Idioma: Multilenguaje (ES / EN) desde v1
- Plataforma: Mobile-first (iOS y Android)
- Volumen estimado inicial: Personal (1 usuario), con proyección a usuarios públicos
- Restricciones especiales: Ninguna identificada

## Contexto existente
- Sin código ni prototipo construido
- Sin wireframes ni diseño previo
- Sin integraciones requeridas en v1 (notificaciones push: en scope para versión inicial)
- Sin decisiones técnicas cerradas — stack completamente abierto

## Visión de éxito
- **MVP mínimo viable**: Registro de gastos por categoría + registro de ingresos + resumen mensual con balance (¿mis ingresos cubren mis gastos?)
- **Visión a futuro**: App pública en stores (App Store / Google Play), modelo freemium activo, features avanzadas: inversiones, créditos, estadísticas históricas, alertas financieras

## Restricciones conocidas
- Urgencia personal: sin fecha de lanzamiento fija, pero hay motivación de uso inmediato
- Debe funcionar offline o con conectividad limitada (a confirmar en requerimientos)
- Notificaciones push: en scope desde diseño inicial

## Supuestos adoptados
- La app es mobile-only en v1; web puede considerarse en versiones futuras
- El modelo freemium implica autenticación de usuarios (cuentas) desde v1
- Los datos financieros son privados por usuario — no compartidos
- Multilenguaje implica i18n desde la arquitectura base, no como add-on posterior
