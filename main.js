/* ============================
   Keyfetti - Enhanced Kids Typing Game
   ============================ */

import confetti from 'canvas-confetti';
import './style.css';

// Simple sound synthesis (no external files needed)
class SoundManager {
  constructor() {
    this.enabled = true;
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playPop() {
    if (!this.enabled) return;
    this.init();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.frequency.setValueAtTime(600 + Math.random() * 200, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  playCelebrate() {
    if (!this.enabled) return;
    this.init();
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.frequency.setValueAtTime(400 + i * 200, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
      }, i * 80);
    }
  }

  playMilestone() {
    if (!this.enabled) return;
    this.init();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.2);
      }, i * 100);
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

const sounds = new SoundManager();

// Game State
const gameState = {
  letterCount: 0,
  streak: 0,
  bestStreak: 0,
  startTime: null,
  wpm: 0,
  allowAllKeys: false,
  gameMode: 'free', // free, challenge, words
  challengeTime: 60,
  challengeInterval: null,
  targetWord: '',
  wordCharIndex: 0, // tracks position within current word (fixed: was wordIndex)
  words: ['CAT', 'DOG', 'SUN', 'BAT', 'HAT', 'PIG', 'CUP', 'BED', 'RUN', 'FUN', 'BOX', 'FOX', 'RED', 'BIG', 'TOP', 'MAP', 'BUS', 'CAR', 'JAR', 'VAN'],
  darkMode: false
};

// Load saved state
function loadState() {
  try {
    const saved = localStorage.getItem('keyfetti-state');
    if (saved) {
      const data = JSON.parse(saved);
      gameState.bestStreak = data.bestStreak || 0;
      document.getElementById('highScore').textContent = gameState.bestStreak;
    }
  } catch (e) {}
}

// Save state
function saveState() {
  try {
    localStorage.setItem('keyfetti-state', JSON.stringify({
      bestStreak: gameState.bestStreak
    }));
  } catch (e) {}
}

// Calculate WPM
function updateWPM() {
  if (!gameState.startTime) return;
  const minutes = (Date.now() - gameState.startTime) / 60000;
  if (minutes > 0) {
    gameState.wpm = Math.round(gameState.letterCount / 5 / minutes);
    document.getElementById('wpm').textContent = gameState.wpm;
  }
}

// Milestone check
function checkMilestone() {
  const milestones = [10, 26, 50, 100, 200, 500];
  if (milestones.includes(gameState.letterCount)) {
    sounds.playMilestone();
  }
}

// Challenge mode
function startChallenge() {
  // Clean up word mode UI
  document.getElementById('wordChallenge').classList.remove('active');
  
  gameState.challengeTime = 60;
  gameState.letterCount = 0;
  gameState.streak = 0;
  gameState.startTime = Date.now();
  gameState.wpm = 0;
  document.getElementById('letterCount').textContent = '0';
  document.getElementById('wpm').textContent = '0';
  document.getElementById('streak').textContent = '0';
  document.getElementById('timerDisplay').textContent = '60';
  document.getElementById('timerDisplay').style.color = ''; // reset color
  document.getElementById('challengeTimer').classList.add('active');
  
  if (gameState.challengeInterval) {
    clearInterval(gameState.challengeInterval);
  }
  gameState.challengeInterval = setInterval(() => {
    gameState.challengeTime--;
    document.getElementById('timerDisplay').textContent = gameState.challengeTime;
    if (gameState.challengeTime <= 10) {
      document.getElementById('timerDisplay').style.color = '#FF6B6B';
    }
    if (gameState.challengeTime <= 0) {
      endChallenge();
    }
  }, 1000);
}

