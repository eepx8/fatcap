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
let blinkInterval = null;
let isSafari = false;
let colorToggleButton = null;

function detectSafari() {
  const ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1;
}

function setup() {
  console.log("Setup started, mobileMode:", windowWidth < 600);
  mobileMode = windowWidth < 600;
  baseThickness = mobileMode ? 60 : 120;
  
  // Detect Safari browser
  isSafari = detectSafari();
  console.log("Safari browser detected:", isSafari);
  
  // Create canvas
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  
  colors = [color(255, 0, 0), color(0, 153, 255), color(255, 204, 0), color(255, 153, 255), color(0, 204, 102)];
  
  startScreenColor = colors[floor(random(colors.length))];
  background(startScreenColor);

  // Apply body styles
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  document.body.style.mozUserSelect = 'none';
  document.body.style.msUserSelect = 'none';
  document.body.style.touchAction = 'manipulation';

  setupStartScreen();

  if (!mobileMode) {
    console.log("Creating help button for desktop");
    helpButton = createButton('<span class="icon">help</span>')
      .addClass('help-button')
      .position(width - 70, 10)
      .mousePressed(toggleHelpModal);

    // Create color toggle button for desktop
    colorToggleButton = createButton('<span class="icon">invert_colors</span>')
      .addClass('control-button')
      .addClass('icon')
      .position(10, 10)
      .style('display', 'none')
      .mousePressed(() => { 
        isDrawingBlack = !isDrawingBlack; 
        showColorMeter(); 
      });

    let iconSpan = select('.icon', helpButton);
    iconSpan.style('transition', 'opacity 0.2s ease');

    overlay = createDiv('')
      .addClass('overlay');

    helpModal = createDiv(`
      <div class="help-modal-content">
        <h3>CONTROLS</h3>
        <p>A - Hold to draw in black<br>↑ - Increase thickness<br>↓ - Decrease thickness<br>S - Save canvas as .PNG<br>R - Reset canvas</p>
        <button id="closeModal" class="close-modal">close</button>
      </div>
    `)
      .addClass('help-modal');

    select('#closeModal', helpModal).mousePressed(closeHelpModal);
  }

  console.log("Setup completed");
}

function windowResized() {
  let prevMobileMode = mobileMode;
  resizeCanvas(windowWidth, windowHeight);
  mobileMode = windowWidth < 600;
  console.log("Window resized, mobileMode:", mobileMode);
  
  if (!mobileMode) {
    if (helpButton) {
      helpButton.position(width - 70, 10);
    }
    if (colorToggleButton) {
      colorToggleButton.position(10, 10);
    }
  }
  
  // Only update elements if they exist and we're in start screen
  if ((startScreen || startTime) && title && title.elt) {
    updateStartScreenElements();
  }
  
  // Only reset to start screen if switching from desktop to mobile
  if (mobileMode && !prevMobileMode && !startScreen) {
    console.log("Resetting to start screen for mobile");
    resetToStartScreen();
  }
}

function updateStartScreenElements() {
  // Check if title element exists
  if (!title || !title.elt) return;
  
  // Adjust title size based on screen width
  let titleWidth;
  if (windowWidth < 400) {
    titleWidth = '90%';
  } else if (windowWidth < 600) {
    titleWidth = '80%';
  } else if (windowWidth < 900) {
    titleWidth = '70%';
  } else {
    titleWidth = '60%';
  }
  
  title.style('width', titleWidth);
  
  // Update subtitle if it exists
  if (subtitle && subtitle.elt) {
    subtitle.style('top', mobileMode ? '15%' : '15%');
    subtitle.style('margin-bottom', mobileMode ? '5px' : '60px');
  }
  
  // Update title position
  title.style('top', '50%');
  title.style('margin-bottom', mobileMode ? '5px' : '60px');
  
  // Update start text if it exists
  if (startText && startText.elt) {
    startText.style('top', mobileMode ? '80%' : '85%');
  }

  // Only calculate drip if we're in start screen and not transitioning
  if (startScreen && !startTime && title.elt.offsetWidth > 0) {
    // Calculate drip position based on the SVG logo
    let logoImg = select('.logo-svg', title);
    if (logoImg && logoImg.elt) {
      let logoWidth = logoImg.elt.offsetWidth;
      let logoHeight = logoImg.elt.offsetHeight;
      
      drip = { 
        x: title.elt.offsetLeft + logoWidth * (mobileMode ? 0.36 : 0.35),
        y: title.elt.offsetTop + logoHeight * 0.2,
        startY: title.elt.offsetTop + logoHeight * 0.2,
        targetY: height,
        startTime: null,
        thickness: mobileMode ? 10 : 20, 
        delay: 2000 
      };
    }
  }
}

