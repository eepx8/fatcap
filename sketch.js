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
let brushSizeOverlay = { 
  visible: false, 
  timer: 0, 
  duration: 1000, 
  opacity: 0,
  targetSize: 0,      // Target size for animation
  currentSize: 0,     // Current animated size
  startSize: 0,       // Starting size for animation
  animationStartTime: 0, // When the animation started
  bounceAmount: 0.2   // How much to overshoot (20%)
};
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
  
  // Add rotation animation style
  addRotationStyle();
  
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
      icecream: [
        color(255, 0, 51),       // Bright red
        color(102, 178, 255),    // Bright blue
        color(0, 255, 128),      // Bright green
        color(255, 204, 0),      // Bright yellow
        color(255, 77, 166)      // Bright pink
      ],
      neo: [
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
      icecream: [color('#ff0033'), color('#66b2ff'), color('#00ff80'), color('#ffcc00'), color('#ff4da6')],
      neo: [color('#444444'), color('#665233'), color('#2c4a51'), color('#5e4c6a'), color('#42572c')]
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
      saveArtwork();
    });

    // Add touchend handler for mobile devices
    select('#confirmSave', saveModal).elt.addEventListener('touchend', (e) => {
      e.preventDefault(); // Prevent default behavior
      console.log("Save button touchend in modal");
      saveArtwork();
    });

    // Also add touchstart handler to prevent any default browser behavior
    select('#confirmSave', saveModal).elt.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent default behavior
      console.log("Save button touchstart in modal");
    });

    // Add touch events to cancel button too
    select('#cancelSave', saveModal).elt.addEventListener('touchend', (e) => {
      e.preventDefault();
      console.log("Cancel save button touchend");
      closeSaveModal();
    });

    select('#cancelSave', saveModal).elt.addEventListener('touchstart', (e) => {
      e.preventDefault();
      console.log("Cancel save button touchstart");
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
  creditLink.style('pointer-events', 'auto'); // Ensure it's clickable
  creditLink.style('z-index', '1000'); // Ensure it's above canvas
  
  // Add hover effect
  creditLink.mouseOver(() => {
    creditLink.style('opacity', '0.7');
  });
  
  creditLink.mouseOut(() => {
    creditLink.style('opacity', '1');
  });
  
  // Add touch events for mobile
  if (creditLink.elt) {
    creditLink.elt.addEventListener('touchstart', (e) => {
      console.log("Credit link touchstart");
      creditLink.style('opacity', '0.7');
    });
    
    creditLink.elt.addEventListener('touchend', (e) => {
      console.log("Credit link touchend");
      creditLink.style('opacity', '1');
      window.open('https://px8.fi', '_blank');
    });
  }
  
  // Set initial position based on screen size
  updateCreditLinkPosition();
  
  console.log("Setup completed");
}

// Function to update credit link position based on screen size
function updateCreditLinkPosition() {
  if (!creditLink) return;
  
  // Hide credit link when drawing is active (not in start screen)
  if (!startScreen) {
    creditLink.style('display', 'none');
    return;
  }
  
  // Only show credit link on start screen
  creditLink.style('display', 'block');
  creditLink.style('opacity', '1'); // Always set to full opacity, no fade effect
  
  if (mobileMode) {
    // Ensure perfect centering on mobile by using CSS instead of manual calculation
    creditLink.style('position', 'absolute');
    creditLink.style('bottom', '45px');
    creditLink.style('left', '50%');
    creditLink.style('transform', 'translateX(-50%)');
    creditLink.style('text-align', 'center');
    creditLink.style('font-size', '12px'); // Smaller font on mobile
  } else {
    // Bottom left for desktop
    creditLink.style('position', 'absolute');
    creditLink.position(20, height - 30);
    creditLink.style('transform', 'none'); // Remove transform on desktop
    creditLink.style('font-size', '14px'); // Original size for desktop
  }
}

function windowResized() {
  let prevMobileMode = mobileMode;
  resizeCanvas(windowWidth, windowHeight);
  mobileMode = windowWidth < 600;
  console.log("Window resized, mobileMode:", mobileMode);
  
  // Handle changes in mode (desktop/mobile)
  if (mobileMode !== prevMobileMode) {
    console.log("Device mode changed from", prevMobileMode ? "mobile" : "desktop", 
                "to", mobileMode ? "mobile" : "desktop");
                
    // Clear all existing controls and recreate appropriate ones
    controls.forEach(control => control.remove());
    controls = [];
    
    if (mobileMode && !startScreen) {
      // Switching to mobile mode outside start screen
      createMobileControls();
      
      // Hide desktop controls
      if (helpButton) {
        helpButton.style('opacity', '0');
        helpButton.style('display', 'none');
      }
    } else if (!mobileMode && !startScreen) {
      // Switching to desktop mode outside start screen
      // Show desktop controls
      if (helpButton) {
        helpButton.style('display', 'flex');
        helpButton.style('opacity', '1');
        helpButton.position(width - 70, 10);
      }
    }
  } else {
    // If staying in same mode, only reposition controls
    if (!mobileMode) {
      if (helpButton) {
        helpButton.position(width - 70, 10);
      }
    } else if (mobileMode && !startScreen) {
      // Recreate mobile controls to ensure proper positioning
      createMobileControls();
    }
  }
  
  // Update credit link position
  updateCreditLinkPosition();
  
  // Update start screen elements if in start screen
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
    if (mobileMode) {
      // Move subtitle much higher on mobile (equal space between top and logo)
      subtitle.style('top', '10%');
    } else {
      // Move subtitle slightly down on desktop
      subtitle.style('top', '18%');
    }
    subtitle.style('margin-bottom', mobileMode ? '5px' : '60px');
  }
  
  // Update title position - move up on mobile
  if (mobileMode) {
    title.style('top', '45%'); // Move up slightly on mobile
  } else {
    title.style('top', '50%');
  }
  title.style('margin-bottom', mobileMode ? '5px' : '60px');
  
  // Update palette text if it exists
  if (paletteText && paletteText.elt) {
    paletteText.style('top', mobileMode ? '67%' : '72%');
  }
  
  // Update start text if it exists - switch position with palette on mobile
  if (startText && startText.elt) {
    if (mobileMode) {
      startText.style('top', '60%'); // Above palette on mobile
    } else {
      startText.style('top', '90%'); // Below palette on desktop
    }
  }
  
  // Update palette container if it exists
  let paletteContainer = select('.palette-container');
  if (paletteContainer && paletteContainer.elt) {
    if (mobileMode) {
      paletteContainer.style('top', '75%'); // Below start text on mobile
    } else {
      paletteContainer.style('top', '75%'); // Above start text on desktop
    }
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
        
        // Delay showing the palette container with a smoother fade-in
        setTimeout(() => {
          console.log("Showing palette container");
          paletteContainer.style('display', 'flex');
          setTimeout(() => paletteContainer.style('opacity', '1'), 10);
        }, 500); // Additional delay after title fade-in
        
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
  }, 1600); // Adjust timing to match new palette display
  
  console.log("Start screen setup completed");
}

