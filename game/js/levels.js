// ─────────────────────────────────────────────────────────────
// Level 1  "Спокойный сон"  — 6 gaps, 3 checkpoints, 5 currents
// ─────────────────────────────────────────────────────────────
const L1 = {
  name: 'Спокойный сон',
  width: 3328, height: 720,
  bgColors: ['#0a0a18', '#0e0e24', '#141030'],
  playerStart: { x: 80, y: 580 },
  deathY: 730,
  physics: {},

  platforms: [
    // ── floor — gaps at 260-410, 580-730, 1060-1210, 1750-1920, 2130-2280
    new Platform(0,    660, 260, 60),
    new Platform(410,  660, 170, 60),
    new Platform(730,  660, 330, 60),
    new Platform(1210, 660, 540, 60),
    new Platform(1920, 660, 210, 60),
    new Platform(2280, 660, 280, 60),

    // ── section 1 (x=0–580): gentle rise
    new Platform(90,   560, 150, 18),
    new Platform(310,  460, 90,  18),   // narrow over gap1
    new Platform(470,  530, 110, 18),   // checkpoint 1 island

    // ── section 2 (x=580–1060): tricky over gaps
    new Platform(590,  400, 90,  18),   // narrow over gap2 — shard 1
    new Platform(760,  490, 110, 18),
    new Platform(910,  380, 90,  18),
    new Platform(1050, 290, 80,  18),   // high narrow — teleport portal

    // ── section 3 (x=1060–1750): checkpoint + high climb
    new Platform(1220, 460, 190, 18),
    new Platform(1470, 370, 100, 18),   // checkpoint 2 island
    new Platform(1620, 250, 110, 18),   // very high
    new Platform(1720, 360, 90,  18),   // narrow over gap4

    // ── section 4 (x=1750–2560): endgame push
    new Platform(1890, 460, 110, 18),
    new Platform(2050, 360, 90,  18),   // narrow over gap5
    new Platform(2230, 460, 120, 18),
    new Platform(2370, 370, 100, 18),
    new Platform(2440, 270, 110, 18),   // high challenge platform

    // ── section 5 (x=2560–3328): final stretch — gap6 deadly
    new Platform(2560, 660, 170, 60),   // floor 2560-2730
    new Platform(2890, 660, 438, 60),   // floor 2890-3328
    new Platform(2570, 490, 110, 18),
    new Platform(2700, 380, 90,  18),   // narrow over gap6 (deadly)
    new Platform(2870, 470, 120, 18),   // checkpoint 3 landing
    new Platform(3000, 360, 100, 18),
    new Platform(3100, 250, 110, 18),   // portal platform
    new Platform(3220, 370, 90,  18),

    // ── secret — teleport only
    new Platform(1278, 80, 130, 18, '#1a3a60'),

    // ── catch platforms — only in SAFE gaps (1, 3, 5)
    new Platform(265,  712, 140, 18, '#0a1428'),
    new Platform(1065, 712, 140, 18, '#0a1428'),
    new Platform(2135, 712, 140, 18, '#0a1428'),
  ],

  shards: [
    new Shard(598,  375),   // section 2 — narrow platform over gap2
    new Shard(2238, 435),   // section 4 — platform x=2230 y=460
    new Shard(3008, 335),   // section 5 — platform before portal
    new Shard(1293, 48),    // secret    — teleport only
  ],

  hazards: [
    new Hazard(440,  636, 70, 24),  // zone1 → spike → gap2
    new Hazard(810,  636, 70, 24),  // zone2 ← spike ← gap2
    new Hazard(1280, 636, 70, 24),  // zone3 ← spike ← gap3
    new Hazard(1990, 636, 70, 24),  // zone4 → spike → gap5
    new Hazard(2660, 636, 60, 24),  // zone5 → spike, before gap6
  ],

  checkpoints: [
    new Checkpoint(510, 490),    // on platform y=530
    new Checkpoint(1510, 330),   // on platform y=370
    new Checkpoint(2910, 430),   // on platform y=470, section 5
  ],

  portal: new Portal(3108, 178),   // on high platform y=250, section 5

  currents: [
    new CurrentZone(410,   580,  1.1),            // → spike(440) → gap2
    new PulsingCurrentZone(730, 1060, -1.1, 270), // ← alternating ← gap2  (~27% level)
    new CurrentZone(1210, 1460, -1.0),            // ← steady ← gap3
    new CurrentZone(1920, 2130,  1.1),            // → spike(1990) → gap5
    new PulsingCurrentZone(2280, 2730, 1.0, 250), // → alternating → gap6  (~75% level)
    new CurrentZone(2890, 3328,  1.0),            // → final push to portal
  ],

  teleportPortals: [
    new TeleportPortal(1050, 218, 1290, 44),   // platform y=290 → secret y=80
  ],
};