function setupStartScreen() {
  console.log("Setting up start screen, mobileMode:", mobileMode);
  
  // Clear any existing elements and intervals
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }
  
  // Remove any existing elements before creating new ones
  if (subtitle && subtitle.elt) subtitle.remove();
  if (title && title.elt) title.remove();
  if (startText && startText.elt) startText.remove();
  
  // Create subtitle element
  subtitle = createElement('h2', "Px8 Studio's")
    .addClass('subtitle')
    .style('display', 'none')
    .style('opacity', '0');

  // Create title element with SVG logo
  title = createDiv('')
    .addClass('title')
    .style('display', 'none')
    .style('opacity', '0');
  
  // Set the SVG content
  title.html(`<img src="img/fatcap.svg" class="logo-svg" alt="FATCAP">`);
  
  // Create start text element
  startText = createElement('p', 'START DRAWING')
    .addClass('start-text')
    .style('display', 'none')
    .style('opacity', '0');

  // Apply responsive styles
  updateStartScreenElements();

  // Show elements with animations
  setTimeout(() => {
    console.log("Showing subtitle");
    subtitle.style('display', 'block');
    setTimeout(() => subtitle.style('opacity', '1'), 10);
  }, 100);

  setTimeout(() => {
    console.log("Showing title");
    title.style('display', 'block');
    updateStartScreenElements();
    setTimeout(() => {
      title.style('opacity', '1');
      setTimeout(() => {
        if (startScreen && !startTime && drip) {
          drip.startTime = millis();
        }
      }, 600);
    }, 10);
  }, 600);

  setTimeout(() => {
    console.log("Showing startText");
    startText.style('display', 'block');
    setTimeout(() => startText.style('opacity', '1'), 10);
    
    // Store the interval reference so we can clear it later
    blinkInterval = setInterval(() => {
      if (startText && startText.elt) {
        startText.style('opacity', startText.style('opacity') === '1' ? '0' : '1');
      } else {
        // Clear the interval if the element no longer exists
        clearInterval(blinkInterval);
        blinkInterval = null;
      }
    }, 1000);
  }, 1100);
  
  console.log("Start screen setup completed");
}

