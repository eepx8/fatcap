let splines = [], currentSpline = null, baseThickness = 120, currentColorIndex = 0;
let colors, noiseOffset = 0, isDrawingBlack = false;
let mobileMode = false;
let controls = [];
let startScreen = true;
let title, subtitle, startText, helpButton, helpModal, overlay;
let paletteText = null;
let startScreenColor;
let thicknessMeter = { visible: false, timer: 0, duration: 1000, opacity: 0 };
let colorMeter = { visible: false, timer: 0, duration: 1000, opacity: 0 };
let isFadingOutCanvas = false;
let fadeOutCanvasProgress = 0;
let wipeAnimation = null;
let fadeOutProgress = 0;
let isFadingOut = false;
let drip = null;
let startTime = null;
let blinkInterval = null;
let isSafari = false;
let colorToggleButton = null;
let splineGrowthDuration = 300; // Duration for growth animation in milliseconds

// Color palette definitions
let colorPalettes = {};
let selectedPalette = null;
let paletteButtons = [];

// Add a global variable for the save modal
let saveModal = null;
let canvasPreview = null;
let isModalOpen = false; // New variable to track if any modal is open

// Add variable to track the credit link
let creditLink = null;

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
  
  try {
    // Initialize color palettes AFTER p5.js is initialized
    colorPalettes = {
      classic: [
        color(255, 0, 0),        // Red
        color(0, 153, 255),      // Blue
        color(255, 204, 0),      // Yellow
        color(255, 153, 255),    // Pink
        color(0, 204, 102)       // Green
      ],
      vibrant: [
        color(255, 0, 51),       // Bright red
        color(102, 178, 255),    // Bright blue
        color(0, 255, 128),      // Bright green
        color(255, 204, 0),      // Bright yellow
        color(255, 77, 166)      // Bright pink
      ],
      comp: [
        color(0, 255, 255),      // Cyan
        color(255, 102, 0),      // A shade of orange
        color(0, 51, 255),       // A shade of blue
        color(0, 102, 0),        // A shade of green
        color(255, 51, 153)      // A shade of pink/purple
      ]
    };
    
    // Default to classic palette if none selected
    colors = colorPalettes.classic;
    
    startScreenColor = colors[floor(random(colors.length))];
    background(startScreenColor);
    
    console.log("Color palettes initialized successfully");
  } catch (error) {
    console.error("Error initializing color palettes:", error);
    // Fallback to basic colors if there's an error
    colorPalettes = {
      classic: [color('#ff0000'), color('#0099ff'), color('#ffcc00'), color('#ff99ff'), color('#00cc66')],
      vibrant: [color('#ff0033'), color('#66b2ff'), color('#00ff80'), color('#ffcc00'), color('#ff4da6')],
      comp: [color('#444444'), color('#665233'), color('#2c4a51'), color('#5e4c6a'), color('#42572c')]
    };
    colors = colorPalettes.classic;
    startScreenColor = colors[floor(random(colors.length))];
    background(startScreenColor);
  }

  // Apply body styles
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  document.body.style.mozUserSelect = 'none';
  document.body.style.msUserSelect = 'none';
  document.body.style.touchAction = 'manipulation';
  
  // Add CSS for mobile buttons to ensure they're clickable
  let style = document.createElement('style');
  style.textContent = `
    .control-button {
      z-index: 1000 !important;
      cursor: pointer !important;
      -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
      touch-action: manipulation !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -webkit-touch-callout: none !important;
    }
  `;
  document.head.appendChild(style);

  setupStartScreen();

  if (!mobileMode) {
    console.log("Creating help button for desktop");
    helpButton = createButton('<span class="icon">help</span>')
      .addClass('help-button')
      .position(width - 70, 10)
      .style('opacity', '0')
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
      .addClass('overlay')
      .style('background-color', 'rgba(0, 0, 0, 0.7)'); // Darker overlay

    // Update help modal with improved layout for controls
    helpModal = createDiv(`
      <div class="help-modal-content">
        <h3>CONTROLS</h3>
        <div class="controls-list">
          <div class="control-row">
            <span class="control-key">A</span>
            <span class="control-desc">Hold to draw in black</span>
          </div>
          <div class="control-row">
            <span class="control-key">↑</span>
            <span class="control-desc">Increase thickness</span>
          </div>
          <div class="control-row">
            <span class="control-key">↓</span>
            <span class="control-desc">Decrease thickness</span>
          </div>
          <div class="control-row">
            <span class="control-key">S</span>
            <span class="control-desc">Save canvas as .PNG</span>
          </div>
          <div class="control-row">
            <span class="control-key">R</span>
            <span class="control-desc">Reset canvas</span>
          </div>
        </div>
        <div class="modal-button-container">
          <button id="closeModal" class="modal-button">Close</button>
        </div>
      </div>
    `)
      .addClass('help-modal');
    
    // Create save modal with centered buttons
    saveModal = createDiv(`
      <div class="save-modal-content">
        <h3>SAVE ARTWORK?</h3>
        <div id="canvas-preview-container"></div>
        <div class="save-buttons">
          <button id="cancelSave" class="modal-button">Cancel</button>
          <button id="confirmSave" class="modal-button confirm">Save Canvas</button>
        </div>
      </div>
    `)
      .addClass('help-modal')
      .style('display', 'none');
    
    // Apply increased padding and improved styling to the modal
    let modalContent = select('.help-modal-content', helpModal);
    if (modalContent) {
      modalContent.style('padding', '40px');
      modalContent.style('border-radius', '15px');
      modalContent.style('background', 'none');
      
      // Style the heading
      let heading = select('h3', modalContent);
      if (heading) {
        heading.style('font-size', '5rem');
        heading.style('margin-bottom', '30px');
        heading.style('font-family', "'Six Caps', sans-serif");
      }
      
      // Style the controls list container
      let controlsList = select('.controls-list', modalContent);
      if (controlsList) {
        controlsList.style('display', 'flex');
        controlsList.style('flex-direction', 'column');
        controlsList.style('gap', '15px'); // Add spacing between rows
        controlsList.style('margin-bottom', '40px'); // Add space before the button
      }
      
      // Style each control row
      let controlRows = selectAll('.control-row', modalContent);
      controlRows.forEach(row => {
        row.style('display', 'flex');
        row.style('justify-content', 'space-between');
        row.style('align-items', 'center');
        row.style('width', '100%');
        row.style('position', 'relative'); // Add relative positioning for line positioning
        
        // Get the elements within this row
        let keyElement = select('.control-key', row);
        let descElement = select('.control-desc', row);
        
        // We need to calculate positions after elements are properly rendered
        setTimeout(() => {
          // Get the positions and dimensions now that they're rendered
          if (keyElement && keyElement.elt && descElement && descElement.elt) {
            let keyRect = keyElement.elt.getBoundingClientRect();
            let descRect = descElement.elt.getBoundingClientRect();
            
            // Calculate the line start and end points
            let lineStartX = keyRect.right + 10; // 10px after the key
            let lineEndX = descRect.left - 10; // 10px before the descriptor
            
            // Create and style the line
            let lineEl = createDiv('');
            lineEl.parent(row);
            lineEl.style('position', 'absolute');
            lineEl.style('height', '1px');
            lineEl.style('background-color', 'white');
            lineEl.style('left', lineStartX - row.elt.getBoundingClientRect().left + 'px');
            lineEl.style('width', (lineEndX - lineStartX) + 'px');
            lineEl.style('top', '50%');
            lineEl.style('transform', 'translateY(-50%)');
            lineEl.style('z-index', '0'); // Behind text
          }
        }, 50); // Small delay to ensure elements are rendered
      });
      
      // Style the control keys (make them square)
      let controlKeys = selectAll('.control-key', modalContent);
      controlKeys.forEach(key => {
        key.style('display', 'flex');
        key.style('justify-content', 'center');
        key.style('align-items', 'center');
        key.style('width', '30px');
        key.style('height', '30px');
        key.style('text-align', 'center');
        key.style('border', '1px solid white');
        key.style('border-radius', '5px');
        key.style('padding', '0');
        key.style('margin-right', '10px'); // Reduced margin since we're calculating line position dynamically
        key.style('font-weight', '500');
        key.style('z-index', '1'); // Above the line
        key.style('background-color', 'rgba(0, 0, 0, 0.5)'); // Semi-transparent background
        key.style('position', 'relative'); // Needed for z-index
      });
      
      // Style the control descriptions
      let controlDescs = selectAll('.control-desc', modalContent);
      controlDescs.forEach(desc => {
        desc.style('font-size', '18px');
        desc.style('line-height', '1.8');
        desc.style('font-family', "'Plus Jakarta Sans', sans-serif");
        desc.style('text-align', 'right');
        desc.style('z-index', '1'); // Above the line
        desc.style('position', 'relative'); // Needed for z-index
        desc.style('width', 'auto'); // Let width be determined by content
        desc.style('padding-left', '10px'); // Add some padding to the left
      });
      
      // Style the button container
      let buttonContainer = select('.modal-button-container', modalContent);
      if (buttonContainer) {
        buttonContainer.style('display', 'flex');
        buttonContainer.style('justify-content', 'center');
        buttonContainer.style('margin-top', '10px');
      }
      
      // Style the close button
      let closeButton = select('#closeModal', modalContent);
      if (closeButton) {
        closeButton.style('padding', '12px 24px');
        closeButton.style('font-size', '14px');
        closeButton.style('background-color', '#161616');
        closeButton.style('color', 'white');
        closeButton.style('border', '1px solid white');
        closeButton.style('border-radius', '50px'); // Pill shape
        closeButton.style('cursor', 'pointer');
        closeButton.style('font-family', "'Plus Jakarta Sans', sans-serif");
        closeButton.style('font-weight', '500'); // Add medium font weight
        closeButton.style('transition', 'transform 0.2s ease, opacity 0.2s ease');
        
        // Add hover effects using event listeners
        closeButton.mouseOver(() => {
          closeButton.style('transform', 'scale(1.05)');
        });
        
        closeButton.mouseOut(() => {
          closeButton.style('transform', 'scale(1)');
        });
      }
    }
    
    // Style the save modal
    let saveModalContent = select('.save-modal-content', saveModal);
    if (saveModalContent) {
      saveModalContent.style('padding', '40px');
      saveModalContent.style('border-radius', '15px');
      saveModalContent.style('background', 'none');
      
      // Style the heading
      let heading = select('h3', saveModalContent);
      if (heading) {
        heading.style('font-size', '5rem');
        heading.style('margin-bottom', '30px');
        heading.style('font-family', "'Six Caps', sans-serif");
      }
      
      // Style the buttons container - center the buttons
      let saveButtons = select('.save-buttons', saveModalContent);
      if (saveButtons) {
        saveButtons.style('display', 'flex');
        saveButtons.style('justify-content', 'center');
        saveButtons.style('gap', '20px'); // Add gap between buttons
        saveButtons.style('margin-top', '30px');
      }
      
      // Style the buttons
      let modalButtons = selectAll('.modal-button', saveModalContent);
      modalButtons.forEach(btn => {
        btn.style('padding', '12px 24px');
        btn.style('font-size', '14px');
        btn.style('background-color', '#161616');
        btn.style('color', 'white');
        btn.style('border', '1px solid white');
        btn.style('border-radius', '50px'); // Pill shape
        btn.style('cursor', 'pointer');
        btn.style('font-family', "'Plus Jakarta Sans', sans-serif");
        btn.style('font-weight', '500'); // Add medium font weight
        btn.style('transition', 'transform 0.2s ease, opacity 0.2s ease');
        
        // Add hover effects using event listeners
        btn.mouseOver(() => {
          btn.style('transform', 'scale(1.05)');
        });
        
        btn.mouseOut(() => {
          btn.style('transform', 'scale(1)');
        });
      });
      
      // Style the canvas preview container
      let previewContainer = select('#canvas-preview-container', saveModalContent);
      if (previewContainer) {
        previewContainer.style('width', '100%');
        previewContainer.style('height', '300px');
        previewContainer.style('background-color', '#f5f5f5');
        previewContainer.style('border-radius', '10px');
        previewContainer.style('overflow', 'hidden');
        previewContainer.style('display', 'flex');
        previewContainer.style('align-items', 'center');
        previewContainer.style('justify-content', 'center');
      }
    }

    // Add event listeners for save modal
    select('#cancelSave', saveModal).mousePressed(closeSaveModal);
    select('#confirmSave', saveModal).mousePressed(() => {
      if (mobileMode) {
        // For mobile, we need to use a different approach to save to gallery
        // Create a temporary canvas with a white background
        let saveCanvas = createGraphics(width, height);
        saveCanvas.background(255);
        
        // Draw all splines to this canvas
        splines.forEach(spline => {
          let thicknessToUse = spline.baseThickness;
          let colorToUse = spline.color;
          
          if (red(spline.color) === 22 && green(spline.color) === 22 && blue(spline.color) === 22) {
            thicknessToUse *= 0.5;
          }
          
          // Set stroke properties
          saveCanvas.stroke(red(colorToUse), green(colorToUse), blue(colorToUse));
          saveCanvas.noFill();
          saveCanvas.strokeWeight(thicknessToUse);
          saveCanvas.strokeCap(ROUND);
          saveCanvas.strokeJoin(ROUND);
          
          // Draw the spline
          if (spline.points && spline.points.length > 0) {
            if (spline.points.length === 1) {
              saveCanvas.point(spline.points[0].x, spline.points[0].y);
            } else {
              saveCanvas.beginShape();
              saveCanvas.curveVertex(spline.points[0].x, spline.points[0].y);
              saveCanvas.curveVertex(spline.points[0].x, spline.points[0].y);
              
              for (let i = 1; i < spline.points.length; i++) {
                saveCanvas.curveVertex(spline.points[i].x, spline.points[i].y);
              }
              
              const lastPt = spline.points[spline.points.length - 1];
              saveCanvas.curveVertex(lastPt.x, lastPt.y);
              saveCanvas.endShape();
            }
          }
          
          // Draw drips
          if (spline.verticalLines && spline.verticalLines.length > 0) {
            spline.verticalLines.forEach(vl => {
              saveCanvas.strokeWeight(vl.thickness);
              saveCanvas.line(vl.x, vl.y, vl.x, vl.targetY);
            });
          }
        });
        
        // Create a link element to trigger download
        let link = document.createElement('a');
        link.href = saveCanvas.canvas.toDataURL('image/png');
        link.download = 'FATCAP_ART.png';
        
        // For mobile Safari/iOS, we need to handle this differently
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          // Show an alert with instructions for iOS users
          alert('Long press on the image in the next screen and select "Save Image" to save to your gallery');
          
          // Open the image in a new tab
          window.open(link.href, '_blank');
        } else {
          // For Android and other mobile browsers
          link.click();
        }
      } else {
        // Desktop saving - hide credit link first, then show it again after saving
        if (creditLink) creditLink.style('display', 'none');
        
        // Desktop saving works as before
        background(255);
        splines.forEach(spline => drawSpline(spline));
        if (currentSpline) drawSpline(currentSpline);
        saveCanvas('FATCAP_ART', 'png');
        
        // Show credit link again
        if (creditLink) creditLink.style('display', 'block');
      }
      
      closeSaveModal();
    });

    select('#closeModal', helpModal).mousePressed(closeHelpModal);
  }

  // Create the credit link at the end of setup function after everything else is created
  creditLink = createA('https://px8.fi', 'Made with ♥ by Px8', '_blank');
  creditLink.position(20, height - 30); // Default position, will be adjusted in updateCreditLinkPosition
  creditLink.style('color', '#161616');
  creditLink.style('font-family', "'Plus Jakarta Sans', sans-serif");
  creditLink.style('font-size', '14px');
  creditLink.style('text-decoration', 'underline');
  creditLink.style('transition', 'opacity 0.3s ease');
  
  // Add hover effect
  creditLink.mouseOver(() => {
    creditLink.style('opacity', '0.7');
  });
  
  creditLink.mouseOut(() => {
    creditLink.style('opacity', '1');
  });
  
  // Set initial position based on screen size
  updateCreditLinkPosition();
  
  console.log("Setup completed");
}

