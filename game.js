(() => {
  const LEVEL_COUNT = 5;
  const LEVEL_DURATION = 240;
  const BASE_SCROLL = 260;
  const GRACE_SECONDS = 2.8;
  const PLAYER_BOTTOM_PADDING = 170;
  const PLAYER_LATERAL_SPEED = 760;
  const KEYBOARD_MOVEMENT_DISTANCE = 180;
  const BASE_ENEMY_HP = 1;
  const POWER_HITS_BASE = 3;
  const POWER_HITS_PER_LEVEL = 1;
  const ENEMY_HP_LEVEL_THRESHOLD = 2;
  const ENEMY_HP_LEVEL_BONUS = 1;
  const ENEMY_HP_FLANK_BONUS = 1;
  const BASE_VOLLEY_COUNT = 1;
  const MAX_VOLLEY_SIZE = 9;
  const ARMY_VOLLEY_DIVISOR = 12;
  const RANGED_VOLLEY_DIVISOR = 4;
  const MAX_EXTRA_SPAWN_PROBABILITY = 0.72;
  const DENSITY_SPAWN_MULTIPLIER = 0.36;
  const MIN_FIRE_INTERVAL = 0.14;
  const BASE_FIRE_INTERVAL = 0.32;
  const MAX_FIRE_REDUCTION = 0.16;
  const RANGED_FIRE_COEFFICIENT = 0.006;
  const MAX_PROJECTILE_SPREAD = 220;
  const BASE_PROJECTILE_SPREAD = 70;
  const SPREAD_PER_PROJECTILE = 22;
  const BASE_PROJECTILE_SPEED = 600;
  const PROJECTILE_SPEED_PER_LEVEL = 35;
  const PROJECTILE_SPEED_PER_RANGED_POINT = 6;
  const PROJECTILE_OFFSCREEN_THRESHOLD = -40;
  const POWER_PROGRESS_MIN_SCALE = 0.88;
  const POWER_PROGRESS_SCALE_GAIN = 0.22;
  const POWER_UP_DIAMOND_OFFSET = 3;
  const POWER_UP_ICON_Y_OFFSET = 1;
  const POWER_TYPE_ICONS = { growth: '+', shield: 'S', speed: '>>', role: 'R' };

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('status');
  const levelEl = document.getElementById('levelLabel');
  const timeEl = document.getElementById('timeLabel');
  const armyEl = document.getElementById('armyLabel');
  const scoreEl = document.getElementById('scoreLabel');
  const rolesEl = document.getElementById('rolesLabel');

  const state = {
    running: true,
    level: 0,
    timeInLevel: 0,
    totalTime: 0,
    score: 0,
    speedBoostUntil: 0,
    shieldUntil: 0,
    checkpointTime: 0,
    checkpointArmy: 0,
    armySize: 18,
    role: { melee: 18, ranged: 0, support: 0 },
    gracePool: [],
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
    pointerActive: false,
    levelDefs: []
  };

  function createLevels() {
    const defs = [];
    for (let i = 0; i < LEVEL_COUNT; i++) {
      const levelSpeed = BASE_SCROLL + i * 35;
      const density = 1 + i * 0.27;
      const events = [];
      const segmentLength = 16;
      for (let seg = 0; seg < LEVEL_DURATION / segmentLength; seg++) {
        const baseT = seg * segmentLength;
        const laneA = 0.18 + ((seg * 37 + i * 11) % 64) / 100;
        const laneB = 0.18 + ((seg * 53 + i * 7 + 21) % 64) / 100;
        const laneC = 0.18 + ((seg * 29 + i * 13 + 44) % 64) / 100;

        events.push({ t: baseT + 1, kind: 'enemy', pattern: 'straight', x: laneA });
        events.push({ t: baseT + 2.2, kind: 'enemy', pattern: 'straight', x: laneB });
        events.push({ t: baseT + 3.5, kind: 'trap', pattern: seg % 3 === 0 ? 'timed' : 'static', x: laneB });
        events.push({ t: baseT + 5, kind: 'enemy', pattern: seg % 2 === 0 ? 'zigzag' : 'straight', x: laneC });

        if (seg % 2 === 1) {
          events.push({ t: baseT + 7, kind: 'enemy', pattern: 'flank', x: seg % 4 === 1 ? 0.05 : 0.95 });
        }
        if (seg % 2 === 0) {
          events.push({ t: baseT + 8.2, kind: 'power', p: seg % 4 === 0 ? 'shield' : 'speed', x: laneC });
        }
        if (seg % 3 === 0) {
          events.push({ t: baseT + 9.5, kind: 'power', p: 'growth', x: laneA });
        }
        if (seg % 4 === 2) {
          events.push({ t: baseT + 10.5, kind: 'power', p: 'shield', x: laneB });
        }
        if (seg % 5 === 1) {
          events.push({ t: baseT + 12, kind: 'power', p: 'speed', x: laneC });
        }
        if (seg % 4 === 0) {
          events.push({ t: baseT + 14, kind: 'power', p: 'role', x: (laneA + laneC) * 0.5 });
        }
      }
      defs.push({ speed: levelSpeed, density, events: events.sort((a, b) => a.t - b.t) });
    }
    return defs;
  }

  state.levelDefs = createLevels();
  primeGrace(state.armySize);

  function primeGrace(count) {
    const expiry = state.totalTime + GRACE_SECONDS;
    for (let i = 0; i < count; i++) state.gracePool.push(expiry);
  }

  function spawnEntity(ev) {
    const y = -30;
    const x = ev.x * canvas.width;
    const baseSpeed = currentSpeed() * (0.8 + Math.random() * 0.25);

    if (ev.kind === 'enemy') {
      const hp = BASE_ENEMY_HP
        + (state.level >= ENEMY_HP_LEVEL_THRESHOLD ? ENEMY_HP_LEVEL_BONUS : 0)
        + (ev.pattern === 'flank' ? ENEMY_HP_FLANK_BONUS : 0);
      state.entities.push({
        kind: 'enemy',
        x,
        y,
        r: 24,
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
        w: 74,
        h: 24,
        pattern: ev.pattern,
        active: true,
        timer: 0,
        speed: currentSpeed() * 0.95,
      });
      return;
    }

    if (ev.kind === 'power') {
      state.entities.push({
        kind: 'power',
        x,
        y,
        r: 24,
        hp: POWER_HITS_BASE + state.level * POWER_HITS_PER_LEVEL,
        powerType: ev.p,
        speed: currentSpeed() * 0.92,
      });
    }
  }

  function currentSpeed() {
    const levelDef = state.levelDefs[state.level];
    const milestoneBoost = Math.floor(state.score / 500) * 12;
    const progressBoost = (state.timeInLevel / LEVEL_DURATION) * 80;
    const speedBoost = state.totalTime < state.speedBoostUntil ? 60 : 0;
    return levelDef.speed + milestoneBoost + progressBoost + speedBoost;
  }

  function projectileVolleySize() {
    return Math.min(
      MAX_VOLLEY_SIZE,
      BASE_VOLLEY_COUNT + Math.floor(state.armySize / ARMY_VOLLEY_DIVISOR) + Math.floor(state.role.ranged / RANGED_VOLLEY_DIVISOR)
    );
  }

  function projectileFireInterval() {
    return Math.max(MIN_FIRE_INTERVAL, BASE_FIRE_INTERVAL - Math.min(MAX_FIRE_REDUCTION, state.role.ranged * RANGED_FIRE_COEFFICIENT));
  }

  function fireProjectiles() {
    const volley = projectileVolleySize();
    const spread = Math.min(MAX_PROJECTILE_SPREAD, BASE_PROJECTILE_SPREAD + volley * SPREAD_PER_PROJECTILE);
    for (let i = 0; i < volley; i++) {
      const slot = volley === 1 ? 0.5 : i / (volley - 1);
      const offset = (slot - 0.5) * spread;
      state.projectiles.push({
        x: state.playerX + offset,
        y: state.playerY - 45,
        r: 5,
        speed: BASE_PROJECTILE_SPEED + state.level * PROJECTILE_SPEED_PER_LEVEL + state.role.ranged * PROJECTILE_SPEED_PER_RANGED_POINT,
      });
    }
  }

  function removeExpiredGrace() {
    state.gracePool = state.gracePool.filter((t) => t > state.totalTime);
  }

  function vulnerableUnits() {
    removeExpiredGrace();
    return Math.max(0, state.armySize - state.gracePool.length);
  }

  function loseUnits(count, reason) {
    if (state.totalTime < state.shieldUntil) {
      state.fx.push({ type: 'shield', x: state.playerX, y: state.playerY - 35, ttl: 0.32 });
      return;
    }
    let remaining = count;

    const vuln = vulnerableUnits();
    const fromVulnerable = Math.min(vuln, remaining);
    state.armySize -= fromVulnerable;
    remaining -= fromVulnerable;

    if (remaining > 0) {
      state.armySize = Math.max(0, state.armySize - remaining);
      state.gracePool.splice(0, remaining);
    }

    trimRoles();
    state.damageFlash = 0.18;
    state.fx.push({ type: 'loss', x: state.playerX + (Math.random() - 0.5) * 80, y: state.playerY - 20, ttl: 0.5 });
    statusEl.textContent = `${reason}: -${count} units`;

    if (state.armySize <= 0) {
      recoverAtCheckpoint();
    }
  }

  function trimRoles() {
    let totalRoles = state.role.melee + state.role.ranged + state.role.support;
    while (totalRoles > state.armySize) {
      if (state.role.support > 0) state.role.support--;
      else if (state.role.ranged > 0) state.role.ranged--;
      else if (state.role.melee > 0) state.role.melee--;
      totalRoles--;
    }
  }

  function addUnits(count) {
    state.armySize += count;
    primeGrace(count);
    state.role.melee += count;
  }

  function applyPower(type) {
    if (type === 'growth') {
      const gain = 4 + Math.floor(Math.random() * 4);
      addUnits(gain);
      state.score += 90;
      statusEl.textContent = `Growth pickup: +${gain} units`;
    } else if (type === 'shield') {
      state.shieldUntil = state.totalTime + 7;
      state.score += 70;
      statusEl.textContent = 'Shield active for 7s';
    } else if (type === 'speed') {
      state.speedBoostUntil = state.totalTime + 6;
      state.score += 60;
      statusEl.textContent = 'Speed boost active for 6s';
    } else {
      if (state.role.melee % 2 === 0) state.role.ranged += 3;
      else state.role.support += 2;
      addUnits(2);
      state.score += 120;
      statusEl.textContent = 'Role pickup: formation expanded';
    }
  }

  function recoverAtCheckpoint() {
    state.timeInLevel = state.checkpointTime;
    state.armySize = Math.max(10, state.checkpointArmy || 12);
    state.role = { melee: state.armySize, ranged: 0, support: 0 };
    state.gracePool = [];
    primeGrace(state.armySize);
    state.entities = [];
    state.projectiles = [];
    state.fireTimer = 0;
    state.fx.push({ type: 'respawn', x: state.playerX, y: state.playerY - 20, ttl: 1.1 });
    statusEl.textContent = 'Army wiped. Respawned at checkpoint.';
  }

  function updateCheckpoint() {
    const p = state.timeInLevel / LEVEL_DURATION;
    const next = p >= 0.75 ? 0.75 : p >= 0.5 ? 0.5 : p >= 0.25 ? 0.25 : 0;
    const targetTime = next * LEVEL_DURATION;
    if (targetTime > state.checkpointTime) {
      state.checkpointTime = targetTime;
      state.checkpointArmy = state.armySize;
      statusEl.textContent = `Checkpoint ${Math.round(next * 100)}% reached`;
    }
  }

  function overlapsCircleRect(cx, cy, cr, rx, ry, rw, rh) {
    const nx = Math.max(rx, Math.min(cx, rx + rw));
    const ny = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy <= cr * cr;
  }

  function formationRadius() {
    return 20 + Math.min(66, Math.sqrt(state.armySize) * 8);
  }

  function updateEntities(dt) {
    for (const e of state.entities) {
      if (e.kind === 'enemy') {
        if (e.pattern === 'zigzag') {
          e.phase += dt * 4;
          e.x += Math.sin(e.phase) * dt * 120;
        } else if (e.pattern === 'flank') {
          const dir = state.playerX > e.x ? 1 : -1;
          e.x += dir * dt * 160;
        }
        e.y += e.speed * dt;
      } else if (e.kind === 'trap') {
        e.y += e.speed * dt;
        if (e.pattern === 'timed') {
          e.timer += dt;
          e.active = Math.sin(e.timer * 5) > -0.1;
        }
      } else {
        e.y += e.speed * dt;
      }
    }

    const px = state.playerX;
    const py = state.playerY;
    const pr = formationRadius();

    state.entities = state.entities.filter((e) => {
      if (e.y > canvas.height + 120) return false;

      if (e.kind === 'enemy') {
        const dx = e.x - px;
        const dy = e.y - (py - 30);
        if (dx * dx + dy * dy < (e.r + pr) ** 2) {
          const supportShield = Math.min(3, Math.floor(state.role.support / 3));
          loseUnits(Math.max(1, 3 - supportShield), 'Enemy hit');
          state.score += 10 + state.role.ranged;
          return false;
        }
      } else if (e.kind === 'trap') {
        if (e.active && overlapsCircleRect(px, py - 20, pr, e.x - e.w * 0.5, e.y - e.h * 0.5, e.w, e.h)) {
          loseUnits(2, 'Trap hit');
          return false;
        }
      } else {
        const dx = e.x - px;
        const dy = e.y - py;
        if (dx * dx + dy * dy < (e.r + pr) ** 2) {
          loseUnits(1, 'Power-up collision');
          e.destroyed = true;
          return false;
        }
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
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        if (dx * dx + dy * dy <= (e.r + p.r) ** 2) {
          p.destroyed = true;
          if (e.kind === 'power') {
            e.hp -= 1;
            state.fx.push({ type: 'hit', x: e.x, y: e.y, ttl: 0.18 });
            if (e.hp <= 0) {
              e.destroyed = true;
              applyPower(e.powerType);
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
        spawnEntity({ t: ev.t, kind: 'enemy', pattern: 'straight', x: Math.random() * 0.84 + 0.08 });
      }
    }
  }

  function nextLevel() {
    state.level += 1;
    if (state.level >= LEVEL_COUNT) {
      state.running = false;
      statusEl.textContent = `Victory! Final score: ${state.score}`;
      return;
    }
    state.timeInLevel = 0;
    state.checkpointTime = 0;
    state.checkpointArmy = state.armySize;
    state.entities = [];
    state.projectiles = [];
    state.levelDefs[state.level] = createLevels()[state.level];
    statusEl.textContent = `Level ${state.level + 1} start`;
  }

  function update(dt) {
    if (!state.running) return;

    state.totalTime += dt;
    state.timeInLevel += dt;
    state.score += dt * (8 + state.role.ranged * 0.8);

    if (state.touchTargetX !== null) {
      const delta = state.touchTargetX - state.playerX;
      state.playerX += Math.sign(delta) * Math.min(Math.abs(delta), dt * PLAYER_LATERAL_SPEED);
    }

    const margin = 85;
    state.playerX = Math.max(margin, Math.min(canvas.width - margin, state.playerX));

    state.bgOffset += dt * currentSpeed() * 0.13;
    state.roadOffset += dt * currentSpeed();

    spawnFromTimeline();
    updateEntities(dt);
    state.fireTimer -= dt;
    const fireInterval = projectileFireInterval();
    while (state.fireTimer <= 0) {
      fireProjectiles();
      state.fireTimer += fireInterval;
    }
    updateProjectiles(dt);
    updateCheckpoint();

    if (state.timeInLevel >= LEVEL_DURATION) nextLevel();

    state.damageFlash = Math.max(0, state.damageFlash - dt);

    state.fx = state.fx.filter((f) => {
      f.ttl -= dt;
      return f.ttl > 0;
    });

    updateHud();
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

    const roadTopWidth = w * 0.32;
    const roadBottomWidth = w * 0.92;
    const roadCenter = w * 0.5;
    const horizonY = 90;

    ctx.beginPath();
    ctx.moveTo(roadCenter - roadTopWidth * 0.5, horizonY);
    ctx.lineTo(roadCenter + roadTopWidth * 0.5, horizonY);
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
      const t = (y - horizonY) / (h - horizonY);
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
    const r = formationRadius();
    const count = Math.min(state.armySize, 90);

    for (let i = 0; i < count; i++) {
      const a = (i / Math.max(1, count)) * Math.PI * 2;
      const ring = 0.35 + ((i % 7) / 7) * 0.9;
      const ux = state.playerX + Math.cos(a) * r * ring * 0.75;
      const uy = state.playerY + Math.sin(a) * r * ring * 0.55;

      const protectedUnit = i < state.gracePool.length;
      ctx.fillStyle = protectedUnit ? '#8fe4ff' : '#f3fbff';
      ctx.beginPath();
      ctx.arc(ux, uy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.totalTime < state.shieldUntil) {
      ctx.strokeStyle = '#8fd8ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(state.playerX, state.playerY, r + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#6da4d8';
    ctx.fillRect(state.playerX - 8, state.playerY - r - 26, 16, 18);
    ctx.fillStyle = '#b9dbff';
    ctx.fillRect(state.playerX - 3, state.playerY - r - 36, 6, 10);
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
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
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
        const c = e.powerType === 'growth' ? '#7cff6b' : e.powerType === 'shield' ? '#6bd4ff' : e.powerType === 'speed' ? '#ffd56b' : '#d499ff';
        const maxHp = POWER_HITS_BASE + state.level * POWER_HITS_PER_LEVEL;
        const completion = 1 - (Math.max(0, e.hp) / Math.max(1, maxHp));
        const scale = POWER_PROGRESS_MIN_SCALE + completion * POWER_PROGRESS_SCALE_GAIN;
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
        const progressWidth = visualR * 2.1;
        const progressHeight = 6;
        const barX = e.x - progressWidth * 0.5;
        const barY = e.y + visualR + 12;
        ctx.fillStyle = 'rgba(12, 18, 28, 0.8)';
        ctx.fillRect(barX, barY, progressWidth, progressHeight);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(barX + 1, barY + 1, Math.max(0, (progressWidth - 2) * completion), progressHeight - 2);
        ctx.fillStyle = '#1c2433';
        const icon = POWER_TYPE_ICONS[e.powerType];
        if (!icon) console.warn(`Unknown power type: ${e.powerType}. Valid types are: growth, shield, speed, role. Defaulting to ?.`);
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
      } else if (f.type === 'shield' || f.type === 'respawn' || f.type === 'hit') {
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

    if (!state.running) {
      ctx.fillStyle = 'rgba(8, 12, 18, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('All Levels Complete', canvas.width * 0.5, canvas.height * 0.46);
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
    rolesEl.textContent = `M:${state.role.melee} R:${state.role.ranged} S:${state.role.support}`;
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
      if (e.key === 'ArrowLeft') state.touchTargetX = state.playerX - KEYBOARD_MOVEMENT_DISTANCE;
      if (e.key === 'ArrowRight') state.touchTargetX = state.playerX + KEYBOARD_MOVEMENT_DISTANCE;
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
