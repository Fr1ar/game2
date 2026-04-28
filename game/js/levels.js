// ─────────────────────────────────────────────────────────────
// Level 1  "Спокойный сон"  — tutorial, normal physics
// ─────────────────────────────────────────────────────────────
const L1 = {
  name: 'Спокойный сон',
  width: 2560, height: 720,
  bgColors: ['#0a0a18', '#0e0e24', '#141030'],
  playerStart: { x: 80, y: 580 },
  deathY: 730,
  physics: {},  // default

  platforms: [
    new Platform(0,    660, 2560, 60),
    new Platform(150,  560, 200, 18),
    new Platform(400,  480, 160, 18),
    new Platform(620,  540, 180, 18),
    new Platform(820,  460, 160, 18),
    new Platform(1010, 380, 140, 18),
    new Platform(1180, 460, 200, 18),  // before checkpoint
    new Platform(1420, 380, 160, 18),
    new Platform(1600, 300, 140, 18),
    new Platform(1760, 380, 160, 18),
    new Platform(1920, 300, 140, 18),
    new Platform(2060, 220, 120, 18),
    new Platform(2200, 560, 200, 18),
    new Platform(2380, 480, 180, 18),
  ],

  shards: [
    new Shard(412, 450),   // easy — on platform at y=480
    new Shard(1612, 270),  // medium — requires 2 jumps to climb
    new Shard(2072, 190),  // hard — highest point
  ],

  hazards: [],

  checkpoints: [
    new Checkpoint(1230, 422),
  ],

  portal: new Portal(2390, 408),
};

// ─────────────────────────────────────────────────────────────
// Level 2  "Водный сон"  — low gravity, slow & floaty
// ─────────────────────────────────────────────────────────────
const L2 = {
  name: 'Водный сон',
  width: 2560, height: 720,
  bgColors: ['#020818', '#040e1a', '#061428'],
  playerStart: { x: 80, y: 580 },
  deathY: 730,
  physics: {
    gravity:   0.20,
    jumpForce: 9,
    djForce:   8,
    moveSpeed: 3.0,
    friction:  0.90,
  },

  platforms: [
    new Platform(0,    660, 2560, 60, '#0a1830'),
    new Platform(90,   540, 160, 18, '#102440'),
    new Platform(290,  440, 140, 18, '#102440'),
    new Platform(110,  340, 120, 18, '#102440'),
    new Platform(320,  250, 140, 18, '#102440'),
    new Platform(500,  350, 160, 18, '#102440'),
    new Platform(680,  250, 140, 18, '#102440'),
    new Platform(860,  170, 130, 18, '#102440'),
    new Platform(1020, 270, 140, 18, '#102440'),
    new Platform(1180, 370, 160, 18, '#102440'),
    new Platform(1340, 270, 140, 18, '#102440'),
    new Platform(1500, 180, 120, 18, '#102440'),
    new Platform(1650, 290, 140, 18, '#102440'),
    new Platform(1820, 400, 160, 18, '#102440'),
    new Platform(2000, 310, 140, 18, '#102440'),
    new Platform(2180, 430, 160, 18, '#102440'),
    new Platform(2360, 530, 180, 18, '#102440'),
  ],

  shards: [
    new Shard(302, 410),   // easy — on 2nd platform
    new Shard(872, 140),   // medium — near top of vertical climb
    new Shard(1512, 150),  // hard — highest ceiling reach
  ],

  hazards: [],

  checkpoints: [
    new Checkpoint(1025, 232),
  ],

  portal: new Portal(2374, 458),
};

// ─────────────────────────────────────────────────────────────
// Level 3  "Ломаный сон"  — disappearing platforms
// ─────────────────────────────────────────────────────────────
const L3 = {
  name: 'Ломаный сон',
  width: 3200, height: 720,
  bgColors: ['#0f0810', '#180d18', '#200a1c'],
  playerStart: { x: 80, y: 580 },
  deathY: 730,
  physics: {},

  platforms: [
    new Platform(0,    660, 3200, 60, '#1a0a20'),
    // solid rest spots
    new Platform(0,    560, 180, 18, '#221030'),
    new Platform(1080, 560, 200, 18, '#221030'),  // checkpoint island
    new Platform(2160, 560, 180, 18, '#221030'),
    new Platform(3040, 520, 180, 18, '#221030'),  // portal island

    // FadePlatforms: section 1 — before checkpoint
    new FadePlatform(230,  500, 110, 18),
    new FadePlatform(380,  430, 110, 18),
    new FadePlatform(520,  360, 100, 18),
    new FadePlatform(660,  430, 110, 18),
    new FadePlatform(800,  350, 100, 18),
    new FadePlatform(930,  280, 100, 18),

    // FadePlatforms: section 2 — after checkpoint
    new FadePlatform(1340, 490, 110, 18),
    new FadePlatform(1490, 410, 110, 18),
    new FadePlatform(1630, 330, 100, 18),
    new FadePlatform(1760, 410, 110, 18),
    new FadePlatform(1890, 330, 100, 18),
    new FadePlatform(2020, 250, 100, 18),

    // FadePlatforms: section 3 — final stretch
    new FadePlatform(2390, 490, 110, 18),
    new FadePlatform(2540, 400, 100, 18),
    new FadePlatform(2680, 320, 100, 18),
    new FadePlatform(2820, 400, 110, 18),
    new FadePlatform(2950, 480, 110, 18),
  ],

  shards: [
    new Shard(392, 400),   // on fade platform — section 1
    new Shard(942, 250),   // top of climb — section 1
    new Shard(2032, 220),  // top of climb — section 2
  ],

  hazards: [],

  checkpoints: [
    new Checkpoint(1120, 522),
  ],

  portal: new Portal(3058, 448),
};