// Function to update credit link position based on screen size
function updateCreditLinkPosition() {
  if (!creditLink) return;
  
  if (mobileMode) {
    // Center horizontally at bottom for mobile
    creditLink.position((width - creditLink.elt.offsetWidth) / 2, height - 30);
  } else {
    // Bottom left for desktop
    creditLink.position(20, height - 30);
  }
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
  
  // Update credit link position
  updateCreditLinkPosition();
  
  // Only update elements if they exist and we're in start screen
  if ((startScreen || startTime) && title && title.elt) {
    updateStartScreenElements();
    
    // No need to reposition palette buttons as they use flexbox in the container now
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
  
  // Update palette text if it exists
  if (paletteText && paletteText.elt) {
    paletteText.style('top', mobileMode ? '67%' : '72%');
  }
  
  // Update start text if it exists
  if (startText && startText.elt) {
    startText.style('top', mobileMode ? '85%' : '90%');
  }

  // Only calculate drip if we're in start screen and not transitioning
  try {
    if (startScreen && !startTime && title.elt && title.elt.offsetWidth > 0) {
      // Calculate drip position based on the SVG logo
      let logoImg = select('.logo-svg', title);
      if (logoImg && logoImg.elt && logoImg.elt.offsetWidth > 0) {
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
  } catch (error) {
    console.error("Error calculating drip:", error);
    // Create a default drip at the center if there's an error
    drip = {
      x: width / 2,
      y: height / 3,
      startY: height / 3,
      targetY: height,
      startTime: null,
      thickness: mobileMode ? 10 : 20,
      delay: 2000
    };
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
  
  // Clear palette buttons
  paletteButtons.forEach(container => {
    if (container && container.elt) container.remove();
  });
  paletteButtons = [];
  
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
  
  // Simply make the title non-interactive through CSS
  title.style('pointer-events', 'none');
  
  // Set the SVG content
  title.html(`<img src="img/fatcap.svg" class="logo-svg" alt="FATCAP">`);
    
  // Create start text element
  startText = createElement('p', 'START DRAWING')
    .addClass('start-text')
    .style('display', 'none')
    .style('opacity', '0');

  // Create palette selection container and store it globally for reference
  let paletteContainer = createDiv('')
    .addClass('palette-container')
    .style('display', 'none')
    .style('opacity', '0');
    
  // Create palette buttons
  createPaletteButtons(paletteContainer);

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
        
        // Delay showing the palette container until after the title is fully visible
        setTimeout(() => {
          console.log("Showing palette container");
          paletteContainer.style('display', 'flex');
          setTimeout(() => paletteContainer.style('opacity', '1'), 10);
        }, 300); // Additional delay after title fade-in
        
      }, 600);
    }, 10);
  }, 600);
  
  setTimeout(() => {
    console.log("Showing start text");
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
  }, 1400); // Adjust timing to match new palette display
  
  console.log("Start screen setup completed");
}

