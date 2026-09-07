import { Game } from "./game.js";

function bootstrap() {
  const canvas = document.getElementById("game-canvas");

  const ui = {
    gold: document.getElementById("stat-gold"),
    lives: document.getElementById("stat-lives"),
    wave: document.getElementById("stat-wave"),
    shop: document.getElementById("tower-shop"),
    selectionPanel: document.getElementById("selection-panel"),
    selectionDetails: document.getElementById("selection-details"),
    upgradeBtn: document.getElementById("btn-upgrade"),
    sellBtn: document.getElementById("btn-sell"),
    startWaveBtn: document.getElementById("btn-start-wave"),
    speedBtn: document.getElementById("btn-speed"),
    pauseBtn: document.getElementById("btn-pause"),
    overlay: document.getElementById("overlay"),
    overlayTitle: document.getElementById("overlay-title"),
    overlayMessage: document.getElementById("overlay-message"),
    restartBtn: document.getElementById("btn-restart"),
  };

  let game = new Game(canvas, ui);
  window.__tdGame = game;

  ui.startWaveBtn.addEventListener("click", () => game.startWave());
  ui.upgradeBtn.addEventListener("click", () => game.upgradeSelected());
  ui.sellBtn.addEventListener("click", () => game.sellSelected());

  ui.speedBtn.addEventListener("click", () => {
    const next = game.speedMultiplier >= 2 ? 1 : game.speedMultiplier + 1;
    game.setSpeed(next);
    ui.speedBtn.textContent = `Speed ${next}x`;
  });

  ui.pauseBtn.addEventListener("click", () => {
    const paused = game.togglePause();
    ui.pauseBtn.textContent = paused ? "Resume" : "Pause";
  });

  ui.restartBtn.addEventListener("click", () => {
    ui.overlay.classList.add("hidden");
    ui.speedBtn.textContent = "Speed 1x";
    ui.pauseBtn.textContent = "Pause";
    game = new Game(canvas, ui);
    window.__tdGame = game;
    game.start();
  });

  game.start();
}

document.addEventListener("DOMContentLoaded", bootstrap);
