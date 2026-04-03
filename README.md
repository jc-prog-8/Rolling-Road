# Rolling-Road

A mobile-friendly HTML/JS prototype game for the "rolling road" army-runner concept.

## Play locally

Open `index.html` directly, or run a static server from the repository root:

```bash
python3 -m http.server 8080
```

Then visit:

- `http://localhost:8080/Rolling-Road/` (if served from parent path)
- or `http://localhost:8080/` (if serving repository root directly)

## GitHub Pages hosting

This repository is static-site ready. Ensure GitHub Pages is configured to serve from the repository root branch.

## Game summary

- 5 handcrafted prototype levels
- Each level targets ~4 minutes of run time
- Lateral army steering with automatic forward world scrolling
- Enemies (straight/zig-zag/flank), traps (static/timed), and power-ups
- Army growth, roles (melee/ranged/support), checkpoint respawns, and new-unit grace invulnerability
- Parallax/perspective visuals with hit/pickup feedback
- Touch controls optimized for iPhone and iPad browsers

## Stretch-goal test approach

Perform full end-to-end play testing by running the game in a browser and completing all 5 levels while verifying:

1. Checkpoint respawn behavior
2. Enemy/trap collisions and unit-loss feedback
3. Power-up effects and temporary buffs
4. Progressive difficulty and level transitions
5. Stable touch steering on iPhone/iPad Safari