// Function to create palette selection buttons
function createPaletteButtons(container) {
  const palettes = [
    { name: "Classic", key: "classic" },
    { name: "Vibrant", key: "vibrant" },
    { name: "Comp.", key: "comp" }
  ];

  let buttonSize = 60;
  let spacing = 20;
  let totalWidth = palettes.length * buttonSize + (palettes.length - 1) * spacing;
  let startX = (width - totalWidth) / 2;
  let buttonY = mobileMode ? height * 0.65 : height * 0.7;

  palettes.forEach((palette, index) => {
    // Create button container
    let btnContainer = createDiv('')
      .addClass('palette-button-container')
      .parent(container);
      
    // Position the container (using the container's absolute positioning)
    btnContainer.style('position', 'relative');
    btnContainer.style('margin', '0 10px');
    
    // Style container
    btnContainer.style('display', 'flex');
    btnContainer.style('flex-direction', 'column');
    btnContainer.style('align-items', 'center');
    btnContainer.style('gap', '5px');
    
    // Create button
    let btn = createButton(palette.name)
      .addClass('palette-button')
      .parent(btnContainer)
      .mousePressed(() => {
        selectPalette(palette.key);
      });
      
    // Style the button
    btn.style('background-color', '#161616');
    btn.style('color', '#fff');
    btn.style('border', 'none');
    btn.style('border-radius', '50%');
    btn.style('width', buttonSize + 'px');
    btn.style('height', buttonSize + 'px');
    btn.style('font-family', "'Plus Jakarta Sans', sans-serif");
    btn.style('font-size', '12px');
    btn.style('cursor', 'pointer');
    btn.style('z-index', '1000');
    btn.style('display', 'flex');
    btn.style('align-items', 'center');
    btn.style('justify-content', 'center');
    btn.style('transition', 'transform 0.2s ease, opacity 0.5s ease-in');
    
    // Add to the array for future reference
    paletteButtons.push(btnContainer);
  });
}

