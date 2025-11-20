const TEMPLATE_IMAGES = [
  { label: "2 Choices", path: "assets/2-choices.jpg" },
  { label: "Bell Curve", path: "assets/templates/bell-curve.jpeg" },
  { label: "Big Brain Wojak", path: "assets/templates/big-brain-wojak.jpeg" },
  { label: "Mad Boy", path: "assets/templates/mad-boy.jpeg" },
  { label: "Side Eye", path: "assets/templates/side-eye.jpeg" },
  { label: "WTF", path: "assets/templates/WTF.jpeg" },
];

const canvas = document.getElementById("memeCanvas");
const ctx = canvas.getContext("2d");

const templateGallery = document.getElementById("templateGallery");
const imageUpload = document.getElementById("imageUpload");
const newTextInput = document.getElementById("newText");
const addTextBtn = document.getElementById("addTextBtn");
const textSizeInput = document.getElementById("textSize");
const textAlignmentSelect = document.getElementById("textAlignment");
const lineSpacingInput = document.getElementById("lineSpacing");
const textColorInput = document.getElementById("textColor");
const borderWidthInput = document.getElementById("borderWidth");
const downloadBtn = document.getElementById("downloadBtn");
const textListContainer = document.getElementById("textList");

let textIdCounter = 0;

const state = {
  baseImage: null,
  baseImageAspect: 1,
  textBlocks: [],
  isDragging: null,
  fontSize: parseInt(textSizeInput.value, 10),
  alignment: textAlignmentSelect.value,
  lineSpacing: parseFloat(lineSpacingInput.value),
  textColor: textColorInput.value,
  borderWidth: parseInt(borderWidthInput.value, 10),
  selectedTextId: null,
  activeTextBlockId: null, // Track the text block currently being edited
};

