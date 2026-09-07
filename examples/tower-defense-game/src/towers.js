import { Projectile } from "./projectile.js";

export const TOWER_TYPES = {
  archer: {
    label: "Archer",
    color: "#4ea1ff",
    cost: 50,
    range: 110,
    fireRateMs: 550,
    damage: 12,
    projectileSpeed: 420,
    splashRadius: 0,
    slow: null,
    desc: "Cheap, steady single-target damage.",
  },
  cannon: {
    label: "Cannon",
    color: "#ff9d4e",
    cost: 90,
    range: 95,
    fireRateMs: 1100,
    damage: 26,
    projectileSpeed: 300,
    splashRadius: 34,
    slow: null,
    desc: "Slow but splashes nearby enemies.",
  },
  frost: {
    label: "Frost",
    color: "#8fd7ff",
    cost: 70,
    range: 100,
    fireRateMs: 750,
    damage: 6,
    projectileSpeed: 380,
    splashRadius: 0,
    slow: { factor: 0.45, durationMs: 1500 },
    desc: "Low damage, slows what it hits.",
  },
  sniper: {
    label: "Sniper",
    color: "#c24ef5",
    cost: 140,
    range: 220,
    fireRateMs: 1600,
    damage: 60,
    projectileSpeed: 600,
    splashRadius: 0,
    slow: null,
    desc: "Long range, heavy single-target hits.",
  },
};

const UPGRADE_MULTIPLIER = 1.6;
const UPGRADE_COST_MULTIPLIER = 0.75;
const MAX_LEVEL = 3;

export class Tower {
  constructor(type, col, row, x, y) {
    this.type = type;
    this.def = TOWER_TYPES[type];
    this.col = col;
    this.row = row;
    this.x = x;
    this.y = y;
    this.level = 1;
    this.lastFiredAt = 0;
    this.range = this.def.range;
    this.damage = this.def.damage;
    this.investedGold = this.def.cost;
  }

  upgradeCost() {
    if (this.level >= MAX_LEVEL) return null;
    return Math.round(this.def.cost * UPGRADE_COST_MULTIPLIER * this.level);
  }

  upgrade() {
    if (this.level >= MAX_LEVEL) return false;
    const cost = this.upgradeCost();
    this.level++;
    this.damage = Math.round(this.def.damage * Math.pow(UPGRADE_MULTIPLIER, this.level - 1));
    this.range = Math.round(this.def.range * (1 + 0.1 * (this.level - 1)));
    this.investedGold += cost;
    return true;
  }

  sellValue() {
    return Math.round(this.investedGold * 0.6);
  }

  findTarget(enemies) {
    let best = null;
    let bestProgress = -Infinity;
    for (const enemy of enemies) {
      if (enemy.dead || enemy.reachedEnd) continue;
      const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (d <= this.range && enemy.waypointIndex > bestProgress) {
        bestProgress = enemy.waypointIndex;
        best = enemy;
      }
    }
    return best;
  }

  tryFire(now, enemies) {
    if (now - this.lastFiredAt < this.def.fireRateMs) return null;
    const target = this.findTarget(enemies);
    if (!target) return null;
    this.lastFiredAt = now;
    return new Projectile({
      x: this.x,
      y: this.y,
      target,
      damage: this.damage,
      speed: this.def.projectileSpeed,
      color: this.def.color,
      splashRadius: this.def.splashRadius,
      slow: this.def.slow,
    });
  }

  draw(ctx, isSelected) {
    ctx.save();
    ctx.fillStyle = this.def.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0b0f19";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(this.level), this.x, this.y);

    if (isSelected) {
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export { MAX_LEVEL };