// Function to handle palette selection
function selectPalette(paletteKey) {
  selectedPalette = paletteKey;
  colors = colorPalettes[paletteKey];
  
  // Update background color based on the new palette
  startScreenColor = colors[floor(random(colors.length))];
  background(startScreenColor);
  
  // Update button styles to show selection
  paletteButtons.forEach((container, index) => {
    // Find the button element
    let btn = select('.palette-button', container);
    if (btn) {
      if (index === Object.keys(colorPalettes).indexOf(paletteKey)) {
        btn.style('transform', 'scale(1.2)');
        btn.style('border', '2px solid white');
      } else {
        btn.style('transform', 'scale(1)');
        btn.style('border', 'none');
      }
    }
  });
}

function fadeOutStartScreen() {
  console.log("Start screen triggered, mobileMode:", mobileMode);
  
  // If no palette was selected, choose one randomly
  if (!selectedPalette) {
    const paletteKeys = Object.keys(colorPalettes);
    selectedPalette = paletteKeys[floor(random(paletteKeys.length))];
    colors = colorPalettes[selectedPalette];
    console.log("Randomly selected palette:", selectedPalette);
  }
  
  // Fade out elements
  if (subtitle && subtitle.elt) subtitle.style('opacity', '0');
  if (startText && startText.elt) startText.style('opacity', '0');
  
  // Fade out palette containers
  const paletteContainer = select('.palette-container');
  if (paletteContainer && paletteContainer.elt) {
    paletteContainer.style('opacity', '0');
  }
  
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
    
    // Position buttons higher up from the bottom to avoid system UI overlaps
    let buttonY = height - 120;
    
    // Ensure buttons are within the visible area
    if (buttonY + buttonSize > height - 20) {
      buttonY = height - buttonSize - 20;
    }
    
    console.log(`Positioning mobile buttons at Y: ${buttonY}, screen height: ${height}`);

    // Create increase thickness button
    let increaseBtn = createButton('+')
      .addClass('control-button')
      .position(startX, buttonY);
    
    // Make buttons more visible for debugging
    increaseBtn.style('z-index', '1000');
    increaseBtn.style('opacity', '1'); // Make immediately visible
    increaseBtn.style('font-size', '28px'); // Larger text
    increaseBtn.style('font-weight', 'bold'); // Bolder text
    
    // Add both mouse and touch handlers
    increaseBtn.mousePressed(() => { 
      console.log("Increase thickness button pressed");
      baseThickness += 20; 
      showThicknessMeter(); 
    });
    
    // Add touch event listeners directly to the DOM element
    if (increaseBtn.elt) {
      increaseBtn.elt.addEventListener('touchstart', (e) => {
        console.log("Increase thickness button touchstart");
      }, false);
      
      increaseBtn.elt.addEventListener('touchend', (e) => {
        console.log("Increase thickness button touchend");
        e.preventDefault();
        baseThickness += 20;
        showThicknessMeter();
      }, false);
    }
    
    controls.push(increaseBtn);

    // Create decrease thickness button
    let decreaseBtn = createButton('-')
      .addClass('control-button')
      .position(startX + buttonSize + 10, buttonY);
    
    // Make buttons more visible for debugging
    decreaseBtn.style('z-index', '1000');
    decreaseBtn.style('opacity', '1'); // Make immediately visible
    decreaseBtn.style('font-size', '28px'); // Larger text
    decreaseBtn.style('font-weight', 'bold'); // Bolder text
    
    decreaseBtn.mousePressed(() => { 
      console.log("Decrease thickness button pressed");
      baseThickness = max(20, baseThickness - 20); 
      showThicknessMeter(); 
    });
    
    // Add touch event listeners
    if (decreaseBtn.elt) {
      decreaseBtn.elt.addEventListener('touchstart', (e) => {
        console.log("Decrease thickness button touchstart");
      }, false);
      
      decreaseBtn.elt.addEventListener('touchend', (e) => {
        console.log("Decrease thickness button touchend");
        e.preventDefault();
        baseThickness = max(20, baseThickness - 20);
        showThicknessMeter();
      }, false);
    }
    
    controls.push(decreaseBtn);

    // Create color toggle button
    let colorBtn = createButton('invert_colors')
      .addClass('control-button')
      .addClass('icon')
      .position(startX + (buttonSize + 10) * 2, buttonY);
    
    // Make buttons more visible for debugging
    colorBtn.style('z-index', '1000');
    colorBtn.style('opacity', '1'); // Make immediately visible
    colorBtn.style('font-size', '28px'); // Larger icon
    
    colorBtn.mousePressed(() => { 
      console.log("Color toggle button pressed");
      isDrawingBlack = !isDrawingBlack; 
      showColorMeter(); 
    });
    
    // Add touch event listeners
    if (colorBtn.elt) {
      colorBtn.elt.addEventListener('touchstart', (e) => {
        console.log("Color toggle button touchstart");
      }, false);
      
      colorBtn.elt.addEventListener('touchend', (e) => {
        console.log("Color toggle button touchend");
        e.preventDefault();
        isDrawingBlack = !isDrawingBlack;
        showColorMeter();
      }, false);
    }
    
    controls.push(colorBtn);

    // Create reset button
    let resetBtn = createButton('restart_alt')
      .addClass('control-button')
      .addClass('icon')
      .position(startX + (buttonSize + 10) * 3, buttonY);
    
    // Make buttons more visible for debugging
    resetBtn.style('z-index', '1000');
    resetBtn.style('opacity', '1'); // Make immediately visible
    resetBtn.style('font-size', '28px'); // Larger icon
    
    resetBtn.mousePressed(() => { 
      console.log("Reset button pressed");
      if (splines.length > 0) { 
        startWipeAnimation();
      }
    });
    
    // Add touch event listeners
    if (resetBtn.elt) {
      resetBtn.elt.addEventListener('touchstart', (e) => {
        console.log("Reset button touchstart");
      }, false);
      
      resetBtn.elt.addEventListener('touchend', (e) => {
        console.log("Reset button touchend");
        e.preventDefault();
        if (splines.length > 0) {
          startWipeAnimation();
        }
      }, false);
    }
    
    controls.push(resetBtn);

    // Create save button for mobile 
    let saveBtn = createButton('arrow_downward')
      .addClass('control-button')
      .addClass('icon')
      .position(startX + (buttonSize + 10) * 4, buttonY);

    // Make buttons more visible for debugging
    saveBtn.style('z-index', '1000');
    saveBtn.style('opacity', '1'); // Make immediately visible
    saveBtn.style('font-size', '28px'); // Larger icon

    saveBtn.mousePressed(() => {
      console.log("Save button pressed");
      if (!mobileMode) {
        background(255);
        splines.forEach(spline => drawSpline(spline));
        if (currentSpline) drawSpline(currentSpline);
        saveCanvas('FATCAP_ART', 'png');
      } else {
        // Show save modal on mobile too
        showSaveModal();
      }
    });

    // Add touch event listeners
    if (saveBtn.elt) {
      saveBtn.elt.addEventListener('touchstart', (e) => {
        console.log("Save button touchstart");
      }, false);
      
      saveBtn.elt.addEventListener('touchend', (e) => {
        console.log("Save button touchend");
        e.preventDefault();
        // Show save modal instead of directly saving
        showSaveModal();
      }, false);
    }

    controls.push(saveBtn);

    // No need for fade-in since we're making them immediately visible
    console.log("Mobile controls created and visible");
  } else {
    // No need to show color toggle button on desktop - hide it instead
    if (colorToggleButton) {
      colorToggleButton.style('display', 'none');
    }
  }

  setTimeout(() => {
    if (subtitle && subtitle.elt) subtitle.remove();
    if (startText && startText.elt) startText.remove();
    
    // Remove palette container
    if (paletteContainer && paletteContainer.elt) {
      paletteContainer.remove();
    }
    // Clear palette buttons array
    paletteButtons = [];
    
    setTimeout(() => {
      if (title && title.elt) {
        title.style('opacity', '0');
        setTimeout(() => {
          startScreen = false;
          isFadingOut = false;
          if (title && title.elt) title.remove();
          if (!mobileMode) {
            if (helpButton) {
              helpButton.style('display', 'block');
              helpButton.style('opacity', '0');
              setTimeout(() => {
                helpButton.style('opacity', '1');
                helpButton.style('transition', 'opacity 0.5s ease');
              }, 10);
            }
          }
          console.log("Start screen faded out, startScreen:", startScreen);
        }, 500);
      }
    }, 3000);
  }, 300);
}