function populateTemplates() {
  templateGallery.innerHTML = "";
  TEMPLATE_IMAGES.forEach((tpl) => {
    const item = document.createElement("div");
    item.className = "template-item";
    item.dataset.path = tpl.path;
    
    const img = document.createElement("img");
    img.src = tpl.path;
    img.alt = tpl.label;
    img.loading = "lazy";
    
    const label = document.createElement("div");
    label.className = "template-item-label";
    label.textContent = tpl.label;
    
    item.appendChild(img);
    item.appendChild(label);
    item.addEventListener("click", () => handleTemplateSelection(tpl.path));
    
    templateGallery.appendChild(item);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fitCanvasToImage(aspect) {
  const maxSize = 800;
  if (aspect >= 1) {
    canvas.width = maxSize;
    canvas.height = maxSize / aspect;
  } else {
    canvas.height = maxSize;
    canvas.width = maxSize * aspect;
  }
  renderCanvas();
}

function renderCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!state.baseImage) {
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Select or upload an image to get started", canvas.width / 2, canvas.height / 2);
    downloadBtn.disabled = true;
    return;
  }
  
  // Show hint if no text blocks exist
  if (state.textBlocks.length === 0) {
    ctx.fillStyle = "rgba(255, 140, 0, 0.3)";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Click anywhere to add text", canvas.width / 2, 30);
  }

  downloadBtn.disabled = false;

  ctx.drawImage(state.baseImage, 0, 0, canvas.width, canvas.height);

  const lineSpacing = state.lineSpacing;
  ctx.lineJoin = "round";
  ctx.textBaseline = "top";

  // Draw all text blocks
  state.textBlocks.forEach((block) => {
    // Don't render empty text blocks
    if (block.text) {
      drawTextBlock(block, block.alignment || state.alignment, lineSpacing);
    }
  });
  
  // Draw selection indicator for selected text block
  if (state.selectedTextId !== null) {
    const selectedBlock = state.textBlocks.find(b => b.id === state.selectedTextId);
    if (selectedBlock) {
      drawSelectionIndicator(selectedBlock);
    }
  }
}

function wrapText(text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + " " + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [text];
}

function drawTextBlock(block, alignment, lineSpacing) {
  if (!block.text) return;

  const fontSize = block.fontSize || state.fontSize;
  const fontFamily = "Impact, 'Arial Black', sans-serif";
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = alignment || state.alignment;
  ctx.fillStyle = block.color || state.textColor;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = state.borderWidth;
  
  const maxWidth = block.width || (canvas.width - 80);
  
  const manualLines = block.text.split("\n");
  const wrappedLines = [];
  
  manualLines.forEach(line => {
    const wrapped = wrapText(line, maxWidth);
    wrappedLines.push(...wrapped);
  });

  let y = block.y;

  wrappedLines.forEach((line, idx) => {
    const lineY = y + idx * fontSize * lineSpacing;
    ctx.strokeText(line, block.x, lineY);
    ctx.fillText(line, block.x, lineY);
  });
}

function drawSelectionIndicator(block) {
  const fontSize = block.fontSize || state.fontSize;
  const fontFamily = "Impact, 'Arial Black', sans-serif";
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = block.alignment || state.alignment;
  
  const maxWidth = block.width || (canvas.width - 80);
  const manualLines = (block.text || "").split("\n");
  const wrappedLines = [];
  
  manualLines.forEach(line => {
    const wrapped = wrapText(line, maxWidth);
    wrappedLines.push(...wrapped);
  });
  
  const lineSpacing = state.lineSpacing;
  const totalHeight = wrappedLines.length > 0 
    ? wrappedLines.length * fontSize * lineSpacing 
    : fontSize * lineSpacing;
  
  let xStart = block.x;
  const alignment = block.alignment || state.alignment;
  const blockWidth = block.width || 200;
  
  if (alignment === "center") {
    xStart -= blockWidth / 2;
  } else if (alignment === "right") {
    xStart -= blockWidth;
  }
  
  // Draw selection rectangle
  ctx.strokeStyle = "#ff8c00";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(xStart - 4, block.y - 4, blockWidth + 8, totalHeight + 8);
  ctx.setLineDash([]);
}

function handleTemplateSelection(path) {
  if (!path) return;
  
  // Update selected state
  document.querySelectorAll(".template-item").forEach((item) => {
    item.classList.remove("selected");
    if (item.dataset.path === path) {
      item.classList.add("selected");
    }
  });
  
  loadImage(path)
    .then((img) => {
      state.baseImage = img;
      state.baseImageAspect = img.width / img.height;
      fitCanvasToImage(state.baseImageAspect);
      renderCanvas();
    })
    .catch(() => {
      alert("Unable to load template image.");
    });
}

function handleUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    loadImage(e.target.result)
      .then((img) => {
        state.baseImage = img;
        state.baseImageAspect = img.width / img.height;
        fitCanvasToImage(state.baseImageAspect);
        renderCanvas();
        // Clear template selection
        document.querySelectorAll(".template-item").forEach((item) => {
          item.classList.remove("selected");
        });
      })
      .catch(() => alert("Could not load the uploaded image."));
  };
  reader.readAsDataURL(file);
}

function createNewTextBlock(x, y) {
  const id = textIdCounter++;
  const newBlock = {
    id,
    text: "",
    x: x || canvas.width / 2,
    y: y || canvas.height / 2,
    width: 200,
    height: 60,
    fontSize: state.fontSize,
    color: state.textColor,
    alignment: state.alignment,
  };

  state.textBlocks.push(newBlock);
  state.selectedTextId = id;
  
  // Make canvas focusable and focus it so user can start typing immediately
  canvas.setAttribute("tabindex", "0");
  canvas.focus();
  
  updateTextList();
  renderCanvas();
  return id;
}


function selectTextBox(id) {
  state.selectedTextId = id;
  canvas.setAttribute("tabindex", "0");
  canvas.focus();
  renderCanvas();
}

function deselectTextBox() {
  // Remove empty text blocks when deselecting
  if (state.selectedTextId !== null) {
    const block = state.textBlocks.find(b => b.id === state.selectedTextId);
    if (block && (!block.text || block.text.trim() === "")) {
      removeTextBlock(state.selectedTextId);
      return;
    }
  }
  state.selectedTextId = null;
  renderCanvas();
}


