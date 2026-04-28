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

const State = { INTRO: 0, PLAYING: 1, DEAD: 2, LEVEL_COMPLETE: 3, WIN: 4, CUTSCENE: 5 };

let state, levelIndex, level, player, chaser,
    checkpointX, checkpointY,
    shardsCollected, controlsTimer,
    messageTimer, bgStars, bgTime,
    gravityFlipCooldown, cutsceneTimer;

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
  if (level.horizontalGravity) {
    player.gravityAxis = 'x';
    player.gravityDir  = level.initialGravityDir !== undefined ? level.initialGravityDir : -1;
  }

  // reset all fade platforms
  level.platforms.forEach(p => {
    if (p instanceof FadePlatform) {
      p.state = 'solid'; p.active = true; p.alpha = 1; p.timer = 0;
    }
  });

  chaser = null;
  if (level.chaser) {
    chaser = new Chaser(level.chaser.x, level.chaser.y, level.chaser.startDelay || 0);
  }

  if (level.teleportPortals) level.teleportPortals.forEach(tp => { tp.cooldown = 0; });
  if (level.spring) { level.spring.x = level.spring.startX; level.spring.y = level.spring.startY; level.spring.vx = 0; level.spring.vy = 0; }

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
  SoundFX.playBGM(idx);
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

  // level skip: digits 1-9 jump to that level if it exists
  for (let i = 0; i < 9; i++) {
    if (Input.wasPressed('Digit' + (i + 1)) && i < LEVELS.length) {
      SoundFX.stopCutsceneMusic();
      loadLevel(i);
      state = State.PLAYING;
      Input.flush();
      return;
    }
  }

  if (state === State.INTRO) {
    if (Input.wasJumped() || Input.wasPressed('Enter') || Input.wasPressed('Space')) startGame();
    Input.flush();
    return;
  }

  if (state === State.LEVEL_COMPLETE) {
    messageTimer++;
    if (messageTimer > 90 && Input.wasJumped()) {
      loadLevel(levelIndex + 1);
      state = State.PLAYING;
    }
    Input.flush();
    return;
  }

  if (state === State.CUTSCENE) {
    cutsceneTimer++;
    if (cutsceneTimer > 60 && Input.wasJumped() && cutsceneTimer < 470) {
      cutsceneTimer = 470;  // jump to fade-out
    }
    if (cutsceneTimer > 580) {
      SoundFX.stopCutsceneMusic();
      state = State.INTRO;
    }
    Input.flush();
    return;
  }

  if (state === State.DEAD) {
    messageTimer++;
    if (messageTimer > 55 && Input.wasJumped()) {
      player.reset(checkpointX, checkpointY);
      player.setPhysics(level.physics || {});
      if (level.horizontalGravity) {
        player.gravityAxis = 'x';
        player.gravityDir  = level.initialGravityDir !== undefined ? level.initialGravityDir : -1;
      }
      if (level.chaser) chaser = new Chaser(level.chaser.x, level.chaser.y, level.chaser.startDelay || 0);
      if (level.spring) level.spring.resetToCheckpoint(checkpointX, checkpointY);
      state = State.PLAYING;
    }
    Input.flush();
    return;
  }

  // --- PLAYING ---

  // horizontal gravity wall-flip (level 6)
  if (level.horizontalGravity) {
    gravityFlipCooldown--;
    if (gravityFlipCooldown <= 0) {
      const toLeft  = Input.wasPressed('ArrowLeft')  || Input.wasPressed('KeyA');
      const toRight = Input.wasPressed('ArrowRight') || Input.wasPressed('KeyD');
      if (toLeft)  { player.gravityDir = -1; player.vx = 0; player.canDoubleJump = true; gravityFlipCooldown = 18; SoundFX.gravityFlip(); }
      else if (toRight) { player.gravityDir =  1; player.vx = 0; player.canDoubleJump = true; gravityFlipCooldown = 18; SoundFX.gravityFlip(); }
    }
  }

  // gravity toggle (level 5)
  if (level.gravityToggle) {
    gravityFlipCooldown--;
    if (gravityFlipCooldown <= 0 &&
        (Input.wasPressed('ArrowDown') || Input.wasPressed('KeyS'))) {
      player.gravityDir *= -1;
      player.vy = 0;
      player.canDoubleJump = true;
      gravityFlipCooldown = 18;
      SoundFX.gravityFlip();
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

  // current zones
  if (level.currents) level.currents.forEach(c => { c.update(); c.applyTo(player); });

  // fan zones (level 6)
  if (level.fans) level.fans.forEach(f => { f.update(); f.applyTo(player); });

  // teleport portals
  if (level.teleportPortals) level.teleportPortals.forEach(tp => { tp.update(); tp.checkTeleport(player); });

  if (level.spring) level.spring.update(player, level.platforms, level.deathY);

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
      SoundFX.collectShard();
      shardsCollected++;
      if (shardsCollected >= level.shards.length) {
        level.portal.activate();
        SoundFX.portalActive();
      }
    }
  });

  // checkpoint
  level.checkpoints.forEach(c => {
    if (!c.activated && overlaps(player, { x: c.x, y: c.y, w: c.w, h: c.h })) {
      c.activate();
      SoundFX.checkpoint();
      checkpointX = c.x;
      checkpointY = c.y - player.h;
    }
  });

  // portal enter
  if (level.portal.active) {
    const p = level.portal;
    if (overlaps(player, { x: p.cx - 24, y: p.cy - 24, w: 48, h: 48 })) {
      SoundFX.portalEnter();
      if (levelIndex + 1 >= LEVELS.length) {
        state = State.CUTSCENE;
        cutsceneTimer = 0;
        SoundFX.stopBGM();
        SoundFX.startCutsceneMusic();
      } else {
        state = State.LEVEL_COMPLETE;
        messageTimer = 0;
      }
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
  if (state === State.CUTSCENE) { drawCutscene(); return; }

  drawBackground();

  if (level.currents) level.currents.forEach(c => c.draw(ctx, cam.x));
  level.platforms.forEach(p  => p.draw(ctx, cam.x, cam.y));
  if (level.horizontalGravity) drawActiveWall();
  if (level.fans) level.fans.forEach(f => f.draw(ctx, cam.x, cam.y));
  level.hazards.forEach(h    => h.draw(ctx, cam.x, cam.y));
  level.checkpoints.forEach(c => c.draw(ctx, cam.x, cam.y));
  level.shards.forEach(s     => s.draw(ctx, cam.x, cam.y));
  level.portal.draw(ctx, cam.x, cam.y);
  if (level.teleportPortals) level.teleportPortals.forEach(tp => tp.draw(ctx, cam.x, cam.y));
  if (level.spring) level.spring.draw(ctx, cam.x, cam.y);
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
    ctx.fillText(`Сон ${levelIndex + 1}/6 — ${level.name}`, W - 18, 18);
    ctx.restore();
  }

  // gravity indicator for level 5
  if (level.gravityToggle) drawGravityIndicator();

  // wall indicator for level 6
  if (level.horizontalGravity) drawWallIndicator();

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

// Визуальные полосы пола и потолка для горизонтальной гравитации (Сон 6)
// Полоса рисуется только там, где есть реальные платформы-стены (разрывы остаются тёмными).
function drawActiveWall() {
  const floorOnLeft = player.gravityDir < 0;
  const t = Date.now() / 500;
  const pulse = 0.7 + Math.sin(t) * 0.25;

  // собираем сегменты левой и правой стен из массива платформ уровня
  const leftSegs  = level.platforms.filter(p => p.x === 0    && p.w === 28 && p.active !== false);
  const rightSegs = level.platforms.filter(p => p.x === 1252 && p.w === 28 && p.active !== false);

  ctx.save();
  _drawWallSurface(true,  floorOnLeft,  pulse, leftSegs);
  _drawWallSurface(false, !floorOnLeft, pulse, rightSegs);
  ctx.restore();
}

// isLeft: левый экранный край; isFloor: активная (гравитирующая) стена
// segments: массив Platform-объектов, описывающих сегменты данной стены
function _drawWallSurface(isLeft, isFloor, pulse, segments) {
  const W_STRIP = isFloor ? 28 : 14;
  const x = isLeft ? 0 : W - W_STRIP;
  const [r, g, b] = isFloor
    ? (isLeft ? [50, 200, 130] : [220, 130, 50])
    : [40, 55, 80];

  // атмосферное свечение — на весь экран (не зависит от разрывов)
  if (isFloor) {
    const glowW = 90;
    const gx = isLeft ? 0 : W - glowW;
    const grd = ctx.createLinearGradient(isLeft ? 0 : W, 0, isLeft ? glowW : W - glowW, 0);
    grd.addColorStop(0, `rgba(${r},${g},${b},${(0.18 * pulse).toFixed(2)})`);
    grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = grd;
    ctx.fillRect(gx, 0, glowW, H);
  }

  // рисуем полосу только поверх реальных сегментов стены
  for (const seg of segments) {
    const sy = seg.y - cam.y;
    const sh = seg.h;
    if (sy + sh < 0 || sy > H) continue;  // за пределами экрана

    // основная заливка
    ctx.globalAlpha = isFloor ? 0.92 : 0.40;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, sy, W_STRIP, sh);

    // тайловые линии (скроллятся с миром)
    const TILE_H = 40;
    const tileStart = Math.floor(seg.y / TILE_H) * TILE_H;
    ctx.globalAlpha = isFloor ? 0.22 : 0.12;
    ctx.fillStyle = '#000';
    for (let wy = tileStart; wy < seg.y + sh; wy += TILE_H) {
      const ty = wy - cam.y;
      if (ty >= sy && ty < sy + sh) ctx.fillRect(x, ty, W_STRIP, 2);
    }

    // яркая грань — сторона, на которую встаёт игрок
    ctx.globalAlpha = isFloor ? 0.6 * pulse : 0.15;
    ctx.fillStyle = isFloor
      ? `rgb(${Math.min(r+90,255)},${Math.min(g+90,255)},${Math.min(b+90,255)})`
      : '#6080a0';
    ctx.fillRect(isLeft ? x + W_STRIP - 3 : x, sy, 3, sh);
  }

  // стрелки-подсказки на неактивной стене (всегда по экрану)
  if (!isFloor) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#8899bb';
    ctx.font = '10px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = isLeft ? 'left' : 'right';
    const lx = isLeft ? x + 4 : x + W_STRIP - 4;
    for (let ty = 80; ty < H; ty += 100) ctx.fillText(isLeft ? '←' : '→', lx, ty);
  }
}

