class Platform {
  constructor(x, y, w, h, color = '#1a1a3a') {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.color = color;
    this.active = true;
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX, sy = this.y - camY;
    ctx.fillStyle = this.color;
    ctx.fillRect(sx, sy, this.w, this.h);
    // top highlight
    ctx.fillStyle = 'rgba(120,100,220,0.3)';
    ctx.fillRect(sx, sy, this.w, 3);
  }
}

class Shard {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 20; this.h = 20;
    this.collected = false;
    this.angle = 0;
    this.pulse = 0;
    this.particles = [];
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(dt) {
    this.angle += 0.04;
    this.pulse += 0.07;
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.life -= 1;
      p.vy += 0.05;
    });
  }

  collect() {
    this.collected = true;
    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1 + Math.random() * 3;
      this.particles.push({
        x: this.cx, y: this.cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2,
        life: 30 + Math.random() * 20
      });
    }
  }

  draw(ctx, camX, camY) {
    // draw burst particles even after collected
    this.particles.forEach(p => {
      const a = p.life / 50;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#a0e0ff';
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y - camY, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (this.collected) return;

    const sx = this.cx - camX, sy = this.cy - camY;
    const glow = 10 + Math.sin(this.pulse) * 5;

    ctx.save();
    // glow
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, glow * 2);
    grad.addColorStop(0, 'rgba(160,224,255,0.6)');
    grad.addColorStop(1, 'rgba(160,224,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, glow * 2, 0, Math.PI * 2);
    ctx.fill();

    // crystal shape
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);
    ctx.fillStyle = '#c0eeff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, -2);
    ctx.lineTo(4, 8);
    ctx.lineTo(0, 6);
    ctx.lineTo(-4, 8);
    ctx.lineTo(-6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

class Portal {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 48; this.h = 72;
    this.active = false;
    this.pulse = 0;
    this.rotation = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  activate() { this.active = true; }

  update() {
    this.pulse += 0.05;
    if (this.active) this.rotation += 0.02;
  }

  draw(ctx, camX, camY) {
    const sx = this.cx - camX, sy = this.cy - camY;
    const alpha = this.active ? 1 : 0.25;
    const scale = this.active ? 1 + Math.sin(this.pulse) * 0.08 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sx, sy);
    ctx.scale(scale, scale);
    ctx.rotate(this.rotation);

    // outer ring
    const r = 30;
    const outerGrad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r);
    outerGrad.addColorStop(0, this.active ? 'rgba(180,80,255,0.9)' : 'rgba(80,60,120,0.5)');
    outerGrad.addColorStop(1, 'rgba(80,0,160,0)');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // inner glow
    const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.5);
    innerGrad.addColorStop(0, this.active ? 'rgba(240,180,255,1)' : 'rgba(140,100,200,0.4)');
    innerGrad.addColorStop(1, 'rgba(160,60,255,0)');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();

    if (this.active) {
      // swirl lines
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + this.rotation * 3;
        ctx.strokeStyle = `rgba(220,160,255,${0.3 + Math.sin(this.pulse + i) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * r * 0.8, Math.sin(ang) * r * 0.8);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

class Hazard {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX, sy = this.y - camY;
    // spikes
    const count = Math.floor(this.w / 16);
    ctx.fillStyle = '#cc2244';
    for (let i = 0; i < count; i++) {
      const bx = sx + i * 16;
      ctx.beginPath();
      ctx.moveTo(bx, sy + this.h);
      ctx.lineTo(bx + 8, sy);
      ctx.lineTo(bx + 16, sy + this.h);
      ctx.closePath();
      ctx.fill();
    }
  }
}

class Checkpoint {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 16; this.h = 40;
    this.activated = false;
    this.pulse = 0;
  }

  get cx() { return this.x + this.w / 2; }

  activate() { this.activated = true; }

  update() { this.pulse += 0.06; }

  draw(ctx, camX, camY) {
    const sx = this.x - camX, sy = this.y - camY;
    ctx.save();
    if (this.drawAngle) {
      ctx.translate(sx + this.w / 2, sy + this.h / 2);
      ctx.rotate(this.drawAngle);
      ctx.translate(-(sx + this.w / 2), -(sy + this.h / 2));
    }
    // pole
    ctx.fillStyle = '#443366';
    ctx.fillRect(sx + 6, sy, 4, this.h);
    // flag
    const col = this.activated
      ? `hsl(${270 + Math.sin(this.pulse) * 20}, 80%, 65%)`
      : '#334';
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(sx + 10, sy);
    ctx.lineTo(sx + 26, sy + 8);
    ctx.lineTo(sx + 10, sy + 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Disappearing platform — "Ломаный сон"
class FadePlatform extends Platform {
  constructor(x, y, w, h) {
    super(x, y, w, h, '#2a1040');
    this.state = 'solid'; // solid | countdown | fading | gone | returning
    this.timer = 0;
  }

  onPlayerLand() {
    if (this.state === 'solid') { this.state = 'countdown'; this.timer = 0; }
  }

  update() {
    this.timer++;
    switch (this.state) {
      case 'countdown':
        if (this.timer >= 28) { this.state = 'fading'; this.timer = 0; }
        break;
      case 'fading':
        this.alpha = 1 - this.timer / 28;
        if (this.timer >= 28) { this.state = 'gone'; this.active = false; this.timer = 0; }
        break;
      case 'gone':
        if (this.timer >= 110) { this.state = 'returning'; this.timer = 0; }
        break;
      case 'returning':
        this.alpha = this.timer / 22;
        if (this.timer >= 22) { this.state = 'solid'; this.active = true; this.alpha = 1; this.timer = 0; }
        break;
    }
  }

  draw(ctx, camX, camY) {
    if (this.state === 'gone') return;
    const sx = this.x - camX, sy = this.y - camY;
    let a = (this.alpha !== undefined) ? this.alpha : 1;
    // flicker during countdown
    if (this.state === 'countdown' && Math.floor(this.timer / 4) % 2 === 1) a *= 0.35;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#3a1050';
    ctx.fillRect(sx, sy, this.w, this.h);
    ctx.fillStyle = this.state === 'solid' ? 'rgba(255,130,60,0.55)' : 'rgba(255,60,40,0.7)';
    ctx.fillRect(sx, sy, this.w, 3);
    ctx.restore();
  }
}

// Chasing nightmare entity — "Кошмар"
class Chaser {
  constructor(x, y, startDelay = 0) {
    this.x = x; this.y = y;
    this.w = 36; this.h = 36;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.speed = 2.2;
    this.jumpTimer = 0;
    this.pulse = 0;
    this.trailPts = [];
    this.startDelay = startDelay;
  }

  update(player, platforms) {
    this.pulse += 0.09;

    if (this.startDelay > 0) {
      this.startDelay--;
      this.vx = 0;
    } else {
      const dx = player.cx - (this.x + this.w / 2);
      this.vx = Math.sign(dx) * this.speed;

      // jump toward player when they're above
      this.jumpTimer--;
      if (this.onGround && player.y < this.y - 60 && this.jumpTimer <= 0) {
        this.vy = -9;  // halved max jump height (was -13)
        this.jumpTimer = 55;
      }

      this.speed = Math.min(4.5, this.speed + 0.0008);
    }

    this.vy += 0.6;
    if (this.vy > 16) this.vy = 16;

    this.x += this.vx;
    this.y += this.vy;
    this.onGround = false;

    for (const p of platforms) {
      if (!this._over(p)) continue;
      if (this.vy > 0 && (this.y + this.h - this.vy) <= p.y + 4) {
        this.y = p.y - this.h;
        this.vy = 0;
        this.onGround = true;
      } else if (this.vy < 0) {
        this.y = p.y + p.h;
        this.vy = 0;
      }
    }

    this.trailPts.push({ x: this.x + this.w/2, y: this.y + this.h/2, life: 18 });
    this.trailPts = this.trailPts.filter(p => p.life-- > 0);
  }

  _over(p) {
    return this.x < p.x+p.w && this.x+this.w > p.x &&
           this.y < p.y+p.h && this.y+this.h > p.y;
  }

  overlapsPlayer(player) {
    return this.x < player.x+player.w && this.x+this.w > player.x &&
           this.y < player.y+player.h && this.y+this.h > player.y;
  }

  draw(ctx, camX, camY) {
    // trail
    this.trailPts.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = (pt.life / 18) * 0.4;
      ctx.fillStyle = '#cc1030';
      ctx.beginPath();
      ctx.arc(pt.x - camX, pt.y - camY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const sx = this.x - camX + this.w/2, sy = this.y - camY + this.h/2;
    const r = 16 + Math.sin(this.pulse) * 3;

    ctx.save();
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.2);
    g.addColorStop(0, 'rgba(230,20,50,0.85)');
    g.addColorStop(0.45, 'rgba(140,0,25,0.4)');
    g.addColorStop(1, 'rgba(60,0,10,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#bb0020';
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // eyes
    ctx.fillStyle = '#ffee00';
    ctx.shadowColor = '#ffee00';
    ctx.shadowBlur = 6;
    const eo = Math.sin(this.pulse * 1.8) * 1.5;
    ctx.beginPath();
    ctx.ellipse(sx - 8, sy - 4 + eo, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 8, sy - 4 - eo, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Horizontal wind current zone
class CurrentZone {
  constructor(x1, x2, force) {
    this.x1 = x1; this.x2 = x2;
    this.force = force;
    this.pulse = 0;
  }

  applyTo(player) {
    if (player.x + player.w > this.x1 && player.x < this.x2) {
      player.vx += this.force;
      if (Math.abs(player.vx) > player.physics.moveSpeed)
        player.vx = Math.sign(player.vx) * player.physics.moveSpeed;
    }
  }

  update() { this.pulse += 0.04; }

  draw(ctx, camX) {
    const sx = this.x1 - camX, ex = this.x2 - camX;
    const w = ex - sx;
    const dir = this.force > 0;
    ctx.save();
    const g = ctx.createLinearGradient(sx, 0, ex, 0);
    if (dir) {
      g.addColorStop(0,    'rgba(80,200,255,0)');
      g.addColorStop(0.18, 'rgba(80,200,255,0.06)');
      g.addColorStop(0.72, 'rgba(80,200,255,0.16)');
      g.addColorStop(1,    'rgba(80,200,255,0)');
    } else {
      g.addColorStop(0,    'rgba(80,200,255,0)');
      g.addColorStop(0.28, 'rgba(80,200,255,0.16)');
      g.addColorStop(0.82, 'rgba(80,200,255,0.06)');
      g.addColorStop(1,    'rgba(80,200,255,0)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx, 0, w, 720);
    ctx.fillStyle = '#70d0ff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    const arr = dir ? '→' : '←';
    const baseAlpha = 0.22 + Math.sin(this.pulse) * 0.07;
    for (let ax = sx + 60; ax < ex - 20; ax += 120) {
      const relX = (ax - sx) / w;
      const edgeFade = Math.min(relX / 0.14, 1) * Math.min((1 - relX) / 0.14, 1);
      ctx.globalAlpha = baseAlpha * edgeFade;
      for (let ay = 110; ay < 640; ay += 120)
        ctx.fillText(arr, ax, ay);
    }
    ctx.restore();
  }
}

class PulsingCurrentZone extends CurrentZone {
  constructor(x1, x2, force, period = 140) {
    super(x1, x2, force);
    this.baseForce = force;
    this.period = period;
    this.timer = 0;
    // flowing arrow offset — separate per instance
    this.flowOffset = 0;
  }

  update() {
    this.timer++;
    this.pulse += 0.04;
    this.flowOffset += 0.8;

    // smooth sine-based phase: 0..1 over full period
    const t = (this.timer % this.period) / this.period;
    // use sine to produce smooth ±1 that spends time at extremes
    const sinePhase = Math.sin(t * Math.PI * 2 - Math.PI / 2); // -1..+1
    this.force = this.baseForce * (sinePhase >= 0 ? 1 : -1);
    // expose smooth blend value 0..1 (0=fully negative, 1=fully positive)
    this.blend = (sinePhase + 1) / 2;
  }

  draw(ctx, camX) {
    const sx = this.x1 - camX, ex = this.x2 - camX;
    const w = ex - sx;
    const dir = this.force > 0;

    // blend: 0 = going left, 1 = going right
    const b = this.blend ?? (dir ? 1 : 0);
    // near-switch = blend close to 0.5, i.e. |b-0.5| < 0.18
    const switchProx = 1 - Math.min(1, Math.abs(b - 0.5) / 0.18);

    // --- background fill: smoothly shifts between two gradient directions ---
    ctx.save();

    // base intensity: steady + slight breathe
    const baseAlpha = 0.13 + Math.sin(this.pulse) * 0.03;
    // peak alpha at the dominant side, fades toward 0 at switch
    const domAlpha = baseAlpha * (0.4 + 0.6 * Math.abs(b - 0.5) * 2);

    // gradient with soft edges on both sides (~18% fade zones)
    const g = ctx.createLinearGradient(sx, 0, ex, 0);
    if (dir) {
      g.addColorStop(0,    `rgba(255,120,30,0)`);
      g.addColorStop(0.18, `rgba(255,130,35,${domAlpha * 0.35})`);
      g.addColorStop(0.72, `rgba(255,160,60,${domAlpha})`);
      g.addColorStop(1,    `rgba(255,160,60,0)`);
    } else {
      g.addColorStop(0,    `rgba(255,160,60,0)`);
      g.addColorStop(0.28, `rgba(255,160,60,${domAlpha})`);
      g.addColorStop(0.82, `rgba(255,130,35,${domAlpha * 0.35})`);
      g.addColorStop(1,    `rgba(255,120,30,0)`);
    }
    // central flash near polarity switch
    if (switchProx > 0.1) {
      const mid = 0.5;
      g.addColorStop(mid - 0.01, `rgba(255,255,200,${switchProx * 0.18})`);
      g.addColorStop(mid,        `rgba(255,255,220,${switchProx * 0.22})`);
      g.addColorStop(mid + 0.01, `rgba(255,255,200,${switchProx * 0.18})`);
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx, 0, w, 720);

    // --- flowing arrows —————————————————————————————————————————
    // arrow spacing & size
    const cols = Math.ceil(w / 110) + 1;
    const rows = 5;
    const colStep = 110;
    const rowStep = 110;
    const startY = 100;

    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const arr = dir ? '→' : '←';
    // flow direction sign
    const flowSign = dir ? 1 : -1;

    for (let ci = 0; ci < cols; ci++) {
      // base x scrolls with flowOffset
      const rawX = sx + ((ci * colStep + this.flowOffset * flowSign) % w + w) % w;

      for (let ri = 0; ri < rows; ri++) {
        const ay = startY + ri * rowStep;

        // distance from center of zone
        const relX = (rawX - sx) / w; // 0..1
        // fade at zone edges
        const edgeFade = Math.min(relX / 0.08, 1) * Math.min((1 - relX) / 0.08, 1);

        // near-switch: arrows dim and shimmer
        const switchDim = 1 - switchProx * 0.6;
        const shimmer = () =>
          switchProx > 0.05 ? 0.5 + Math.sin(this.timer * 0.25 + ci * 1.3 + ri * 0.7) * 0.5 : 1;

        const alpha = (0.28 + Math.sin(this.pulse + ci * 0.5 + ri * 0.8) * 0.09)
                      * edgeFade * switchDim * shimmer();

        if (alpha < 0.02) continue;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = switchProx > 0.3 ? '#fff5c0' : '#ffcc70';
        ctx.fillText(arr, rawX, ay);
      }
    }

    ctx.restore();
  }
}

// Mini teleport portal — jumps player to a secret platform
class TeleportPortal {
  constructor(x, y, destX, destY) {
    this.x = x; this.y = y;
    this.w = 48; this.h = 72;
    this.destX = destX; this.destY = destY;
    this.pulse = 0; this.rotation = 0; this.cooldown = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update() {
    this.pulse += 0.06;
    this.rotation += 0.03;
    if (this.cooldown > 0) this.cooldown--;
  }

  checkTeleport(player) {
    if (this.cooldown > 0) return;
    if (player.x < this.x + this.w && player.x + player.w > this.x &&
        player.y < this.y + this.h && player.y + player.h > this.y) {
      player.x = (typeof this.destX === 'function') ? this.destX() : this.destX;
      player.y = (typeof this.destY === 'function') ? this.destY() : this.destY;
      player.vx = 0; player.vy = 0;
      this.cooldown = 90;
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2, spd = 1 + Math.random() * 3;
        player.trailParticles.push({
          x: player.cx + Math.cos(a) * 10, y: player.cy + Math.sin(a) * 10,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          life: 35 + Math.random() * 20, maxLife: 55, dj: true,
        });
      }
    }
  }

  draw(ctx, camX, camY) {
    const sx = this.cx - camX, sy = this.cy - camY;
    const alpha = this.cooldown > 0 ? 0.30 : 1;
    const sc = 1 + Math.sin(this.pulse) * 0.10;
    const r = 26;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sx, sy); ctx.scale(sc, sc); ctx.rotate(this.rotation);

    const og = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
    og.addColorStop(0, 'rgba(255,185,40,0.9)');
    og.addColorStop(1, 'rgba(200,100,0,0)');
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

    const ig = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.48);
    ig.addColorStop(0, 'rgba(255,245,160,1)');
    ig.addColorStop(1, 'rgba(255,160,0,0)');
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2); ctx.fill();

    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + this.rotation * 2;
      ctx.strokeStyle = `rgba(255,215,80,${0.4 + Math.sin(this.pulse + i) * 0.2})`;
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * r * 0.85, Math.sin(ang) * r * 0.85); ctx.stroke();
    }
    ctx.restore();
  }
}

// ── FanZone ───────────────────────────────────────────────────
// Вентилятор: толкает игрока по оси X в зоне воздействия (Сон 6)
// forceX > 0 — дует вправо, forceX < 0 — дует влево
class FanZone {
  constructor(x, y, w, h, forceX) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.forceX = forceX;
    this.pulse = 0;
    this.bladeAngle = 0;
  }

  applyTo(player) {
    if (player.x + player.w > this.x && player.x < this.x + this.w &&
        player.y + player.h > this.y && player.y < this.y + this.h) {
      player.vx += this.forceX;
    }
  }

  update() {
    this.pulse += 0.05;
    this.bladeAngle += 0.14;
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;
    const blowRight = this.forceX > 0;

    // ветровая зона — градиент в сторону дутья
    const grd = ctx.createLinearGradient(
      blowRight ? sx : sx + this.w, 0,
      blowRight ? sx + this.w : sx, 0
    );
    grd.addColorStop(0,   `rgba(100,200,255,${0.14 + Math.sin(this.pulse) * 0.05})`);
    grd.addColorStop(0.55, 'rgba(100,200,255,0.04)');
    grd.addColorStop(1,   'rgba(100,200,255,0)');
    ctx.save();
    ctx.fillStyle = grd;
    ctx.fillRect(sx, sy, this.w, this.h);

    // стрелки-подсказки
    ctx.globalAlpha = 0.28 + Math.sin(this.pulse * 1.4) * 0.10;
    ctx.fillStyle = '#80d8ff';
    ctx.font = '15px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const arr = blowRight ? '→' : '←';
    for (let ax = sx + 70; ax < sx + this.w - 40; ax += 90) {
      for (let ay = sy + 18; ay < sy + this.h - 8; ay += 32) {
        ctx.fillText(arr, ax, ay);
      }
    }

    // корпус вентилятора на стороне-источнике
    const fanX = blowRight ? sx + 20 : sx + this.w - 20;
    const fanY = sy + this.h / 2;
    const R = Math.min(this.h / 2 - 6, 28);

    ctx.globalAlpha = 1;
    // корпус
    ctx.fillStyle = '#0e2040';
    ctx.beginPath();
    ctx.arc(fanX, fanY, R + 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2060a0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // лопасти
    for (let i = 0; i < 4; i++) {
      const ang = this.bladeAngle + (i / 4) * Math.PI * 2;
      ctx.save();
      ctx.globalAlpha = 0.80;
      ctx.translate(fanX, fanY);
      ctx.rotate(ang);
      ctx.fillStyle = '#4090c8';
      ctx.beginPath();
      ctx.ellipse(R * 0.52, 0, R * 0.52, R * 0.17, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // втулка
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#90c8ff';
    ctx.beginPath();
    ctx.arc(fanX, fanY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ── Bat ──────────────────────────────────────────────────────
// Perches on a platform. When the player approaches, takes flight
// and slowly chases the player while steering around obstacles.
class Bat {
  constructor(x, y, grounded = false) {
    this.perchX = x; this.perchY = y;
    this.x = x; this.y = y;
    this.w = 33; this.h = 27;
    this.grounded = grounded;
    this.vx = 0; this.vy = 0;
    this.state = 'perched';
    this.detectRange = 280;
    this.speed = 1.35;
    this.flap = 0;
    this.lastFlap = 0;
    this.facing = 1;
    this.bob = Math.random() * Math.PI * 2;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  _collides(nx, ny, platforms) {
    for (const p of platforms) {
      if (!p.active) continue;
      if (nx < p.x + p.w && nx + this.w > p.x &&
          ny < p.y + p.h && ny + this.h > p.y) return true;
    }
    return false;
  }

  update(player, platforms) {
    this.bob += 0.08;
    this.lastFlap = this.flap;

    const dx = player.cx - this.cx;
    const dy = player.cy - this.cy;
    const dist = Math.hypot(dx, dy);

    if (this.state === 'perched') {
      if (this.grounded) {
        // sitting on the ground — almost still, only minimal wing twitches
        this.flap += 0.05;
      } else {
        // hover in place — slow flap with gentle vertical bob
        this.flap += 0.18;
        this.y = this.perchY + Math.sin(this.bob) * 3;
        this._maybePlayFlap(dist, 0.45);
      }
      if (dist < this.detectRange) {
        this.state = 'flying';
        this.vy = -0.5;
      }
      return;
    }

    this.flap += 0.42;
    this._maybePlayFlap(dist, 1.0);

    // seek player with light steering
    const ang = Math.atan2(dy, dx);
    const tvx = Math.cos(ang) * this.speed;
    const tvy = Math.sin(ang) * this.speed + Math.sin(this.bob) * 0.15;
    this.vx += (tvx - this.vx) * 0.07;
    this.vy += (tvy - this.vy) * 0.07;

    if (this.vx < -0.05) this.facing = -1;
    else if (this.vx > 0.05) this.facing = 1;

    // move on each axis separately; steer around blocking platforms
    const nx = this.x + this.vx;
    if (!this._collides(nx, this.y, platforms)) {
      this.x = nx;
    } else {
      this.vx *= 0.3;
      // bias vertically toward player's side so the bat slides past
      this.vy += (dy >= 0 ? 1 : -1) * 0.25;
    }

    const ny = this.y + this.vy;
    if (!this._collides(this.x, ny, platforms)) {
      this.y = ny;
    } else {
      // hit ceiling/floor: try to go around horizontally toward player
      this.vy *= 0.3;
      this.vx += (dx >= 0 ? 1 : -1) * 0.25;
    }
  }

  // Trigger flap sound once per wing cycle (when sin(flap) crosses zero upward).
  _maybePlayFlap(dist, intensity) {
    const prev = Math.sin(this.lastFlap);
    const cur  = Math.sin(this.flap);
    if (prev <= 0 && cur > 0) {
      const fade = Math.max(0, 1 - dist / 700);
      const vol = fade * intensity * 0.8;
      if (vol > 0.05) SoundFX.batFlap(vol);
    }
  }

  overlapsPlayer(player) {
    return this.x < player.x + player.w && this.x + this.w > player.x &&
           this.y < player.y + player.h && this.y + this.h > player.y;
  }

  draw(ctx, camX, camY) {
    const sx = this.cx - camX;
    const sy = this.cy - camY;
    const flying = this.state === 'flying';
    const flapPhase = flying ? Math.sin(this.flap) : Math.sin(this.flap) * 0.4;
    const wingExt = flying ? 6 + flapPhase * 4 : 1.5 + flapPhase * 2;
    const wingY = flapPhase * (flying ? 2.5 : 1.5);

    ctx.save();

    // purple aura — makes the bat readable on dark backgrounds
    const auraR = 27 + (flying ? Math.abs(flapPhase) * 5 : 0);
    const aura = ctx.createRadialGradient(sx, sy, 0, sx, sy, auraR);
    aura.addColorStop(0, 'rgba(180,120,255,0.35)');
    aura.addColorStop(0.5, 'rgba(140,80,220,0.18)');
    aura.addColorStop(1, 'rgba(120,60,200,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(sx, sy, auraR, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(sx, sy);
    ctx.scale(this.facing * 1.5, 1.5);

    // wings (drawn behind body) — dark grey with light outline
    ctx.fillStyle = '#1a1a22';
    ctx.strokeStyle = '#b090e0';
    ctx.lineWidth = 1.2;
    // left wing
    ctx.beginPath();
    ctx.moveTo(-2, -1);
    ctx.lineTo(-9 - wingExt, -3 + wingY);
    ctx.lineTo(-12 - wingExt, 1 + wingY);
    ctx.lineTo(-9 - wingExt * 0.6, 2 + wingY * 0.5);
    ctx.lineTo(-6 - wingExt * 0.4, 5 + wingY * 0.3);
    ctx.lineTo(-2, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // right wing
    ctx.beginPath();
    ctx.moveTo(2, -1);
    ctx.lineTo(9 + wingExt, -3 + wingY);
    ctx.lineTo(12 + wingExt, 1 + wingY);
    ctx.lineTo(9 + wingExt * 0.6, 2 + wingY * 0.5);
    ctx.lineTo(6 + wingExt * 0.4, 5 + wingY * 0.3);
    ctx.lineTo(2, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // body
    ctx.fillStyle = '#15151c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ears
    ctx.beginPath();
    ctx.moveTo(-4, -5); ctx.lineTo(-3, -10); ctx.lineTo(-1, -5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, -5); ctx.lineTo(3, -10); ctx.lineTo(1, -5);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // eyes
    ctx.fillStyle = '#ff4040';
    ctx.shadowColor = '#ff2020';
    ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(-2.5, -1, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.5, -1, 1.3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}

// ── SpringJumper ─────────────────────────────────────────────
class SpringJumper {
  constructor(x, y) {
    this.spawnX = x; this.spawnY = y;
    this.startX = x; this.startY = y;
    this.x = x; this.y = y;
    this.w = 44; this.h = 28;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.squish = 0;
    this.squishTimer = 0;
    this.LAUNCH = 26;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(player, platforms, deathY) {
    this.vy += 0.55;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.85;

    if (this.y > deathY) { this.x = this.startX; this.y = this.startY; this.vx = 0; this.vy = 0; }

    this.onGround = false;
    for (const p of platforms) {
      if (!p.active) continue;
      if (this.x + this.w > p.x && this.x < p.x + p.w &&
          this.y + this.h > p.y && this.y + this.h < p.y + p.h + 20 && this.vy >= 0) {
        this.y = p.y - this.h; this.vy = 0; this.onGround = true;
      }
    }

    const pHit = player.x < this.x + this.w && player.x + player.w > this.x &&
                 player.y + player.h > this.y + 4 && player.y < this.y + this.h;
    if (pHit) {
      const fromLeft = player.cx < this.cx;
      this.vx += fromLeft ? 3.5 : -3.5;
    }

    const onTop = player.x + player.w > this.x + 4 && player.x < this.x + this.w - 4 &&
                  player.y + player.h >= this.y && player.y + player.h <= this.y + 16 &&
                  player.vy > 0;
    if (onTop && this.squishTimer === 0) {
      player.vy = -this.LAUNCH;
      player.vx = 0;
      player.onGround = false;
      player.canDoubleJump = true;
      this.squishTimer = 18;
      SoundFX.springBoing();
    }

    if (this.squishTimer > 0) {
      this.squishTimer--;
      const t = 1 - this.squishTimer / 18;
      this.squish = (t < 0.5 ? t * 2 : (1 - t) * 2) * 0.55;
    } else {
      this.squish = 0;
    }
  }

  resetToCheckpoint(cpX, cpY) {
    this.x = cpX + 60; this.y = cpY;
    this.startX = this.x; this.startY = this.y;
    this.vx = 0; this.vy = 0;
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX, sy = this.y - camY;
    const sh = this.h * (1 - this.squish * 0.55);
    const sw = this.w * (1 + this.squish * 0.3);
    const ox = (sw - this.w) / 2;
    const oy = this.h - sh;

    ctx.save();
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(sx - ox, sy + oy + sh * 0.55, sw, sh * 0.45);
    ctx.fillStyle = 'rgba(255,100,60,0.4)';
    ctx.fillRect(sx - ox + 3, sy + oy + sh * 0.6, 6, sh * 0.25);
    ctx.fillStyle = '#ffe030';
    ctx.fillRect(sx - ox, sy + oy, sw, sh * 0.58);
    ctx.save();
    ctx.beginPath(); ctx.rect(sx - ox, sy + oy, sw, sh * 0.58); ctx.clip();
    ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 3;
    for (let i = -2; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(sx - ox + i * 12, sy + oy);
      ctx.lineTo(sx - ox + i * 12 + sh * 0.58, sy + oy + sh * 0.58);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#dd1100';
    for (let i = 0; i < 3; i++) {
      const cx2 = sx - ox + sw * 0.5, cy2 = sy + oy + 2 + i * 5;
      ctx.beginPath();
      ctx.moveTo(cx2 - 8, cy2 + 4); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2 + 8, cy2 + 4);
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#ff4422'; ctx.stroke();
    }
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - ox + 2, sy + oy + sh + 1, sw, 3);
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════
// OCEAN ENTITIES  (Сон 2 — Водный сон)
// ═══════════════════════════════════════════════════════════════

// ── FloatingPlatform ──────────────────────────────────────────
class FloatingPlatform extends Platform {
  constructor(x, y, w, h, amplitude = 50, speed = 0.025, color = '#0a2030') {
    super(x, y, w, h, color);
    this.baseY = y;
    this.amplitude = amplitude;
    this.speed = speed;
    this.phase = Math.random() * Math.PI * 2;
  }

  update() {
    this.phase += this.speed;
    this.y = this.baseY + Math.sin(this.phase) * this.amplitude;
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX, sy = this.y - camY;
    ctx.fillStyle = this.color;
    ctx.fillRect(sx, sy, this.w, this.h);
    // ocean surface shimmer
    ctx.fillStyle = 'rgba(40,160,220,0.55)';
    ctx.fillRect(sx, sy, this.w, 3);
    ctx.fillStyle = 'rgba(80,200,255,0.12)';
    ctx.fillRect(sx, sy - 5, this.w, 5);
  }
}

// ── Jellyfish ─────────────────────────────────────────────────
class Jellyfish {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.baseY = y;
    this.timer = 0;
    this.period = 120;
    this.radius = 70;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.w = 56; this.h = 56;
  }

  get cx() { return this.x; }
  get cy() { return this.y; }

  update() {
    this.timer = (this.timer + 1) % this.period;
    this.bobPhase += 0.018;
    this.y = this.baseY + Math.sin(this.bobPhase) * 22;
  }

  checkHit(player) {
    // attack phase: last 25% of cycle
    if (this.timer < this.period * 0.75) return false;
    const dx = (player.x + player.w / 2) - this.x;
    const dy = (player.y + player.h / 2) - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.radius;
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;
    const t = this.timer / this.period;
    const isPulsing = t > 0.67;
    const pulse = isPulsing ? (t - 0.67) / 0.33 : 0;

    ctx.save();

    // warning glow before attack
    if (t > 0.45) {
      const warnA = ((t - 0.45) / 0.55) * 0.22;
      const wg = ctx.createRadialGradient(sx, sy, 0, sx, sy, this.radius);
      wg.addColorStop(0, `rgba(180,80,255,${warnA})`);
      wg.addColorStop(1, 'rgba(180,80,255,0)');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // dome body
    const bodyR = 26 + Math.sin(this.bobPhase * 2) * 4 + pulse * 10;
    const bg = ctx.createRadialGradient(sx, sy - bodyR * 0.35, 2, sx, sy, bodyR);
    bg.addColorStop(0, isPulsing ? 'rgba(255,210,255,0.98)' : 'rgba(200,150,255,0.82)');
    bg.addColorStop(0.55, isPulsing ? `rgba(220,140,255,${0.9 - pulse * 0.3})` : 'rgba(150,90,220,0.72)');
    bg.addColorStop(1, 'rgba(90,30,170,0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(sx, sy, bodyR, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // tentacles
    const tentA = 0.38 + pulse * 0.4;
    ctx.strokeStyle = `rgba(180,110,255,${tentA})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const tx = sx - 22 + i * 9;
      const len = 28 + Math.sin(this.bobPhase + i * 0.9) * 12;
      ctx.beginPath();
      ctx.moveTo(tx, sy + 5);
      ctx.quadraticCurveTo(tx + Math.sin(this.bobPhase + i) * 8, sy + len * 0.5, tx, sy + len);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── FishSchool ────────────────────────────────────────────────
class FishSchool {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.startX = x;
    this.dir = 1;
    this.speed = 1.2;
    this.timer = 0;
    this.changeInterval = 180;
    this.fish = [];
    for (let i = 0; i < 12; i++) {
      this.fish.push({
        ox: Math.random() * w,
        oy: Math.random() * h,
        wobble: Math.random() * Math.PI * 2,
        size: 4 + Math.random() * 4,
      });
    }
  }

  update() {
    this.timer++;
    if (this.timer >= this.changeInterval) { this.dir *= -1; this.timer = 0; }
    this.x += this.dir * this.speed;
    if (this.x > this.startX + 200) this.dir = -1;
    if (this.x < this.startX - 200) this.dir = 1;
    this.fish.forEach(f => { f.wobble += 0.09; });
  }

  applyTo(player) {
    if (player.x + player.w > this.x && player.x < this.x + this.w &&
        player.y + player.h > this.y && player.y < this.y + this.h) {
      player.vx += this.dir * 0.85;
    }
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;
    ctx.save();
    this.fish.forEach(f => {
      const fx = sx + f.ox + Math.sin(f.wobble * 0.5) * 14;
      const fy = sy + f.oy + Math.sin(f.wobble) * 8;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.scale(this.dir, 1);
      const a = 0.45 + Math.sin(f.wobble) * 0.18;
      ctx.fillStyle = `rgba(100,200,255,${a})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, f.size, f.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(70,160,220,${a})`;
      ctx.beginPath();
      ctx.moveTo(-f.size, 0);
      ctx.lineTo(-f.size - f.size * 0.9, -f.size * 0.5);
      ctx.lineTo(-f.size - f.size * 0.9, f.size * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }
}

// ── Tentacle ──────────────────────────────────────────────────
class Tentacle {
  constructor(x, groundY) {
    this.x = x;
    this.groundY = groundY;
    this.w = 38;
    this.activateDist = 130;
    this.state = 'hidden';
    this.riseY = groundY;
    this.riseTarget = groundY - 170;
    this.riseSpeed = 3.5;
    this.timer = 0;
  }

  update(player) {
    const dx = Math.abs((player.x + player.w / 2) - this.x);

    if (this.state === 'hidden') {
      if (dx < this.activateDist) { this.state = 'rising'; this.timer = 0; }
    } else if (this.state === 'rising') {
      this.riseY = Math.max(this.riseTarget, this.riseY - this.riseSpeed);
      if (this.riseY <= this.riseTarget) { this.state = 'attack'; this.timer = 0; }
    } else if (this.state === 'attack') {
      this.timer++;
      if (this.timer > 70) { this.state = 'retreating'; this.timer = 0; }
    } else if (this.state === 'retreating') {
      this.riseY = Math.min(this.groundY, this.riseY + this.riseSpeed * 0.6);
      if (this.riseY >= this.groundY) { this.state = 'hidden'; }
    }
  }

  checkHit(player) {
    if (this.state !== 'attack' && this.state !== 'rising') return false;
    const left = this.x - this.w / 2;
    const right = this.x + this.w / 2;
    return player.x + player.w > left && player.x < right &&
           player.y + player.h > this.riseY && player.y < this.groundY;
  }

  // screen-space warning indicator (called from game.js draw loop)
  drawWarning(ctx, W, H, camX, camY) {
    if (this.state === 'hidden') return;
    const sx = this.x - camX;
    const sy = this.riseY - camY;

    // пульсирующая красная рамка экрана
    const intensity = this.state === 'attack'
      ? 0.55 + Math.sin(this.timer * 0.35) * 0.3
      : 0.2 + (1 - (this.riseY - this.riseTarget) / (this.groundY - this.riseTarget)) * 0.35;

    ctx.save();
    const border = ctx.createLinearGradient(0, H * 0.6, 0, H);
    border.addColorStop(0, 'rgba(0,230,180,0)');
    border.addColorStop(1, `rgba(0,230,180,${intensity * 0.6})`);
    ctx.fillStyle = border;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // стрелка-указатель снизу экрана к щупальцу
    if (sx >= -60 && sx <= W + 60) {
      const arrowX = Math.max(40, Math.min(W - 40, sx));
      ctx.globalAlpha = intensity;
      ctx.fillStyle = '#00ffe0';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('⚠', arrowX, H - 8);
    }
    ctx.restore();
  }

  draw(ctx, camX, camY) {
    if (this.state === 'hidden') return;
    const sx = this.x - camX;
    const sy = this.riseY - camY;
    const height = Math.max(10, this.groundY - this.riseY);

    ctx.save();

    // внешнее биолюминесцентное свечение
    const glowR = this.state === 'attack' ? 90 : 60;
    const glowA = this.state === 'attack' ? 0.38 + Math.sin(this.timer * 0.3) * 0.18 : 0.18;
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
    glow.addColorStop(0, `rgba(0,255,200,${glowA})`);
    glow.addColorStop(0.5, `rgba(0,180,140,${glowA * 0.4})`);
    glow.addColorStop(1, 'rgba(0,100,80,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(sx, sy, glowR, 0, Math.PI * 2); ctx.fill();

    // тело — сегменты с рисунком присосок
    const segCount = 6;
    const seg = height / segCount;
    for (let i = 0; i < segCount; i++) {
      const ty = sy + i * seg;
      const hw = 11 - i * 0.8;
      const wobble = Math.sin(this.timer * 0.16 + i * 1.0) * 6;
      const t = i / segCount;

      // основной сегмент — тёмный с тиловым краем
      ctx.fillStyle = `rgba(0,${30 + i * 8},${25 + i * 6},0.92)`;
      ctx.beginPath();
      ctx.ellipse(sx + wobble, ty + seg * 0.5, hw + 2, seg * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // биолюминесцентная полоска сбоку
      const lineA = 0.5 + Math.sin(this.timer * 0.2 + i * 0.7) * 0.25;
      ctx.strokeStyle = `rgba(0,255,190,${lineA})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx + wobble - hw, ty + seg * 0.2);
      ctx.lineTo(sx + wobble - hw, ty + seg * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + wobble + hw, ty + seg * 0.2);
      ctx.lineTo(sx + wobble + hw, ty + seg * 0.8);
      ctx.stroke();

      // присоски
      if (i % 2 === 0) {
        const suckA = 0.55 + Math.sin(this.timer * 0.25 + i) * 0.2;
        ctx.fillStyle = `rgba(0,230,170,${suckA})`;
        ctx.beginPath(); ctx.arc(sx + wobble - hw * 0.6, ty + seg * 0.5, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + wobble + hw * 0.6, ty + seg * 0.5, 3, 0, Math.PI * 2); ctx.fill();
      }
    }

    // кончик — яркий пульсирующий шар
    const tipA = this.state === 'attack'
      ? 0.95 + Math.sin(this.timer * 0.4) * 0.05
      : 0.75;
    const tipR = this.state === 'attack' ? 12 + Math.sin(this.timer * 0.4) * 4 : 9;
    const tipGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, tipR * 2);
    tipGrad.addColorStop(0, `rgba(200,255,240,${tipA})`);
    tipGrad.addColorStop(0.4, `rgba(0,255,200,${tipA * 0.85})`);
    tipGrad.addColorStop(1, 'rgba(0,200,150,0)');
    ctx.fillStyle = tipGrad;
    ctx.beginPath(); ctx.arc(sx, sy, tipR * 2, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = `rgba(220,255,245,${tipA})`;
    ctx.beginPath(); ctx.arc(sx, sy, tipR * 0.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}

// ── Whirlpool ─────────────────────────────────────────────────
class Whirlpool {
  constructor(cx, cy, radius, strength) {
    this.cx = cx; this.cy = cy;
    this.radius = radius;
    this.strength = strength;
    this.angle = 0;
    // орбитальные частицы
    this.particles = [];
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        angle:  Math.random() * Math.PI * 2,
        r:      radius * (0.22 + Math.random() * 0.68),
        speed:  0.028 + Math.random() * 0.045,
        alpha:  0.25 + Math.random() * 0.45,
        size:   1 + Math.random() * 2.2,
      });
    }
  }

  update() {
    this.angle += 0.030;
    this.particles.forEach(p => {
      p.angle += p.speed;
      p.r -= 0.10; // медленно засасывает к центру
      if (p.r < this.radius * 0.08) {
        p.r = this.radius * (0.55 + Math.random() * 0.40);
        p.angle = Math.random() * Math.PI * 2;
      }
    });
  }

  applyTo(player) {
    const dx = (player.x + player.w / 2) - this.cx;
    const dy = (player.y + player.h / 2) - this.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > this.radius || dist < 1) return;
    const factor = (1 - dist / this.radius) * this.strength;
    player.vx += -dx * factor * 0.5 + (-dy / dist) * factor * 0.6;
    player.vy += -dy * factor * 0.5 + (dx / dist) * factor * 0.6;
  }

  draw(ctx, camX, camY) {
    const sx = this.cx - camX;
    const sy = this.cy - camY;
    const R = this.radius;

    ctx.save();

    // ── 1. внешнее рассеянное свечение ──
    const outerG = ctx.createRadialGradient(sx, sy, R * 0.25, sx, sy, R);
    outerG.addColorStop(0,   'rgba(10,130,255,0.20)');
    outerG.addColorStop(0.55,'rgba(0,70,200,0.10)');
    outerG.addColorStop(1,   'rgba(0,20,140,0)');
    ctx.fillStyle = outerG;
    ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2); ctx.fill();

    // ── 2. концентрические кольца ──
    for (let ring = 0; ring < 4; ring++) {
      const rr = R * (0.30 + ring * 0.195);
      const alpha = 0.22 - ring * 0.045;
      ctx.strokeStyle = `rgba(50,165,255,${alpha})`;
      ctx.lineWidth = ring === 0 ? 1.5 : 1;
      ctx.beginPath(); ctx.arc(sx, sy, rr, 0, Math.PI * 2); ctx.stroke();
    }

    // ── 3. спиральные рукава (4 штуки, каждый — отдельная дуга) ──
    const ARMS = 4;
    const STEPS = 48;
    for (let arm = 0; arm < ARMS; arm++) {
      const baseAngle = this.angle * 1.15 + (arm / ARMS) * Math.PI * 2;
      ctx.beginPath();
      let first = true;
      for (let j = 0; j <= STEPS; j++) {
        const t = j / STEPS;
        const r  = R * (0.07 + t * 0.86);
        const th = baseAngle + t * Math.PI * 1.9;  // закрутка ~342°
        const px = sx + Math.cos(th) * r;
        const py = sy + Math.sin(th) * r;
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      // рукав от центра (яркий) к краю (тёмный)
      const grad = ctx.createLinearGradient(sx, sy, sx + R * 0.9, sy);
      grad.addColorStop(0,   `rgba(160,220,255,${0.55 - arm * 0.06})`);
      grad.addColorStop(0.4, `rgba(40,150,255,${0.40 - arm * 0.05})`);
      grad.addColorStop(1,   'rgba(0,60,200,0.05)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2 - arm * 0.3;
      ctx.stroke();
    }

    // ── 4. орбитальные частицы ──
    this.particles.forEach(p => {
      const px = sx + Math.cos(p.angle) * p.r;
      const py = sy + Math.sin(p.angle) * p.r;
      const fade = p.r / R;  // ближе к центру → прозрачнее
      ctx.save();
      ctx.globalAlpha = p.alpha * (0.3 + fade * 0.7);
      ctx.fillStyle = `rgba(120,210,255,1)`;
      ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // ── 5. тёмное ядро — воронка ──
    const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.28);
    core.addColorStop(0,   'rgba(0,3,18,0.92)');
    core.addColorStop(0.55,'rgba(0,15,50,0.65)');
    core.addColorStop(1,   'rgba(0,35,110,0)');
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(sx, sy, R * 0.28, 0, Math.PI * 2); ctx.fill();

    // ── 6. яркая центральная точка ──
    const pulseA = 0.72 + Math.sin(this.angle * 4) * 0.28;
    const cg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 9);
    cg.addColorStop(0,  `rgba(200,240,255,${pulseA})`);
    cg.addColorStop(0.5,`rgba(80,190,255,${pulseA * 0.6})`);
    cg.addColorStop(1,   'rgba(0,100,200,0)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}

// ── VerticalCurrent ───────────────────────────────────────────
// forceY < 0 = upward,  forceY > 0 = downward
class VerticalCurrent {
  constructor(x, y, w, h, forceY) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.forceY = forceY;
    this.pulse = 0;
    this.flowOffset = 0;
  }

  update() {
    this.pulse += 0.05;
    this.flowOffset = (this.flowOffset + Math.abs(this.forceY) * 2.5) % 80;
  }

  applyTo(player) {
    if (player.x + player.w > this.x && player.x < this.x + this.w &&
        player.y + player.h > this.y && player.y < this.y + this.h) {
      player.vy += this.forceY;
    }
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;
    const goUp = this.forceY < 0;

    ctx.save();
    const g = ctx.createLinearGradient(0, goUp ? sy + this.h : sy, 0, goUp ? sy : sy + this.h);
    g.addColorStop(0,   'rgba(60,220,180,0)');
    g.addColorStop(0.3, 'rgba(60,220,180,0.13)');
    g.addColorStop(0.7, 'rgba(60,220,180,0.20)');
    g.addColorStop(1,   'rgba(60,220,180,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, this.w, this.h);

    ctx.fillStyle = `rgba(100,240,200,${0.32 + Math.sin(this.pulse) * 0.08})`;
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const arr = goUp ? '↑' : '↓';
    const offset = goUp ? -(this.flowOffset % 80) : (this.flowOffset % 80);
    for (let ay = sy + offset; ay < sy + this.h + 80; ay += 50) {
      if (ay > sy && ay < sy + this.h) ctx.fillText(arr, sx + this.w / 2, ay);
    }
    ctx.restore();
  }
}

// ── Bubble ────────────────────────────────────────────────────
class Bubble {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 44; this.h = 44;
    this.used = false;
    this.rechargeTime = 280;
    this.rechargeTimer = 0;
    this.pulse = Math.random() * Math.PI * 2;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update() {
    this.pulse += 0.038;
    if (this.used) {
      this.rechargeTimer++;
      if (this.rechargeTimer >= this.rechargeTime) { this.used = false; this.rechargeTimer = 0; }
    }
  }

  tryUse(player) {
    if (this.used) return;
    if (player.x + player.w > this.x && player.x < this.x + this.w &&
        player.y + player.h > this.y && player.y < this.y + this.h) {
      player.vy = -14;
      player.vx *= 0.38;
      player.canDoubleJump = true;
      this.used = true;
      this.rechargeTimer = 0;
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2, spd = 1 + Math.random() * 2.5;
        player.trailParticles.push({
          x: this.cx, y: this.cy,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 2.5,
          life: 28 + Math.random() * 18, maxLife: 46, dj: true,
        });
      }
    }
  }

  draw(ctx, camX, camY) {
    const sx = this.cx - camX;
    const sy = this.cy - camY;
    const r = 20;

    ctx.save();

    if (this.used) {
      const progress = this.rechargeTimer / this.rechargeTime;
      ctx.globalAlpha = 0.12 + progress * 0.15;
      ctx.strokeStyle = '#40c0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#80e0ff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2); ctx.stroke();
      ctx.restore();
      return;
    }

    const sc = 1 + Math.sin(this.pulse) * 0.06;
    ctx.save();
    ctx.scale(sc, sc);
    const rx = sx / sc, ry = sy / sc;

    // внешнее свечение — очень прозрачное
    const glow = ctx.createRadialGradient(rx, ry, 0, rx, ry, r * 2.8);
    glow.addColorStop(0, 'rgba(80,200,255,0.10)');
    glow.addColorStop(1, 'rgba(80,200,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(rx, ry, r * 2.8, 0, Math.PI * 2); ctx.fill();

    // основной шар — прозрачный, чисто круглый
    const bg = ctx.createRadialGradient(rx - r * 0.3, ry - r * 0.3, 1, rx, ry, r);
    bg.addColorStop(0,   'rgba(220,245,255,0.28)');
    bg.addColorStop(0.45,'rgba(100,200,255,0.14)');
    bg.addColorStop(0.85,'rgba(40,120,220,0.08)');
    bg.addColorStop(1,   'rgba(20,80,180,0.03)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(rx, ry, r, 0, Math.PI * 2); ctx.fill();

    // обводка — тонкая, полупрозрачная
    ctx.strokeStyle = 'rgba(140,220,255,0.38)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(rx, ry, r, 0, Math.PI * 2); ctx.stroke();

    // блик — маленький, чёткий
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.arc(rx - r * 0.35, ry - r * 0.35, r * 0.18, 0, Math.PI * 2); ctx.fill();

    // стрелка ↑
    ctx.globalAlpha = 0.40;
    ctx.fillStyle = '#c0eeff';
    ctx.font = `bold ${Math.round(r * 0.85)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('↑', rx, ry + 1);
    ctx.restore();

    ctx.restore();
  }
}