// Function to create palette selection buttons
function createPaletteButtons(container) {
  const palettes = [
    { name: 'Classic', key: 'classic' },
    { name: 'Ice Cream', key: 'icecream' },
    { name: 'Neo', key: 'neo' }
  ];
  
  const buttonSize = mobileMode ? 72 : 60; // 72px for mobile, 60px for desktop
  const spacing = mobileMode ? 15 : 20;
  
  let totalWidth = palettes.length * buttonSize + (palettes.length - 1) * spacing;
  
  // Clear existing buttons first
  paletteButtons = [];
  
  palettes.forEach((palette, index) => {
    // Create container for each button
    let btnContainer = createDiv('')
      .addClass('palette-button-container')
      .style('opacity', '0') // Start with opacity 0
      .style('transform', 'scale(0.8)') // Start slightly smaller
      .style('transition', 'opacity 0.6s ease-in-out, transform 0.6s ease-in-out'); // Enhanced transition
      
    // Create the actual button
    let btn = createButton(palette.name)
      .addClass('palette-button')
      .mousePressed(() => {
        selectPalette(palette.key);
      });
      
    if (mobileMode) {
      btn.style('width', '72px'); // Larger size on mobile
      btn.style('height', '72px');
      btn.style('font-size', '11px');
      btn.style('text-transform', 'none'); // Remove all caps
      btn.style('font-family', "'Plus Jakarta Sans', sans-serif");
      
      // Handle very small screens
      if (windowWidth < 400) {
        btn.style('width', '72px');
        btn.style('height', '72px');
      }
    } else {
      btn.style('font-family', "'Plus Jakarta Sans', sans-serif");
    }
    
    // Add touch support for the buttons
    if (btn.elt) {
      btn.elt.addEventListener('touchend', (e) => {
        e.preventDefault();
        console.log("Palette button touchend:", palette.key);
        selectPalette(palette.key);
      });
    }
    
    btn.parent(btnContainer);
    btnContainer.parent(container);
    
    // Add to global array for later reference
    paletteButtons.push(btnContainer);
    
    // Create a more pronounced staggered animation for each button
    setTimeout(() => {
      btnContainer.style('opacity', '1');
      btnContainer.style('transform', 'scale(1)');
    }, 250 + (index * 200)); // Longer staggered delay for more visible animation
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
  
  if (subtitle) subtitle.style('opacity', '0');
  if (startText) startText.style('opacity', '0');
  if (creditLink) creditLink.style('opacity', '0'); // Fade out credit link
  
  startTime = millis();
  isFadingOut = true;
  fadeOutProgress = 0;
  drip = null;
  
  // Clear blink interval
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }

  // Fade out palette containers first 
  const paletteContainer = select('.palette-container');
  if (paletteContainer && paletteContainer.elt) {
    paletteContainer.style('opacity', '0');
    setTimeout(() => {
      paletteContainer.remove();
      
      // Only create mobile controls after palette container is faded out
      if (mobileMode) {
        // Use the mobile controls function
        createMobileControls();
        
        // Hide desktop controls if they exist
        if (helpButton) helpButton.style('opacity', '0');
      } else {
        // Show desktop controls
        console.log("Showing desktop controls");
        if (helpButton) helpButton.style('opacity', '1');
      }
    }, 500);
  } else {
    // If no palette container, create controls immediately
    if (mobileMode) {
      createMobileControls();
      if (helpButton) helpButton.style('opacity', '0');
    } else {
      console.log("Showing desktop controls");
      if (helpButton) helpButton.style('opacity', '1');
    }
  }

  setTimeout(() => {
    if (subtitle) subtitle.remove();
    if (startText) startText.remove();
    
    // Remove credit link entirely on mobile
    if (mobileMode && creditLink) {
      creditLink.style('display', 'none');
    }
    
    // Clear palette buttons array
    paletteButtons = [];
    
    setTimeout(() => {
      if (title) title.style('opacity', '0');
      setTimeout(() => {
        startScreen = false;
        isFadingOut = false;
        if (title) title.remove();
        if (!mobileMode) {
          if (helpButton) helpButton.style('display', 'flex');
          // Only show credit link on desktop
          if (creditLink) creditLink.style('opacity', '1');
        }
        console.log("Start screen faded out, startScreen:", startScreen);
      }, 500);
    }, 500);
  }, 300);
}

// Function to create wipe animation
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
  wipeAnimation = null;
  
  // Reset palette selection
  selectedPalette = null;
  colors = colorPalettes.classic; // Reset to default until user selects again

  // Clear any existing intervals
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }

  // Clear any existing controls
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

  // Hide desktop UI elements
  if (helpButton) {
    helpButton.style('display', 'none');
    helpButton.style('opacity', '0');
  }
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

  // Reset background color
  startScreenColor = colors[floor(random(colors.length))];
  background(startScreenColor);

  // Reset to start screen state
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
      
      // Draw thickness meter if visible
      if (thicknessMeter.visible) {
        thicknessMeter.timer -= deltaTime;
        if (thicknessMeter.timer <= 0) {
          thicknessMeter.visible = false;
        } else {
          drawThicknessMeter();
        }
      }
      
      // Draw color meter if visible
      if (colorMeter.visible) {
        colorMeter.timer -= deltaTime;
        if (colorMeter.timer <= 0) {
          colorMeter.visible = false;
        } else {
          drawColorMeter();
        }
      }
      
      // Draw brush size overlay if visible
      if (brushSizeOverlay.visible) {
        drawBrushSizeOverlay();
        brushSizeOverlay.timer -= deltaTime;
        if (brushSizeOverlay.timer <= 0) {
          brushSizeOverlay.visible = false;
        }
      }
      
      // Draw credit link if it's visible
      if (creditLink && creditLink.style('display') !== 'none') {
        updateCreditLinkPosition();
      }
    }

    noiseOffset += 0.01;

    if (isFadingOut && startTime) {
      fadeOutProgress += deltaTime / 300;
      if (fadeOutProgress > 1) fadeOutProgress = 1;
      let alpha = lerp(255, 0, fadeOutProgress);
      fill(red(startScreenColor), green(startScreenColor), blue(startScreenColor), alpha);
      noStroke();
      rect(0, 0, width, height);
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
  
  // Check if mouse is over any control button
  if (controls.length > 0) {
    for (let i = 0; i < controls.length; i++) {
      let control = controls[i];
      if (control && control.elt) {
        let rect = control.elt.getBoundingClientRect();
        if (mouseX >= rect.left && mouseX <= rect.right && 
            mouseY >= rect.top && mouseY <= rect.bottom) {
          // Mouse is over a button, don't draw
          return;
        }
      }
    }
  }
  
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
  
  // If touching a button, don't draw and allow the event to propagate
  if (touchingButton) {
    return false;
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
  
  // Show brush size overlay on both mobile and desktop
  brushSizeOverlay.visible = true;
  brushSizeOverlay.timer = brushSizeOverlay.duration;
  brushSizeOverlay.opacity = 0; // Start with zero opacity
  
  // Set up animation properties
  brushSizeOverlay.startSize = brushSizeOverlay.currentSize || 0;
  brushSizeOverlay.targetSize = baseThickness;
  brushSizeOverlay.animationStartTime = millis();
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
        saveButtons.style('width', '100%');
      }
      
      // Make buttons larger on mobile for easier tapping
      let modalButtons = selectAll('.modal-button', saveModalContent);
      modalButtons.forEach(btn => {
        if (mobileMode) {
          btn.style('padding', '16px 24px');
          btn.style('font-size', '16px');
          btn.style('width', '100%');
          btn.style('margin', '0');
          btn.style('border-radius', '8px');
          btn.style('-webkit-tap-highlight-color', 'rgba(0,0,0,0)');
          btn.style('user-select', 'none');
          btn.style('-webkit-user-select', 'none');
        }
      });
      
      // Make save button more prominent
      let confirmButton = select('#confirmSave', saveModalContent);
      if (confirmButton) {
        confirmButton.style('background-color', '#161616');
        confirmButton.style('color', 'white');
        confirmButton.style('font-weight', 'bold');
        confirmButton.style('box-shadow', '0 4px 8px rgba(0,0,0,0.2)');
      }
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

// Function to handle saving artwork
function saveArtwork() {
  console.log("Saving artwork with improved iOS support");
  
  // Close the modal first
  closeSaveModal();
  
  try {
    // Draw elements to the main canvas with white background
    background(255);
    splines.forEach(spline => drawSpline(spline));
    if (currentSpline) drawSpline(currentSpline);
    
    // Hide credit link temporarily
    if (creditLink) creditLink.style('display', 'none');
    
    // Create download link using the canvas data
    const canvas = document.querySelector('canvas');
    const dataURL = canvas.toDataURL('image/png');
    
    // Check for iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      // For iOS devices, create a temporary full-screen image that the user can save
      console.log("iOS device detected, using alternative save method");
      
      // Create a fullscreen overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
      overlay.style.zIndex = '10000';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      
      // Create the image
      const img = document.createElement('img');
      img.src = dataURL;
      img.style.maxWidth = '90%';
      img.style.maxHeight = '70%';
      img.style.objectFit = 'contain';
      img.style.border = '10px solid white';
      
      // Create text instruction
      const instruction = document.createElement('div');
      instruction.innerHTML = 'Touch and hold image to save<br>Tap outside image to cancel';
      instruction.style.color = 'white';
      instruction.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
      instruction.style.textAlign = 'center';
      instruction.style.marginTop = '20px';
      instruction.style.padding = '10px';
      
      // Add elements to the overlay
      overlay.appendChild(img);
      overlay.appendChild(instruction);
      document.body.appendChild(overlay);
      
      // Close when tapping outside the image
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          // Show credit link again
          if (creditLink) creditLink.style('display', 'block');
        }
      });
    } else {
      // For other browsers, use download attribute
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'FATCAP_ART.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show credit link again
      setTimeout(() => {
        if (creditLink) creditLink.style('display', 'block');
      }, 100);
    }
  } catch (error) {
    console.error("Error saving artwork:", error);
    alert("Sorry, couldn't save the artwork.");
    
    // Show credit link again even if there's an error
    if (creditLink) creditLink.style('display', 'block');
  }
}

