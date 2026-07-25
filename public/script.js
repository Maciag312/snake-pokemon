const SIZE = 20;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const formEl = document.getElementById("form");
const gemSlotsEl = document.getElementById("gemSlots");
const heartSlotsEl = document.getElementById("heartSlots");
const pickEl = document.getElementById("pokemon");
const menuEl = document.getElementById("menu");
const startBtn = document.getElementById("start");
const COLS = canvas.width / SIZE;
const ROWS = canvas.height / SIZE;
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
    {
      name: "Pikachu",
      at: 0,
      body: "#f7d02c",
      dark: "#8b6914",
      head(x, y) {
        ctx.fillStyle = this.body;
        ctx.fillRect(x + 2, y - 6, 5, 7);
        ctx.fillRect(x + SIZE - 8, y - 6, 5, 7);
        ctx.fillStyle = "#222";
        ctx.fillRect(x + 2, y - 6, 5, 3);
        ctx.fillRect(x + SIZE - 8, y - 6, 5, 3);
        face(x, y);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(x + 1, y + 11, 4, 4);
        ctx.fillRect(x + SIZE - 6, y + 11, 4, 4);
      },
      bodyMark(x, y, i) {
        if (i % 3 === 0) {
          ctx.fillStyle = this.dark;
          ctx.fillRect(x + 2, y + SIZE / 2 - 1, SIZE - 5, 2);
        }
      },
      tail(x, y) {
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + SIZE - 6, y + 2, 5, 5);
        ctx.fillRect(x + 2, y + SIZE - 8, 8, 5);
      },
    },
    {
      name: "Raichu",
      at: 8,
      body: "#f0a030",
      dark: "#8b4a14",
      head(x, y) {
        ctx.fillStyle = this.body;
        ctx.fillRect(x + 1, y - 8, 6, 9);
        ctx.fillRect(x + SIZE - 8, y - 8, 6, 9);
        ctx.fillStyle = "#f5d76e";
        ctx.fillRect(x + 2, y - 8, 4, 4);
        ctx.fillRect(x + SIZE - 7, y - 8, 4, 4);
        face(x, y);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(x + 1, y + 11, 4, 4);
        ctx.fillRect(x + SIZE - 6, y + 11, 4, 4);
      },
      bodyMark(x, y, i) {
        if (i % 2 === 0) {
          ctx.fillStyle = "#f5d76e";
          ctx.fillRect(x + 3, y + 4, SIZE - 7, SIZE - 9);
        }
      },
      tail(x, y) {
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 2, y + 2, 14, 4);
        ctx.fillRect(x + 10, y + 6, 6, 8);
      },
    },
  ],
  bulbasaur: [
    {
      name: "Bulbasaur",
      at: 0,
      body: "#74c9a0",
      dark: "#3d8b6e",
      head(x, y) {
        face(x, y);
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 2, y + 12, 3, 3);
        ctx.fillRect(x + SIZE - 7, y + 11, 3, 3);
      },
      bodyMark(x, y, i) {
        if (i % 2 === 0) {
          ctx.fillStyle = this.dark;
          ctx.fillRect(x + 4, y + 4, 4, 4);
        }
        if (i === 1) {
          ctx.fillStyle = "#5c3d7a";
          ctx.fillRect(x + 4, y - 8, 11, 10);
          ctx.fillStyle = "#2d6b3a";
          ctx.fillRect(x + 8, y - 10, 3, 4);
        }
      },
      tail(x, y) {
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 4, y + 6, 10, 6);
      },
    },
    {
      name: "Ivysaur",
      at: 5,
      body: "#5cb88a",
      dark: "#2f6e52",
      head(x, y) {
        face(x, y);
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 2, y + 12, 4, 3);
        ctx.fillRect(x + SIZE - 8, y + 11, 4, 3);
      },
      bodyMark(x, y, i) {
        if (i === 1) {
          ctx.fillStyle = "#c0392b";
          ctx.fillRect(x + 3, y - 10, 13, 12);
          ctx.fillStyle = "#2d6b3a";
          ctx.fillRect(x + 2, y - 4, 4, 6);
          ctx.fillRect(x + 13, y - 4, 4, 6);
        }
      },
      tail(x, y) {
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 3, y + 5, 12, 7);
      },
    },
    {
      name: "Venusaur",
      at: 12,
      body: "#3fa06e",
      dark: "#245c40",
      head(x, y) {
        face(x, y);
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 1, y + 11, 5, 4);
        ctx.fillRect(x + SIZE - 7, y + 11, 5, 4);
      },
      bodyMark(x, y, i) {
        if (i === 1) {
          ctx.fillStyle = "#8e44ad";
          ctx.fillRect(x + 1, y - 12, 17, 14);
          ctx.fillStyle = "#c0392b";
          ctx.fillRect(x + 6, y - 8, 7, 7);
          ctx.fillStyle = "#2d6b3a";
          ctx.fillRect(x + 1, y - 2, 5, 6);
          ctx.fillRect(x + 13, y - 2, 5, 6);
        }
      },
      tail(x, y) {
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 2, y + 4, 14, 8);
      },
    },
  ],
  charmander: [
    {
      name: "Charmander",
      at: 0,
      body: "#f08030",
      dark: "#c45c18",
      head(x, y) {
        face(x, y);
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 6, y + 11, 7, 4);
      },
      bodyMark(x, y, i) {
        if (i === 1) {
          ctx.fillStyle = "#eee";
          ctx.fillRect(x + 4, y + 6, 11, 8);
        }
      },
      tail(x, y) {
        ctx.fillStyle = "#f8d030";
        ctx.fillRect(x + 6, y - 4, 6, 6);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(x + 8, y - 6, 3, 4);
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 7, y + 4, 5, 8);
      },
    },
    {
      name: "Charmeleon",
      at: 5,
      body: "#e06020",
      dark: "#a04010",
      head(x, y) {
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 7, y - 4, 5, 5);
        face(x, y);
        ctx.fillStyle = "#eee";
        ctx.fillRect(x + 5, y + 11, 9, 4);
      },
      bodyMark(x, y, i) {
        if (i === 1) {
          ctx.fillStyle = "#eee";
          ctx.fillRect(x + 3, y + 5, 13, 9);
        }
      },
      tail(x, y) {
        ctx.fillStyle = "#f8d030";
        ctx.fillRect(x + 5, y - 6, 8, 7);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(x + 7, y - 8, 4, 5);
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 6, y + 3, 6, 10);
      },
    },
    {
      name: "Charizard",
      at: 12,
      body: "#d35400",
      dark: "#8e2c00",
      head(x, y) {
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 3, y - 6, 4, 7);
        ctx.fillRect(x + SIZE - 8, y - 6, 4, 7);
        face(x, y);
        ctx.fillStyle = "#eee";
        ctx.fillRect(x + 4, y + 11, 11, 4);
      },
      bodyMark(x, y, i) {
        if (i === 1) {
          ctx.fillStyle = "#eee";
          ctx.fillRect(x + 3, y + 4, 13, 10);
        }
        if (i === 2 || i === 3) {
          ctx.fillStyle = "#5dade2";
          ctx.fillRect(x - 4, y + 2, 5, 12);
          ctx.fillRect(x + SIZE - 2, y + 2, 5, 12);
        }
      },
      tail(x, y) {
        ctx.fillStyle = "#f8d030";
        ctx.fillRect(x + 4, y - 8, 10, 8);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(x + 7, y - 10, 5, 6);
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 6, y + 2, 7, 12);
      },
    },
  ],
  squirtle: [
    {
      name: "Squirtle",
      at: 0,
      body: "#5dade2",
      dark: "#2e86c1",
      head(x, y) {
        face(x, y);
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 5, y + 12, 9, 3);
      },
      bodyMark(x, y) {
        ctx.fillStyle = "#d5a06a";
        ctx.fillRect(x + 2, y + 2, SIZE - 5, SIZE - 5);
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(x + SIZE / 2 - 1, y + 2, 2, SIZE - 5);
        ctx.fillRect(x + 2, y + SIZE / 2 - 1, SIZE - 5, 2);
      },
      tail(x, y) {
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 6, y + 4, 8, 8);
        ctx.fillStyle = "#eee";
        ctx.fillRect(x + 12, y + 6, 4, 4);
      },
    },
    {
      name: "Wartortle",
      at: 5,
      body: "#3498db",
      dark: "#1a6fa3",
      head(x, y) {
        ctx.fillStyle = "#eee";
        ctx.fillRect(x + 1, y - 4, 5, 8);
        ctx.fillRect(x + SIZE - 7, y - 4, 5, 8);
        face(x, y);
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 5, y + 12, 9, 3);
      },
      bodyMark(x, y) {
        ctx.fillStyle = "#b87333";
        ctx.fillRect(x + 2, y + 2, SIZE - 5, SIZE - 5);
        ctx.fillStyle = "#6b3f1a";
        ctx.fillRect(x + SIZE / 2 - 1, y + 2, 2, SIZE - 5);
        ctx.fillRect(x + 2, y + SIZE / 2 - 1, SIZE - 5, 2);
      },
      tail(x, y) {
        ctx.fillStyle = "#eee";
        ctx.fillRect(x + 4, y + 2, 12, 12);
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 7, y + 5, 6, 6);
      },
    },
    {
      name: "Blastoise",
      at: 12,
      body: "#2471a3",
      dark: "#1a5276",
      head(x, y) {
        face(x, y);
        ctx.fillStyle = "#95a5a6";
        ctx.fillRect(x + 2, y + 1, 4, 5);
        ctx.fillRect(x + SIZE - 7, y + 1, 4, 5);
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 5, y + 12, 9, 3);
      },
      bodyMark(x, y, i) {
        ctx.fillStyle = "#7f8c8d";
        ctx.fillRect(x + 2, y + 2, SIZE - 5, SIZE - 5);
        ctx.fillStyle = "#566573";
        ctx.fillRect(x + SIZE / 2 - 1, y + 2, 2, SIZE - 5);
        ctx.fillRect(x + 2, y + SIZE / 2 - 1, SIZE - 5, 2);
        if (i === 1) {
          ctx.fillStyle = "#95a5a6";
          ctx.fillRect(x - 3, y + 4, 5, 8);
          ctx.fillRect(x + SIZE - 3, y + 4, 5, 8);
        }
      },
      tail(x, y) {
        ctx.fillStyle = this.dark;
        ctx.fillRect(x + 5, y + 4, 10, 9);
      },
    },
  ],
};

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

