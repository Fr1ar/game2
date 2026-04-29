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

const State = { INTRO: 0, PLAYING: 1, DEAD: 2, LEVEL_COMPLETE: 3, WIN: 4, CUTSCENE: 5, INTRO_CUTSCENE: 6 };

let state, levelIndex, level, player, chaser,
    checkpointX, checkpointY,
    shardsCollected, controlsTimer,
    messageTimer, bgStars, bgTime,
    gravityFlipCooldown, cutsceneTimer,
    oceanWaveTimer, bgBubbles,
    gravHint, djHint, prevCanDJ,
    chaserAwaitMove;

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

function initOceanBubbles(levelWidth) {
  bgBubbles = [];
  for (let i = 0; i < 80; i++) {
    bgBubbles.push({
      x: Math.random() * levelWidth,
      y: H + Math.random() * H,
      r: 1 + Math.random() * 3,
      speed: 0.3 + Math.random() * 0.8,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      alpha: 0.1 + Math.random() * 0.25,
    });
  }
  // фоновые рыбки — декоративные, по всей карте
  bgBubbles._fish = [];
  for (let i = 0; i < 60; i++) {
    bgBubbles._fish.push({
      x:      Math.random() * levelWidth,
      y:      60 + Math.random() * 580,
      speed:  0.18 + Math.random() * 0.5,
      dir:    Math.random() > 0.5 ? 1 : -1,
      wobble: Math.random() * Math.PI * 2,
      size:   2 + Math.random() * 3,
      alpha:  0.12 + Math.random() * 0.22,
      hue:    160 + Math.floor(Math.random() * 60),  // teal-to-cyan
    });
  }
}

