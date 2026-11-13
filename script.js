
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = 600;
const H = 600;
const WORLD = 1200;

let player, car, police, moneyBags;
let keys = {};
let inCar = false;
let health = 100;
let money = 0;
let wanted = 0;
let gameOver = false;
let missionComplete = false;
let lastHit = 0;
let lastWanted = 0;
let message = "Explore the city and collect money!";
let camera = { x: 0, y: 0 };

const buildings = [
  {x:40,y:40,w:150,h:130},
  {x:290,y:40,w:180,h:130},
  {x:680,y:40,w:180,h:130},
  {x:970,y:40,w:180,h:130},

  {x:40,y:330,w:150,h:160},
  {x:290,y:330,w:180,h:160},
  {x:680,y:330,w:180,h:160},
  {x:970,y:330,w:180,h:160},

  {x:40,y:680,w:150,h:160},
  {x:290,y:680,w:180,h:160},
  {x:680,y:680,w:180,h:160},
  {x:970,y:680,w:180,h:160},

  {x:40,y:970,w:150,h:160},
  {x:290,y:970,w:180,h:160},
  {x:680,y:970,w:180,h:160},
  {x:970,y:970,w:180,h:160}
];

function resetGame() {
  player = { x: 225, y: 225, w: 20, h: 20 };

  car = { x: 270, y: 220, w: 42, h: 24 };

  police = { x: 800, y: 800, w: 30, h: 30 };

  moneyBags = [
    {x:220,y:500,taken:false},
    {x:500,y:220,taken:false},
    {x:800,y:220,taken:false},
    {x:1000,y:500,taken:false},
    {x:500,y:800,taken:false},
    {x:800,y:1000,taken:false},
    {x:220,y:800,taken:false}
  ];

  health = 100;
  money = 0;
  wanted = 0;
  inCar = false;
  gameOver = false;
  missionComplete = false;
  lastHit = 0;
  lastWanted = 0;
  keys = {};

  message = "Collect 5 money bags to complete your mission!";
  updateUI();
}

function updateUI() {
  document.getElementById("health").textContent = health;
  document.getElementById("money").textContent = money;
  document.getElementById("wanted").textContent =
    "★".repeat(wanted) + "☆".repeat(5-wanted);

  document.getElementById("vehicle").textContent =
    inCar ? "🚗 Driving" : "🚶 On Foot";

  document.getElementById("mission").textContent =
    missionComplete
    ? "Mission completed! You are a city legend! 🏆"
    : "Collect 5 money bags (" +
      Math.min(5, money / 100) + "/5)";
}

function blocked(x, y, w, h) {
  if (x < 0 || y < 0 || x+w > WORLD || y+h > WORLD) {
    return true;
  }

  return buildings.some(b =>
    x < b.x+b.w &&
    x+w > b.x &&
    y < b.y+b.h &&
    y+h > b.y
  );
}

function move(dx, dy) {
  if (gameOver) return;

  let obj = inCar ? car : player;
  let speed = inCar ? 5 : 3;

  let nx = obj.x + dx * speed;
  let ny = obj.y + dy * speed;

  if (!blocked(nx, obj.y, obj.w, obj.h)) {
    obj.x = nx;
  }

  if (!blocked(obj.x, ny, obj.w, obj.h)) {
    obj.y = ny;
  }

  if (inCar && (dx !== 0 || dy !== 0)) {
    if (wanted === 0) {
      wanted = 1;
      message = "Police noticed your car! Escape!";
    }
  }
}

function interact() {
  if (gameOver) return;

  if (!inCar) {
    let d = Math.hypot(
      player.x - car.x,
      player.y - car.y
    );

    if (d < 65) {
      inCar = true;
      player.x = car.x;
      player.y = car.y;
      message = "You entered the car! Drive!";
    } else {
      message = "Get closer to the red car!";
    }
  } else {
    inCar = false;
    player.x = car.x + 48;
    player.y = car.y;

    if (blocked(player.x, player.y, player.w, player.h)) {
      player.x = car.x - 25;
      player.y = car.y;
    }

    message = "You exited the car!";
  }

  updateUI();
}

