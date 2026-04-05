(() => {
  const DEFAULT_RUN_DURATION_MINUTES = 10;
  const DEFAULT_LEVEL_DURATION = DEFAULT_RUN_DURATION_MINUTES * 60;
  const DEFAULT_BASE_SCROLL = 85;
  const DEFAULT_TARGET_ARMY_SIZE = 200;
  const DEFAULT_ENEMY_RATE_START = 0.35;
  const DEFAULT_ENEMY_RATE_END = 1.75;
  const DEFAULT_POWER_RATE_START = 0.05;
  const DEFAULT_POWER_RATE_END = 0.2;
  const DEFAULT_STARTING_ARMY_SIZE = 1;
  const DEFAULT_STARTING_ARMY_SIZE_MAX = 30;
  const DEFAULT_CANVAS_HEIGHT_PERCENT = 85;
  const DEFAULT_CANVAS_WIDTH = 1280;
  const BASE_FIRE_RATE_PER_SECOND = 1;
  const TARGET_FIRE_RATE_PER_SECOND = 20;
  let RUN_DURATION_MINUTES = DEFAULT_RUN_DURATION_MINUTES;
  let LEVEL_DURATION = DEFAULT_LEVEL_DURATION;
  let BASE_SCROLL = DEFAULT_BASE_SCROLL;
  let TARGET_ARMY_SIZE = DEFAULT_TARGET_ARMY_SIZE;
  const PLAYER_BOTTOM_PADDING = 170;
  const KEYBOARD_MOVEMENT_STEP = 180;
  const ROAD_HORIZON_Y = 20;
  const ROAD_TOP_MIN_X = 0.14;
  const ROAD_TOP_SPAN_X = 0.72;
  const ROAD_LANE_COUNT = 3;
  const ALL_ROAD_LANES = Array.from({ length: ROAD_LANE_COUNT }, (_, i) => i);
  const ENEMY_SIZE_SCALE = 0.75;
  const ENEMY_WIDTH = 108 * ENEMY_SIZE_SCALE;
  const ENEMY_HEIGHT = 69 * ENEMY_SIZE_SCALE;
  const POWER_UP_RADIUS = 34;
  const BASE_ENEMY_HP = 2;
  const ENEMY_HP_LEVEL_THRESHOLD = 2;
  const ENEMY_HP_LEVEL_BONUS = 1;
  const ENEMY_HP_FLANK_BONUS = 1;
  const ENEMY_RATE_PROGRESS_CURVE = 1.12;
  const POWER_RATE_PROGRESS_CURVE = 0.92;
  const TRAP_RATE_PROGRESS_CURVE = 1.2;
  const TRAP_RATE_START = 0.08;
  const TRAP_RATE_END = 0.55;
  const MIN_SPAWN_RATE = 0.01;
  const ENEMY_PATTERN_STRAIGHT_THRESHOLD = 0.55;
  const ENEMY_PATTERN_ZIGZAG_THRESHOLD = 0.85;
  const TRAP_PATTERN_STATIC_PROBABILITY = 0.5;
  const LEVEL_SPEED_STEP = 35;
  const PROGRESS_SPEED_BOOST = 90;
  const MILESTONE_SCORE_INTERVAL = 700;
  const MILESTONE_SPEED_BOOST = 10;
  const SPAWN_JITTER_MIN = 0.82;
  const SPAWN_JITTER_MAX = 1.18;
  const VOLLEY_WIDTH_MULTIPLIER = 1.1;
  const SMALL_ARMY_CENTER_FIRE_THRESHOLD = 6;
  const BASE_PROJECTILE_SPEED = 600;
  const PROJECTILE_SPEED_PER_LEVEL = 22;
  const PROJECTILE_OFFSCREEN_THRESHOLD = -40;
  const POWER_PROGRESS_MIN_SCALE = 0.72;
  const POWER_PROGRESS_SCALE_GAIN = 0.14;
  const POWER_PROGRESS_BAR_WIDTH_MULTIPLIER = 2.1;
  const POWER_UP_DIAMOND_OFFSET = 2;
  const POWER_UP_ICON_Y_OFFSET = 1;
  const SPAWN_Y_OFFSET = -16;
  const ENEMY_SPEED_MIN_MULTIPLIER = 0.5;
  const ENEMY_SPEED_RANDOM_RANGE = 0.12;
  const ENEMY_ZIGZAG_PHASE_SPEED = 2.6;
  const ENEMY_ZIGZAG_SWAY_SPEED = 70;
  const POWER_UP_SPEED_MULTIPLIER = 0.44;
  const POWER_PICKUP_Y_OFFSET = 20;
  const ENEMY_COLLISION_WIDTH_FACTOR = 0.45;
  const ENEMY_COLLISION_HEIGHT_FACTOR = 0.4;
  const ENEMY_COLLISION_Y_OFFSET = 20;
  const TRAP_COLLISION_BOUND_REDUCTION = 12;
  const ARMY_SQUARE_MIN_RADIUS = 20;
  const ARMY_SQUARE_SIZE_RATIO = 0.92;
  const ROAD_TOP_WIDTH_RATIO = 0.78;
  const ROAD_BOTTOM_WIDTH_RATIO = 1;
  const ENEMY_HOLD_LINE_OFFSET = 64;
  const ENEMY_BREACH_TICK_SECONDS = 1;
  const ENEMY_TRACKING_THRESHOLD_RATIO = 0.3;
  const ENEMY_PLAYER_FOLLOW_LAG_SECONDS = 0.5;
  const ENTITY_CLEANUP_MARGIN = 120;
  const ARMY_BAR_MAX_UNITS = 180;
  const PAUSED_ARMY_MAX = 300;
  const POWER_SHOTS_MAX_VISUAL_SCALE = 30;
  const POWER_SHOTS_MAX_CHARGE = 30;
  const POWER_REWARD_CAP_START = 5;
  const POWER_REWARD_CAP_END = POWER_SHOTS_MAX_CHARGE;
  const SUN_GLOW_RADIUS = 190;
  const MOUNTAIN_LAYER_WIDTH = 260;
  const MOUNTAIN_TILE_START_X = -320;
  const MOUNTAIN_TILE_END_PAD = 320;
  const POWER_PULSE_BASE = 0.85;
  const POWER_PULSE_SPEED = 3.3;
  const POWER_PULSE_OFFSET = 0.02;
  const POWER_PULSE_AMPLITUDE = 0.08;
  let ENEMY_RATE_START = DEFAULT_ENEMY_RATE_START;
  let ENEMY_RATE_END = DEFAULT_ENEMY_RATE_END;
  let POWER_RATE_START = DEFAULT_POWER_RATE_START;
  let POWER_RATE_END = DEFAULT_POWER_RATE_END;
  let CANVAS_HEIGHT_PERCENT = DEFAULT_CANVAS_HEIGHT_PERCENT;
  const ROAD_TILE_INSET_RATIO = 0.06;
  const ROAD_SIDE_LINE_GAP = 34;
  const ROAD_SIDE_LINE_LENGTH = 18;
  const ROAD_CENTER_STRIPE_GAP = 72;
  const ROAD_CENTER_STRIPE_LENGTH = 28;
  const SOLDIER_BODY_X_RATIO = 0.5;
  const SOLDIER_BODY_Y_RATIO = 0.4;
  const SOLDIER_BODY_HEIGHT_RATIO = 1.16;
  const SOLDIER_BODY_RADIUS_SCALE = 2.5;

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('status');
  const levelEl = document.getElementById('levelLabel');
  const timeEl = document.getElementById('timeLabel');
  const armyEl = document.getElementById('armyLabel');
  const scoreEl = document.getElementById('scoreLabel');
  const enemyRateEl = document.getElementById('enemyRateLabel');
  const powerRateEl = document.getElementById('powerRateLabel');
  const fireRateEl = document.getElementById('fireRateLabel');
  const progressEl = document.getElementById('progressLabel');
  const setupScreenEl = document.getElementById('setupScreen');
  const setupFormEl = document.getElementById('setupForm');
  const buildTimestampEl = document.getElementById('buildTimestamp');
  const pauseBtnEl = document.getElementById('pauseBtn');
  const applyChangesBtnEl = document.getElementById('applyChangesBtn');
  const startGameBtnEl = document.getElementById('startGameBtn');
  const resetDefaultsBtnEl = document.getElementById('resetDefaultsBtn');

  if (buildTimestampEl) {
    buildTimestampEl.textContent = 'Build made: 2026-04-05T14:09:48.041Z';
  }

  const state = {
    running: false,
    started: false,
    paused: false,
    victory: false,
    level: 0,
    timeInLevel: 0,
    totalTime: 0,
    score: 0,
    armySize: DEFAULT_STARTING_ARMY_SIZE,
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
    enemySpawnTimer: 0,
    trapSpawnTimer: 0,
    powerSpawnTimer: 0,
    pointerActive: false,
  };

  const setupConfig = {
    runDurationMinutes: {
      defaultValue: DEFAULT_RUN_DURATION_MINUTES,
      min: 3,
      max: 10,
      step: 0.5,
      parse: (value) => Number.parseFloat(value)
    },
    targetArmySize: {
      defaultValue: DEFAULT_TARGET_ARMY_SIZE,
      min: 40,
      max: 200,
      step: 5,
      parse: (value) => Number.parseInt(value, 10)
    },
    enemyRateStart: {
      defaultValue: DEFAULT_ENEMY_RATE_START,
      min: 0.05,
      max: 3.5,
      step: 0.05,
      parse: (value) => Number.parseFloat(value)
    },
    enemyRateEnd: {
      defaultValue: DEFAULT_ENEMY_RATE_END,
      min: 0.05,
      max: 6,
      step: 0.05,
      parse: (value) => Number.parseFloat(value)
    },
    powerRateStart: {
      defaultValue: DEFAULT_POWER_RATE_START,
      min: 0.01,
      max: 1.5,
      step: 0.01,
      parse: (value) => Number.parseFloat(value)
    },
    powerRateEnd: {
      defaultValue: DEFAULT_POWER_RATE_END,
      min: 0.01,
      max: 1.2,
      step: 0.01,
      parse: (value) => Number.parseFloat(value)
    },
    baseScroll: {
      defaultValue: DEFAULT_BASE_SCROLL,
      min: 20,
      max: 520,
      step: 5,
      parse: (value) => Number.parseInt(value, 10)
    },
    startingArmySize: {
      defaultValue: DEFAULT_STARTING_ARMY_SIZE,
      min: 1,
      max: DEFAULT_STARTING_ARMY_SIZE_MAX,
      step: 1,
      parse: (value) => Number.parseInt(value, 10)
    },
    canvasHeightPercent: {
      defaultValue: DEFAULT_CANVAS_HEIGHT_PERCENT,
      min: 40,
      max: 95,
      step: 5,
      parse: (value) => Number.parseInt(value, 10)
    }
  };

  function clampValue(value, cfg) {
    const numeric = Number.isFinite(value) ? value : cfg.defaultValue;
    const clamped = Math.min(cfg.max, Math.max(cfg.min, numeric));
    const steps = Math.round((clamped - cfg.min) / cfg.step);
    const snapped = cfg.min + steps * cfg.step;
    const decimals = `${cfg.step}`.includes('.') ? (`${cfg.step}`.split('.')[1] || '').length : 0;
    return Number(snapped.toFixed(decimals));
  }

  function syncPair(paramName, value, source) {
    const rangeEl = document.getElementById(`${paramName}Range`);
    const inputEl = document.getElementById(`${paramName}Input`);
    if (!rangeEl || !inputEl) return;
    if (source !== 'range') rangeEl.value = `${value}`;
    if (source !== 'input') inputEl.value = `${value}`;
  }

  function setupParameterBindings() {
    for (const [paramName, cfg] of Object.entries(setupConfig)) {
      const rangeEl = document.getElementById(`${paramName}Range`);
      const inputEl = document.getElementById(`${paramName}Input`);
      if (!rangeEl || !inputEl) continue;

      const applyValue = (rawValue, source) => {
        const parsed = cfg.parse(rawValue);
        const nextValue = clampValue(parsed, cfg);
        syncPair(paramName, nextValue, source);
        return nextValue;
      };

      const setDefaults = () => {
        syncPair(paramName, cfg.defaultValue);
      };
      setDefaults();

      rangeEl.addEventListener('input', () => {
        applyValue(rangeEl.value, 'range');
      });
      inputEl.addEventListener('input', () => {
        applyValue(inputEl.value, 'input');
      });
      inputEl.addEventListener('blur', () => {
        applyValue(inputEl.value, 'input');
      });
    }
  }

  const SETUP_STORAGE_KEY = 'rollingRoad.setup_v1';

  function saveSetupToStorage(values) {
    try {
      localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(values));
    } catch (e) {
      // ignore storage errors (e.g., private mode)
    }
  }

  function loadSetupFromStorage() {
    try {
      const raw = localStorage.getItem(SETUP_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveGameStartToAutosave(values) {
    saveSetupToStorage(values);
  }

  function readLiveSettingValues() {
    const values = readSetupValues();
    // Army size when paused can exceed the startup max=30, so read directly
    const armySizeInput = document.getElementById('startingArmySizeInput');
    const rawArmySize = Number.parseInt(armySizeInput?.value, 10);
    values.armySize = Math.max(1, Number.isFinite(rawArmySize) ? rawArmySize : state.armySize);
    return values;
  }

  function currentSettingsMode() {
    if (!state.started) return 'setup';
    if (state.paused) return 'paused';
    if (!state.running) return 'ended';
    return 'playing';
  }

  function setDisabledState(elements, disabled) {
    for (const el of elements) {
      if (!el) continue;
      el.disabled = disabled;
    }
  }

  function updateSettingsUiState() {
    const mode = currentSettingsMode();
    const showSettings = mode !== 'playing';
    const isPaused = mode === 'paused';

    if (setupScreenEl) setupScreenEl.classList.toggle('hidden', !showSettings);

    // Update title and intro text
    const titleEl = document.getElementById('setupTitle');
    if (titleEl) titleEl.textContent = isPaused ? 'Paused – Adjust Settings' : 'Game Setup';
    const introEl = setupScreenEl?.querySelector('.setup-intro');
    if (introEl) {
      introEl.textContent = isPaused
        ? 'Greyed fields cannot change mid-run. Resume when done.'
        : 'Tune the endless run pacing, then start the game.';
    }

    // Start-only fields: grey out when paused (cannot change mid-game)
    const startOnlyParams = ['runDurationMinutes', 'baseScroll', 'canvasHeightPercent'];
    for (const param of startOnlyParams) {
      const field = setupFormEl?.querySelector(`[data-param="${param}"]`);
      if (!field) continue;
      const inputs = Array.from(field.querySelectorAll('input, select'));
      setDisabledState(inputs, isPaused);
      field.classList.toggle('settings-locked', isPaused);
    }

    // startingArmySize: always accessible but label/description/max changes with context
    const armySizeField = setupFormEl?.querySelector('[data-param="startingArmySize"]');
    if (armySizeField) {
      const armySizeLabelEl = armySizeField.querySelector('label');
      const armySizeDescEl = armySizeField.querySelector('.setup-description');
      const armySizeRangeEl = document.getElementById('startingArmySizeRange');
      const armySizeInputEl = document.getElementById('startingArmySizeInput');
      if (armySizeLabelEl) {
        armySizeLabelEl.textContent = isPaused ? 'Current army size' : 'Starting army size';
      }
      if (armySizeDescEl) {
        armySizeDescEl.textContent = isPaused
          ? 'Current number of units in your army.'
          : 'At 1 unit, the army fires exactly 1 projectile per second.';
      }
    const armyMax = isPaused ? PAUSED_ARMY_MAX : DEFAULT_STARTING_ARMY_SIZE_MAX;
      if (armySizeRangeEl) armySizeRangeEl.max = String(armyMax);
      if (armySizeInputEl) armySizeInputEl.max = String(armyMax);
      setupConfig.startingArmySize.max = armyMax;
    }

    // Show Start Game button only when not paused; show Apply Changes when paused
    if (startGameBtnEl) startGameBtnEl.style.display = isPaused ? 'none' : '';
    if (applyChangesBtnEl) applyChangesBtnEl.style.display = isPaused ? '' : 'none';
    if (resetDefaultsBtnEl) resetDefaultsBtnEl.style.display = isPaused ? 'none' : '';
  }

  function syncLiveControlsFromCurrentState() {
    syncPair('enemyRateStart', ENEMY_RATE_START);
    syncPair('enemyRateEnd', ENEMY_RATE_END);
    syncPair('powerRateStart', POWER_RATE_START);
    syncPair('powerRateEnd', POWER_RATE_END);
    syncPair('targetArmySize', TARGET_ARMY_SIZE);
    syncPair('startingArmySize', Math.max(1, state.armySize));
  }

  function applyPausedLiveSettings() {
    if (!state.paused) {
      statusEl.textContent = 'Pause the game to apply changes.';
      return;
    }
    const values = readLiveSettingValues();
    ENEMY_RATE_START = values.enemyRateStart;
    ENEMY_RATE_END = Math.max(values.enemyRateStart, values.enemyRateEnd);
    POWER_RATE_START = values.powerRateStart;
    POWER_RATE_END = Math.min(values.powerRateStart, values.powerRateEnd);
    TARGET_ARMY_SIZE = values.targetArmySize;
    state.armySize = values.armySize;
    syncLiveControlsFromCurrentState();
    updateHud();
    statusEl.textContent = 'Changes applied.';
  }

  function readSetupValues() {
    const values = {};
    for (const [paramName, cfg] of Object.entries(setupConfig)) {
      const inputEl = document.getElementById(`${paramName}Input`);
      const value = inputEl ? cfg.parse(inputEl.value) : cfg.defaultValue;
      values[paramName] = clampValue(value, cfg);
      syncPair(paramName, values[paramName]);
    }
    return values;
  }

  function getDefaultSetupValues() {
    const values = {};
    for (const [paramName, cfg] of Object.entries(setupConfig)) {
      values[paramName] = cfg.defaultValue;
    }
    return values;
  }

  function resetSetupToDefaults() {
    const defaults = getDefaultSetupValues();
    for (const [paramName, value] of Object.entries(defaults)) {
      syncPair(paramName, value);
    }
    saveSetupToStorage(defaults);
    statusEl.textContent = 'Defaults restored.';
  }

  function applySetupValues(values) {
    saveGameStartToAutosave(values);
    RUN_DURATION_MINUTES = values.runDurationMinutes;
    LEVEL_DURATION = RUN_DURATION_MINUTES * 60;
    BASE_SCROLL = values.baseScroll;
    TARGET_ARMY_SIZE = values.targetArmySize;
    ENEMY_RATE_START = values.enemyRateStart;
    ENEMY_RATE_END = Math.max(values.enemyRateStart, values.enemyRateEnd);
    POWER_RATE_START = values.powerRateStart;
    POWER_RATE_END = Math.min(values.powerRateStart, values.powerRateEnd);
    CANVAS_HEIGHT_PERCENT = values.canvasHeightPercent;
    resizeCanvas(CANVAS_HEIGHT_PERCENT);
    state.armySize = values.startingArmySize;
    state.playerX = canvas.width * 0.5;
    state.playerY = canvas.height - PLAYER_BOTTOM_PADDING;
    state.level = 0;
    state.timeInLevel = 0;
    state.totalTime = 0;
    state.score = 0;
    state.entities = [];
    state.projectiles = [];
    state.fx = [];
    state.fireTimer = 1 / currentFireRatePerSecond();
    state.enemySpawnTimer = spawnIntervalFromRate(currentEnemySpawnRate());
    state.trapSpawnTimer = 1 / currentTrapSpawnRate();
    state.powerSpawnTimer = spawnIntervalFromRate(currentPowerSpawnRate());
    state.damageFlash = 0;
    state.victory = false;
    state.running = true;
    state.started = true;
    state.paused = false;
    if (pauseBtnEl) pauseBtnEl.textContent = 'Pause';
    syncLiveControlsFromCurrentState();
    updateSettingsUiState();
    updateHud();
    statusEl.textContent = 'Game started. Tap or drag to steer.';
  }

  function initSetupScreen() {
    setupParameterBindings();
    if (!setupFormEl) return;
    statusEl.textContent = 'Adjust setup options, then tap Start Game.';
    // Load saved setup values (if any) and apply to inputs
    const saved = loadSetupFromStorage();
    if (saved) {
      for (const [paramName, cfg] of Object.entries(setupConfig)) {
        const raw = saved[paramName];
        const next = clampValue(cfg.parse(raw === undefined ? cfg.defaultValue : raw), cfg);
        syncPair(paramName, next);
      }
    }
    updateSettingsUiState();

    // Persist on any input change so users won't lose tweaks accidentally (only at start)
    setupFormEl.addEventListener('input', () => {
      if (!state.paused) {
        const current = readSetupValues();
        saveSetupToStorage(current);
      }
    });
    setupFormEl.addEventListener('submit', (event) => {
      event.preventDefault();
      const setupValues = readSetupValues();
      applySetupValues(setupValues);
      saveSetupToStorage(setupValues);
    });
    applyChangesBtnEl?.addEventListener('click', applyPausedLiveSettings);
    resetDefaultsBtnEl?.addEventListener('click', resetSetupToDefaults);
  }

  function resizeCanvas(canvasHeightPercent) {
    const displayWidth = canvas.offsetWidth > 0 ? canvas.offsetWidth : Math.min(window.innerWidth, 1100);
    const targetDisplayHeight = Math.round(window.innerHeight * canvasHeightPercent / 100);
    const scale = Math.min(2, DEFAULT_CANVAS_WIDTH / Math.max(1, displayWidth));
    canvas.width = Math.round(displayWidth * scale);
    canvas.height = Math.round(targetDisplayHeight * scale);
  }

  function spawnEntity(ev) {
    const y = ROAD_HORIZON_Y + SPAWN_Y_OFFSET;
    const spawnRoadX = Number.isFinite(ev.x) ? ev.x : roadXForLane(ev.laneNumber);
    const x = spawnRoadX * canvas.width;
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
        laneNumber: ev.laneNumber,
        phase: Math.random() * Math.PI * 2,
        trackingPlayer: false,
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
      state.entities.push({
        kind: 'power',
        x,
        y,
        r: POWER_UP_RADIUS,
        shotsHit: 0,
        laneNumber: ev.laneNumber,
        powerType: ev.p,
        speed: currentSpeed() * POWER_UP_SPEED_MULTIPLIER,
      });
    }
  }

  function currentSpeed() {
    const progress = overallProgressRatio();
    const levelBoost = state.level * LEVEL_SPEED_STEP;
    const progressBoost = progress * PROGRESS_SPEED_BOOST;
    const milestoneBoost = Math.floor(state.score / MILESTONE_SCORE_INTERVAL) * MILESTONE_SPEED_BOOST;
    return BASE_SCROLL + levelBoost + progressBoost + milestoneBoost;
  }

  function formationRangeX() {
    return 42 + Math.min(260, Math.sqrt(state.armySize) * 19);
  }

  function formationRangeY() {
    return 24 + Math.min(90, Math.sqrt(state.armySize) * 8);
  }

  function overallProgressRatio() {
    const totalDuration = LEVEL_DURATION;
    const elapsed = state.timeInLevel;
    return Math.max(0, Math.min(1, elapsed / totalDuration));
  }

  function lerp(start, end, ratio) {
    return start + (end - start) * ratio;
  }

  function easedRatio(ratio, curve) {
    return Math.pow(Math.max(0, Math.min(1, ratio)), curve);
  }

  function randomRoadX() {
    return ROAD_TOP_MIN_X + Math.random() * ROAD_TOP_SPAN_X;
  }

  function randomRoadLane(blockedLanes = new Set()) {
    const openLanes = ALL_ROAD_LANES.filter((lane) => !blockedLanes.has(lane));
    const lanePool = openLanes.length > 0 ? openLanes : ALL_ROAD_LANES;
    return lanePool[Math.floor(Math.random() * lanePool.length)];
  }

  function roadXForLane(laneNumber) {
    if (ROAD_LANE_COUNT < 2) return ROAD_TOP_MIN_X + ROAD_TOP_SPAN_X * 0.5;
    const laneRatio = laneNumber / (ROAD_LANE_COUNT - 1);
    return ROAD_TOP_MIN_X + ROAD_TOP_SPAN_X * laneRatio;
  }

  function occupiedPowerLanes() {
    const lanes = new Set();
    for (const entity of state.entities) {
      if (entity.kind === 'power' && Number.isInteger(entity.laneNumber)) {
        lanes.add(entity.laneNumber);
      }
    }
    return lanes;
  }

  function currentEnemySpawnRate() {
    const ratio = easedRatio(overallProgressRatio(), ENEMY_RATE_PROGRESS_CURVE);
    return lerp(ENEMY_RATE_START, ENEMY_RATE_END, ratio);
  }

  function currentPowerSpawnRate() {
    const ratio = easedRatio(overallProgressRatio(), POWER_RATE_PROGRESS_CURVE);
    return lerp(POWER_RATE_START, POWER_RATE_END, ratio);
  }

  function currentTrapSpawnRate() {
    const ratio = easedRatio(overallProgressRatio(), TRAP_RATE_PROGRESS_CURVE);
    return lerp(TRAP_RATE_START, TRAP_RATE_END, ratio);
  }

  function spawnIntervalFromRate(ratePerSecond) {
    const safeRate = Math.max(MIN_SPAWN_RATE, ratePerSecond);
    const jitter = SPAWN_JITTER_MIN + Math.random() * (SPAWN_JITTER_MAX - SPAWN_JITTER_MIN);
    return (1 / safeRate) * jitter;
  }

  function selectEnemyPattern() {
    const roll = Math.random();
    if (roll < ENEMY_PATTERN_STRAIGHT_THRESHOLD) return 'straight';
    if (roll < ENEMY_PATTERN_ZIGZAG_THRESHOLD) return 'zigzag';
    return 'flank';
  }

  function currentFireRatePerSecond() {
    const clampedTarget = Math.max(1, TARGET_ARMY_SIZE);
    const clampedArmy = Math.max(1, state.armySize);
    const targetSpan = Math.max(1, clampedTarget - 1);
    const ratio = Math.max(0, Math.min(1, (clampedArmy - 1) / targetSpan));
    return lerp(BASE_FIRE_RATE_PER_SECOND, TARGET_FIRE_RATE_PER_SECOND, ratio);
  }

  function currentFireInterval() {
    return 1 / currentFireRatePerSecond();
  }

  function fireProjectile() {
    state.projectiles.push({
      x: state.playerX,
      y: state.playerY,
      r: 5,
      speed: BASE_PROJECTILE_SPEED + state.level * PROJECTILE_SPEED_PER_LEVEL,
    });
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
    const fireInterval = currentFireInterval();
    while (state.fireTimer <= 0) {
      fireProjectile();
      state.fireTimer += fireInterval;
    }
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

  function spawnFromRates(dt) {
    state.enemySpawnTimer -= dt;
    while (state.enemySpawnTimer <= 0) {
      const pattern = selectEnemyPattern();
      const laneNumber = randomRoadLane(occupiedPowerLanes());
      spawnEntity({ kind: 'enemy', pattern, laneNumber });
      state.enemySpawnTimer += spawnIntervalFromRate(currentEnemySpawnRate());
    }

    state.trapSpawnTimer -= dt;
    while (state.trapSpawnTimer <= 0) {
      const pattern = Math.random() < TRAP_PATTERN_STATIC_PROBABILITY ? 'static' : 'timed';
      spawnEntity({ kind: 'trap', pattern, x: randomRoadX() });
      state.trapSpawnTimer += spawnIntervalFromRate(currentTrapSpawnRate());
    }

    state.powerSpawnTimer -= dt;
    while (state.powerSpawnTimer <= 0) {
      spawnEntity({ kind: 'power', p: 'growth', laneNumber: randomRoadLane() });
      state.powerSpawnTimer += spawnIntervalFromRate(currentPowerSpawnRate());
    }
  }

  function updateCore(dt) {
    spawnFromRates(dt);
    updateEntities(dt);
    updateFiring(dt);
    updateProjectiles(dt);
    updateFx(dt);
    updateHud();
  }

  function updateState(dt) {
    if (state.paused) {
      updateHud();
      return;
    }
    updateGameTimers(dt);
    updateMovement();
    updateRoadOffsets(dt);
    updateCore(dt);
  }

  function togglePause() {
    if (!state.started || !state.running) return;
    state.paused = !state.paused;
    if (pauseBtnEl) pauseBtnEl.textContent = state.paused ? 'Resume' : 'Pause';
    if (state.paused) {
      syncLiveControlsFromCurrentState();
      statusEl.textContent = 'Paused. Adjust settings, then resume.';
    } else {
      statusEl.textContent = 'Resumed.';
    }
    updateSettingsUiState();
  }

  function endRun(reason) {
    state.running = false;
    state.victory = false;
    state.paused = false;
    if (pauseBtnEl) pauseBtnEl.textContent = 'Pause';
    updateSettingsUiState();
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

  function applyGrowthPowerByShots(shotsHit) {
    const rewardCap = Math.round(lerp(POWER_REWARD_CAP_START, POWER_REWARD_CAP_END, overallProgressRatio()));
    const gain = Math.min(shotsHit, rewardCap);
    if (gain > 0) {
      addUnits(gain);
      state.score += 90;
      statusEl.textContent = `Power-up intercepted: +${gain} units!`;
    } else {
      statusEl.textContent = 'Power-up missed – shoot it next time!';
    }
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

  function followPlayerX(enemy, followAlpha) {
    enemy.x += (state.playerX - enemy.x) * followAlpha;
  }

  function updateEntities(dt) {
    const enemyHoldY = state.playerY - ENEMY_HOLD_LINE_OFFSET;
    const enemyTrackingThresholdY = ROAD_HORIZON_Y + (enemyHoldY - ROAD_HORIZON_Y) * ENEMY_TRACKING_THRESHOLD_RATIO;
    const enemyFollowAlpha = ENEMY_PLAYER_FOLLOW_LAG_SECONDS > 0
      ? (1 - Math.exp(-dt / ENEMY_PLAYER_FOLLOW_LAG_SECONDS))
      : 1;

    for (const e of state.entities) {
      if (e.kind === 'enemy') {
        if (e.anchored) {
          followPlayerX(e, enemyFollowAlpha);
          e.y = enemyHoldY;
        } else {
          if (e.pattern === 'zigzag') {
            e.phase += dt * ENEMY_ZIGZAG_PHASE_SPEED;
            e.x += Math.sin(e.phase) * dt * ENEMY_ZIGZAG_SWAY_SPEED;
          } else if (e.pattern === 'flank') {
            const dir = state.playerX > e.x ? 1 : -1;
            e.x += dir * dt * 160;
          }
          e.y += e.speed * dt;
          if (!e.trackingPlayer && e.y >= enemyTrackingThresholdY) {
            e.trackingPlayer = true;
          }
          if (e.trackingPlayer) followPlayerX(e, enemyFollowAlpha);
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
        const nx = (e.x - px) / (formationW + e.w * ENEMY_COLLISION_WIDTH_FACTOR);
        const ny = (e.y - (py - ENEMY_COLLISION_Y_OFFSET)) / (formationH + e.h * ENEMY_COLLISION_HEIGHT_FACTOR);
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
          && overlapsCircleRect(
            px,
            py - POWER_PICKUP_Y_OFFSET,
            Math.max(0, formationCollisionBound - TRAP_COLLISION_BOUND_REDUCTION),
            e.x - e.w * 0.5,
            e.y - e.h * 0.5,
            e.w,
            e.h,
          )
        ) {
          loseUnits(2, 'Trap hit');
          return false;
        }
      } else if (e.kind === 'power') {
        const pickupCenterY = py - POWER_PICKUP_Y_OFFSET;
        const nx = (e.x - px) / (formationW + e.r);
        const ny = (e.y - pickupCenterY) / (formationH + e.r);
        if (nx * nx + ny * ny <= 1) {
          applyGrowthPowerByShots(e.shotsHit || 0);
          state.fx.push({ type: 'pickup', x: e.x, y: e.y, ttl: 0.45 });
          return false;
        }
      }
      return true;
    });
  }

  function updateProjectiles(dt) {
    for (const p of state.projectiles) {
      p.prevY = p.y;
      p.y -= p.speed * dt;
    }

    for (const p of state.projectiles) {
      if (p.y < PROJECTILE_OFFSCREEN_THRESHOLD) continue;
      const touchingEnemies = [];
      for (const e of state.entities) {
        if (e.kind === 'enemy' && e.anchored) touchingEnemies.push(e);
      }
      const resolveProjectileHit = (target) => {
        const rx = target.kind === 'enemy' ? (target.w * 0.5 + p.r) : (target.r + p.r);
        const ry = target.kind === 'enemy' ? (target.h * 0.5 + p.r) : (target.r + p.r);
        const nx = (target.x - p.x) / rx;
        const ny = (target.y - p.y) / ry;
        const prevY = Number.isFinite(p.prevY) ? p.prevY : p.y;
        const prevNy = (target.y - prevY) / ry;
        const minY = Math.min(p.y, prevY);
        const maxY = Math.max(p.y, prevY);
        const crossesTargetY = target.y >= minY && target.y <= maxY;
        const sweptHit = crossesTargetY && nx * nx <= 1;
        if (nx * nx + ny * ny > 1 && nx * nx + prevNy * prevNy > 1 && !sweptHit) return false;
        if (target.kind === 'power') {
          // Once fully charged, shots intentionally pass through without interacting.
          if ((target.shotsHit || 0) >= POWER_SHOTS_MAX_CHARGE) return false;
          p.destroyed = true;
          target.shotsHit = Math.min(POWER_SHOTS_MAX_CHARGE, (target.shotsHit || 0) + 1);
          state.fx.push({ type: 'hit', x: target.x, y: target.y, ttl: 0.18 });
        } else {
          p.destroyed = true;
          target.hp -= 1;
          state.fx.push({ type: 'hit', x: target.x, y: target.y, ttl: 0.2 });
          if (target.hp <= 0) {
            target.destroyed = true;
            state.score += 22 + state.level * 3;
          }
        }
        return true;
      };

      let hit = false;
      for (const e of touchingEnemies) {
        if (resolveProjectileHit(e)) {
          hit = true;
          break;
        }
      }
      if (hit) continue;

      for (const e of state.entities) {
        if (e.kind !== 'enemy' && e.kind !== 'power') continue;
        if (e.kind === 'enemy' && e.anchored) continue;
        if (resolveProjectileHit(e)) break;
      }
    }

    state.entities = state.entities.filter((e) => !(e.kind === 'enemy' && (e.hp <= 0 || e.destroyed)));
    state.projectiles = state.projectiles.filter((p) => p.y > PROJECTILE_OFFSCREEN_THRESHOLD && !p.destroyed);
  }

  function nextLevel() {
    state.level += 1;
    if (state.level >= LEVEL_COUNT) {
      state.running = false;
      state.victory = true;
      state.paused = false;
      if (pauseBtnEl) pauseBtnEl.textContent = 'Pause';
      updateSettingsUiState();
      statusEl.textContent = `Victory! Final score: ${state.score}`;
      return;
    }
    state.timeInLevel = 0;
    state.entities = [];
    state.projectiles = [];
    state.enemySpawnTimer = spawnIntervalFromRate(currentEnemySpawnRate());
    state.trapSpawnTimer = spawnIntervalFromRate(currentTrapSpawnRate());
    state.powerSpawnTimer = spawnIntervalFromRate(currentPowerSpawnRate());
    statusEl.textContent = `Level ${state.level + 1} start`;
  }

  function update(dt) {
    if (!state.running) return;

    updateState(dt);
  }

  function getRoadBoundsAtY(y) {
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
      const { left, width, t } = getRoadBoundsAtY(y);
      const tileInset = width * ROAD_TILE_INSET_RATIO;
      const alpha = 0.06 + t * 0.06;
      ctx.fillStyle = `rgba(216, 245, 255, ${alpha})`;
      ctx.fillRect(left + tileInset, y, width - tileInset * 2, 2 + t * 4);
    }

    const sideBase = state.roadOffset * 0.8 % ROAD_SIDE_LINE_GAP;
    for (let y = ROAD_HORIZON_Y - ROAD_SIDE_LINE_GAP + sideBase; y < h; y += ROAD_SIDE_LINE_GAP) {
      const { left, right, t } = getRoadBoundsAtY(y);
      const dashLen = ROAD_SIDE_LINE_LENGTH * (0.7 + t * 1.4);
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

    const base = state.roadOffset % ROAD_CENTER_STRIPE_GAP;
    for (let y = ROAD_HORIZON_Y - ROAD_CENTER_STRIPE_GAP + base; y < h; y += ROAD_CENTER_STRIPE_GAP) {
      const { t } = getRoadBoundsAtY(y);
      const widthScale = Math.max(0.12, t);
      ctx.strokeStyle = `rgba(248, 255, 253, ${0.72 + t * 0.22})`;
      ctx.lineWidth = 2 + widthScale * 5;
      ctx.shadowColor = 'rgba(161, 255, 246, 0.45)';
      ctx.shadowBlur = 8 + widthScale * 10;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, y);
      ctx.lineTo(w * 0.5, y + ROAD_CENTER_STRIPE_LENGTH * (0.52 + widthScale));
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
    roundedRectPath(
      ux - unitSize * SOLDIER_BODY_X_RATIO,
      uy - unitSize * SOLDIER_BODY_Y_RATIO,
      unitSize,
      unitSize * SOLDIER_BODY_HEIGHT_RATIO,
      SOLDIER_BODY_RADIUS_SCALE * scale
    );
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
    const accent = isFlank ? '#ffbf74' : isZigZag ? '#75e1f3' : '#ff887d';
    const rx = e.w * 0.5;
    const ry = e.h * 0.5;

    ctx.fillStyle = 'rgba(8, 17, 24, 0.28)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + ry * 0.65, rx * 0.75, ry * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createLinearGradient(e.x, e.y - ry, e.x, e.y + ry);
    grad.addColorStop(0, '#95adbf');
    grad.addColorStop(0.5, '#5f7388');
    grad.addColorStop(1, '#3a4a5c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#233243';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(170, 196, 216, 0.7)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y - ry * 0.1, rx * 0.82, ry * 0.58, 0, Math.PI, 0);
    ctx.fill();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(e.x - rx * 0.55, e.y);
    ctx.lineTo(e.x + rx * 0.55, e.y);
    ctx.stroke();

    ctx.strokeStyle = '#afc9dc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.x - rx * 0.2, e.y - ry * 0.22);
    ctx.lineTo(e.x + rx * 0.2, e.y - ry * 0.22);
    ctx.moveTo(e.x - rx * 0.15, e.y + ry * 0.24);
    ctx.lineTo(e.x + rx * 0.15, e.y + ry * 0.24);
    ctx.stroke();
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
        const shotsHit = e.shotsHit || 0;
        const progressRatio = Math.min(1, shotsHit / POWER_SHOTS_MAX_VISUAL_SCALE);
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
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shotsHit > 0 ? `+${shotsHit}` : '+', e.x, e.y + POWER_UP_ICON_Y_OFFSET);
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

    if (!state.running && state.started) {
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
    levelEl.textContent = 'Endless';
    const mins = Math.floor(state.timeInLevel / 60);
    const secs = Math.floor(state.timeInLevel % 60).toString().padStart(2, '0');
    timeEl.textContent = `${mins}:${secs}`;
    armyEl.textContent = `${state.armySize}`;
    scoreEl.textContent = `${Math.floor(state.score)}`;
    if (enemyRateEl) enemyRateEl.textContent = `${currentEnemySpawnRate().toFixed(2)}/s`;
    if (powerRateEl) powerRateEl.textContent = `${currentPowerSpawnRate().toFixed(2)}/s`;
    if (fireRateEl) fireRateEl.textContent = `${currentFireRatePerSecond().toFixed(2)}/s`;
    if (progressEl) progressEl.textContent = `${Math.round(overallProgressRatio() * 100)}%`;
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
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }
      if (state.paused) return;
      updatePlayerFromKeyboard(e);
      clampPlayerX();
    });
    pauseBtnEl?.addEventListener('click', togglePause);
  }

  initSetupScreen();
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
