let splines = [], currentSpline = null, baseThickness = 120, currentColorIndex = 0;
let colors, noiseOffset = 0, isDrawingBlack = false;
let mobileMode = false;
let controls = [];
let startScreen = true;
let title, goButton;
let thicknessMeter = { visible: false, timer: 0, duration: 1000 };
let isRewinding = false;
let rewindProgress = 0;
let rewindSpeed = 0.005;

function setup() {
  mobileMode = windowWidth < 600;
  createCanvas(windowWidth, windowHeight);
  colors = [color(255, 0, 0), color(0, 153, 255), color(255, 204, 0), color(255, 153, 255), color(0, 204, 102)];
  
  if (startScreen) {
    title = createElement('h1', 'FATCAP')
      .style('font-size', '128px')
      .style('text-align', 'center')
      .style('color', '#333')
      .style('font-family', 'sans-serif')
      .position(width / 2 - 100, height / 4);
    goButton = createButton('Go!').position(width / 2 - 40, height / 2).size(80, 40);
    goButton.mousePressed(startDrawing);
  }
}

function draw() {
  background(255);

  if (startScreen) {
    return;
  }

  if (isRewinding) {
    let totalPoints = 0;
    splines.forEach(spline => totalPoints += spline.points.length);
    let adjustedSpeed = rewindSpeed * (200 / max(1, totalPoints));
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
  
  if (!mobileMode) {
    drawControls();
  }

  noiseOffset += 0.01;

  if (thicknessMeter.visible) {
    drawThicknessMeter();
    thicknessMeter.timer -= deltaTime;
    if (thicknessMeter.timer <= 0) {
      thicknessMeter.visible = false;
    }
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
  }
}

function drawControls() {
  fill(0);
  noStroke();
  textSize(14);
  textAlign(RIGHT, TOP);
  text("Controls:\nA - Draw in Black\nUp Arrow - Increase Thickness\nDown Arrow - Decrease Thickness\nS - Save Canvas\nR - Reset Canvas (rewind)", width - 20, 20);
}

function startDrawing() {
  startScreen = false;
  splines = [];
  currentSpline = null;
  title.remove();
  goButton.remove();
  clear();
  resizeCanvas(windowWidth, windowHeight);
  
  if (mobileMode) {
    let totalWidth = 290; // 5 buttons * 50px + 4 gaps * 10px
    let startX = (width - totalWidth) / 2;
    
    controls.push(createButton('+').mousePressed(() => { 
      baseThickness += 20; 
      showThicknessMeter(); 
    }).position(startX, height - 100).size(50, 50));
    controls.push(createButton('-').mousePressed(() => { 
      baseThickness = max(20, baseThickness - 20); 
      showThicknessMeter(); 
    }).position(startX + 60, height - 100).size(50, 50));
    controls.push(createButton('B').mousePressed(() => isDrawingBlack = !isDrawingBlack).position(startX + 120, height - 100).size(50, 50));
    controls.push(createButton('R').mousePressed(() => { if (splines.length > 0) { isRewinding = true; rewindProgress = 0; }}).position(startX + 180, height - 100).size(50, 50));
    controls.push(createButton('S').mousePressed(() => {
      background(255);
      splines.forEach(spline => drawSpline(spline));
      if (currentSpline) drawSpline(currentSpline);
      saveCanvas('FATCAP_ART', 'png');
    }).position(startX + 240, height - 100).size(50, 50));
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
  text(`Thickness: ${baseThickness}`, x + meterWidth / 2, y + meterHeight / 2);
}