function collectMoney() {
  const obj = inCar ? car : player;

  moneyBags.forEach(bag => {
    if (bag.taken) return;

    let d = Math.hypot(
      obj.x - bag.x,
      obj.y - bag.y
    );

    if (d < 27) {
      bag.taken = true;
      money += 100;
      message = "💰 You collected $100!";

      if (money >= 500 && !missionComplete) {
        missionComplete = true;
        message = "🏆 Mission Complete! You earned $500+!";
      }

      updateUI();
    }
  });
}

function updatePolice() {
  if (wanted <= 0 || gameOver) return;

  let target = inCar ? car : player;

  let dx = target.x - police.x;
  let dy = target.y - police.y;
  let distance = Math.hypot(dx, dy);

  if (distance > 1) {
    let speed = 1.15 + wanted * 0.25;
    let nx = police.x + (dx/distance) * speed;
    let ny = police.y + (dy/distance) * speed;

    if (!blocked(nx, police.y, police.w, police.h)) {
      police.x = nx;
    }

    if (!blocked(police.x, ny, police.w, police.h)) {
      police.y = ny;
    }
  }

  if (distance < 35) {
    let now = Date.now();

    if (now - lastHit > 1000) {
      health -= inCar ? 5 : 10;
      lastHit = now;
      message = "🚨 Police caught you! Escape!";

      if (health <= 0) {
        health = 0;
        gameOver = true;
        message = "GAME OVER! Press Restart.";
      }

      updateUI();
    }
  }
}

function updateWanted() {
  if (wanted > 0 && !gameOver) {
    let now = Date.now();

    if (now - lastWanted > 30000) {
      wanted--;
      lastWanted = now;

      message = wanted === 0
        ? "You escaped the police!"
        : "Police search is cooling down!";

      updateUI();
    }
  }
}

function drawRoads() {
  ctx.fillStyle = "#527c45";
  ctx.fillRect(0, 0, WORLD, WORLD);

  // Main horizontal roads
  ctx.fillStyle = "#42464b";
  ctx.fillRect(0, 200, WORLD, 100);
  ctx.fillRect(0, 550, WORLD, 100);
  ctx.fillRect(0, 900, WORLD, 100);

  // Main vertical roads
  ctx.fillRect(200, 0, 100, WORLD);
  ctx.fillRect(550, 0, 100, WORLD);
  ctx.fillRect(900, 0, 100, WORLD);

  // Road markings
  ctx.strokeStyle = "#f8dc72";
  ctx.lineWidth = 3;
  ctx.setLineDash([20,20]);

  [250,600,950].forEach(y => {
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(WORLD,y);
    ctx.stroke();
  });

  [250,600,950].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,WORLD);
    ctx.stroke();
  });

  ctx.setLineDash([]);
}

function drawBuildings() {
  buildings.forEach((b,i) => {
    ctx.fillStyle = "#b3a18a";
    ctx.fillRect(b.x,b.y,b.w,b.h);

    ctx.fillStyle = i%2 === 0 ? "#766c63" : "#555e70";
    ctx.fillRect(b.x+8,b.y+8,b.w-16,b.h-16);

    // Windows
    ctx.fillStyle = "#8bdcff";

    for(let x=b.x+18; x<b.x+b.w-15; x+=35) {
      for(let y=b.y+18; y<b.y+b.h-15; y+=35) {
        ctx.fillRect(x,y,14,14);
      }
    }
  });
}