// ─────────────────────────────────────────────────────────────
// Level 2  "Водный сон"  — ocean inertia, global wave, 4 sections
// ─────────────────────────────────────────────────────────────
const L2 = {
  name: 'Водный сон',
  width: 2560, height: 720,
  bgColors: ['#010a1a', '#020e22', '#03122e'],
  playerStart: { x: 80, y: 510 },
  deathY: 730,
  isOcean: true,

  // водная физика: максимальная инерция, слабый контроль
  physics: {
    gravity:   0.20,
    jumpForce: 9,
    djForce:   8,
    moveSpeed: 2.0,
    friction:  0.97,
  },

  // глобальная волна: период ~150 кадров, сила ±0.45
  oceanWave: { period: 150, strength: 0.45 },

  // зона глубины: y > 570 (мировые координаты) — усиленная инерция
  depthZone: { startY: 570, friction: 0.97 },

  platforms: [
    // ── дно (видимое)
    new Platform(0, 690, 2560, 30, '#030f1e'),

    // ── Секция 1 (x:0–620) — обучение, но уже уже
    // y555 +185→y370  −175→y545  (точные прыжки с первых шагов)
    new Platform(0,   555, 220, 18, '#0a2535'),   // старт
    new Platform(368, 370, 82,  18, '#0c2d40'),   // +185 — точный одиночный
    new Platform(558, 545, 82,  18, '#0a2535'),   // спуск

    // ── Секция 2 (x:620–1260) — волна, вихрь, пределы одиночного
    // y545 +125→y420  +195→y225  −220→y445  +200→y245
    new Platform(668,  420, 80,  18, '#0c2d40'),
    new Platform(848,  225, 76,  18, '#0d3550'),   // +195, почти максимум
    new Platform(1008, 445, 80,  18, '#0a2535'),
    new Platform(1172, 245, 76,  18, '#0d3550'),   // +200, на пределе

    // ── Секция 3 (x:1260–1860) — двойной вихрь, вертикальный вызов
    // y245 −225→y470  +195→y275  −230→y505  +337→y168 (двойной!)
    new Platform(1298, 470, 82,  18, '#0a2535'),
    new Platform(1462, 275, 76,  18, '#0d3550'),   // +195, точный одиночный
    new Platform(1618, 505, 78,  18, '#0a2535'),
    new Platform(1755, 168, 74,  18, '#0f3d60'),   // +337 — двойной прыжок с y505!

    // ── Секция 4 (x:1860–2560) — глубина, щупальце, финал
    // y168 −435→y603  −55→y658  +270→y388  +196→y192  −192→y384
    new Platform(1838, 603, 82,  18, '#061828'),   // падение в глубину
    new Platform(2005, 658, 100, 18, '#050f1c'),   // у дна — щупальце здесь
    new Platform(2162, 388, 82,  18, '#0a2535'),   // двойной прыжок +270
    new Platform(2352, 192, 130, 18, '#0d3550'),   // высоко — расширена
    new Platform(2502, 580, 80,  18, '#0c2d40'),   // к порталу — ниже для доступности
  ],

  shards: [
    new Shard(399,  344),   // S1 — центр платф.(368,370,82)
    new Shard(1120, 310),   // S2 — в первом вихре (между сек.2 и сек.3)
    new Shard(2078, 630),   // S3 — ближе к правому краю платф.(2005,658,100)
  ],

  hazards: [],

  checkpoints: [
    new Checkpoint(1331, 430),  // 1й — центр платф.(1298,470,82)
    new Checkpoint(2195, 348),  // 2й — центр платф.(2162,388,82), до последней медузы
  ],

  portal: new Portal(2528, 508),   // 580 - 72 (portal h) = 508, sits on lowered platform

  // ── Медузы (4 штуки — сложнее)
  jellies: [
    new Jellyfish(470,  315),   // сек.1 — перед высокой платформой
    new Jellyfish(1025, 345),   // сек.2 — на спуске
    new Jellyfish(1635, 400),   // сек.3 — у нижней перед двойным
    new Jellyfish(2482, 155),   // сек.4 — правый край платф.(2352,192,130)
  ],

  // ── Стаи рыб
  fishSchools: [
    new FishSchool(775,  340, 200, 80),
    new FishSchool(1390, 410, 240, 90),
  ],

  // ── Щупальце
  tentacles: [
    new Tentacle(2031, 692),
  ],

  // ── Два вихря
  whirlpools: [
    new Whirlpool(1120, 320, 108, 0.13),  // сек.2/3 — S2 внутри
    new Whirlpool(1660, 410,  92, 0.12),  // сек.3 — второй вихрь, у нижней платф.
  ],

  // ── Вертикальные потоки (центр по платформам)
  verticalCurrents: [
    new VerticalCurrent(1462, 288, 68, 215, -0.50),  // ↑ центр платф.(1462,275,76)
    new VerticalCurrent(1847, 445, 68, 238,  0.44),  // ↓ центр платф.(1838,603,82)
  ],

  // ── Пузыри
  bubbles: [
    new Bubble(686,  362),   // сек.2 — подъём к высокой
    new Bubble(1852, 558),   // сек.4 — выход из глубины
  ],
};

