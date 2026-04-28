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
        this.vy = -13;
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
    const dir = this.force > 0;
    ctx.save();
    const g = ctx.createLinearGradient(sx, 0, ex, 0);
    g.addColorStop(dir ? 0 : 1, 'rgba(80,200,255,0)');
    g.addColorStop(dir ? 1 : 0, 'rgba(80,200,255,0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(sx, 0, ex - sx, 720);
    ctx.globalAlpha = 0.22 + Math.sin(this.pulse) * 0.07;
    ctx.fillStyle = '#70d0ff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    const arr = dir ? '→' : '←';
    for (let ax = sx + 60; ax < ex - 20; ax += 120)
      for (let ay = 110; ay < 640; ay += 120)
        ctx.fillText(arr, ax, ay);
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
      player.x = this.destX;
      player.y = this.destY;
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

    if (this.cooldown === 0) {
      ctx.save();
      ctx.globalAlpha = 0.65 + Math.sin(this.pulse * 1.5) * 0.30;
      ctx.fillStyle = '#ffe060'; ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('ВОЙТИ', sx, sy + r + 4);
      ctx.restore();
    }
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

// ── SpringJumper ─────────────────────────────────────────────
class SpringJumper {
  constructor(x, y) {
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