function drawOceanBackground() {
  // base ocean gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   '#010f22');
  grad.addColorStop(0.45, '#021428');
  grad.addColorStop(0.75, '#021020');
  grad.addColorStop(1,   '#010a16');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // caustic light rays from above
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const rx = ((i * 350 - cam.x * 0.08 + bgTime * 25) % (W + 600) + W + 600) % (W + 600) - 300;
    const rg = ctx.createLinearGradient(rx - 40, 0, rx + 40, H * 0.7);
    rg.addColorStop(0,   `rgba(20,140,255,${0.04 + Math.sin(bgTime * 1.5 + i) * 0.02})`);
    rg.addColorStop(0.6, `rgba(10,80,200,0.02)`);
    rg.addColorStop(1,   'rgba(0,40,140,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(rx - 40, 0);
    ctx.lineTo(rx + 40, 0);
    ctx.lineTo(rx + 90, H * 0.7);
    ctx.lineTo(rx - 90, H * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // depth darkening overlay for bottom section (world y > depthZone.startY)
  if (level.depthZone) {
    const depthScreenY = level.depthZone.startY - cam.y;
    if (depthScreenY < H) {
      const depthH = H - Math.max(0, depthScreenY);
      const dg = ctx.createLinearGradient(0, Math.max(0, depthScreenY), 0, H);
      dg.addColorStop(0, 'rgba(0,5,15,0)');
      dg.addColorStop(1, 'rgba(0,5,15,0.55)');
      ctx.fillStyle = dg;
      ctx.fillRect(0, Math.max(0, depthScreenY), W, depthH);
    }
  }

  // animated bubbles rising
  if (bgBubbles) {
    bgBubbles.forEach(b => {
      b.y -= b.speed;
      b.wobble += b.wobbleSpeed;
      if (b.y < -10) { b.y = H + Math.random() * 60; b.x = Math.random() * level.width; }
      const sx = ((b.x - cam.x * 0.3) % W + W) % W;
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.strokeStyle = '#4ab0ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx + Math.sin(b.wobble) * 4, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // декоративные рыбки по всей карте
    if (bgBubbles._fish) {
      bgBubbles._fish.forEach(f => {
        f.wobble += 0.05;
        f.x += f.dir * f.speed;
        // плавное изменение направления
        if (Math.random() < 0.003) f.dir *= -1;
        if (f.x < 0) { f.x = level.width; }
        if (f.x > level.width) { f.x = 0; }
        const fx = ((f.x - cam.x * 0.45) % W + W) % W;
        const fy = f.y + Math.sin(f.wobble) * 5;
        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.translate(fx, fy);
        ctx.scale(f.dir, 1);
        // тельце
        ctx.fillStyle = `hsla(${f.hue},70%,65%,1)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, f.size, f.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // хвост
        ctx.beginPath();
        ctx.moveTo(-f.size, 0);
        ctx.lineTo(-f.size - f.size, -f.size * 0.55);
        ctx.lineTo(-f.size - f.size,  f.size * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    }
  }

  // subtle bioluminescent particles in foreground
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const px = ((i * 520 - cam.x * 0.15 + bgTime * 10 + i * 80) % (W + 300) + W + 300) % (W + 300) - 150;
    const py = 200 + i * 130 + Math.sin(bgTime * 2 + i * 1.4) * 30;
    const pg = ctx.createRadialGradient(px, py, 0, px, py, 60);
    pg.addColorStop(0, `rgba(20,180,255,${0.04 + Math.sin(bgTime * 3 + i) * 0.02})`);
    pg.addColorStop(1, 'rgba(0,100,200,0)');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(px, py, 60, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function loadLevel(idx) {
  levelIndex = idx;
  level = LEVELS[idx];
  player = new Player(level.playerStart.x, level.playerStart.y);
  player.setPhysics(level.physics || {});

  // ghost sprite for all levels
  if (!window._ghostImg) {
    window._ghostImg = new Image();
    window._ghostImg.src = 'sprites/sprite-max-px-16 (1).png';
  }
  player.ghostSprite  = window._ghostImg;
  player._ghostCanvas = null;

  if (!window._ghostEndImg) {
    window._ghostEndImg = new Image();
    window._ghostEndImg.src = 'sprites/sprite-max-end.png';
  }
  player.endSprite       = window._ghostEndImg;
  player.endAnimActive   = false;
  player.endAnimDone     = false;
  player.endAnimFrame    = 0;
  player.endAnimTimer    = 0;
  player._ghostEndCanvas = null;

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
  if (level.spring) {
    const sp = level.spring;
    sp.startX = sp.spawnX; sp.startY = sp.spawnY;
    sp.x = sp.spawnX;      sp.y = sp.spawnY;
    sp.vx = 0; sp.vy = 0;
    sp.onGround = false;
    sp.squish = 0; sp.squishTimer = 0;
  }
  if (level.bats) level.bats.forEach(b => {
    b.x = b.perchX; b.y = b.perchY; b.vx = 0; b.vy = 0;
    b.state = 'perched'; b.facing = 1;
  });

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
  gravHint       = !!level.gravityToggle && !level.gravHintOnShard;
  djHint         = !!level.djHint;
  prevCanDJ      = false;
  chaserAwaitMove = !!level.chaser;
  bgTime = 0;
  oceanWaveTimer = 0;
  if (level.isOcean) {
    initOceanBubbles(level.width);
    bgStars = [];
  } else {
    bgBubbles = [];
    initStars(level.width);
  }
  // reset floating platforms
  level.platforms.forEach(p => { if (p instanceof FloatingPlatform) p.phase = Math.random() * Math.PI * 2; });
  SoundFX.playBGM(idx);
}

function startGame() {
  state = State.INTRO_CUTSCENE;
  cutsceneTimer = 0;
  SoundFX.startIntroMusic();
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
  if (level.isOcean) { drawOceanBackground(); return; }

  const [c1, c2, c3] = level.bgColors;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.5, c2);
  grad.addColorStop(1, c3);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (level.forestBg) { level.forestBg.update(); level.forestBg.draw(ctx, cam.x, W, H); }

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
      SoundFX.stopIntroMusic();
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

  if (state === State.INTRO_CUTSCENE) {
    cutsceneTimer++;
    if (cutsceneTimer > 60 && Input.wasJumped() && cutsceneTimer < 510) {
      cutsceneTimer = 510;
    }
    if (cutsceneTimer > 580) {
      SoundFX.stopIntroMusic();
      loadLevel(0);
      state = State.PLAYING;
    }
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
      player.ghostSprite     = window._ghostImg;
      player._ghostCanvas    = null;
      player.endSprite       = window._ghostEndImg;
      player.endAnimActive   = false;
      player.endAnimDone     = false;
      player.endAnimFrame    = 0;
      player.endAnimTimer    = 0;
      player._ghostEndCanvas = null;
      if (level.horizontalGravity) {
        player.gravityAxis = 'x';
        player.gravityDir  = level.initialGravityDir !== undefined ? level.initialGravityDir : -1;
      }
      if (level.chaser) { chaser = new Chaser(level.chaser.x, level.chaser.y, level.chaser.startDelay || 0); chaserAwaitMove = true; }
      if (level.spring) level.spring.resetToCheckpoint(checkpointX, checkpointY);
      if (level.bats) level.bats.forEach(b => {
        b.x = b.perchX; b.y = b.perchY; b.vx = 0; b.vy = 0;
        b.state = 'perched'; b.facing = 1;
      });
      level.platforms.forEach(p => {
        if (p instanceof BranchSpring)  { p.state='idle'; p.bendAmt=0; p.y=p.baseY; p.slippery=false; p.slipDir=0; p.dripTimer=0; }
        if (p instanceof BranchStatic)  { p.slippery=false; p.slipDir=0; p._dripTimer=0; }
        if (p instanceof BranchBreak)   { p.state='solid'; p.crackTimer=0; p.fallVy=0; p.y=p.baseY; p.angle=0; p.active=true; p.slippery=false; }
        if (p instanceof BranchHybrid)  { p.state='idle'; p.timer=0; p.bendAmt=0; p.y=p.baseY; p.fallVy=0; p.angle=0; p.active=true; p.bounced=false; p.slippery=false; }
      });
      if (level.monkeySpawner) level.monkeySpawner.reset();
      if (level.parrot) level.parrot.reset();
      player.controlLoss = 0;
      player.umbrellaTimer = 0;
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

  // gravity toggle (level 5) — ↑/W тянет к потолку, ↓/S тянет к полу
  if (level.gravityToggle) {
    gravityFlipCooldown--;
    if (gravityFlipCooldown <= 0) {
      const toUp   = !level.horizontalGravity && (Input.wasPressed('ArrowUp')   || Input.wasPressed('KeyW'));
      const toDown = !level.horizontalGravity && (Input.wasPressed('ArrowDown')  || Input.wasPressed('KeyS'));
      const toggle = Input.wasPressed('KeyG');
      if (toUp && player.gravityDir !== -1) {
        player.gravityDir = -1; player.vy = 0; player.canDoubleJump = true;
        gravityFlipCooldown = 18; SoundFX.gravityFlip(); gravHint = false;
      } else if (toDown && player.gravityDir !== 1) {
        player.gravityDir =  1; player.vy = 0; player.canDoubleJump = true;
        gravityFlipCooldown = 18; SoundFX.gravityFlip(); gravHint = false;
      } else if (toggle) {
        player.gravityDir *= -1; player.vy = 0; player.canDoubleJump = true;
        gravityFlipCooldown = 18; SoundFX.gravityFlip(); gravHint = false;
      }
    }
  }

  // update FadePlatforms and FloatingPlatforms
  level.platforms.forEach(p => {
    if (p instanceof FadePlatform) p.update();
    if (p instanceof FloatingPlatform) p.update();
    if (p instanceof BranchSpring)  p.update(player);
    if (p instanceof BranchBreak)   p.update(level.deathY);
    if (p instanceof BranchHybrid)  p.update(player, level.deathY);
  });

  // update entities
  level.shards.forEach(s => s.update());
  level.checkpoints.forEach(c => c.update());
  level.portal.update();

  // current zones
  if (level.currents) level.currents.forEach(c => { c.update(); c.applyTo(player); });

  // fan zones (level 6)
  if (level.fans) level.fans.forEach(f => { f.update(); f.applyTo(player); });

  // ocean entities (level 2)
  if (level.isOcean) {
    // global wave
    if (level.oceanWave) {
      oceanWaveTimer++;
      const waveForce = Math.sin(oceanWaveTimer / level.oceanWave.period * Math.PI * 2) * level.oceanWave.strength;
      player.vx += waveForce;
    }
    // depth zone — reduced control (extra friction on vx)
    if (level.depthZone && player.y > level.depthZone.startY) {
      player.vx *= level.depthZone.friction;
    }
    // jellies
    if (level.jellies) level.jellies.forEach(j => {
      j.update();
      if (!player.dead && j.checkHit(player)) player.die();
    });
    // fish schools
    if (level.fishSchools) level.fishSchools.forEach(f => { f.update(); f.applyTo(player); });
    // tentacles
    if (level.tentacles) level.tentacles.forEach(t => {
      t.update(player);
      if (!player.dead && t.checkHit(player)) player.die();
    });
    // whirlpools
    if (level.whirlpools) level.whirlpools.forEach(w => { w.update(); w.applyTo(player); });
    // vertical currents
    if (level.verticalCurrents) level.verticalCurrents.forEach(vc => { vc.update(); vc.applyTo(player); });
    // bubbles
    if (level.bubbles) level.bubbles.forEach(b => { b.update(); b.tryUse(player); });
  }

  // teleport portals
  if (level.teleportPortals) level.teleportPortals.forEach(tp => { tp.update(); tp.checkTeleport(player); });

  if (level.spring) level.spring.update(player, level.platforms, level.deathY);

  // player update (skip during end anim)
  if (!player.endAnimActive) player.update(level.platforms, level.hazards);
  // dismiss double-jump hint on first actual double jump
  if (djHint && prevCanDJ && !player.canDoubleJump && !player.onGround) djHint = false;
  prevCanDJ = player.canDoubleJump;

  // chaser update — waits for first player movement
  if (chaser) {
    if (chaserAwaitMove) {
      if (Input.isLeft() || Input.isRight() || Input.isJump()) {
        chaserAwaitMove = false;
        chaser.startDelay = 120;  // 2s countdown after first move
      } else {
        chaser.startDelay = 9999; // frozen until player moves
      }
    }
    chaser.update(player, level.platforms);
    if (!player.dead && chaser.overlapsPlayer(player)) player.die();
  }

  // bats update
  if (level.bats) {
    level.bats.forEach(b => {
      b.update(player, level.platforms);
      if (!player.dead && b.overlapsPlayer(player)) player.die();
    });
  }

  // umbrella boost update
  if ((player.umbrellaTimer || 0) > 0) player.umbrellaTimer--;
  if (level.umbrellas) {
    level.umbrellas.forEach(u => {
      u.update();
      if (u.checkCollect(player)) player.umbrellaTimer = 180;
    });
  }

  // parrot — spawn trigger + update
  if (level.parrot) {
    level.parrot.trySpawn(player, cam.x, cam.y);
    if (level.parrot.active) level.parrot.update(player, level.platforms, cam.y);
  }

  // monkey spawner — paused during umbrella boost OR active parrot
  if (level.monkeySpawner && !(player.umbrellaTimer > 0) && !level.parrot?.active) {
    level.monkeySpawner.update(player, level.platforms);
  }

  // controlLoss decay
  if ((player.controlLoss || 0) > 0) { player.controlLoss--; player.vx *= 0.88; }

  // slippery branch sliding — player drifts in slipDir
  if (player.onGround) {
    level.platforms.forEach(p => {
      if (p.slippery && player.x + player.w > p.x && player.x < p.x + p.w &&
          Math.abs(p.y - (player.y + player.h)) < 6) {
        player.vx += (p.slipDir || 1) * 0.27;
      }
    });
  }

  // death zone
  if (player.y > level.deathY) player.die();
  if (level.deathMinY !== undefined && player.y + player.h < level.deathMinY) player.die();
  // horizontal gravity: die when falling through a wall gap off the side
  if (level.horizontalGravity) {
    if (player.x + player.w < -40) player.die();
    if (player.x > level.width + 40) player.die();
  }

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
      if (level.gravHintOnShard && shardsCollected === 1) gravHint = true;
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

  // end anim tick (level 2 portal entry) — skip normal player physics during this
  if (player.endAnimActive) {
    player.vx = 0; player.vy = 0;
    player.endAnimTimer++;
    if (player.endAnimTimer >= 4) {
      player.endAnimTimer = 0;
      player.endAnimFrame++;
      if (player.endAnimFrame >= 25) {
        player.endAnimDone   = true;
        player.endAnimActive = false;
        if (levelIndex + 1 >= LEVELS.length) {
          state = State.CUTSCENE; cutsceneTimer = 0;
          SoundFX.stopBGM(); SoundFX.startCutsceneMusic();
        } else {
          state = State.LEVEL_COMPLETE; messageTimer = 0;
        }
      }
    }
  }

  // portal enter
  if (level.portal.active && !player.endAnimActive && !player.endAnimDone) {
    const p = level.portal;
    if (overlaps(player, { x: p.cx - 24, y: p.cy - 24, w: 48, h: 48 })) {
      SoundFX.portalEnter();
      if (player.endSprite && player.endSprite.complete && player.endSprite.naturalWidth > 0) {
        player.endAnimActive    = true;
        player.endAnimFrame     = 0;
        player.endAnimTimer     = 0;
        player.endStartWorldX   = player.cx;
        player.endStartWorldY   = player.cy;
        player.endPortalWorldX  = p.cx;
        player.endPortalWorldY  = p.cy;
        player.vx = 0; player.vy = 0;
      } else if (levelIndex + 1 >= LEVELS.length) {
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
  if (state === State.INTRO_CUTSCENE) { drawIntroCutscene(); return; }
  if (state === State.CUTSCENE) { drawCutscene(); return; }

  drawBackground();

  if (level.currents) level.currents.forEach(c => c.draw(ctx, cam.x));

  // ocean entities — draw behind platforms
  if (level.isOcean) {
    if (level.whirlpools)       level.whirlpools.forEach(w  => w.draw(ctx, cam.x, cam.y));
    if (level.verticalCurrents) level.verticalCurrents.forEach(vc => vc.draw(ctx, cam.x, cam.y));
    if (level.fishSchools)      level.fishSchools.forEach(f  => f.draw(ctx, cam.x, cam.y));
  }

  level.platforms.forEach(p => p.draw(ctx, cam.x, cam.y));
  if (level.horizontalGravity) drawActiveWall();
  if (level.fans) level.fans.forEach(f => f.draw(ctx, cam.x, cam.y));

  // ocean entities — draw in front of platforms
  if (level.isOcean) {
    if (level.jellies)   level.jellies.forEach(j  => j.draw(ctx, cam.x, cam.y));
    if (level.tentacles) level.tentacles.forEach(t => t.draw(ctx, cam.x, cam.y));
    if (level.bubbles)   level.bubbles.forEach(b  => b.draw(ctx, cam.x, cam.y));
  }

  level.hazards.forEach(h    => h.draw(ctx, cam.x, cam.y));
  level.checkpoints.forEach(c => c.draw(ctx, cam.x, cam.y));
  level.shards.forEach(s     => s.draw(ctx, cam.x, cam.y));
  level.portal.draw(ctx, cam.x, cam.y);
  if (level.teleportPortals) level.teleportPortals.forEach(tp => tp.draw(ctx, cam.x, cam.y));
  if (level.spring) level.spring.draw(ctx, cam.x, cam.y);
  if (level.bats) level.bats.forEach(b => b.draw(ctx, cam.x, cam.y));
  if (level.umbrellas) level.umbrellas.forEach(u => u.draw(ctx, cam.x, cam.y));
  if (level.monkeySpawner) level.monkeySpawner.draw(ctx, cam.x, cam.y);
  if (level.parrot) level.parrot.draw(ctx, cam.x, cam.y);
  if (chaser) chaser.draw(ctx, cam.x, cam.y);
  player.draw(ctx, cam.x, cam.y);

  // umbrella boost HUD — floats above player
  if ((player.umbrellaTimer || 0) > 0) {
    const px  = Math.round(player.x + player.w * 0.5 - cam.x);
    const py  = Math.round(player.y - cam.y);
    const prog = player.umbrellaTimer / 180;
    ctx.save();
    // icon
    const ux = px, uy = py - 44;
    ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#3388dd';
    ctx.beginPath(); ctx.moveTo(ux - 11, uy); ctx.arc(ux, uy, 11, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2266bb';
    for (let i = 0; i < 4; i++) {
      const a = Math.PI + (i + 0.5) * (Math.PI / 4);
      ctx.beginPath(); ctx.arc(ux + Math.cos(a) * 9, uy + Math.sin(a) * 2, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#a06820'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux, uy + 12); ctx.stroke();
    ctx.beginPath(); ctx.arc(ux - 3, uy + 12, 2.5, 0, Math.PI); ctx.stroke();
    ctx.lineCap = 'butt';
    // progress bar
    const bw = 38, bh = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(px - bw * 0.5, py - 24, bw, bh);
    const bg = ctx.createLinearGradient(px - bw * 0.5, 0, px + bw * 0.5, 0);
    bg.addColorStop(0, '#44aaff'); bg.addColorStop(1, '#88ddff');
    ctx.fillStyle = bg;
    ctx.fillRect(px - bw * 0.5, py - 24, bw * prog, bh);
    ctx.restore();
  }

  // tentacle screen warning — поверх всего, перед UI
  if (level.tentacles) level.tentacles.forEach(t => t.drawWarning(ctx, W, H, cam.x, cam.y));

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

  // double-jump hint — pushed down when gravity hint is also showing
  if (djHint) drawDJHint(level.gravityToggle && gravHint ? H / 2 + 30 : H / 2 - 60);

  // gravity indicator for level 5
  if (level.gravityToggle) drawGravityIndicator();
  if (level.gravityToggle && gravHint) drawGravHint();

  // wall indicator for level 6
  if (level.horizontalGravity && !level.gravityToggle) drawWallIndicator();

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

function drawDJHint(cy = H / 2 - 60) {
  const t     = Date.now() / 600;
  const pulse = 0.72 + Math.sin(t) * 0.28;
  const cx = W / 2;

  ctx.save();

  // фон таблетки
  const TW = 500, TH = 60;
  ctx.globalAlpha = 0.90 * pulse;
  ctx.fillStyle = '#080318';
  ctx.beginPath();
  ctx.roundRect(cx - TW / 2, cy - TH / 2, TW, TH, 12);
  ctx.fill();

  // рамка
  ctx.globalAlpha = 0.85 * pulse;
  ctx.strokeStyle = '#4870e8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(cx - TW / 2, cy - TH / 2, TW, TH, 12);
  ctx.stroke();

  // иконка [Space] — широкая клавиша
  const kx = cx - 170, ky = cy;
  const KW = 64, KH = 28;
  ctx.globalAlpha = 0.95 * pulse;
  const kg = ctx.createLinearGradient(kx, ky - KH / 2, kx, ky + KH / 2);
  kg.addColorStop(0, '#304898'); kg.addColorStop(1, '#1a2858');
  ctx.fillStyle = kg;
  ctx.beginPath(); ctx.roundRect(kx - KW / 2, ky - KH / 2, KW, KH, 5); ctx.fill();
  ctx.globalAlpha = 0.40 * pulse;
  ctx.fillStyle = '#8090d8';
  ctx.fillRect(kx - KW / 2 + 5, ky - KH / 2 + 4, KW - 10, 4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#dde8ff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SPACE', kx, ky + 1);

  // текст
  ctx.globalAlpha = 0.96 * pulse;
  ctx.fillStyle = '#c8d8ff';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('×2 — двойной прыжок в воздухе', cx - 126, cy + 1);

  ctx.restore();
}

function drawGravHint() {
  const t  = Date.now() / 600;
  const pulse = 0.72 + Math.sin(t) * 0.28;
  const cx = W / 2, cy = H / 2 - 60;

  ctx.save();

  // фон таблетки
  const TW = 470, TH = 60;
  ctx.globalAlpha = 0.90 * pulse;
  ctx.fillStyle = '#0d0628';
  ctx.beginPath();
  ctx.roundRect(cx - TW / 2, cy - TH / 2, TW, TH, 12);
  ctx.fill();

  // цветная рамка
  ctx.globalAlpha = 0.85 * pulse;
  ctx.strokeStyle = '#9060f0';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(cx - TW / 2, cy - TH / 2, TW, TH, 12);
  ctx.stroke();

  // иконка [G]
  const kx = cx - 160, ky = cy;
  const KW = 30, KH = 26;
  ctx.globalAlpha = 0.95 * pulse;
  const kg = ctx.createLinearGradient(kx, ky - KH / 2, kx, ky + KH / 2);
  kg.addColorStop(0, '#6050d0'); kg.addColorStop(1, '#361f88');
  ctx.fillStyle = kg;
  ctx.beginPath(); ctx.roundRect(kx - KW / 2, ky - KH / 2, KW, KH, 5); ctx.fill();
  ctx.globalAlpha = 0.40 * pulse;
  ctx.fillStyle = '#c0b0ff';
  ctx.fillRect(kx - KW / 2 + 4, ky - KH / 2 + 4, KW - 8, 4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f0ecff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('G', kx, ky + 1);

  // текст
  ctx.globalAlpha = 0.96 * pulse;
  ctx.fillStyle = '#ddd0ff';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('— нажми, чтобы сменить гравитацию', cx - 130, cy + 1);

  ctx.restore();
}

function drawGravityIndicator() {
  const inv   = player.gravityDir < 0;
  const t     = Date.now() / 280;
  const pulse = 0.5 + Math.sin(t) * 0.5;

  // показываем ПРОТИВОПОЛОЖНОЕ состояние (куда переключимся)
  const toInv = !inv;

  // ── размеры и позиция ─────────────────────────────────────────────────────
  const PW = 86, PH = 96;
  const px = W - PW - 16, py = H - PH - 16;
  const cx = px + PW / 2;
  const SURF = 9;
  const SX = px + 8, SW = PW - 16;

  ctx.save();

  // ── фон ──────────────────────────────────────────────────────────────────
  ctx.globalAlpha = 0.86;
  ctx.fillStyle = '#06020f';
  ctx.beginPath();
  ctx.roundRect(px, py, PW, PH, 12);
  ctx.fill();

  // пульсирующая рамка цвета ЦЕЛЕВОЙ стороны
  ctx.globalAlpha = 0.28 + pulse * 0.35;
  ctx.strokeStyle = toInv ? '#9838e8' : '#2858d8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px, py, PW, PH, 12);
  ctx.stroke();

  // ── ПОТОЛОК ───────────────────────────────────────────────────────────────
  const ceilY = py + 6;
  if (toInv) {
    const cg = ctx.createLinearGradient(cx, ceilY + SURF, cx, ceilY + SURF + 38);
    cg.addColorStop(0, `rgba(155,55,255,${0.5 * pulse})`);
    cg.addColorStop(1, 'rgba(155,55,255,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = cg;
    ctx.fillRect(SX, ceilY + SURF, SW, 38);
  }
  ctx.globalAlpha = toInv ? 0.95 : 0.20;
  ctx.fillStyle = toInv ? '#6820b8' : '#181028';
  ctx.fillRect(SX, ceilY, SW, SURF);
  // тайловые риски
  ctx.globalAlpha = toInv ? 0.30 : 0.07; ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) ctx.fillRect(SX + 5 + i * 17, ceilY, 1, SURF);
  // грань приземления
  ctx.globalAlpha = toInv ? (0.55 + pulse * 0.45) : 0.10;
  ctx.fillStyle = toInv ? '#d898ff' : '#2d1a44';
  ctx.fillRect(SX, ceilY + SURF - 2, SW, 2);

  // ── ПОЛ ───────────────────────────────────────────────────────────────────
  const floorY = py + PH - 6 - SURF;
  if (!toInv) {
    const fg = ctx.createLinearGradient(cx, floorY - 38, cx, floorY);
    fg.addColorStop(0, 'rgba(28,88,220,0)');
    fg.addColorStop(1, `rgba(28,88,220,${0.5 * pulse})`);
    ctx.globalAlpha = 1; ctx.fillStyle = fg;
    ctx.fillRect(SX, floorY - 38, SW, 38);
  }
  ctx.globalAlpha = !toInv ? 0.95 : 0.20;
  ctx.fillStyle = !toInv ? '#1e48b0' : '#0a1026';
  ctx.fillRect(SX, floorY, SW, SURF);
  ctx.globalAlpha = !toInv ? 0.30 : 0.07; ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) ctx.fillRect(SX + 5 + i * 17, floorY, 1, SURF);
  ctx.globalAlpha = !toInv ? (0.55 + pulse * 0.45) : 0.10;
  ctx.fillStyle = !toInv ? '#78b0ff' : '#14203a';
  ctx.fillRect(SX, floorY, SW, 2);

  // ── ЧАСТИЦЫ дрейфуют к ЦЕЛЕВОЙ поверхности ───────────────────────────────
  const pTop = ceilY + SURF + 2, pBot = floorY - 2, span = pBot - pTop;
  ctx.fillStyle = toInv ? '#c070ff' : '#5888ff';
  for (let i = 0; i < 5; i++) {
    const ph   = ((t * 0.6 + i * 0.68) % 1);
    const frac = toInv ? 1 - ph : ph;
    const dy   = pTop + frac * span;
    const dx   = SX + 8 + (i * 14) % (SW - 16);
    ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.65;
    ctx.beginPath();
    ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── МИНИ-ПЕРСОНАЖ — показывает ЦЕЛЕВОЕ положение ─────────────────────────
  const mpX = cx + 18;
  ctx.globalAlpha = 0.92;
  if (toInv) {
    const fy = ceilY + SURF;
    ctx.fillStyle = '#c0a0ff';
    ctx.fillRect(mpX - 4, fy,     3, 6);
    ctx.fillRect(mpX + 1, fy,     3, 6);
    ctx.fillRect(mpX - 4, fy + 6, 8, 8);
    ctx.fillStyle = '#d8c0ff';
    ctx.beginPath(); ctx.arc(mpX, fy + 20, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a0030';
    ctx.beginPath(); ctx.ellipse(mpX + 2, fy + 21, 1.5, 2, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    const fy = floorY;
    ctx.fillStyle = '#c0a0ff';
    ctx.fillRect(mpX - 4, fy - 6,  3, 6);
    ctx.fillRect(mpX + 1, fy - 6,  3, 6);
    ctx.fillRect(mpX - 4, fy - 14, 8, 8);
    ctx.fillStyle = '#d8c0ff';
    ctx.beginPath(); ctx.arc(mpX, fy - 20, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a0030';
    ctx.beginPath(); ctx.ellipse(mpX + 2, fy - 21, 1.5, 2, 0, 0, Math.PI * 2); ctx.fill();
  }

  // ── ИКОНКА СМЕНЫ ГРАВИТАЦИИ (стрелки ↑↓) ────────────────────────────────
  const midY = (ceilY + SURF + floorY) / 2;
  const icX  = cx - 16;

  // --- Верхняя стрелка (к потолку) — фиолетовая ---
  const upBright = toInv ? (0.88 + pulse * 0.12) : 0.18;
  if (toInv) {
    ctx.globalAlpha = 0.22 * pulse;
    ctx.fillStyle = '#a040ff';
    ctx.beginPath(); ctx.arc(icX, midY - 10, 11, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = upBright;
  ctx.fillStyle = toInv ? '#d090ff' : '#2a1040';
  ctx.beginPath();
  ctx.moveTo(icX,     midY - 16);
  ctx.lineTo(icX - 7, midY - 6);
  ctx.lineTo(icX - 3, midY - 6);
  ctx.lineTo(icX - 3, midY - 2);
  ctx.lineTo(icX + 3, midY - 2);
  ctx.lineTo(icX + 3, midY - 6);
  ctx.lineTo(icX + 7, midY - 6);
  ctx.closePath(); ctx.fill();

  // --- Нижняя стрелка (к полу) — синяя ---
  const downBright = !toInv ? (0.88 + pulse * 0.12) : 0.18;
  if (!toInv) {
    ctx.globalAlpha = 0.22 * pulse;
    ctx.fillStyle = '#2060e0';
    ctx.beginPath(); ctx.arc(icX, midY + 10, 11, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = downBright;
  ctx.fillStyle = !toInv ? '#80b8ff' : '#0e1830';
  ctx.beginPath();
  ctx.moveTo(icX,     midY + 16);
  ctx.lineTo(icX - 7, midY + 6);
  ctx.lineTo(icX - 3, midY + 6);
  ctx.lineTo(icX - 3, midY + 2);
  ctx.lineTo(icX + 3, midY + 2);
  ctx.lineTo(icX + 3, midY + 6);
  ctx.lineTo(icX + 7, midY + 6);
  ctx.closePath(); ctx.fill();

  // --- Маленькая клавиша [G] между стрелками ---
  ctx.globalAlpha = 0.50;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.roundRect(icX - 6, midY - 5, 13, 10, 2); ctx.fill();
  ctx.globalAlpha = 0.70 + pulse * 0.12;
  const kgg = ctx.createLinearGradient(icX, midY - 5, icX, midY + 5);
  kgg.addColorStop(0, '#3828a8'); kgg.addColorStop(1, '#20185c');
  ctx.fillStyle = kgg;
  ctx.beginPath(); ctx.roundRect(icX - 6, midY - 5, 13, 10, 2); ctx.fill();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#a090e8';
  ctx.fillRect(icX - 4, midY - 4, 9, 2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#d8ccff';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('G', icX, midY);

  // ── ПОДПИСЬ «gravity change» ──────────────────────────────────────────────
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = '#a090c8';
  ctx.font = '8px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('gravity change', cx, py + PH - 3);

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

function drawIntroCutscene() {
  const t = cutsceneTimer;

  // Evening → night
  const nightP = Math.min(1, Math.max(0, (t - 80) / 370));
  const r = Math.floor(88 - nightP * 80);
  const g = Math.floor(52 - nightP * 48);
  const b = Math.floor(80 - nightP * 66);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, `rgb(${r},${g},${b})`);
  grad.addColorStop(1, `rgb(${Math.floor(r*0.4)},${Math.floor(g*0.4)},${Math.floor(b*0.5)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Window
  const wx = W * 0.72, wy = H * 0.32;
  const ww = 140, wh = 200;

  const skyR = Math.floor(160 - nightP * 155);
  const skyG = Math.floor(100 - nightP * 96);
  const skyB = Math.floor(60  + nightP * 80);
  const winSky = ctx.createLinearGradient(wx - ww/2, wy - wh/2, wx + ww/2, wy + wh/2);
  winSky.addColorStop(0, `rgb(${skyR},${skyG},${skyB})`);
  winSky.addColorStop(1, `rgb(${Math.floor(skyR*0.5)},${Math.floor(skyG*0.4)},${Math.floor(skyB*0.7)})`);
  ctx.fillStyle = winSky;
  ctx.fillRect(wx - ww/2, wy - wh/2, ww, wh);

  // Setting sun
  if (t < 280) {
    const sunY = wy - wh * 0.3 + (t / 280) * (wh * 0.9);
    const sunA = 1 - nightP;
    const sg = ctx.createRadialGradient(wx, sunY, 0, wx, sunY, 50);
    sg.addColorStop(0, `rgba(255,190,80,${0.9 * sunA})`);
    sg.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(wx, sunY, 50, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,160,50,${sunA})`;
    ctx.beginPath(); ctx.arc(wx, sunY, 20, 0, Math.PI * 2); ctx.fill();
  }

  // Stars
  if (nightP > 0.35) {
    const starA = (nightP - 0.35) / 0.65;
    for (let i = 0; i < 12; i++) {
      const stx = wx - ww/2 + 10 + (i * 19 + 7) % (ww - 20);
      const sty = wy - wh/2 + 8  + (i * 31 + 3) % (wh * 0.65);
      ctx.save();
      ctx.globalAlpha = starA * (0.4 + Math.sin(t * 0.05 + i) * 0.35);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(stx, sty, 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // Window frame
  ctx.strokeStyle = '#1a0e24'; ctx.lineWidth = 6;
  ctx.strokeRect(wx - ww/2, wy - wh/2, ww, wh);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wx, wy - wh/2); ctx.lineTo(wx, wy + wh/2);
  ctx.moveTo(wx - ww/2, wy); ctx.lineTo(wx + ww/2, wy);
  ctx.stroke();

  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, H - 80, W, 80);

  // Bed
  const bedX = W * 0.32, bedY = H * 0.62;
  const bedW = 320, bedH = 90;
  ctx.fillStyle = '#2a1840';
  ctx.fillRect(bedX - bedW/2, bedY + bedH - 20, bedW, 30);
  ctx.fillStyle = '#3e2860';
  ctx.fillRect(bedX - bedW/2, bedY, bedW, bedH - 10);
  ctx.fillStyle = '#e8d8ff';
  ctx.beginPath(); ctx.roundRect(bedX - bedW/2 + 10, bedY + 8, 95, 42, 6); ctx.fill();

  // Character lying down
  const lieP = Math.min(1, Math.max(0, (t - 120) / 140));
  const ch_x   = bedX - bedW/2 + 55;
  const ch_y   = (bedY - 52) + lieP * ((bedY + 12) - (bedY - 52));

  const blanketLen = 50 + lieP * 175;
  ctx.fillStyle = '#6040b0';
  ctx.beginPath(); ctx.roundRect(bedX - bedW/2 + 80, bedY + 10, blanketLen, bedH - 25, 4); ctx.fill();
  ctx.fillStyle = 'rgba(180,140,255,0.3)';
  ctx.fillRect(bedX - bedW/2 + 80, bedY + 10, blanketLen, 4);

  if (lieP < 0.85) {
    ctx.save();
    ctx.globalAlpha = 1 - lieP / 0.85;
    ctx.fillStyle = '#c0a0ff';
    ctx.beginPath(); ctx.roundRect(ch_x - 14, ch_y + 12, 28, 50, 5); ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = '#d8c0ff';
  ctx.beginPath(); ctx.ellipse(ch_x, ch_y, 16, 17, 0, 0, Math.PI * 2); ctx.fill();

  // Eyes open → closing
  const eyeCloseP = Math.min(1, Math.max(0, (t - 340) / 110));
  if (eyeCloseP < 1) {
    ctx.fillStyle = '#1a0030';
    ctx.beginPath(); ctx.ellipse(ch_x + 6, ch_y - 1, 2.5, Math.max(0.2, 3.2 * (1 - eyeCloseP)), 0, 0, Math.PI * 2); ctx.fill();
    if (eyeCloseP < 0.4) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ch_x + 6.5, ch_y - 2, 0.9, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    ctx.strokeStyle = '#1a0030'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(ch_x + 2, ch_y - 1); ctx.lineTo(ch_x + 9, ch_y - 1); ctx.stroke();
  }

  // Dream particles
  if (t > 380) {
    const pA = Math.min(1, (t - 380) / 100);
    const pF = t > 500 ? Math.max(0, 1 - (t - 500) / 60) : 1;
    for (let i = 0; i < 8; i++) {
      const pa    = (i / 8) * Math.PI * 2 + t * 0.013;
      const drift = (t * 0.38 + i * 44) % 130;
      const pr    = 26 + Math.sin(t * 0.04 + i) * 10;
      ctx.save();
      ctx.globalAlpha = pA * pF * (0.5 - drift / 260) * (0.55 + Math.sin(t * 0.07 + i) * 0.25);
      ctx.fillStyle = i % 2 === 0 ? '#a080ff' : '#80b0ff';
      ctx.beginPath();
      ctx.arc(ch_x + Math.cos(pa) * pr, ch_y - 18 - drift, 2 + Math.sin(t * 0.05 + i) * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Narrative text
  let text = '';
  if      (t >= 70  && t < 200) text = 'Вечер догорает...';
  else if (t >= 200 && t < 340) text = 'Ты ложишься спать.';
  else if (t >= 340 && t < 460) text = 'Глаза закрываются...';
  else if (t >= 460 && t < 520) text = 'Сны приходят...';

  if (text) {
    const phase = t < 200 ? (t - 70) / 130 :
                  t < 340 ? (t - 200) / 140 :
                  t < 460 ? (t - 340) / 120 :
                             (t - 460) / 60;
    const a = Math.min(1, phase * 4) * Math.min(1, (1 - phase) * 4 + 0.3);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a) * 0.92;
    ctx.fillStyle = '#f0e0ff';
    ctx.font = 'italic 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#7050ff';
    ctx.shadowBlur = 22;
    ctx.fillText(text, W / 2, H - 70);
    ctx.restore();
  }

  // Skip hint
  if (t > 60 && t < 510) {
    ctx.save();
    ctx.globalAlpha = 0.45 + Math.sin(Date.now() / 380) * 0.18;
    ctx.fillStyle = '#9080b0';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('[ Space — пропустить ]', W / 2, H - 24);
    ctx.restore();
  }

  // Fade to dark
  if (t > 460) {
    const fadeOut = Math.min(1, (t - 460) / 110);
    ctx.fillStyle = `rgba(8,4,20,${fadeOut})`;
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
    'Сон 1 — Кошмар (преследователь)',
    'Сон 2 — Падение (↑/W — потолок, ↓/S — пол)',
    'Сон 3 — Спокойный (туториал)',
    'Сон 4 — Водный (слабая гравитация)',
    'Сон 5 — Ломаный (исчезающие платформы)',
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
