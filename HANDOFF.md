# Quiniela Mundial 2026 — Handoff Document

## Qué es la app
Quiniela de fútbol para el Mundial 2026. 4 participantes (familia Solano).
Los usuarios pronostican marcadores de cada partido y ganan puntos según aciertos.

## Stack
- **Frontend/Backend**: Next.js 16 (App Router) — TypeScript
- **Base de datos**: Supabase (PostgreSQL) — NO se migra, queda igual
- **Hosting actual**: Vercel (Pro Trial, expira en ~14 días, HAY QUE MIGRAR)
- **Repo GitHub**: https://github.com/IgnacioSol/quiniela-mundial

## Variables de entorno necesarias
```
NEXT_PUBLIC_SUPABASE_URL=https://pqmbzzpfecbudctrodfu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(ver en Supabase → Settings → API)
SUPABASE_SERVICE_ROLE_KEY=(ver en Supabase → Settings → API)
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
9. **Sync automático** — `/api/sync-results` jala resultados de football-data.org (API key incluida arriba)
10. **Borrar pronóstico** — botón trash en cada partido no bloqueado

## Sistema de puntos
- Marcador exacto: +3 pts
- Ganador/Empate correcto: +1 pt
- Sin pronosticar: -1 pt
- Campeón: +10 pts (configurable en admin)
- Subcampeón, Golden Boot, etc.: configurables en admin

## Cron job (IMPORTANTE)
El archivo `vercel.json` tiene configurado un cron que llama `/api/sync-results` cada 10 minutos.
**Netlify no soporta cron jobs nativos.** Solución: usar cron-job.org (gratis).

---

## INSTRUCCIONES PARA MIGRAR A NETLIFY

### Paso 1 — Importar repo en Netlify
1. En app.netlify.com → "Add new project" → "Import an existing project" → GitHub
2. Seleccionar repo: `IgnacioSol/quiniela-mundial`
3. Build settings (Netlify los detecta automático para Next.js):
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Hacer deploy

### Paso 2 — Agregar variables de entorno en Netlify
En Netlify → tu proyecto → Site configuration → Environment variables → agregar TODAS las de arriba.

### Paso 3 — Configurar cron externo en cron-job.org
1. Registrarse gratis en https://cron-job.org
2. Crear nuevo cron job:
   - URL: `https://TU-DOMINIO.netlify.app/api/sync-results`
   - Headers: `Authorization: Bearer mundialcron2026xsecret`
   - Schedule: cada 10 minutos
3. Activar

### Paso 4 — Eliminar vercel.json (opcional)
El archivo `vercel.json` en la raíz es solo para Vercel, no afecta Netlify pero puedes borrarlo.

### Paso 5 — Actualizar URL en Supabase
En Supabase → Authentication → URL Configuration:
- Site URL: `https://TU-DOMINIO.netlify.app`
- Redirect URLs: agregar `https://TU-DOMINIO.netlify.app/**`

### Paso 6 — Verificar que funciona
- Entrar a la app
- Login/registro
- Ver dashboard
- Ir a /admin → "Sincronizar ahora" → debe devolver JSON con `ok: true`

---

## Problemas conocidos / pendientes
- El cron job en Vercel correría cada 10 min automático, en Netlify necesita cron-job.org externo
- Si alguien nunca guardó pronósticos especiales, su row no existe en special_predictions (normal)
- Los nombres de equipos en el TEAM_MAP del sync deben coincidir exactamente con lo que manda football-data.org — si hay equipos que no matchean aparecen en el campo `errors` del response

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
