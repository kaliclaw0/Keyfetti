/* ============================
   Kids Typing — JS logic
   ============================ */

(() => {
  const game = document.getElementById('game');
  const popLayer = document.getElementById('popLayer');
  const docEl = document.getElementById('document');
  const confettiCanvas = document.getElementById('confetti-canvas');
  let allowAllKeys = false; // default: A-Z only

  /* CONFIG */
  const POP_HOLD_MS = 700;            // how long the center letter stays before floating
  const FLOAT_DURATION = 850;         // animation duration to move into document
  const MAX_DOC_CHARS = 1200;         // prune after this many chars
  const SPACE_CHAR = ' ';             // Change to '_' or '␣' to display space differently
  const RAINBOW = [
    getComputedStyle(document.documentElement).getPropertyValue('--color1').trim() || '#FF6B6B',
    getComputedStyle(document.documentElement).getPropertyValue('--color2').trim() || '#FFB86B',
    getComputedStyle(document.documentElement).getPropertyValue('--color3').trim() || '#FFD36B',
    getComputedStyle(document.documentElement).getPropertyValue('--color4').trim() || '#8BE56F',
    getComputedStyle(document.documentElement).getPropertyValue('--color5').trim() || '#5EE3D3',
    getComputedStyle(document.documentElement).getPropertyValue('--color6').trim() || '#6BA7FF',
    getComputedStyle(document.documentElement).getPropertyValue('--color7').trim() || '#C07BFF',
  ];

  /* initialize confetti (canvas-confetti) */
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

  /* helper: pick rainbow color (cycle evenly) */
  let colorIndex = 0;
  function nextColor() {
    const c = RAINBOW[colorIndex % RAINBOW.length] || '#FF6B6B';
    colorIndex++;
    return c;
  }

  /* ensure focus on click so keyboard is captured */
  game.addEventListener('click', () => { game.focus(); });

  /* ensure the area is focusable on load */
  setTimeout(() => game.setAttribute('tabindex', '0'), 0);

  /*unified key handler*/

  document.addEventListener('keydown', (ev) => {
  const intro = document.getElementById('introStage');
  if (intro && !intro.dataset.hidden) {
    intro.style.display = 'none';
    intro.dataset.hidden = 'true';
  }

  // Handle Backspace

if (ev.key === 'Backspace') {
  ev.preventDefault();
  const letters = docEl.querySelectorAll('.doc-letter');
  const last = letters[letters.length - 1];
  if (last) {
    explodeLetter(last);
  }
  return;
}

  // Allowed keys depending on mode
  if (allowAllKeys) {
    // letters, numbers, punctuation, space
    if (/^[a-z0-9]$/i.test(ev.key) || /[.,!?;:'"()\[\]{}\-+*/=_<>@#$%^&|~`\\]/.test(ev.key) || ev.key === ' ') {
      ev.preventDefault();
      const char = ev.key === ' ' ? ' ' : ev.key;
      spawnPopLetter(char.toUpperCase());
    }
  } else {
    // A–Z only
    if (!/^[a-z]$/i.test(ev.key)) return;
    ev.preventDefault();
    const char = ev.key.toUpperCase();
    spawnPopLetter(char);
  }
});


  /* spawn the pop-letter, animate pop and then float to document */
  function spawnPopLetter(char) {
    const span = document.createElement('span');
    span.className = 'pop-letter pop-enter';
    span.textContent = char;

    // responsive sizing
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const baseSize = Math.min(Math.max(vw * 0.18, 72), 240);
    span.style.fontSize = baseSize + 'px';
    span.style.padding = Math.round(baseSize * 0.18) + 'px';
    span.style.background = 'transparent';
    span.style.color = nextColor();

    popLayer.appendChild(span);
    fireConfetti();

    // After hold, float to document
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
        duration: FLOAT_DURATION,
        easing: 'cubic-bezier(.2,.9,.25,1)',
        fill: 'forwards'
      });

      anim.onfinish = () => {
        span.remove();
        appendDocLetter(char);
      };

      // fallback in case animations fail
      setTimeout(() => {
        if (document.body.contains(span)) {
          span.remove();
          appendDocLetter(char);
        }
      }, FLOAT_DURATION + 60);

    }, POP_HOLD_MS);
  }

  function explodeLetter(el) {
  const rect = el.getBoundingClientRect();
  const pieces = 12; // number of fragments

  for (let i = 0; i < pieces; i++) {
    const frag = document.createElement('span');
    frag.textContent = el.textContent;
    frag.style.position = 'fixed';
    frag.style.left = rect.left + rect.width / 2 + 'px';
    frag.style.top = rect.top + rect.height / 2 + 'px';
    frag.style.fontSize = getComputedStyle(el).fontSize;
    frag.style.fontWeight = getComputedStyle(el).fontWeight;
    frag.style.color = '#000'; // fragments in black
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

  el.remove(); // remove original letter
}

  /* invisible preview letter for positioning */
  function createDocLetterPreview(char) {
    const preview = document.createElement('span');
    preview.className = 'doc-letter';
    preview.style.opacity = '0';
    preview.textContent = char;
    docEl.appendChild(preview);
    return preview;
  }

  /* append permanent letter into document area */
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
    if (letters.length > MAX_DOC_CHARS) {
      const removeCount = letters.length - MAX_DOC_CHARS;
      for (let i = 0; i < removeCount; i++) {
        if (letters[i] && letters[i].parentNode) letters[i].remove();
      }
    }
    docEl.scrollLeft = docEl.scrollWidth;
    docEl.scrollTop = docEl.scrollHeight;
  }

  /* hide focus hint once user focuses */
  game.addEventListener('focus', () => {
    const hint = document.querySelector('.focus-hint');
    if (hint) hint.style.display = 'none';
  });

  // initial focus
  setTimeout(() => { try { game.focus(); } catch (e) {} }, 300);

  // Restart button clears the document
document.getElementById('restartBtn').addEventListener('click', () => {
  docEl.innerHTML = '';
});

// Toggle button switches key mode
document.getElementById('toggleBtn').addEventListener('click', (e) => {
  allowAllKeys = !allowAllKeys;
  e.target.textContent = allowAllKeys ? "🌐" : "🔠"; 
  e.target.title = allowAllKeys ? "All keys enabled" : "Letters only";
});

  /* Prevent accidental text selection */
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
  });
})();