function drawMoney() {
  moneyBags.forEach(bag => {
    if (bag.taken) return;

    ctx.fillStyle = "#ffca28";
    ctx.beginPath();
    ctx.arc(bag.x,bag.y,11,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle = "#523600";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("$",bag.x,bag.y+5);
  });
}

function drawCar() {
  ctx.fillStyle = "#e53935";
  ctx.fillRect(car.x,car.y,car.w,car.h);

  ctx.fillStyle = "#171717";
  ctx.fillRect(car.x+8,car.y+3,12,18);
  ctx.fillRect(car.x+26,car.y+3,10,18);

  ctx.fillStyle = "#fff";
  ctx.fillRect(car.x+2,car.y+3,4,5);
  ctx.fillRect(car.x+36,car.y+3,4,5);
}

function drawPlayer() {
  if (inCar) return;

  ctx.fillStyle = "#00cfff";
  ctx.fillRect(player.x,player.y,player.w,player.h);

  ctx.fillStyle = "#fff";
  ctx.fillRect(player.x+4,player.y+4,4,4);
  ctx.fillRect(player.x+12,player.y+4,4,4);
}

function drawPolice() {
  if (wanted <= 0) return;

  ctx.fillStyle = "#164bdb";
  ctx.fillRect(police.x,police.y,police.w,police.h);

  ctx.fillStyle = "#ff3030";
  ctx.fillRect(police.x+3,police.y-5,10,6);

  ctx.fillStyle = "#fff";
  ctx.fillRect(police.x+16,police.y-5,10,6);
}

function drawWorld() {
  let target = inCar ? car : player;

  camera.x = Math.max(0,Math.min(WORLD-W,
    target.x + target.w/2 - W/2));

  camera.y = Math.max(0,Math.min(WORLD-H,
    target.y + target.h/2 - H/2));

  ctx.save();
  ctx.translate(-camera.x,-camera.y);

  drawRoads();
  drawBuildings();
  drawMoney();
  drawCar();
  drawPolice();
  drawPlayer();

  ctx.restore();
}

function gameLoop() {
  if (!gameOver) {
    let dx = 0;
    let dy = 0;

    if (keys.up) dy--;
    if (keys.down) dy++;
    if (keys.left) dx--;
    if (keys.right) dx++;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    if (dx !== 0 || dy !== 0) {
      move(dx,dy);
    }

    collectMoney();
    updatePolice();
    updateWanted();
  }

  drawWorld();

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = "#ff4444";
    ctx.textAlign = "center";
    ctx.font = "bold 40px Arial";
    ctx.fillText("GAME OVER",W/2,H/2);

    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Press Restart to Play Again",W/2,H/2+40);
  }

  requestAnimationFrame(gameLoop);
}

// Keyboard controls
document.addEventListener("keydown",e => {
  const k = e.key.toLowerCase();

  if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) {
    e.preventDefault();
  }

  if (k === "arrowup" || k === "w") keys.up = true;
  if (k === "arrowdown" || k === "s") keys.down = true;
  if (k === "arrowleft" || k === "a") keys.left = true;
  if (k === "arrowright" || k === "d") keys.right = true;

  if (k === "e" && !e.repeat) interact();
});

document.addEventListener("keyup",e => {
  const k = e.key.toLowerCase();

  if (k === "arrowup" || k === "w") keys.up = false;
  if (k === "arrowdown" || k === "s") keys.down = false;
  if (k === "arrowleft" || k === "a") keys.left = false;
  if (k === "arrowright" || k === "d") keys.right = false;
});

document.querySelectorAll("[data-key]").forEach(btn => {
  const key = btn.dataset.key;

  btn.addEventListener("pointerdown",e => {
    e.preventDefault();
    keys[key] = true;
    btn.setPointerCapture(e.pointerId);
  });

  ["pointerup","pointercancel","lostpointercapture"].forEach(event => {
    btn.addEventListener(event,() => {
      keys[key] = false;
    });
  });
});

document.getElementById("actionBtn")
  .addEventListener("click",interact);

document.getElementById("restartBtn")
  .addEventListener("click",resetGame);

resetGame();
gameLoop();