// Function to create mobile controls with a simple download button
function createMobileControls() {
  console.log("Creating mobile controls");
  
  // Check that we're actually on mobile
  if (!mobileMode) {
    console.log("Skipping mobile controls on desktop");
    return;
  }
  
  // Remove any existing controls first
  controls.forEach(control => control.remove());
  controls = [];
  
  let buttonSize = 60;
  let totalWidth = buttonSize * 5 + 10 * 4; // 5 buttons including save button
  let startX = (width - totalWidth) / 2;
  // Position the buttons at the bottom with a larger margin to move them up slightly
  let buttonY = height - buttonSize - 25; // Changed from 12 to 25 to move up slightly
  
  // Common button styles
  const buttonStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'transform 0.2s ease',
    border: '1px solid white',  // Add white 1px border to all buttons
    borderRadius: '50%'         // Make buttons round
  };
  
  // Increase thickness button
  let increaseBtn = createButton('+')
    .mousePressed(() => { 
      // Add standard animation effect
      animateButtonPress(increaseBtn);
      // Execute action after animation starts
      baseThickness += 20; 
      showThicknessMeter(); 
    })
    .position(startX, buttonY)
    .size(buttonSize, buttonSize)
    .addClass('control-button')
    .style('opacity', '0')
    .style('font-size', '26px'); // Set explicit font size 
    
  // Apply common styles to increase button
  Object.entries(buttonStyle).forEach(([key, value]) => {
    increaseBtn.style(key, value);
  });
    
  // Decrease thickness button
  let decreaseBtn = createButton('-')
    .mousePressed(() => { 
      // Add standard animation effect
      animateButtonPress(decreaseBtn);
      // Execute action after animation starts
      baseThickness = max(20, baseThickness - 20); 
      showThicknessMeter(); 
    })
    .position(startX + buttonSize + 10, buttonY)
    .size(buttonSize, buttonSize)
    .addClass('control-button')
    .style('opacity', '0')
    .style('font-size', '26px'); // Set explicit font size
    
  // Apply common styles to decrease button
  Object.entries(buttonStyle).forEach(([key, value]) => {
    decreaseBtn.style(key, value);
  });
    
  // Color toggle button - needs special handling for the icon color
  let colorBtn = createButton('')
    .mousePressed(() => { 
      // Add animation effect
      animateButtonPress(colorBtn);
      // Toggle color state
      isDrawingBlack = !isDrawingBlack; 
      showColorMeter(); 
      // Update icon color based on mode
      updateColorButtonAppearance(colorBtn);
    })
    .position(startX + (buttonSize + 10) * 2, buttonY)
    .size(buttonSize, buttonSize)
    .addClass('control-button')
    .addClass('icon')
    .style('opacity', '0');
    
  // Apply common styles to color button
  Object.entries(buttonStyle).forEach(([key, value]) => {
    colorBtn.style(key, value);
  });
    
  // Set initial color button appearance
  updateColorButtonAppearance(colorBtn);
    
  // Reset button
  let resetBtn = createButton('')
    .mousePressed(() => { 
      // Add rotation animation
      animateButtonPress(resetBtn, 'rotate');
      // Execute action after animation starts
      if (splines.length > 0) { 
        startWipeAnimation(); 
      }
    })
    .position(startX + (buttonSize + 10) * 3, buttonY)
    .size(buttonSize, buttonSize)
    .addClass('control-button')
    .addClass('icon')
    .style('opacity', '0');
    
  // Apply common styles to reset button
  Object.entries(buttonStyle).forEach(([key, value]) => {
    resetBtn.style(key, value);
  });
    
  // Add icon for reset button
  resetBtn.html('<span class="material-symbols-outlined" style="color: white; font-size: 24px;">restart_alt</span>');
  
  // Add back the save button with simplified functionality
  let saveBtn = createButton('')
    .mousePressed(() => { 
      // Add animation effect
      animateButtonPress(saveBtn);
      // Execute action after animation starts
      simpleScreenshot(); 
    })
    .position(startX + (buttonSize + 10) * 4, buttonY)
    .size(buttonSize, buttonSize)
    .addClass('control-button')
    .addClass('icon')
    .style('opacity', '0');
    
  // Apply common styles to save button
  Object.entries(buttonStyle).forEach(([key, value]) => {
    saveBtn.style(key, value);
  });
    
  // Add icon for save button
  saveBtn.html('<span class="material-symbols-outlined" style="color: white; font-size: 24px;">download</span>');
  
  // Add buttons to controls array
  controls.push(increaseBtn, decreaseBtn, colorBtn, resetBtn, saveBtn);
  
  // Add touch event handlers for mobile
  addTouchHandlers(increaseBtn, () => { 
    animateButtonPress(increaseBtn);
    baseThickness += 20; 
    showThicknessMeter(); 
  });
  
  addTouchHandlers(decreaseBtn, () => { 
    animateButtonPress(decreaseBtn);
    baseThickness = max(20, baseThickness - 20); 
    showThicknessMeter(); 
  });
  
  addTouchHandlers(colorBtn, () => { 
    animateButtonPress(colorBtn);
    isDrawingBlack = !isDrawingBlack; 
    showColorMeter();
    updateColorButtonAppearance(colorBtn);
  });
  
  addTouchHandlers(resetBtn, () => { 
    animateButtonPress(resetBtn, 'rotate');
    if (splines.length > 0) { 
      startWipeAnimation(); 
    }
  });
  
  addTouchHandlers(saveBtn, () => { 
    animateButtonPress(saveBtn);
    simpleScreenshot(); 
  });
  
  // Fade in the buttons
  setTimeout(() => {
    controls.forEach(control => control.style('opacity', '1'));
  }, 10);
}

