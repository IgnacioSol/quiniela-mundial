# Quiniela Mundial 2026 — Handoff Document

## Qué es la app
Quiniela de fútbol para el Mundial 2026. 4 participantes (familia Solano).
Los usuarios pronostican marcadores de cada partido y ganan puntos según aciertos.

## Stack
- **Frontend/Backend**: Next.js 16 (App Router) — TypeScript
- **Base de datos**: Supabase (PostgreSQL)
- **Hosting**: Vercel — `quiniela-mundial-blond.vercel.app`
- **Repo GitHub**: https://github.com/IgnacioSol/quiniela-mundial

## Variables de entorno (ya configuradas en Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://pqmbzzpfecbudctrodfu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_J2m6hS0767nT0j4-L93Zxg_dVQ6lGNb
FOOTBALL_DATA_API_KEY=7473336cc78d4a4f8ef24a5f792954db
CRON_SECRET=mundialcron2026xsecret
```

## Funcionalidades implementadas
1. **Auth** — registro/login con Supabase Auth
2. **Pronósticos por partido** — grupos y fases eliminatorias, con deadline automático
3. **Pronósticos especiales** — Campeón, Subcampeón, Golden Boot, Golden Ball, Golden Glove, Best Young Player
4. **Tabla de posiciones** — leaderboard con puntos de partidos + especiales + bonus
5. **Ver pronósticos de otros** — `/players/[userId]` con head-to-head vs tú
6. **Resultados** — vista por grupo con breakdown de quién acertó cada partido
7. **Evolución** — gráfica de puntos en el tiempo
8. **Admin panel** — ingresar resultados, configurar puntuación, ajuste manual de puntos
9. **Sync automático** — `/api/sync-results` jala resultados de football-data.org cada 10 min (cron en vercel.json)
10. **Borrar pronóstico** — botón trash en cada partido no bloqueado

## Sistema de puntos
- Marcador exacto: +3 pts
- Ganador/Empate correcto: +1 pt
- Sin pronosticar: -1 pt
- Campeón: +10 pts (configurable en admin)
- Subcampeón, Golden Boot, etc.: configurables en admin

## Problemas conocidos
- Si alguien nunca guardó pronósticos especiales, su row no existe en special_predictions (normal)
- Los nombres de equipos en el TEAM_MAP del sync deben coincidir con lo que manda football-data.org — si hay equipos que no matchean aparecen en el campo `errors` del response

## Archivos clave
- `src/app/(app)/dashboard/page.tsx` — tabla de posiciones + stats
- `src/app/(app)/predictions/predictions-client.tsx` — formulario de pronósticos
- `src/app/(app)/players/[userId]/page.tsx` — ver pronósticos ajenos + H2H
- `src/app/(app)/results/page.tsx` — resultados + quién acertó
- `src/app/(app)/admin/specials/specials-client.tsx` — admin de premios FIFA
- `src/app/api/sync-results/route.ts` — sync automático con football-data.org
- `src/lib/scoring.ts` — lógica de puntos y mapeo de equipos
- `supabase-schema.sql` — schema completo de la DB
- `migrate-awards.sql` — migración para columnas de premios FIFA (ya corrida)
