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

// Sprite sheet for SpringJumper: 4 cols × 4 rows = 16 frames.
// Frame 0 (top-left) is the idle pose; frames 1..15 play during a bounce.
const SpringSprite = (() => {
  const img = new Image();
  let loaded = false, failed = false;
  img.onload  = () => { loaded = true; };
  img.onerror = () => { failed = true; };
  img.src = 'sprites/spring.png';
  return {
    img,
    cols: 4, rows: 4, frames: 16,
    isReady: () => loaded && !failed,
  };
})();

// ── SpringJumper ─────────────────────────────────────────────
class SpringJumper {
  constructor(x, y) {
    this.spawnX = x; this.spawnY = y;
    this.startX = x; this.startY = y;
    this.x = x; this.y = y;
    // sprite frame is 467 × 508; w=50 → h ≈ 50 * 508/467 ≈ 54
    this.w = 50; this.h = 54;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.squish = 0;
    this.squishTimer = 0;
    this.frameIdx = 0;     // sprite frame: 0 = idle, 1..15 = bounce
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
      // map 18 game frames → sprite frames 1..15
      this.frameIdx = Math.min(15, Math.floor((18 - this.squishTimer) * 15 / 18) + 1);
    } else {
      this.squish = 0;
      this.frameIdx = 0;  // idle
    }
  }

  resetToCheckpoint(cpX, cpY) {
    this.x = cpX + 60; this.y = cpY;
    this.startX = this.x; this.startY = this.y;
    this.vx = 0; this.vy = 0;
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX, sy = this.y - camY;

    // Sprite-based animation when the sheet is loaded.
    if (SpringSprite.isReady()) {
      const img = SpringSprite.img;
      const fw = img.width  / SpringSprite.cols;
      const fh = img.height / SpringSprite.rows;
      const fx = (this.frameIdx % SpringSprite.cols) * fw;
      const fy = Math.floor(this.frameIdx / SpringSprite.cols) * fh;

      // sprite drawn at the collider's exact footprint (44 × 28)
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, fx, fy, fw, fh, sx, sy, this.w, this.h);
      // ground shadow
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#000';
      ctx.fillRect(sx + 2, sy + this.h + 1, this.w, 3);
      ctx.restore();
      return;
    }

    // Fallback vector drawing.
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

// ── BranchSpring ─────────────────────────────────────────────
class BranchSpring extends Platform {
  constructor(x, y, w) {
    super(x, y, w, 12, '#6b3a0a');
    this.baseY = y;
    this.state = 'idle'; // idle | bending | returning
    this.bendAmt = 0;
    this.timer = 0;
    this.launchForce = 0;
    this.slippery = false;
    this.dripTimer = 0;
    // deterministic per-branch shape variation from position seed
    const s = (x * 7 + y * 3) % 100;
    this._curve  = (s % 11) - 5;   // -5..5  mid-arch of top surface
    this._taper  = (s % 3);        // 0..2   end thickness taper
    this._knotX  = 0.3 + (s % 40) / 100; // knot position 0.3..0.7
  }

  onPlayerLand(player, landVy) {
    if (this.state === 'idle') {
      this.state = 'bending';
      this.timer = 0;
      this.launchForce = Math.min(22, Math.max(13, Math.abs(landVy || 0) * 1.2 + 9));
    }
  }

  update(player) {
    if (this.slippery) this.dripTimer++;
    if (this.state === 'bending') {
      this.timer++;
      const t = Math.min(1, this.timer / 11);
      this.bendAmt = Math.sin(t * Math.PI) * 18;
      this.y = this.baseY + this.bendAmt;
      if (player && player.onGround &&
          player.x + player.w > this.x && player.x < this.x + this.w) {
        player.y = this.y - player.h;
      }
      if (this.timer >= 11) {
        this.state = 'returning';
        if (player && player.x + player.w > this.x && player.x < this.x + this.w) {
          player.vy = -this.launchForce;
          player.onGround = false;
          player.canDoubleJump = true;
        }
      }
    } else if (this.state === 'returning') {
      this.bendAmt = Math.max(0, this.bendAmt - 2.5);
      this.y = this.baseY + this.bendAmt;
      if (this.bendAmt <= 0) {
        this.state = 'idle';
        this.y = this.baseY;
      }
    }
  }

  draw(ctx, camX, camY) {
    const x  = this.x - camX;
    const y  = this.y - camY;
    const w  = this.w;
    const h  = this.h;
    const bend = this.bendAmt;
    const cv = this._curve;
    const tp = this._taper;
    const kx = this._knotX;
    ctx.save();

    // spring glow
    if (this.state === 'bending' || this.state === 'returning') {
      ctx.shadowColor = '#88cc44';
      ctx.shadowBlur = 8 + bend * 0.35;
    }

    // branch fill — yellowed if slippery
    const fillCol   = this.slippery ? '#7a8a0a' : '#5a3008';
    const strokeCol = this.slippery ? '#556008' : '#3a1a04';

    // curved branch outline
    ctx.beginPath();
    ctx.moveTo(x + 4, y + tp);
    ctx.quadraticCurveTo(x + w * 0.5, y + bend + cv, x + w - 4, y + tp);
    ctx.quadraticCurveTo(x + w + 3, y + h * 0.5, x + w - 4, y + h - tp);
    ctx.quadraticCurveTo(x + w * 0.5, y + h + bend + cv * 0.5, x + 4, y + h - tp);
    ctx.quadraticCurveTo(x - 3, y + h * 0.5, x + 4, y + tp);
    ctx.closePath();
    ctx.fillStyle = fillCol;
    ctx.fill();
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // bark lines — 2–3 diagonal scratches
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 3; i++) {
      const lx = x + w * (0.2 + i * 0.28);
      ctx.beginPath();
      ctx.moveTo(lx,     y + 3);
      ctx.lineTo(lx + 3, y + h - 3);
      ctx.stroke();
    }

