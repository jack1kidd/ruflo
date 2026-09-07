# Ruflo Tower Defense

A small, dependency-free tower defense game built with HTML5 canvas and vanilla
JavaScript (ES modules) — no build step required.

## Run it

Serve the folder with any static file server (ES modules require `http://`,
not `file://`):

```bash
cd examples/tower-defense-game
python3 -m http.server 8080
# then open http://localhost:8080
```

## How to play

- Click a tower card in the shop, then click an open grid cell to place it.
- Towers auto-fire at the enemy furthest along the path within range.
- Click a placed tower to select it, then **Upgrade** or **Sell** it.
- Click **Start Wave** to send the next wave of enemies down the path.
- Enemies that reach the end cost you a life; run out of lives and you lose.
- Survive all 15 waves (a boss spawns every 5th wave) to win.
- **Speed** cycles 1x/2x/3x game speed; **Pause** freezes the simulation.

## Structure

```
index.html       Page shell + HUD/shop markup
style.css        Styling
src/map.js       Grid, path waypoints, path rendering
src/enemies.js   Enemy types + per-enemy movement/HP logic
src/towers.js    Tower types, targeting, firing, upgrades
src/projectile.js Projectile travel + hit/splash/slow resolution
src/waves.js     Wave composition and scaling
src/game.js      Game state, update/draw loop, UI wiring
src/main.js      DOM bootstrap and button event handlers
```
