const canvas = document.getElementById("game");

if (window.innerWidth <= 600) {
  canvas.width = 500;
  canvas.height = 640;
} else {
  canvas.width = 800;
  canvas.height = 500;
}

const SIZE = 20;
let ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const formEl = document.getElementById("form");
const gemSlotsEl = document.getElementById("gemSlots");
const heartSlotsEl = document.getElementById("heartSlots");
const statusBarEl = document.getElementById("statusBar");
const menuEl = document.getElementById("menu");
const startBtn = document.getElementById("start");
const usernameInput = document.getElementById("usernameInput");
const leaderboardList = document.getElementById("leaderboardList");
const abilityStatEl = document.getElementById("abilityStat");
const abilityNameEl = document.getElementById("abilityName");
const abilityChargesEl = document.getElementById("abilityCharges");
let selectedPokemon = "pikachu";

const COLS = Math.floor(canvas.width / SIZE);
const ROWS = Math.floor(canvas.height / SIZE);
const PAD = 1;
const HEART_COST = 3;
const MAX_GEMS = 3;
let MAX_HEARTS = 3;
const DIAMOND_CHANCE = 0.075;
const DIAMOND_LIFE = 50;
const POWER_ORB_CHANCE = 0.035;
const POWER_ORB_LIFE = 60;

const API_URL = "https://ey7s0l12je.execute-api.eu-central-1.amazonaws.com";
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

function setCookie(name, val) {
  document.cookie = name + "=" + encodeURIComponent(val) + ";path=/;max-age=31536000";
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);
  return "";
}

async function apiFetchLeaderboard() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("HTTP error");
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function apiSubmitScore(entry) {
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry)
    });
    refreshLeaderboardUI();
  } catch (e) {}
}

let currentUsername = getCookie("snake_username") || "Gracz_" + Math.floor(Math.random() * 999);
usernameInput.value = currentUsername;

usernameInput.addEventListener("input", (e) => {
  currentUsername = e.target.value.trim() || "Gracz";
  setCookie("snake_username", currentUsername);
});

function buildSlots(el, svg, n) {
  el.innerHTML = svg.repeat(n);
  return [...el.children];
}
const gemSlotNodes = buildSlots(gemSlotsEl, GEM_SVG, MAX_GEMS);
let heartSlotNodes = buildSlots(heartSlotsEl, HEART_SVG, MAX_HEARTS);

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
    { name: "Raichu", at: 25, body: "#f0a030", dark: "#8b4a14", border: ["#f0a030", "#f4b96e", "#fff"] }
  ],
  bulbasaur: [
    { name: "Bulbasaur", at: 0, body: "#74c9a0", dark: "#3d8b6e", border: ["#74c9a0", "#a8ddc4", "#fff"] },
    { name: "Ivysaur", at: 15, body: "#5cb88a", dark: "#2f6e52", border: ["#5cb88a", "#96d2b5", "#fff"] },
    { name: "Venusaur", at: 40, body: "#3fa06e", dark: "#245c40", border: ["#3fa06e", "#84c3a5", "#fff"] }
  ],
  charmander: [
    { name: "Charmander", at: 0, body: "#f08030", dark: "#c45c18", border: ["#f08030", "#f4ac76", "#fff"] },
    { name: "Charmeleon", at: 15, body: "#e06020", dark: "#a04010", border: ["#e06020", "#ea9361", "#fff"] },
    { name: "Charizard", at: 40, body: "#d35400", dark: "#8e2c00", border: ["#d35400", "#e08953", "#fff"] }
  ],
  squirtle: [
    { name: "Squirtle", at: 0, body: "#5dade2", dark: "#2e86c1", border: ["#5dade2", "#95caec", "#fff"] },
    { name: "Wartortle", at: 15, body: "#3498db", dark: "#1a6fa3", border: ["#3498db", "#7bbce7", "#fff"] },
    { name: "Blastoise", at: 40, body: "#2471a3", dark: "#1a5276", border: ["#2471a3", "#6ba1c5", "#fff"] }
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

const MON_MAP = {};
for (const key in LINES) {
  LINES[key].forEach(mon => {
    MON_MAP[mon.name] = mon;
  });
}

function drawOptionHeads() {
  const originalCtx = ctx;
  document.querySelectorAll(".char-option").forEach(btn => {
    const canvasIcon = btn.querySelector(".char-head");
    if (!canvasIcon) return;
    const pkName = btn.dataset.pokemon;
    const monLine = LINES[pkName];
    if (!monLine) return;
    const mon = monLine[0];
    ctx = canvasIcon.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);
    if (mon && mon.head) {
      ctx.fillStyle = mon.body;
      ctx.fillRect(0, 0, SIZE - 1, SIZE - 1);
      mon.head(0, 0);
    }
  });
  ctx = originalCtx;
}