function drawFence() {
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (x >= PAD && x < COLS - PAD && y >= PAD && y < ROWS - PAD) continue;
      const px = x * SIZE;
      const py = y * SIZE;
      const edge = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
      ctx.fillStyle = edge ? "#a67c52" : "#c4a574";
      ctx.fillRect(px, py, SIZE, SIZE);
      ctx.fillStyle = "#7a5235";
      ctx.fillRect(px + 1, py + 5, SIZE - 2, 3);
      ctx.fillRect(px + 1, py + 12, SIZE - 2, 3);
      ctx.fillStyle = "#5c3d28";
      if (x === 0 || x === COLS - 1) ctx.fillRect(px + 7, py + 1, 5, SIZE - 2);
      if (y === 0 || y === ROWS - 1) ctx.fillRect(px + 1, py + 7, SIZE - 2, 5);
      if ((x === 0 || x === COLS - 1) && (y === 0 || y === ROWS - 1)) {
        ctx.fillStyle = "#d4b896";
        ctx.fillRect(px + 3, py + 3, SIZE - 6, SIZE - 6);
        ctx.fillStyle = "#c9a227";
        ctx.fillRect(px + 7, py + 7, 6, 6);
      }
    }
  }
}

function draw() {
  ctx.fillStyle = "#2a2438";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawFence();
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

  if (evoFlash > 0) {
    ctx.fillStyle = "#f1c40f";
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
    if (d.x + dir.x !== 0 && d.y + dir.y !== 0) nextDir = d;
  }
});

lineKey = pickEl.value;
reset();
playing = false;
draw();
tick = setInterval(() => {
  step();
  draw();
}, 200);
