const canvas = document.getElementById("game");

if (window.innerWidth <= 600) {
  canvas.width = 500;
  canvas.height = 640;
} else {
  canvas.width = 800;
  canvas.height = 500;
}

const SIZE = 20;
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const formEl = document.getElementById("form");
const gemSlotsEl = document.getElementById("gemSlots");
const heartSlotsEl = document.getElementById("heartSlots");
const pickEl = document.getElementById("pokemon");
const menuEl = document.getElementById("menu");
const startBtn = document.getElementById("start");
const buyHeartBtn = document.getElementById("buyHeart");
const COLS = Math.floor(canvas.width / SIZE);
const ROWS = Math.floor(canvas.height / SIZE);
const PAD = 1;
const HEART_COST = 3;
const MAX_GEMS = 3;
const MAX_HEARTS = 3;
const DIAMOND_CHANCE = 0.12;
const DIAMOND_CHANCE_FIRST = 0.22;

const GEM_SVG = `<svg class="slot" viewBox="0 0 24 24" aria-hidden="true">
  <polygon points="12,2 22,9 18,22 6,22 2,9" fill="#5dade2" stroke="#1a5276" stroke-width="1.5"/>
  <polygon points="12,2 22,9 12,12 2,9" fill="#aed6f1"/>
  <polygon points="12,12 22,9 18,22" fill="#3498db"/>
  <polygon points="12,12 2,9 6,22" fill="#2e86c1"/>
</svg>`;
const HEART_SVG = `<svg class="slot" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 21s-7-4.6-9.5-9C.5 8 2.5 4 6.5 4c2 0 3.4 1.2 5.5 3.2C14.1 5.2 15.5 4 17.5 4c4 0 6 4 4 8-2.5 4.4-9.5 9-9.5 9z"
    fill="#e74c3c" stroke="#922b21" stroke-width="1.2"/>
  <path d="M8 8c-.5 1 .2 2.2 1.2 2.5" fill="none" stroke="#f5b7b1" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

function buildSlots(el, svg, n) {
  el.innerHTML = svg.repeat(n);
  return [...el.children];
}
const gemSlotNodes = buildSlots(gemSlotsEl, GEM_SVG, MAX_GEMS);
const heartSlotNodes = buildSlots(heartSlotsEl, HEART_SVG, MAX_HEARTS);

let borderStars = [];
function initBorderStars() {
  borderStars = [];
  const density = 2.5;
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (x >= PAD && x < COLS - PAD && y >= PAD && y < ROWS - PAD) continue;
      
      const count = Math.random() * density + 1;
      for(let i=0; i<count; i++) {
        borderStars.push({
          x: x * SIZE + Math.random() * SIZE,
          y: y * SIZE + Math.random() * SIZE,
          size: Math.random() * 3 + 1,
          p: Math.random()
        });
      }
    }
  }
}
initBorderStars();

function face(x, y) {
  ctx.fillStyle = "#222";
  ctx.fillRect(x + 4, y + 6, 3, 3);
  ctx.fillRect(x + SIZE - 8, y + 6, 3, 3);
  ctx.fillStyle = "#eee";
  ctx.fillRect(x + 5, y + 6, 1, 1);
  ctx.fillRect(x + SIZE - 7, y + 6, 1, 1);
}

const LINES = {
  pikachu: [
    { name: "Pikachu", at: 0, body: "#f7d02c", dark: "#8b6914", border: ["#f7d02c", "#fbe18c", "#fff"] },
    { name: "Raichu", at: 8, body: "#f0a030", dark: "#8b4a14", border: ["#f0a030", "#f4b96e", "#fff"] }
  ],
  bulbasaur: [
    { name: "Bulbasaur", at: 0, body: "#74c9a0", dark: "#3d8b6e", border: ["#74c9a0", "#a8ddc4", "#fff"] },
    { name: "Ivysaur", at: 5, body: "#5cb88a", dark: "#2f6e52", border: ["#5cb88a", "#96d2b5", "#fff"] },
    { name: "Venusaur", at: 12, body: "#3fa06e", dark: "#245c40", border: ["#3fa06e", "#84c3a5", "#fff"] }
  ],
  charmander: [
    { name: "Charmander", at: 0, body: "#f08030", dark: "#c45c18", border: ["#f08030", "#f4ac76", "#fff"] },
    { name: "Charmeleon", at: 5, body: "#e06020", dark: "#a04010", border: ["#e06020", "#ea9361", "#fff"] },
    { name: "Charizard", at: 12, body: "#d35400", dark: "#8e2c00", border: ["#d35400", "#e08953", "#fff"] }
  ],
  squirtle: [
    { name: "Squirtle", at: 0, body: "#5dade2", dark: "#2e86c1", border: ["#5dade2", "#95caec", "#fff"] },
    { name: "Wartortle", at: 5, body: "#3498db", dark: "#1a6fa3", border: ["#3498db", "#7bbce7", "#fff"] },
    { name: "Blastoise", at: 12, body: "#2471a3", dark: "#1a5276", border: ["#2471a3", "#6ba1c5", "#fff"] }
  ]
};

LINES.pikachu[0].head = function(x, y) { ctx.fillStyle = this.body; ctx.fillRect(x + 2, y - 6, 5, 7); ctx.fillRect(x + SIZE - 8, y - 6, 5, 7); ctx.fillStyle = "#222"; ctx.fillRect(x + 2, y - 6, 5, 3); ctx.fillRect(x + SIZE - 8, y - 6, 5, 3); face(x, y); ctx.fillStyle = "#e74c3c"; ctx.fillRect(x + 1, y + 11, 4, 4); ctx.fillRect(x + SIZE - 6, y + 11, 4, 4); };
LINES.pikachu[0].bodyMark = function(x, y, i) { if (i % 3 === 0) { ctx.fillStyle = this.dark; ctx.fillRect(x + 2, y + SIZE / 2 - 1, SIZE - 5, 2); } };
LINES.pikachu[0].tail = function(x, y) { ctx.fillStyle = this.dark; ctx.fillRect(x + SIZE - 6, y + 2, 5, 5); ctx.fillRect(x + 2, y + SIZE - 8, 8, 5); };
LINES.pikachu[1].head = function(x, y) { ctx.fillStyle = this.body; ctx.fillRect(x + 1, y - 8, 6, 9); ctx.fillRect(x + SIZE - 8, y - 8, 6, 9); ctx.fillStyle = "#f5d76e"; ctx.fillRect(x + 2, y - 8, 4, 4); ctx.fillRect(x + SIZE - 7, y - 8, 4, 4); face(x, y); ctx.fillStyle = "#e74c3c"; ctx.fillRect(x + 1, y + 11, 4, 4); ctx.fillRect(x + SIZE - 6, y + 11, 4, 4); };
LINES.pikachu[1].bodyMark = function(x, y, i) { if (i % 2 === 0) { ctx.fillStyle = "#f5d76e"; ctx.fillRect(x + 3, y + 4, SIZE - 7, SIZE - 9); } };
LINES.pikachu[1].tail = function(x, y) { ctx.fillStyle = this.dark; ctx.fillRect(x + 2, y + 2, 14, 4); ctx.fillRect(x + 10, y + 6, 6, 8); };
LINES.bulbasaur[0].head = function(x, y) { face(x, y); ctx.fillStyle = this.dark; ctx.fillRect(x + 2, y + 12, 3, 3); ctx.fillRect(x + SIZE - 7, y + 11, 3, 3); };
LINES.bulbasaur[0].bodyMark = function(x, y, i) { if (i % 2 === 0) { ctx.fillStyle = this.dark; ctx.fillRect(x + 4, y + 4, 4, 4); } if (i === 1) { ctx.fillStyle = "#5c3d7a"; ctx.fillRect(x + 4, y - 8, 11, 10); ctx.fillStyle = "#2d6b3a"; ctx.fillRect(x + 8, y - 10, 3, 4); } };
LINES.bulbasaur[0].tail = function(x, y) { ctx.fillStyle = this.dark; ctx.fillRect(x + 4, y + 6, 10, 6); };
LINES.bulbasaur[1].head = function(x, y) { face(x, y); ctx.fillStyle = this.dark; ctx.fillRect(x + 2, y + 12, 4, 3); ctx.fillRect(x + SIZE - 8, y + 11, 4, 3); };
LINES.bulbasaur[1].bodyMark = function(x, y, i) { if (i === 1) { ctx.fillStyle = "#c0392b"; ctx.fillRect(x + 3, y - 10, 13, 12); ctx.fillStyle = "#2d6b3a"; ctx.fillRect(x + 2, y - 4, 4, 6); ctx.fillRect(x + 13, y - 4, 4, 6); } };
LINES.bulbasaur[1].tail = function(x, y) { ctx.fillStyle = this.dark; ctx.fillRect(x + 3, y + 5, 12, 7); };
LINES.bulbasaur[2].head = function(x, y) { face(x, y); ctx.fillStyle = this.dark; ctx.fillRect(x + 1, y + 11, 5, 4); ctx.fillRect(x + SIZE - 7, y + 11, 5, 4); };
LINES.bulbasaur[2].bodyMark = function(x, y, i) { if (i === 1) { ctx.fillStyle = "#8e44ad"; ctx.fillRect(x + 1, y - 12, 17, 14); ctx.fillStyle = "#c0392b"; ctx.fillRect(x + 6, y - 8, 7, 7); ctx.fillStyle = "#2d6b3a"; ctx.fillRect(x + 1, y - 2, 5, 6); ctx.fillRect(x + 13, y - 2, 5, 6); } };
LINES.bulbasaur[2].tail = function(x, y) { ctx.fillStyle = this.dark; ctx.fillRect(x + 2, y + 4, 14, 8); };
LINES.charmander[0].head = function(x, y) { face(x, y); ctx.fillStyle = this.dark; ctx.fillRect(x + 6, y + 11, 7, 4); };
LINES.charmander[0].bodyMark = function(x, y, i) { if (i === 1) { ctx.fillStyle = "#eee"; ctx.fillRect(x + 4, y + 6, 11, 8); } };
LINES.charmander[0].tail = function(x, y) { ctx.fillStyle = "#f8d030"; ctx.fillRect(x + 6, y - 4, 6, 6); ctx.fillStyle = "#e74c3c"; ctx.fillRect(x + 8, y - 6, 3, 4); ctx.fillStyle = this.dark; ctx.fillRect(x + 7, y + 4, 5, 8); };
LINES.charmander[1].head = function(x, y) { ctx.fillStyle = this.dark; ctx.fillRect(x + 7, y - 4, 5, 5); face(x, y); ctx.fillStyle = "#eee"; ctx.fillRect(x + 5, y + 11, 9, 4); };
LINES.charmander[1].bodyMark = function(x, y, i) { if (i === 1) { ctx.fillStyle = "#eee"; ctx.fillRect(x + 3, y + 5, 13, 9); } };
LINES.charmander[1].tail = function(x, y) { ctx.fillStyle = "#f8d030"; ctx.fillRect(x + 5, y - 6, 8, 7); ctx.fillStyle = "#e74c3c"; ctx.fillRect(x + 7, y - 8, 4, 5); ctx.fillStyle = this.dark; ctx.fillRect(x + 6, y + 3, 6, 10); };
LINES.charmander[2].head = function(x, y) { ctx.fillStyle = this.dark; ctx.fillRect(x + 3, y - 6, 4, 7); ctx.fillRect(x + SIZE - 8, y - 6, 4, 7); face(x, y); ctx.fillStyle = "#eee"; ctx.fillRect(x + 4, y + 11, 11, 4); };
LINES.charmander[2].bodyMark = function(x, y, i) { if (i === 1) { ctx.fillStyle = "#eee"; ctx.fillRect(x + 3, y + 4, 13, 10); } if (i === 2 || i === 3) { ctx.fillStyle = "#5dade2"; ctx.fillRect(x - 4, y + 2, 5, 12); ctx.fillRect(x + SIZE - 2, y + 2, 5, 12); } };
LINES.charmander[2].tail = function(x, y) { ctx.fillStyle = "#f8d030"; ctx.fillRect(x + 4, y - 8, 10, 8); ctx.fillStyle = "#e74c3c"; ctx.fillRect(x + 7, y - 10, 5, 6); ctx.fillStyle = this.dark; ctx.fillRect(x + 6, y + 2, 7, 12); };
LINES.squirtle[0].head = function(x, y) { face(x, y); ctx.fillStyle = this.dark; ctx.fillRect(x + 5, y + 12, 9, 3); };
LINES.squirtle[0].bodyMark = function(x, y) { ctx.fillStyle = "#d5a06a"; ctx.fillRect(x + 2, y + 2, SIZE - 5, SIZE - 5); ctx.fillStyle = "#8b5a2b"; ctx.fillRect(x + SIZE / 2 - 1, y + 2, 2, SIZE - 5); ctx.fillRect(x + 2, y + SIZE / 2 - 1, SIZE - 5, 2); };
LINES.squirtle[0].tail = function(x, y) { ctx.fillStyle = this.dark; ctx.fillRect(x + 6, y + 4, 8, 8); ctx.fillStyle = "#eee"; ctx.fillRect(x + 12, y + 6, 4, 4); };
LINES.squirtle[1].head = function(x, y) { ctx.fillStyle = "#eee"; ctx.fillRect(x + 1, y - 4, 5, 8); ctx.fillRect(x + SIZE - 7, y - 4, 5, 8); face(x, y); ctx.fillStyle = this.dark; ctx.fillRect(x + 5, y + 12, 9, 3); };
LINES.squirtle[1].bodyMark = function(x, y) { ctx.fillStyle = "#b87333"; ctx.fillRect(x + 2, y + 2, SIZE - 5, SIZE - 5); ctx.fillStyle = "#6b3f1a"; ctx.fillRect(x + SIZE / 2 - 1, y + 2, 2, SIZE - 5); ctx.fillRect(x + 2, y + SIZE / 2 - 1, SIZE - 5, 2); };
LINES.squirtle[1].tail = function(x, y) { ctx.fillStyle = "#eee"; ctx.fillRect(x + 4, y + 2, 12, 12); ctx.fillStyle = this.dark; ctx.fillRect(x + 7, y + 5, 6, 6); };
LINES.squirtle[2].head = function(x, y) { face(x, y); ctx.fillStyle = "#95a5a6"; ctx.fillRect(x + 2, y + 1, 4, 5); ctx.fillRect(x + SIZE - 7, y + 1, 4, 5); ctx.fillStyle = this.dark; ctx.fillRect(x + 5, y + 12, 9, 3); };
LINES.squirtle[2].bodyMark = function(x, y, i) { ctx.fillStyle = "#7f8c8d"; ctx.fillRect(x + 2, y + 2, SIZE - 5, SIZE - 5); ctx.fillStyle = "#566573"; ctx.fillRect(x + SIZE / 2 - 1, y + 2, 2, SIZE - 5); ctx.fillRect(x + 2, y + SIZE / 2 - 1, SIZE - 5, 2); if (i === 1) { ctx.fillStyle = "#95a5a6"; ctx.fillRect(x - 3, y + 4, 5, 8); ctx.fillRect(x + SIZE - 3, y + 4, 5, 8); } };
LINES.squirtle[2].tail = function(x, y) { ctx.fillStyle = this.dark; ctx.fillRect(x + 5, y + 4, 10, 9); };

let snake, dir, nextDir, food, score, alive, playing, tick;
let lineKey, mon, evoFlash;
let gems = 0;
let hearts = 0;
let pops = [];

function pulseSlot(nodes, index) {
  const el = nodes[index];
  if (!el) return;
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
}

function renderSlots(nodes, filled) {
  nodes.forEach((el, i) => el.classList.toggle("on", i < filled));
}

function addPop(kind, gx, gy) {
  pops.push({ kind, x: gx * SIZE + SIZE / 2, y: gy * SIZE, life: 18 });
}

function drawIcon(kind, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (kind === "gem") {
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(9, -2);
    ctx.lineTo(6, 10);
    ctx.lineTo(-6, 10);
    ctx.lineTo(-9, -2);
    ctx.closePath();
    ctx.fillStyle = "#5dade2";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(9, -2);
    ctx.lineTo(0, 1);
    ctx.lineTo(-9, -2);
    ctx.closePath();
    ctx.fillStyle = "#d6eaf8";
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-12, 0, -10, -10, 0, -4);
    ctx.bezierCurveTo(10, -10, 12, 0, 0, 8);
    ctx.fillStyle = "#e74c3c";
    ctx.fill();
    ctx.fillStyle = "#f5b7b1";
    ctx.fillRect(-4, -5, 3, 3);
  }
  ctx.restore();
}

const BALLS = [
  { name: "Poké Ball", top: "#e74c3c", points: 1, weight: 70 },
  { name: "Great Ball", top: "#2e86de", points: 3, weight: 20 },
  { name: "Ultra Ball", top: "#222", stripe: "#f1c40f", points: 5, weight: 8 },
  { name: "Master Ball", top: "#9b59b6", stripe: "#f5b7b1", points: 10, weight: 2 },
];

const BALL_TOTAL = BALLS.reduce((n, b) => n + b.weight, 0);

function pickBall() {
  let r = Math.random() * BALL_TOTAL;
  for (const b of BALLS) {
    r -= b.weight;
    if (r < 0) return b;
  }
  return BALLS[0];
}

function stageFor(score) {
  const line = LINES[lineKey];
  let s = line[0];
  for (const form of line) {
    if (score >= form.at) s = form;
  }
  return s;
}

function updateHUD() {
  scoreEl.textContent = score;
  renderSlots(gemSlotNodes, gems);
  renderSlots(heartSlotNodes, hearts);
  if (mon) formEl.textContent = mon.name;
}

function applyStage() {
  const next = stageFor(score);
  if (mon && next.name !== mon.name) evoFlash = 20;
  mon = next;
  updateHUD();
}

function buyHeart() {
  if (gems < HEART_COST || hearts >= MAX_HEARTS || !alive) return;
  gems -= HEART_COST;
  hearts++;
  pulseSlot(heartSlotNodes, hearts - 1);
  addPop("heart", snake[0].x, snake[0].y);
  updateHUD();
}

function reset() {
  snake = [{ x: (COLS / 2) | 0, y: (ROWS / 2) | 0 }];
  dir = nextDir = { x: 1, y: 0 };
  food = spawn();
  score = 0;
  hearts = 0;
  gems = 0;
  alive = true;
  evoFlash = 0;
  pops = [];
  applyStage();
  updateHUD();
}

function showMenu() {
  playing = false;
  menuEl.classList.remove("hidden");
}

function startGame() {
  lineKey = pickEl.value;
  menuEl.classList.add("hidden");
  pickEl.blur();
  startBtn.blur();
  reset();
  playing = true;
}

startBtn.addEventListener("click", startGame);

function spawn() {
  let p;
  do {
    p = {
      x: PAD + ((Math.random() * (COLS - PAD * 2)) | 0),
      y: PAD + ((Math.random() * (ROWS - PAD * 2)) | 0),
    };
  } while (snake.some((s) => s.x === p.x && s.y === p.y));
  const chance = hearts === 0 ? DIAMOND_CHANCE_FIRST : DIAMOND_CHANCE;
  if (Math.random() < chance && gems < MAX_GEMS) {
    return { ...p, kind: "diamond" };
  }
  return { ...p, kind: "ball", ball: pickBall() };
}

function revive() {
  hearts--;
  snake = [{ x: (COLS / 2) | 0, y: (ROWS / 2) | 0 }];
  dir = nextDir = { x: 1, y: 0 };
  updateHUD();
}

function step() {
  if (!playing || !alive) return;
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (
    head.x < PAD || head.x >= COLS - PAD ||
    head.y < PAD || head.y >= ROWS - PAD ||
    snake.some((s) => s.x === head.x && s.y === head.y)
  ) {
    if (hearts > 0) revive();
    else alive = false;
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    if (food.kind === "diamond") {
      if (gems < MAX_GEMS) {
        gems++;
        pulseSlot(gemSlotNodes, gems - 1);
        addPop("gem", food.x, food.y);
      }
    } else {
      score += food.ball.points;
    }
    applyStage();
    updateHUD();
    food = spawn();
  } else {
    snake.pop();
  }
  if (evoFlash > 0) evoFlash--;
  for (const p of pops) {
    p.y -= 2;
    p.life--;
  }
  pops = pops.filter((p) => p.life > 0);
}

function drawStar(x, y, radius, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.moveTo(0, 0 - radius);
  for (let i = 0; i < 5; i++) {
    ctx.rotate(Math.PI / 5);
    ctx.lineTo(0, 0 - (radius * 0.4));
    ctx.rotate(Math.PI / 5);
    ctx.lineTo(0, 0 - radius);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  if(Math.random() > 0.6) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(Math.random()*radius*2 - radius, Math.random()*radius*2 - radius, 1, 1);
  }
  ctx.restore();
}

function drawBorder() {
  if (!mon || !mon.border) return;
  
  const colors = mon.border;
  const time = Date.now() * 0.003; 

  borderStars.forEach(star => {
    const colorIndex = Math.floor((star.x + star.y) * 0.01) % colors.length;
    const color = colors[colorIndex];
    const flicker = Math.sin(time + star.p * Math.PI * 2) * 0.2 + 0.8;
    const alpha = Math.max(0.1, flicker);
    drawStar(star.x, star.y, star.size, color, alpha);
  });
}

function draw() {
  ctx.fillStyle = "#000"; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (!mon) return;

  const fx = food.x * SIZE;
  const fy = food.y * SIZE;
  if (food.kind === "diamond") {
    drawIcon("gem", fx + SIZE / 2, fy + SIZE / 2, 0.85);
  } else {
    const ball = food.ball;
    ctx.fillStyle = ball.top;
    ctx.fillRect(fx, fy, SIZE - 1, (SIZE - 1) / 2);
    ctx.fillStyle = "#eee";
    ctx.fillRect(fx, fy + (SIZE - 1) / 2, SIZE - 1, (SIZE - 1) / 2);
    if (ball.stripe) {
      ctx.fillStyle = ball.stripe;
      ctx.fillRect(fx + 2, fy + 2, SIZE - 5, 3);
    }
    ctx.fillStyle = "#111";
    ctx.fillRect(fx, fy + SIZE / 2 - 1, SIZE - 1, 2);
    ctx.fillRect(fx + SIZE / 2 - 2, fy + SIZE / 2 - 2, 4, 4);
  }

  snake.forEach((s, i) => {
    const x = s.x * SIZE;
    const y = s.y * SIZE;
    const isHead = i === 0;
    const isTail = i === snake.length - 1;

    ctx.fillStyle = alive ? mon.body : "#555";
    ctx.fillRect(x, y, SIZE - 1, SIZE - 1);
    if (!alive) return;

    if (isHead) mon.head(x, y);
    else if (isTail && snake.length > 1) mon.tail(x, y);
    else mon.bodyMark(x, y, i);
  });

  for (const p of pops) {
    const t = p.life / 18;
    ctx.globalAlpha = t;
    drawIcon(p.kind, p.x, p.y, 1.1 + (1 - t) * 0.4);
    ctx.globalAlpha = 1;
  }
  
  drawBorder();

  if (evoFlash > 0) {
    ctx.fillStyle = "#fff";
    ctx.font = "22px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${mon.name}!`, canvas.width / 2, 40);
  }

  if (!alive) {
    ctx.fillStyle = "#eee";
    ctx.font = "20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
  }
}