function drawWallIndicator() {
  const left = player.gravityDir < 0;
  const t = Date.now() / 400;
  const pulse = 0.7 + Math.sin(t) * 0.3;
  const x = W - 52, y = H - 52;

  ctx.save();
  ctx.globalAlpha = 0.8 * pulse;
  ctx.fillStyle = left ? '#40c0ff' : '#ff8040';
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(left ? '←' : '→', x, y);

  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#9080c0';
  ctx.font = '11px sans-serif';
  ctx.fillText('←/→ — стена', x, y + 26);
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

function drawCutscene() {
  const t = cutsceneTimer;

  // dawn light: dark night → warm sunrise over ~4s
  const dawn = Math.min(1, t / 240);
  const r = Math.floor(8 + dawn * 90);
  const g = Math.floor(4 + dawn * 60);
  const b = Math.floor(20 + dawn * 70);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, `rgb(${r},${g},${b})`);
  grad.addColorStop(1, `rgb(${Math.floor(r*0.4)},${Math.floor(g*0.4)},${Math.floor(b*0.5)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // window with morning light (right side)
  const wx = W * 0.72, wy = H * 0.32;
  const ww = 140, wh = 200;
  // sky inside window — gradient from dark to bright
  const winSky = ctx.createLinearGradient(wx - ww/2, wy - wh/2, wx + ww/2, wy + wh/2);
  winSky.addColorStop(0, `rgba(${100 + dawn*155},${80 + dawn*140},${140 + dawn*60},1)`);
  winSky.addColorStop(1, `rgba(${40 + dawn*120},${30 + dawn*100},${80 + dawn*100},1)`);
  ctx.fillStyle = winSky;
  ctx.fillRect(wx - ww/2, wy - wh/2, ww, wh);

  // sun rising
  if (dawn > 0.2) {
    const sunY = wy + wh/2 - (dawn - 0.2) * 180;
    const sunGrad = ctx.createRadialGradient(wx, sunY, 0, wx, sunY, 60);
    sunGrad.addColorStop(0, `rgba(255,240,180,${0.9 * dawn})`);
    sunGrad.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(wx, sunY, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,235,170,${dawn})`;
    ctx.beginPath();
    ctx.arc(wx, sunY, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // window frame
  ctx.strokeStyle = '#1a0e24';
  ctx.lineWidth = 6;
  ctx.strokeRect(wx - ww/2, wy - wh/2, ww, wh);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wx, wy - wh/2); ctx.lineTo(wx, wy + wh/2);
  ctx.moveTo(wx - ww/2, wy); ctx.lineTo(wx + ww/2, wy);
  ctx.stroke();

  // sun rays into room (after dawn)
  if (dawn > 0.5) {
    ctx.save();
    const a = (dawn - 0.5) * 0.35;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(255,225,160,${a * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(wx - 40 + i * 25, wy);
      ctx.lineTo(wx - 220 + i * 60, H);
      ctx.lineTo(wx - 280 + i * 60, H);
      ctx.lineTo(wx - 80 + i * 25, wy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, H - 80, W, 80);

  // bed (left side)
  const bedX = W * 0.32, bedY = H * 0.62;
  const bedW = 320, bedH = 90;
  // bed frame
  ctx.fillStyle = '#2a1840';
  ctx.fillRect(bedX - bedW/2, bedY + bedH - 20, bedW, 30);
  // mattress
  ctx.fillStyle = '#3e2860';
  ctx.fillRect(bedX - bedW/2, bedY, bedW, bedH - 10);
  // pillow
  ctx.fillStyle = '#e8d8ff';
  ctx.beginPath();
  ctx.roundRect(bedX - bedW/2 + 10, bedY + 8, 95, 42, 6);
  ctx.fill();

  // blanket — recedes as character sits up
  const sitProgress = Math.max(0, Math.min(1, (t - 220) / 90));
  const blanketLen = 220 - sitProgress * 70;
  ctx.fillStyle = '#6040b0';
  ctx.beginPath();
  ctx.roundRect(bedX - bedW/2 + 80, bedY + 10, blanketLen, bedH - 25, 4);
  ctx.fill();
  // blanket highlight
  ctx.fillStyle = 'rgba(180,140,255,0.3)';
  ctx.fillRect(bedX - bedW/2 + 80, bedY + 10, blanketLen, 4);

  // character — lying then sitting up
  const ch_x = bedX - bedW/2 + 55;
  const ch_lyingY = bedY + 12;
  const ch_sittingY = bedY - 50;
  const ch_y = ch_lyingY + (ch_sittingY - ch_lyingY) * sitProgress;

  // body (visible when sitting up)
  if (sitProgress > 0.1) {
    ctx.fillStyle = '#c0a0ff';
    ctx.beginPath();
    ctx.roundRect(ch_x - 14, ch_y + 12, 28, 50 * sitProgress, 5);
    ctx.fill();
  }

  // head
  ctx.fillStyle = '#d8c0ff';
  ctx.beginPath();
  ctx.ellipse(ch_x, ch_y, 16, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  // eye animation: closed → blinking → open
  const eyePhase = t < 130 ? 0 : t < 180 ? 1 : 2;  // 0: closed, 1: blinking, 2: open
  ctx.fillStyle = '#1a0030';
  if (eyePhase === 0) {
    // closed - dash
    ctx.strokeStyle = '#1a0030';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(ch_x + 2, ch_y - 1);
    ctx.lineTo(ch_x + 9, ch_y - 1);
    ctx.stroke();
  } else if (eyePhase === 1) {
    // blinking - half-circle
    const blink = Math.abs(Math.sin((t - 130) * 0.3));
    ctx.fillStyle = '#1a0030';
    ctx.beginPath();
    ctx.ellipse(ch_x + 6, ch_y - 1, 2.2, 1 + blink * 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // open
    ctx.beginPath();
    ctx.ellipse(ch_x + 6, ch_y - 1, 2.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ch_x + 6.5, ch_y - 2, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // dream particles drifting above sleeper throughout cutscene
  {
    const fade = t < 380 ? 1 : Math.max(0, 1 - (t - 380) / 80);
    for (let i = 0; i < 8; i++) {
      const pa = (i / 8) * Math.PI * 2 + t * 0.015;
      const drift = (t * 0.4 + i * 40) % 120;
      const pr = 28 + Math.sin(t * 0.04 + i) * 10;
      const px = ch_x + Math.cos(pa) * pr;
      const py = ch_y - 20 - drift;
      ctx.save();
      ctx.globalAlpha = fade * (0.5 - drift / 240) * (0.6 + Math.sin(t * 0.07 + i) * 0.2);
      ctx.fillStyle = i % 2 === 0 ? '#a080ff' : '#80c0ff';
      ctx.beginPath();
      ctx.arc(px, py, 2 + Math.sin(t * 0.05 + i) * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // narration text
  let text = '';
  if (t < 90)        text = '...';
  else if (t < 200)  text = 'Сон рассеивается.';
  else if (t < 340)  text = 'Ты открываешь глаза.';
  else if (t < 470)  text = 'Утро. Ты в своей комнате.';
  else               text = 'Но ночь снова придёт...';

  if (text) {
    const textPhase = t < 90 ? t / 90 :
                      t < 200 ? (t - 90) / 110 :
                      t < 340 ? (t - 200) / 140 :
                      t < 470 ? (t - 340) / 130 :
                      (t - 470) / 80;
    const a = Math.min(1, textPhase * 4) * Math.min(1, (1 - textPhase) * 4 + 0.3);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a) * 0.92;
    ctx.fillStyle = '#f0e0ff';
    ctx.font = 'italic 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#a070ff';
    ctx.shadowBlur = 22;
    ctx.fillText(text, W / 2, H - 70);
    ctx.restore();
  }

  // skip hint
  if (t > 60 && t < 540) {
    ctx.save();
    ctx.globalAlpha = 0.45 + Math.sin(Date.now() / 380) * 0.18;
    ctx.fillStyle = '#9080b0';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('[ Space — пропустить ]', W / 2, H - 24);
    ctx.restore();
  }

  // final fade to white → returns to intro
  if (t > 470) {
    const fadeOut = Math.min(1, (t - 470) / 100);
    ctx.fillStyle = `rgba(255,245,225,${fadeOut})`;
    ctx.fillRect(0, 0, W, H);
  }
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
  ctx.fillText('6 снов. Каждый с уникальной физикой. Собери осколки. Проснись.', W/2, H/2 - 36);

  ctx.fillStyle = '#3e3060';
  ctx.font = '15px sans-serif';
  const levels = [
    'Сон 1 — Спокойный (туториал)',
    'Сон 2 — Водный (слабая гравитация)',
    'Сон 3 — Ломаный (исчезающие платформы)',
    'Сон 4 — Кошмар (преследователь)',
    'Сон 5 — Падение (инверсия гравитации ↓/S)',
    'Сон 6 — Горизонтальный (←/→ — стена, ↑/↓ — бег, Space — прыжок)',
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