function fadeOutStartScreen() {
  console.log("Start screen triggered, mobileMode:", mobileMode);
  
  // Fade out elements
  if (subtitle && subtitle.elt) subtitle.style('opacity', '0');
  if (startText && startText.elt) startText.style('opacity', '0');
  
  // Clear blink interval
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }
  
  // Reset any existing spline to prevent large initial splines
  currentSpline = null;
  
  startTime = millis();
  isFadingOut = true;
  fadeOutProgress = 0;
  drip = null;

  if (mobileMode) {
    console.log("Creating mobile controls");
    
    // Remove any existing controls first
    controls.forEach(control => control.remove());
    controls = [];
    
    let buttonSize = 60;
    let totalWidth = buttonSize * 5 + 10 * 4;
    let startX = (width - totalWidth) / 2;
    let buttonY = height - 90;

    // Create increase thickness button
    controls.push(createButton('+')
      .addClass('control-button')
      .position(startX, buttonY)
      .mousePressed(() => { baseThickness += 20; showThicknessMeter(); }));

    // Create decrease thickness button
    controls.push(createButton('-')
      .addClass('control-button')
      .position(startX + buttonSize + 10, buttonY)
      .mousePressed(() => { baseThickness = max(20, baseThickness - 20); showThicknessMeter(); }));

    // Create color toggle button
    controls.push(createButton('invert_colors')
      .addClass('control-button')
      .addClass('icon')
      .position(startX + (buttonSize + 10) * 2, buttonY)
      .mousePressed(() => { isDrawingBlack = !isDrawingBlack; showColorMeter(); }));

    // Create reset button
    controls.push(createButton('restart_alt')
      .addClass('control-button')
      .addClass('icon')
      .position(startX + (buttonSize + 10) * 3, buttonY)
      .mousePressed(() => { if (splines.length > 0) { isFadingOutCanvas = true; fadeOutCanvasProgress = 0; }}));

    // Create save button
    controls.push(createButton('arrow_downward')
      .addClass('control-button')
      .addClass('icon')
      .position(startX + (buttonSize + 10) * 4, buttonY)
      .mousePressed(() => {
        background(255);
        splines.forEach(spline => drawSpline(spline));
        if (currentSpline) drawSpline(currentSpline);
        saveCanvas('FATCAP_ART', 'png');
      }));

    // Fade in the controls
    setTimeout(() => {
      console.log("Fading in mobile controls");
      controls.forEach(control => control.style('opacity', '1'));
    }, 10);
  } else {
    // Show desktop color toggle button
    if (colorToggleButton) {
      colorToggleButton.style('display', 'block');
    }
  }

  setTimeout(() => {
    if (subtitle && subtitle.elt) subtitle.remove();
    if (startText && startText.elt) startText.remove();
    
    setTimeout(() => {
      if (title && title.elt) {
        title.style('opacity', '0');
        setTimeout(() => {
          startScreen = false;
          isFadingOut = false;
          if (title && title.elt) title.remove();
          if (!mobileMode && helpButton) {
            helpButton.style('display', 'block');
          }
          console.log("Start screen faded out, startScreen:", startScreen);
        }, 500);
      }
    }, 3000);
  }, 300);
}

function resetToStartScreen() {
  console.log("Resetting to start screen");
  
  // Clear drawing data
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

  // Clear any existing intervals
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }

  // Remove all controls
  controls.forEach(control => control.remove());
  controls = [];

  // Remove any existing DOM-based meters (from previous implementation)
  let thicknessMeterElement = select('.thickness-meter');
  if (thicknessMeterElement) thicknessMeterElement.remove();
  
  let colorMeterElement = select('.color-meter');
  if (colorMeterElement) colorMeterElement.remove();

  // Hide desktop UI elements
  if (!mobileMode) {
    if (helpButton) helpButton.style('display', 'none');
    if (colorToggleButton) colorToggleButton.style('display', 'none');
    if (helpModal) {
      helpModal.style('display', 'none');
      helpModal.style('opacity', '0');
    }
    if (overlay) {
      overlay.style('display', 'none');
      overlay.style('opacity', '0');
    }
  }

  // Set new background color
  startScreenColor = colors[floor(random(colors.length))];
  background(startScreenColor);

  // Reset state and setup start screen
  startScreen = true;
  setupStartScreen();
}

