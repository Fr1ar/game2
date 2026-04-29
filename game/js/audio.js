const SoundFX = (() => {
  let ctx = null;
  let masterBus, sfxBus, bgmBus, cutsceneBus;

  // ===== bgm state =====
  let bgmGain = null;
  let bgmNodes = [];
  let bgmTimers = [];
  let bgmCurrentLevel = -1;

  // ===== intro cutscene state =====
  let introMaster = null;
  let introNodes  = [];
  let introTimers = [];

  // ===== cutscene state =====
  let cutsceneMaster = null;
  let cutsceneNodes = [];
  let heartbeatInterval = null;
  let stingerTimeout = null;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterBus   = ctx.createGain(); masterBus.gain.value   = 0.7;  masterBus.connect(ctx.destination);
      sfxBus      = ctx.createGain(); sfxBus.gain.value      = 0.5;  sfxBus.connect(masterBus);
      bgmBus      = ctx.createGain(); bgmBus.gain.value      = 0.55; bgmBus.connect(masterBus);
      cutsceneBus = ctx.createGain(); cutsceneBus.gain.value = 0.55; cutsceneBus.connect(masterBus);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ─────────── SFX ───────────

  function _blip(freq, freqEnd, type, peak, dur) {
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur * 0.9);
    const g = ac.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function jump()        { _blip(260, 620, 'square',   0.18, 0.16); }
  function doubleJump()  {
    _blip(520, 750, 'triangle', 0.15, 0.18);
    setTimeout(() => _blip(780, 1100, 'triangle', 0.12, 0.15), 50);
  }
  function land()        { _blip(140,  60, 'sine',     0.16, 0.12); }
  function die() {
    _blip(330, 55, 'sawtooth', 0.18, 0.7);
    setTimeout(() => _blip(165, 40, 'triangle', 0.12, 0.6), 60);
  }
  function checkpoint() {
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    [440, 660].forEach(f => {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.10, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.connect(g); g.connect(sfxBus);
      o.start(t); o.stop(t + 0.65);
    });
  }
  function collectShard() {
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    [880, 1320, 1760].forEach((f, i) => {
      const tt = t + i * 0.045;
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.13, tt + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 0.4);
      o.connect(g); g.connect(sfxBus);
      o.start(tt); o.stop(tt + 0.42);
    });
  }
  function portalActive() {
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    [110, 165, 220].forEach((f, i) => {
      const tt = t + i * 0.08;
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f, tt);
      o.frequency.linearRampToValueAtTime(f * 1.5, tt + 0.7);
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.13, tt + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 1.0);
      o.connect(g); g.connect(sfxBus);
      o.start(tt); o.stop(tt + 1.05);
    });
  }
  function portalEnter() {
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(1760, t + 0.7);
    const lpf = ac.createBiquadFilter(); lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(400, t);
    lpf.frequency.exponentialRampToValueAtTime(8000, t + 0.7);
    const g = ac.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.18, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    o.connect(lpf); lpf.connect(g); g.connect(sfxBus);
    o.start(t); o.stop(t + 0.85);
  }
  function springBoing() {
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.12);
    o.frequency.exponentialRampToValueAtTime(440, t + 0.28);
    const lpf = ac.createBiquadFilter(); lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(1800, t);
    lpf.frequency.exponentialRampToValueAtTime(600, t + 0.28);
    const g = ac.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.22, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    o.connect(lpf); lpf.connect(g); g.connect(sfxBus);
    o.start(t); o.stop(t + 0.35);
  }

  function batFlap(volume = 1) {
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    const dur = 0.10;
    // short noise burst → leathery flutter
    const bufLen = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      const env = 1 - i / bufLen;
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ac.createBufferSource(); src.buffer = buf;
    const bpf = ac.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 520; bpf.Q.value = 1.4;
    const g = ac.createGain(); g.gain.value = 0;
    const peak = 0.18 * Math.max(0, Math.min(1, volume));
    g.gain.linearRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bpf); bpf.connect(g); g.connect(sfxBus);
    src.start(t); src.stop(t + dur + 0.02);
  }

  function parrotLaugh() {
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    // 4 squawky "ha" bursts descending in pitch
    [0, 0.20, 0.38, 0.54].forEach((delay, i) => {
      const freq = 520 - i * 55;
      const o = ac.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq, t + delay);
      o.frequency.exponentialRampToValueAtTime(freq * 0.48, t + delay + 0.17);
      const bpf = ac.createBiquadFilter();
      bpf.type = 'bandpass'; bpf.frequency.value = freq * 1.4; bpf.Q.value = 1.8;
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.25, t + delay + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.19);
      o.connect(bpf); bpf.connect(g); g.connect(sfxBus);
      o.start(t + delay); o.stop(t + delay + 0.22);
    });
    // trailing cackle glide
    const og = ac.createOscillator(); og.type = 'sawtooth';
    og.frequency.setValueAtTime(380, t + 0.72);
    og.frequency.exponentialRampToValueAtTime(160, t + 1.1);
    const gg = ac.createGain(); gg.gain.value = 0;
    gg.gain.linearRampToValueAtTime(0.18, t + 0.74);
    gg.gain.exponentialRampToValueAtTime(0.001, t + 1.15);
    og.connect(gg); gg.connect(sfxBus);
    og.start(t + 0.72); og.stop(t + 1.18);
  }

  function gravityFlip() {
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(720, t + 0.25);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.5);
    const g = ac.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.13, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.connect(g); g.connect(sfxBus);
    o.start(t); o.stop(t + 0.6);
  }

  // ─────────── BGM ───────────

  function _bgmStart(fadeIn = 2.5) {
    const ac = getCtx(); if (!ac) return null;
    bgmGain = ac.createGain();
    bgmGain.gain.value = 0;
    bgmGain.gain.linearRampToValueAtTime(1, ac.currentTime + fadeIn);
    bgmGain.connect(bgmBus);
    return ac;
  }

  // Single drone oscillator
  function _bgmDrone(ac, freq, type, gain) {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = gain;
    o.connect(g); g.connect(bgmGain);
    o.start();
    bgmNodes.push({ o });
  }

  // Two detuned oscillators — chorus / beating effect
  function _bgmDetune(ac, freq, detuneCents, type, gain) {
    _bgmDrone(ac, freq, type, gain);
    _bgmDrone(ac, freq * Math.pow(2, detuneCents / 1200), type, gain * 0.70);
  }

  // LFO modulation on any AudioParam target
  function _bgmLFO(ac, freq, depth, target) {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = depth;
    o.connect(g); g.connect(target);
    o.start();
    bgmNodes.push({ o });
  }

  // Oscillator → bandpass/lowpass filter with LFO sweep → bgmGain
  function _bgmFilterSweep(ac, freq, oscType, gain, fType, fCenter, fRange, lfoRate, Q) {
    const o = ac.createOscillator(); o.type = oscType; o.frequency.value = freq;
    const f = ac.createBiquadFilter(); f.type = fType;
    f.frequency.value = fCenter; f.Q.value = Q || 2.5;
    const g = ac.createGain(); g.gain.value = gain;
    o.connect(f); f.connect(g); g.connect(bgmGain);
    const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = lfoRate;
    const lfoG = ac.createGain(); lfoG.gain.value = fRange;
    lfo.connect(lfoG); lfoG.connect(f.frequency);
    o.start(); lfo.start();
    bgmNodes.push({ o }); bgmNodes.push({ o: lfo });
  }

  // Delay-feedback reverb bus — returns input node; connect melodic sources to it
  function _bgmReverb(ac, delayTime, feedback, lpCutoff) {
    const inp = ac.createGain(); inp.gain.value = 0.28;
    const dly = ac.createDelay(2.0); dly.delayTime.value = delayTime;
    const fb  = ac.createGain(); fb.gain.value = feedback;
    const lpf = ac.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = lpCutoff;
    inp.connect(dly); dly.connect(lpf); lpf.connect(fb); fb.connect(dly);
    dly.connect(bgmGain);
    return inp;
  }

  function stopBGM() {
    if (!bgmGain || !ctx) return;
    const ac = ctx;
    const now = ac.currentTime;
    bgmTimers.forEach(t => { clearInterval(t); clearTimeout(t); });
    bgmTimers = [];
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
    bgmGain.gain.linearRampToValueAtTime(0, now + 0.8);
    const gRef = bgmGain;
    const nRef = bgmNodes;
    bgmGain = null; bgmNodes = []; bgmCurrentLevel = -1;
    setTimeout(() => {
      nRef.forEach(n => { try { n.o && n.o.stop(); } catch (e) {} });
      try { gRef.disconnect(); } catch (e) {}
    }, 1000);
  }

  // ── Level 0: L3 — Ломаный сон — психоделический лес ─────────────────────
  // Am pentatonic detuned pads + bandpass sweep + плавающие гармоники
  function _bgmForest() {
    const ac = _bgmStart(3.0); if (!ac) return;
    const rev = _bgmReverb(ac, 0.46, 0.48, 1800);

    _bgmDetune(ac,  55.00, 7, 'sine',     0.13);  // A1
    _bgmDetune(ac, 110.00, 5, 'sine',     0.09);  // A2
    _bgmDetune(ac, 130.81, 4, 'sine',     0.07);  // C3
    _bgmDetune(ac, 164.81, 3, 'sine',     0.05);  // E3
    _bgmDetune(ac, 220.00, 6, 'triangle', 0.035); // A3
    // bandpass sweep — breathing texture
    _bgmFilterSweep(ac, 82.41, 'sawtooth', 0.045, 'bandpass', 700, 600, 0.07, 3.5);
    _bgmLFO(ac, 0.08, 0.055, bgmGain.gain);
    _bgmLFO(ac, 0.22, 0.030, bgmGain.gain);

    // Floating pentatonic harmonics drift in at random
    const penta = [440, 523.25, 659.25, 880, 1046.5];
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime, freq = penta[Math.floor(Math.random() * penta.length)];
      const dur = 2.5 + Math.random() * 2;
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(freq, t);
      o.frequency.linearRampToValueAtTime(freq * (0.98 + Math.random() * 0.04), t + dur);
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.055, t + 0.35);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(bgmGain); g.connect(rev);
      o.start(t); o.stop(t + dur + 0.1);
    }, 3400));

    // Glitch clicks — broken dream texture
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'triangle';
      o.frequency.value = 1100 + Math.random() * 900;
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.016, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      o.connect(g); g.connect(bgmGain);
      o.start(t); o.stop(t + 0.09);
    }, 2600));
  }

  // ── Level 1: L4 — Кошмар — тёмный но мелодичный Am пэд ─────────────────
  // Am minor pad + мягкий фильтр + тихие удары + нисходящий мотив
  function _bgmNightmare() {
    const ac = _bgmStart(2.5); if (!ac) return;
    const rev = _bgmReverb(ac, 0.55, 0.42, 1400);

    // Am: A C E — properly tuned, no harsh beating
    _bgmDetune(ac,  55.00, 5, 'sine',     0.11);  // A1
    _bgmDetune(ac, 110.00, 4, 'sine',     0.09);  // A2
    _bgmDetune(ac, 130.81, 3, 'sine',     0.07);  // C3
    _bgmDetune(ac, 164.81, 4, 'triangle', 0.055); // E3
    _bgmDetune(ac, 220.00, 5, 'sine',     0.04);  // A3

    // Gentle lowpass sweep — subtle movement, low Q
    _bgmFilterSweep(ac, 110.0, 'triangle', 0.04, 'lowpass', 500, 700, 0.05, 2.0);
    _bgmLFO(ac, 0.10, 0.05, bgmGain.gain);

    // Soft heartbeat — lighter amplitude
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      [[0, 0.22], [0.15, 0.14]].forEach(([d, amp]) => {
        const tt = t + d;
        const o = ac.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(72, tt);
        o.frequency.exponentialRampToValueAtTime(32, tt + 0.18);
        const g = ac.createGain(); g.gain.value = 0;
        g.gain.linearRampToValueAtTime(amp, tt + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, tt + 0.28);
        o.connect(g); g.connect(bgmGain);
        o.start(tt); o.stop(tt + 0.32);
      });
    }, 1500));

    // Descending Am melodic motif — eerie but not harsh
    const motif = [220, 196.00, 174.61, 164.81, 174.61, 196.00, 220, 246.94];
    let mi = 0;
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'triangle';
      o.frequency.value = motif[mi++ % motif.length];
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.038, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.9);
      o.connect(g); g.connect(bgmGain); g.connect(rev);
      o.start(t); o.stop(t + 2.1);
    }, 1300));
  }

  // ── Level 2: L5 — Сон Падения — головокружительная целотонная гамма ──────
  // Whole-tone drones + pitch drift + descending swoops + gravity-flip ascents
  function _bgmFalling() {
    const ac = _bgmStart(2.5); if (!ac) return;
    const rev = _bgmReverb(ac, 0.58, 0.52, 2200);

    // Whole-tone: C D E F# — maximally disorienting (no perfect intervals)
    _bgmDetune(ac,  65.41, 6, 'sine',     0.12);  // C2
    _bgmDetune(ac,  73.42, 5, 'sine',     0.09);  // D2
    _bgmDetune(ac,  82.41, 4, 'sine',     0.07);  // E2
    _bgmDetune(ac,  92.50, 5, 'sine',     0.06);  // F#2
    _bgmDetune(ac, 207.65, 7, 'triangle', 0.04);  // G#3

    // Pitch-drifting oscillator — floats up and down slowly
    const driftO = ac.createOscillator(); driftO.type = 'sine'; driftO.frequency.value = 185;
    const driftG = ac.createGain(); driftG.gain.value = 0.04;
    const dLFO   = ac.createOscillator(); dLFO.type = 'sine'; dLFO.frequency.value = 0.025;
    const dLFOG  = ac.createGain(); dLFOG.gain.value = 28;
    dLFO.connect(dLFOG); dLFOG.connect(driftO.frequency);
    driftO.connect(driftG); driftG.connect(bgmGain);
    driftO.start(); dLFO.start();
    bgmNodes.push({ o: driftO }); bgmNodes.push({ o: dLFO });
    _bgmLFO(ac, 0.13, 0.07, bgmGain.gain);

    // Descending swoops — the falling sensation
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime, f0 = 360 + Math.random() * 240;
      const o = ac.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.22, t + 2.4);
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.06, t + 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
      o.connect(g); g.connect(bgmGain); g.connect(rev);
      o.start(t); o.stop(t + 2.6);
    }, 4500));

    // Ascending counter-swoops — gravity-flip sensation
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(92, t);
      o.frequency.exponentialRampToValueAtTime(460, t + 2.0);
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.032, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.1);
      o.connect(g); g.connect(bgmGain); g.connect(rev);
      o.start(t); o.stop(t + 2.2);
    }, 7300));
  }

  // ── Level 3: L1 — Спокойный сон — Cmaj7 эфирный пэд ────────────────────
  // Lush detuned Cmaj7 + gentle filter breath + soft arpeggio
  function _bgmCalm() {
    const ac = _bgmStart(3.0); if (!ac) return;
    const rev = _bgmReverb(ac, 0.44, 0.48, 3200);

    _bgmDetune(ac, 130.81, 4, 'sine',     0.12);  // C3
    _bgmDetune(ac, 164.81, 3, 'sine',     0.09);  // E3
    _bgmDetune(ac, 196.00, 5, 'sine',     0.08);  // G3
    _bgmDetune(ac, 246.94, 3, 'triangle', 0.06);  // B3
    _bgmDetune(ac, 261.63, 4, 'sine',     0.05);  // C4
    _bgmFilterSweep(ac, 261.63, 'triangle', 0.038, 'lowpass', 600, 1400, 0.055, 1.8);
    _bgmLFO(ac, 0.07, 0.050, bgmGain.gain);
    _bgmLFO(ac, 0.18, 0.028, bgmGain.gain);

    // Slow Cmaj7 arpeggio — long soft tails
    const arp = [261.63, 329.63, 392.00, 493.88, 392.00, 329.63, 523.25, 493.88];
    let ai = 0;
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.value = arp[ai++ % arp.length];
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.048, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.4);
      o.connect(g); g.connect(bgmGain); g.connect(rev);
      o.start(t); o.stop(t + 2.6);
    }, 1700));
  }

  // ── Level 4: L2 — Водный сон — глубоководная психоделия ─────────────────
  // Dm + sub-bass + deep filter sweep + whale tones + bubble arp
  function _bgmWater() {
    const ac = _bgmStart(3.5); if (!ac) return;
    const rev = _bgmReverb(ac, 0.72, 0.55, 1100);

    _bgmDrone(ac,   36.71, 'sine',     0.10);   // D1 sub-bass
    _bgmDetune(ac,  73.42, 6, 'sine',  0.14);   // D2
    _bgmDetune(ac,  87.31, 5, 'sine',  0.10);   // F2
    _bgmDetune(ac, 110.00, 4, 'sine',  0.08);   // A2
    _bgmDetune(ac, 146.83, 3, 'sine',  0.065);  // D3
    _bgmDetune(ac, 220.00, 5, 'triangle', 0.04);// A3
    // deep filter sweep — water pressure morphing
    _bgmFilterSweep(ac, 73.42, 'sawtooth', 0.04, 'lowpass', 280, 520, 0.028, 4.5);
    _bgmLFO(ac, 0.050, 0.07, bgmGain.gain);
    _bgmLFO(ac, 0.130, 0.04, bgmGain.gain);

    // Whale-like long pitch glides
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      const base = [146.83, 174.61, 220, 293.66][Math.floor(Math.random() * 4)];
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(base * 0.96, t);
      o.frequency.linearRampToValueAtTime(base * 1.04, t + 3.2);
      o.frequency.linearRampToValueAtTime(base, t + 5.5);
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.058, t + 0.9);
      g.gain.exponentialRampToValueAtTime(0.001, t + 5.8);
      o.connect(g); g.connect(bgmGain); g.connect(rev);
      o.start(t); o.stop(t + 6.0);
    }, 5800));

    // Bubble arp — Dm notes
    const bubbles = [293.66, 349.23, 440, 587.33, 440, 349.23, 293.66, 220];
    let bi = 0;
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.value = bubbles[bi++ % bubbles.length];
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.038, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.7);
      o.connect(g); g.connect(bgmGain); g.connect(rev);
      o.start(t); o.stop(t + 1.9);
    }, 920));
  }

  // ── Level 5: L6 — Горизонтальный сон — невесомость и пространство ────────
  // Fm detuned pads + long delay + wide bandpass + spatial melody + low pulse
  function _bgmHorizontal() {
    const ac = _bgmStart(3.0); if (!ac) return;
    const rev = _bgmReverb(ac, 0.90, 0.58, 2000);

    _bgmDetune(ac,  87.31, 5, 'sine',     0.13);   // F2
    _bgmDetune(ac, 103.83, 4, 'sine',     0.10);   // Ab2
    _bgmDetune(ac, 130.81, 6, 'sine',     0.08);   // C3
    _bgmDetune(ac, 174.61, 4, 'triangle', 0.065);  // F3
    _bgmDetune(ac, 261.63, 5, 'triangle', 0.038);  // C4
    _bgmFilterSweep(ac, 174.61, 'sawtooth', 0.038, 'bandpass', 500, 1400, 0.042, 3.0);
    _bgmLFO(ac, 0.055, 0.06, bgmGain.gain);
    _bgmLFO(ac, 0.160, 0.03, bgmGain.gain);

    // Floating spatial melody — long sustained notes with slight pitch drift
    const space = [174.61, 196.00, 220.00, 261.63, 220.00, 246.94, 196.00, 174.61];
    let si = 0;
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime, freq = space[si++ % space.length];
      const o = ac.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(freq, t);
      o.frequency.linearRampToValueAtTime(freq * (0.99 + Math.random() * 0.02), t + 2.8);
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.042, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
      o.connect(g); g.connect(bgmGain); g.connect(rev);
      o.start(t); o.stop(t + 3.2);
    }, 1450));

    // Deep F1 pulse — gravity shift pulse
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 43.65;
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.065, t + 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
      o.connect(g); g.connect(bgmGain);
      o.start(t); o.stop(t + 3.7);
    }, 4200));
  }

  function playBGM(levelIndex) {
    if (bgmCurrentLevel === levelIndex && bgmGain) return;
    stopBGM();
    bgmCurrentLevel = levelIndex;
    switch (levelIndex) {
      case 0: _bgmForest();     break;  // L3 — Ломаный сон
      case 1: _bgmNightmare();  break;  // L4 — Кошмар
      case 2: _bgmFalling();    break;  // L5 — Сон Падения
      case 3: _bgmCalm();       break;  // L1 — Спокойный сон
      case 4: _bgmWater();      break;  // L2 — Водный сон
      case 5: _bgmHorizontal(); break;  // L6 — Горизонтальный
    }
  }

  // ─────────── CUTSCENE MUSIC ───────────

  // ─────────── INTRO CUTSCENE MUSIC ───────────

  function startIntroMusic() {
    if (introMaster) return;
    const ac = getCtx(); if (!ac) return;
    const now = ac.currentTime;

    introMaster = ac.createGain();
    introMaster.gain.value = 0;
    introMaster.gain.linearRampToValueAtTime(0.45, now + 2.5);

    const lpf = ac.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 1200; lpf.Q.value = 0.6;
    introMaster.connect(lpf); lpf.connect(cutsceneBus);

    function oscI(freq, type, gain) {
      const o = ac.createOscillator(); o.type = type; o.frequency.value = freq;
      const g = ac.createGain(); g.gain.value = gain;
      o.connect(g); g.connect(introMaster);
      o.start(now); introNodes.push({ o });
    }

    oscI(55.00,  'sine',     0.13);
    oscI(82.41,  'sine',     0.09);
    oscI(110.00, 'sine',     0.06);
    oscI(220.00, 'triangle', 0.04);

    const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.06;
    const lfoG = ac.createGain(); lfoG.gain.value = 0.04;
    lfo.connect(lfoG); lfoG.connect(introMaster.gain);
    lfo.start(now); introNodes.push({ o: lfo });

    const mbNotes = [440, 523.25, 659.25, 880, 659.25, 523.25];
    let ni = 0;
    introTimers.push(setInterval(() => {
      if (!introMaster) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'triangle';
      o.frequency.value = mbNotes[ni++ % mbNotes.length];
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.042, t + 0.025);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      o.connect(g); g.connect(introMaster);
      o.start(t); o.stop(t + 1.5);
    }, 1500));
  }

  function stopIntroMusic() {
    if (!introMaster || !ctx) return;
    const ac = ctx;
    const now = ac.currentTime;
    introTimers.forEach(id => { clearInterval(id); clearTimeout(id); });
    introTimers = [];
    introMaster.gain.cancelScheduledValues(now);
    introMaster.gain.setValueAtTime(introMaster.gain.value, now);
    introMaster.gain.linearRampToValueAtTime(0, now + 0.8);
    const mRef = introMaster; const nRef = introNodes;
    introMaster = null; introNodes = [];
    setTimeout(() => {
      nRef.forEach(n => { try { n.o && n.o.stop(); } catch (e) {} });
      try { mRef.disconnect(); } catch (e) {}
    }, 1000);
  }

  function startCutsceneMusic() {
    if (cutsceneMaster) return;
    const ac = getCtx(); if (!ac) return;
    const now = ac.currentTime;

    cutsceneMaster = ac.createGain();
    cutsceneMaster.gain.value = 0;
    cutsceneMaster.gain.linearRampToValueAtTime(0.55, now + 2.2);

    const lpf = ac.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 900; lpf.Q.value = 0.7;
    cutsceneMaster.connect(lpf); lpf.connect(cutsceneBus);

    function osc(freq, type, gain) {
      const o = ac.createOscillator(); o.type = type; o.frequency.value = freq;
      const g = ac.createGain(); g.gain.value = gain;
      o.connect(g); g.connect(cutsceneMaster);
      o.start(now);
      cutsceneNodes.push({ o, g });
    }

    osc(55,    'sawtooth', 0.10);
    osc(55.7,  'sawtooth', 0.10);
    osc(58.3,  'triangle', 0.05);
    osc(82.5,  'sine',     0.07);
    osc(220,   'sine',     0.022);
    osc(440.7, 'sine',     0.012);

    const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.25;
    const lfoG = ac.createGain(); lfoG.gain.value = 0.05;
    lfo.connect(lfoG); lfoG.connect(cutsceneMaster.gain);
    lfo.start(now);
    cutsceneNodes.push({ o: lfo });

    heartbeatInterval = setInterval(() => {
      if (!cutsceneMaster) return;
      const t = ac.currentTime;
      [[0, 0.5], [0.16, 0.32]].forEach(([d, amp]) => {
        const o = ac.createOscillator(); o.type = 'sine';
        const tt = t + d;
        o.frequency.setValueAtTime(85, tt);
        o.frequency.exponentialRampToValueAtTime(28, tt + 0.18);
        const g = ac.createGain(); g.gain.value = 0;
        g.gain.linearRampToValueAtTime(amp, tt + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, tt + 0.34);
        o.connect(g); g.connect(cutsceneMaster);
        o.start(tt); o.stop(tt + 0.4);
      });
    }, 1400);

    stingerTimeout = setTimeout(() => {
      if (!cutsceneMaster) return;
      const t = ac.currentTime;
      [330, 349, 415].forEach((f, i) => {
        const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const g = ac.createGain(); g.gain.value = 0;
        g.gain.linearRampToValueAtTime(0.06, t + 0.1 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
        o.connect(g); g.connect(cutsceneMaster);
        o.start(t); o.stop(t + 2.7);
      });
    }, 6800);
  }

  function stopCutsceneMusic() {
    if (!cutsceneMaster || !ctx) return;
    const ac = ctx;
    const now = ac.currentTime;
    if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
    if (stingerTimeout)    { clearTimeout(stingerTimeout);    stingerTimeout = null; }
    cutsceneMaster.gain.cancelScheduledValues(now);
    cutsceneMaster.gain.setValueAtTime(cutsceneMaster.gain.value, now);
    cutsceneMaster.gain.linearRampToValueAtTime(0, now + 0.7);
    const masterRef = cutsceneMaster;
    const nodesRef  = cutsceneNodes;
    cutsceneMaster = null;
    cutsceneNodes = [];
    setTimeout(() => {
      nodesRef.forEach(n => { try { n.o && n.o.stop(); } catch (e) {} });
      try { masterRef.disconnect(); } catch (e) {}
    }, 900);
  }

  // create AudioContext on the first real user gesture (autoplay policy)
  const _wakeUp = () => {
    getCtx();
    window.removeEventListener('keydown',    _wakeUp);
    window.removeEventListener('mousedown',  _wakeUp);
    window.removeEventListener('touchstart', _wakeUp);
  };
  window.addEventListener('keydown',    _wakeUp);
  window.addEventListener('mousedown',  _wakeUp);
  window.addEventListener('touchstart', _wakeUp);

  // Intro cutscene music — currently no dedicated track, reuse cutscene music.
  function startIntroMusic() { startCutsceneMusic(); }
  function stopIntroMusic()  { stopCutsceneMusic();  }

  return {
    // SFX
    jump, doubleJump, land, die, checkpoint, collectShard,
    portalActive, portalEnter, gravityFlip, springBoing, batFlap, parrotLaugh,
    // BGM
    playBGM, stopBGM,
    // Intro cutscene
    startIntroMusic, stopIntroMusic,
    // Cutscene
    startCutsceneMusic, stopCutsceneMusic,
    // Intro cutscene
    startIntroMusic, stopIntroMusic,
  };
})();
