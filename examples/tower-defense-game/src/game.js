import { COLS, ROWS, CELL, isPathCell, inBounds, drawMap } from "./map.js";
import { Enemy } from "./enemies.js";
import { Tower, TOWER_TYPES } from "./towers.js";
import { buildWave, TOTAL_WAVES } from "./waves.js";

const STARTING_GOLD = 150;
const STARTING_LIVES = 20;

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;

    this.gold = STARTING_GOLD;
    this.lives = STARTING_LIVES;
    this.waveNumber = 0;
    this.totalWaves = TOTAL_WAVES;

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];

    this.selectedTowerType = "archer";
    this.selectedTower = null;
    this.occupied = new Set();

    this.waveInProgress = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnIntervalMs = 650;

    this.speedMultiplier = 1;
    this.paused = false;
    this.gameOver = false;
    this.victory = false;

    this.lastTimestamp = null;

    this.bindInput();
    this.renderShop();
    this.updateHud();
  }

  bindInput() {
    this.canvas.addEventListener("click", (evt) => this.handleCanvasClick(evt));
  }

  handleCanvasClick(evt) {
    if (this.gameOver) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (evt.clientX - rect.left) * scaleX;
    const y = (evt.clientY - rect.top) * scaleY;
    const col = Math.floor(x / CELL);
    const row = Math.floor(y / CELL);

    const existing = this.towers.find((t) => t.col === col && t.row === row);
    if (existing) {
      this.selectTower(existing);
      return;
    }

    this.placeTower(col, row);
  }

  placeTower(col, row) {
    if (!inBounds(col, row) || isPathCell(col, row)) return;
    const key = `${col},${row}`;
    if (this.occupied.has(key)) return;

    const def = TOWER_TYPES[this.selectedTowerType];
    if (this.gold < def.cost) return;

    const x = col * CELL + CELL / 2;
    const y = row * CELL + CELL / 2;
    const tower = new Tower(this.selectedTowerType, col, row, x, y);
    this.towers.push(tower);
    this.occupied.add(key);
    this.gold -= def.cost;
    this.selectTower(tower);
    this.updateHud();
    this.renderShop();
  }

  selectTower(tower) {
    this.selectedTower = tower;
    this.renderSelection();
  }

  upgradeSelected() {
    if (!this.selectedTower) return;
    const cost = this.selectedTower.upgradeCost();
    if (cost === null || this.gold < cost) return;
    this.gold -= cost;
    this.selectedTower.upgrade();
    this.updateHud();
    this.renderSelection();
  }

  sellSelected() {
    if (!this.selectedTower) return;
    const tower = this.selectedTower;
    this.gold += tower.sellValue();
    this.towers = this.towers.filter((t) => t !== tower);
    this.occupied.delete(`${tower.col},${tower.row}`);
    this.selectedTower = null;
    this.updateHud();
    this.renderSelection();
    this.renderShop();
  }

  startWave() {
    if (this.waveInProgress || this.gameOver) return;
    this.waveNumber++;
    const { queue, hpScale, spawnIntervalMs } = buildWave(this.waveNumber);
    this.spawnQueue = queue.map((type) => ({ type, hpScale }));
    this.spawnIntervalMs = spawnIntervalMs;
    this.spawnTimer = 0;
    this.waveInProgress = true;
    this.updateHud();
  }

  setSpeed(mult) {
    this.speedMultiplier = mult;
  }

  togglePause() {
    this.paused = !this.paused;
    return this.paused;
  }

  update(dt) {
    if (this.paused || this.gameOver) return;
    const scaledDt = dt * this.speedMultiplier;
    const now = performance.now();

    if (this.spawnQueue.length > 0) {
      this.spawnTimer += scaledDt * 1000;
      if (this.spawnTimer >= this.spawnIntervalMs) {
        this.spawnTimer = 0;
        const next = this.spawnQueue.shift();
        this.enemies.push(new Enemy(next.type, next.hpScale));
      }
    } else if (this.waveInProgress && this.enemies.length === 0) {
      this.waveInProgress = false;
      const waveBonus = 20 + this.waveNumber * 4;
      this.gold += waveBonus;
      if (this.waveNumber >= this.totalWaves) {
        this.victory = true;
        this.gameOver = true;
      }
      this.updateHud();
    }

    for (const enemy of this.enemies) {
      enemy.update(scaledDt, now);
    }

    let livesLost = 0;
    this.enemies = this.enemies.filter((e) => {
      if (e.reachedEnd) {
        livesLost++;
        return false;
      }
      return !e.dead;
    });

    if (livesLost > 0) {
      this.lives -= livesLost;
      if (this.lives <= 0) {
        this.lives = 0;
        this.gameOver = true;
        this.victory = false;
      }
      this.updateHud();
    }

    for (const tower of this.towers) {
      const projectile = tower.tryFire(now, this.enemies);
      if (projectile) this.projectiles.push(projectile);
    }

    for (const projectile of this.projectiles) {
      projectile.update(scaledDt, this.enemies, (enemy) => this.onEnemyKilled(enemy));
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    if (this.gameOver) this.showOverlay();
  }

  onEnemyKilled(enemy) {
    this.gold += enemy.gold;
    this.updateHud();
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap(ctx);

    for (const tower of this.towers) {
      tower.draw(ctx, tower === this.selectedTower);
    }
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }
    for (const projectile of this.projectiles) {
      projectile.draw(ctx);
    }
  }

  loop = (timestamp) => {
    if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop);
  };

  start() {
    requestAnimationFrame(this.loop);
  }

  updateHud() {
    this.ui.gold.textContent = this.gold;
    this.ui.lives.textContent = this.lives;
    this.ui.wave.textContent = `${this.waveNumber} / ${this.totalWaves}`;
    this.ui.startWaveBtn.disabled = this.waveInProgress || this.gameOver;
    this.renderShop();
  }

  renderShop() {
    this.ui.shop.innerHTML = "";
    for (const [key, def] of Object.entries(TOWER_TYPES)) {
      const card = document.createElement("div");
      const affordable = this.gold >= def.cost;
      card.className = `tower-card${key === this.selectedTowerType ? " selected" : ""}${
        affordable ? "" : " affordable-no"
      }`;
      card.innerHTML = `
        <div class="name"><span class="swatch" style="background:${def.color}"></span>${def.label}</div>
        <div class="cost">${def.cost}g</div>
        <div class="desc">${def.desc}</div>
      `;
      card.addEventListener("click", () => {
        this.selectedTowerType = key;
        this.renderShop();
      });
      this.ui.shop.appendChild(card);
    }
  }

  renderSelection() {
    const tower = this.selectedTower;
    if (!tower) {
      this.ui.selectionPanel.classList.add("hidden");
      return;
    }
    this.ui.selectionPanel.classList.remove("hidden");
    const upgradeCost = tower.upgradeCost();
    this.ui.selectionDetails.innerHTML = `
      <div><b>${tower.def.label}</b> — Lv ${tower.level}</div>
      <div>Damage: <b>${tower.damage}</b></div>
      <div>Range: <b>${tower.range}</b></div>
      <div>Sell value: <b>${tower.sellValue()}g</b></div>
    `;
    this.ui.upgradeBtn.disabled = upgradeCost === null || this.gold < upgradeCost;
    this.ui.upgradeBtn.textContent =
      upgradeCost === null ? "Max Level" : `Upgrade (${upgradeCost}g)`;
  }

  showOverlay() {
    this.ui.overlay.classList.remove("hidden");
    this.ui.overlayTitle.textContent = this.victory ? "Victory!" : "Defeat";
    this.ui.overlayMessage.textContent = this.victory
      ? `You defended through all ${this.totalWaves} waves.`
      : `You held out for ${this.waveNumber} waves before the base fell.`;
  }
}