function updateActiveTextBlock(text) {
  if (state.activeTextBlockId === null) {
    // No active block, create a new one
    createNewTextBlock();
  }

  const block = state.textBlocks.find(b => b.id === state.activeTextBlockId);
  if (block) {
    block.text = text.toUpperCase();
    renderCanvas();
  }
}

function finalizeActiveTextBlock() {
  if (state.activeTextBlockId === null) return;

  const block = state.textBlocks.find(b => b.id === state.activeTextBlockId);
  if (block && !block.text.trim()) {
    // Remove empty text blocks
    removeTextBlock(state.activeTextBlockId);
  } else {
    updateTextList();
  }
  
  state.activeTextBlockId = null;
  newTextInput.value = "";
}

function addTextBlock() {
  const text = newTextInput.value.trim();
  if (!text && state.activeTextBlockId === null) return;

  if (state.activeTextBlockId === null) {
    // Create new block if none exists
    createNewTextBlock();
  }

  updateActiveTextBlock(text);
  finalizeActiveTextBlock();
}

function removeTextBlock(id) {
  state.textBlocks = state.textBlocks.filter((block) => block.id !== id);
  if (state.selectedTextId === id) {
    state.selectedTextId = null;
  }
  if (state.activeTextBlockId === id) {
    state.activeTextBlockId = null;
    newTextInput.value = "";
  }
  updateTextList();
  renderCanvas();
}

function updateTextList() {
  textListContainer.innerHTML = "";
  
  if (state.textBlocks.length === 0) {
    textListContainer.innerHTML = '<p class="no-text-message">No text added yet. Add text above to get started.</p>';
    return;
  }

  state.textBlocks.forEach((block) => {
    const item = document.createElement("div");
    item.className = "text-list-item";
    
    const textSpan = document.createElement("span");
    textSpan.textContent = block.text;
    textSpan.className = "text-content";
    
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = () => removeTextBlock(block.id);
    
    item.appendChild(textSpan);
    item.appendChild(deleteBtn);
    textListContainer.appendChild(item);
  });
}

function handleFontSizeChange(event) {
  state.fontSize = parseInt(event.target.value, 10);
  if (state.selectedTextId !== null) {
    const block = state.textBlocks.find(b => b.id === state.selectedTextId);
    if (block) {
      block.fontSize = state.fontSize;
    }
  }
  renderCanvas();
}

function handleAlignmentChange(event) {
  state.alignment = event.target.value;
  // Update selected text block alignment if one exists
  if (state.selectedTextId !== null) {
    const block = state.textBlocks.find(b => b.id === state.selectedTextId);
    if (block) {
      block.alignment = state.alignment;
    }
  }
  renderCanvas();
}

function handleLineSpacingChange(event) {
  state.lineSpacing = parseFloat(event.target.value);
  renderCanvas();
}

function handleTextColorChange(event) {
  state.textColor = event.target.value;
  // Update selected text block color if one exists
  if (state.selectedTextId !== null) {
    const block = state.textBlocks.find(b => b.id === state.selectedTextId);
    if (block) {
      block.color = state.textColor;
    }
  }
  renderCanvas();
}

function handleBorderWidthChange(event) {
  state.borderWidth = parseInt(event.target.value, 10);
  renderCanvas();
}

