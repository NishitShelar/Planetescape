const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 500;

const keys = [];
let civilians = [];
let zombies = [];
let score = { eaten: 0, saved: 0, lost: 0 };

let gameTime = 0;
let zombieSpawnRate = 0.01; // difficulty scaling

// ================= PLAYER =================
const player = {
  x: 200,
  y: 300,
  width: 45,
  height: 85,
  frameX: 0,
  frameY: 0,
  speed: 9,
  moving: false,
};

const playerConfig = { spriteW: 32, spriteH: 64 };
const playerSprite = new Image();
playerSprite.src = "npc-nordic-shieldmaiden1.png";

// ================= SPRITE CONFIG =================
const civilianConfig = { spriteW: 32, spriteH: 32, row: 3 };
const enemyConfig = {
  spriteW: 32,
  spriteH: 32,
  rows: { down: 0, left: 1, up: 3 },
};

const background = new Image();
background.src = "background1.png";

// ================= SPRITE LISTS =================
const peopleFiles = [
  "Female 10-1.png",
  "Female 12-1.png",
  "Female 16-2.png",
  "Female 18-4.png",
  "Female 04-1.png",
  "Male 14-3.png",
  "Soldier 07-1.png",
  "Soldier 01-4.png",
  "pipo-charachip_otaku01.png",
  "pien.png",
  "pipo-xmaschara04.png",
  "pipo-xmaschara01.png",
];
const enemyFiles = [
  "Enemy 01-1.png",
  "Enemy 03-1.png",
  "Enemy 04-1.png",
  "Enemy 05-1.png",
  "Enemy 07-1.png",
  "Enemy 08-1.png",
  "Enemy 13-1.png",
  "Enemy 15-1.png",
  "Enemy 19.png",
  "Enemy 22.png",
];

const peopleSprites = [];
const enemySprites = [];

// preload helper
function preloadImages(path, files, targetArray) {
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.src = path + file;
          img.onload = () => {
            targetArray.push(img);
            resolve();
          };
          img.onerror = () => reject("Failed to load " + img.src);
        })
    )
  );
}

// preload both sets
Promise.all([
  preloadImages("sprites/people/", peopleFiles, peopleSprites),
  preloadImages("sprites/enemy/", enemyFiles, enemySprites),
])
  .then(() => {
    console.log("✅ All sprites loaded!");
    startAnimating(30);
  })
  .catch((err) => console.error(err));

function drawSprite(img, sX, sY, sW, sH, dX, dY, dW, dH) {
  ctx.drawImage(img, sX, sY, sW, sH, dX, dY, dW, dH);
}

// ================= INPUT =================
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  player.moving = true;
});
window.addEventListener("keyup", (e) => {
  delete keys[e.key];
  player.moving = false;
});

// ================= PLAYER =================
function movePlayer() {
  if (keys["ArrowUp"] && player.y > 0) {
    player.y -= player.speed;
    player.frameY = 3;
    player.moving = true;
  }
  if (keys["ArrowDown"] && player.y < canvas.height - player.height) {
    player.y += player.speed;
    player.frameY = 0;
    player.moving = true;
  }
  if (keys["ArrowLeft"] && player.x > 0) {
    player.x -= player.speed;
    player.frameY = 1;
    player.moving = true;
  }
  if (keys["ArrowRight"] && player.x < canvas.width - player.width) {
    player.x += player.speed;
    player.frameY = 2;
    player.moving = true;
  }
}

function handlePlayerFrame() {
  player.frameX = player.moving ? (player.frameX + 1) % 4 : 0;
}

