# Rolling Road Core Concepts

## Player movement
- Continuous lateral movement with forward automatic scrolling.
- The player steers the army side-to-side while forward motion is simulated.

## World motion
- Simulate forward travel by moving environment and obstacles toward the camera at variable speed (the "rolling road").

## Predefined levels
- Design handcrafted segments/tiles.
- Place enemies, obstacles, and power-ups explicitly.
- Use level-specific pacing, setpieces, and checkpoints.
- Reuse assets across levels.
- Stream in upcoming geometry while unloading completed sections.

## Environment and obstacles
- **On-coming enemies**: melee or ranged units that damage the army on contact; varied AI patterns (straight charge, zig-zag, flanking).
- **Spikes/traps**: static or timed hazards that damage or remove units if the formation crosses them; can be visible or triggered.
- **Power-ups**: pickups that increase army size, unit strength, or grant temporary abilities (shield, speed, damage boost).

## Collision and hit response (army-focused)
- Hitboxes: simple area checks against individual units or the formation.
- Immediate feedback: losing units from rear or sides on hit.
- Grace mechanics: brief invulnerability for newly spawned units only.

## Army mechanics
- The player controls a group/formation, not a single avatar.
- The army starts small and grows in unit count and capability via power-ups.
- Different unit roles (melee, ranged, support) can be added; formation affects collision profile and effectiveness.

## Difficulty curve
- Obstacle/enemy density and aggressiveness scale with score milestones and player progress.
- Introduce new enemy types and obstacle patterns in waves.

## Visuals
- Use parallax layers and perspective scaling to sell forward motion.
- Provide visual cues for formation size and unit count (density, banners, unit models).
- Include clear FX for hits, unit loss, and power-up pickups.
