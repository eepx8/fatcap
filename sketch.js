let splines = [], currentSpline = null, baseThickness = 120, currentColorIndex = 0;
let colors, noiseOffset = 0, isDrawingBlack = false;
let mobileMode = false;
let controls = [];
let startScreen = true;
let title, subtitle, goButton, helpButton, helpModal;
let startScreenColor;
let thicknessMeter = { visible: false, timer: 0, duration: 1000 };
let colorMeter = { visible: false, timer: 0, duration: 1000 };
let isRewinding = false;
let rewindProgress = 0;
let rewindSpeed = 0.005;
let fadeOutProgress = 0;
let isFadingOut = false;

function setup() {
  mobileMode = windowWidth < 600;
  baseThickness = mobileMode ? 60 : 120;
  createCanvas(windowWidth, windowHeight);
  colors = [color(255, 0, 0), color(0, 153, 255), color(255, 204, 0), color(255, 153, 255), color(0, 204, 102)];
  
  startScreenColor = colors[floor(random(colors.length))];
  background(startScreenColor);

  setupStartScreen();

  if (!mobileMode) {
    helpButton = createButton('help')
      .position(width - 70, 10)
      .size(60, 60)
      .style('background-color', '#000')
      .style('color', '#fff')
      .style('border', 'none')
      .style('border-radius', '50%')
      .style('font-family', 'Material Symbols Outlined')
      .style('font-size', '24px')
      .style('z-index', '1000')
      .style('display', 'none')
      .mousePressed(openHelpModal);

    helpModal = createDiv(`
      <div style="background-color: #000; color: #fff; padding: 30px; border-radius: 10px; text-align: left; font-family: Poppins, sans-serif; font-size: 18px; width: 300px;">
        <h3 style="margin-top: 0; color: #fff;">Controls</h3>
        <p>A - Draw in Black<br>Up Arrow - Increase Thickness<br>Down Arrow - Decrease Thickness<br>S - Save Canvas<br>R - Reset Canvas (rewind)<br>Esc - Return to Title</p>
        <button id="closeModal" style="background-color: #fff; color: #000; border: none; border-radius: 5px; padding: 8px 16px; font-family: Poppins, sans-serif;">Close</button>
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

  // Prevent double-tap zoom on mobile
  document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('doubletap', function(event) {
    event.preventDefault();
  }, { passive: false });
}

function setupStartScreen() {
  subtitle = createElement('h2', "Px8 Studio's")
    .style('font-size', '1.1rem')
    .style('text-align', 'center')
    .style('color', '#333')
    .style('font-family', 'Poppins, sans-serif')
    .style('position', 'absolute')
    .style('left', '50%')
    .style('top', mobileMode ? '5%' : '20%') // Moved closer to top on mobile
    .style('transform', 'translateX(-50%)')
    .style('opacity', '0')
    .style('transition', 'opacity 0.5s ease-in')
    .style('z-index', '10')
    .style('display', 'none');

  title = createElement('h1', 'FATCAP')
    .style('font-size', mobileMode ? '13rem' : '40rem') // Reduced to 13rem on mobile
    .style('text-align', 'center')
    .style('color', '#333')
    .style('font-family', 'Six Caps, sans-serif')
    .style('position', 'absolute')
    .style('left', '50%')
    .style('top', '50%')
    .style('transform', 'translate(-50%, -50%)')
    .style('margin-top', '0')
    .style('opacity', '0')
    .style('transition', 'opacity 0.5s ease-in')
    .style('z-index', '10')
    .style('display', 'none');

  goButton = createButton('Start')
    .style('position', 'absolute')
    .style('left', '50%')
    .style('top', mobileMode ? '75%' : '80%') // Moved slightly lower on mobile
    .style('transform', 'translateX(-50%)')
    .style('background-color', '#000')
    .style('color', '#fff')
    .style('border', 'none')
    .style('border-radius', '20px')
    .style('font-family', 'Poppins, sans-serif')
    .style('opacity', '0')
    .style('transition', 'opacity 0.5s ease-in')
    .style('z-index', '10')
    .style('display', 'none')
    .size(80, 40)
    .mousePressed(fadeOutStartScreen);

  setTimeout(() => {
    subtitle.style('display', 'block');
    setTimeout(() => subtitle.style('opacity', '1'), 10);
  }, 100); // h2 starts at 100ms

  setTimeout(() => {
    title.style('display', 'block');
    setTimeout(() => title.style('opacity', '1'), 10);
  }, 600); // h1 starts at 600ms

  setTimeout(() => {
    goButton.style('display', 'block');
    setTimeout(() => goButton.style('opacity', '1'), 10);
  }, 1100); // Button starts at 1100ms
}

function fadeOutStartScreen() {
  subtitle.style('opacity', '0');
  title.style('opacity', '0');
  goButton.style('opacity', '0');
  isFadingOut = true;
  fadeOutProgress = 0;

  setTimeout(() => {
    startScreen = false;
    isFadingOut = false;
    subtitle.remove();
    title.remove();
    goButton.remove();

    if (mobileMode) {
      let buttonSize = 60;
      let totalWidth = buttonSize * 5 + 10 * 4;
      let startX = (width - totalWidth) / 2;
      let buttonY = height - 70; // Moved closer to bottom (was height - 100)

      controls.push(createButton('+')
        .mousePressed(() => { baseThickness += 20; showThicknessMeter(); })
        .position(startX, buttonY)
        .size(buttonSize, buttonSize)
        .style('background-color', '#000')
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
        .style('background-color', '#000')
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
        .style('background-color', '#000')
        .style('color', '#fff')
        .style('border', 'none')
        .style('border-radius', '50%')
        .style('font-family', 'Material Symbols Outlined')
        .style('font-size', '24px')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center'));

      controls.push(createButton('restart_alt')
        .mousePressed(() => { if (splines.length > 0) { isRewinding = true; rewindProgress = 0; }})
        .position(startX + (buttonSize + 10) * 3, buttonY)
        .size(buttonSize, buttonSize)
        .style('background-color', '#000')
        .style('color', '#fff')
        .style('border', 'none')
        .style('border-radius', '50%')
        .style('font-family', 'Material Symbols Outlined')
        .style('font-size', '24px')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center'));

      controls.push(createButton('save')
        .mousePressed(() => {
          background(255);
          splines.forEach(spline => drawSpline(spline));
          if (currentSpline) drawSpline(currentSpline);
          saveCanvas('FATCAP_ART', 'png');
        })
        .position(startX + (buttonSize + 10) * 4, buttonY)
        .size(buttonSize, buttonSize)
        .style('background-color', '#000')
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
  }, 300);
}

function resetToStartScreen() {
  splines = [];
  currentSpline = null;
  isRewinding = false;
  rewindProgress = 0;
  isDrawingBlack = false;
  currentColorIndex = 0;
  thicknessMeter.visible = false;
  colorMeter.visible = false;
  fadeOutProgress = 0;
  isFadingOut = false;

  controls.forEach(control => control.remove());
  controls = [];

  if (!mobileMode) {
    helpButton.style('display', 'none');
    helpModal.style('display', 'none');
    helpModal.style('opacity', '0');
  }

  startScreenColor = colors[floor(random(colors.length))];
  background(startScreenColor);

  startScreen = true;
  setupStartScreen();
}

function openHelpModal() {
  helpModal.style('display', 'block');
  setTimeout(() => helpModal.style('opacity', '1'), 10);
}

function closeHelpModal() {
  helpModal.style('opacity', '0');
  setTimeout(() => helpModal.style('display', 'none'), 300);
}

function draw() {
  if (startScreen) {
    background(255);
    if (isFadingOut) {
      fadeOutProgress += deltaTime / 300;
      if (fadeOutProgress > 1) fadeOutProgress = 1;
      let alpha = lerp(255, 0, fadeOutProgress);
      fill(red(startScreenColor), green(startScreenColor), blue(startScreenColor), alpha);
      noStroke();
      rect(0, 0, width, height);
    } else {
      background(startScreenColor);
    }
    return;
  }

  background(255);

  if (isRewinding) {
    let totalWidth = 0;
    splines.forEach(spline => totalWidth += spline.points.length);
    let adjustedSpeed = rewindSpeed * (200 / max(1, totalWidth));
    rewindProgress += adjustedSpeed;
    if (rewindProgress >= 1) {
      isRewinding = false;
      splines = [];
      rewindProgress = 0;
    } else {
      drawRewind();
    }
  } else {
    splines.forEach(spline => drawSpline(spline));
    if (currentSpline) drawSpline(currentSpline);
  }

  noiseOffset += 0.01;

  if (thicknessMeter.visible) {
    drawThicknessMeter();
    thicknessMeter.timer -= deltaTime;
    if (thicknessMeter.timer <= 0) {
      thicknessMeter.visible = false;
    }
  }

  if (colorMeter.visible) {
    drawColorMeter();
    colorMeter.timer -= deltaTime;
    if (colorMeter.timer <= 0) {
      colorMeter.visible = false;
    }
  }
}

function mouseDragged() {
  if (startScreen || isRewinding) return;

  if (!currentSpline) {
    currentSpline = { 
      points: [], 
      verticalLines: [], 
      baseThickness, 
      color: isDrawingBlack ? color(0) : colors[currentColorIndex]
    };
  }
  currentSpline.points.push(createVector(mouseX, mouseY));
}

function mouseReleased() {
  if (startScreen || isRewinding) return;
  if (!currentSpline) return;

  currentSpline.points.forEach((pt, i, arr) => {
    if (i < arr.length - 1 && dist(pt.x, pt.y, arr[i + 1].x, arr[i + 1].y) > 1) {
      if (random() < 0.1) {
        let thickness = random(10, 30);
        let targetY = min(pt.y + random(200, 500), height);
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

  if (startScreen || isRewinding) return;

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
      isRewinding = true;
      rewindProgress = 0;
    }
  }
}

function keyReleased() {
  if (startScreen || isRewinding) return;

  if (key === 'a' || key === 'A') {
    isDrawingBlack = false;
    showColorMeter();
  }
}

function drawRewind() {
  let totalPoints = 0;
  splines.forEach(spline => totalPoints += spline.points.length);
  
  let pointsToDraw = totalPoints * (1 - rewindProgress);
  let pointsDrawn = 0;

  for (let i = splines.length - 1; i >= 0; i--) {
    let spline = splines[i];
    let splinePoints = spline.points.length;
    
    if (pointsDrawn + splinePoints > pointsToDraw) {
      let remainingPoints = pointsToDraw - pointsDrawn;
      let tempSpline = { ...spline, points: spline.points.slice(0, remainingPoints) };
      drawSpline(tempSpline);
      break;
    } else {
      drawSpline(spline);
      pointsDrawn += splinePoints;
    }
  }
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

  fill(0);
  textSize(16);
  textAlign(CENTER, CENTER);
  textFont('Poppins');
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

  fill(0);
  textSize(16);
  textAlign(CENTER, CENTER);
  textFont('Poppins');
  text(`Mode: ${isDrawingBlack ? 'Black' : 'Colour'}`, x + meterWidth / 2, y + meterHeight / 2);
}

function drawSpline(spline) {
  let thicknessToUse = spline.baseThickness;
  let colorToUse = spline.color;

  if (red(spline.color) === 0 && green(spline.color) === 0 && blue(spline.color) === 0) {
    thicknessToUse *= 0.5;
  }
  
  stroke(colorToUse);
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