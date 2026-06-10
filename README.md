# Spendly

App móvil de control financiero personal. iOS y Android.

**Core Code Innovation** — Producto propio

---

## Stack

- React Native + Expo (TypeScript)
- Supabase (backend, auth, DB)
- WatermelonDB (offline-first)
- RevenueCat (suscripciones)
- i18next (ES / EN)

## Estructura

```
control-de-gasto/
├── docs/          # Documentación del proyecto (discovery, reqs, specs, roadmap, plan)
├── mobile/        # App React Native + Expo
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/         # supabase, watermelondb, i18n, revenuecat
│   │   ├── models/
│   │   ├── store/
│   │   ├── types/
│   │   ├── constants/
│   │   └── utils/
│   └── locales/   # Traducciones ES / EN
└── README.md
```

## Setup local

```bash
cd mobile
cp .env.example .env.local
# Completar variables en .env.local con las credenciales de Supabase

npm install
npx expo start
```

## Ambientes

| Ambiente | Supabase Project | EAS Profile |
|----------|-----------------|-------------|
| Development | spendly-dev | development |
| Staging | spendly-staging | preview |
| Production | spendly-prod | production |