// ─────────────────────────────────────────────────────────────
// Level 3  "Ломаный сон"  — forest / treetop branches (12800 wide)
// Mix of BranchSpring and BranchStatic; monkey spawns every 1.6s.
// Umbrella pickup pauses monkey for 2s.
// ─────────────────────────────────────────────────────────────
const L3 = {
  name: 'Ломаный сон',
  width: 12800, height: 720,
  bgColors: ['#020a02', '#030e03', '#051408'],
  playerStart: { x: 60, y: 554 },
  deathY: 730,
  physics: {},

  platforms: [
    // solid safe zones (every ~2133px)
    new Platform(    0, 590, 220, 18, '#3a1f08'),
    new Platform( 2100, 560, 220, 18, '#3a1f08'),
    new Platform( 4200, 560, 220, 18, '#3a1f08'),
    new Platform( 6300, 560, 220, 18, '#3a1f08'),
    new Platform( 8400, 560, 220, 18, '#3a1f08'),
    new Platform(10500, 560, 220, 18, '#3a1f08'),
    new Platform(12300, 500, 200, 18, '#3a1f08'),

    // S1 — mostly springs, introduce static (gaps 180–190px)
    new BranchSpring( 242, 510, 108),
    new BranchStatic( 430, 445, 102),
    new BranchSpring( 622, 512, 100),
    new BranchStatic( 812, 432,  98),
    new BranchSpring(1002, 506, 102),
    new BranchStatic(1194, 428,  98),
    new BranchSpring(1386, 500, 100),
    new BranchStatic(1578, 432,  96),
    new BranchSpring(1770, 506, 100),
    new BranchStatic(1962, 434,  96),

    // S2 — 50/50 mix (gaps 190–200px)
    new BranchSpring(2332, 512, 105),
    new BranchStatic(2528, 435, 100),
    new BranchSpring(2728, 508, 100),
    new BranchStatic(2928, 430,  98),
    new BranchSpring(3128, 505, 102),
    new BranchStatic(3330, 426,  98),
    new BranchSpring(3530, 502, 100),
    new BranchStatic(3732, 428,  96),
    new BranchSpring(3932, 504, 100),
    new BranchStatic(4134, 430,  95),

    // S3 — more static, gaps 195–210px
    new BranchStatic(4432, 512, 105),
    new BranchSpring(4640, 432, 100),
    new BranchStatic(4850, 508, 100),
    new BranchSpring(5062, 428,  96),
    new BranchStatic(5275, 505,  98),
    new BranchSpring(5488, 424,  96),
    new BranchStatic(5702, 500,  98),
    new BranchSpring(5920, 422,  95),
    new BranchStatic(6138, 498,  95),

    // S4 — 70% static, gaps 200–220px
    new BranchStatic(6542, 512, 105),
    new BranchSpring(6758, 430, 100),
    new BranchStatic(6978, 508,  98),
    new BranchSpring(7200, 425,  96),
    new BranchStatic(7424, 505,  98),
    new BranchStatic(7648, 422,  95),
    new BranchSpring(7876, 500,  96),
    new BranchStatic(8108, 420,  95),
    new BranchSpring(8338, 498,  94),

    // S5 — 70% static, gaps 210–225px
    new BranchStatic( 8642, 512, 105),
    new BranchSpring( 8868, 428, 100),
    new BranchStatic( 9098, 508,  98),
    new BranchStatic( 9326, 422,  96),
    new BranchSpring( 9558, 502,  98),
    new BranchStatic( 9794, 418,  95),
    new BranchStatic(10030, 498,  96),
    new BranchSpring(10268, 420,  95),
    new BranchStatic(10494, 496,  94),

    // S6 — hardest: 80% static, gaps 220–240px
    new BranchStatic(10742, 512, 102),
    new BranchSpring(10978, 425,  98),
    new BranchStatic(11218, 508,  96),
    new BranchStatic(11462, 418,  95),
    new BranchSpring(11710, 500,  96),
    new BranchStatic(11960, 415,  94),
    new BranchStatic(12200, 496,  93),
  ],

  shards: [
    new Shard( 3130, 462),  // S2 — above BranchSpring(3128,505)
    new Shard( 6760, 386),  // S4 — above BranchSpring(6758,430) — high challenge
    new Shard( 9560, 458),  // S5 — above BranchSpring(9558,502)
  ],

  hazards: [],

  checkpoints: [
    new Checkpoint( 2140, 522),
    new Checkpoint( 4240, 522),
    new Checkpoint( 6340, 522),
    new Checkpoint( 8440, 522),
    new Checkpoint(10540, 522),
  ],

  portal: new Portal(12348, 428),

  umbrellas: [
    new Umbrella( 1772, 468),   // S1 — above BranchSpring(1770,506)
    new Umbrella( 3930, 460),   // S2 — above BranchSpring(3932,504)
    new Umbrella( 6760, 387),   // S4 — near shard 2
    new Umbrella( 9096, 465),   // S5 — above BranchStatic(9098,508)
    new Umbrella(11208, 465),   // S6 — above BranchStatic(11218,508)
  ],

  monkeySpawner: (() => { const ms = new MonkeySpawner(); ms.cooldownMax = 96; return ms; })(),

  forestBg: new ForestBackground(12800),

  parrot: new Parrot([11600]),
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
  djHint: true,

  chaser: { x: 20, y: 580, startDelay: 120 },  // spawn behind player, on ground; freeze 2s before chasing

  platforms: [
    // solid floor — no gaps (spring must not fall into pits)
    new Platform(0, 660, 3840, 60, '#200808'),

    // mid platforms — first shifted right & lowered; later ones raised
    new Platform(560,  400, 140, 18, '#2a1010'),
    new Platform(880,  360, 160, 18, '#2a1010'),  // raised
    new Platform(1060, 240, 140, 18, '#2a1010'),  // raised — teleport portal at center
    new Platform(1240, 160, 160, 18, '#2a1010'),  // raised high
    new Platform(1440,  80, 160, 18, '#2a1010'),  // raised high — teleport portal at center
    new Platform(1740, 520, 160, 18, '#2a1010'),
    new Platform(2100, 380, 160, 18, '#2a1010'),  // raised
    // no platforms in spring shard zone (x≈2300) for clean vertical corridor
    new Platform(2480, 520, 160, 18, '#2a1010'),
    new Platform(2760, 500, 160, 18, '#2a1010'),
    // platforms near shard 3 (3152, 310) and penultimate platform removed — only reachable via spring
    new Platform(3650, 420, 190, 18, '#2a1010'),  // final platform — lowered
  ],

  shards: [
    new Shard(1120, 220),  // centered on third mid platform (1060..1200, top y=240)
    new Shard(2312, 300),  // hard — floating high, only via spring
    new Shard(3152, 310),  // end — near portal
  ],

  spring: undefined,  // assigned below so the teleport can reference it dynamically

  teleportPortals: undefined,  // assigned below — destination tracks the spring's live position

  hazards: [],

  // leftward wind under shard 2 (2312, 300) — pushes the springing player off course
  currents: [
    new CurrentZone(2200, 2420, -0.95),
  ],

  checkpoints: [
    new Checkpoint(1780, 482),
  ],

  portal: new Portal(3660, 348),
};