// New function to create wipe animation
function startWipeAnimation() {
  console.log("Starting wipe animation");
  // Create a wipe animation that sweeps across the canvas
  wipeAnimation = {
    startTime: millis(),
    duration: 800, // Shorter duration for quicker animation
    progress: 0,
    complete: false,
    centerX: width / 2,
    centerY: height / 2,
    startRadius: 0,
    maxRadius: sqrt(width * width + height * height) // Diagonal of screen
  };
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
  wipeAnimation = null; // Clear wipe animation if it exists
  
  // Reset palette selection
  selectedPalette = null;
  colors = colorPalettes.classic; // Reset to default until user selects again

  // Clear any existing intervals
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }

  // Remove all controls
  controls.forEach(control => control.remove());
  controls = [];
  
  // Clear palette containers and buttons
  const paletteContainer = select('.palette-container');
  if (paletteContainer && paletteContainer.elt) {
    paletteContainer.remove();
  }
  paletteButtons = [];
  
  // Remove any existing text elements
  if (startText && startText.elt) startText.remove();

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
    if (saveModal) {
      saveModal.style('display', 'none');
      saveModal.style('opacity', '0');
    }
    if (overlay) {
      overlay.style('display', 'none');
      overlay.style('opacity', '0');
    }
    isModalOpen = false; // Reset modal open flag
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
    // Show modal and hide credit link
    if (creditLink) creditLink.style('display', 'none');
    
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
      isModalOpen = true; // Set modal open flag
    }, 10);
  } else {
    // Hide modal and show credit link again
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
      isModalOpen = false; // Reset modal open flag
      
      // Show credit link again
      if (creditLink) creditLink.style('display', 'block');
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
    isModalOpen = false; // Reset modal open flag
    
    // Show credit link again
    if (creditLink) creditLink.style('display', 'block');
  }, 300);
}

