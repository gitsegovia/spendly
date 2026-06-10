# Requerimientos — control-de-gasto
_Fase 2 completada: 2026-06-10_

## Requerimientos Funcionales

| ID    | Descripción | Prioridad | Rol |
|-------|-------------|-----------|-----|
| RF-01 | Registro de gastos por categoría (comida, servicios, escolaridad, etc.) | Alta | Free / Premium |
| RF-02 | Detalle de artículos/elementos dentro de cada categoría de gasto | Alta | Free / Premium |
| RF-03 | Registro de ingresos fijos y variables | Alta | Free / Premium |
| RF-04 | Resumen mensual con balance ingreso vs gasto | Alta | Free / Premium |
| RF-05 | Estadísticas de gastos e ingresos (gráficas, distribución por categoría) | Alta | Free / Premium |
| RF-06 | Autenticación con Google Sign-In y Apple Sign-In | Alta | Todos |
| RF-07 | Sincronización de datos en la nube por usuario | Alta | Free / Premium |
| RF-08 | Modo offline: acceso de lectura y registro sin conexión, sync al reconectar | Alta | Free / Premium |
| RF-09 | Exportación de datos en PDF | Alta | Premium |
| RF-10 | Exportación de datos en CSV | Alta | Premium |
| RF-11 | Historial de datos limitado a 3 meses | Alta | Free |
| RF-12 | Historial de datos ilimitado | Alta | Premium |
| RF-13 | Panel de administración: gestión de usuarios y suscripciones | Alta | Admin |
| RF-14 | Integración con RevenueCat para gestión de suscripciones premium | Alta | Sistema |
| RF-15 | Soporte multilenguaje: Español e Inglés desde v1 | Alta | Todos |
| RF-16 | Gestión de categorías: crear, editar y eliminar categorías personalizadas | Media | Free / Premium |

## Requerimientos No Funcionales

| ID     | Categoría      | Descripción |
|--------|----------------|-------------|
| RNF-01 | Performance    | Tiempo de carga de pantallas principales menor a 2 segundos en condiciones normales de red |
| RNF-02 | Offline        | Funcionalidad de lectura y registro disponible sin conexión a internet |
| RNF-03 | Sincronización | Los datos registrados offline se sincronizan automáticamente al recuperar conexión |
| RNF-04 | Seguridad      | Datos financieros privados por usuario; cifrado en tránsito (HTTPS/TLS) y en reposo |
| RNF-05 | Disponibilidad | 99.5% uptime para servicios de sincronización en la nube |
| RNF-06 | Legal          | Política de privacidad y términos de uso publicados (obligatorio App Store y Google Play) |
| RNF-07 | Plataforma     | Mobile-first: iOS y Android. Una sola moneda por usuario en v1 |
| RNF-08 | i18n           | Arquitectura multilenguaje desde la base (no como add-on posterior) |

## Roles del sistema

| Rol | Descripción | Permisos clave |
|-----|-------------|----------------|
| Free | Usuario registrado con plan gratuito | Registro de gastos e ingresos, resumen mensual, estadísticas, historial últimos 3 meses |
| Premium | Usuario con suscripción activa | Todo lo de Free + historial ilimitado + exportación PDF y CSV |
| Admin | Operador interno de CCI | Gestión de usuarios, visualización de métricas de plataforma, administración de suscripciones |

## Integraciones requeridas

- **Google Sign-In**: autenticación de usuarios
- **Apple Sign-In**: autenticación de usuarios (obligatorio para publicar en App Store)
- **RevenueCat**: gestión de suscripciones premium y compras in-app (iOS y Android)
- **Cloud backend** (a definir en Fase 3): sincronización y persistencia de datos por usuario

## Fuera de alcance (v1)

- Registro y seguimiento de créditos y pagos pendientes
- Módulo de ahorros
- Módulo de inversiones y rendimientos
- Notificaciones push
- Soporte de múltiples monedas
- Gastos compartidos o grupales
- Integración bancaria automática (scraping o Open Banking)
- Web app o versión desktop

## Supuestos adoptados

- El historial de 3 meses para usuarios Free es el límite inicial; puede ajustarse en base a feedback
- La moneda se configura una vez al crear la cuenta (sin cambio posterior en v1)
- El panel Admin es una interfaz separada, no parte de la app móvil
- La política de privacidad y términos de uso serán documentos estáticos (no funcionalidad de la app)
- RevenueCat maneja el estado de suscripción — la app consulta RevenueCat para determinar el plan activo