// L4 spring + teleport: the teleport's destination is computed live so it
// always tracks the spring's current x (player lands 100 px to its left).
L4.spring = new SpringJumper(200, 630);
L4.teleportPortals = [
  new TeleportPortal(
    3700, 588,          // under the final portal platform (x=3650-3840), sitting on floor (660-72=588)
    () => L4.spring.x - 100,
    () => 624,
  ),
];

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
    new Platform(220,  560, 160, 18, '#1e1040'),
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
    // все осколки у потолка — парят вниз (hoverDY:+1), т.к. потолок = пол при инверсии
    Object.assign(new Shard(392,  140), { hoverDY:  1 }),
    Object.assign(new Shard(932,   78), { hoverDY:  1 }),
    Object.assign(new Shard(2012,  78), { hoverDY:  1 }),
  ],

  hazards: [
    // ── Напольные шипы — опасны при обычной гравитации ────────────────────────
    // вынуждают инвертировать гравитацию и идти по потолочным платформам
    new Hazard(210,  636, 80, 24),   // ранний участок, до первой потолочной ступени
    new Hazard(630,  636, 96, 24),   // между ступенями пола x=500-660 и x=700-840
    new Hazard(1070, 636, 80, 24),   // после чекпоинта, охрана зоны шарда y=78
    new Hazard(1420, 636, 96, 24),   // второй половины уровня
    new Hazard(1830, 636, 80, 24),   // финальный участок перед порталом

    // ── Потолочные шипы (flip:true) — опасны при инвертированной гравитации ──
    // висят с потолка в зонах без потолочных ступеней
    Object.assign(new Hazard(1247, 60, 16, 24), { flip: true }),   // зазор x=1230-1280 между ступенями
    Object.assign(new Hazard(2240, 60, 96, 24), { flip: true }),   // после последней ступени (x>2130)
  ],

  // ── Летучие мыши — угроза на обоих уровнях гравитации ─────────────────────
  bats: [
    new Bat(450,  300),   // ранний участок, между первыми потолочными ступенями
    new Bat(1050, 360),   // зона чекпоинта + шард y=78 (x=932)
    new Bat(1750, 280),   // поздний участок, перед третьим шардом (x=2012)
  ],

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
  gravityToggle: true,

  platforms: [
    // ── Левая стена (пол при gravityDir=-1) — прерывистая ──────────────────
    // Разрывы: y=460-640, y=1440-1620, y=2280-2460
    new Platform(0,    0,   28,  460, '#1a3a28'),  // y=0-460
    new Platform(0,  640,   28,  800, '#1a3a28'),  // y=640-1440
    new Platform(0, 1620,   28,  660, '#1a3a28'),  // y=1620-2280
    new Platform(0, 2460,   28,  240, '#1a3a28'),  // y=2460-2700

    // ── Правая стена (пол при gravityDir=+1) — прерывистая ─────────────────
    // Разрывы: y=760-940, y=1680-1860, y=2560-2700
    new Platform(1252,    0, 28,  760, '#3a2a1a'),  // y=0-760
    new Platform(1252,  940, 28,  740, '#3a2a1a'),  // y=940-1680
    new Platform(1252, 1860, 28,  700, '#3a2a1a'),  // y=1860-2560

    // ── Граничные платформы верх/низ ────────────────────────────────────────
    new Platform(0,    -60, 1280, 60,  '#0a1020'),
    new Platform(0,   2700, 1280, 60,  '#0a1020'),

    // ── Колонна A — разрыв y=820-960 ────────────────────────────────────────
    new Platform(420,  660, 28, 160, '#1a2a3a'),
    new Platform(420,  960, 28, 300, '#1a2a3a'),

    // ── Колонна B — разрыв y=1000-1150 ──────────────────────────────────────
    new Platform(780,  660, 28, 340, '#1a2a3a'),
    new Platform(780, 1150, 28, 150, '#1a2a3a'),

    // ── Колонна C — разрыв y=1520-1680 ──────────────────────────────────────
    new Platform(350, 1340, 28, 180, '#1a2a3a'),
    new Platform(350, 1680, 28, 280, '#1a2a3a'),

    // ── Колонна D — разрыв y=1460-1620 ──────────────────────────────────────
    new Platform(820, 1340, 28, 120, '#1a2a3a'),
    new Platform(820, 1620, 28, 340, '#1a2a3a'),

    // ── Колонна E — разрыв y=2200-2360 ──────────────────────────────────────
    new Platform(280, 2040, 28, 160, '#1a2a3a'),
    new Platform(280, 2360, 28, 220, '#1a2a3a'),

    // ── Колонна F — разрыв y=2140-2300 ──────────────────────────────────────
    new Platform(620, 2040, 28, 100, '#1a2a3a'),
    new Platform(620, 2300, 28, 280, '#1a2a3a'),

    // ── Колонна G — разрыв y=2080-2240 ──────────────────────────────────────
    new Platform(960, 2040, 28,  40, '#1a2a3a'),
    new Platform(960, 2240, 28, 340, '#1a2a3a'),
  ],

  shards: [
    // парят от стены: левые → вправо (hoverDX:+1), правые → влево (hoverDX:-1)
    Object.assign(new Shard(30,   286),  { hoverDX:  1, hoverDY: 0 }),
    Object.assign(new Shard(1228, 1058), { hoverDX: -1, hoverDY: 0 }),
    Object.assign(new Shard(30,   2204), { hoverDX:  1, hoverDY: 0 }),
  ],

  hazards: [],

  // ── Вентиляторы ───────────────────────────────────────────────────────────
  fans: [
    new FanZone(28, 700,  1224, 200,  1.0),
    new FanZone(28, 1500, 1224, 200, -1.0),
    new FanZone(28, 2060, 1224, 180,  1.0),
  ],

  checkpoints: [
    Object.assign(new Checkpoint(28, 1100), { drawAngle: Math.PI / 2 }),
    Object.assign(new Checkpoint(28, 2020), { drawAngle: Math.PI / 2 }),
  ],

  portal: new Portal(1204, 2514),
};

const LEVELS = [L4, L5, L1, L2, L3, L6];