// Function to animate button press
function animateButtonPress(button, type = 'standard') {
  if (!button || !button.elt) return;
  
  // Remove any existing animation classes
  button.removeClass('rotating');
  
  // Always apply the grow effect to the button itself
  button.style('transform', 'scale(1.2)');
  
  // Only handle rotation animation specially
  if (type === 'rotate') {
    // Add spin animation while also growing
    button.addClass('rotating');
    
    // Remove class after animation completes
    setTimeout(() => {
      button.removeClass('rotating');
    }, 500);
  }
  
  // Return button to normal size after animation
  setTimeout(() => {
    button.style('transform', 'scale(1)');
  }, 200);
}

// Update the color button appearance based on current drawing mode
function updateColorButtonAppearance(button) {
  if (!button || !button.elt) return;
  
  if (isDrawingBlack) {
    // In black mode, show brighter rainbow gradient without dark colors
    button.elt.innerHTML = `
      <span class="material-symbols-outlined" style="background: linear-gradient(90deg, 
        rgba(255,51,51,1) 0%, 
        rgba(255,153,51,1) 20%, 
        rgba(255,255,51,1) 40%, 
        rgba(102,255,51,1) 60%, 
        rgba(255,51,255,1) 80%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        font-size: 24px;">invert_colors</span>
    `;
  } else {
    // In color mode, use white text
    button.elt.innerHTML = '<span class="material-symbols-outlined" style="color: white; font-size: 24px;">invert_colors</span>';
  }
}

