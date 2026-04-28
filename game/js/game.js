const W = 1280, H = 720;

const canvas = document.getElementById('gameCanvas');
canvas.width  = W;
canvas.height = H;

function resize() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width  = Math.floor(W * scale) + 'px';
  canvas.style.height = Math.floor(H * scale) + 'px';
}
window.addEventListener('resize', resize);
resize();

const ctx = canvas.getContext('2d');

const State = { INTRO: 0, PLAYING: 1, DEAD: 2, LEVEL_COMPLETE: 3, WIN: 4 };

let state, levelIndex, level, player, chaser,
    checkpointX, checkpointY,
    shardsCollected, controlsTimer,
    messageTimer, bgStars, bgTime,
    gravityFlipCooldown;

function initStars(levelWidth) {
  bgStars = [];
  for (let i = 0; i < 200; i++) {
    bgStars.push({
      x: Math.random() * levelWidth,
      y: Math.random() * H,
      r: 0.5 + Math.random() * 1.5,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.6,
    });
  }
}

function loadLevel(idx) {
  levelIndex = idx;
  level = LEVELS[idx];
  player = new Player(level.playerStart.x, level.playerStart.y);
  player.setPhysics(level.physics || {});

  // reset all fade platforms
  level.platforms.forEach(p => {
    if (p instanceof FadePlatform) {
      p.state = 'solid'; p.active = true; p.alpha = 1; p.timer = 0;
    }
  });

  chaser = null;
  if (level.chaser) {
    chaser = new Chaser(level.chaser.x, level.chaser.y);
  }

  checkpointX = level.playerStart.x;
  checkpointY = level.playerStart.y;
  shardsCollected = 0;
  level.shards.forEach(s => { s.collected = false; s.particles = []; s.angle = 0; });
  level.checkpoints.forEach(c => c.activated = false);
  level.portal.active = false;
  level.portal.rotation = 0;
  controlsTimer = 320;
  messageTimer = 0;
  gravityFlipCooldown = 0;
  bgTime = 0;
  initStars(level.width);
}

function startGame() {
  state = State.PLAYING;
  loadLevel(0);
}

// --- Camera ---
const cam = { x: 0, y: 0 };
function updateCamera() {
  const tx = player.cx - W / 2;
  const ty = player.cy - H / 2 - 50;
  cam.x += (tx - cam.x) * 0.12;
  cam.y += (ty - cam.y) * 0.10;
  cam.x = Math.max(0, Math.min(level.width - W, cam.x));
  cam.y = Math.max(0, Math.min(level.height - H, cam.y));
}