function draw() {
  // Reduce console logging to avoid performance issues
  // console.log("Draw loop, startScreen:", startScreen, "mobileMode:", mobileMode);
  
  try {
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
      
      if (wipeAnimation) {
        // Update wipe animation
        wipeAnimation.progress = (millis() - wipeAnimation.startTime) / wipeAnimation.duration;
        
        // Check if the animation has covered the entire screen
        // We consider it complete when we're about 90% through the animation
        let visuallyComplete = wipeAnimation.progress >= 0.9;
        
        if (visuallyComplete) {
          // The animation visually covers the whole screen, clear splines
          splines = [];
          currentSpline = null;
          wipeAnimation = null;
          // Now drawing is enabled again automatically since wipeAnimation is null
        } else {
          // Apply easing for smoother animation
          let easedProgress = -Math.pow(wipeAnimation.progress - 1, 2) + 1; // Ease out quad
          
          // Draw radial wipe animation
          let currentRadius = easedProgress * wipeAnimation.maxRadius;
          
          // First render to an offscreen graphics buffer
          // This creates a clean canvas with only our drawings
          let tempCanvas = createGraphics(width, height);
          tempCanvas.background(255);
          
          // Draw all splines to the offscreen buffer
          splines.forEach(spline => {
            let thicknessToUse = spline.baseThickness;
            let colorToUse = spline.color;
            
            if (red(spline.color) === 22 && green(spline.color) === 22 && blue(spline.color) === 22) {
              thicknessToUse *= 0.5;
            }
            
            // Set stroke properties on the buffer
            tempCanvas.stroke(red(colorToUse), green(colorToUse), blue(colorToUse));
            tempCanvas.noFill();
            tempCanvas.strokeWeight(thicknessToUse);
            tempCanvas.strokeCap(ROUND);
            tempCanvas.strokeJoin(ROUND);
            
            // Only draw if we have points
            if (spline.points && spline.points.length > 0) {
              // Special handling for the first point to ensure it's visible
              const firstPoint = spline.points[0];
              
              // Draw a small line at the first point to ensure it's visible
              if (spline.points.length === 1) {
                // For a single point, draw a small dot
                tempCanvas.point(firstPoint.x, firstPoint.y);
              } else {
                tempCanvas.beginShape();
                
                // Add the first point twice to anchor the curve at the exact position
                tempCanvas.curveVertex(firstPoint.x, firstPoint.y);
                tempCanvas.curveVertex(firstPoint.x, firstPoint.y);
                
                // Add all remaining points
                for (let i = 1; i < spline.points.length; i++) {
                  const pt = spline.points[i];
                  tempCanvas.curveVertex(pt.x, pt.y);
                }
                
                // Add the last point twice to anchor the curve at the exact position
                if (spline.points.length > 1) {
                  const lastPt = spline.points[spline.points.length - 1];
                  tempCanvas.curveVertex(lastPt.x, lastPt.y);
                }
                
                tempCanvas.endShape();
              }
            }
            
            // Draw drip lines
            if (spline.verticalLines && spline.verticalLines.length > 0) {
              spline.verticalLines.forEach(vl => {
                let progress = min((millis() - vl.startTime) / vl.delay, 1);
                let easedProgress = 1 - Math.pow(1 - progress, 2);
                let currentY = lerp(vl.y, vl.targetY, easedProgress);
                
                // Set stroke weight for this line
                tempCanvas.strokeWeight(vl.thickness);
                
                // Draw a simple line
                tempCanvas.line(vl.x, vl.y, vl.x, currentY);
              });
            }
          });
          
          // Draw the current spline if it exists
          if (currentSpline) {
            let thicknessToUse = currentSpline.baseThickness;
            let colorToUse = currentSpline.color;
            
            if (red(currentSpline.color) === 22 && green(currentSpline.color) === 22 && blue(currentSpline.color) === 22) {
              thicknessToUse *= 0.5;
            }
            
            tempCanvas.stroke(red(colorToUse), green(colorToUse), blue(colorToUse));
            tempCanvas.noFill();
            tempCanvas.strokeWeight(thicknessToUse);
            tempCanvas.strokeCap(ROUND);
            tempCanvas.strokeJoin(ROUND);
            
            if (currentSpline.points && currentSpline.points.length > 0) {
              const firstPoint = currentSpline.points[0];
              
              if (currentSpline.points.length === 1) {
                tempCanvas.point(firstPoint.x, firstPoint.y);
              } else {
                tempCanvas.beginShape();
                tempCanvas.curveVertex(firstPoint.x, firstPoint.y);
                tempCanvas.curveVertex(firstPoint.x, firstPoint.y);
                
                for (let i = 1; i < currentSpline.points.length; i++) {
                  const pt = currentSpline.points[i];
                  tempCanvas.curveVertex(pt.x, pt.y);
                }
                
                if (currentSpline.points.length > 1) {
                  const lastPt = currentSpline.points[currentSpline.points.length - 1];
                  tempCanvas.curveVertex(lastPt.x, lastPt.y);
                }
                
                tempCanvas.endShape();
              }
            }
          }
          
          // Display the offscreen buffer
          image(tempCanvas, 0, 0);
          
          // Now draw the expanding white circle on top
          noStroke();
          fill(255);
          circle(wipeAnimation.centerX, wipeAnimation.centerY, currentRadius * 2);
          
          // Create a ripple effect with concentric circles
          let rippleCount = 5; // Number of ripple circles
          let rippleWidth = 20; // Width of each ripple
          
          for (let i = 0; i < rippleCount; i++) {
            let rippleRadius = currentRadius - (i * rippleWidth);
            if (rippleRadius > 0) {
              noFill();
              stroke(255);
              strokeWeight(rippleWidth * 0.8);
              circle(wipeAnimation.centerX, wipeAnimation.centerY, rippleRadius * 2);
            }
          }
        }
      } else if (isFadingOutCanvas) {
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
  } catch (error) {
    console.error("Error in draw loop:", error);
    // Try to recover by resetting to start screen
    if (!startScreen) {
      resetToStartScreen();
    }
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
    
    // We don't need to check for title clicks since it's non-interactive via CSS now
    
    // Check if we're clicking on a palette button
    let clickedOnPaletteButton = false;
    paletteButtons.forEach(container => {
      if (container && container.elt) {
        const btn = select('.palette-button', container);
        if (btn && btn.elt) {
          const rect = btn.elt.getBoundingClientRect();
          if (mouseX >= rect.left && mouseX <= rect.right && 
              mouseY >= rect.top && mouseY <= rect.bottom) {
            clickedOnPaletteButton = true;
          }
        }
      }
    });
    
    // If we didn't click on a button, start the drawing
    if (!clickedOnPaletteButton) {
      fadeOutStartScreen();
    }
  }
}

function mouseDragged() {
  console.log("Mouse dragged, startScreen:", startScreen, "startTime:", startTime);
  
  // Only allow drawing when not in start screen or when startTime is set
  // AND when no modal is open
  if ((startScreen && !startTime) || isModalOpen) return;
  
  // Create a new spline if needed
  if (!currentSpline) {
    currentSpline = { 
      points: [], 
      verticalLines: [], 
      baseThickness, 
      color: isDrawingBlack ? color(22, 22, 22) : colors[currentColorIndex],
      creationTime: millis(), // Track when the spline was created
      growthProgress: 0 // Track growth progress
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

  // Ensure growth animation is complete before adding to splines array
  currentSpline.growthProgress = 1;
  splines.push(currentSpline);
  currentSpline = null;
  currentColorIndex = (currentColorIndex + 1) % colors.length;
  
  // Clean up old splines to prevent memory issues
  cleanupOldSplines();
}

// Touch events for mobile
function touchStarted() {
  console.log("Touch started, startScreen:", startScreen, "isFadingOut:", isFadingOut);
  
  // Check if we're touching a control button
  let touchingButton = false;
  
  // Only check for button touches if we have controls
  if (controls.length > 0) {
    for (let i = 0; i < controls.length; i++) {
      let control = controls[i];
      if (control && control.elt) {
        let rect = control.elt.getBoundingClientRect();
        // Check if any touch is on this button
        if (touches && touches.length > 0) {
          for (let t = 0; t < touches.length; t++) {
            if (touches[t].x >= rect.left && touches[t].x <= rect.right &&
                touches[t].y >= rect.top && touches[t].y <= rect.bottom) {
              touchingButton = true;
              break;
            }
          }
        }
      }
      if (touchingButton) break;
    }
  }
  
  // If touching a button, allow the event to propagate
  if (touchingButton) {
    console.log("Touching a button, allowing event to propagate");
    return;
  }
  
  // We don't need to check for title touches since it's non-interactive via CSS now
  
  // Now check if we're touching a palette button
  if (startScreen && !isFadingOut && paletteButtons.length > 0) {
    let touchingPaletteButton = false;
    paletteButtons.forEach(container => {
      if (container && container.elt) {
        const btn = select('.palette-button', container);
        if (btn && btn.elt) {
          const rect = btn.elt.getBoundingClientRect();
          // Check if any touch is on this button
          if (touches && touches.length > 0) {
            for (let t = 0; t < touches.length; t++) {
              if (touches[t].x >= rect.left && touches[t].x <= rect.right &&
                  touches[t].y >= rect.top && touches[t].y <= rect.bottom) {
                touchingPaletteButton = true;
                break;
              }
            }
          }
        }
      }
    });
    
    if (touchingPaletteButton) {
      console.log("Touching a palette button, allowing event to propagate");
      return;
    }
  }
  
  // Otherwise handle as before
  if (startScreen && !isFadingOut) {
    fadeOutStartScreen();
    return false; // Prevent default behavior
  }
  
  return false; // Prevent default behavior for canvas touches
}

function touchMoved() {
  console.log("Touch moved, startScreen:", startScreen, "startTime:", startTime);
  
  // Check if we're touching a control button
  let touchingButton = false;
  
  // Only check for button touches if we have controls
  if (controls.length > 0) {
    for (let i = 0; i < controls.length; i++) {
      let control = controls[i];
      if (control && control.elt) {
        let rect = control.elt.getBoundingClientRect();
        // Check if any touch is on this button
        if (touches && touches.length > 0) {
          for (let t = 0; t < touches.length; t++) {
            if (touches[t].x >= rect.left && touches[t].x <= rect.right &&
                touches[t].y >= rect.top && touches[t].y <= rect.bottom) {
              touchingButton = true;
              break;
            }
          }
        }
      }
      if (touchingButton) break;
    }
  }
  
  // If touching a button, allow the event to propagate
  if (touchingButton) {
    return;
  }
  
  // Only allow drawing when not in start screen or when startTime is set
  // AND when no modal is open
  if ((startScreen && !startTime) || isModalOpen) return false;
  
  // Create a new spline if needed
  if (!currentSpline) {
    currentSpline = { 
      points: [], 
      verticalLines: [], 
      baseThickness, 
      color: isDrawingBlack ? color(22, 22, 22) : colors[currentColorIndex],
      creationTime: millis(), // Track when the spline was created
      growthProgress: 0 // Track growth progress
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
  
  // Check if we're touching a control button
  let touchingButton = false;
  
  // Only check for button touches if we have controls
  if (controls.length > 0) {
    for (let i = 0; i < controls.length; i++) {
      let control = controls[i];
      if (control && control.elt) {
        let rect = control.elt.getBoundingClientRect();
        // For touchEnded, we check if the last touch position was on a button
        // We can't use touches array as it's empty on touchEnded
        if (mouseX >= rect.left && mouseX <= rect.right &&
            mouseY >= rect.top && mouseY <= rect.bottom) {
          touchingButton = true;
          break;
        }
      }
    }
  }
  
  // If touching a button, allow the event to propagate
  if (touchingButton) {
    return;
  }
  
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

  // Ensure growth animation is complete before adding to splines array
  currentSpline.growthProgress = 1;
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
    // Show save modal for both desktop and mobile
    showSaveModal();
  }
  if (key === 'r' || key === 'R') {
    if (splines.length > 0) {
      startWipeAnimation();
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

  // Calculate growth progress for new splines
  if (spline === currentSpline) {
    const elapsed = millis() - spline.creationTime;
    spline.growthProgress = min(elapsed / splineGrowthDuration, 1);
    
    // Apply easing to the growth animation
    let easedProgress = sin((spline.growthProgress * PI) / 2); // Ease out sine
    
    // Scale the thickness based on the growth progress
    thicknessToUse *= easedProgress;
  }

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
    
    // Special handling for the first point to ensure it's visible
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
      
      // Scale drip thickness if this is the current spline being drawn
      let dripThickness = vl.thickness;
      if (spline === currentSpline) {
        dripThickness *= spline.growthProgress;
      }
      
      // Set stroke weight for this line
      strokeWeight(dripThickness);
      
      // Draw a simple line
      line(vl.x, vl.y, vl.x, currentY);
    });
  }
}

function showThicknessMeter() {
  thicknessMeter.visible = true;
  thicknessMeter.timer = thicknessMeter.duration;
  thicknessMeter.opacity = 0; // Start with zero opacity
}

function drawThicknessMeter() {
  let meterWidth = 150;
  let meterHeight = 40;
  let x = width / 2 - meterWidth / 2;
  let y = 20; // Same position as color meter (top center)
  
  // Calculate opacity based on timer
  if (thicknessMeter.timer > thicknessMeter.duration * 0.7) {
    // Fade in during the first 30% of duration
    thicknessMeter.opacity = map(thicknessMeter.timer, thicknessMeter.duration, thicknessMeter.duration * 0.7, 0, 255);
  } else if (thicknessMeter.timer < 300) {
    // Fade out during the last 300ms
    thicknessMeter.opacity = map(thicknessMeter.timer, 0, 300, 0, 255);
  } else {
    // Full opacity in the middle
    thicknessMeter.opacity = 255;
  }
  
  fill(22, 22, 22, thicknessMeter.opacity); // #161616 background with animated opacity
  noStroke();
  rect(x, y, meterWidth, meterHeight, 10);
  fill(255, 255, 255, thicknessMeter.opacity); // #fff text with same opacity
  textSize(16);
  textAlign(CENTER, CENTER);
  textFont("'Plus Jakarta Sans', sans-serif");
  text(`Thickness: ${baseThickness}`, x + meterWidth / 2, y + meterHeight / 2);
}

function showColorMeter() {
  colorMeter.visible = true;
  colorMeter.timer = colorMeter.duration;
  colorMeter.opacity = 0; // Start with zero opacity
}

function drawColorMeter() {
  let meterWidth = 150;
  let meterHeight = 40;
  let x = width / 2 - meterWidth / 2;
  let y = 20; // Already at top center
  
  // Calculate opacity based on timer
  if (colorMeter.timer > colorMeter.duration * 0.7) {
    // Fade in during the first 30% of duration
    colorMeter.opacity = map(colorMeter.timer, colorMeter.duration, colorMeter.duration * 0.7, 0, 255);
  } else if (colorMeter.timer < 300) {
    // Fade out during the last 300ms
    colorMeter.opacity = map(colorMeter.timer, 0, 300, 0, 255);
  } else {
    // Full opacity in the middle
    colorMeter.opacity = 255;
  }
  
  fill(22, 22, 22, colorMeter.opacity); // #161616 background with animated opacity
  noStroke();
  rect(x, y, meterWidth, meterHeight, 10);
  fill(255, 255, 255, colorMeter.opacity); // #fff text with same opacity
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

// Add the showSaveModal function to display the save dialog
function showSaveModal() {
  if (!saveModal) return;
  
  // Hide credit link when showing save modal
  if (creditLink) creditLink.style('display', 'none');
  
  // Create a preview of the current canvas
  updateCanvasPreview();
  
  // Show the modal
  overlay.style('display', 'block');
  saveModal.style('display', 'block');
  
  // Adjust styling for mobile if needed
  if (mobileMode) {
    let saveModalContent = select('.save-modal-content', saveModal);
    if (saveModalContent) {
      saveModalContent.style('padding', '25px');
      
      // Make heading smaller on mobile
      let heading = select('h3', saveModalContent);
      if (heading) {
        heading.style('font-size', '4rem');
        heading.style('margin-bottom', '20px');
      }
      
      // Make the preview larger on mobile
      let previewContainer = select('#canvas-preview-container', saveModalContent);
      if (previewContainer) {
        previewContainer.style('height', '350px');
      }
      
      // Stack buttons vertically on mobile for easier tap targets
      let saveButtons = select('.save-buttons', saveModalContent);
      if (saveButtons) {
        saveButtons.style('flex-direction', mobileMode ? 'column-reverse' : 'row'); // reverse order on mobile
        saveButtons.style('gap', mobileMode ? '15px' : '20px');
      }
      
      // Make buttons larger on mobile for easier tapping, but with smaller text
      let modalButtons = selectAll('.modal-button', saveModalContent);
      modalButtons.forEach(btn => {
        if (mobileMode) {
          btn.style('padding', '16px 24px');
          btn.style('font-size', '14px');
          btn.style('width', '100%');
        }
      });
    }
  }
  
  setTimeout(() => {
    overlay.style('opacity', '1');
    saveModal.style('opacity', '1');
    isModalOpen = true; // Set modal open flag
  }, 10);
}

// Update the canvas preview in the save modal
function updateCanvasPreview() {
  // Get the preview container
  let previewContainer = select('#canvas-preview-container', saveModal);
  if (!previewContainer || !previewContainer.elt) return;
  
  // Clear any existing content
  previewContainer.html('');
  
  // Create a new canvas for the preview - don't include the credit link
  let previewCanvas = createGraphics(width * 0.8, height * 0.8);
  previewCanvas.background(255);
  
  // Draw all splines to the preview canvas
  splines.forEach(spline => {
    let thicknessToUse = spline.baseThickness * 0.8; // Scale down thickness
    let colorToUse = spline.color;
    
    if (red(spline.color) === 22 && green(spline.color) === 22 && blue(spline.color) === 22) {
      thicknessToUse *= 0.5;
    }
    
    // Set stroke properties
    previewCanvas.stroke(colorToUse);
    previewCanvas.noFill();
    previewCanvas.strokeWeight(thicknessToUse);
    previewCanvas.strokeCap(ROUND);
    previewCanvas.strokeJoin(ROUND);
    
    // Draw the spline if it has points
    if (spline.points && spline.points.length > 0) {
      if (spline.points.length === 1) {
        previewCanvas.point(spline.points[0].x * 0.8, spline.points[0].y * 0.8);
      } else {
        previewCanvas.beginShape();
        
        // Add the first point twice
        previewCanvas.curveVertex(spline.points[0].x * 0.8, spline.points[0].y * 0.8);
        previewCanvas.curveVertex(spline.points[0].x * 0.8, spline.points[0].y * 0.8);
        
        // Add the middle points
        for (let i = 1; i < spline.points.length; i++) {
          previewCanvas.curveVertex(spline.points[i].x * 0.8, spline.points[i].y * 0.8);
        }
        
        // Add the last point twice
        const lastIdx = spline.points.length - 1;
        previewCanvas.curveVertex(spline.points[lastIdx].x * 0.8, spline.points[lastIdx].y * 0.8);
        
        previewCanvas.endShape();
      }
    }
    
    // Draw drip lines
    if (spline.verticalLines && spline.verticalLines.length > 0) {
      spline.verticalLines.forEach(vl => {
        previewCanvas.strokeWeight(vl.thickness * 0.8);
        previewCanvas.line(vl.x * 0.8, vl.y * 0.8, vl.x * 0.8, vl.targetY * 0.8);
      });
    }
  });
  
  // Add the current spline if it exists
  if (currentSpline) {
    let thicknessToUse = currentSpline.baseThickness * 0.8;
    let colorToUse = currentSpline.color;
    
    if (red(currentSpline.color) === 22 && green(currentSpline.color) === 22 && blue(currentSpline.color) === 22) {
      thicknessToUse *= 0.5;
    }
    
    previewCanvas.stroke(colorToUse);
    previewCanvas.noFill();
    previewCanvas.strokeWeight(thicknessToUse);
    previewCanvas.strokeCap(ROUND);
    previewCanvas.strokeJoin(ROUND);
    
    if (currentSpline.points && currentSpline.points.length > 0) {
      if (currentSpline.points.length === 1) {
        previewCanvas.point(currentSpline.points[0].x * 0.8, currentSpline.points[0].y * 0.8);
      } else {
        previewCanvas.beginShape();
        
        // Add the first point twice
        previewCanvas.curveVertex(currentSpline.points[0].x * 0.8, currentSpline.points[0].y * 0.8);
        previewCanvas.curveVertex(currentSpline.points[0].x * 0.8, currentSpline.points[0].y * 0.8);
        
        // Add the middle points
        for (let i = 1; i < currentSpline.points.length; i++) {
          previewCanvas.curveVertex(currentSpline.points[i].x * 0.8, currentSpline.points[i].y * 0.8);
        }
        
        // Add the last point twice
        const lastIdx = currentSpline.points.length - 1;
        previewCanvas.curveVertex(currentSpline.points[lastIdx].x * 0.8, currentSpline.points[lastIdx].y * 0.8);
        
        previewCanvas.endShape();
      }
    }
  }
  
  // Create an image from the preview canvas
  let previewImg = createImg(previewCanvas.canvas.toDataURL(), 'preview');
  previewImg.style('max-width', '100%');
  previewImg.style('max-height', '100%');
  previewImg.style('object-fit', 'contain');
  previewImg.parent(previewContainer);
}

// Close the save modal
function closeSaveModal() {
  saveModal.style('opacity', '0');
  overlay.style('opacity', '0');
  
  setTimeout(() => {
    saveModal.style('display', 'none');
    overlay.style('display', 'none');
    isModalOpen = false; // Reset modal open flag
    
    // Show credit link again
    if (creditLink) creditLink.style('display', 'block');
  }, 300);
}