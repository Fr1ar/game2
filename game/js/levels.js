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
    // floor split into sections — gaps at 280-380, 590-680, 1050-1160, 1760-1870, 2120-2200
    new Platform(0,    660, 280, 60),
    new Platform(380,  660, 210, 60),
    new Platform(680,  660, 370, 60),
    new Platform(1160, 660, 600, 60),
    new Platform(1870, 660, 250, 60),
    new Platform(2200, 660, 360, 60),

    // mid platforms (unchanged)
    new Platform(150,  560, 200, 18),
    new Platform(400,  480, 160, 18),
    new Platform(620,  540, 180, 18),
    new Platform(820,  460, 160, 18),
    new Platform(1010, 380, 140, 18),
    new Platform(1180, 460, 200, 18),
    new Platform(1420, 380, 160, 18),
    new Platform(1600, 300, 140, 18),
    new Platform(1760, 380, 160, 18),
    new Platform(1920, 300, 140, 18),
    new Platform(2060, 220, 120, 18),
    new Platform(2200, 560, 200, 18),
    new Platform(2380, 480, 180, 18),
    // secret platform — only reachable via teleport portal
    new Platform(1278, 80, 130, 18, '#1a3a60'),
  ],

  shards: [
    new Shard(412,  450),   // easy — on platform at y=480
    new Shard(1612, 270),   // medium — requires 2 jumps to climb
    new Shard(1293, 48),    // hard — secret platform, only via portal
  ],

  hazards: [
    // spike → pit 2: zone 1 pushes right into spike(475) then off edge at 590
    new Hazard(475,  636, 80, 24),
    // spike → pit 3: zone 2 pushes left into spike(1175) then back into pit at 1160
    new Hazard(1175, 636, 80, 24),
    // spike → pit 5: zone 3 pushes right into spike(1970) then off edge at 2120
    new Hazard(1970, 636, 80, 24),
  ],

  checkpoints: [
    new Checkpoint(1230, 422),
  ],

  portal: new Portal(2390, 408),

  // Currents aligned to push player into spikes then pits
  currents: [
    new CurrentZone(380,  590,  0.95),   // → spike(475) → pit2(590)
    new CurrentZone(1160, 1450, -0.95),  // ← spike(1175) ← pit3(1160)
    new CurrentZone(1870, 2120,  0.95),  // → spike(1970) → pit5(2120)
    new CurrentZone(2050, 2430,  0.95),  // rightward near end
  ],

  // Gold mini-portal: stands on platform y=380, teleports to secret platform y=80
  teleportPortals: [
    new TeleportPortal(1030, 308, 1290, 44),
  ],
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
    // solid floor — no gaps (spring must not fall into pits)
    new Platform(0, 660, 3840, 60, '#200808'),

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
    // no platforms in spring shard zone (x≈2300) for clean vertical corridor
    new Platform(2480, 520, 160, 18, '#2a1010'),
    new Platform(2760, 500, 160, 18, '#2a1010'),
    new Platform(2960, 420, 140, 18, '#2a1010'),
    new Platform(3140, 340, 120, 18, '#2a1010'),
    new Platform(3460, 500, 160, 18, '#2a1010'),
    new Platform(3650, 580, 190, 18, '#2a1010'),
  ],

  shards: [
    new Shard(392,  450),  // easy — early level
    new Shard(2312, 300),  // hard — floating high, only via spring
    new Shard(3152, 310),  // end — near portal
  ],

  spring: new SpringJumper(2260, 630),

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

// ─────────────────────────────────────────────────────────────
// Level 6  "Горизонтальный сон"  — horizontal gravity
// ←/→ flip active wall, ↑/↓ move along wall, Space = jump
// ─────────────────────────────────────────────────────────────
const L6 = {
  name: 'Горизонтальный сон',
  width: 1280, height: 2700,
  bgColors: ['#040c18', '#081424', '#0c1c30'],
  playerStart: { x: 28, y: 100 },
  deathY: 2760, deathMinY: -60,
  physics: { gravity: 0.35, jumpForce: 18, djForce: 15, moveSpeed: 4.5, friction: 0.88 },
  horizontalGravity: true, initialGravityDir: -1,

  platforms: [
    // boundary walls (left=floor at gravityDir=-1, right=floor at gravityDir=+1)
    new Platform(0,    0,    28,   2700, '#1a3a28'),  // left wall
    new Platform(1252, 0,    28,   2700, '#3a2a1a'),  // right wall
    new Platform(0,    -60,  1280, 60,   '#0a1020'),  // top boundary
    new Platform(0,    2700, 1280, 60,   '#0a1020'),  // bottom boundary

    // Column A — gap y=820-960
    new Platform(420,  660, 28, 160, '#1a2a3a'),
    new Platform(420,  960, 28, 300, '#1a2a3a'),

    // Column B — gap y=1000-1150
    new Platform(780,  660, 28, 340, '#1a2a3a'),
    new Platform(780, 1150, 28, 150, '#1a2a3a'),

    // Column C — gap y=1520-1680
    new Platform(350, 1340, 28, 180, '#1a2a3a'),
    new Platform(350, 1680, 28, 280, '#1a2a3a'),

    // Column D — gap y=1460-1620
    new Platform(820, 1340, 28, 120, '#1a2a3a'),
    new Platform(820, 1620, 28, 340, '#1a2a3a'),

    // Column E — gap y=2200-2360
    new Platform(280, 2040, 28, 160, '#1a2a3a'),
    new Platform(280, 2360, 28, 220, '#1a2a3a'),

    // Column F — gap y=2140-2300
    new Platform(620, 2040, 28, 100, '#1a2a3a'),
    new Platform(620, 2300, 28, 280, '#1a2a3a'),

    // Column G — gap y=2080-2240
    new Platform(960, 2040, 28,  40, '#1a2a3a'),
    new Platform(960, 2240, 28, 340, '#1a2a3a'),
  ],

  shards: [
    new Shard(30,   286),   // left wall, early — easy
    new Shard(1228, 1058),  // right wall, mid  — medium
    new Shard(30,   2204),  // left wall, late  — hard
  ],

  hazards: [],

  checkpoints: [
    Object.assign(new Checkpoint(28, 1100), { drawAngle: Math.PI / 2 }),
    Object.assign(new Checkpoint(28, 2020), { drawAngle: Math.PI / 2 }),
  ],

  portal: new Portal(1204, 2514),
};

const LEVELS = [L1, L2, L3, L4, L5, L6];
