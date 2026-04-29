const DEFAULT_PHYSICS = {
  gravity:   0.55,
  jumpForce: 13,
  djForce:   11,
  moveSpeed: 4.5,
  friction:  0.82,
};

const COYOTE_TIME = 8;
const JUMP_BUFFER = 8;

class Player {
  constructor(x, y) {
    this.physics = { ...DEFAULT_PHYSICS };
    this.gravityDir = 1;  // +1 = normal, -1 = inverted
    this.reset(x, y);
  }

  setPhysics(cfg) {
    this.physics = { ...DEFAULT_PHYSICS, ...cfg };
  }

  reset(x, y) {
    this.x = x; this.y = y;
    this.w = 24; this.h = 36;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.canDoubleJump = false;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.facingRight = true;
    this.animFrame = 0;
    this.animTimer = 0;
    this.dead = false;
    this.deathTimer = 0;
    this.trailParticles = [];
    this.gravityDir = 1;
    this.gravityAxis = 'y';
    this.ghostSprite = null;
    this.endSprite = null;
    this.endAnimActive = false;
    this.endAnimDone   = false;
    this.endAnimFrame  = 0;
    this.endAnimTimer  = 0;
    this._ghostEndCanvas  = null;
    this.endStartWorldX   = 0;
    this.endStartWorldY   = 0;
    this.endPortalWorldX  = 0;
    this.endPortalWorldY  = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(platforms, hazards) {
    if (this.dead) { this.deathTimer++; return; }
    if (this.gravityAxis === 'x') { this._updateHorizontal(platforms, hazards); return; }

    const ph = this.physics;

    // --- horizontal ---
    if (Input.isLeft())  this.vx -= 1.5;
    if (Input.isRight()) this.vx += 1.5;
    this.vx *= ph.friction;
    if (Math.abs(this.vx) > ph.moveSpeed) this.vx = Math.sign(this.vx) * ph.moveSpeed;
    if (Input.isLeft())  this.facingRight = false;
    if (Input.isRight()) this.facingRight = true;

    // --- jump buffer ---
    if (Input.wasJumped()) this.jumpBuffer = JUMP_BUFFER;
    if (this.jumpBuffer > 0) this.jumpBuffer--;

    // --- coyote time ---
    if (this.onGround) {
      this.coyoteTimer = COYOTE_TIME;
      this.canDoubleJump = true;
    } else {
      if (this.coyoteTimer > 0) this.coyoteTimer--;
    }

    // --- jump ---
    if (this.jumpBuffer > 0) {
      if (this.coyoteTimer > 0) {
        this.vy = -ph.jumpForce * this.gravityDir;
        this.coyoteTimer = 0;
        this.jumpBuffer = 0;
        SoundFX.jump();
      } else if (this.canDoubleJump) {
        this.vy = -ph.djForce * this.gravityDir;
        this.canDoubleJump = false;
        this.jumpBuffer = 0;
        this._spawnDJBurst();
        SoundFX.doubleJump();
      }
    }

    // --- variable jump height (only when moving against gravity) ---
    const movingAgainstGravity = this.vy * this.gravityDir < -4;
    if (!Input.isJump() && movingAgainstGravity) {
      this.vy += this.gravityDir * 0.9;
    }

    // --- gravity ---
    this.vy += ph.gravity * this.gravityDir;
    // clamp fall speed
    if (this.vy * this.gravityDir > 18) this.vy = 18 * this.gravityDir;

    // --- move & collide ---
    this.x += this.vx;
    this._resolveX(platforms);

    const wasOnGround = this.onGround;
    this.onGround = false;
    this.y += this.vy;
    this._resolveY(platforms);
    if (!wasOnGround && this.onGround) SoundFX.land();

    // --- hazards ---
    for (const h of hazards) {
      if (this._overlaps(h)) { this.die(); return; }
    }

    // --- trail ---
    if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 2) {
      this.trailParticles.push({ x: this.cx, y: this.cy, life: 10, maxLife: 10 });
    }
    this.trailParticles = this.trailParticles.filter(p => p.life-- > 0);

    // --- anim ---
    this.animTimer++;
    if (this.animTimer > 8) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 4; }
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.deathTimer = 0;
    SoundFX.die();
  }

  _updateHorizontal(platforms, hazards) {
    const ph = this.physics;

    // movement along wall (vertical axis)
    if (Input.isDown('ArrowUp')   || Input.isDown('KeyW'))   { this.vy -= 1.5; this.facingRight = false; }
    if (Input.isDown('ArrowDown') || Input.isDown('KeyS'))   { this.vy += 1.5; this.facingRight = true;  }
    this.vy *= ph.friction;
    if (Math.abs(this.vy) > ph.moveSpeed) this.vy = Math.sign(this.vy) * ph.moveSpeed;

    // jump buffer (Space only — arrows are used for movement)
    if (Input.wasPressed('Space')) this.jumpBuffer = JUMP_BUFFER;
    if (this.jumpBuffer > 0) this.jumpBuffer--;

    // coyote time
    if (this.onGround) { this.coyoteTimer = COYOTE_TIME; this.canDoubleJump = true; }
    else if (this.coyoteTimer > 0) this.coyoteTimer--;

    // jump away from wall
    if (this.jumpBuffer > 0) {
      if (this.coyoteTimer > 0) {
        this.vx = -ph.jumpForce * this.gravityDir;
        this.coyoteTimer = 0; this.jumpBuffer = 0; SoundFX.jump();
      } else if (this.canDoubleJump) {
        this.vx = -ph.djForce * this.gravityDir;
        this.canDoubleJump = false; this.jumpBuffer = 0;
        this._spawnDJBurst(); SoundFX.doubleJump();
      }
    }

    // variable jump height
    if (!Input.isDown('Space') && this.vx * this.gravityDir < -4) this.vx += this.gravityDir * 0.9;

    // gravity (horizontal axis)
    this.vx += ph.gravity * this.gravityDir;
    if (this.vx * this.gravityDir > 18) this.vx = 18 * this.gravityDir;

    // move & collide
    this.y += this.vy;
    this._resolveY_slide(platforms);
    const wasOnGround = this.onGround;
    this.onGround = false;
    this.x += this.vx;
    this._resolveX_land(platforms);
    if (!wasOnGround && this.onGround) SoundFX.land();

    // hazards
    for (const h of hazards) { if (this._overlaps(h)) { this.die(); return; } }

    // trail
    if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 2)
      this.trailParticles.push({ x: this.cx, y: this.cy, life: 10, maxLife: 10 });
    this.trailParticles = this.trailParticles.filter(p => p.life-- > 0);

    this.animTimer++;
    if (this.animTimer > 8) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 4; }
  }

  _resolveX_land(platforms) {
    for (const p of platforms) {
      if (p.active === false) continue;
      if (!this._overlaps(p)) continue;
      const movingWithGravity = this.vx * this.gravityDir > 0;
      if (movingWithGravity) {
        if (this.gravityDir > 0) this.x = p.x - this.w;
        else                     this.x = p.x + p.w;
        this.vx = 0; this.onGround = true;
        if (p.onPlayerLand) p.onPlayerLand();
      } else {
        if (this.gravityDir > 0) this.x = p.x + p.w;
        else                     this.x = p.x - this.w;
        this.vx = 0;
      }
    }
  }

  _resolveY_slide(platforms) {
    for (const p of platforms) {
      if (p.active === false) continue;
      if (!this._overlaps(p)) continue;
      if (this.vy > 0) this.y = p.y - this.h;
      else             this.y = p.y + p.h;
      this.vy = 0;
    }
  }

  _resolveX(platforms) {
    for (const p of platforms) {
      if (p.active === false) continue;
      if (!this._overlaps(p)) continue;
      if (this.vx > 0) this.x = p.x - this.w;
      else if (this.vx < 0) this.x = p.x + p.w;
      this.vx = 0;
    }
  }

  _resolveY(platforms) {
    for (const p of platforms) {
      if (p.active === false) continue;
      if (!this._overlaps(p)) continue;
      const movingWithGravity = this.vy * this.gravityDir > 0;
      if (movingWithGravity) {
        // landing on surface
        if (this.gravityDir > 0) this.y = p.y - this.h;
        else                     this.y = p.y + p.h;
        const landVy = this.vy;
        this.vy = 0;
        this.onGround = true;
        if (p.onPlayerLand) p.onPlayerLand(this, landVy);
      } else {
        // head hit
        if (this.gravityDir > 0) this.y = p.y + p.h;
        else                     this.y = p.y - this.h;
        this.vy = 0;
      }
    }
  }

  _overlaps(r) {
    return this.x < r.x + r.w && this.x + this.w > r.x &&
           this.y < r.y + r.h && this.y + this.h > r.y;
  }

  _spawnDJBurst() {
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      this.trailParticles.push({
        x: this.cx + Math.cos(ang) * 8, y: this.cy + Math.sin(ang) * 8,
        vx: Math.cos(ang) * 2.5, vy: Math.sin(ang) * 2.5,
        life: 22, maxLife: 22, dj: true
      });
    }
  }

  draw(ctx, camX, camY) {
    this.trailParticles.forEach(p => {
      if (p.vx !== undefined) { p.x += p.vx; p.y += p.vy; }
      ctx.save();
      ctx.globalAlpha = (p.life / p.maxLife) * (p.dj ? 0.6 : 0.35);
      ctx.fillStyle = p.dj ? '#e0a0ff' : '#8070c0';
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y - camY, p.dj ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (this.dead) return;
    if (this.endAnimDone) return;

    const sx = Math.round(this.x - camX);
    const sy = Math.round(this.y - camY);

    if (this.endAnimActive) {
      this._drawEndAnim(ctx, sx, sy, camX, camY);
      return;
    }

    if (this.ghostSprite && this.ghostSprite.complete && this.ghostSprite.naturalWidth > 0) {
      this._drawGhost(ctx, sx, sy);
      return;
    }

    // glow
    ctx.save();
    const g = ctx.createRadialGradient(sx+12, sy+18, 2, sx+12, sy+18, 24);
    g.addColorStop(0, 'rgba(160,120,255,0.35)');
    g.addColorStop(1, 'rgba(160,120,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx+12, sy+18, 24, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // draw flipped/rotated based on gravity axis and direction
    const flip = this.gravityAxis === 'y' && this.gravityDir < 0;
    const rotAngle = this.gravityAxis === 'x' ? (this.gravityDir > 0 ? -Math.PI / 2 : Math.PI / 2) : 0;
    ctx.save();
    if (flip) {
      ctx.translate(sx + this.w / 2, sy + this.h / 2);
      ctx.scale(1, -1);
      ctx.translate(-(sx + this.w / 2), -(sy + this.h / 2));
    } else if (rotAngle !== 0) {
      ctx.translate(sx + this.w / 2, sy + this.h / 2);
      ctx.rotate(rotAngle);
      ctx.translate(-(sx + this.w / 2), -(sy + this.h / 2));
    }

    // body
    ctx.fillStyle = '#c0a0ff';
    ctx.beginPath();
    ctx.roundRect(sx, sy + 12, this.w, this.h - 12, 4);
    ctx.fill();

    // head
    ctx.fillStyle = '#d8c0ff';
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 10, 10, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // eye
    const eyeX = this.facingRight ? sx + 17 : sx + 7;
    ctx.fillStyle = '#1a0030';
    ctx.beginPath();
    ctx.ellipse(eyeX, sy + 8, 2.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(eyeX + (this.facingRight ? 0.5 : -0.5), sy + 7, 1, 0, Math.PI * 2);
    ctx.fill();

    // legs
    const legOff = this.onGround ? Math.sin(this.animFrame * 1.5) * 4 : 0;
    ctx.fillStyle = '#9070cc';
    ctx.beginPath();
    ctx.roundRect(sx + 2, sy + this.h - 10 + legOff, 8, 10, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(sx + this.w - 10, sy + this.h - 10 - legOff, 8, 10, 3);
    ctx.fill();
    ctx.restore();
  }

  // build offscreen canvas with black bg + sparkles removed (called once on first draw)
  _buildGhostCanvas() {
    const img = this.ghostSprite;
    const oc  = document.createElement('canvas');
    oc.width  = img.naturalWidth;
    oc.height = img.naturalHeight;
    const octx = oc.getContext('2d');
    octx.drawImage(img, 0, 0);
    const id = octx.getImageData(0, 0, oc.width, oc.height);
    const d  = id.data;
    const IW = oc.width, IH = oc.height;

    // Pass 1: build coarse "ghost presence" map (20×20 blocks).
    // A block is "ghost" if it contains a clearly blue pixel (b > r+15, b > 100).
    const BS  = 20;
    const bW  = Math.ceil(IW / BS);
    const bH  = Math.ceil(IH / BS);
    const ghostMap = new Uint8Array(bW * bH);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 2] > d[i] + 15 && d[i + 2] > 100) {
        const pi = i >> 2;
        ghostMap[((pi / IW | 0) / BS | 0) * bW + ((pi % IW) / BS | 0)] = 1;
      }
    }

    // Pass 2: remove dark bg + sparkles that are far from any ghost block.
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const lum = r * 0.299 + g * 0.587 + b * 0.114;

      // black background → transparent
      if (lum < 50 && Math.max(r, g, b) < 70) { d[i + 3] = 0; continue; }

      // bright near-achromatic → potential sparkle
      if (lum > 150) {
        const sat     = Math.max(r, g, b) - Math.min(r, g, b);
        const blueAdv = b - Math.max(r, g);
        if (sat < 50 && blueAdv < 20) {
          const pi  = i >> 2;
          const px  = pi % IW;
          const py  = (pi / IW) | 0;
          const bx  = (px / BS) | 0;
          const by  = (py / BS) | 0;
          // check 3-block radius (~60 px) for ghost presence
          let nearGhost = false;
          for (let dby = -3; dby <= 3 && !nearGhost; dby++) {
            for (let dbx = -3; dbx <= 3 && !nearGhost; dbx++) {
              const bi = (by + dby) * bW + (bx + dbx);
              if (bi >= 0 && bi < ghostMap.length && ghostMap[bi]) nearGhost = true;
            }
          }
          if (!nearGhost) {
            const fade = Math.min(1, (lum - 150) / 80);
            d[i + 3]   = Math.floor(d[i + 3] * Math.max(0, 1 - fade * 0.97));
          }
        }
      }
    }

    octx.putImageData(id, 0, 0);
    return oc;
  }

  _buildEndCanvas() {
    const img = this.endSprite;
    const oc  = document.createElement('canvas');
    oc.width  = img.naturalWidth;
    oc.height = img.naturalHeight;
    const octx = oc.getContext('2d');
    octx.drawImage(img, 0, 0);
    const id = octx.getImageData(0, 0, oc.width, oc.height);
    const d  = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114 < 50 && Math.max(d[i], d[i+1], d[i+2]) < 70)
        d[i+3] = 0;
    }
    octx.putImageData(id, 0, 0);
    return oc;
  }

  _drawEndAnim(ctx, sx, sy, camX, camY) {
    if (!this._ghostEndCanvas) this._ghostEndCanvas = this._buildEndCanvas();
    const img  = this._ghostEndCanvas;
    const COLS = 5, ROWS = 5;
    const fw   = (img.width  / COLS) | 0;
    const fh   = (img.height / ROWS) | 0;

    const frameIdx = Math.min(24, this.endAnimFrame);
    const col = frameIdx % COLS;
    const row = (frameIdx / COLS) | 0;

    // interpolate world position from player start → portal center (ease-in over first 15 frames)
    const moveT  = Math.min(1, frameIdx / 15);
    const eased  = moveT * moveT;
    const worldCX = this.endStartWorldX + (this.endPortalWorldX - this.endStartWorldX) * eased;
    const worldCY = this.endStartWorldY + (this.endPortalWorldY - this.endStartWorldY) * eased;
    const scx = Math.round(worldCX - camX);
    const scy = Math.round(worldCY - camY);

    // scale: normal → burst → shrink to zero
    let scale;
    if (frameIdx < 15)      scale = 1.69;
    else if (frameIdx < 20) scale = 1.69 + (frameIdx - 15) / 5 * 0.81;  // 1.69 → 2.5
    else                    scale = 2.5 * (1 - (frameIdx - 20) / 5);     // 2.5 → 0

    const dh = this.h * Math.max(0, scale);
    const dw = (fw / fh) * dh;
    const dx = scx - dw / 2;
    const dy = scy - dh / 2;

    if (dh <= 0) return;

    ctx.save();
    ctx.drawImage(img, col * fw, row * fh, fw, fh, dx, dy, dw, dh);
    ctx.restore();
  }

  _drawGhost(ctx, sx, sy) {
    if (!this._ghostCanvas) this._ghostCanvas = this._buildGhostCanvas();
    const img  = this._ghostCanvas;
    const COLS = 4, ROWS = 4;
    const fw   = (img.width  / COLS) | 0;
    const fh   = (img.height / ROWS) | 0;

    const now     = Date.now();
    const isHoriz = this.gravityAxis === 'x';
    // idle: no movement along the movement axis
    const isIdle  = this.onGround && (isHoriz ? Math.abs(this.vy) <= 0.5 : Math.abs(this.vx) <= 0.5);
    // bob only makes sense when gravity is vertical
    const bob     = (isIdle && !isHoriz) ? Math.sin(now / 1100) * 2.5 : 0;

    const dh = this.h * 1.69;
    const dw = (fw / fh) * dh;

    // In local (post-rotation) frame, floor is always at +Y = floorHalf from hitbox center
    const floorHalf = isHoriz ? this.w / 2 : this.h / 2;
    const drawX = -dw / 2;
    const drawY = floorHalf - dh + bob;

    // Set up transform: translate to hitbox center, rotate for wall gravity, flip for facing
    const hcx   = sx + this.w / 2;
    const hcy   = sy + this.h / 2;
    const flipH = !this.facingRight;

    ctx.save();
    ctx.translate(hcx, hcy);
    if (isHoriz) {
      // right wall: rotate -90°, left wall: rotate +90°
      ctx.rotate(this.gravityDir > 0 ? -Math.PI / 2 : Math.PI / 2);
      if (flipH) ctx.scale(-1, 1);
    } else {
      const sX = flipH ? -1 : 1;
      const sY = this.gravityDir < 0 ? -1 : 1;
      if (sX !== 1 || sY !== 1) ctx.scale(sX, sY);
    }

    if (isIdle) {
      // crossfade between adjacent frames — smooth, no snap
      const raw   = (Math.sin(now / 1100) + 1) / 2 * 3;
      const fA    = Math.floor(raw);
      const fB    = Math.min(3, fA + 1);
      const blend = raw - fA;
      ctx.globalAlpha = 1 - blend;
      ctx.drawImage(img, (fA % COLS) * fw, ((fA / COLS) | 0) * fh, fw, fh, drawX, drawY, dw, dh);
      if (blend > 0.01) {
        ctx.globalAlpha = blend;
        ctx.drawImage(img, (fB % COLS) * fw, ((fB / COLS) | 0) * fh, fw, fh, drawX, drawY, dw, dh);
      }
    } else {
      let frameIdx;
      if (!this.onGround) {
        // use correct velocity axis for air animation
        const airVel = isHoriz ? this.vx * this.gravityDir : this.vy * this.gravityDir;
        if (airVel < 0) {
          const t = Math.min(1, (-airVel) / 13);
          frameIdx = 8 + Math.min(3, Math.floor((1 - t) * 4));
        } else {
          const t = Math.min(1, airVel / 18);
          frameIdx = 12 + Math.min(3, Math.floor(t * 4));
        }
      } else {
        frameIdx = 4 + Math.floor(now / 130) % 4;
      }
      const col = frameIdx % COLS;
      const row = (frameIdx / COLS) | 0;
      ctx.drawImage(img, col * fw, row * fh, fw, fh, drawX, drawY, dw, dh);
    }

    ctx.restore();
  }
}
