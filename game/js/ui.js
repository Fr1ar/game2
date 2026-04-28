const UI = {
  draw(ctx, W, H, shardsCollected, shardsTotal, portalActive, player, portal, camX, camY) {
    // --- shard counter top-left ---
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(10,5,30,0.7)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 130, 40, 8);
    ctx.fill();

    for (let i = 0; i < shardsTotal; i++) {
      const filled = i < shardsCollected;
      const cx = 36 + i * 38, cy = 36;
      if (filled) {
        // glowing filled shard
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
        g.addColorStop(0, 'rgba(160,224,255,0.8)');
        g.addColorStop(1, 'rgba(100,180,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c0eeff';
      } else {
        ctx.fillStyle = 'rgba(100,100,160,0.4)';
      }
      ctx.strokeStyle = filled ? '#a0d8ef' : '#443366';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 9);
      ctx.lineTo(cx + 5, cy - 2);
      ctx.lineTo(cx + 3.5, cy + 7);
      ctx.lineTo(cx, cy + 5);
      ctx.lineTo(cx - 3.5, cy + 7);
      ctx.lineTo(cx - 5, cy - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // --- portal direction arrow (after activation) ---
    if (portalActive && player && portal) {
      const px = player.cx - camX;
      const py = player.cy - camY;
      const tx = portal.cx - camX;
      const ty = portal.cy - camY;
      const dx = tx - px, dy = ty - py;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // only show arrow if portal is off-screen or far
      const offScreen = tx < 0 || tx > W || ty < 0 || ty > H;
      if (offScreen || dist > 200) {
        const ang = Math.atan2(dy, dx);
        const arrowX = W / 2 + Math.cos(ang) * 160;
        const arrowY = H / 2 + Math.sin(ang) * 120;
        const pulse = 0.7 + Math.sin(Date.now() / 300) * 0.3;

        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.translate(arrowX, arrowY);
        ctx.rotate(ang);
        ctx.fillStyle = '#cc88ff';
        ctx.shadowColor = '#cc88ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // --- controls hint (first few seconds handled by game) ---
  },

  drawMessage(ctx, W, H, text, subtext, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(10,5,30,0.75)';
    ctx.beginPath();
    ctx.roundRect(W/2 - 220, H/2 - 60, 440, 120, 12);
    ctx.fill();

    ctx.fillStyle = '#e0ccff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#b080ff';
    ctx.shadowBlur = 16;
    ctx.fillText(text, W/2, H/2 - 16);

    if (subtext) {
      ctx.font = '16px sans-serif';
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#9080b0';
      ctx.fillText(subtext, W/2, H/2 + 18);
    }
    ctx.restore();
  },

  drawControls(ctx, W, H, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = 'rgba(10,5,30,0.65)';
    ctx.beginPath();
    ctx.roundRect(W/2 - 200, H - 64, 400, 48, 8);
    ctx.fill();
    ctx.fillStyle = '#7060a0';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('← → / WASD  —  двигаться    ↑ / W / Space  —  прыжок (двойной прыжок!)', W/2, H - 40);
    ctx.restore();
  }
};
