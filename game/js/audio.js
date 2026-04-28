const SoundFX = (() => {
  let ctx = null;
  let masterBus, sfxBus, bgmBus, cutsceneBus;

  // ===== bgm state =====
  let bgmGain = null;
  let bgmNodes = [];
  let bgmTimers = [];
  let bgmCurrentLevel = -1;

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
      bgmBus      = ctx.createGain(); bgmBus.gain.value      = 0; bgmBus.connect(masterBus);
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

  function _bgmStart(fadeIn = 1.5) {
    const ac = getCtx(); if (!ac) return null;
    bgmGain = ac.createGain();
    bgmGain.gain.value = 0;
    bgmGain.gain.linearRampToValueAtTime(1, ac.currentTime + fadeIn);
    bgmGain.connect(bgmBus);
    return ac;
  }

  function _bgmDrone(ac, freq, type, gain) {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = gain;
    o.connect(g); g.connect(bgmGain);
    o.start();
    bgmNodes.push({ o });
  }

  function _bgmLFO(ac, freq, depth, target) {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = depth;
    o.connect(g); g.connect(target);
    o.start();
    bgmNodes.push({ o });
  }

  function stopBGM() {
    if (!bgmGain || !ctx) return;
    const ac = ctx;
    const now = ac.currentTime;
    bgmTimers.forEach(t => { clearInterval(t); clearTimeout(t); });
    bgmTimers = [];
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
    bgmGain.gain.linearRampToValueAtTime(0, now + 0.6);
    const gRef = bgmGain;
    const nRef = bgmNodes;
    bgmGain = null; bgmNodes = []; bgmCurrentLevel = -1;
    setTimeout(() => {
      nRef.forEach(n => { try { n.o && n.o.stop(); } catch (e) {} });
      try { gRef.disconnect(); } catch (e) {}
    }, 800);
  }

  // L1 — calm major pad
  function _bgmCalm() {
    const ac = _bgmStart(); if (!ac) return;
    _bgmDrone(ac, 130.81, 'sine',     0.18);  // C3
    _bgmDrone(ac, 196.00, 'sine',     0.13);  // G3
    _bgmDrone(ac, 261.63, 'sine',     0.10);  // C4
    _bgmDrone(ac, 392.00, 'triangle', 0.05);  // G4
    _bgmLFO(ac, 0.12, 0.06, bgmGain.gain);
  }

  // L2 — water: floating Dm9 with bubble arp
  function _bgmWater() {
    const ac = _bgmStart(); if (!ac) return;
    _bgmDrone(ac, 146.83, 'sine', 0.16);  // D3
    _bgmDrone(ac, 220.00, 'sine', 0.10);  // A3
    _bgmDrone(ac, 261.63, 'sine', 0.07);  // C4
    _bgmLFO(ac, 0.10, 0.10, bgmGain.gain);
    const notes = [293.66, 349.23, 440, 587.33, 440, 349.23];
    let i = 0;
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.value = notes[i++ % notes.length];
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.06, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      o.connect(g); g.connect(bgmGain);
      o.start(t); o.stop(t + 1.6);
    }, 850));
  }

  // L3 — broken: minor drone with dropouts and glitches
  function _bgmGlitch() {
    const ac = _bgmStart(); if (!ac) return;
    _bgmDrone(ac, 110.00, 'sawtooth', 0.07);  // A2
    _bgmDrone(ac, 130.81, 'sine',     0.10);  // C3
    _bgmDrone(ac, 164.81, 'sine',     0.08);  // E3
    _bgmDrone(ac, 220.00, 'triangle', 0.05);  // A3
    // gain dropouts
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      bgmGain.gain.cancelScheduledValues(t);
      bgmGain.gain.setValueAtTime(bgmGain.gain.value, t);
      bgmGain.gain.linearRampToValueAtTime(0, t + 0.04);
      bgmGain.gain.linearRampToValueAtTime(1, t + 0.20);
    }, 4000));
    // glitch ticks
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'square';
      o.frequency.value = 800 + Math.random() * 1400;
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.04, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      o.connect(g); g.connect(bgmGain);
      o.start(t); o.stop(t + 0.06);
    }, 2400));
  }

  // L4 — nightmare: dissonant low + heartbeat
  function _bgmNightmare() {
    const ac = _bgmStart(); if (!ac) return;
    _bgmDrone(ac, 55.00, 'sawtooth', 0.10);
    _bgmDrone(ac, 55.7,  'sawtooth', 0.10);
    _bgmDrone(ac, 58.3,  'triangle', 0.05);
    _bgmDrone(ac, 82.5,  'sine',     0.06);
    _bgmDrone(ac, 220,   'sine',     0.022);
    _bgmLFO(ac, 0.30, 0.05, bgmGain.gain);
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      [[0, 0.45], [0.14, 0.28]].forEach(([d, amp]) => {
        const o = ac.createOscillator(); o.type = 'sine';
        const tt = t + d;
        o.frequency.setValueAtTime(85, tt);
        o.frequency.exponentialRampToValueAtTime(28, tt + 0.18);
        const g = ac.createGain(); g.gain.value = 0;
        g.gain.linearRampToValueAtTime(amp, tt + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, tt + 0.32);
        o.connect(g); g.connect(bgmGain);
        o.start(tt); o.stop(tt + 0.4);
      });
    }, 1100));
  }

  // L5 — falling: whole-tone disorienting pad with descending swooshes
  function _bgmFalling() {
    const ac = _bgmStart(); if (!ac) return;
    _bgmDrone(ac,  65.41, 'sine', 0.13);  // C2
    _bgmDrone(ac,  73.42, 'sine', 0.10);  // D2
    _bgmDrone(ac,  92.50, 'sine', 0.08);  // F#2
    _bgmDrone(ac, 207.65, 'sine', 0.04);  // G#3
    _bgmLFO(ac, 0.15, 0.08, bgmGain.gain);
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(440, t);
      o.frequency.exponentialRampToValueAtTime(110, t + 1.5);
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.05, t + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
      o.connect(g); g.connect(bgmGain);
      o.start(t); o.stop(t + 1.7);
    }, 4400));
  }

  // L6 — horizontal: slow ethereal with sideways swoosh pulses
  function _bgmHorizontal() {
    const ac = _bgmStart(); if (!ac) return;
    _bgmDrone(ac,  87.31, 'sine',     0.14);  // F2
    _bgmDrone(ac, 130.81, 'sine',     0.10);  // C3
    _bgmDrone(ac, 174.61, 'sine',     0.07);  // F3
    _bgmDrone(ac, 261.63, 'triangle', 0.04);  // C4
    _bgmLFO(ac, 0.09, 0.07, bgmGain.gain);
    const notes = [174.61, 196.00, 220.00, 261.63, 220.00, 196.00];
    let ni = 0;
    bgmTimers.push(setInterval(() => {
      if (!bgmGain) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(); o.type = 'triangle';
      o.frequency.value = notes[ni++ % notes.length];
      const g = ac.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.05, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      o.connect(g); g.connect(bgmGain);
      o.start(t); o.stop(t + 2.0);
    }, 1200));
  }

  function playBGM(levelIndex) {
    if (bgmCurrentLevel === levelIndex && bgmGain) return;
    stopBGM();
    bgmCurrentLevel = levelIndex;
    switch (levelIndex) {
      case 0: _bgmCalm();      break;
      case 1: _bgmWater();     break;
      case 2: _bgmGlitch();    break;
      case 3: _bgmNightmare(); break;
      case 4: _bgmFalling();    break;
      case 5: _bgmHorizontal(); break;
    }
  }

  // ─────────── CUTSCENE MUSIC ───────────

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

  return {
    // SFX
    jump, doubleJump, land, die, checkpoint, collectShard,
    portalActive, portalEnter, gravityFlip, springBoing,
    // BGM
    playBGM, stopBGM,
    // Cutscene
    startCutsceneMusic, stopCutsceneMusic,
  };
})();