function setDir(d) {
  if (!playing || !alive) return;
  if (d && d.x + dir.x !== 0 && d.y + dir.y !== 0) nextDir = d;
}

document.addEventListener("keydown", (e) => {
  if (!playing) return;
  const map = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };
  if ((e.key === "h" || e.key === "H") && alive) {
    e.preventDefault();
    buyHeart();
    return;
  }
  if (e.key === " " && !alive) {
    e.preventDefault();
    showMenu();
    return;
  }
  const d = map[e.key];
  if (d) {
    e.preventDefault();
    setDir(d);
  }
});

buyHeartBtn.addEventListener("click", () => {
  if (playing && alive) buyHeart();
});

let touchX = 0;
let touchY = 0;
canvas.addEventListener(
  "touchstart",
  (e) => {
    const t = e.changedTouches[0];
    touchX = t.clientX;
    touchY = t.clientY;
  },
  { passive: true }
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    if (playing) e.preventDefault();
  },
  { passive: false }
);
canvas.addEventListener(
  "touchend",
  (e) => {
    if (!playing || !alive) {
      if (playing && !alive) showMenu();
      return;
    }
    const t = e.changedTouches[0];
    const dx = t.clientX - touchX;
    const dy = t.clientY - touchY;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    const d =
      Math.abs(dx) > Math.abs(dy)
        ? { x: dx > 0 ? 1 : -1, y: 0 }
        : { x: 0, y: dy > 0 ? 1 : -1 };
    setDir(d);
  },
  { passive: true }
);

lineKey = pickEl.value;
reset();
playing = false;
draw();
tick = setInterval(() => {
  step();
  draw();
}, 200);