// ================= CIVILIAN =================
class Civilian {
  constructor() {
    this.x = 40 + Math.random() * 30;
    this.y = canvas.height;
    this.width = 30;
    this.height = 50;
    this.speed = 2 + Math.random();
    this.frameX = 0;
    this.sprite =
      peopleSprites[Math.floor(Math.random() * peopleSprites.length)];
  }
  update() {
    this.y -= this.speed;
    this.frameX = (this.frameX + 1) % 3;
  }
  draw() {
    if (!this.sprite || !this.sprite.complete) return;
    ctx.drawImage(
      this.sprite,
      this.frameX * civilianConfig.spriteW,
      civilianConfig.row * civilianConfig.spriteH,
      civilianConfig.spriteW,
      civilianConfig.spriteH,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

// ================= ZOMBIE =================
class Zombie {
  constructor() {
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - 60);
    this.width = 40;
    this.height = 60;
    this.baseSpeed = 2;
    this.frameX = 0;
    this.frameY = enemyConfig.rows.left;
    this.sprite = enemySprites[Math.floor(Math.random() * enemySprites.length)];

    this.isRunningAway = false;
    this.runDir = 0;
    this.runDistance = 0;
    this.maxRunDistance = 80;
  }

  update(player) {
    this.x -= this.baseSpeed;
    this.frameY = enemyConfig.rows.left;

    if (this.isRunningAway) {
      this.y += this.runDir * 4;
      this.runDistance += Math.abs(this.runDir * 4);
      this.frameY = this.runDir < 0 ? enemyConfig.rows.up : enemyConfig.rows.down;

      if (this.runDistance >= this.maxRunDistance) this.isRunningAway = false;
    } else {
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      if (Math.abs(dx) < 120 && Math.abs(dy) < 60) {
        this.isRunningAway = true;
        this.runDir = dy > 0 ? 1 : -1;
        this.runDistance = 0;
      }
    }

    if (this.y < 0) this.y = 0;
    if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;

    this.frameX = (this.frameX + 1) % 3;
  }

  draw() {
    if (!this.sprite || !this.sprite.complete) return;
    ctx.drawImage(
      this.sprite,
      this.frameX * enemyConfig.spriteW,
      this.frameY * enemyConfig.spriteH,
      enemyConfig.spriteW,
      enemyConfig.spriteH,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

// ================= HELPERS =================
function collision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// ================= GAME LOOP =================
let fps, fpsInterval, startTime, now, then, elapsed;

function startAnimating(fps) {
  fpsInterval = 1000 / fps;
  then = Date.now();
  startTime = then;
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  now = Date.now();
  elapsed = now - then;
  if (elapsed > fpsInterval) {
    then = now - (elapsed % fpsInterval);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    drawSprite(
      playerSprite,
      playerConfig.spriteW * player.frameX,
      playerConfig.spriteH * player.frameY,
      playerConfig.spriteW,
      playerConfig.spriteH,
      player.x,
      player.y,
      player.width,
      player.height
    );

    movePlayer();
    handlePlayerFrame();

    civilians.forEach((c, ci) => {
      c.update();
      c.draw();
      if (c.y < 50 && c.x < 100) {
        civilians.splice(ci, 1);
        score.saved++;
      }
      zombies.forEach((z) => {
        if (collision(c, z)) {
          civilians.splice(ci, 1);
          score.eaten++;
        }
      });
    });

    zombies.forEach((z, zi) => {
      z.update(player);
      z.draw();
      if (collision(player, z)) zombies.splice(zi, 1);
      if (z.x < 0) {
        zombies.splice(zi, 1);
        score.eaten++;
      }
    });

    gameTime += elapsed;
    if (gameTime > 10000) {
      zombieSpawnRate += 0.002;
      gameTime = 0;
    }

    if (Math.random() < 0.02) civilians.push(new Civilian());
    if (Math.random() < zombieSpawnRate) zombies.push(new Zombie());

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Eaten: " + score.eaten, canvas.width - 150, 30);
    ctx.fillText("Saved: " + score.saved, canvas.width - 150, 55);
    ctx.fillText("Lost: " + score.lost, canvas.width - 150, 80);
  }
}

// ================= MOBILE CONTROLS =================
function pressKey(key, isDown) {
  if (isDown) {
    keys[key] = true;
    player.moving = true;
    switch (key) {
      case "ArrowUp":
        player.frameY = 3;
        break;
      case "ArrowDown":
        player.frameY = 0;
        break;
      case "ArrowLeft":
        player.frameY = 1;
        break;
      case "ArrowRight":
        player.frameY = 2;
        break;
    }
  } else {
    delete keys[key];
    player.moving =
      keys["ArrowUp"] || keys["ArrowDown"] || keys["ArrowLeft"] || keys["ArrowRight"] || false;
  }
}

["up", "down", "left", "right"].forEach((dir) => {
  document.getElementById(dir).addEventListener("touchstart", () =>
    pressKey("Arrow" + dir[0].toUpperCase() + dir.slice(1), true)
  );
  document.getElementById(dir).addEventListener("touchend", () =>
    pressKey("Arrow" + dir[0].toUpperCase() + dir.slice(1), false)
  );
});

// ================= LANDING / FULLSCREEN =================
const gameContainer = document.getElementById("gameContainer");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const startBtn = document.getElementById("startBtn");
const landing = document.getElementById("landing");

fullscreenBtn.addEventListener("click", () => {
  if (gameContainer.requestFullscreen) gameContainer.requestFullscreen();
  else if (gameContainer.webkitRequestFullscreen) gameContainer.webkitRequestFullscreen();
  else if (gameContainer.msRequestFullscreen) gameContainer.msRequestFullscreen();
});

startBtn.addEventListener("click", async () => {
  // fullscreen
  if (gameContainer.requestFullscreen) gameContainer.requestFullscreen();
  else if (gameContainer.webkitRequestFullscreen) gameContainer.webkitRequestFullscreen();
  else if (gameContainer.msRequestFullscreen) gameContainer.msRequestFullscreen();

  // orientation lock (if supported)
  if (screen.orientation && screen.orientation.lock) {
    try {
      await screen.orientation.lock("landscape");
    } catch (err) {
      console.log("Orientation lock failed:", err);
    }
  }

  // hide landing
  landing.style.display = "none";
  gameContainer.style.display = "block";
});

// start loop immediately (sprites handle preload)
startAnimating(30);
