(() => {
  "use strict";

  // ---------------------------------------------------------------------
  // Lesson content — each stage only uses words built from the keys
  // introduced so far, so every stage is cumulative on the last.
  // ---------------------------------------------------------------------
  const STAGES = [
    {
      id: "home",
      title: "Home Row",
      blurb: "Your eight resting keys — a s d f j k l ; — plus the index reaches g and h.",
      unlockWpm: 12,
      words: [
        "dad", "sad", "lad", "fall", "hall", "gala", "flag", "flask", "glass",
        "hash", "dash", "gash", "lash", "flash", "ask", "gas", "lag", "sag",
        "fads", "adds", "asks", "half", "shall", "salad", "salads", "flags",
        "flasks", "gala", "jak", "kaj", "all", "gall", "salsa",
      ],
    },
    {
      id: "top",
      title: "Top Row",
      blurb: "Reach up to q w e r t y u i o p while keeping your anchor.",
      unlockWpm: 18,
      words: [
        "the", "are", "our", "get", "just", "like", "look", "your", "true",
        "great", "little", "trade", "quiet", "quote", "hardy", "story",
        "study", "guide", "issue", "quirky", "father", "gather", "duty",
        "party", "delight", "earth", "eight", "digital", "regular", "royalty",
        "outfit", "quality", "gadget", "history", "gallery",
      ],
    },
    {
      id: "bottom",
      title: "Bottom Row",
      blurb: "Full alphabet unlocked: z x c v b n m join the mix.",
      unlockWpm: 25,
      words: [
        "keyboard", "monitor", "computer", "practice", "amazing", "muscle",
        "memory", "confidence", "vocabulary", "movement", "maximum", "become",
        "combine", "example", "exciting", "jumbo", "number", "symbol",
        "moment", "planet", "unique", "brave", "curious", "gravity",
        "monument", "adventure", "obvious", "century", "volume", "backbone",
      ],
    },
    {
      id: "numbers",
      title: "Numbers & Punctuation",
      blurb: "Digits and the marks that hold a sentence together.",
      unlockWpm: 25,
      sentences: [
        "I have 25 dollars.",
        "Call me at 3:00 pm.",
        "Room 404 is on the 4th floor.",
        "It costs $19.99 today!",
        "She scored 100% on the test.",
        "Meet me on July 4th, 2026.",
        "We need 3 cups of flour, 2 eggs, and 1 cup of sugar.",
        "The train leaves at 7:45 - don't be late!",
        "Is it really 60 degrees outside?",
        "Chapter 12, page 88: read it twice.",
      ],
    },
    {
      id: "sentences",
      title: "Full Sentences",
      blurb: "Everything together — real sentences, natural rhythm.",
      unlockWpm: 30,
      sentences: [
        "The quick brown fox jumps over the lazy dog.",
        "Pack my box with five dozen liquor jugs.",
        "Sphinx of black quartz, judge my vow.",
        "Practice a little every day and speed will follow.",
        "Good typists trust their fingers, not their eyes.",
        "The keyboard remembers what the eyes forget.",
        "Small steady habits build unshakeable skill.",
        "Curiosity and patience turn beginners into experts.",
        "Every expert was once a confused beginner.",
        "Focus on accuracy first; speed comes naturally after.",
      ],
    },
  ];

  const WORDS_PER_ROUND = 14;

  // ---------------------------------------------------------------------
  // Keyboard layout + finger assignment
  // ---------------------------------------------------------------------
  const FINGER_NAMES = {
    lp: "left pinky", lr: "left ring", lm: "left middle", li: "left index",
    ri: "right index", rm: "right middle", rr: "right ring", rp: "right pinky",
    th: "thumbs",
  };

  const KB_ROWS = [
    [["`","lp"],["1","lp"],["2","lr"],["3","lm"],["4","li"],["5","li"],["6","ri"],["7","ri"],["8","rm"],["9","rr"],["0","rp"],["-","rp"],["=","rp"]],
    [["q","lp"],["w","lr"],["e","lm"],["r","li"],["t","li"],["y","ri"],["u","ri"],["i","rm"],["o","rr"],["p","rp"],["[","rp"],["]","rp"]],
    [["a","lp"],["s","lr"],["d","lm"],["f","li"],["g","li"],["h","ri"],["j","ri"],["k","rm"],["l","rr"],[";","rp"],["'","rp"]],
    [["z","lp"],["x","lr"],["c","lm"],["v","li"],["b","li"],["n","ri"],["m","ri"],[",","rm"],[".","rr"],["/","rp"]],
  ];

  const KEY_TO_FINGER = {};
  KB_ROWS.forEach((row) => row.forEach(([key, finger]) => { KEY_TO_FINGER[key] = finger; }));
  KEY_TO_FINGER[" "] = "th";

  // ---------------------------------------------------------------------
  // Persisted progress
  // ---------------------------------------------------------------------
  const STORAGE_KEY = "blindtype.progress.v1";

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) { /* ignore corrupt storage */ }
    return { unlocked: 0, best: {}, roundsCleared: {} };
  }

  function saveProgress(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (_) { /* storage unavailable */ }
  }

  let progress = loadProgress();

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const state = {
    stageIndex: Math.min(progress.unlocked, STAGES.length - 1),
    target: "",
    cursor: 0,
    correctCount: 0,
    mistakeCount: 0,
    streak: 0,
    bestStreak: 0,
    startTime: null,
    finished: false,
  };

  // ---------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const stageNav = $("stageNav");
  const stageTitle = $("stageTitle");
  const stageBlurb = $("stageBlurb");
  const promptEl = $("prompt");
  const promptWrap = $("promptWrap");
  const promptHint = $("promptHint");
  const input = $("typingInput");
  const keyboardEl = $("keyboard");
  const keyboardWrap = $("keyboardWrap");
  const fingerHint = $("fingerHint");
  const blindToggle = $("blindToggle");
  const restartBtn = $("restartBtn");
  const resetBtn = $("resetBtn");
  const themeToggle = $("themeToggle");
  const toastEl = $("toast");

  const statWpm = $("statWpm");
  const statAccuracy = $("statAccuracy");
  const statStreak = $("statStreak");
  const statBest = $("statBest");

  // ---------------------------------------------------------------------
  // Text generation
  // ---------------------------------------------------------------------
  function pickWords(list, count) {
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push(list[Math.floor(Math.random() * list.length)]);
    }
    return out.join(" ");
  }

  function pickSentence(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function generateText(stage) {
    if (stage.sentences) return pickSentence(stage.sentences);
    return pickWords(stage.words, WORDS_PER_ROUND);
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------
  function renderStageNav() {
    stageNav.innerHTML = "";
    STAGES.forEach((stage, i) => {
      const chip = document.createElement("button");
      chip.className = "stage-chip" + (i === state.stageIndex ? " active" : "") + (i > progress.unlocked ? " locked" : "");
      chip.textContent = (i > progress.unlocked ? "🔒 " : "") + stage.title;
      chip.disabled = i > progress.unlocked;
      chip.addEventListener("click", () => selectStage(i));
      stageNav.appendChild(chip);
    });
  }

  function renderKeyboard() {
    keyboardEl.innerHTML = "";
    KB_ROWS.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "kb-row";
      row.forEach(([key]) => {
        const keyEl = document.createElement("div");
        keyEl.className = "key";
        keyEl.dataset.key = key;
        keyEl.textContent = key;
        rowEl.appendChild(keyEl);
      });
      keyboardEl.appendChild(rowEl);
    });
    const spaceRow = document.createElement("div");
    spaceRow.className = "kb-row";
    const spaceKey = document.createElement("div");
    spaceKey.className = "key space";
    spaceKey.dataset.key = " ";
    spaceRow.appendChild(spaceKey);
    keyboardEl.appendChild(spaceRow);
  }

  function renderPrompt() {
    promptEl.innerHTML = "";
    for (let i = 0; i < state.target.length; i++) {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = state.target[i];
      promptEl.appendChild(span);
    }
    updateCursorClasses();
  }

  function updateCursorClasses() {
    const spans = promptEl.children;
    for (let i = 0; i < spans.length; i++) {
      spans[i].classList.remove("current");
      if (i === state.cursor) spans[i].classList.add("current");
    }
  }

  function flashError(i) {
    const spans = promptEl.children;
    if (!spans[i]) return;
    spans[i].classList.remove("incorrect");
    // Force reflow so the shake animation replays on repeated mistakes.
    void spans[i].offsetWidth;
    spans[i].classList.add("incorrect");
  }

  function markCorrect(i) {
    const spans = promptEl.children;
    if (spans[i]) {
      spans[i].classList.remove("incorrect");
      spans[i].classList.add("correct");
    }
  }

  function highlightKey(char) {
    const prev = keyboardEl.querySelector(".key.active");
    if (prev) prev.classList.remove("active");
    const lower = char === undefined ? " " : char.toLowerCase();
    const keyEl = keyboardEl.querySelector(`.key[data-key="${cssEscape(lower)}"]`);
    if (keyEl) keyEl.classList.add("active");
    const finger = KEY_TO_FINGER[lower];
    fingerHint.textContent = finger ? `Use your ${FINGER_NAMES[finger]}` : "";
  }

  function cssEscape(s) {
    return s.replace(/["\\]/g, "\\$&");
  }

  function updateStats() {
    const elapsedMin = state.startTime ? (Date.now() - state.startTime) / 60000 : 0;
    const wpm = elapsedMin > 0 ? Math.round((state.correctCount / 5) / elapsedMin) : 0;
    const attempts = state.correctCount + state.mistakeCount;
    const accuracy = attempts > 0 ? Math.round((state.correctCount / attempts) * 100) : 100;

    statWpm.textContent = wpm;
    statAccuracy.textContent = accuracy + "%";
    statStreak.textContent = state.streak;

    const stageId = STAGES[state.stageIndex].id;
    const best = progress.best[stageId] || 0;
    statBest.textContent = Math.max(best, wpm);

    return { wpm, accuracy };
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2400);
  }

  // ---------------------------------------------------------------------
  // Round lifecycle
  // ---------------------------------------------------------------------
  function selectStage(i) {
    if (i > progress.unlocked) return;
    state.stageIndex = i;
    startRound();
    renderStageNav();
  }

  function startRound() {
    const stage = STAGES[state.stageIndex];
    stageTitle.textContent = stage.title;
    stageBlurb.textContent = stage.blurb;

    state.target = generateText(stage);
    state.cursor = 0;
    state.correctCount = 0;
    state.mistakeCount = 0;
    state.streak = 0;
    state.startTime = null;
    state.finished = false;

    renderPrompt();
    highlightKey(state.target[0]);
    updateStats();
    input.value = "";
    promptHint.textContent = "Don't look down — just start typing";
  }

  function completeRound() {
    state.finished = true;
    const { wpm, accuracy } = updateStats();
    const stage = STAGES[state.stageIndex];

    const prevBest = progress.best[stage.id] || 0;
    progress.best[stage.id] = Math.max(prevBest, wpm);
    progress.roundsCleared[stage.id] = (progress.roundsCleared[stage.id] || 0) + (accuracy >= 90 ? 1 : 0);
    saveProgress(progress);

    const canUnlockNext = state.stageIndex === progress.unlocked && state.stageIndex < STAGES.length - 1;
    const cleared = progress.roundsCleared[stage.id] || 0;

    if (canUnlockNext && cleared >= 3 && wpm >= stage.unlockWpm) {
      progress.unlocked = state.stageIndex + 1;
      saveProgress(progress);
      renderStageNav();
      showToast(`🎉 ${STAGES[progress.unlocked].title} unlocked!`);
    } else {
      showToast(`Round done — ${wpm} WPM, ${accuracy}% accuracy`);
    }

    promptHint.textContent = "Starting a new round…";
    setTimeout(startRound, 900);
  }

  // ---------------------------------------------------------------------
  // Input handling — the pressed key must match the target character
  // before the cursor advances, so mistakes must actually be corrected.
  // ---------------------------------------------------------------------
  function handleKeydown(e) {
    if (state.finished) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts alone
    if (e.key === "Backspace") {
      e.preventDefault();
      if (state.cursor > 0) {
        state.cursor -= 1;
        const spans = promptEl.children;
        spans[state.cursor].classList.remove("correct", "incorrect");
        updateCursorClasses();
        highlightKey(state.target[state.cursor]);
      }
      return;
    }
    if (e.key.length !== 1) return; // ignore Shift, Tab, arrows, etc.
    e.preventDefault();

    if (!state.startTime) state.startTime = Date.now();

    const expected = state.target[state.cursor];
    // Case-insensitive: this trains finger position, not shift-key
    // precision, so Caps Lock or either case of a letter should count.
    if (e.key.toLowerCase() === expected.toLowerCase()) {
      markCorrect(state.cursor);
      state.cursor += 1;
      state.correctCount += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      updateCursorClasses();
      if (state.cursor >= state.target.length) {
        highlightKey(undefined);
        completeRound();
        return;
      }
      highlightKey(state.target[state.cursor]);
    } else {
      flashError(state.cursor);
      state.mistakeCount += 1;
      state.streak = 0;
    }
    updateStats();
  }

  // ---------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------
  // Listen on document rather than a focused element: focusing an
  // invisible input programmatically is unreliable inside sandboxed
  // iframes (e.g. published Artifacts), so typing must work regardless
  // of which element technically has focus.
  document.addEventListener("keydown", handleKeydown);
  promptWrap.addEventListener("click", () => input.focus());
  input.addEventListener("paste", (e) => e.preventDefault());

  restartBtn.addEventListener("click", startRound);

  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset all progress and unlocked lessons?")) return;
    progress = { unlocked: 0, best: {}, roundsCleared: {} };
    saveProgress(progress);
    state.stageIndex = 0;
    renderStageNav();
    startRound();
  });

  blindToggle.addEventListener("change", () => {
    keyboardWrap.classList.toggle("hidden-kb", blindToggle.checked);
  });

  themeToggle.addEventListener("click", () => {
    const root = document.documentElement;
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("blindtype.theme", next); } catch (_) { /* storage unavailable */ }
  });

  (function initTheme() {
    try {
      const saved = localStorage.getItem("blindtype.theme");
      if (saved) document.documentElement.setAttribute("data-theme", saved);
    } catch (_) { /* storage unavailable */ }
  })();

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  renderStageNav();
  renderKeyboard();
  startRound();
})();