// Add a style element for the rotating animation
function addRotationStyle() {
  let style = document.createElement('style');
  style.textContent = `
    .rotating {
      animation: spin 0.5s linear;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg) scale(1.2); }
      100% { transform: rotate(-360deg) scale(1.2); }
    }
  `;
  document.head.appendChild(style);
}

// Simple screenshot function for mobile devices
function simpleScreenshot() {
  try {
    console.log("Taking simple screenshot");
    
    // Draw white background and all elements to the canvas
    background(255);
    splines.forEach(spline => drawSpline(spline));
    if (currentSpline) drawSpline(currentSpline);
    
    // Hide controls and credit link temporarily
    controls.forEach(control => control.style('display', 'none'));
    if (creditLink) creditLink.style('display', 'none');
    
    // Force a redraw to make sure controls are hidden
    redraw();
    
    // Get the canvas element and create a data URL
    const canvas = document.querySelector('canvas');
    const dataURL = canvas.toDataURL('image/png');
    
    // Create a simple popup with the screenshot
    const popup = createDiv();
    popup.addClass('screenshot-popup');
    popup.style('position', 'fixed');
    popup.style('top', '0');
    popup.style('left', '0');
    popup.style('width', '100%');
    popup.style('height', '100%');
    popup.style('background-color', 'rgba(0, 0, 0, 0.9)');
    popup.style('z-index', '10000');
    popup.style('display', 'flex');
    popup.style('flex-direction', 'column');
    popup.style('align-items', 'center');
    popup.style('justify-content', 'center');
    popup.style('opacity', '0');
    popup.style('transition', 'opacity 0.3s ease-in-out');
    
    // Add to DOM first to ensure transitions work
    document.body.appendChild(popup.elt);
    
    // Force a reflow to ensure the transition works
    void popup.elt.offsetWidth;
    
    // Add title in Six Caps font
    const title = createDiv('SAVE ARTWORK?');
    title.style('font-family', "'Six Caps', sans-serif");
    title.style('font-size', '5rem');
    title.style('color', 'white');
    title.style('margin-bottom', '20px');
    title.style('text-align', 'center');
    title.parent(popup);
    
    // Create image element with a clean border
    const img = createImg(dataURL, 'Your artwork');
    img.style('max-width', '85%');
    img.style('max-height', '50%');
    img.style('object-fit', 'contain');
    img.style('display', 'block');
    img.style('margin-bottom', '20px');
    img.style('border', '8px solid white');
    img.style('border-radius', '4px');
    img.parent(popup);
    
    // MAXIMIZE SAVE CAPABILITY - enable ALL possible ways to save the image
    if (img.elt) {
      // Enable all touch and selection options
      img.elt.style.webkitTouchCallout = 'default';
      img.elt.style.webkitUserSelect = 'auto';
      img.elt.style.khtmlUserSelect = 'auto';
      img.elt.style.mozUserSelect = 'auto';
      img.elt.style.msUserSelect = 'auto';
      img.elt.style.userSelect = 'auto';
      
      // Enable all drag options
      img.elt.style.webkitUserDrag = 'element';
      img.elt.style.khtmlUserDrag = 'element';
      img.elt.style.mozUserDrag = 'element';
      img.elt.style.userDrag = 'element';
      
      // Enable all pointer events
      img.elt.style.pointerEvents = 'auto';
      img.elt.style.touchAction = 'auto';
      
      // Allow context menu
      img.elt.oncontextmenu = function() { return true; };
      
      // Ensure the image is fully loaded and not blocked
      img.elt.setAttribute('crossorigin', 'anonymous');
      img.elt.setAttribute('loading', 'eager');
    }
    
    // Create buttons container
    const buttonContainer = createDiv();
    buttonContainer.style('display', 'flex');
    buttonContainer.style('flex-direction', mobileMode ? 'column' : 'row');
    buttonContainer.style('gap', '10px');
    buttonContainer.style('margin-bottom', '20px');
    buttonContainer.style('width', mobileMode ? '85%' : 'auto');
    buttonContainer.parent(popup);
    
    // Create a direct download link
    const downloadLink = createA(dataURL, '', '_blank');
    downloadLink.attribute('download', 'FATCAP_ART.png');
    downloadLink.style('display', 'none');
    downloadLink.parent(popup);
    
    // Add download button with dark styling
    const downloadButton = createButton('Save Canvas');
    downloadButton.style('font-family', "'Plus Jakarta Sans', sans-serif");
    downloadButton.style('background-color', '#000000');
    downloadButton.style('color', 'white');
    downloadButton.style('border', '2px solid white');
    downloadButton.style('border-radius', '30px');
    downloadButton.style('padding', '12px 30px');
    downloadButton.style('font-size', '16px');
    downloadButton.style('font-weight', 'bold');
    downloadButton.style('cursor', 'pointer');
    downloadButton.parent(buttonContainer);
    
    // Handle download button click
    downloadButton.mousePressed(() => {
      downloadLink.elt.click();
    });
    
    // Make sure touch works for download button
    downloadButton.elt.addEventListener('touchend', (e) => {
      e.preventDefault();
      downloadLink.elt.click();
    }, {passive: false});
    
    // Add a Cancel button
    const cancelBtn = createButton('Cancel');
    cancelBtn.style('font-family', "'Plus Jakarta Sans', sans-serif");
    cancelBtn.style('background-color', '#000000');
    cancelBtn.style('color', 'white');
    cancelBtn.style('border', '2px solid white');
    cancelBtn.style('border-radius', '30px');
    cancelBtn.style('padding', '12px 30px');
    cancelBtn.style('font-size', '16px');
    cancelBtn.style('cursor', 'pointer');
    cancelBtn.parent(buttonContainer);
    
    // Close when Cancel button is clicked
    cancelBtn.mousePressed(() => {
      popup.style('opacity', '0');
      setTimeout(() => {
        popup.remove();
        
        // Instead of showing existing controls, recreate them for proper centering
        if (mobileMode) {
          createMobileControls();
        } else {
          controls.forEach(control => control.style('display', 'block'));
        }
        
        // Only show credit link if in start screen
        if (creditLink && startScreen) creditLink.style('display', 'block');
      }, 300); // Wait for fade-out to complete
    });
    
    // Make cancel button work with touch
    if (cancelBtn.elt) {
      cancelBtn.elt.addEventListener('touchend', (e) => {
        e.preventDefault();
        popup.style('opacity', '0');
        setTimeout(() => {
          popup.remove();
          
          // Instead of showing existing controls, recreate them for proper centering
          if (mobileMode) {
            createMobileControls();
          } else {
            controls.forEach(control => control.style('display', 'block'));
          }
          
          // Only show credit link if in start screen
          if (creditLink && startScreen) creditLink.style('display', 'block');
        }, 300);
      }, {passive: false});
    }
    
    // Close popup when clicking outside the image (on the background)
    popup.mousePressed(() => {
      // Only close if the click is directly on the popup background, not its children
      if (event.target === popup.elt) {
        popup.style('opacity', '0');
        setTimeout(() => {
          popup.remove();
          
          // Instead of showing existing controls, recreate them for proper centering
          if (mobileMode) {
            createMobileControls();
          } else {
            controls.forEach(control => control.style('display', 'block'));
          }
          
          // Only show credit link if in start screen
          if (creditLink && startScreen) creditLink.style('display', 'block');
        }, 300); // Wait for fade-out to complete
      }
    });
    
    // Fade in the popup after a short delay
    setTimeout(() => {
      popup.style('opacity', '1');
    }, 10);
    
  } catch (error) {
    console.error("Error taking screenshot:", error);
    // Show controls again in case of error
    controls.forEach(control => control.style('display', 'block'));
    // Only show credit link if in start screen
    if (creditLink && startScreen) creditLink.style('display', 'block');
  }
}

