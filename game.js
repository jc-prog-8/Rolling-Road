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

  function drawParallax() {
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0f1728';
    ctx.fillRect(0, 0, w, h);

    for (let layer = 0; layer < 3; layer++) {
      const speed = (layer + 1) * 0.2;
      const yOffset = (state.bgOffset * speed) % 140;
      ctx.fillStyle = layer === 0 ? '#152036' : layer === 1 ? '#1a2a47' : '#22355d';
      for (let y = -140 + yOffset; y < h; y += 140) {
        const pad = 120 - layer * 28;
        ctx.fillRect(pad, y, w - pad * 2, 6 + layer * 3);
      }
    }

    const roadTopWidth = w * ROAD_TOP_WIDTH_RATIO;
    const roadBottomWidth = w * ROAD_BOTTOM_WIDTH_RATIO;
    const roadCenter = w * 0.5;
    ctx.beginPath();
    ctx.moveTo(roadCenter - roadTopWidth * 0.5, ROAD_HORIZON_Y);
    ctx.lineTo(roadCenter + roadTopWidth * 0.5, ROAD_HORIZON_Y);
    ctx.lineTo(roadCenter + roadBottomWidth * 0.5, h);
    ctx.lineTo(roadCenter - roadBottomWidth * 0.5, h);
    ctx.closePath();
    ctx.fillStyle = '#283244';
    ctx.fill();

    ctx.strokeStyle = '#445779';
    ctx.lineWidth = 4;
    ctx.stroke();

    const stripeGap = 70;
    const stripeLen = 26;
    const base = state.roadOffset % stripeGap;
    for (let y = -stripeGap + base; y < h; y += stripeGap) {
      const t = (y - ROAD_HORIZON_Y) / (h - ROAD_HORIZON_Y);
      const x = roadCenter;
      const widthScale = Math.max(0.1, t);
      ctx.strokeStyle = '#a8b8d7';
      ctx.lineWidth = 2 + widthScale * 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + stripeLen * (0.5 + widthScale));
      ctx.stroke();
    }
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

      ctx.fillStyle = '#f3fbff';
      ctx.beginPath();
      ctx.arc(ux, uy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#6da4d8';
    ctx.fillRect(state.playerX - 8, state.playerY - h - 26, 16, 18);
    ctx.fillStyle = '#b9dbff';
    ctx.fillRect(state.playerX - 3, state.playerY - h - 36, 6, 10);
  }

  function drawArmyBar() {
    const barHeight = 26;
    const barY = canvas.height - barHeight;
    const fillRatio = Math.min(1, state.armySize / ARMY_BAR_MAX_UNITS);
    ctx.fillStyle = 'rgba(8, 12, 18, 0.85)';
    ctx.fillRect(0, barY, canvas.width, barHeight);
    ctx.fillStyle = '#84d4ff';
    ctx.fillRect(0, barY, canvas.width * fillRatio, barHeight);
    ctx.strokeStyle = '#d7f2ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, barY, canvas.width, barHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ARMY ${state.armySize}`, 12, barY + barHeight * 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  function drawProjectiles() {
    for (const p of state.projectiles) {
      ctx.fillStyle = '#c8f1ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4cbfff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 8);
      ctx.lineTo(p.x, p.y - 12);
      ctx.stroke();
    }
  }

  function drawEntities() {
    for (const e of state.entities) {
      if (e.kind === 'enemy') {
        ctx.fillStyle = e.pattern === 'flank' ? '#ff9c6f' : e.pattern === 'zigzag' ? '#ff7a91' : '#ff5d5d';
        ctx.beginPath();
        ctx.ellipse(e.x, e.y, e.w * 0.5, e.h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4d1414';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#2a0e0e';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.kind === 'trap') {
        ctx.fillStyle = e.active ? '#d4d4d4' : '#707070';
        ctx.fillRect(e.x - e.w * 0.5, e.y - e.h * 0.5, e.w, e.h);
        ctx.fillStyle = '#991818';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(e.x + i * 14, e.y - e.h * 0.5);
          ctx.lineTo(e.x + i * 14 + 5, e.y - e.h * 0.5 - 10);
          ctx.lineTo(e.x + i * 14 + 10, e.y - e.h * 0.5);
          ctx.fill();
        }
      } else {
        const c = '#7cff6b';
        const maxHp = Math.max(1, e.maxHp);
        const progressRatio = 1 - (Math.max(0, e.hp) / maxHp);
        const scale = POWER_PROGRESS_MIN_SCALE + progressRatio * POWER_PROGRESS_SCALE_GAIN;
        const visualR = e.r * scale;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - visualR - POWER_UP_DIAMOND_OFFSET);
        ctx.lineTo(e.x + visualR + POWER_UP_DIAMOND_OFFSET, e.y);
        ctx.lineTo(e.x, e.y + visualR + POWER_UP_DIAMOND_OFFSET);
        ctx.lineTo(e.x - visualR - POWER_UP_DIAMOND_OFFSET, e.y);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        const progressWidth = visualR * POWER_PROGRESS_BAR_WIDTH_MULTIPLIER;
        const progressHeight = 6;
        const barX = e.x - progressWidth * 0.5;
        const barY = e.y + visualR + 12;
        ctx.fillStyle = 'rgba(12, 18, 28, 0.8)';
        ctx.fillRect(barX, barY, progressWidth, progressHeight);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(barX + 1, barY + 1, Math.max(0, (progressWidth - 2) * progressRatio), progressHeight - 2);
        ctx.fillStyle = '#1c2433';
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
        ctx.fillStyle = `rgba(255, 90, 90, ${alpha})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 18 * (1.2 - f.ttl), 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'pickup') {
        ctx.fillStyle = `rgba(130, 255, 170, ${alpha})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 22 * (1.4 - f.ttl), 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'hit') {
        ctx.strokeStyle = `rgba(130, 220, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 26 * (1.4 - f.ttl), 0, Math.PI * 2);
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