    // knot circle
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(x + w * kx, y + h * 0.5, 3, 2, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // urine surface tint + drip animation
    if (this.slippery) {
      // surface puddle tint
      ctx.fillStyle = 'rgba(210,190,0,0.22)';
      ctx.beginPath();
      ctx.moveTo(x + 4, y + tp);
      ctx.quadraticCurveTo(x + w * 0.5, y + bend + cv, x + w - 4, y + tp);
      ctx.lineTo(x + w - 4, y + tp + 4);
      ctx.quadraticCurveTo(x + w * 0.5, y + bend + cv + 4, x + 4, y + tp + 4);
      ctx.closePath();
      ctx.fill();

      // drip droplets flowing down from bottom edge
      const period = 70;
      for (let i = 0; i < 3; i++) {
        const phase = (this.dripTimer + i * Math.floor(period / 3)) % period;
        const prog  = phase / period;
        const dripX = x + w * (0.2 + i * 0.28);
        const dripY = y + h + prog * 38;
        const alpha = 0.9 - prog * 0.65;
        const r     = 2.8 - prog * 1.4;

        // drip trail
        const trailGrad = ctx.createLinearGradient(dripX, y + h, dripX, dripY);
        trailGrad.addColorStop(0, `rgba(200,175,0,${0.35 - prog * 0.3})`);
        trailGrad.addColorStop(1, 'rgba(200,175,0,0)');
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth   = 1.4;
        ctx.beginPath();
        ctx.moveTo(dripX, y + h);
        ctx.lineTo(dripX, dripY - r);
        ctx.stroke();

        // droplet
        ctx.fillStyle = `rgba(220,195,0,${alpha})`;
        ctx.beginPath();
        ctx.arc(dripX, dripY, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

// ── BranchBreak ──────────────────────────────────────────────
class BranchBreak extends Platform {
  constructor(x, y, w) {
    super(x, y, w, 12, '#5a2a05');
    this.baseY = y;
    this.state = 'solid'; // solid | cracking | falling
    this.crackTimer = 0;
    this.crackFrames = 20;
    this.fallVy = 0;
    this.angle = 0;
    this.slippery = false;
    this.active = true;
  }

  onPlayerLand(player, landVy) {
    if (this.state === 'solid') {
      this.state = 'cracking';
      this.crackTimer = 0;
    }
  }

  accelerateCrack(amt) {
    if (this.state === 'solid') {
      this.state = 'cracking';
      this.crackTimer = 0;
    }
    if (this.state === 'cracking') {
      this.crackTimer = Math.min(this.crackFrames - 1, this.crackTimer + amt);
    }
  }

  update(deathY) {
    if (this.state === 'cracking') {
      this.crackTimer++;
      if (this.crackTimer >= this.crackFrames) {
        this.state = 'falling';
        this.fallVy = 0.5;
      }
    } else if (this.state === 'falling') {
      this.fallVy += 0.7;
      this.y += this.fallVy;
      this.angle += 0.035;
      if (this.y > (deathY || 730) + 100) this.active = false;
    }
  }

  draw(ctx, camX, camY) {
    if (!this.active) return;
    const x = this.x - camX;
    const y = this.y - camY;
    const w = this.w;
    const h = this.h;
    ctx.save();

    if (this.state === 'falling') {
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.rotate(this.angle);
      ctx.translate(-(w * 0.5), -(h * 0.5));
    }

    const shakeX = this.state === 'cracking'
      ? (Math.random() - 0.5) * (this.crackTimer / this.crackFrames) * 4 : 0;

    ctx.fillStyle = '#5a2a05';
    ctx.fillRect(shakeX, 0, w, h);

    if (this.state === 'cracking' || this.state === 'falling') {
      const prog = this.state === 'falling' ? 1 : this.crackTimer / this.crackFrames;
      ctx.strokeStyle = `rgba(30,10,0,${0.5 + prog * 0.5})`;
      ctx.lineWidth = 1 + prog;
      const numCracks = Math.floor(prog * 4) + 1;
      for (let i = 0; i < numCracks; i++) {
        const cx = w * (0.2 + i * 0.18);
        ctx.beginPath();
        ctx.moveTo(shakeX + cx, 0);
        ctx.lineTo(shakeX + cx + (Math.random() - 0.5) * 6, h);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// ── BranchHybrid ─────────────────────────────────────────────
class BranchHybrid extends Platform {
  constructor(x, y, w) {
    super(x, y, w, 12, '#4a2208');
    this.baseY = y;
    this.state = 'idle'; // idle | bending | returning | cracking | falling
    this.timer = 0;
    this.bendAmt = 0;
    this.launchForce = 0;
    this.fallVy = 0;
    this.angle = 0;
    this.slippery = false;
    this.active = true;
    this.bounced = false;
  }

  onPlayerLand(player, landVy) {
    if (this.state === 'idle') {
      if (!this.bounced) {
        this.state = 'bending';
        this.timer = 0;
        this.launchForce = Math.min(22, Math.max(13, Math.abs(landVy || 0) * 1.2 + 9));
      } else {
        this.state = 'cracking';
        this.timer = 0;
      }
    }
  }

  accelerateCrack(amt) {
    if (this.state === 'idle' && this.bounced) { this.state = 'cracking'; this.timer = 0; }
    if (this.state === 'cracking') this.timer = Math.min(21, this.timer + amt);
  }

  update(player, deathY) {
    if (this.state === 'bending') {
      this.timer++;
      const t = Math.min(1, this.timer / 11);
      this.bendAmt = Math.sin(t * Math.PI) * 18;
      this.y = this.baseY + this.bendAmt;
      if (player && player.onGround &&
          player.x + player.w > this.x && player.x < this.x + this.w) {
        player.y = this.y - player.h;
      }
      if (this.timer >= 11) {
        this.state = 'returning';
        this.bounced = true;
        if (player && player.x + player.w > this.x && player.x < this.x + this.w) {
          player.vy = -this.launchForce;
          player.onGround = false;
          player.canDoubleJump = true;
        }
      }
    } else if (this.state === 'returning') {
      this.bendAmt = Math.max(0, this.bendAmt - 2.5);
      this.y = this.baseY + this.bendAmt;
      if (this.bendAmt <= 0) {
        this.state = 'idle';
        this.y = this.baseY;
      }
    } else if (this.state === 'cracking') {
      this.timer++;
      if (this.timer >= 22) {
        this.state = 'falling';
        this.fallVy = 0.5;
      }
    } else if (this.state === 'falling') {
      this.fallVy += 0.7;
      this.y += this.fallVy;
      this.angle += 0.035;
      if (this.y > (deathY || 730) + 100) this.active = false;
    }
  }

  draw(ctx, camX, camY) {
    if (!this.active) return;
    const x = this.x - camX;
    const y = this.y - camY;
    const w = this.w;
    const h = this.h;
    const bend = this.bendAmt;
    ctx.save();

    if (this.state === 'falling') {
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.rotate(this.angle);
      ctx.translate(-(w * 0.5), -(h * 0.5));
    }

    const shakeX = (this.state === 'cracking')
      ? (Math.random() - 0.5) * (this.timer / 22) * 4 : 0;

    const col = this.slippery ? '#55aa55'
      : (this.bounced ? '#7a1505' : '#4a2208');
    ctx.fillStyle = col;

    if (this.state === 'bending' || this.state === 'returning') {
      ctx.shadowColor = '#aaffaa';
      ctx.shadowBlur = 6 + bend * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + w * 0.5, y + bend, x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.quadraticCurveTo(x + w * 0.5, y + h + bend, x, y + h);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(shakeX, 0, w, h);
      if (this.state === 'cracking' || this.state === 'falling') {
        const prog = this.state === 'falling' ? 1 : this.timer / 22;
        ctx.strokeStyle = `rgba(20,5,0,${0.5 + prog * 0.5})`;
        ctx.lineWidth = 1 + prog;
        const numCracks = Math.floor(prog * 3) + 1;
        for (let i = 0; i < numCracks; i++) {
          const cx = w * (0.25 + i * 0.22);
          ctx.beginPath();
          ctx.moveTo(shakeX + cx, 0);
          ctx.lineTo(shakeX + cx + (Math.random() - 0.5) * 5, h);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }
}

// ── MonkeySpawner ─────────────────────────────────────────────
// Every 2 s: spawns a monkey above a branch ahead of the player,
// monkey pees on it (branch becomes slippery), then vanishes.
class MonkeySpawner {
  constructor() {
    this.w = 34; this.h = 38;
    this.x = 0; this.y = 0;
    this.state = 'cooldown'; // cooldown | appearing | peeing | leaving
    this.timer = 0;
    this.cooldownMax = 120; // 2 s at 60 fps
    this.appearFrames = 20;
    this.peeFrames = 55;
    this.leaveFrames = 20;
    this.targetPlatform = null;
    this.portalR = 0;
    this.streamLen = 0;
  }

  get cx() { return this.x + this.w / 2; }

  reset() {
    this.state = 'cooldown';
    this.timer = 0;
    this.targetPlatform = null;
    this.portalR = 0;
    this.streamLen = 0;
  }

  _findTarget(player, platforms) {
    const candidates = platforms.filter(p =>
      (p instanceof BranchSpring) && p.active !== false &&
      p.x + p.w > player.x + 60 &&
      p.x < player.x + 480 &&
      !p.slippery
    );
    if (!candidates.length) return null;
    const ahead = player.x + 220;
    candidates.sort((a, b) => Math.abs(a.x + a.w * 0.5 - ahead) - Math.abs(b.x + b.w * 0.5 - ahead));
    return candidates[0];
  }

  update(player, platforms) {
    this.timer++;

    if (this.state === 'cooldown') {
      if (this.timer >= this.cooldownMax) {
        const target = this._findTarget(player, platforms);
        if (target) {
          this.targetPlatform = target;
          this.x = target.x + target.w * 0.5 - this.w * 0.5;
          this.y = target.y - 76;
          this.state = 'appearing';
          this.timer = 0;
          this.portalR = 0;
          this.streamLen = 0;
        }
      }
    } else if (this.state === 'appearing') {
      this.portalR = (this.timer / this.appearFrames) * 32;
      if (this.timer >= this.appearFrames) { this.state = 'peeing'; this.timer = 0; this.streamLen = 0; }
    } else if (this.state === 'peeing') {
      const maxLen = this.targetPlatform ? Math.max(0, this.targetPlatform.y - (this.y + this.h)) : 60;
      this.streamLen = Math.min(maxLen, (this.timer / this.peeFrames) * maxLen * 2);
      if (this.timer >= this.peeFrames) {
        if (this.targetPlatform) {
          this.targetPlatform.slippery = true;
          this.targetPlatform.slipDir = Math.random() > 0.5 ? 1 : -1;
        }
        this.state = 'leaving';
        this.timer = 0;
      }
    } else if (this.state === 'leaving') {
      this.portalR = (1 - this.timer / this.leaveFrames) * 32;
      if (this.timer >= this.leaveFrames) {
        this.state = 'cooldown';
        this.timer = 0;
        this.targetPlatform = null;
      }
    }
  }

  draw(ctx, camX, camY) {
    if (this.state === 'cooldown') return;

    const rx = this.x - camX;
    const ry = this.y - camY;
    const w = this.w; const h = this.h;
    const alpha = this.state === 'appearing' ? Math.min(1, this.timer / this.appearFrames)
                : this.state === 'leaving'   ? Math.max(0, 1 - this.timer / this.leaveFrames)
                : 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    // portal ring
    if (this.portalR > 0) {
      ctx.shadowColor = '#cc44ff';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#cc44ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(rx + w * 0.5, ry + h * 0.5, this.portalR, this.portalR * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // urine stream — yellow arc from crotch to branch
    if (this.state === 'peeing' && this.streamLen > 0) {
      const sx = rx + w * 0.5 - 3;
      const sy = ry + h * 0.72;
      const grad = ctx.createLinearGradient(sx, sy, sx, sy + this.streamLen);
      grad.addColorStop(0,   'rgba(230,210,10,0.95)');
      grad.addColorStop(0.6, 'rgba(200,180,0,0.7)');
      grad.addColorStop(1,   'rgba(160,140,0,0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + 10, sy + this.streamLen * 0.5, sx + 2, sy + this.streamLen);
      ctx.lineTo(sx + 8, sy + this.streamLen);
      ctx.quadraticCurveTo(sx + 16, sy + this.streamLen * 0.5, sx + 6, sy);
      ctx.closePath();
      ctx.fill();

      // droplet splash on branch
      if (this.streamLen > 40 && this.targetPlatform) {
        const bry = this.targetPlatform.y - camY;
        const drx = rx + w * 0.5;
        ctx.fillStyle = 'rgba(210,190,0,0.6)';
        for (let i = 0; i < 3; i++) {
          const angle = ((this.timer * 5 + i * 120) % 360) * Math.PI / 180;
          ctx.beginPath();
          ctx.arc(drx + Math.cos(angle) * 5, bry - 2 + Math.sin(angle) * 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // pee body bounce offset
    const bounce = this.state === 'peeing' ? Math.sin(this.timer * 0.35) * 2.5 : 0;
    const bx = rx; const by = ry + bounce;

    ctx.shadowBlur = 0;

    // tail — bezier sweep from lower back up and over
    ctx.strokeStyle = '#6a3a10';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx + w * 0.15, by + h * 0.7);
    ctx.bezierCurveTo(bx - 14, by + h * 0.9, bx - 22, by + h * 0.35, bx - 10, by + h * 0.05);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // arms reaching up (holding branch above)
    ctx.strokeStyle = '#7a4a1a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    // left arm
    ctx.beginPath();
    ctx.moveTo(bx + w * 0.18, by + h * 0.45);
    ctx.quadraticCurveTo(bx - 9, by + h * 0.12, bx - 5, by - 11);
    ctx.stroke();
    // right arm
    ctx.beginPath();
    ctx.moveTo(bx + w * 0.82, by + h * 0.45);
    ctx.quadraticCurveTo(bx + w + 9, by + h * 0.12, bx + w + 5, by - 11);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // hands
    ctx.fillStyle = '#c09060';
    ctx.beginPath(); ctx.arc(bx - 5,     by - 11, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx + w + 5, by - 11, 4.5, 0, Math.PI * 2); ctx.fill();
    // fingers (3 small dots per hand)
    ctx.fillStyle = '#d0a070';
    for (let f = 0; f < 3; f++) {
      const fa = (f - 1) * 0.6;
      ctx.beginPath(); ctx.arc(bx - 5     + Math.cos(fa - 1.57) * 5, by - 11 + Math.sin(fa - 1.57) * 5, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bx + w + 5 + Math.cos(fa - 1.57) * 5, by - 11 + Math.sin(fa - 1.57) * 5, 1.8, 0, Math.PI * 2); ctx.fill();
    }

    // body — layered for fur depth
    ctx.fillStyle = '#6a3a12';
    ctx.beginPath();
    ctx.ellipse(bx + w * 0.5, by + h * 0.64, w * 0.44, h * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a4a1a';
    ctx.beginPath();
    ctx.ellipse(bx + w * 0.5, by + h * 0.60, w * 0.38, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // belly patch
    ctx.fillStyle = '#c09060';
    ctx.beginPath();
    ctx.ellipse(bx + w * 0.5, by + h * 0.64, w * 0.18, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // head
    ctx.fillStyle = '#7a4a1a';
    ctx.beginPath();
    ctx.arc(bx + w * 0.5, by + h * 0.26, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5a22';
    ctx.beginPath();
    ctx.arc(bx + w * 0.5, by + h * 0.24, 12, 0, Math.PI * 2);
    ctx.fill();

    // ears — inner pink
    ctx.fillStyle = '#7a4a1a';
    ctx.beginPath(); ctx.arc(bx + w * 0.15, by + h * 0.14, 6,   0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx + w * 0.85, by + h * 0.14, 6,   0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cc8060';
    ctx.beginPath(); ctx.arc(bx + w * 0.15, by + h * 0.14, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx + w * 0.85, by + h * 0.14, 3.5, 0, Math.PI * 2); ctx.fill();

    // muzzle
    ctx.fillStyle = '#c09060';
    ctx.beginPath();
    ctx.ellipse(bx + w * 0.5, by + h * 0.33, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // nose
    ctx.fillStyle = '#4a2010';
    ctx.beginPath();
    ctx.ellipse(bx + w * 0.5, by + h * 0.28, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // eyes — squinting/closed while peeing
    const eyeScaleY = this.state === 'peeing' ? 0.4 : 1;
    ctx.fillStyle = '#1a0800';
    ctx.beginPath(); ctx.ellipse(bx + w * 0.37, by + h * 0.22, 3, 3 * eyeScaleY, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx + w * 0.63, by + h * 0.22, 3, 3 * eyeScaleY, 0, 0, Math.PI * 2); ctx.fill();
    // eye shine
    if (this.state !== 'peeing') {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.arc(bx + w * 0.36, by + h * 0.20, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bx + w * 0.62, by + h * 0.20, 1.2, 0, Math.PI * 2); ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ── BranchStatic ──────────────────────────────────────────────
// Curved branch visual — no spring, purely static.
class BranchStatic extends Platform {
  constructor(x, y, w) {
    super(x, y, w, 12, '#3a1c04');
    this.slippery = false;
    this.slipDir  = 0;
    const s = (x * 7 + y * 3) % 100;
    this._curve = (s % 11) - 5;
    this._taper = s % 3;
    this._knotX = 0.3 + (s % 40) / 100;
  }

  draw(ctx, camX, camY) {
    const x  = this.x - camX;
    const y  = this.y - camY;
    const w  = this.w;
    const h  = this.h;
    const cv = this._curve;
    const tp = this._taper;
    const kx = this._knotX;
    ctx.save();

    const fillCol   = this.slippery ? '#6a7808' : '#3a1c04';
    const strokeCol = this.slippery ? '#485008' : '#251005';

    ctx.beginPath();
    ctx.moveTo(x + 4, y + tp);
    ctx.quadraticCurveTo(x + w * 0.5, y + cv, x + w - 4, y + tp);
    ctx.quadraticCurveTo(x + w + 3, y + h * 0.5, x + w - 4, y + h - tp);
    ctx.quadraticCurveTo(x + w * 0.5, y + h + cv * 0.5, x + 4, y + h - tp);
    ctx.quadraticCurveTo(x - 3, y + h * 0.5, x + 4, y + tp);
    ctx.closePath();
    ctx.fillStyle = fillCol;
    ctx.fill();
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // bark lines
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 3; i++) {
      const lx = x + w * (0.2 + i * 0.28);
      ctx.beginPath();
      ctx.moveTo(lx, y + 3);
      ctx.lineTo(lx + 3, y + h - 3);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x + w * kx, y + h * 0.5, 3, 2, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // urine surface tint + drip if slippery
    if (this.slippery) {
      this._dripTimer = (this._dripTimer || 0) + 1;
      ctx.fillStyle = 'rgba(210,190,0,0.22)';
      ctx.beginPath();
      ctx.moveTo(x + 4, y + tp);
      ctx.quadraticCurveTo(x + w * 0.5, y + cv, x + w - 4, y + tp);
      ctx.lineTo(x + w - 4, y + tp + 4);
      ctx.quadraticCurveTo(x + w * 0.5, y + cv + 4, x + 4, y + tp + 4);
      ctx.closePath();
      ctx.fill();
      const period = 70;
      for (let i = 0; i < 3; i++) {
        const phase = (this._dripTimer + i * Math.floor(period / 3)) % period;
        const prog  = phase / period;
        const dripX = x + w * (0.2 + i * 0.28);
        const dripY = y + h + prog * 38;
        const alpha = 0.9 - prog * 0.65;
        const r     = 2.8 - prog * 1.4;
        const tg = ctx.createLinearGradient(dripX, y + h, dripX, dripY);
        tg.addColorStop(0, `rgba(200,175,0,${0.35 - prog * 0.3})`);
        tg.addColorStop(1, 'rgba(200,175,0,0)');
        ctx.strokeStyle = tg; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(dripX, y + h); ctx.lineTo(dripX, dripY - r); ctx.stroke();
        ctx.fillStyle = `rgba(220,195,0,${alpha})`;
        ctx.beginPath(); ctx.arc(dripX, dripY, r, 0, Math.PI * 2); ctx.fill();
      }
    }

    ctx.restore();
  }
}

// ── Umbrella (boost pickup) ───────────────────────────────────
class Umbrella {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 24; this.h = 28;
    this.collected = false;
    this._t = 0;
  }

  update() { if (!this.collected) this._t++; }

  checkCollect(player) {
    if (this.collected) return false;
    if (player.x + player.w > this.x && player.x < this.x + this.w &&
        player.y + player.h > this.y && player.y < this.y + this.h) {
      this.collected = true;
      return true;
    }
    return false;
  }

  draw(ctx, camX, camY) {
    if (this.collected) return;
    const cx = this.x + this.w * 0.5 - camX;
    const cy = this.y + this.h * 0.5 - camY + Math.sin(this._t * 0.055) * 4;
    ctx.save();
    ctx.shadowColor = '#88ccff';
    ctx.shadowBlur  = 12 + Math.sin(this._t * 0.1) * 4;

    // canopy
    ctx.fillStyle = '#3388dd';
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy);
    ctx.arc(cx, cy, 12, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // canopy edge scallop
    ctx.fillStyle = '#2266bb';
    for (let i = 0; i < 4; i++) {
      const a = Math.PI + (i + 0.5) * (Math.PI / 4);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 10, cy + Math.sin(a) * 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // ribs
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.8;
    for (let i = 1; i <= 3; i++) {
      const a = Math.PI + (i / 4) * Math.PI;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 12, cy); ctx.stroke();
    }
    // handle
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#a06820'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 14); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - 3, cy + 14, 3, 0, Math.PI); ctx.stroke();
    ctx.lineCap = 'butt';

    // sparkles
    ctx.fillStyle = 'rgba(160,220,255,0.7)';
    for (let i = 0; i < 3; i++) {
      const a = (this._t * 0.04 + i * 2.1) % (Math.PI * 2);
      const r = 18 + i * 3;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.5 - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ── ForestBackground ─────────────────────────────────────────
class ForestBackground {
  constructor(levelWidth) {
    this.flocks = [];
    this.flockTimer = 0;
    this.flockInterval = 200;

    // deterministic tree positions
    const lcg = n => ((n * 1664525 + 1013904223) >>> 0) / 0xFFFFFFFF;
    this.trees = [];
    let tx = 60;
    let seed = 1;
    while (tx < levelWidth) {
      const r = lcg(seed++);
      const r2 = lcg(seed++);
      const r3 = lcg(seed++);
      this.trees.push({
        x: tx,
        h: 110 + r * 180,
        w: 38 + r2 * 36,
        layer: r3 < 0.45 ? 0 : 1,
      });
      tx += 90 + Math.floor(lcg(seed++) * 100);
    }
  }

  update() {
    this.flockTimer++;
    if (this.flockTimer >= this.flockInterval) {
      this.flockTimer = 0;
      this.flockInterval = 160 + Math.floor(Math.random() * 160);
      const dir    = Math.random() > 0.5 ? 1 : -1;
      const startX = dir > 0 ? -120 : 680;
      const y      = 30 + Math.random() * 220;
      const n      = 4 + Math.floor(Math.random() * 7);
      this.flocks.push({
        birds: Array.from({length: n}, (_, i) => ({
          ox: i * dir * -28 + (Math.random() - 0.5) * 10,
          oy: (Math.random() - 0.5) * 18,
          wp: Math.random() * Math.PI * 2,
        })),
        x: startX, y,
        vx: dir * (1.0 + Math.random() * 1.0),
        life: 0, maxLife: 360,
      });
    }
    this.flocks.forEach(f => {
      f.x  += f.vx;
      f.life++;
      f.birds.forEach(b => { b.wp += 0.16; });
    });
    this.flocks = this.flocks.filter(f => f.life < f.maxLife);
  }

  draw(ctx, camX, W, H) {
    // far trees — parallax 0.15
    this.trees.filter(t => t.layer === 0).forEach(t => {
      const sx = t.x - camX * 0.15;
      if (sx < -t.w - 10 || sx > W + 10) return;
      this._tree(ctx, sx, H, t.w * 0.7, t.h * 0.72, 0.10);
    });
    // mid trees — parallax 0.45
    this.trees.filter(t => t.layer === 1).forEach(t => {
      const sx = t.x - camX * 0.45;
      if (sx < -t.w - 10 || sx > W + 10) return;
      this._tree(ctx, sx, H, t.w, t.h, 0.22);
    });
    // bird flocks
    this.flocks.forEach(f => {
      const alpha = Math.min(1, Math.min(f.life, f.maxLife - f.life) / 25) * 0.65;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#2a3a4a';
      f.birds.forEach(b => {
        const bx = f.x + b.ox;
        const by = f.y + b.oy;
        const wg = Math.sin(b.wp) * 5;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx - 7 * Math.sign(f.vx), by - 2 + wg, bx - 14 * Math.sign(f.vx), by + 1);
        ctx.quadraticCurveTo(bx + 7 * Math.sign(f.vx), by - 2 + wg, bx + 14 * Math.sign(f.vx), by + 1);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
    });
  }

  _tree(ctx, x, groundY, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    // trunk
    ctx.fillStyle = '#120804';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.09, groundY);
    ctx.lineTo(x - w * 0.07, groundY - h * 0.38);
    ctx.lineTo(x + w * 0.07, groundY - h * 0.38);
    ctx.lineTo(x + w * 0.09, groundY);
    ctx.closePath();
    ctx.fill();
    // canopy layers (3 circles)
    const shades = ['#010e02', '#020e02', '#031004'];
    for (let i = 0; i < 3; i++) {
      const cy = groundY - h * (0.38 + i * 0.21);
      const cr = w * (0.52 - i * 0.1);
      ctx.fillStyle = shades[i % shades.length];
      ctx.beginPath(); ctx.arc(x, cy, cr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// ── Parrot ────────────────────────────────────────────────────
// Emerges from portal at top, dives, always hits, knocks 4 branches back.
// Appears once at end of level.
class Parrot {
  constructor(triggerXs) {
    this.triggerXs  = triggerXs.slice();
    this.spawnsDone = 0;
    this.active     = false;
    this.worldX     = 0;
    this.worldY     = 0;
    this.vx         = 0;
    this.vy         = 0;
    this.w          = 52;
    this.h          = 38;
    this.state      = 'idle'; // idle | spawning | diving | leaving
    this.wingPhase  = 0;
    this.hit        = false;
    this.hitTimer   = 0;
    this.spawnTimer = 0;
    this.particles  = [];
  }

  trySpawn(player, camX, camY) {
    if (this.active || this.spawnsDone >= this.triggerXs.length) return;
    if (player.x >= this.triggerXs[this.spawnsDone]) {
      this.worldX     = player.x + player.w * 0.5 - this.w * 0.5;
      this.worldY     = camY + 36;   // visible at top of screen
      this.vx         = 0;
      this.vy         = 0;
      this.state      = 'spawning';
      this.spawnTimer = 0;
      this.active     = true;
      this.hit        = false;
      this.hitTimer   = 0;
      this.particles  = [];
      this.spawnsDone++;
    }
  }

  update(player, platforms, camY) {
    if (!this.active) return;
    this.wingPhase++;

    if (this.hitTimer > 0) {
      this.hitTimer--;
      this.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.25;
        p.vx *= 0.96;
        p.life--;
      });
      this.particles = this.particles.filter(p => p.life > 0);
      if (this.hitTimer <= 0) this.active = false;
      return;
    }

    if (this.state === 'spawning') {
      this.spawnTimer++;
      if (this.spawnTimer >= 70) {
        this.state = 'diving';
        this.vy    = 9;
      }
      return;
    }

    if (this.state === 'diving') {
      // home horizontally toward player center
      const targetX = player.x + player.w * 0.5 - this.w * 0.5;
      this.vx += (targetX - this.worldX) * 0.14;
      this.vx *= 0.78;
      this.worldX += this.vx;
      this.worldY += this.vy;

      // hit: bounding box overlap OR parrot y passes player midpoint (guaranteed hit)
      const overlap = this.worldX < player.x + player.w &&
                      this.worldX + this.w > player.x   &&
                      this.worldY < player.y + player.h &&
                      this.worldY + this.h > player.y;
      const passed  = this.worldY + this.h >= player.y + player.h * 0.5;

      if (overlap || passed) {
        this.worldX = player.x + player.w * 0.5 - this.w * 0.5;
        this.worldY = player.y - this.h * 0.5;
        this._spawnParticles();
        this._knockBack(player, platforms);
        if (typeof SoundFX !== 'undefined') SoundFX.parrotLaugh();
        this.hit      = true;
        this.hitTimer = 45;
        this.vx       = 0;
        this.vy       = 0;
        this.state    = 'leaving';
      }
    }
  }

  _spawnParticles() {
    const cx = this.worldX + this.w * 0.5;
    const cy = this.worldY + this.h * 0.5;
    const colors = ['#ff4400', '#ffcc00', '#ffffff', '#ff8800', '#1144cc', '#cc2200'];
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 16,
        y: cy + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 18 + Math.floor(Math.random() * 22),
        color: colors[Math.floor(Math.random() * colors.length)],
        r: 2 + Math.random() * 4
      });
    }
    // feather shards
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * 2 - 1,
        life: 28 + Math.floor(Math.random() * 18),
        color: ['#1144cc', '#cc2200', '#ffcc00', '#2255dd'][Math.floor(Math.random() * 4)],
        r: 1.5 + Math.random() * 3.5,
        feather: true
      });
    }
  }

  _knockBack(player, platforms) {
    const left = platforms.filter(p =>
      (p instanceof BranchSpring || p instanceof BranchStatic) &&
      p.active !== false &&
      p.x + p.w * 0.5 < player.x + player.w * 0.5
    ).sort((a, b) => b.x - a.x);

    const target = left[3] || left[left.length - 1];
    if (target) {
      player.x        = target.x + target.w * 0.5 - player.w * 0.5;
      player.y        = target.y - player.h - 2;
      player.vx       = -3;
      player.vy       = -5;
      player.onGround = false;
    } else {
      player.vx = -10;
    }
    player.controlLoss = 35;
  }

  reset() {
    this.active     = false;
    this.spawnsDone = 0;
    this.hit        = false;
    this.hitTimer   = 0;
    this.spawnTimer = 0;
    this.particles  = [];
    this.state      = 'idle';
  }

  draw(ctx, camX, camY) {
    if (!this.active) return;

    // flash overlay when hit fires
    if (this.hitTimer > 38) {
      const alpha = (this.hitTimer - 38) / 7 * 0.55;
      ctx.save();
      ctx.fillStyle = `rgba(255,200,80,${alpha})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }

    // impact particles
    if (this.particles.length > 0) {
      this.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / 40);
        ctx.fillStyle = p.color;
        if (p.feather) {
          ctx.beginPath();
          ctx.ellipse(p.x - camX, p.y - camY, p.r, p.r * 0.4, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x - camX, p.y - camY, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    if (this.hitTimer > 0) return; // don't draw bird after impact

    // portal spawn animation
    if (this.state === 'spawning') {
      const cx = Math.round(this.worldX - camX + this.w * 0.5);
      const cy = Math.round(this.worldY - camY + this.h * 0.5);
      const prog = this.spawnTimer / 70;
      const maxR = 58;
      const r = 8 + prog * (maxR - 8);

      // glow fill
      ctx.save();
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grd.addColorStop(0, `rgba(180,80,255,${0.35 * prog})`);
      grd.addColorStop(1, 'rgba(80,0,160,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // spinning rings
      const ringColors = ['#cc55ff', '#8822cc', '#ff66ff'];
      for (let ri = 0; ri < 3; ri++) {
        const rr = r - ri * 9;
        if (rr < 2) continue;
        ctx.save();
        ctx.globalAlpha = (0.9 - ri * 0.25) * Math.min(1, prog * 2);
        ctx.strokeStyle = ringColors[ri];
        ctx.lineWidth = 3 - ri * 0.8;
        ctx.shadowColor = '#cc55ff';
        ctx.shadowBlur = 8 - ri * 2;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      // sparks orbiting portal
      const nSparks = 8;
      for (let si = 0; si < nSparks; si++) {
        const angle = (si / nSparks) * Math.PI * 2 + this.spawnTimer * 0.12;
        const sx = cx + Math.cos(angle) * r;
        const sy = cy + Math.sin(angle) * r * 0.45;
        ctx.save();
        ctx.globalAlpha = 0.7 * prog;
        ctx.fillStyle = si % 2 === 0 ? '#ff88ff' : '#ffcc00';
        ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // parrot fades in from center during second half
      if (prog > 0.5) {
        const fadeIn = (prog - 0.5) * 2;
        ctx.save();
        ctx.globalAlpha = fadeIn;
        ctx.translate(cx - this.w * 0.5, cy - this.h * 0.5);
        this._drawBird(ctx, 0, 0);
        ctx.restore();
      }
      return;
    }

    const rx  = this.worldX - camX;
    const ry  = this.worldY - camY;
    this._drawBird(ctx, rx, ry);
  }

  _drawBird(ctx, rx, ry) {
    const wg  = Math.sin(this.wingPhase * 0.22) * 15;
    ctx.save();

    // upper wing (blue)
    ctx.fillStyle = '#1144cc';
    ctx.beginPath();
    ctx.ellipse(rx + 26, ry + 16 + wg, 24, 9, -0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2255dd';
    ctx.beginPath();
    ctx.ellipse(rx + 24, ry + 13 + wg, 16, 5, -0.32, 0, Math.PI * 2);
    ctx.fill();
    // lower wing
    ctx.fillStyle = '#0d3aaa';
    ctx.beginPath();
    ctx.ellipse(rx + 26, ry + 24 - wg * 0.45, 18, 7, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // tail feathers
    ctx.fillStyle = '#cc2200';
    ctx.beginPath();
    ctx.moveTo(rx + 44, ry + 19);
    ctx.bezierCurveTo(rx + 64, ry + 9,  rx + 76, ry + 15, rx + 66, ry + 19);
    ctx.bezierCurveTo(rx + 76, ry + 23, rx + 64, ry + 30, rx + 44, ry + 22);
    ctx.fill();
    ctx.fillStyle = '#ff4400';
    ctx.beginPath();
    ctx.moveTo(rx + 44, ry + 17);
    ctx.bezierCurveTo(rx + 62, ry + 8,  rx + 74, ry + 14, rx + 66, ry + 17);
    ctx.bezierCurveTo(rx + 74, ry + 20, rx + 62, ry + 27, rx + 44, ry + 20);
    ctx.fill();
    // yellow tail stripe
    ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(rx + 45, ry + 18);
    ctx.bezierCurveTo(rx + 62, ry + 10, rx + 72, ry + 15, rx + 66, ry + 18);
    ctx.stroke();

    // body (scarlet)
    ctx.fillStyle = '#cc2200';
    ctx.beginPath();
    ctx.ellipse(rx + 24, ry + 19, 19, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ee3300';
    ctx.beginPath();
    ctx.ellipse(rx + 22, ry + 17, 15, 10, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // belly yellow-green
    ctx.fillStyle = '#88aa00';
    ctx.beginPath();
    ctx.ellipse(rx + 23, ry + 20, 7, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // head
    ctx.fillStyle = '#cc2200';
    ctx.beginPath(); ctx.arc(rx + 8, ry + 12, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ee3300';
    ctx.beginPath(); ctx.arc(rx + 7, ry + 11, 10, 0, Math.PI * 2); ctx.fill();
    // white face patch with feather lines
    ctx.fillStyle = '#fff8ee';
    ctx.beginPath(); ctx.ellipse(rx + 4, ry + 13, 6, 4.5, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ddd0bb'; ctx.lineWidth = 0.6;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(rx + 0, ry + 11 + i * 2); ctx.lineTo(rx + 9, ry + 11 + i * 2); ctx.stroke();
    }
    // hook beak (macaw)
    ctx.fillStyle = '#aa8800';
    ctx.beginPath();
    ctx.moveTo(rx - 1, ry + 11);
    ctx.bezierCurveTo(rx - 14, ry + 8, rx - 16, ry + 13, rx - 9, ry + 17);
    ctx.lineTo(rx - 1, ry + 15);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ccaa00';
    ctx.beginPath();
    ctx.moveTo(rx,    ry + 11);
    ctx.bezierCurveTo(rx - 11, ry + 9, rx - 13, ry + 12, rx - 8, ry + 14);
    ctx.lineTo(rx, ry + 13);
    ctx.closePath(); ctx.fill();

    // eye
    ctx.fillStyle = '#ffee88';
    ctx.beginPath(); ctx.arc(rx + 5, ry + 9, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111100';
    ctx.beginPath(); ctx.arc(rx + 4.5, ry + 9, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(rx + 3.8, ry + 8, 1.1, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}