function endChallenge() {
  if (gameState.challengeInterval) {
    clearInterval(gameState.challengeInterval);
    gameState.challengeInterval = null;
  }
  document.getElementById('challengeTimer').classList.remove('active');
  
  // Save best score
  if (gameState.letterCount > gameState.bestStreak) {
    gameState.bestStreak = gameState.letterCount;
    document.getElementById('highScore').textContent = gameState.bestStreak;
    saveState();
  }
  
  // Show results
  const result = confirm(`Time's up!\n\nLetters: ${gameState.letterCount}\nWPM: ${gameState.wpm}\nBest Streak: ${gameState.streak}`);
  
  // Reset for new game but keep challenge mode active for next round
  gameState.letterCount = 0;
  gameState.streak = 0;
  gameState.startTime = null;
  gameState.wpm = 0;
  document.getElementById('letterCount').textContent = '0';
  document.getElementById('wpm').textContent = '0';
  document.getElementById('streak').textContent = '0';
  document.getElementById('document').innerHTML = '';
  document.getElementById('timerDisplay').style.color = '';
  
  // Auto-restart challenge after dismissing dialog
  if (result || true) { // Always restart
    setTimeout(() => startChallenge(), 500);
  }
}

// Word challenge mode
function nextWord() {
  gameState.targetWord = gameState.words[Math.floor(Math.random() * gameState.words.length)];
  gameState.wordCharIndex = 0;
  document.getElementById('targetWord').textContent = gameState.targetWord;
}

function initWordMode() {
  // Clean up challenge mode UI
  if (gameState.challengeInterval) {
    clearInterval(gameState.challengeInterval);
    gameState.challengeInterval = null;
  }
  document.getElementById('challengeTimer').classList.remove('active');
  document.getElementById('timerDisplay').style.color = '';
  
  // Reset stats
  gameState.letterCount = 0;
  gameState.streak = 0;
  gameState.startTime = Date.now();
  gameState.wpm = 0;
  document.getElementById('letterCount').textContent = '0';
  document.getElementById('wpm').textContent = '0';
  document.getElementById('streak').textContent = '0';
  document.getElementById('document').innerHTML = '';
  document.getElementById('wordChallenge').classList.add('active');
  nextWord();
}

// Reset game
function resetGame() {
  gameState.letterCount = 0;
  gameState.streak = 0;
  gameState.startTime = null;
  gameState.wpm = 0;
  document.getElementById('letterCount').textContent = '0';
  document.getElementById('wpm').textContent = '0';
  document.getElementById('streak').textContent = '0';
  document.getElementById('document').innerHTML = '';
  
  // Clean up challenge mode
  if (gameState.challengeInterval) {
    clearInterval(gameState.challengeInterval);
    gameState.challengeInterval = null;
  }
  document.getElementById('challengeTimer').classList.remove('active');
  document.getElementById('timerDisplay').style.color = '';
  
  // Clean up word mode
  document.getElementById('wordChallenge').classList.remove('active');
}

// Dark mode toggle
function toggleDarkMode() {
  gameState.darkMode = !gameState.darkMode;
  document.body.classList.toggle('dark', gameState.darkMode);
  localStorage.setItem('keyfetti-darkmode', gameState.darkMode);
}

// Background particles - create once
function createParticles() {
  const container = document.getElementById('particles');
  if (container.querySelector('.particle')) return; // Already created
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 5 + 's';
    particle.style.animationDuration = (3 + Math.random() * 4) + 's';
    container.appendChild(particle);
  }
}

// Vibrate on mobile - FIXED: actually called
function vibrate() {
  if (navigator.vibrate && navigator.vibrate !== undefined) {
    navigator.vibrate(15);
  }
}

// Update stats display
function updateStats() {
  document.getElementById('letterCount').textContent = gameState.letterCount;
  document.getElementById('streak').textContent = gameState.streak;
  document.getElementById('highScore').textContent = gameState.bestStreak;
  if (gameState.startTime && gameState.letterCount > 0) {
    updateWPM();
  }
}

