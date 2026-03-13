# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **3D Engine**: React Three Fiber + Three.js + @react-three/drei
- **State Management**: Zustand

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── noahs-ark/          # Noah's Ark 3D survival game (React Three Fiber)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace config
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Noah's Ark Game (`artifacts/noahs-ark`)

A 3D survival/strategy game built with React Three Fiber where the player controls Noah, gathering resources, building the Ark, and saving animals before the Great Flood.

### Game Architecture

```text
artifacts/noahs-ark/src/
├── store/
│   └── gameStore.ts        # Zustand store (game states, player, ark, world)
├── game/
│   ├── GameScene.tsx        # Main 3D canvas + keyboard controls
│   ├── Terrain.tsx          # Procedural terrain (simplex noise)
│   ├── Water.tsx            # Dynamic rising water with shader
│   ├── Player.tsx           # Noah character (WASD movement, sprint, swim)
│   ├── Camera.tsx           # Follow camera with zoom/tilt
│   ├── Ark.tsx              # Modular ark construction
│   ├── Trees.tsx            # Procedural trees and rocks
│   ├── Animals.tsx          # Animal AI (wandering, pairing, boarding)
│   ├── Resources.tsx        # Resource nodes (wood, pitch, food, gopher wood)
│   ├── Rain.tsx             # Rain particle system
│   ├── Lighting.tsx         # Dynamic lighting + fog
│   └── InteractionSystem.tsx # Keyboard shortcuts, victory/defeat checks
├── ui/
│   ├── HUD.tsx              # In-game HUD (health, stamina, faith, inventory)
│   ├── MainMenu.tsx         # Title screen
│   ├── PauseMenu.tsx        # Pause overlay
│   └── GameOverScreen.tsx   # Victory/defeat screen
├── App.tsx                  # Root component with state routing
├── main.tsx                 # Entry point
└── index.css                # Global styles
```

### Game States
- **Menu**: Title screen with "Begin Journey" button
- **Playing**: Active gameplay with HUD
- **Paused**: Pause overlay (ESC key)
- **Victory**: Win screen (Ark complete + animals boarded + flood risen)
- **Game Over**: Defeat screen (health depleted or flood too high)

### Controls
- **WASD/Arrows**: Move Noah
- **Shift**: Sprint (drains stamina)
- **Scroll Wheel**: Zoom camera
- **Right Mouse**: Rotate camera
- **E**: Gather resources (when near nodes)
- **B**: Build Ark section (costs 10 wood)
- **P**: Coat with pitch (costs 5 pitch)
- **F**: Board animal (when near animals)
- **1/2/3**: Switch tools (Axe/Hammer/Staff)
- **ESC**: Pause/Resume

### Key Systems
- **Procedural Terrain**: Simplex noise-based valley with height-colored vertices
- **Rising Water**: Shader-based animated water that rises over time
- **Resource Gathering**: Clickable resource nodes scattered across terrain
- **Ark Construction**: 30 modular sections, pitch coating, multi-deck
- **Animal AI**: 7 species with wandering, fleeing, and pairing behavior
- **Storm System**: Intensity increases with water level, affects rain, lighting, fog
- **Faith System**: Resource earned by gathering and completing objectives

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API server. Routes live in `src/routes/`.

### `artifacts/noahs-ark` (`@workspace/noahs-ark`)
Noah's Ark 3D survival game. Uses React Three Fiber, Three.js, Zustand, and simplex-noise.

### `lib/db` (`@workspace/db`)
Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI 3.1 spec and Orval codegen config.

### `lib/api-zod` (`@workspace/api-zod`)
Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)
Generated React Query hooks and fetch client.

### `scripts` (`@workspace/scripts`)
Utility scripts package.
