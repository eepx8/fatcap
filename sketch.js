let splines = [], currentSpline = null, baseThickness = 120, currentColorIndex = 0;
let colors, noiseOffset = 0, isDrawingBlack = false;
let mobileMode = false;
let controls = [];
let startScreen = true;
let title, subtitle, startText, helpButton, helpModal, overlay;
let startScreenColor;
let thicknessMeter = { visible: false, timer: 0, duration: 1000 };
let colorMeter = { visible: false, timer: 0, duration: 1000 };
let isFadingOutCanvas = false;
let fadeOutCanvasProgress = 0;
let fadeOutProgress = 0;
let isFadingOut = false;
let drip = null;
let startTime = null;

function setup() {
  mobileMode = windowWidth < 600;
  baseThickness = mobileMode ? 60 : 120;
  createCanvas(windowWidth, windowHeight);
  colors = [color(255, 0, 0), color(0, 153, 255), color(255, 204, 0), color(255, 153, 255), color(0, 204, 102)];
  
  startScreenColor = colors[floor(random(colors.length))];
  background(startScreenColor);

  select('canvas').style('width', '100%');
  select('canvas').style('height', '100%');
  select('canvas').style('position', 'fixed');
  select('canvas').style('top', '0');
  select('canvas').style('left', '0');
  select('canvas').style('z-index', '-1');

  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  document.body.style.mozUserSelect = 'none';
  document.body.style.msUserSelect = 'none';

  setupStartScreen();

  if (!mobileMode) {
    helpButton = createButton('<span class="icon">help</span>')
      .position(width - 70, 10)
      .size(60, 60)
      .style('background-color', '#161616')
      .style('color', '#fff')
      .style('border', 'none')
      .style('border-radius', '50%')
      .style('font-family', 'Material Symbols Outlined')
      .style('font-size', '24px')
      .style('z-index', '1000')
      .style('display', 'none')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .mousePressed(toggleHelpModal);

    let iconSpan = select('.icon', helpButton);
    iconSpan.style('transition', 'opacity 0.2s ease');

    overlay = createDiv('')
      .style('position', 'fixed')
      .style('top', '0')
      .style('left', '0')
      .style('width', '100%')
      .style('height', '100%')
      .style('background-color', 'rgba(22, 22, 22, 0.5)')
      .style('z-index', '900')
      .style('display', 'none')
      .style('opacity', '0')
      .style('transition', 'opacity 0.3s ease');

    helpModal = createDiv(`
      <div style="background-color: #161616; color: #fff; padding: 40px; border-radius: 10px; text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: normal; width: 400px; position: relative;">
        <h3 style="margin: 0 0 20px 0; color: #fff; font-weight: normal; font-family: 'Six Caps', sans-serif; font-size: 3rem;">Six Caps</h3>
        <p style="font-weight: normal; margin: 0;">A - Hold to draw in black<br>↑ - Increase thickness<br>↓ - Decrease thickness<br>S - Save canvas as .PNG<br>R - Reset canvas<br>Esc - Return to title</p>
        <button id="closeModal" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #fff; font-family: 'Material Symbols Outlined'; font-size: 30px; cursor: pointer;">close</button>
      </div>
    `)
      .style('position', 'absolute')
      .style('left', '50%')
      .style('top', '50%')
      .style('transform', 'translate(-50%, -50%)')
      .style('display', 'none')
      .style('z-index', '1000')
      .style('opacity', '0')
      .style('transition', 'opacity 0.3s ease-out');

    select('#closeModal', helpModal).mousePressed(closeHelpModal);
  }

  document.body.style.touchAction = 'manipulation';

  let lastTouchTime = 0;
  document.addEventListener('touchstart', function(event) {
    const now = Date.now();
    if (now - lastTouchTime < 300 && event.touches.length === 1) {
      event.preventDefault();
    }
    lastTouchTime = now;
  }, { passive: false });

  document.addEventListener('touchmove', function(event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  mobileMode = windowWidth < 600;
  if (!mobileMode && helpButton) {
    helpButton.position(width - 70, 10);
  }
  if (startScreen || startTime) {
    updateStartScreenElements();
  }
}

function updateStartScreenElements() {
  if (!title || !title.elt) return;
  let minWidth = 600;
  let maxWidth = 1920;
  let minSize = 13;
  let maxSize = 40;
  let fontSize = map(constrain(windowWidth, minWidth, maxWidth), minWidth, maxWidth, minSize, maxSize);
  title.style('font-size', `${fontSize}rem`);

  subtitle.style('top', mobileMode ? '25%' : '15%');
  subtitle.style('margin-bottom', mobileMode ? '5px' : '60px');
  title.style('top', '50%');
  title.style('margin-bottom', mobileMode ? '5px' : '60px');
  if (startText) {
    startText.style('top', mobileMode ? '65%' : '85%');
  }

  if (startScreen && !startTime && title.elt.offsetWidth > 0) {
    drip = { 
      x: title.elt.offsetLeft + title.elt.offsetWidth * (mobileMode ? 0.36 : 0.35),
      y: title.elt.offsetTop + title.elt.offsetHeight * 0.2,
      startY: title.elt.offsetTop + title.elt.offsetHeight * 0.2,
      targetY: height,
      startTime: null,
      thickness: mobileMode ? 10 : 20, 
      delay: 2000 
    };
  }
}

function setupStartScreen() {
  subtitle = createElement('h2', "Px8 Studio's")
    .style('font-size', '1.1rem')
    .style('text-align', 'center')
    .style('color', '#161616')
    .style('font-family', "'Plus Jakarta Sans', sans-serif")
    .style('font-weight', 'normal')
    .style('position', 'absolute')
    .style('left', '50%')
    .style('top', mobileMode ? '25%' : '15%')
    .style('transform', 'translateX(-50%)')
    .style('opacity', '0')
    .style('transition', 'opacity 0.5s ease-in')
    .style('z-index', '10')
    .style('display', 'none')
    .style('margin-bottom', mobileMode ? '5px' : '60px');

  title = createElement('h1', 'FATCAP')
    .style('text-align', 'center')
    .style('color', '#161616')
    .style('font-family', "'Six Caps', sans-serif")
    .style('font-weight', 'bold')
    .style('-webkit-text-stroke', '0')
    .style('text-stroke', '0')
    .style('position', 'absolute')
    .style('left', '50%')
    .style('top', '50%')
    .style('transform', 'translate(-50%, -50%)')
    .style('margin-top', '0')
    .style('opacity', '0')
    .style('transition', 'opacity 0.5s ease-in')
    .style('z-index', '10')
    .style('display', 'none')
    .style('margin-bottom', mobileMode ? '5px' : '60px');

  startText = createElement('p', 'START DRAWING')
    .style('font-size', '1.2rem')
    .style('text-align', 'center')
    .style('color', '#161616')
    .style('font-family', "'Plus Jakarta Sans', sans-serif")
    .style('font-weight', 'normal')
    .style('text-transform', 'uppercase')
    .style('letter-spacing', '4px')
    .style('position', 'absolute')
    .style('left', '50%')
    .style('top', mobileMode ? '65%' : '85%')
    .style('transform', 'translateX(-50%)')
    .style('opacity', '0')
    .style('transition', 'opacity 1.5s ease-in-out')
    .style('z-index', '10')
    .style('display', 'none');

  setTimeout(() => {
    subtitle.style('display', 'block');
    setTimeout(() => subtitle.style('opacity', '1'), 10);
  }, 100);

  setTimeout(() => {
    title.style('display', 'block');
    updateStartScreenElements();
    setTimeout(() => {
      title.style('opacity', '1');
      setTimeout(() => {
        if (startScreen && !startTime) {
          drip.startTime = millis();
        }
      }, 600);
    }, 10);
  }, 600);

  setTimeout(() => {
    startText.style('display', 'block');
    setTimeout(() => startText.style('opacity', '1'), 10);
    setInterval(() => {
      if (startText && startText.elt) {
        startText.style('opacity', startText.style('opacity') === '1' ? '0' : '1');
      }
    }, 1500);
  }, 1100);
}

function fadeOutStartScreen() {
  console.log("Start screen triggered!");
  subtitle.style('opacity', '0');
  startText.style('opacity', '0');
  startTime = millis();
  isFadingOut = true;
  fadeOutProgress = 0;
  drip = null;

  setTimeout(() => {
    subtitle.remove();
    startText.remove();
    setTimeout(() => {
      title.style('opacity', '0');
      setTimeout(() => {
        startScreen = false;
        isFadingOut = false;
        title.remove();

        if (mobileMode) {
          let buttonSize = 60;
          let totalWidth = buttonSize * 5 + 10 * 4;
          let startX = (width - totalWidth) / 2;
          let buttonY = height - 90;

          controls.push(createButton('+')
            .mousePressed(() => { baseThickness += 20; showThicknessMeter(); })
            .position(startX, buttonY)
            .size(buttonSize, buttonSize)
            .style('background-color', '#161616')
            .style('color', '#fff')
            .style('border', 'none')
            .style('border-radius', '50%')
            .style('font-size', '24px')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center'));

          controls.push(createButton('-')
            .mousePressed(() => { baseThickness = max(20, baseThickness - 20); showThicknessMeter(); })
            .position(startX + buttonSize + 10, buttonY)
            .size(buttonSize, buttonSize)
            .style('background-color', '#161616')
            .style('color', '#fff')
            .style('border', 'none')
            .style('border-radius', '50%')
            .style('font-size', '24px')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center'));

          controls.push(createButton('invert_colors')
            .mousePressed(() => { isDrawingBlack = !isDrawingBlack; showColorMeter(); })
            .position(startX + (buttonSize + 10) * 2, buttonY)
            .size(buttonSize, buttonSize)
            .style('background-color', '#161616')
            .style('color', '#fff')
            .style('border', 'none')
            .style('border-radius', '50%')
            .style('font-family', 'Material Symbols Outlined')
            .style('font-size', '24px')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center'));

          controls.push(createButton('restart_alt')
            .mousePressed(() => { if (splines.length > 0) { isFadingOutCanvas = true; fadeOutCanvasProgress = 0; }})
            .position(startX + (buttonSize + 10) * 3, buttonY)
            .size(buttonSize, buttonSize)
            .style('background-color', '#161616')
            .style('color', '#fff')
            .style('border', 'none')
            .style('border-radius', '50%')
            .style('font-family', 'Material Symbols Outlined')
            .style('font-size', '24px')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center'));

          controls.push(createButton('arrow_downward')
            .mousePressed(() => {
              background(255);
              splines.forEach(spline => drawSpline(spline));
              if (currentSpline) drawSpline(currentSpline);
              saveCanvas('FATCAP_ART', 'png');
            })
            .position(startX + (buttonSize + 10) * 4, buttonY)
            .size(buttonSize, buttonSize)
            .style('background-color', '#161616')
            .style('color', '#fff')
            .style('border', 'none')
            .style('border-radius', '50%')
            .style('font-family', 'Material Symbols Outlined')
            .style('font-size', '24px')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center'));
        } else {
          helpButton.style('display', 'block');
        }
      }, 500);
    }, 5000);
  }, 300);
}

function resetToStartScreen() {
  splines = [];
  currentSpline = null;
  isFadingOutCanvas = false;
  fadeOutCanvasProgress = 0;
  isDrawingBlack = false;
  currentColorIndex = 0;
  thicknessMeter.visible = false;
  colorMeter.visible = false;
  fadeOutProgress = 0;
  isFadingOut = false;
  drip = null;
  startTime = null;

  controls.forEach(control => control.remove());
  controls = [];

  if (!mobileMode) {
    helpButton.style('display', 'none');
    helpModal.style('display', 'none');
    overlay.style('display', 'none');
    helpModal.style('opacity', '0');
    overlay.style('opacity', '0');
  }

  startScreenColor = colors[floor(random(colors.length))];
  background(startScreenColor);

  startScreen = true;
  setupStartScreen();
}

function toggleHelpModal() {
  let iconSpan = select('.icon', helpButton);
  if (helpModal.style('display') === 'none') {
    iconSpan.style('opacity', '0');
    setTimeout(() => {
      iconSpan.html('cancel');
      iconSpan.style('opacity', '1');
    }, 200);
    overlay.style('display', 'block');
    helpModal.style('display', 'block');
    setTimeout(() => {
      overlay.style('opacity', '1');
      helpModal.style('opacity', '1');
    }, 10);
  } else {
    iconSpan.style('opacity', '0');
    setTimeout(() => {
      iconSpan.html('help');
      iconSpan.style('opacity', '1');
    }, 200);
    helpModal.style('opacity', '0');
    overlay.style('opacity', '0');
    setTimeout(() => {
      helpModal.style('display', 'none');
      overlay.style('display', 'none');
    }, 300);
  }
}

function closeHelpModal() {
  let iconSpan = select('.icon', helpButton);
  iconSpan.style('opacity', '0');
  setTimeout(() => {
    iconSpan.html('help');
    iconSpan.style('opacity', '1');
  }, 200);
  helpModal.style('opacity', '0');
  overlay.style('opacity', '0');
  setTimeout(() => {
    helpModal.style('display', 'none');
    overlay.style('display', 'none');
  }, 300);
}

function draw() {
  if (startScreen && !startTime) {
    background(startScreenColor);
    if (drip && drip.startTime) {
      let progress = min((millis() - drip.startTime) / drip.delay, 1);
      let easedProgress = 1 - Math.pow(1 - progress, 2);
      let currentY = lerp(drip.startY, drip.targetY, easedProgress);
      stroke(22, 22, 22);
      strokeWeight(drip.thickness);
      line(drip.x, drip.startY, drip.x, currentY);
    }
  } else {
    background(255);
    if (isFadingOutCanvas) {
      fadeOutCanvasProgress += deltaTime / 300;
      if (fadeOutCanvasProgress >= 1) {
        isFadingOutCanvas = false;
        splines = [];
        fadeOutCanvasProgress = 0;
      }
      let alpha = lerp(0, 255, fadeOutCanvasProgress);
      splines.forEach(spline => drawSpline(spline, alpha));
      if (currentSpline) drawSpline(currentSpline, alpha);
      fill(255, 255, 255, alpha);
      noStroke();
      rect(0, 0, width, height);
    } else {
      splines.forEach(spline => drawSpline(spline));
      if (currentSpline) drawSpline(currentSpline);
    }

    if (isFadingOut && startTime) {
      fadeOutProgress += deltaTime / 300;
      if (fadeOutProgress > 1) fadeOutProgress = 1;
      let alpha = lerp(255, 0, fadeOutProgress);
      fill(red(startScreenColor), green(startScreenColor), blue(startScreenColor), alpha);
      noStroke();
      rect(0, 0, width, height);
    }
  }

  noiseOffset += 0.01;

  if (thicknessMeter.visible) {
    drawThicknessMeter();
    thicknessMeter.timer -= deltaTime;
    if (thicknessMeter.timer <= 0) thicknessMeter.visible = false;
  }

  if (colorMeter.visible) {
    drawColorMeter();
    colorMeter.timer -= deltaTime;
    if (colorMeter.timer <= 0) colorMeter.visible = false;
  }
}

function mousePressed() {
  if (startScreen && !isFadingOut) {
    fadeOutStartScreen();
  }
}

function mouseDragged() {
  if (startScreen && !startTime) return;
  if (!currentSpline) {
    currentSpline = { points: [], verticalLines: [], baseThickness, color: isDrawingBlack ? color(22, 22, 22) : colors[currentColorIndex] };
  }
  currentSpline.points.push(createVector(mouseX, mouseY));
}

function mouseReleased() {
  if (startScreen && !startTime) return;
  if (!currentSpline) return;

  currentSpline.points.forEach((pt, i, arr) => {
    if (i < arr.length - 1 && dist(pt.x, pt.y, arr[i + 1].x, arr[i + 1].y) > 1) {
      let dripChance = isDrawingBlack ? 0.05 : 0.1;
      if (random() < dripChance) {
        let thickness = random(10, 30);
        let targetY = min(pt.y + random(mobileMode ? 100 : 200, mobileMode ? 300 : 500), height);
        currentSpline.verticalLines.push({ x: pt.x, y: pt.y, targetY, startTime: millis(), thickness, delay: random(500, 2000) });
      }
    }
  });

  splines.push(currentSpline);
  currentSpline = null;
  currentColorIndex = (currentColorIndex + 1) % colors.length;
}

function keyPressed() {
  if (keyCode === ESCAPE) {
    resetToStartScreen();
    return;
  }
  if (keyCode === ENTER && startScreen && !isFadingOut) {
    fadeOutStartScreen();
    return;
  }
  if (startScreen && !startTime) return;

  if (keyCode === UP_ARROW) {
    baseThickness += 20;
    showThicknessMeter();
  }
  if (keyCode === DOWN_ARROW) {
    baseThickness = max(20, baseThickness - 20);
    showThicknessMeter();
  }
  if (key === 'a' || key === 'A') {
    isDrawingBlack = true;
    showColorMeter();
  }
  if (key === 's' || key === 'S') {
    background(255);
    splines.forEach(spline => drawSpline(spline));
    if (currentSpline) drawSpline(currentSpline);
    saveCanvas('FATCAP_ART', 'png');
  }
  if (key === 'r' || key === 'R') {
    if (splines.length > 0) {
      isFadingOutCanvas = true;
      fadeOutCanvasProgress = 0;
    }
  }
}

function keyReleased() {
  if (startScreen && !startTime) return;
  if (key === 'a' || key === 'A') {
    isDrawingBlack = false;
    showColorMeter();
  }
}

function drawSpline(spline, fadeAlpha = 255) {
  let thicknessToUse = spline.baseThickness;
  let colorToUse = spline.color;

  if (red(spline.color) === 22 && green(spline.color) === 22 && blue(spline.color) === 22) {
    thicknessToUse *= 0.5;
  }
  
  stroke(red(colorToUse), green(colorToUse), blue(colorToUse), fadeAlpha);
  noFill();
  strokeWeight(thicknessToUse);
  beginShape();
  spline.points.forEach((pt, i) => {
    let noiseScale = 20;
    let noiseX = noise(i * 0.1 + noiseOffset) * noiseScale - noiseScale / 2;
    let noiseY = noise(i * 0.1 + 1000 + noiseOffset) * noiseScale - noiseScale / 2;
    let noisyX = pt.x + noiseX;
    let noisyY = pt.y + noiseY;
    curveVertex(noisyX, noisyY);
  });
  endShape();
  
  spline.verticalLines.forEach(vl => {
    let progress = min((millis() - vl.startTime) / vl.delay, 1);
    let easedProgress = 1 - Math.pow(1 - progress, 2);
    let currentY = lerp(vl.y, vl.targetY, easedProgress);
    strokeWeight(vl.thickness);
    line(vl.x, vl.y, vl.x, currentY);
  });
}

function showThicknessMeter() {
  thicknessMeter.visible = true;
  thicknessMeter.timer = thicknessMeter.duration;
}

function drawThicknessMeter() {
  let meterWidth = 150;
  let meterHeight = 40;
  let x = width / 2 - meterWidth / 2;
  let y = height / 2 - meterHeight / 2;
  fill(200, 200, 200, 200);
  noStroke();
  rect(x, y, meterWidth, meterHeight, 10);
  fill(22, 22, 22);
  textSize(16);
  textAlign(CENTER, CENTER);
  textFont("'Plus Jakarta Sans', sans-serif");
  text(`Thickness: ${baseThickness}`, x + meterWidth / 2, y + meterHeight / 2);
}

function showColorMeter() {
  colorMeter.visible = true;
  colorMeter.timer = colorMeter.duration;
}

function drawColorMeter() {
  let meterWidth = 150;
  let meterHeight = 40;
  let x = width / 2 - meterWidth / 2;
  let y = height / 2 - meterHeight - 50;
  fill(200, 200, 200, 200);
  noStroke();
  rect(x, y, meterWidth, meterHeight, 10);
  fill(22, 22, 22);
  textSize(16);
  textAlign(CENTER, CENTER);
  textFont("'Plus Jakarta Sans', sans-serif");
  text(`Mode: ${isDrawingBlack ? 'Black' : 'Colour'}`, x + meterWidth / 2, y + meterHeight / 2);
}