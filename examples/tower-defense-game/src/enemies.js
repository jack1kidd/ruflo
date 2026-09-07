import { WAYPOINTS } from "./map.js";

export const ENEMY_TYPES = {
  grunt: { hp: 40, speed: 60, gold: 6, radius: 10, color: "#f5c542", label: "Grunt" },
  runner: { hp: 22, speed: 110, gold: 5, radius: 8, color: "#4ea1ff", label: "Runner" },
  brute: { hp: 140, speed: 34, gold: 14, radius: 14, color: "#ff5d5d", label: "Brute" },
  boss: { hp: 700, speed: 28, gold: 60, radius: 20, color: "#c24ef5", label: "Boss" },
};

let nextId = 1;

export class Enemy {
  constructor(type, waveScale) {
    const def = ENEMY_TYPES[type];
    this.id = nextId++;
    this.type = type;
    this.def = def;
    this.maxHp = Math.round(def.hp * waveScale);
    this.hp = this.maxHp;
    this.speed = def.speed;
    this.baseSpeed = def.speed;
    this.gold = def.gold;
    this.radius = def.radius;
    this.color = def.color;
    this.waypointIndex = 0;
    this.x = WAYPOINTS[0].x;
    this.y = WAYPOINTS[0].y;
    this.slowUntil = 0;
    this.reachedEnd = false;
    this.dead = false;
  }

  applySlow(factor, durationMs, now) {
    this.speed = this.baseSpeed * factor;
    this.slowUntil = now + durationMs;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      return true;
    }
    return false;
  }

  update(dt, now) {
    if (this.slowUntil && now > this.slowUntil) {
      this.speed = this.baseSpeed;
      this.slowUntil = 0;
    }

    const target = WAYPOINTS[this.waypointIndex + 1];
    if (!target) {
      this.reachedEnd = true;
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;

    if (step >= dist) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
      if (!WAYPOINTS[this.waypointIndex + 1]) {
        this.reachedEnd = true;
      }
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  draw(ctx) {
    const now = performance.now();
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    if (this.slowUntil && now < this.slowUntil) {
      ctx.strokeStyle = "#8fd7ff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const barWidth = this.radius * 2;
    const pct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = "#0b0f19";
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 8, barWidth, 4);
    ctx.fillStyle = pct > 0.5 ? "#4fd67b" : pct > 0.25 ? "#f5c542" : "#ff5d5d";
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 8, barWidth * pct, 4);
    ctx.restore();
  }
}
