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

- Endless run mode (no level resets)
- Difficulty ramps over your configured run-duration pacing window
- Lateral army steering with automatic forward world scrolling
- Enemies (straight/zig-zag/flank), traps (static/timed), and power-ups
- Army growth power-ups and widening army/projectile formations as army size increases
- Parallax/perspective visuals with hit/pickup feedback
- Touch controls optimized for iPhone and iPad browsers

## Stretch-goal test approach

Perform full end-to-end play testing by running the game in a browser and verifying:

1. Enemy/trap collisions and unit-loss feedback
2. Army-growth power-up behavior and wider firing spread as army size increases
3. Progressive difficulty over time without playfield resets
4. Stable touch steering on iPhone/iPad Safari