function toggleHelpModal() {
  let iconSpan = select('.icon', helpButton);
  
  if (helpModal.style('display') === 'none') {
    // Show modal
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
    // Hide modal
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
  
  // Hide modal
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
  // Reduce console logging to avoid performance issues
  // console.log("Draw loop, startScreen:", startScreen, "mobileMode:", mobileMode);
  
  if (startScreen && !startTime) {
    background(startScreenColor);
    if (drip && drip.startTime) {
      let progress = min((millis() - drip.startTime) / drip.delay, 1);
      let easedProgress = 1 - Math.pow(1 - progress, 2);
      let currentY = lerp(drip.startY, drip.targetY, easedProgress);
      stroke(22, 22, 22);
      strokeWeight(drip.thickness);
      strokeCap(ROUND);
      line(drip.x, drip.startY, drip.x, currentY);
    }
  } else {
    background(255);
    smooth();
    
    if (isFadingOutCanvas) {
      fadeOutCanvasProgress += deltaTime / 300;
      if (fadeOutCanvasProgress >= 1) {
        isFadingOutCanvas = false;
        splines = [];
        fadeOutCanvasProgress = 0;
      }
      let alpha = lerp(0, 255, fadeOutCanvasProgress);
      
      // Draw all splines with fade effect
      push(); // Save drawing state
      splines.forEach(spline => drawSpline(spline, alpha));
      if (currentSpline) drawSpline(currentSpline, alpha);
      pop(); // Restore drawing state
      
      // Draw fade overlay
      fill(255, 255, 255, alpha);
      noStroke();
      rect(0, 0, width, height);
    } else {
      // Draw all splines normally
      push(); // Save drawing state
      splines.forEach(spline => drawSpline(spline));
      if (currentSpline) drawSpline(currentSpline);
      pop(); // Restore drawing state
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

// Mouse events for desktop
function mousePressed() {
  console.log("Mouse pressed, startScreen:", startScreen, "isFadingOut:", isFadingOut, "mobileMode:", mobileMode);
  
  if (startScreen && !isFadingOut) {
    // Check if we're clicking on the help button
    if (!mobileMode && helpButton && helpButton.elt && 
        dist(mouseX, mouseY, helpButton.position().x + 30, helpButton.position().y + 30) < 30) {
      return;
    }
    fadeOutStartScreen();
  }
}

function mouseDragged() {
  console.log("Mouse dragged, startScreen:", startScreen, "startTime:", startTime);
  
  // Only allow drawing when not in start screen or when startTime is set (matching sketch2.js)
  if (startScreen && !startTime) return;
  
  // Create a new spline if needed
  if (!currentSpline) {
    currentSpline = { 
      points: [], 
      verticalLines: [], 
      baseThickness, 
      color: isDrawingBlack ? color(22, 22, 22) : colors[currentColorIndex] 
    };
    // Always add the first point exactly as is
    currentSpline.points.push(createVector(mouseX, mouseY));
    return;
  }
  
  // Add point with minimum distance check to prevent too many points when drawing slowly
  const newPoint = createVector(mouseX, mouseY);
  const minDistance = 5; // Minimum distance between points
  
  if (dist(currentSpline.points[currentSpline.points.length-1].x, 
           currentSpline.points[currentSpline.points.length-1].y, 
           newPoint.x, newPoint.y) >= minDistance) {
    currentSpline.points.push(newPoint);
  }
}

function mouseReleased() {
  console.log("Mouse released, startScreen:", startScreen, "startTime:", startTime);
  
  // Don't process if we're in the start screen and startTime is not set (matching sketch2.js)
  if (startScreen && !startTime) return;
  if (!currentSpline) return;

  // Process points for drips (matching sketch2.js)
  currentSpline.points.forEach((pt, i, arr) => {
    if (i < arr.length - 1 && dist(pt.x, pt.y, arr[i + 1].x, arr[i + 1].y) > 1) {
      let dripChance = isDrawingBlack ? (mobileMode ? 0.025 : 0.05) : (mobileMode ? 0.05 : 0.1);
      
      if (random() < dripChance) {
        let thickness = mobileMode ? random(5, 15) : random(10, 30);
        let targetY = min(pt.y + random(mobileMode ? 100 : 200, mobileMode ? 300 : 500), height);
        currentSpline.verticalLines.push({ x: pt.x, y: pt.y, targetY, startTime: millis(), thickness, delay: random(500, 2000) });
      }
    }
  });

  splines.push(currentSpline);
  currentSpline = null;
  currentColorIndex = (currentColorIndex + 1) % colors.length;
  
  // Clean up old splines to prevent memory issues
  cleanupOldSplines();
}

// Touch events for mobile
function touchStarted() {
  console.log("Touch started, startScreen:", startScreen, "isFadingOut:", isFadingOut);
  
  if (startScreen && !isFadingOut) {
    fadeOutStartScreen();
    return false; // Prevent default behavior
  }
}

function touchMoved() {
  console.log("Touch moved, startScreen:", startScreen, "startTime:", startTime);
  
  // Only allow drawing when not in start screen or when startTime is set (matching sketch2.js)
  if (startScreen && !startTime) return false;
  
  // Create a new spline if needed
  if (!currentSpline) {
    currentSpline = { 
      points: [], 
      verticalLines: [], 
      baseThickness, 
      color: isDrawingBlack ? color(22, 22, 22) : colors[currentColorIndex] 
    };
    
    // Check if touches array exists and has elements
    if (touches && touches.length > 0) {
      // Always add the first point exactly as is
      currentSpline.points.push(createVector(touches[0].x, touches[0].y));
    }
    return false;
  }
  
  // Check if touches array exists and has elements
  if (touches && touches.length > 0) {
    // Add point with minimum distance check to prevent too many points when drawing slowly
    const newPoint = createVector(touches[0].x, touches[0].y);
    const minDistance = 5; // Minimum distance between points
    
    if (dist(currentSpline.points[currentSpline.points.length-1].x, 
             currentSpline.points[currentSpline.points.length-1].y, 
             newPoint.x, newPoint.y) >= minDistance) {
      currentSpline.points.push(newPoint);
    }
  }
  
  return false; // Prevent scrolling
}

function touchEnded() {
  console.log("Touch ended, startScreen:", startScreen, "startTime:", startTime);
  
  // Don't process if we're in the start screen and startTime is not set (matching sketch2.js)
  if (startScreen && !startTime) return false;
  if (!currentSpline) return false;

  // Process points for drips (matching sketch2.js)
  currentSpline.points.forEach((pt, i, arr) => {
    if (i < arr.length - 1 && dist(pt.x, pt.y, arr[i + 1].x, arr[i + 1].y) > 1) {
      let dripChance = isDrawingBlack ? (mobileMode ? 0.025 : 0.05) : (mobileMode ? 0.05 : 0.1);
      
      if (random() < dripChance) {
        let thickness = mobileMode ? random(5, 15) : random(10, 30);
        let targetY = min(pt.y + random(mobileMode ? 100 : 200, mobileMode ? 300 : 500), height);
        currentSpline.verticalLines.push({ x: pt.x, y: pt.y, targetY, startTime: millis(), thickness, delay: random(500, 2000) });
      }
    }
  });

  splines.push(currentSpline);
  currentSpline = null;
  currentColorIndex = (currentColorIndex + 1) % colors.length;
  
  // Clean up old splines to prevent memory issues
  cleanupOldSplines();
  
  return false;
}

function keyPressed() {
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
  
  // Set stroke properties
  stroke(red(colorToUse), green(colorToUse), blue(colorToUse), fadeAlpha);
  noFill();
  strokeWeight(thicknessToUse);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  
  // Only draw if we have points
  if (spline.points && spline.points.length > 0) {
    // For Safari, simplify the spline if there are too many points
    let pointsToUse = spline.points;
    
    if (isSafari && spline.points.length > 50) {
      // Improved approach for Safari: keep first, last, and points at sharp angles
      pointsToUse = []; // Start with empty array
      
      // Add points that create sharp angles or are spaced apart
      const angleThreshold = 0.3; // Threshold for considering an angle "sharp"
      const distanceThreshold = 20; // Minimum distance to include a point
      let lastIncludedIndex = 0;
      
      // Always include the first point (handled separately)
      const firstPoint = spline.points[0];
      
      for (let i = 1; i < spline.points.length - 1; i++) {
        // Check distance from last included point
        const distFromLast = dist(
          spline.points[i].x, spline.points[i].y,
          spline.points[lastIncludedIndex].x, spline.points[lastIncludedIndex].y
        );
        
        // Include point if it's far enough from the last included point
        if (distFromLast > distanceThreshold) {
          pointsToUse.push(spline.points[i]);
          lastIncludedIndex = i;
          continue;
        }
        
        // Check if this point creates a sharp angle
        if (i > 1) {
          const prev = spline.points[i-1];
          const curr = spline.points[i];
          const next = spline.points[i+1];
          
          // Calculate vectors
          const v1 = createVector(curr.x - prev.x, curr.y - prev.y).normalize();
          const v2 = createVector(next.x - curr.x, next.y - curr.y).normalize();
          
          // Calculate dot product to determine angle
          const dotProduct = v1.dot(v2);
          
          // If angle is sharp enough, include this point
          if (dotProduct < 1 - angleThreshold) {
            pointsToUse.push(spline.points[i]);
            lastIncludedIndex = i;
          }
        }
      }
      
      // Always include last point
      if (spline.points.length > 1) {
        pointsToUse.push(spline.points[spline.points.length - 1]);
      }
    }
    
    // Special handling for the first point to ensure it's preserved
    const firstPoint = spline.points[0];
    
    // Draw a small line at the first point to ensure it's visible
    if (spline.points.length === 1) {
      // For a single point, draw a small dot
      point(firstPoint.x, firstPoint.y);
    } else {
      beginShape();
      
      // Add the first point twice to anchor the curve at the exact position
      curveVertex(firstPoint.x, firstPoint.y);
      curveVertex(firstPoint.x, firstPoint.y);
      
      // Add all remaining points with noise
      if (pointsToUse.length > 0) {
        // If we're using simplified points, add them
        for (let i = 0; i < pointsToUse.length; i++) {
          const pt = pointsToUse[i];
          // Skip the first point as we've already added it
          if (i === 0 && pt.x === firstPoint.x && pt.y === firstPoint.y) continue;
          
          // Apply Perlin noise, but NEVER to the first point
          let noiseScale = 20;
          let noiseX = noise(i * 0.1 + noiseOffset) * noiseScale - noiseScale / 2;
          let noiseY = noise(i * 0.1 + 1000 + noiseOffset) * noiseScale - noiseScale / 2;
          
          let noisyX = pt.x + noiseX;
          let noisyY = pt.y + noiseY;
          
          curveVertex(noisyX, noisyY);
        }
      } else {
        // Otherwise use all original points except the first (already added)
        for (let i = 1; i < spline.points.length; i++) {
          const pt = spline.points[i];
          
          // Apply Perlin noise
          let noiseScale = 20;
          let noiseX = noise(i * 0.1 + noiseOffset) * noiseScale - noiseScale / 2;
          let noiseY = noise(i * 0.1 + 1000 + noiseOffset) * noiseScale - noiseScale / 2;
          
          let noisyX = pt.x + noiseX;
          let noisyY = pt.y + noiseY;
          
          curveVertex(noisyX, noisyY);
        }
      }
      
      // Add the last point twice to anchor the curve at the exact position
      if (spline.points.length > 1) {
        const lastPt = spline.points[spline.points.length - 1];
        curveVertex(lastPt.x, lastPt.y);
      }
      
      endShape();
    }
  }
  
  // Draw vertical drip lines
  if (spline.verticalLines && spline.verticalLines.length > 0) {
    spline.verticalLines.forEach(vl => {
      let progress = min((millis() - vl.startTime) / vl.delay, 1);
      let easedProgress = 1 - Math.pow(1 - progress, 2);
      let currentY = lerp(vl.y, vl.targetY, easedProgress);
      
      // Set stroke weight for this line
      strokeWeight(vl.thickness);
      
      // Draw a simple line
      line(vl.x, vl.y, vl.x, currentY);
    });
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
  let y = 20; // Position at the top of the screen
  fill(200, 200, 200, 200);
  noStroke();
  rect(x, y, meterWidth, meterHeight, 10);
  fill(22, 22, 22);
  textSize(16);
  textAlign(CENTER, CENTER);
  textFont("'Plus Jakarta Sans', sans-serif");
  text(`Mode: ${isDrawingBlack ? 'Black' : 'Colour'}`, x + meterWidth / 2, y + meterHeight / 2);
}

// Add a function to clean up old splines
function cleanupOldSplines() {
  // Keep a reasonable number of splines to prevent memory issues
  if (splines.length > 100) {
    console.log("Cleaning up old splines, before:", splines.length);
    splines = splines.slice(-100); // Keep only the 100 most recent splines
    console.log("After cleanup:", splines.length);
  }
}