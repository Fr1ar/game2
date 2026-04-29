const Input = (() => {
  const keys = {};
  const justPressed = {};
  const justReleased = {};

  window.addEventListener('keydown', e => {
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    justReleased[e.code] = true;
  });

  return {
    isDown(code) { return !!keys[code]; },
    wasPressed(code) { return !!justPressed[code]; },
    wasReleased(code) { return !!justReleased[code]; },
    isLeft()  { return keys['ArrowLeft']  || keys['KeyA']; },
    isRight() { return keys['ArrowRight'] || keys['KeyD']; },
    isJump()  { return keys['ArrowUp']    || keys['KeyW'] || keys['Space']; },
    wasJumped() { return justPressed['ArrowUp'] || justPressed['KeyW'] || justPressed['Space']; },
    anyKey() { return Object.keys(justPressed).length > 0; },
    flush() {
      for (const k in justPressed)  delete justPressed[k];
      for (const k in justReleased) delete justReleased[k];
    }
  };
})();
