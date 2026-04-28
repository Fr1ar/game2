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