document.querySelectorAll(".char-option").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".char-option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPokemon = btn.dataset.pokemon;
  });
});

async function refreshLeaderboardUI() {
  const lb = await apiFetchLeaderboard();
  leaderboardList.innerHTML = "";
  const podiumEl = document.getElementById("podiumContainer");
  
  if (lb.length === 0) {
    if (podiumEl) podiumEl.classList.add("hidden");
    leaderboardList.innerHTML = "<li>Brak wyników. Bądź pierwszy!</li>";
    return;
  }
  
  const originalCtx = ctx;
  
  // Render podium (top 3)
  if (podiumEl) {
    podiumEl.classList.remove("hidden");
    
    const renderPodiumStep = (num, entry) => {
      const userEl = document.getElementById("podiumUser" + num);
      const scoreEl = document.getElementById("podiumScore" + num);
      const canvasEl = document.getElementById("podiumCanvas" + num);
      
      if (entry) {
        userEl.textContent = entry.username;
        scoreEl.textContent = entry.score;
        
        ctx = canvasEl.getContext("2d");
        ctx.clearRect(0, 0, SIZE, SIZE);
        const mon = MON_MAP[entry.pokemon];
        if (mon && mon.head) {
          ctx.fillStyle = mon.body;
          ctx.fillRect(0, 0, SIZE - 1, SIZE - 1);
          mon.head(0, 0);
        } else {
          ctx.fillStyle = "#555";
          ctx.fillRect(0, 0, SIZE - 1, SIZE - 1);
        }
      } else {
        userEl.textContent = "---";
        scoreEl.textContent = "---";
        ctx = canvasEl.getContext("2d");
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, SIZE - 1, SIZE - 1);
      }
    };
    
    renderPodiumStep(1, lb[0]);
    renderPodiumStep(2, lb[1]);
    renderPodiumStep(3, lb[2]);
  }
  
  // Render rest of the leaderboard (ranks 4-100)
  const listEntries = lb.slice(3, 100);
  if (listEntries.length === 0) {
    leaderboardList.innerHTML = "<li style='justify-content: center; opacity: 0.6;'>Zagraj, aby zapełnić resztę rankingu!</li>";
  } else {
    listEntries.forEach((entry, idx) => {
      const li = document.createElement("li");
      
      const nameSpan = document.createElement("span");
      nameSpan.innerHTML = `${idx + 4}. <span class="lb-user">${entry.username}</span>`;
      
      const metaSpan = document.createElement("span");
      metaSpan.className = "lb-meta";
      
      const canvasIcon = document.createElement("canvas");
      canvasIcon.width = SIZE;
      canvasIcon.height = SIZE;
      canvasIcon.className = "lb-icon";
      
      ctx = canvasIcon.getContext("2d");
      const mon = MON_MAP[entry.pokemon];
      if (mon && mon.head) {
        ctx.fillStyle = mon.body;
        ctx.fillRect(0, 0, SIZE - 1, SIZE - 1);
        mon.head(0, 0);
      } else {
        ctx.fillStyle = "#555";
        ctx.fillRect(0, 0, SIZE - 1, SIZE - 1);
      }
      
      const scoreSpan = document.createElement("span");
      scoreSpan.className = "lb-score";
      scoreSpan.textContent = entry.score;
      
      metaSpan.appendChild(canvasIcon);
      metaSpan.appendChild(scoreSpan);
      
      li.appendChild(nameSpan);
      li.appendChild(metaSpan);
      leaderboardList.appendChild(li);
    });
  }
  
  ctx = originalCtx;
}

let snake, dir, nextDir, food, diamond, score, alive, playing, tick;
let lineKey, mon, evoFlash;
let gems = 0;
let hearts = 0;
let pops = [];
let scoreSubmitted = false;

let difficulty = "normal";

