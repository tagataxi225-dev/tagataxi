# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kwenda is a multi-role mobile super-app for the DRC (Congo) — taxi, delivery, marketplace, and food — built with React + Vite + TypeScript + Capacitor + Supabase. It runs as a PWA and as a native Android/iOS app via Capacitor. App ID: `cd.kwenda.app`, version managed in `package.json`.

## Commands

```bash
npm run dev          # Dev server on port 8080
npm run build        # Production build (drops console.log)
npm run build:dev    # Dev build (keeps logs)
npm run lint         # ESLint
npx cap sync         # Sync web build → native Android/iOS projects
npx cap open android # Open Android Studio
npx cap open ios     # Open Xcode
```

There is no `test` script. Vitest is installed but not wired to a command — run tests with `npx vitest`.

## Architecture

### Multi-role routing

The app serves five roles from a single codebase. Routes are split by role in `src/routes/`:
- `ClientRoutes.tsx` → `/app/client/*`
- `DriverRoutes.tsx` → `/app/chauffeur/*`
- `PartnerRoutes.tsx` → `/app/partenaire/*`
- `AdminRoutes.tsx` → `/operatorx/admin/*`
- `PublicRoutes.tsx` — unauthenticated pages

Role configuration (colors, default routes) lives in `src/config/appConfig.ts`. After auth, `SmartHome` redirects users to their role's default route based on their Supabase profile.

### Multi-build for stores

`.env.client`, `.env.driver`, `.env.partner` each set `VITE_APP_TYPE`, which changes the PWA manifest loaded and enables per-role store builds. The `capacitor.config.ts` uses a single `appId: 'cd.kwenda.app'` for all roles.

### State & data fetching

- **Auth**: `AuthProvider` / `useAuth` (wraps Supabase `onAuthStateChange`). Always check `sessionReady` before acting on `user`.
- **Server state**: React Query via `@tanstack/react-query`. Global client in `src/lib/queryClient.ts` (staleTime 2 min, retry 2, no refetch on focus).
- **Supabase client**: `src/integrations/supabase/client.ts`. DB types auto-generated at `src/integrations/supabase/types.ts`.

### Geographic coverage

Covered cities with drivers: **Kinshasa, Lubumbashi, Kolwezi**. Logic lives in `src/config/coveredCities.ts` — use `isCityCovered()` and `getCityOrDefault()` whenever city-dependent features are needed. If outside these cities, the app remains functional but shows a soft banner ("Kwenda arrive bientôt dans votre ville!"). If outside RDC entirely (dev mode), fall back silently to Kinshasa.

### Taxi service (`src/components/transport/`)

Key files and their responsibilities:
- `ModernTaxiInterface.tsx` — main orchestrator: GPS, map, vehicle selection, booking flow
- `map/OptimizedMapView.tsx` — Google Maps with 8s deadline before degraded mode; `gestureHandling: 'cooperative'` (never `'greedy'`)
- `UnifiedTaxiSheet.tsx` — bottom sheet UI; always `z-[200]` minimum, `<button type="button">` with `onTouchEnd`
- `src/hooks/useVehicleTypes.ts` — fetches vehicle types + pricing from Supabase; `staleTime: 60s`
- `src/hooks/useRideDispatch.ts` — creates bookings and dispatches to drivers; handles `no_coverage` vs `no_drivers`
- `src/hooks/useGoogleMaps.ts` — loads Maps SDK with 8s timeout; uses `isLoadedRef` to avoid stale-closure retry bug

On mobile/Capacitor: always use `<button type="button">` with both `onClick` and `onTouchEnd` + `touchAction: 'manipulation'` on interactive elements. The map container uses `pointerEvents: mapActuallyReady ? 'auto' : 'none'` so the sheet is always tappable during load.

### Supabase backend

- Project: `wddlktajnhwhyquwcdgf` (URL in `src/integrations/supabase/client.ts`)
- Edge functions: `supabase/functions/` — deployed via `supabase functions deploy`
- Key tables: `driver_locations`, `service_configurations`, `pricing_rules`, `bookings`
- Row-level security is active; the anon key can PATCH `driver_locations` for driver status updates

### Services layer (`src/services/`)

Heavy logic is split into services rather than hooks. Notable ones:
- `universalGeolocation.ts` / `UltraLocationService.ts` — GPS with IP fallback; always falls back to Kinshasa if city is unrecognized
- `googleMapsLoader.ts` — singleton loader for the Maps SDK
- `HealthOrchestrator.ts` + `SessionRecovery.ts` — app health monitoring, wired into `App.tsx`
- `cityDetectionService.ts` — city detection from coordinates

### Path alias

`@/` maps to `src/`. Use it for all internal imports.

### Production build notes

`vite.config.ts` drops `console.log` and `console.info` in production (`drop_console: true`). Use `console.warn`/`console.error` for messages that must survive the production build. Debug panels are gated on `import.meta.env.DEV`.
