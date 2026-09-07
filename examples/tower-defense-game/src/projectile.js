export class Projectile {
  constructor({ x, y, target, damage, speed, color, splashRadius = 0, slow = null }) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.splashRadius = splashRadius;
    this.slow = slow;
    this.dead = false;
  }

  update(dt, allEnemies, onKill) {
    if (this.target.dead || this.target.reachedEnd) {
      this.dead = true;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;

    if (step >= dist) {
      this.hit(allEnemies, onKill);
      this.dead = true;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  hit(allEnemies, onKill) {
    const now = performance.now();
    if (this.splashRadius > 0) {
      for (const enemy of allEnemies) {
        if (enemy.dead) continue;
        const d = Math.hypot(enemy.x - this.target.x, enemy.y - this.target.y);
        if (d <= this.splashRadius) {
          const killed = enemy.takeDamage(this.damage);
          if (killed) onKill(enemy);
        }
      }
    } else if (!this.target.dead) {
      const killed = this.target.takeDamage(this.damage);
      if (this.slow) this.target.applySlow(this.slow.factor, this.slow.durationMs, now);
      if (killed) onKill(this.target);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
