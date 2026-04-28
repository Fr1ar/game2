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
    this.w = 40; this.h = 40;
    this.collected = false;
    this.angle = 0;
    this.pulse = 0;
    this.bob = Math.random() * Math.PI * 2;  // random starting phase
    this.sparkles = [];   // ambient floating sparkles
    this.particles = [];  // collect burst
    this._sparkTimer = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update() {
    this.angle += 0.022;   // slow, majestic rotation
    this.pulse += 0.055;
    this.bob   += 0.038;

    // spawn ambient sparkles while not collected
    if (!this.collected) {
      this._sparkTimer++;
      if (this._sparkTimer >= 7) {
        this._sparkTimer = 0;
        const ang = Math.random() * Math.PI * 2;
        const r   = 16 + Math.random() * 14;
        const ml  = 30 + Math.random() * 25;
        this.sparkles.push({
          x: this.cx + Math.cos(ang) * r,
          y: this.cy + Math.sin(ang) * r,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.5 - Math.random() * 0.6,
          life: ml, maxLife: ml,
          r: 1 + Math.random() * 2,
        });
      }
    }

    this.sparkles = this.sparkles.filter(s => {
      s.x += s.vx; s.y += s.vy; s.life--;
      return s.life > 0;
    });

    this.particles = this.particles.filter(p => {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.95; p.vy *= 0.95;
      p.vy -= 0.04;
      p.life--;
      return p.life > 0;
    });
  }

  collect() {
    this.collected = true;
    const COLORS = ['#ffffff', '#b0eeff', '#d0b0ff', '#80d8ff', '#ffe080'];
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * Math.PI * 2 + Math.random() * 0.25;
      const spd = 1.2 + Math.random() * 5;
      const ml  = 45 + Math.random() * 35;
      this.particles.push({
        x: this.cx, y: this.cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.5,
        life: ml, maxLife: ml,
        r: i % 5 === 0 ? 5 : 1.5 + Math.random() * 2.5,
        color: COLORS[i % COLORS.length],
      });
    }
  }

  // 7-sided gem silhouette at radius r
  _gemPath(ctx, r) {
    ctx.moveTo(0, -r);
    ctx.lineTo( r * 0.62, -r * 0.30);
    ctx.lineTo( r * 0.80,  r * 0.32);
    ctx.lineTo( r * 0.38,  r);
    ctx.lineTo(-r * 0.38,  r);
    ctx.lineTo(-r * 0.80,  r * 0.32);
    ctx.lineTo(-r * 0.62, -r * 0.30);
    ctx.closePath();
  }

  draw(ctx, camX, camY) {
    // ── collect burst particles ───────────────────────────────
    this.particles.forEach(p => {
      const a = Math.pow(p.life / p.maxLife, 1.6);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y - camY, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (this.collected) return;

    const HOVER = 26;  // px от центра хитбокса — визуальное парение от поверхности
    // hoverDX/hoverDY задают направление парения (по умолч. вверх от пола: dy=-1)
    const hdx   = this.hoverDX ?? 0;
    const hdy   = this.hoverDY ?? -1;
    const bobY  = Math.sin(this.bob) * 6;
    const pulse = Math.sin(this.pulse);
    const sx = this.cx - camX + hdx * HOVER;
    const sy = this.cy - camY + hdy * HOVER + bobY;
    const R  = 18;  // gem radius

    ctx.save();

    // ── far outer haze ────────────────────────────────────────
    const hazeR = R * 3.8 + pulse * 6;
    const hazeG = ctx.createRadialGradient(sx, sy, R, sx, sy, hazeR);
    hazeG.addColorStop(0, `rgba(140,200,255,${0.12 + pulse * 0.05})`);
    hazeG.addColorStop(0.5, `rgba(160,100,255,${0.06})`);
    hazeG.addColorStop(1,   'rgba(80,40,200,0)');
    ctx.fillStyle = hazeG;
    ctx.beginPath();
    ctx.arc(sx, sy, hazeR, 0, Math.PI * 2);
    ctx.fill();

    // ── mid glow ─────────────────────────────────────────────
    const midR = R * 2 + pulse * 4;
    const midG = ctx.createRadialGradient(sx, sy, 0, sx, sy, midR);
    midG.addColorStop(0, `rgba(220,245,255,${0.50 + pulse * 0.20})`);
    midG.addColorStop(0.5, `rgba(160,220,255,0.20)`);
    midG.addColorStop(1,   'rgba(120,160,255,0)');
    ctx.fillStyle = midG;
    ctx.beginPath();
    ctx.arc(sx, sy, midR, 0, Math.PI * 2);
    ctx.fill();

    // ── ambient sparkles ──────────────────────────────────────
    this.sparkles.forEach(sp => {
      const a = Math.pow(sp.life / sp.maxLife, 0.7) * 0.9;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#dff6ff';
      ctx.beginPath();
      ctx.arc(sp.x - camX, sp.y - camY + bobY, sp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── gem body ──────────────────────────────────────────────
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    // drop shadow
    ctx.save();
    ctx.translate(2, 3);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#1a0040';
    ctx.beginPath();
    this._gemPath(ctx, R);
    ctx.fill();
    ctx.restore();

    // main gem fill — diagonal gradient (light → deep)
    const bodyG = ctx.createLinearGradient(-R * 0.7, -R, R * 0.7, R);
    bodyG.addColorStop(0,    '#f0faff');
    bodyG.addColorStop(0.25, '#88d8ff');
    bodyG.addColorStop(0.55, '#9070e8');
    bodyG.addColorStop(1,    '#4020a0');
    ctx.globalAlpha = 1;
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    this._gemPath(ctx, R);
    ctx.fill();

    // upper highlight facet (bright frosted cap)
    ctx.fillStyle = `rgba(255,255,255,${0.5 + pulse * 0.15})`;
    ctx.beginPath();
    ctx.moveTo(0, -R);
    ctx.lineTo( R * 0.62, -R * 0.30);
    ctx.lineTo( R * 0.10, -R * 0.08);
    ctx.lineTo(-R * 0.62, -R * 0.30);
    ctx.closePath();
    ctx.fill();

    // side-left secondary highlight
    ctx.fillStyle = 'rgba(200,240,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(-R * 0.62, -R * 0.30);
    ctx.lineTo(-R * 0.10, -R * 0.08);
    ctx.lineTo(-R * 0.80,  R * 0.32);
    ctx.closePath();
    ctx.fill();

    // inner pulsing core
    const coreG = ctx.createRadialGradient(0, -R * 0.15, 0, 0, -R * 0.1, R * 0.65);
    coreG.addColorStop(0, `rgba(255,255,255,${0.75 + pulse * 0.25})`);
    coreG.addColorStop(0.5, `rgba(180,240,255,0.3)`);
    coreG.addColorStop(1,   'rgba(160,100,255,0)');
    ctx.fillStyle = coreG;
    ctx.beginPath();
    ctx.arc(0, -R * 0.1, R * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // gem outline
    ctx.strokeStyle = `rgba(255,255,255,${0.55 + pulse * 0.35})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    this._gemPath(ctx, R);
    ctx.stroke();

    // inner structure lines (facet edges)
    ctx.strokeStyle = 'rgba(210,245,255,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -R);       ctx.lineTo(0,  R * 0.55); // vertical
    ctx.moveTo(-R * 0.62, -R * 0.30); ctx.lineTo(R * 0.62, -R * 0.30); // girdle top
    ctx.moveTo(-R * 0.80,  R * 0.32); ctx.lineTo(R * 0.80,  R * 0.32); // girdle bot
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