// Helper function to add touch handlers to mobile buttons
function addTouchHandlers(button, callback) {
  if (button.elt) {
    button.elt.addEventListener('touchstart', (e) => {
      e.preventDefault();
      console.log("Button touchstart");
    });
    
    button.elt.addEventListener('touchend', (e) => {
      e.preventDefault();
      console.log("Button touchend");
      callback();
    });
  }
}

function drawBrushSizeOverlay() {
  // Only draw if visible
  if (!brushSizeOverlay.visible) return;
  
  // Calculate opacity based on timer (same as thickness meter)
  if (brushSizeOverlay.timer > brushSizeOverlay.duration * 0.7) {
    // Fade in during the first 30% of duration
    brushSizeOverlay.opacity = map(brushSizeOverlay.timer, brushSizeOverlay.duration, brushSizeOverlay.duration * 0.7, 0, 255);
  } else if (brushSizeOverlay.timer < 300) {
    // Fade out during the last 300ms
    brushSizeOverlay.opacity = map(brushSizeOverlay.timer, 0, 300, 0, 255);
  } else {
    // Full opacity in the middle
    brushSizeOverlay.opacity = 255;
  }
  
  // Position in the center of the screen
  let centerX = width / 2;
  let centerY = height / 2;
  
  // Calculate smooth animated size with bounce effect
  let timeSinceStart = millis() - brushSizeOverlay.animationStartTime;
  let animDuration = 500; // 500ms for the animation
  let progress = constrain(timeSinceStart / animDuration, 0, 1);
  
  // Apply easing with bounce
  // This creates an elastic/bouncy effect that overshoots then settles
  let bouncyProgress;
  if (progress < 0.8) {
    // During the first 80% of the animation, use an overshooting curve
    bouncyProgress = -Math.pow(2, -10 * progress) * Math.sin((progress - 0.1) * 5 * Math.PI) + 1;
    // Add overshoot based on whether we're growing or shrinking
    let isGrowing = brushSizeOverlay.targetSize > brushSizeOverlay.startSize;
    let overshootAmount = isGrowing ? 1 + brushSizeOverlay.bounceAmount : 1 - brushSizeOverlay.bounceAmount;
    bouncyProgress = progress + (bouncyProgress - progress) * overshootAmount;
  } else {
    // In the last 20%, settle to the exact target value
    bouncyProgress = 1 - (1 - progress) * (1 - progress);
  }
  
  // Calculate current size with bouncy animation
  brushSizeOverlay.currentSize = lerp(
    brushSizeOverlay.startSize,
    brushSizeOverlay.targetSize,
    bouncyProgress
  );
  
  // Draw the brush size indicator with the animated size
  push();
  
  // Draw white 50% fill
  fill(255, brushSizeOverlay.opacity * 0.5); // White with 50% of the current opacity
  noStroke();
  ellipse(centerX, centerY, brushSizeOverlay.currentSize, brushSizeOverlay.currentSize);
  
  // Draw dashed black 50% border
  noFill();
  stroke(0, brushSizeOverlay.opacity * 0.5); // Black with 50% of the current opacity
  strokeWeight(2);
  
  // Create a dashed circle manually
  let steps = 36; // Number of segments to create the dashed effect
  let dashLength = 5; // Length of each dash segment in degrees
  let gapLength = 5; // Length of each gap in degrees
  
  // Draw the border with the same thickness as the brush
  for (let angle = 0; angle < 360; angle += dashLength + gapLength) {
    let startRad = radians(angle);
    let endRad = radians(angle + dashLength);
    
    let startX = centerX + (brushSizeOverlay.currentSize / 2) * cos(startRad);
    let startY = centerY + (brushSizeOverlay.currentSize / 2) * sin(startRad);
    let endX = centerX + (brushSizeOverlay.currentSize / 2) * cos(endRad);
    let endY = centerY + (brushSizeOverlay.currentSize / 2) * sin(endRad);
    
    stroke(0, brushSizeOverlay.opacity * 0.5); // Black with 50% opacity
    strokeWeight(2); // Consistent 2px stroke for the dashed border
    line(startX, startY, endX, endY);
  }
  
  pop();
}