function handleDownload() {
  if (!state.baseImage) return;
  const link = document.createElement("a");
  link.download = "meme.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function getMousePosition(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - rect.left) / rect.width) * canvas.width,
    y: ((evt.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function isPointInTextBlock(point, block) {
  if (!block.text) return false;
  
  const blockWidth = block.width || 200;
  const blockHeight = block.height || 60;
  
  let xStart = block.x;
  const alignment = block.alignment || state.alignment;
  
  if (alignment === "center") {
    xStart -= blockWidth / 2;
  } else if (alignment === "right") {
    xStart -= blockWidth;
  }

  return (
    point.x >= xStart &&
    point.x <= xStart + blockWidth &&
    point.y >= block.y &&
    point.y <= block.y + blockHeight
  );
}

function handleMouseDown(evt) {
  if (!state.baseImage) return;
  
  // Only handle clicks directly on the canvas
  if (evt.target !== canvas) {
    return;
  }
  
  const pos = getMousePosition(evt);
  
  // Check if clicking on an existing text block
  let clickedBlock = null;
  for (let i = state.textBlocks.length - 1; i >= 0; i--) {
    const block = state.textBlocks[i];
    if (isPointInTextBlock(pos, block)) {
      clickedBlock = block;
      break;
    }
  }
  
  if (clickedBlock) {
    // Select the clicked text block
    selectTextBox(clickedBlock.id);
    
    // Start dragging
    state.isDragging = {
      block: clickedBlock,
      offsetX: pos.x - clickedBlock.x,
      offsetY: pos.y - clickedBlock.y,
    };
  } else {
    // Create a new text block at the click position
    deselectTextBox();
    createNewTextBlock(pos.x, pos.y);
  }
}

function handleMouseMove(evt) {
  if (!state.isDragging) return;
  
  evt.preventDefault();
  
  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / canvasRect.width;
  const scaleY = canvas.height / canvasRect.height;
  
  const mouseX = (evt.clientX - canvasRect.left) * scaleX;
  const mouseY = (evt.clientY - canvasRect.top) * scaleY;
  
  state.isDragging.block.x = mouseX - state.isDragging.offsetX;
  state.isDragging.block.y = mouseY - state.isDragging.offsetY;
  
  renderCanvas();
}

function handleMouseUp() {
  state.isDragging = null;
}

function handleTouchStart(evt) {
  const touch = evt.touches[0];
  const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
  handleMouseDown(fakeEvent);
}

function handleTouchMove(evt) {
  if (!state.isDragging) return;
  evt.preventDefault();
  const touch = evt.touches[0];
  const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
  handleMouseMove(fakeEvent);
}

function handleTouchEnd() {
  handleMouseUp();
}

// Handle window resize
window.addEventListener("resize", () => {
  renderCanvas();
});

// Handle keyboard input for editing text directly on canvas
canvas.addEventListener("keydown", (e) => {
  if (state.selectedTextId === null) return;
  
  const block = state.textBlocks.find(b => b.id === state.selectedTextId);
  if (!block) return;
  
  // Handle backspace
  if (e.key === "Backspace") {
    e.preventDefault();
    block.text = block.text.slice(0, -1);
    renderCanvas();
    updateTextList();
    return;
  }
  
  // Handle delete key
  if (e.key === "Delete") {
    e.preventDefault();
    if (block.text.length > 0) {
      block.text = "";
      renderCanvas();
      updateTextList();
    } else {
      removeTextBlock(block.id);
    }
    return;
  }
  
  // Handle Enter key (new line)
  if (e.key === "Enter") {
    e.preventDefault();
    block.text += "\n";
    renderCanvas();
    updateTextList();
    return;
  }
  
  // Handle Escape key (deselect)
  if (e.key === "Escape") {
    e.preventDefault();
    deselectTextBox();
    return;
  }
  
  // Handle printable characters
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    block.text += e.key.toUpperCase();
    renderCanvas();
    updateTextList();
  }
});

populateTemplates();
updateTextList();
renderCanvas();

// Template selection is now handled in populateTemplates()
imageUpload.addEventListener("change", handleUpload);

// Keep the old text input functionality for backward compatibility (optional)
addTextBtn.addEventListener("click", addTextBlock);
newTextInput.addEventListener("input", (e) => {
  updateActiveTextBlock(e.target.value);
});
newTextInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    finalizeActiveTextBlock();
  }
});
newTextInput.addEventListener("blur", () => {
  finalizeActiveTextBlock();
});

textSizeInput.addEventListener("input", handleFontSizeChange);
textAlignmentSelect.addEventListener("change", handleAlignmentChange);
lineSpacingInput.addEventListener("input", handleLineSpacingChange);
textColorInput.addEventListener("input", handleTextColorChange);
borderWidthInput.addEventListener("input", handleBorderWidthChange);
downloadBtn.addEventListener("click", handleDownload);

canvas.addEventListener("mousedown", handleMouseDown);
window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd);

