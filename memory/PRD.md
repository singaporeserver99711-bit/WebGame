# HyperArcade — Product Requirements Doc

## Original problem statement
Build "HyperArcade" — a single-page React web arcade with four addictive, low-processing HTML5-canvas games ("Don't Touch Red", "Tower Bloxx Stacker", "Matiks", "Millisecond Reflex Test"), zero-cost persistence via `localStorage`, Web Audio synth (no assets), particle FX, snappy neon-cyberpunk UI (`#090D16` / cyan `#06B6D4` / amber `#F59E0B`). User later requested a **Global Leaderboard** on top of local persistence.

## User personas
- **Reflex-junkie player**: wants short, addictive skill games with clear personal bests and quick retry loop.
- **Competitive player**: wants to submit scores publicly and beat other humans on a global board.
- **Casual browser**: opens link, plays 30 seconds, shares score.

## Architecture
- **Frontend**: React (CRA), Tailwind, Framer Motion, custom canvas engines, Web Audio synth, Sonner toasts.
- **Backend**: FastAPI (`/app/backend/server.py`) with `POST /api/leaderboard`, `GET /api/leaderboard/{game}`, `GET /api/leaderboard` (aggregate).
- **DB**: MongoDB collection `arcade_scores` — `{id, game, player, score, display, created_at}`. `score` stored higher-is-better (reflex inverted).
- **Persistence**: Personal bests + mute/music prefs in `localStorage` (`hyperarcade.best`, `hyperarcade.muted`, `hyperarcade.music`, `hyperarcade.player`).
- Zero third-party services; no API keys required.

## Core requirements (static)
- 4 canvas games (Don't Touch Red, Tower Bloxx, Matiks, Reflex).
- Personal-best per game via localStorage.
- Global Top 10 per game via FastAPI + MongoDB.
- Web Audio SFX + optional background chip-loop.
- Mute toggle (default muted), music toggle (default off).
- Try-Again modal with Copy Score & Global Submit.
- Particle bursts on collisions/scores.

## What's been implemented (2026-02-03)
- Full arcade shell (`Arcade.jsx`, `TopBar.jsx`, retro grid + scanlines).
- 4 games in `/src/games/` with individual HUDs.
- Web Audio engine (`lib/audio.js`) — SFX + arpeggio loop.
- Particle field (`lib/particles.js`).
- Global leaderboard (`Leaderboard.jsx` + `lib/api.js`).
- Try-Again modal (`TryAgainModal.jsx`) with copy-share text + backend post.
- localStorage helpers (`lib/storage.js`).
- Backend endpoints in `server.py` (create + read + aggregate).
- Testing agent: frontend 100%, backend 100% after Pydantic constraint fix.

## Backlog / Next
- **P1** — Daily challenge modifiers (per-game seed of the day, share code).
- **P1** — Achievement badges (persist unlocks in localStorage).
- **P2** — Additional games (colour-match, memory pattern, snake).
- **P2** — Region filter on leaderboard, weekly reset.
- **P2** — On-screen touch controls hint on mobile Tower Bloxx.