// --- Background ---
function drawBackground() {
  const [c1, c2, c3] = level.bgColors;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.5, c2);
  grad.addColorStop(1, c3);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 3; i++) {
    const bx = ((i * 1200 - cam.x * 0.18 + bgTime * 8) % (W + 500) + W + 500) % (W + 500) - 250;
    const by = 80 + i * 200;
    const ng = ctx.createRadialGradient(bx, by, 0, bx, by, 200);
    ng.addColorStop(0, `rgba(${50+i*15},${10},${90+i*25},0.07)`);
    ng.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.ellipse(bx, by, 200, 130, bgTime * 0.3 + i, 0, Math.PI * 2);
    ctx.fill();
  }

  bgStars.forEach(s => {
    s.twinkle += 0.04;
    const a = 0.3 + Math.sin(s.twinkle) * 0.3;
    const sx = ((s.x - cam.x * s.speed * 0.25) % W + W) % W;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// --- Update ---
function update() {
  bgTime += 0.003;

  if (state === State.INTRO) {
    if (Input.wasJumped() || Input.wasPressed('Enter') || Input.wasPressed('Space')) startGame();
    Input.flush();
    return;
  }

  if (state === State.LEVEL_COMPLETE || state === State.WIN) {
    messageTimer++;
    if (messageTimer > 90 && Input.wasJumped()) {
      if (state === State.WIN || levelIndex + 1 >= LEVELS.length) {
        state = State.WIN;
      } else {
        loadLevel(levelIndex + 1);
        state = State.PLAYING;
      }
    }
    Input.flush();
    return;
  }

  if (state === State.DEAD) {
    messageTimer++;
    if (messageTimer > 55 && Input.wasJumped()) {
      player.reset(checkpointX, checkpointY);
      player.setPhysics(level.physics || {});
      if (level.chaser) chaser = new Chaser(level.chaser.x, level.chaser.y);
      state = State.PLAYING;
    }
    Input.flush();
    return;
  }

  // --- PLAYING ---

  // gravity toggle (level 5)
  if (level.gravityToggle) {
    gravityFlipCooldown--;
    if (gravityFlipCooldown <= 0 &&
        (Input.wasPressed('ArrowDown') || Input.wasPressed('KeyS'))) {
      player.gravityDir *= -1;
      player.vy = 0;
      player.canDoubleJump = true;
      gravityFlipCooldown = 18;
    }
  }

  // update FadePlatforms
  level.platforms.forEach(p => {
    if (p instanceof FadePlatform) p.update();
  });

  // update entities
  level.shards.forEach(s => s.update());
  level.checkpoints.forEach(c => c.update());
  level.portal.update();

  // player update
  player.update(level.platforms, level.hazards);

  // chaser update
  if (chaser) {
    chaser.update(player, level.platforms);
    if (!player.dead && chaser.overlapsPlayer(player)) player.die();
  }

  // death zone
  if (player.y > level.deathY) player.die();
  if (level.deathMinY !== undefined && player.y + player.h < level.deathMinY) player.die();

  if (player.dead) {
    state = State.DEAD;
    messageTimer = 0;
    Input.flush();
    return;
  }

  // shard pickup
  level.shards.forEach(s => {
    if (!s.collected && overlaps(player, { x: s.x, y: s.y, w: s.w, h: s.h })) {
      s.collect();
      shardsCollected++;
      if (shardsCollected >= level.shards.length) level.portal.activate();
    }
  });

  // checkpoint
  level.checkpoints.forEach(c => {
    if (!c.activated && overlaps(player, { x: c.x, y: c.y, w: c.w, h: c.h })) {
      c.activate();
      checkpointX = c.x;
      checkpointY = c.y - player.h;
    }
  });

  // portal enter
  if (level.portal.active) {
    const p = level.portal;
    if (overlaps(player, { x: p.cx - 24, y: p.cy - 24, w: 48, h: 48 })) {
      state = levelIndex + 1 >= LEVELS.length ? State.WIN : State.LEVEL_COMPLETE;
      messageTimer = 0;
    }
  }

  updateCamera();
  if (controlsTimer > 0) controlsTimer--;
  Input.flush();
}

// --- Draw ---
function draw() {
  ctx.clearRect(0, 0, W, H);

  if (state === State.INTRO) { drawIntroScreen(); return; }

  drawBackground();

  level.platforms.forEach(p  => p.draw(ctx, cam.x, cam.y));
  level.hazards.forEach(h    => h.draw(ctx, cam.x, cam.y));
  level.checkpoints.forEach(c => c.draw(ctx, cam.x, cam.y));
  level.shards.forEach(s     => s.draw(ctx, cam.x, cam.y));
  level.portal.draw(ctx, cam.x, cam.y);
  if (chaser) chaser.draw(ctx, cam.x, cam.y);
  player.draw(ctx, cam.x, cam.y);

  UI.draw(ctx, W, H, shardsCollected, level.shards.length,
          level.portal.active, player, level.portal, cam.x, cam.y);

  if (controlsTimer > 0) {
    UI.drawControls(ctx, W, H, Math.min(1, controlsTimer / 60));
  }

  // level name + number
  const nameAlpha = Math.min(1, controlsTimer / 80);
  if (nameAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = nameAlpha * 0.75;
    ctx.fillStyle = '#8070b0';
    ctx.font = 'italic 17px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`Сон ${levelIndex + 1}/5 — ${level.name}`, W - 18, 18);
    ctx.restore();
  }

  // gravity indicator for level 5
  if (level.gravityToggle) drawGravityIndicator();

  // chaser proximity warning
  if (chaser) drawChaserWarning();

  // overlays
  if (state === State.DEAD) {
    const a = Math.min(1, messageTimer / 30);
    const sub = level.chaser
      ? 'Кошмар поглотил тебя. Прыжок — попробовать снова'
      : 'Прыжок — вернуться с чекпоинта';
    UI.drawMessage(ctx, W, H, '— ты растворился —', sub, a);
  }
  if (state === State.LEVEL_COMPLETE) {
    const a = Math.min(1, messageTimer / 30);
    UI.drawMessage(ctx, W, H, 'Сон завершён', 'Прыжок — следующий сон', a);
  }
  if (state === State.WIN) {
    const a = Math.min(1, messageTimer / 30);
    UI.drawMessage(ctx, W, H, '— ты проснулся —', 'Все 5 снов пройдены', a);
  }
}

function drawGravityIndicator() {
  const inverted = player.gravityDir < 0;
  const t = Date.now() / 400;
  const pulse = 0.7 + Math.sin(t) * 0.3;
  const x = W - 52, y = H - 52;

  ctx.save();
  ctx.globalAlpha = 0.8 * pulse;
  ctx.fillStyle = inverted ? '#aa60ff' : '#6080ff';
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(inverted ? '↑' : '↓', x, y);

  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#9080c0';
  ctx.font = '11px sans-serif';
  ctx.fillText('↓/S — flip', x, y + 26);
  ctx.restore();
}

function drawChaserWarning() {
  if (!chaser) return;
  const dx = chaser.x - player.x;
  const dist = Math.abs(dx);
  if (dist > 600) return;
  const danger = Math.max(0, 1 - dist / 600);
  ctx.save();
  ctx.globalAlpha = danger * 0.18;
  const red = ctx.createRadialGradient(W/2, H/2, 100, W/2, H/2, W/2);
  red.addColorStop(0, 'rgba(0,0,0,0)');
  red.addColorStop(1, 'rgba(200,0,20,1)');
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawIntroScreen() {
  ctx.fillStyle = '#04020e';
  ctx.fillRect(0, 0, W, H);
  const t = Date.now() / 1000;

  for (let i = 0; i < 35; i++) {
    const px = (i * 137.5) % W;
    const py = ((i * 89 + t * 18 * (0.4 + (i % 5) * 0.15)) % H);
    ctx.save();
    ctx.globalAlpha = 0.25 + Math.sin(t + i) * 0.15;
    ctx.fillStyle = '#c0a0ff';
    ctx.beginPath();
    ctx.arc(px, py, 1.5 + i % 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#e8d0ff';
  ctx.font = 'bold 68px sans-serif';
  ctx.shadowColor = '#9050ff';
  ctx.shadowBlur = 35;
  ctx.fillText('Dream Shards', W/2, H/2 - 100);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#5a4888';
  ctx.font = '19px sans-serif';
  ctx.fillText('5 снов. Каждый с уникальной физикой. Собери осколки. Проснись.', W/2, H/2 - 36);

  ctx.fillStyle = '#3e3060';
  ctx.font = '15px sans-serif';
  const levels = [
    'Сон 1 — Спокойный (туториал)',
    'Сон 2 — Водный (слабая гравитация)',
    'Сон 3 — Ломаный (исчезающие платформы)',
    'Сон 4 — Кошмар (преследователь)',
    'Сон 5 — Падение (инверсия гравитации ↓/S)',
  ];
  levels.forEach((l, i) => {
    ctx.fillText(l, W/2, H/2 + 20 + i * 24);
  });

  const pulse = 0.55 + Math.sin(t * 2.2) * 0.45;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#b090ff';
  ctx.font = '18px sans-serif';
  ctx.fillText('[ Space / ↑ — начать ]', W/2, H/2 + 180);
  ctx.restore();
}

// --- Loop ---
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

state = State.INTRO;
requestAnimationFrame(loop);
