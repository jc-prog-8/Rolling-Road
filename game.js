(() => {
  const LEVEL_COUNT = 5;
  const LEVEL_DURATION = 240;
  const BASE_SCROLL = 260;
  const PLAYER_BOTTOM_PADDING = 170;
  const KEYBOARD_MOVEMENT_STEP = 180;
  const EXTRA_ENEMY_TIMING_OFFSET = 2.2;
  const EXTRA_POWER_TIMING_OFFSET = 8.2;
  const BURST_ENEMY_TIMING_OFFSET = 7.8;
  const EXTRA_SEGMENT_ENEMY_TIMING_OFFSET = 9;
  const SPAWN_SEGMENT_LENGTH = 12;
  const ROAD_HORIZON_Y = 90;
  const ROAD_TOP_MIN_X = 0.34;
  const ROAD_TOP_SPAN_X = 0.32;
  const ROAD_TOP_LANE_STEPS = Math.round(ROAD_TOP_SPAN_X * 100);
  const ENEMY_SIZE_SCALE = 0.75;
  const ENEMY_WIDTH = 108 * ENEMY_SIZE_SCALE;
  const ENEMY_HEIGHT = 69 * ENEMY_SIZE_SCALE;
  const POWER_UP_RADIUS = 72;
  const BASE_ENEMY_HP = 2;
  const POWER_HITS_BASE = 3;
  const POWER_HITS_PER_LEVEL = 1;
  const ENEMY_HP_LEVEL_THRESHOLD = 2;
  const ENEMY_HP_LEVEL_BONUS = 1;
  const ENEMY_HP_FLANK_BONUS = 1;
  const MAX_EXTRA_SPAWN_PROBABILITY = 0.9;
  const DENSITY_SPAWN_MULTIPLIER = 0.85;
  const FIRE_INTERVAL_SECONDS = 0.75;
  const SINGLE_UNIT_SHOT_COUNT = 3;
  const VOLLEY_WIDTH_MULTIPLIER = 1.35;
  const BASE_PROJECTILE_SPEED = 600;
  const PROJECTILE_SPEED_PER_LEVEL = 35;
  const PROJECTILE_OFFSCREEN_THRESHOLD = -40;
  const POWER_PROGRESS_MIN_SCALE = 0.88;
  const POWER_PROGRESS_SCALE_GAIN = 0.22;
  const POWER_PROGRESS_BAR_WIDTH_MULTIPLIER = 2.1;
  const POWER_UP_DIAMOND_OFFSET = 3;
  const POWER_UP_ICON_Y_OFFSET = 1;
  const SPAWN_Y_OFFSET = -16;
  const ENEMY_SPEED_MIN_MULTIPLIER = 0.5;
  const ENEMY_SPEED_RANDOM_RANGE = 0.12;
  const POWER_UP_SPEED_MULTIPLIER = 0.44;
  const POWER_HITS_PER_ARMY_STEP = 6;
  const ARMY_SQUARE_MIN_RADIUS = 20;
  const ARMY_SQUARE_SIZE_RATIO = 0.92;
  const ROAD_TOP_WIDTH_RATIO = 0.78;
  const ROAD_BOTTOM_WIDTH_RATIO = 1;
  const ENEMY_HOLD_LINE_OFFSET = 64;
  const ENEMY_BREACH_TICK_SECONDS = 1;
  const ENTITY_CLEANUP_MARGIN = 120;
  const ARMY_BAR_MAX_UNITS = 180;
  const POWER_GROWTH_MIN_GAIN = 1;
  const POWER_GROWTH_GAIN_RANGE = 1;
  const POWER_TYPE_ICONS = { growth: '+' };
  const SUN_GLOW_RADIUS = 190;
  const MOUNTAIN_LAYER_WIDTH = 260;
  const MOUNTAIN_TILE_START_X = -320;
  const MOUNTAIN_TILE_END_PAD = 320;
  const POWER_PULSE_BASE = 0.85;
  const POWER_PULSE_SPEED = 3.3;
  const POWER_PULSE_OFFSET = 0.02;
  const POWER_PULSE_AMPLITUDE = 0.08;

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('status');
  const levelEl = document.getElementById('levelLabel');
  const timeEl = document.getElementById('timeLabel');
  const armyEl = document.getElementById('armyLabel');
  const scoreEl = document.getElementById('scoreLabel');

  const state = {
    running: true,
    victory: false,
    level: 0,
    timeInLevel: 0,
    totalTime: 0,
    score: 0,
    armySize: 4,
    touchTargetX: null,
    entities: [],
    projectiles: [],
    fx: [],
    damageFlash: 0,
    bgOffset: 0,
    roadOffset: 0,
    playerX: canvas.width * 0.5,
    playerY: canvas.height - PLAYER_BOTTOM_PADDING,
    fireTimer: 0,
    shotStaggerTimer: 0,
    queuedShots: [],
    pointerActive: false,
    levelDefs: []
  };

  function createLevels() {
    const defs = [];
    for (let i = 0; i < LEVEL_COUNT; i++) {
      const levelSpeed = BASE_SCROLL + i * 35;
      const density = 1 + i * 0.27;
      const events = [];
      const segmentLength = SPAWN_SEGMENT_LENGTH;
      for (let seg = 0; seg < LEVEL_DURATION / segmentLength; seg++) {
        const baseT = seg * segmentLength;
        const isEvenSeg = seg % 2 === 0;
        const laneA = ROAD_TOP_MIN_X + ((seg * 37 + i * 11) % ROAD_TOP_LANE_STEPS) / 100;
        const laneB = ROAD_TOP_MIN_X + ((seg * 53 + i * 7 + 21) % ROAD_TOP_LANE_STEPS) / 100;
        const laneC = ROAD_TOP_MIN_X + ((seg * 29 + i * 13 + 44) % ROAD_TOP_LANE_STEPS) / 100;
        let burstPattern = 'zigzag';
        let burstX = laneC;
        if (seg % 3 === 0) {
          burstPattern = 'flank';
          burstX = seg % 2 === 0 ? ROAD_TOP_MIN_X : ROAD_TOP_MIN_X + ROAD_TOP_SPAN_X;
        }

        events.push({ t: baseT + 1, kind: 'enemy', pattern: 'straight', x: laneA });
        events.push({ t: baseT + EXTRA_ENEMY_TIMING_OFFSET, kind: 'enemy', pattern: 'straight', x: laneB });
        events.push({ t: baseT + 3.5, kind: 'trap', pattern: seg % 3 === 0 ? 'timed' : 'static', x: laneB });
        events.push({ t: baseT + 5, kind: 'enemy', pattern: isEvenSeg ? 'zigzag' : 'straight', x: laneC });
        events.push({ t: baseT + BURST_ENEMY_TIMING_OFFSET, kind: 'enemy', pattern: burstPattern, x: burstX });
        events.push({ t: baseT + EXTRA_SEGMENT_ENEMY_TIMING_OFFSET, kind: 'enemy', pattern: isEvenSeg ? 'straight' : 'zigzag', x: isEvenSeg ? laneA : laneB });

        if (!isEvenSeg) {
          events.push({
            t: baseT + 7, kind: 'enemy', pattern: 'flank', x: seg % 4 === 1 ? ROAD_TOP_MIN_X : ROAD_TOP_MIN_X + ROAD_TOP_SPAN_X
          });
        }
        if (seg % 2 === 0) {
          events.push({ t: baseT + EXTRA_POWER_TIMING_OFFSET, kind: 'power', p: 'growth', x: laneC });
        }
        if (seg % 3 === 0) {
          events.push({ t: baseT + 9.5, kind: 'power', p: 'growth', x: laneA });
        }
        if (seg % 4 === 2) {
          events.push({ t: baseT + 10.5, kind: 'power', p: 'growth', x: laneB });
        }
        if (seg % 5 === 1) {
          events.push({ t: baseT + 12, kind: 'power', p: 'growth', x: laneC });
        }
      }
      defs.push({ speed: levelSpeed, density, events: events.sort((a, b) => a.t - b.t) });
    }
    return defs;
  }

  state.levelDefs = createLevels();

  function spawnEntity(ev) {
    const y = ROAD_HORIZON_Y + SPAWN_Y_OFFSET;
    const x = ev.x * canvas.width;
    const baseSpeed = currentSpeed() * (ENEMY_SPEED_MIN_MULTIPLIER + Math.random() * ENEMY_SPEED_RANDOM_RANGE);

    if (ev.kind === 'enemy') {
      const hp = BASE_ENEMY_HP
        + (state.level >= ENEMY_HP_LEVEL_THRESHOLD ? ENEMY_HP_LEVEL_BONUS : 0)
        + (ev.pattern === 'flank' ? ENEMY_HP_FLANK_BONUS : 0);
      state.entities.push({
        kind: 'enemy',
        x,
        y,
        w: ENEMY_WIDTH,
        h: ENEMY_HEIGHT,
        hp,
        pattern: ev.pattern,
        phase: Math.random() * Math.PI * 2,
        vx: 0,
        speed: baseSpeed,
      });
      return;
    }

    if (ev.kind === 'trap') {
      state.entities.push({
        kind: 'trap',
        x,
        y,
        w: ENEMY_WIDTH,
        h: 24,
        pattern: ev.pattern,
        active: true,
        speed: currentSpeed() * 0.95,
      });
      return;
    }

    if (ev.kind === 'power') {
      const maxHp = powerUpMaxHp();
      state.entities.push({
        kind: 'power',
        x,
        y,
        r: POWER_UP_RADIUS,
        hp: maxHp,
        maxHp,
        powerType: ev.p,
        speed: currentSpeed() * POWER_UP_SPEED_MULTIPLIER,
      });
    }
  }

  function currentSpeed() {
    const levelDef = state.levelDefs[state.level];
    const milestoneBoost = Math.floor(state.score / 500) * 12;
    const progressBoost = (state.timeInLevel / LEVEL_DURATION) * 80;
    return levelDef.speed + milestoneBoost + progressBoost;
  }

  function formationRangeX() {
    return 42 + Math.min(260, Math.sqrt(state.armySize) * 19);
  }

  function formationRangeY() {
    return 24 + Math.min(90, Math.sqrt(state.armySize) * 8);
  }

  function queueVolley() {
    const effectiveArmySize = Math.max(1, Math.floor(state.armySize));
    const shotCount = effectiveArmySize === 1 ? SINGLE_UNIT_SHOT_COUNT : effectiveArmySize;
    const shotInterval = FIRE_INTERVAL_SECONDS / shotCount;
    const width = formationRangeX() * VOLLEY_WIDTH_MULTIPLIER;
    for (let i = 0; i < shotCount; i++) {
      const slot = shotCount === 1 ? 0.5 : i / (shotCount - 1);
      const offset = (slot - 0.5) * width;
      state.queuedShots.push({ offset, shotInterval });
    }
  }

  function fireQueuedShot(offset) {
    state.projectiles.push({
      x: state.playerX + offset,
      y: state.playerY - formationRangeY() - 20,
      r: 5,
      speed: BASE_PROJECTILE_SPEED + state.level * PROJECTILE_SPEED_PER_LEVEL,
    });
  }

  function processQueuedShots(dt) {
    state.shotStaggerTimer -= dt;
    while (state.queuedShots.length && state.shotStaggerTimer <= 0) {
      const queuedShot = state.queuedShots.shift();
      fireQueuedShot(queuedShot.offset);
      state.shotStaggerTimer += queuedShot.shotInterval;
    }
  }

  function powerUpMaxHp() {
    const effectiveArmySize = Math.max(1, state.armySize);
    return POWER_HITS_BASE
      + state.level * POWER_HITS_PER_LEVEL
      + Math.floor((effectiveArmySize - 1) / POWER_HITS_PER_ARMY_STEP);
  }

  function movePlayerInstantly() {
    if (state.touchTargetX !== null) {
      state.playerX = state.touchTargetX;
    }
  }

  function updatePlayerFromKeyboard(e) {
    if (e.key === 'ArrowLeft') {
      state.playerX -= KEYBOARD_MOVEMENT_STEP;
      state.touchTargetX = null;
    }
    if (e.key === 'ArrowRight') {
      state.playerX += KEYBOARD_MOVEMENT_STEP;
      state.touchTargetX = null;
    }
  }

  function clampPlayerX() {
    const margin = 85;
    state.playerX = Math.max(margin, Math.min(canvas.width - margin, state.playerX));
  }

  function updateMovement() {
    movePlayerInstantly();
    clampPlayerX();
  }

  function decrementFireTimer(dt) {
    state.fireTimer -= dt;
  }

  function updateFiring(dt) {
    decrementFireTimer(dt);
    const fireInterval = FIRE_INTERVAL_SECONDS;
    while (state.fireTimer <= 0) {
      queueVolley();
      state.fireTimer += fireInterval;
    }
    processQueuedShots(dt);
  }

  function updateRoadOffsets(dt) {
    state.bgOffset += dt * currentSpeed() * 0.13;
    state.roadOffset += dt * currentSpeed();
  }

  function updateGameTimers(dt) {
    state.totalTime += dt;
    state.timeInLevel += dt;
    state.score += dt * 8;
  }

  function updateFx(dt) {
    state.damageFlash = Math.max(0, state.damageFlash - dt);
    state.fx = state.fx.filter((f) => {
      f.ttl -= dt;
      return f.ttl > 0;
    });
  }

  function updateLevelProgression() {
    if (state.timeInLevel >= LEVEL_DURATION) nextLevel();
  }

  function updateCore(dt) {
    spawnFromTimeline();
    updateEntities(dt);
    updateFiring(dt);
    updateProjectiles(dt);
    updateLevelProgression();
    updateFx(dt);
    updateHud();
  }

  function updateState(dt) {
    updateGameTimers(dt);
    updateMovement();
    updateRoadOffsets(dt);
    updateCore(dt);
  }

  function endRun(reason) {
    state.running = false;
    state.victory = false;
    statusEl.textContent = `${reason}. Final score: ${Math.floor(state.score)}`;
  }

  function loseUnits(count, reason) {
    state.armySize = Math.max(0, state.armySize - count);
    state.damageFlash = 0.18;
    state.fx.push({ type: 'loss', x: state.playerX + (Math.random() - 0.5) * 80, y: state.playerY - 20, ttl: 0.5 });
    statusEl.textContent = `${reason}: -${count} units`;

    if (state.armySize <= 0) {
      endRun('Army wiped out');
    }
  }

  function addUnits(count) {
    state.armySize += count;
  }

  function applyGrowthPower() {
    const gain = POWER_GROWTH_MIN_GAIN + Math.floor(Math.random() * POWER_GROWTH_GAIN_RANGE);
    addUnits(gain);
    state.score += 90;
    statusEl.textContent = `Growth pickup: +${gain} units`;
  }

  function overlapsCircleRect(cx, cy, cr, rx, ry, rw, rh) {
    const nx = Math.max(rx, Math.min(cx, rx + rw));
    const ny = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy <= cr * cr;
  }

  function anchorEnemy(enemy, holdY) {
    enemy.anchored = true;
    enemy.y = holdY;
    enemy.nextDamageAt = state.totalTime;
  }

  function anchorEnemyIfNeeded(enemy, holdY) {
    if (!enemy.anchored) anchorEnemy(enemy, holdY);
  }

  function updateEntities(dt) {
    const enemyHoldY = state.playerY - ENEMY_HOLD_LINE_OFFSET;

    for (const e of state.entities) {
      if (e.kind === 'enemy') {
        if (e.anchored) {
          const dir = state.playerX > e.x ? 1 : -1;
          e.x += dir * dt * 110;
          e.y = enemyHoldY;
        } else {
          if (e.pattern === 'zigzag') {
            e.phase += dt * 4;
            e.x += Math.sin(e.phase) * dt * 120;
          } else if (e.pattern === 'flank') {
            const dir = state.playerX > e.x ? 1 : -1;
            e.x += dir * dt * 160;
          }
          e.y += e.speed * dt;
          if (e.y >= enemyHoldY) {
            anchorEnemyIfNeeded(e, enemyHoldY);
          }
        }
      } else if (e.kind === 'trap') {
        e.y += e.speed * dt;
      } else {
        e.y += e.speed * dt;
      }
    }

    const px = state.playerX;
    const py = state.playerY;
    const formationW = formationRangeX();
    const formationH = formationRangeY();
    const formationCollisionBound = Math.max(formationW, formationH);

    state.entities = state.entities.filter((e) => {
      if (e.kind !== 'enemy' && e.y > canvas.height + ENTITY_CLEANUP_MARGIN) return false;
      if (
        e.kind === 'enemy'
        && (e.x < -ENTITY_CLEANUP_MARGIN - e.w || e.x > canvas.width + ENTITY_CLEANUP_MARGIN + e.w)
      ) return false;

      if (e.kind === 'enemy') {
        const nx = (e.x - px) / (formationW + e.w * 0.5);
        const ny = (e.y - (py - 30)) / (formationH + e.h * 0.5);
        if (nx * nx + ny * ny < 1) {
          anchorEnemyIfNeeded(e, enemyHoldY);
          if (state.totalTime >= (e.nextDamageAt || 0)) {
            loseUnits(1, 'Enemy hit');
            e.nextDamageAt = state.totalTime + ENEMY_BREACH_TICK_SECONDS;
            if (!e.breachedScoreAwarded) {
              state.score += 10;
              e.breachedScoreAwarded = true;
            }
          }
          return true;
        }
      } else if (e.kind === 'trap') {
        if (
          e.active
          && overlapsCircleRect(px, py - 20, formationCollisionBound, e.x - e.w * 0.5, e.y - e.h * 0.5, e.w, e.h)
        ) {
          loseUnits(2, 'Trap hit');
          return false;
        }
      } else {
        const nx = (e.x - px) / (e.r + formationW);
        const ny = (e.y - py) / (e.r + formationH);
        if (nx * nx + ny * ny < 1) return true;
      }
      return true;
    });
  }

  function updateProjectiles(dt) {
    for (const p of state.projectiles) {
      p.y -= p.speed * dt;
    }

    for (const p of state.projectiles) {
      if (p.y < PROJECTILE_OFFSCREEN_THRESHOLD) continue;
      for (const e of state.entities) {
        if (e.kind !== 'enemy' && e.kind !== 'power') continue;
        const rx = e.kind === 'enemy' ? (e.w * 0.5 + p.r) : (e.r + p.r);
        const ry = e.kind === 'enemy' ? (e.h * 0.5 + p.r) : (e.r + p.r);
        const nx = (e.x - p.x) / rx;
        const ny = (e.y - p.y) / ry;
        if (nx * nx + ny * ny <= 1) {
          p.destroyed = true;
          if (e.kind === 'power') {
            e.hp -= 1;
            state.fx.push({ type: 'hit', x: e.x, y: e.y, ttl: 0.18 });
            if (e.hp <= 0) {
              e.destroyed = true;
              applyGrowthPower();
              state.fx.push({ type: 'pickup', x: e.x, y: e.y, ttl: 0.45 });
            }
          } else {
            e.hp -= 1;
            state.fx.push({ type: 'hit', x: e.x, y: e.y, ttl: 0.2 });
            if (e.hp <= 0) {
              e.destroyed = true;
              state.score += 22 + state.level * 3;
            }
          }
          break;
        }
      }
    }

    state.entities = state.entities.filter((e) => !((e.kind === 'enemy' || e.kind === 'power') && (e.hp <= 0 || e.destroyed)));
    state.projectiles = state.projectiles.filter((p) => p.y > PROJECTILE_OFFSCREEN_THRESHOLD && !p.destroyed);
  }

  function spawnFromTimeline() {
    const def = state.levelDefs[state.level];
    while (def.events.length && def.events[0].t <= state.timeInLevel) {
      const ev = def.events.shift();
      spawnEntity(ev);
      if (Math.random() < Math.min(MAX_EXTRA_SPAWN_PROBABILITY, DENSITY_SPAWN_MULTIPLIER * def.density)) {
        spawnEntity({ t: ev.t, kind: 'enemy', pattern: 'straight', x: ROAD_TOP_MIN_X + Math.random() * ROAD_TOP_SPAN_X });
      }
    }
  }

  function nextLevel() {
    state.level += 1;
    if (state.level >= LEVEL_COUNT) {
      state.running = false;
      state.victory = true;
      statusEl.textContent = `Victory! Final score: ${state.score}`;
      return;
    }
    state.timeInLevel = 0;
    state.entities = [];
    state.projectiles = [];
    state.levelDefs[state.level] = createLevels()[state.level];
    statusEl.textContent = `Level ${state.level + 1} start`;
  }

  function update(dt) {
    if (!state.running) return;

    updateState(dt);
  }

  function roadBoundsAtY(y) {
    const w = canvas.width;
    const h = canvas.height;
    const t = Math.max(0, Math.min(1, (y - ROAD_HORIZON_Y) / (h - ROAD_HORIZON_Y)));
    const roadWidth = w * (ROAD_TOP_WIDTH_RATIO + (ROAD_BOTTOM_WIDTH_RATIO - ROAD_TOP_WIDTH_RATIO) * t);
    const left = w * 0.5 - roadWidth * 0.5;
    const right = w * 0.5 + roadWidth * 0.5;
    return { left, right, width: roadWidth, t };
  }

  function drawRoadShape() {
    const w = canvas.width;
    const h = canvas.height;
    const roadTopWidth = w * ROAD_TOP_WIDTH_RATIO;
    const roadBottomWidth = w * ROAD_BOTTOM_WIDTH_RATIO;
    const roadCenter = w * 0.5;
    ctx.beginPath();
    ctx.moveTo(roadCenter - roadTopWidth * 0.5, ROAD_HORIZON_Y);
    ctx.lineTo(roadCenter + roadTopWidth * 0.5, ROAD_HORIZON_Y);
    ctx.lineTo(roadCenter + roadBottomWidth * 0.5, h);
    ctx.lineTo(roadCenter - roadBottomWidth * 0.5, h);
    ctx.closePath();
  }

  function roundedRectPath(x, y, width, height, radius) {
    const r = Math.min(radius, width * 0.5, height * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function drawParallax() {
    const w = canvas.width;
    const h = canvas.height;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0a1f3f');
    skyGrad.addColorStop(0.45, '#12386b');
    skyGrad.addColorStop(0.72, '#224a70');
    skyGrad.addColorStop(1, '#1a2b3f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    const sunX = w * 0.5;
    const sunY = ROAD_HORIZON_Y + 8;
    const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, SUN_GLOW_RADIUS);
    glow.addColorStop(0, 'rgba(255, 214, 140, 0.95)');
    glow.addColorStop(0.36, 'rgba(255, 167, 106, 0.5)');
    glow.addColorStop(1, 'rgba(255, 167, 106, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, SUN_GLOW_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    for (let layer = 0; layer < 3; layer++) {
      const speed = 0.08 + layer * 0.09;
      const y = ROAD_HORIZON_Y + 16 + layer * 30;
      const offset = (state.bgOffset * speed) % MOUNTAIN_LAYER_WIDTH;
      ctx.fillStyle = layer === 0 ? '#192e4e' : layer === 1 ? '#1d385e' : '#24436c';
      for (let x = MOUNTAIN_TILE_START_X + offset; x < w + MOUNTAIN_TILE_END_PAD; x += MOUNTAIN_LAYER_WIDTH) {
        ctx.beginPath();
        ctx.moveTo(x, y + 80);
        ctx.lineTo(x + 50, y + 18);
        ctx.lineTo(x + 110, y + 74);
        ctx.lineTo(x + 165, y + 26);
        ctx.lineTo(x + 235, y + 82);
        ctx.lineTo(x + 320, y + 80);
        ctx.closePath();
        ctx.fill();
      }
    }

    const haze = ctx.createLinearGradient(0, ROAD_HORIZON_Y - 12, 0, ROAD_HORIZON_Y + 82);
    haze.addColorStop(0, 'rgba(205, 230, 255, 0.18)');
    haze.addColorStop(1, 'rgba(205, 230, 255, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, ROAD_HORIZON_Y - 12, w, 94);

    drawRoadShape();
    const roadGrad = ctx.createLinearGradient(0, ROAD_HORIZON_Y, 0, h);
    roadGrad.addColorStop(0, '#294f5f');
    roadGrad.addColorStop(0.45, '#2f4d64');
    roadGrad.addColorStop(1, '#2b3f57');
    ctx.fillStyle = roadGrad;
    ctx.fill();

    drawRoadShape();
    ctx.save();
    ctx.clip();

    for (let y = ROAD_HORIZON_Y + 6; y < h; y += 14) {
      const { left, width, t } = roadBoundsAtY(y);
      const tileInset = width * 0.06;
      const alpha = 0.06 + t * 0.06;
      ctx.fillStyle = `rgba(216, 245, 255, ${alpha})`;
      ctx.fillRect(left + tileInset, y, width - tileInset * 2, 2 + t * 4);
    }

    const sideLineGap = 34;
    const sideLineLen = 18;
    const sideBase = state.roadOffset * 0.8 % sideLineGap;
    for (let y = ROAD_HORIZON_Y - sideLineGap + sideBase; y < h; y += sideLineGap) {
      const { left, right, t } = roadBoundsAtY(y);
      const dashLen = sideLineLen * (0.7 + t * 1.4);
      const inset = 8 + t * 18;
      ctx.strokeStyle = `rgba(209, 241, 255, ${0.5 + t * 0.45})`;
      ctx.lineWidth = 1.6 + t * 4;
      ctx.beginPath();
      ctx.moveTo(left + inset, y);
      ctx.lineTo(left + inset, y + dashLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(right - inset, y);
      ctx.lineTo(right - inset, y + dashLen);
      ctx.stroke();
    }

    const stripeGap = 72;
    const stripeLen = 28;
    const base = state.roadOffset % stripeGap;
    for (let y = ROAD_HORIZON_Y - stripeGap + base; y < h; y += stripeGap) {
      const { t } = roadBoundsAtY(y);
      const widthScale = Math.max(0.12, t);
      ctx.strokeStyle = `rgba(248, 255, 253, ${0.72 + t * 0.22})`;
      ctx.lineWidth = 2 + widthScale * 5;
      ctx.shadowColor = 'rgba(161, 255, 246, 0.45)';
      ctx.shadowBlur = 8 + widthScale * 10;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, y);
      ctx.lineTo(w * 0.5, y + stripeLen * (0.52 + widthScale));
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    drawRoadShape();
    ctx.strokeStyle = '#70c4db';
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  function drawSoldier(ux, uy, scale, lead = false) {
    const bodyColor = lead ? '#7fe5ff' : '#b9efff';
    const shadowAlpha = lead ? 0.36 : 0.25;
    const unitSize = 7.5 * scale;
    ctx.fillStyle = `rgba(10, 27, 42, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(ux, uy + unitSize * 1.1, unitSize * 0.9, unitSize * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1b3854';
    roundedRectPath(ux - unitSize * 0.5, uy - unitSize * 0.4, unitSize, unitSize * 1.16, 2.5 * scale);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(ux, uy - unitSize * 0.68, unitSize * 0.46, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#082235';
    ctx.fillRect(ux - unitSize * 0.2, uy + unitSize * 0.1, unitSize * 0.12, unitSize * 0.72);
    ctx.fillRect(ux + unitSize * 0.08, uy + unitSize * 0.1, unitSize * 0.12, unitSize * 0.72);
    ctx.fillRect(ux + unitSize * 0.5, uy - unitSize * 0.12, unitSize * 0.6, unitSize * 0.12);
  }

  function drawArmy() {
    const w = formationRangeX();
    const h = formationRangeY();
    const count = Math.min(state.armySize, 90);

    const dotsPerSide = Math.max(1, Math.ceil(Math.sqrt(count)));
    const halfSquareSide = Math.max(ARMY_SQUARE_MIN_RADIUS, Math.min(w, h) * ARMY_SQUARE_SIZE_RATIO);
    const spacing = dotsPerSide > 1 ? (halfSquareSide * 2) / (dotsPerSide - 1) : 0;
    const originOffset = (dotsPerSide - 1) * spacing * 0.5;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / dotsPerSide);
      const col = i % dotsPerSide;
      const ux = state.playerX - originOffset + col * spacing;
      const uy = state.playerY - originOffset + row * spacing;
      const rowScale = 0.72 + (row / Math.max(1, dotsPerSide - 1)) * 0.58;
      drawSoldier(ux, uy, rowScale);
    }

    const commanderY = state.playerY - h - 30;
    drawSoldier(state.playerX, commanderY, 1.55, true);
    ctx.fillStyle = '#4ce8f1';
    ctx.beginPath();
    ctx.moveTo(state.playerX + 9, commanderY - 14);
    ctx.lineTo(state.playerX + 9, commanderY - 38);
    ctx.lineTo(state.playerX + 30, commanderY - 30);
    ctx.lineTo(state.playerX + 9, commanderY - 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b7ffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawArmyBar() {
    const barHeight = 26;
    const barY = canvas.height - barHeight;
    const fillRatio = Math.min(1, state.armySize / ARMY_BAR_MAX_UNITS);
    const barGrad = ctx.createLinearGradient(0, barY, 0, canvas.height);
    barGrad.addColorStop(0, 'rgba(6, 16, 25, 0.84)');
    barGrad.addColorStop(1, 'rgba(7, 12, 18, 0.93)');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, barY, canvas.width, barHeight);
    const fillGrad = ctx.createLinearGradient(0, barY, canvas.width, barY);
    fillGrad.addColorStop(0, '#4defff');
    fillGrad.addColorStop(0.5, '#7ddaff');
    fillGrad.addColorStop(1, '#b3f0ff');
    ctx.fillStyle = fillGrad;
    ctx.fillRect(0, barY, canvas.width * fillRatio, barHeight);
    ctx.strokeStyle = '#d3fcff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, barY, canvas.width, barHeight);
    ctx.fillStyle = '#f0fbff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ARMY ${state.armySize}`, 12, barY + barHeight * 0.5 + 1);
    ctx.textBaseline = 'alphabetic';
  }

  function drawProjectiles() {
    for (const p of state.projectiles) {
      const pGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4.2);
      pGlow.addColorStop(0, 'rgba(214, 255, 255, 0.95)');
      pGlow.addColorStop(0.45, 'rgba(134, 236, 255, 0.7)');
      pGlow.addColorStop(1, 'rgba(134, 236, 255, 0)');
      ctx.fillStyle = pGlow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d6fcff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(79, 231, 255, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 11);
      ctx.lineTo(p.x, p.y - 16);
      ctx.stroke();
    }
  }

  function drawMonster(e) {
    const isFlank = e.pattern === 'flank';
    const isZigZag = e.pattern === 'zigzag';
    const body = isFlank ? '#ffc487' : isZigZag ? '#ff92ce' : '#ff6a76';
    const bodyDark = isFlank ? '#cc7d49' : isZigZag ? '#c55c97' : '#c53f4f';
    const eye = isFlank ? '#2d1a0f' : '#2b1027';
    const rx = e.w * 0.5;
    const ry = e.h * 0.5;

    ctx.fillStyle = 'rgba(22, 5, 15, 0.28)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + ry * 0.65, rx * 0.75, ry * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createLinearGradient(e.x, e.y - ry, e.x, e.y + ry);
    grad.addColorStop(0, '#ffe3d5');
    grad.addColorStop(0.25, body);
    grad.addColorStop(1, bodyDark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#57202f';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    const hornY = e.y - ry * 0.58;
    ctx.fillStyle = '#f9e8d8';
    ctx.beginPath();
    ctx.moveTo(e.x - rx * 0.2, hornY + 3);
    ctx.lineTo(e.x - rx * 0.48, hornY - 16);
    ctx.lineTo(e.x - rx * 0.03, hornY - 7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + rx * 0.2, hornY + 3);
    ctx.lineTo(e.x + rx * 0.48, hornY - 16);
    ctx.lineTo(e.x + rx * 0.03, hornY - 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = eye;
    ctx.beginPath();
    ctx.arc(e.x - rx * 0.23, e.y - ry * 0.08, 5, 0, Math.PI * 2);
    ctx.arc(e.x + rx * 0.23, e.y - ry * 0.08, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(e.x - rx * 0.2, e.y - ry * 0.14, 1.7, 0, Math.PI * 2);
    ctx.arc(e.x + rx * 0.26, e.y - ry * 0.14, 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3b0d1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(e.x - rx * 0.24, e.y + ry * 0.2);
    ctx.quadraticCurveTo(e.x, e.y + ry * 0.42, e.x + rx * 0.24, e.y + ry * 0.2);
    ctx.stroke();
    ctx.fillStyle = '#fff6ed';
    ctx.fillRect(e.x - 8, e.y + ry * 0.2, 6, 8);
    ctx.fillRect(e.x + 2, e.y + ry * 0.2, 6, 8);
  }

  function drawEntities() {
    for (const e of state.entities) {
      if (e.kind === 'enemy') {
        drawMonster(e);
      } else if (e.kind === 'trap') {
        const baseX = e.x - e.w * 0.5;
        const baseY = e.y - e.h * 0.5;
        ctx.fillStyle = e.active ? '#5f6e7f' : '#3e4752';
        roundedRectPath(baseX, baseY, e.w, e.h, 6);
        ctx.fill();
        const trimGrad = ctx.createLinearGradient(0, baseY, 0, baseY + e.h);
        trimGrad.addColorStop(0, '#dbf3ff');
        trimGrad.addColorStop(1, '#95afbf');
        ctx.fillStyle = trimGrad;
        ctx.fillRect(baseX + 4, baseY + 4, e.w - 8, 4);

        ctx.fillStyle = '#ff7c68';
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(e.x + i * 13, baseY + 2);
          ctx.lineTo(e.x + i * 13 + 5, baseY - 12);
          ctx.lineTo(e.x + i * 13 + 10, baseY + 2);
          ctx.fill();
        }
      } else {
        const c = '#84ffa5';
        const maxHp = Math.max(1, e.maxHp);
        const progressRatio = 1 - (Math.max(0, e.hp) / maxHp);
        const scale = POWER_PROGRESS_MIN_SCALE + progressRatio * POWER_PROGRESS_SCALE_GAIN;
        const visualR = e.r * scale;
        const pulse = POWER_PULSE_BASE
          + Math.sin(state.totalTime * POWER_PULSE_SPEED + e.x * POWER_PULSE_OFFSET) * POWER_PULSE_AMPLITUDE;

        const aura = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, visualR * 1.6);
        aura.addColorStop(0, 'rgba(132, 255, 165, 0.45)');
        aura.addColorStop(1, 'rgba(132, 255, 165, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(e.x, e.y, visualR * 1.6 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - visualR - POWER_UP_DIAMOND_OFFSET);
        ctx.lineTo(e.x + visualR + POWER_UP_DIAMOND_OFFSET, e.y);
        ctx.lineTo(e.x, e.y + visualR + POWER_UP_DIAMOND_OFFSET);
        ctx.lineTo(e.x - visualR - POWER_UP_DIAMOND_OFFSET, e.y);
        ctx.fill();
        ctx.strokeStyle = '#ebffef';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#edfff2';
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - visualR * 0.6);
        ctx.lineTo(e.x + visualR * 0.25, e.y);
        ctx.lineTo(e.x, e.y + visualR * 0.6);
        ctx.lineTo(e.x - visualR * 0.25, e.y);
        ctx.fill();

        const progressWidth = visualR * POWER_PROGRESS_BAR_WIDTH_MULTIPLIER;
        const progressHeight = 6;
        const barX = e.x - progressWidth * 0.5;
        const barY = e.y + visualR + 12;
        ctx.fillStyle = 'rgba(10, 20, 28, 0.84)';
        ctx.fillRect(barX, barY, progressWidth, progressHeight);
        ctx.fillStyle = '#e2fff1';
        ctx.fillRect(barX + 1, barY + 1, Math.max(0, (progressWidth - 2) * progressRatio), progressHeight - 2);
        ctx.fillStyle = '#1d2d31';
        const icon = POWER_TYPE_ICONS[e.powerType];
        if (!icon) console.warn(`Unknown power type: ${e.powerType}. Valid types are: growth. Defaulting to ?.`);
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon || '?', e.x, e.y + POWER_UP_ICON_Y_OFFSET);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      }
    }
  }

  function drawFx() {
    for (const f of state.fx) {
      const alpha = Math.min(1, f.ttl * 2);
      if (f.type === 'loss') {
        ctx.fillStyle = `rgba(255, 103, 91, ${alpha})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 22 * (1.2 - f.ttl), 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'pickup') {
        ctx.fillStyle = `rgba(141, 255, 186, ${alpha})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 28 * (1.4 - f.ttl), 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'hit') {
        ctx.strokeStyle = `rgba(124, 234, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 32 * (1.4 - f.ttl), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (state.damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 80, 80, ${state.damageFlash * 0.5})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function draw() {
    drawParallax();
    drawEntities();
    drawProjectiles();
    drawArmy();
    drawFx();
    drawArmyBar();

    if (!state.running) {
      ctx.fillStyle = 'rgba(8, 12, 18, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.victory ? 'All Levels Complete' : 'Army Defeated', canvas.width * 0.5, canvas.height * 0.46);
      ctx.font = '28px sans-serif';
      ctx.fillText(`Final Score: ${Math.floor(state.score)}`, canvas.width * 0.5, canvas.height * 0.54);
    }
  }

  function updateHud() {
    levelEl.textContent = `${Math.min(state.level + 1, LEVEL_COUNT)}/${LEVEL_COUNT}`;
    const mins = Math.floor(state.timeInLevel / 60);
    const secs = Math.floor(state.timeInLevel % 60).toString().padStart(2, '0');
    timeEl.textContent = `${mins}:${secs}`;
    armyEl.textContent = `${state.armySize}`;
    scoreEl.textContent = `${Math.floor(state.score)}`;
  }

  function pointerX(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX - rect.left) / rect.width;
    return x * canvas.width;
  }

  function bindControls() {
    const set = (e) => {
      state.touchTargetX = pointerX(e);
      e.preventDefault();
    };

    canvas.addEventListener('pointerdown', (e) => {
      state.pointerActive = true;
      set(e);
    }, { passive: false });
    canvas.addEventListener('pointermove', (e) => {
      if (state.pointerActive || e.pressure > 0 || e.buttons > 0) set(e);
    }, { passive: false });
    canvas.addEventListener('pointerup', () => {
      state.pointerActive = false;
      state.touchTargetX = null;
    });
    canvas.addEventListener('pointercancel', () => {
      state.pointerActive = false;
      state.touchTargetX = null;
    });
    window.addEventListener('keydown', (e) => {
      updatePlayerFromKeyboard(e);
      clampPlayerX();
    });
  }

  bindControls();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  updateHud();
  requestAnimationFrame(frame);
})();