let abilityUnlocked = false;
let abilityCharges = 0;
let abilityTimer = 0;
let fireballs = [];
let extraFoods = [];
let abilityActive = false;
let shieldTimeLeft = 0;
let speedBoostActive = false;
let speedBoostTimeLeft = 0;
let powerOrb = null;
let screenShake = 0;

function triggerAbility() {
  if (!playing || !alive || !abilityUnlocked || abilityCharges <= 0 || abilityActive) return;
  abilityCharges--;
  
  if (lineKey === "charmander") {
    screenShake = 8;
    fireballs.push({
      x: snake[0].x,
      y: snake[0].y,
      dx: dir.x,
      dy: dir.y,
      life: 25,
      piercing: (mon && mon.name === "Charizard")
    });
    
    for (let i = 0; i < 8; i++) {
      const rx = snake[0].x + (Math.random() - 0.5) * 1.5;
      const ry = snake[0].y + (Math.random() - 0.5) * 1.5;
      addPop("fire", rx, ry);
    }
  } else if (lineKey === "bulbasaur") {
    screenShake = 4;
    const isVenusaur = (mon && mon.name === "Venusaur");
    const count = isVenusaur 
      ? (Math.floor(Math.random() * 2) + 2) // Venusaur spawns 2 to 3
      : (Math.floor(Math.random() * 2) + 1); // Ivysaur spawns 1 to 2
      
    for (let i = 0; i < count; i++) {
      extraFoods.push({ ...getFreePos(), ball: pickBallForAbility(mon ? mon.name : "Ivysaur") });
    }
    
    for (let i = 0; i < 10; i++) {
      const rx = snake[0].x + (Math.random() - 0.5) * 2;
      const ry = snake[0].y + (Math.random() - 0.5) * 2;
      addPop("leaf", rx, ry);
    }
  } else if (lineKey === "squirtle") {
    screenShake = 0;
    abilityActive = true;
    shieldTimeLeft = (mon && mon.name === "Blastoise") ? 40 : 25; // 8s or 5s
    
    for (let i = 0; i < 10; i++) {
      const rx = snake[0].x + (Math.random() - 0.5) * 2;
      const ry = snake[0].y + (Math.random() - 0.5) * 2;
      addPop("bubble", rx, ry);
    }
  } else if (lineKey === "pikachu") {
    screenShake = 2;
    abilityActive = true;
    shieldTimeLeft = 40; // 8 seconds
    
    for (let i = 0; i < 10; i++) {
      const rx = snake[0].x + (Math.random() - 0.5) * 2;
      const ry = snake[0].y + (Math.random() - 0.5) * 2;
      addPop("spark", rx, ry);
    }
  }
  
  updateHUD();
}

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
  } else if (kind === "fire") {
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.bezierCurveTo(-8, -4, -8, 6, 0, 10);
    ctx.bezierCurveTo(8, 6, 8, -4, 0, -10);
    ctx.closePath();
    ctx.fillStyle = "#e67e22";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#f1c40f";
    ctx.fill();
  } else if (kind === "leaf") {
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 4, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = "#2ecc71";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 2.5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = "#27ae60";
    ctx.fill();
  } else if (kind === "bubble") {
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#3498db";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-1.5, -1.5, 1, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  } else if (kind === "spark") {
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4 + Math.random() * 2, -4);
    ctx.lineTo(0, 0);
    ctx.lineTo(4 - Math.random() * 2, 4);
    ctx.stroke();
  } else if (kind === "powerOrb") {
    const time = Date.now() * 0.01;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    const hue = time % 360;
    ctx.fillStyle = `hsl(${hue}, 90%, 60%)`;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-2, -2, 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
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

function pickBallForAbility(stageName) {
  const r = Math.random();
  if (stageName === "Venusaur") {
    if (r < 0.40) return BALLS[0]; // Poké Ball (40%)
    if (r < 0.80) return BALLS[1]; // Great Ball (40%)
    if (r < 0.95) return BALLS[2]; // Ultra Ball (15%)
    return BALLS[3]; // Master Ball (5%)
  } else {
    if (r < 0.90) return BALLS[0]; // Poké Ball (90%)
    return BALLS[1]; // Great Ball (10%)
  }
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
  if (abilityUnlocked) {
    if (abilityActive) {
      abilityChargesEl.textContent = "Aktywna";
      abilityStatEl.style.animation = (shieldTimeLeft < 15) ? "pop 0.3s infinite alternate" : "none";
    } else {
      abilityChargesEl.textContent = abilityCharges;
      abilityStatEl.style.animation = "none";
    }
  }
}

function applyStage() {
  const next = stageFor(score);
  if (mon && next.name !== mon.name) {
    evoFlash = 20;
    if (lineKey === "charmander") {
      if (next.name !== "Charmander" && !abilityUnlocked) {
        abilityUnlocked = true;
        abilityCharges = 3;
        abilityTimer = 0;
        abilityNameEl.textContent = "Ogień";
        abilityStatEl.style.background = "#d35400";
        abilityStatEl.style.borderColor = "#e67e22";
        abilityStatEl.style.color = "#fff";
        abilityStatEl.classList.remove("hidden");
      } else if (next.name === "Charizard" && abilityUnlocked) {
        abilityCharges = Math.min(5, abilityCharges + 2);
      }
    } else if (lineKey === "bulbasaur") {
      if (next.name !== "Bulbasaur" && !abilityUnlocked) {
        abilityUnlocked = true;
        abilityCharges = 3;
        abilityTimer = 0;
        abilityNameEl.textContent = "Nasiona";
        abilityStatEl.style.background = "#27ae60";
        abilityStatEl.style.borderColor = "#2ecc71";
        abilityStatEl.style.color = "#fff";
        abilityStatEl.classList.remove("hidden");
      } else if (next.name === "Venusaur" && abilityUnlocked) {
        abilityCharges = Math.min(5, abilityCharges + 2);
      }
    } else if (lineKey === "squirtle") {
      if (next.name !== "Squirtle" && !abilityUnlocked) {
        abilityUnlocked = true;
        abilityCharges = 2; // Wartortle starts with 2 charges
        abilityTimer = 0;
        abilityNameEl.textContent = "Skorupa";
        abilityStatEl.style.background = "#2980b9";
        abilityStatEl.style.borderColor = "#3498db";
        abilityStatEl.style.color = "#fff";
        abilityStatEl.classList.remove("hidden");
      } else if (next.name === "Blastoise" && abilityUnlocked) {
        abilityCharges = Math.min(3, abilityCharges + 1); // Blastoise cap 3, add 1 on evo
      }
    } else if (lineKey === "pikachu") {
      if (next.name !== "Pikachu" && !abilityUnlocked) {
        abilityUnlocked = true;
        abilityCharges = 4; // Raichu starts with 4 charges
        abilityTimer = 0;
        abilityNameEl.textContent = "Elektro";
        abilityStatEl.style.background = "#f1c40f";
        abilityStatEl.style.borderColor = "#f39c12";
        abilityStatEl.style.color = "#000";
        abilityStatEl.classList.remove("hidden");
      }
    }
  }
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

function getFreePos() {
  let p;
  do {
    p = {
      x: PAD + ((Math.random() * (COLS - PAD * 2)) | 0),
      y: PAD + ((Math.random() * (ROWS - PAD * 2)) | 0),
    };
  } while (
    snake.some((s) => s.x === p.x && s.y === p.y) ||
    (food && food.x === p.x && food.y === p.y) ||
    (diamond && diamond.x === p.x && diamond.y === p.y) ||
    (powerOrb && powerOrb.x === p.x && powerOrb.y === p.y) ||
    (extraFoods && extraFoods.some((ef) => ef.x === p.x && ef.y === p.y))
  );
  return p;
}

function spawnFood() {
  return { ...getFreePos(), ball: pickBall() };
}

function spawnDiamond() {
  return { ...getFreePos(), life: DIAMOND_LIFE };
}

function reset() {
  if (difficulty === "easy") {
    MAX_HEARTS = 4;
    hearts = 4;
  } else if (difficulty === "hard") {
    MAX_HEARTS = 2;
    hearts = 1;
  } else {
    MAX_HEARTS = 3;
    hearts = 1;
  }
  
  heartSlotsEl.innerHTML = HEART_SVG.repeat(MAX_HEARTS);
  heartSlotNodes = [...heartSlotsEl.children];

  snake = [{ x: (COLS / 2) | 0, y: (ROWS / 2) | 0 }];
  dir = nextDir = { x: 1, y: 0 };
  food = spawnFood();
  diamond = null;
  score = 0;
  gems = 0;
  alive = true;
  evoFlash = 0;
  pops = [];
  scoreSubmitted = false;
  
  abilityUnlocked = false;
  abilityCharges = 0;
  abilityTimer = 0;
  fireballs = [];
  extraFoods = [];
  speedBoostActive = false;
  speedBoostTimeLeft = 0;
  powerOrb = null;
  screenShake = 0;
  if (abilityStatEl) {
    abilityStatEl.classList.add("hidden");
  }
  
  applyStage();
  updateHUD();
}

function showMenu() {
  playing = false;
  canvas.classList.add("hidden");
  statusBarEl.classList.add("hidden");
  refreshLeaderboardUI();
  menuEl.classList.remove("hidden");
  const lbEl = document.getElementById("leaderboard");
  if (lbEl) lbEl.classList.remove("hidden");
}

function startGame() {
  lineKey = selectedPokemon;
  canvas.classList.remove("hidden");
  menuEl.classList.add("hidden");
  const lbEl = document.getElementById("leaderboard");
  if (lbEl) lbEl.classList.add("hidden");
  statusBarEl.classList.remove("hidden");
  startBtn.blur();
  reset();
  playing = true;
}

startBtn.addEventListener("click", startGame);

function revive() {
  hearts--;
  snake = [{ x: (COLS / 2) | 0, y: (ROWS / 2) | 0 }];
  dir = nextDir = { x: 1, y: 0 };
  if (gems >= HEART_COST && hearts < MAX_HEARTS) {
    buyHeart();
  } else {
    updateHUD();
  }
}

function handleGameOver() {
  alive = false;
  if (!scoreSubmitted && score > 0) {
    scoreSubmitted = true;
    apiSubmitScore({
      username: currentUsername,
      score: score,
      pokemon: mon.name,
      date: Date.now()
    });
  }
}

function getPoints(basePoints) {
  let mult = 1.5;
  if (difficulty === "easy") mult = 1.0;
  else if (difficulty === "hard") mult = 2.5;
  
  return Math.round(basePoints * mult * (speedBoostActive ? 2 : 1));
}

function step() {
  if (!playing || !alive) return;
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  let wallHit = (head.x < PAD || head.x >= COLS - PAD || head.y < PAD || head.y >= ROWS - PAD);
  let selfHit = snake.some((s) => s.x === head.x && s.y === head.y);
  
  if (wallHit && abilityActive && shieldTimeLeft > 0) {
    if (head.x < PAD) head.x = COLS - PAD - 1;
    else if (head.x >= COLS - PAD) head.x = PAD;
    
    if (head.y < PAD) head.y = ROWS - PAD - 1;
    else if (head.y >= ROWS - PAD) head.y = PAD;
    
    selfHit = snake.some((s) => s.x === head.x && s.y === head.y);
    wallHit = false;
  }
  
  if (wallHit || selfHit) {
    if (hearts > 1) revive();
    else handleGameOver();
    return;
  }

  snake.unshift(head);

  // Magnet pull effect for Pikachu
  if (lineKey === "pikachu" && abilityActive && shieldTimeLeft > 0) {
    if (food) {
      const dx = Math.sign(head.x - food.x);
      const dy = Math.sign(head.y - food.y);
      food.x += dx;
      food.y += dy;
    }
    extraFoods.forEach(ef => {
      const dx = Math.sign(head.x - ef.x);
      const dy = Math.sign(head.y - ef.y);
      ef.x += dx;
      ef.y += dy;
    });
  }

  let ateFood = false;

  if (diamond && head.x === diamond.x && head.y === diamond.y) {
    if (gems < MAX_GEMS) {
      gems++;
      pulseSlot(gemSlotNodes, gems - 1);
      addPop("gem", diamond.x, diamond.y);
    }
    if (gems >= HEART_COST && hearts < MAX_HEARTS) {
      buyHeart();
    }
    diamond = null;
    updateHUD();
  }

  if (head.x === food.x && head.y === food.y) {
    const earned = getPoints(food.ball.points);
    score += earned;
    applyStage();
    updateHUD();
    food = spawnFood();
    ateFood = true;
    
    if (!diamond && Math.random() < DIAMOND_CHANCE && gems < MAX_GEMS) {
      diamond = spawnDiamond();
    }
    
    if (!powerOrb && Math.random() < POWER_ORB_CHANCE) {
      powerOrb = { ...getFreePos(), life: POWER_ORB_LIFE };
    }
  }

  // Collision with extraFoods
  for (let i = extraFoods.length - 1; i >= 0; i--) {
    const ef = extraFoods[i];
    if (head.x === ef.x && head.y === ef.y) {
      const earned = getPoints(ef.ball.points);
      score += earned;
      applyStage();
      updateHUD();
      extraFoods.splice(i, 1);
      ateFood = true;
      break;
    }
  }

  // Collision with powerOrb
  if (powerOrb && head.x === powerOrb.x && head.y === powerOrb.y) {
    speedBoostActive = true;
    speedBoostTimeLeft = 171; // 30 seconds at 175ms ticks
    powerOrb = null;
    addPop("gem", head.x, head.y);
    updateHUD();
  }

  if (!ateFood) {
    snake.pop();
  }

  if (diamond) {
    diamond.life--;
    if (diamond.life <= 0) diamond = null;
  }

  if (powerOrb) {
    powerOrb.life--;
    if (powerOrb.life <= 0) powerOrb = null;
  }

  // Update fireballs
  for (let i = fireballs.length - 1; i >= 0; i--) {
    const fb = fireballs[i];
    let hit = false;
    
    // Check range helper: 3x3 (1 block around) for Charizard's piercing fireballs, 1x1 for others
    const inRange = (targetX, targetY) => {
      if (fb.piercing) {
        return Math.abs(fb.x - targetX) <= 1 && Math.abs(fb.y - targetY) <= 1;
      }
      return fb.x === targetX && fb.y === targetY;
    };
    
    for (let step = 0; step < 3; step++) {
      fb.x += fb.dx;
      fb.y += fb.dy;
      fb.life--;

      // Boundary check
      if (fb.x < PAD || fb.x >= COLS - PAD || fb.y < PAD || fb.y >= ROWS - PAD || fb.life <= 0) {
        fireballs.splice(i, 1);
        hit = true;
        break;
      }

      // Collision with food
      if (food && inRange(food.x, food.y)) {
        const earned = getPoints(food.ball.points);
        score += earned;
        applyStage();
        updateHUD();
        food = spawnFood();
        for (let p = 0; p < 6; p++) {
          addPop("fire", fb.x + (Math.random() - 0.5), fb.y + (Math.random() - 0.5));
        }
        if (!fb.piercing) {
          fireballs.splice(i, 1);
          hit = true;
          break;
        }
      }

      // Collision with extraFoods
      for (let j = extraFoods.length - 1; j >= 0; j--) {
        const ef = extraFoods[j];
        if (inRange(ef.x, ef.y)) {
          const earned = getPoints(ef.ball.points);
          score += earned;
          applyStage();
          updateHUD();
          extraFoods.splice(j, 1);
          for (let p = 0; p < 6; p++) {
            addPop("fire", fb.x + (Math.random() - 0.5), fb.y + (Math.random() - 0.5));
          }
          if (!fb.piercing) {
            fireballs.splice(i, 1);
            hit = true;
            break;
          }
        }
      }
      if (hit) break;

      // Collision with diamond
      if (diamond && inRange(diamond.x, diamond.y)) {
        if (gems < MAX_GEMS) {
          gems++;
          pulseSlot(gemSlotNodes, gems - 1);
          addPop("gem", diamond.x, diamond.y);
        }
        if (gems >= HEART_COST && hearts < MAX_HEARTS) {
          buyHeart();
        }
        diamond = null;
        updateHUD();
        for (let p = 0; p < 6; p++) {
          addPop("fire", fb.x + (Math.random() - 0.5), fb.y + (Math.random() - 0.5));
        }
        if (!fb.piercing) {
          fireballs.splice(i, 1);
          hit = true;
          break;
        }
      }
    }
  }

  if (speedBoostActive) {
    speedBoostTimeLeft--;
    if (speedBoostTimeLeft <= 0) {
      speedBoostActive = false;
    }
  }

  // Regen charges: customized per pokemon line to balance defensive vs offensive abilities
  let maxCharges = 3;
  let regenTicks = 150; // 30s default
  
  if (lineKey === "squirtle") {
    if (mon && mon.name === "Blastoise") {
      maxCharges = 3;
      regenTicks = 150; // 30s for Blastoise
    } else {
      maxCharges = 2;
      regenTicks = 200; // 40s for Wartortle
    }
  } else if (lineKey === "charmander") {
    if (mon && mon.name === "Charizard") {
      maxCharges = 5;
      regenTicks = 100; // 20s
    } else {
      maxCharges = 3;
      regenTicks = 150; // 30s
    }
  } else if (lineKey === "bulbasaur") {
    if (mon && mon.name === "Venusaur") {
      maxCharges = 5;
      regenTicks = 100; // 20s
    } else {
      maxCharges = 3;
      regenTicks = 150; // 30s
    }
  } else if (lineKey === "pikachu") {
    if (mon && mon.name === "Raichu") {
      maxCharges = 4;
      regenTicks = 200; // Increased cooldown (~35s)
    } else {
      maxCharges = 3;
      regenTicks = 250; // Increased cooldown (~44s)
    }
  }

  if (abilityUnlocked && abilityCharges < maxCharges) {
    abilityTimer++;
    if (abilityTimer >= regenTicks) {
      abilityCharges++;
      abilityTimer = 0;
      updateHUD();
    }
  }

  if (abilityActive) {
    shieldTimeLeft--;
    if (shieldTimeLeft <= 0) {
      abilityActive = false;
    }
    updateHUD();
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

  ctx.save();
  if (screenShake > 0) {
    const dx = (Math.random() - 0.5) * 8;
    const dy = (Math.random() - 0.5) * 8;
    ctx.translate(dx, dy);
    screenShake--;
  }

  // Draw fireballs
  fireballs.forEach(fb => {
    ctx.save();
    const fbx = fb.x * SIZE + SIZE / 2;
    const fby = fb.y * SIZE + SIZE / 2;
    const radius = fb.piercing ? (SIZE + 6) : (SIZE / 2 + 4);
    const grad = ctx.createRadialGradient(fbx, fby, 2, fbx, fby, radius);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.2, '#f1c40f');
    grad.addColorStop(0.6, '#e67e22');
    grad.addColorStop(1, 'rgba(231, 76, 60, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fbx, fby, radius, 0, Math.PI * 2);
    ctx.fill();
    
    const trailCount = fb.piercing ? 8 : 4;
    for (let p = 0; p < trailCount; p++) {
      const scale = fb.piercing ? 0.25 : 0.35;
      const tx = fbx - fb.dx * SIZE * (p * scale) + (Math.random() - 0.5) * (fb.piercing ? 12 : 6);
      const ty = fby - fb.dy * SIZE * (p * scale) + (Math.random() - 0.5) * (fb.piercing ? 12 : 6);
      ctx.fillStyle = p % 2 === 0 ? '#e67e22' : '#f1c40f';
      ctx.beginPath();
      ctx.arc(tx, ty, (trailCount - p) * (fb.piercing ? 2 : 1.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  const fx = food.x * SIZE;
  const fy = food.y * SIZE;
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

  // Draw extra foods
  extraFoods.forEach(ef => {
    const ex = ef.x * SIZE;
    const ey = ef.y * SIZE;
    const eball = ef.ball;
    ctx.fillStyle = eball.top;
    ctx.fillRect(ex, ey, SIZE - 1, (SIZE - 1) / 2);
    ctx.fillStyle = "#eee";
    ctx.fillRect(ex, ey + (SIZE - 1) / 2, SIZE - 1, (SIZE - 1) / 2);
    if (eball.stripe) {
      ctx.fillStyle = eball.stripe;
      ctx.fillRect(ex + 2, ey + 2, SIZE - 5, 3);
    }
    ctx.fillStyle = "#111";
    ctx.fillRect(ex, ey + SIZE / 2 - 1, SIZE - 1, 2);
    ctx.fillRect(ex + SIZE / 2 - 2, ey + SIZE / 2 - 2, 4, 4);
  });

  // Draw electrical bolts for Pikachu
  if (lineKey === "pikachu" && abilityActive && alive) {
    ctx.save();
    ctx.strokeStyle = "#f1c40f";
    ctx.shadowColor = "#f39c12";
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.8;

    const targets = [food, ...extraFoods];
    targets.forEach(target => {
      if (!target) return;
      ctx.beginPath();
      ctx.moveTo(snake[0].x * SIZE + SIZE / 2, snake[0].y * SIZE + SIZE / 2);
      
      let cx = snake[0].x * SIZE + SIZE / 2;
      let cy = snake[0].y * SIZE + SIZE / 2;
      const tx = target.x * SIZE + SIZE / 2;
      const ty = target.y * SIZE + SIZE / 2;
      
      for (let i = 1; i <= 5; i++) {
        const t = i / 5;
        const offset = (i === 5) ? 0 : (Math.random() - 0.5) * 16;
        const targetX = cx + (tx - cx) * t + offset;
        const targetY = cy + (ty - cy) * t + offset;
        ctx.lineTo(targetX, targetY);
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  if (diamond) {
    if (diamond.life > 15 || diamond.life % 4 > 1) {
      drawIcon("gem", diamond.x * SIZE + SIZE / 2, diamond.y * SIZE + SIZE / 2, 0.85);
    }
  }

  if (powerOrb) {
    if (powerOrb.life > 15 || powerOrb.life % 4 > 1) {
      drawIcon("powerOrb", powerOrb.x * SIZE + SIZE / 2, powerOrb.y * SIZE + SIZE / 2, 0.9);
    }
  }

  snake.forEach((s, i) => {
    const x = s.x * SIZE;
    const y = s.y * SIZE;
    const isHead = i === 0;
    const isTail = i === snake.length - 1;

    ctx.fillStyle = alive ? mon.body : "#555";
    ctx.fillRect(x, y, SIZE - 1, SIZE - 1);
    
    if (abilityActive && alive) {
      ctx.strokeStyle = (shieldTimeLeft < 15 && Math.floor(Date.now() / 150) % 2 === 0) ? "#e74c3c" : "#3498db";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, SIZE - 1, SIZE - 1);
    }
    
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

  if (speedBoostActive && alive) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(PAD * SIZE, 4, (COLS - PAD * 2) * SIZE, 6);
    const timeRatio = speedBoostTimeLeft / 171;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#ff007f");
    gradient.addColorStop(0.5, "#ffea00");
    gradient.addColorStop(1, "#00e5ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(PAD * SIZE, 4, (COLS - PAD * 2) * SIZE * timeRatio, 6);
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "right";
    ctx.fillText("BOOST 2x", (COLS - PAD) * SIZE - 4, 22);
  }

  ctx.restore();
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
  if (e.key === " ") {
    e.preventDefault();
    if (!alive) {
      showMenu();
    } else {
      triggerAbility();
    }
    return;
  }
  const d = map[e.key];
  if (d) {
    e.preventDefault();
    setDir(d);
  }
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
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
      triggerAbility();
      return;
    }
    const d =
      Math.abs(dx) > Math.abs(dy)
        ? { x: dx > 0 ? 1 : -1, y: 0 }
        : { x: 0, y: dy > 0 ? 1 : -1 };
    setDir(d);
  },
  { passive: true }
);

canvas.addEventListener("click", () => {
  if (playing && alive) {
    triggerAbility();
  }
});

selectedPokemon = "pikachu";
lineKey = selectedPokemon;
reset();
playing = false;
canvas.classList.add("hidden");
draw();
drawOptionHeads();
refreshLeaderboardUI();

if (abilityStatEl) {
  abilityStatEl.addEventListener("click", triggerAbility);
}

document.querySelectorAll(".diff-option").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".diff-option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    difficulty = btn.dataset.diff;
  });
});

function gameLoop() {
  step();
  draw();
  
  let baseSpeed = 175;
  let minSpeed = 110;
  let speedBoostSpeed = 110;
  let decayFactor = 1.2;
  
  if (difficulty === "easy") {
    baseSpeed = 220;
    minSpeed = 150;
    speedBoostSpeed = 140;
    decayFactor = 1.5;
  } else if (difficulty === "hard") {
    baseSpeed = 130;
    minSpeed = 80;
    speedBoostSpeed = 80;
    decayFactor = 1.0;
  }
  
  const speedWithoutBoost = Math.max(minSpeed, baseSpeed - score * decayFactor);
  const currentSpeed = speedBoostActive ? speedBoostSpeed : speedWithoutBoost;
  
  tick = setTimeout(gameLoop, currentSpeed);
}
gameLoop();