// ─────────────────────────────────────────────────────────────
// Level 4  "Кошмар"  — chasing entity
// ─────────────────────────────────────────────────────────────
const L4 = {
  name: 'Кошмар',
  width: 3840, height: 720,
  bgColors: ['#0a0202', '#180404', '#1e0808'],
  playerStart: { x: 100, y: 590 },
  deathY: 730,
  physics: { moveSpeed: 5.2 },  // slightly faster player

  chaser: { x: 20, y: 580, startDelay: 120 },  // spawn behind player, on ground; freeze 2s before chasing

  platforms: [
    // ground — mostly continuous but with some gaps
    new Platform(0,    660, 800,  60, '#200808'),
    new Platform(860,  660, 800,  60, '#200808'),
    new Platform(1720, 660, 800,  60, '#200808'),
    new Platform(2580, 660, 800,  60, '#200808'),
    new Platform(3440, 660, 400,  60, '#200808'),

    // gap bridges
    new Platform(780,  610, 120, 18, '#2a1010'),
    new Platform(1640, 600, 120, 18, '#2a1010'),
    new Platform(2500, 600, 120, 18, '#2a1010'),
    new Platform(3360, 600, 120, 18, '#2a1010'),

    // mid platforms
    new Platform(180,  560, 160, 18, '#2a1010'),
    new Platform(380,  480, 140, 18, '#2a1010'),
    new Platform(560,  560, 160, 18, '#2a1010'),
    new Platform(880,  500, 160, 18, '#2a1010'),
    new Platform(1060, 420, 140, 18, '#2a1010'),
    new Platform(1240, 500, 160, 18, '#2a1010'),
    new Platform(1440, 560, 160, 18, '#2a1010'),
    new Platform(1740, 520, 160, 18, '#2a1010'),
    new Platform(1920, 440, 140, 18, '#2a1010'),
    new Platform(2100, 520, 160, 18, '#2a1010'),
    new Platform(2300, 440, 140, 18, '#2a1010'),
    new Platform(2480, 520, 160, 18, '#2a1010'),
    new Platform(2760, 500, 160, 18, '#2a1010'),
    new Platform(2960, 420, 140, 18, '#2a1010'),
    new Platform(3140, 340, 120, 18, '#2a1010'),
    new Platform(3460, 500, 160, 18, '#2a1010'),
    new Platform(3650, 580, 190, 18, '#2a1010'),
  ],

  shards: [
    new Shard(392, 450),   // easy — early level
    new Shard(2312, 410),  // mid level, on elevated platform
    new Shard(3152, 310),  // hard — highest point near end
  ],

  hazards: [],

  checkpoints: [
    new Checkpoint(1780, 482),
  ],

  portal: new Portal(3660, 508),
};

// ─────────────────────────────────────────────────────────────
// Level 5  "Сон Падения"  — gravity inversion toggle (↓/S)
// ─────────────────────────────────────────────────────────────
const L5 = {
  name: 'Сон Падения',
  width: 2560, height: 720,
  bgColors: ['#04020e', '#080418', '#0c0624'],
  playerStart: { x: 80, y: 580 },
  deathY: 750,
  deathMinY: -50,   // fall off top
  physics: {},
  gravityToggle: true,  // Down/S toggles gravity

  platforms: [
    // ceiling — player lands on bottom when gravity inverted
    new Platform(0,    0,   2560, 60, '#1a0a30'),
    // floor
    new Platform(0,    660, 2560, 60, '#1a0a30'),

    // floor-level stepping stones (normal gravity navigation)
    new Platform(100,  560, 160, 18, '#1e1040'),
    new Platform(300,  480, 140, 18, '#1e1040'),
    new Platform(500,  560, 160, 18, '#1e1040'),
    new Platform(700,  480, 140, 18, '#1e1040'),
    new Platform(900,  560, 180, 18, '#1e1040'),   // checkpoint
    new Platform(1100, 480, 140, 18, '#1e1040'),
    new Platform(1300, 560, 160, 18, '#1e1040'),
    new Platform(1500, 480, 140, 18, '#1e1040'),
    new Platform(1700, 560, 160, 18, '#1e1040'),
    new Platform(1900, 480, 140, 18, '#1e1040'),
    new Platform(2100, 560, 200, 18, '#1e1040'),   // portal island (floor)

    // ceiling-level stepping stones (inverted gravity navigation)
    new Platform(200,  60,  140, 18, '#2a1060'),
    new Platform(380,  120, 130, 18, '#2a1060'),
    new Platform(560,  60,  130, 18, '#2a1060'),
    new Platform(740,  120, 130, 18, '#2a1060'),
    new Platform(920,  60,  130, 18, '#2a1060'),
    new Platform(1100, 120, 130, 18, '#2a1060'),
    new Platform(1280, 60,  130, 18, '#2a1060'),
    new Platform(1460, 120, 130, 18, '#2a1060'),
    new Platform(1640, 60,  130, 18, '#2a1060'),
    new Platform(1820, 120, 130, 18, '#2a1060'),
    new Platform(2000, 60,  130, 18, '#2a1060'),
  ],

  shards: [
    // all shards near ceiling — only reachable with inverted gravity
    new Shard(392,  140),   // ceiling zone — easy (low ceiling platform)
    new Shard(932,  78),    // ceiling zone — medium
    new Shard(2012, 78),    // ceiling zone — hard (far end)
  ],

  hazards: [],

  checkpoints: [
    new Checkpoint(940, 522),
  ],

  portal: new Portal(2112, 488),
};

const LEVELS = [L1, L2, L3, L4, L5];