// Process a valid keypress
function processKeypress(char) {
  gameState.letterCount++;
  gameState.streak++;
  
  if (gameState.streak > gameState.bestStreak) {
    gameState.bestStreak = gameState.streak;
  }
  
  updateStats();
  checkMilestone();
  saveState();
}

// Initialize everything
(() => {
  const game = document.getElementById('game');
  const popLayer = document.getElementById('popLayer');
  const docEl = document.getElementById('document');
  const confettiCanvas = document.getElementById('confetti-canvas');

  const mobileInput = document.getElementById('mobileInput');
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Load saved dark mode
  if (localStorage.getItem('keyfetti-darkmode') === 'true') {
    gameState.darkMode = true;
    document.body.classList.add('dark');
  }

  // Load saved sound preference
  if (localStorage.getItem('keyfetti-sound') === 'false') {
    sounds.enabled = false;
    document.getElementById('soundBtn').textContent = '🔇';
  }

  // Mobile setup
  if (isMobile) {
    // Hide the graphical keyboard, use native input instead
    document.getElementById('mobileKeyboard').style.display = 'none';
    
    setTimeout(() => mobileInput.focus(), 400);
    
    game.addEventListener('click', () => mobileInput.focus());
    document.body.addEventListener('click', () => mobileInput.focus());
    
    mobileInput.addEventListener('blur', () => {
      setTimeout(() => mobileInput.focus(), 100);
    });

    // Handle virtual keyboard showing
    mobileInput.addEventListener('focus', () => {
      const intro = document.getElementById('introStage');
      if (intro) intro.style.display = 'none';
    });
  }

  // Visual viewport resize
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      game.style.height = window.visualViewport.height + 'px';
    });
  }

  // Confetti setup
  const myConfetti = confetti.create(confettiCanvas, {
    resize: true,
    useWorker: true
  });

  function fireConfetti() {
    myConfetti({
      particleCount: 28,
      spread: 75,
      startVelocity: 36,
      gravity: 0.6,
      scalar: 0.9,
      ticks: 120,
      origin: { x: 0.5, y: 0.4 }
    });
  }

  // Rainbow colors
  let colorIndex = 0;
  const RAINBOW = [
    '#FF6B6B', '#FFB86B', '#FFD36B', '#8BE56F',
    '#5EE3D3', '#6BA7FF', '#C07BFF'
  ];
  
  function nextColor() {
    const c = RAINBOW[colorIndex % RAINBOW.length];
    colorIndex++;
    return c;
  }

  // Hide intro helper
  function hideIntro() {
    const intro = document.getElementById('introStage');
    if (intro && !intro.dataset.hidden) {
      intro.style.display = 'none';
      intro.dataset.hidden = 'true';
    }
  }

  // Key handler
  const keyTarget = isMobile ? mobileInput : document;
  
  keyTarget.addEventListener('keydown', (ev) => {
    hideIntro();

    // Handle Backspace
    if (ev.key === 'Backspace') {
      ev.preventDefault();
      const letters = docEl.querySelectorAll('.doc-letter');
      const last = letters[letters.length - 1];
      if (last) {
        // Decrement count when backspacing
        if (gameState.letterCount > 0) {
          gameState.letterCount--;
        }
        if (gameState.streak > 0) {
          gameState.streak = 0;
        }
        updateStats();
        explodeLetter(last);
      }
      return;
    }

    // Mode-specific handling - Word Mode
    if (gameState.gameMode === 'words') {
      const expected = gameState.targetWord[gameState.wordCharIndex];
      if (ev.key.toUpperCase() === expected) {
        hideIntro();
        spawnPopLetter(ev.key.toUpperCase());
        gameState.wordCharIndex++;
        processKeypress(ev.key);
        sounds.playPop();
        vibrate();
        
        if (gameState.wordCharIndex >= gameState.targetWord.length) {
          // Word complete - small delay then next word
          sounds.playCelebrate();
          setTimeout(nextWord, 300);
        }
      }
      return;
    }

    // Normal key handling (Free Mode & Challenge Mode)
    if (!gameState.startTime) {
      gameState.startTime = Date.now();
    }

    if (gameState.allowAllKeys) {
      // All keys mode - numbers, punctuation, letters, space
      if (/^[a-z0-9]$/i.test(ev.key) || /[.,!?;:'"()\[\]{}\-+*/=_<>@#$%^&|~`\\]/.test(ev.key) || ev.key === ' ') {
        ev.preventDefault();
        const char = ev.key === ' ' ? ' ' : ev.key.toUpperCase();
        spawnPopLetter(char);
        processKeypress(ev.key);
        sounds.playPop();
        vibrate();
      }
    } else {
      // Letters only mode (default)
      if (!/^[a-z]$/i.test(ev.key)) return;
      ev.preventDefault();
      spawnPopLetter(ev.key.toUpperCase());
      processKeypress(ev.key);
      sounds.playPop();
      vibrate();
    }
  });

  // Mobile keyboard button clicks - FIXED: now has handlers
  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (isMobile) return; // Use native keyboard on mobile
      
      const char = btn.dataset.key;
      hideIntro();

      if (gameState.gameMode === 'words') {
        const expected = gameState.targetWord[gameState.wordCharIndex];
        if (char === expected) {
          spawnPopLetter(char);
          gameState.wordCharIndex++;
          processKeypress(char);
          sounds.playPop();
          vibrate();
          
          if (gameState.wordCharIndex >= gameState.targetWord.length) {
            sounds.playCelebrate();
            setTimeout(nextWord, 300);
          }
        }
        return;
      }

      if (!gameState.startTime) {
        gameState.startTime = Date.now();
      }

      spawnPopLetter(char);
      processKeypress(char);
      sounds.playPop();
      vibrate();

      // Visual feedback
      btn.style.transform = 'scale(0.9)';
      btn.style.background = 'var(--color1)';
      btn.style.color = 'white';
      setTimeout(() => {
        btn.style.transform = '';
        btn.style.background = '';
        btn.style.color = '';
      }, 100);
    });
  });

  // Spawn letter animation
  function spawnPopLetter(char) {
    const span = document.createElement('span');
    span.className = 'pop-letter pop-enter';
    span.textContent = char;

    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const baseSize = Math.min(Math.max(vw * 0.18, 72), 240);
    span.style.fontSize = baseSize + 'px';
    span.style.padding = Math.round(baseSize * 0.18) + 'px';
    span.style.background = 'transparent';
    span.style.color = nextColor();

    popLayer.appendChild(span);
    fireConfetti();

    setTimeout(() => {
      const docLetterPreview = createDocLetterPreview(char);
      const docRect = docLetterPreview.getBoundingClientRect();
      const fromRect = span.getBoundingClientRect();

      const translateX = docRect.left + (docRect.width / 2) - (fromRect.left + (fromRect.width / 2));
      const translateY = docRect.top + (docRect.height / 2) - (fromRect.top + (fromRect.height / 2));

      const targetFontSize = parseFloat(getComputedStyle(docLetterPreview).fontSize || '20');
      const currentFontSize = parseFloat(getComputedStyle(span).fontSize || String(baseSize));
      const scale = (targetFontSize / currentFontSize) || 0.18;

      docLetterPreview.remove();

      const anim = span.animate([
        { transform: 'translate(0px,0px) scale(1)', opacity: 1 },
        { transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`, opacity: 0.88 }
      ], {
        duration: 850,
        easing: 'cubic-bezier(.2,.9,.25,1)',
        fill: 'forwards'
      });

      anim.onfinish = () => {
        span.remove();
        appendDocLetter(char);
      };

      setTimeout(() => {
        if (document.body.contains(span)) {
          span.remove();
          appendDocLetter(char);
        }
      }, 910);

    }, 700);
  }

  function explodeLetter(el) {
    const rect = el.getBoundingClientRect();
    const pieces = 12;

    for (let i = 0; i < pieces; i++) {
      const frag = document.createElement('span');
      frag.textContent = el.textContent;
      frag.style.position = 'fixed';
      frag.style.left = rect.left + rect.width / 2 + 'px';
      frag.style.top = rect.top + rect.height / 2 + 'px';
      frag.style.fontSize = getComputedStyle(el).fontSize;
      frag.style.fontWeight = getComputedStyle(el).fontWeight;
      frag.style.color = gameState.darkMode ? '#fff' : '#000';
      frag.style.pointerEvents = 'none';
      frag.style.opacity = '0.9';
      frag.style.zIndex = 9999;

      document.body.appendChild(frag);

      const angle = (Math.PI * 2 * i) / pieces;
      const distance = 40 + Math.random() * 30;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      frag.animate([
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${x}px, ${y}px) rotate(${Math.random()*360}deg)`, opacity: 0 }
      ], {
        duration: 500 + Math.random() * 300,
        easing: 'ease-out',
        fill: 'forwards'
      }).onfinish = () => frag.remove();
    }

    el.remove();
  }

  function createDocLetterPreview(char) {
    const preview = document.createElement('span');
    preview.className = 'doc-letter';
    preview.style.opacity = '0';
    preview.textContent = char;
    docEl.appendChild(preview);
    return preview;
  }

  function appendDocLetter(char) {
    const el = document.createElement('span');
    el.className = 'doc-letter';
    el.textContent = char;
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px) scale(0.98)';
    docEl.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transition = 'transform 260ms cubic-bezier(.2,.9,.25,1), opacity 260ms';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0) scale(1)';
    });

    pruneDocumentIfNeeded();
  }

  function pruneDocumentIfNeeded() {
    const letters = docEl.querySelectorAll('.doc-letter');
    if (letters.length > 1200) {
      const removeCount = letters.length - 1200;
      for (let i = 0; i < removeCount; i++) {
        if (letters[i] && letters[i].parentNode) letters[i].remove();
      }
    }
    docEl.scrollLeft = docEl.scrollWidth;
    docEl.scrollTop = docEl.scrollHeight;
  }

  // Event listeners
  game.addEventListener('click', () => { game.focus(); });
  setTimeout(() => game.setAttribute('tabindex', '0'), 0);

  document.getElementById('restartBtn').addEventListener('click', () => {
    if (gameState.gameMode === 'challenge') {
      startChallenge();
    } else if (gameState.gameMode === 'words') {
      initWordMode();
    } else {
      resetGame();
    }
    sounds.playCelebrate();
  });

  document.getElementById('toggleBtn').addEventListener('click', (e) => {
    gameState.allowAllKeys = !gameState.allowAllKeys;
    e.target.textContent = gameState.allowAllKeys ? '🌐' : '🔠';
    e.target.title = gameState.allowAllKeys ? 'All keys enabled' : 'Letters only';
  });

  document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);

  document.getElementById('soundBtn').addEventListener('click', (e) => {
    const enabled = sounds.toggle();
    e.target.textContent = enabled ? '🔊' : '🔇';
    e.target.title = enabled ? 'Sound On' : 'Sound Off';
    localStorage.setItem('keyfetti-sound', enabled);
  });

  // Mode selector
  document.getElementById('modeBtn').addEventListener('click', () => {
    document.getElementById('modeSelector').classList.toggle('active');
  });

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      gameState.gameMode = e.target.dataset.mode;
      document.getElementById('modeSelector').classList.remove('active');
      
      if (gameState.gameMode === 'challenge') {
        startChallenge();
      } else if (gameState.gameMode === 'words') {
        initWordMode();
      } else {
        resetGame();
      }
    });
  });

  // Prevent text selection
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
  });

  // Initialize
  loadState();
  createParticles();
  setTimeout(() => { try { game.focus(); } catch (e) {} }, 300);
})();
