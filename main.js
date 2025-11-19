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

const templateSelect = document.getElementById("templateSelect");
const imageUpload = document.getElementById("imageUpload");
const topTextInput = document.getElementById("topText");
const bottomTextInput = document.getElementById("bottomText");
const textSizeInput = document.getElementById("textSize");
const textAlignmentSelect = document.getElementById("textAlignment");
const lineSpacingInput = document.getElementById("lineSpacing");
const textColorInput = document.getElementById("textColor");
const borderWidthInput = document.getElementById("borderWidth");
const downloadBtn = document.getElementById("downloadBtn");

const state = {
  baseImage: null,
  baseImageAspect: 1,
  topText: {
    text: "",
    x: canvas.width / 2,
    y: canvas.height * 0.1,
  },
  bottomText: {
    text: "",
    x: canvas.width / 2,
    y: canvas.height * 0.9,
  },
  isDragging: null,
  fontSize: parseInt(textSizeInput.value, 10),
  alignment: textAlignmentSelect.value,
  lineSpacing: parseFloat(lineSpacingInput.value),
  textColor: textColorInput.value,
  borderWidth: parseInt(borderWidthInput.value, 10),
};

function populateTemplates() {
  TEMPLATE_IMAGES.forEach((tpl) => {
    const option = document.createElement("option");
    option.value = tpl.path;
    option.textContent = tpl.label;
    templateSelect.appendChild(option);
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

  downloadBtn.disabled = false;

  ctx.drawImage(state.baseImage, 0, 0, canvas.width, canvas.height);

  const fontSize = state.fontSize;
  const lineSpacing = state.lineSpacing;
  const alignment = state.alignment;
  const fontFamily = "Impact, 'Arial Black', sans-serif";

  ctx.lineJoin = "round";
  ctx.textBaseline = "top";
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = state.textColor;
  ctx.lineWidth = state.borderWidth;
  ctx.font = `${fontSize}px ${fontFamily}`;

  drawTextBlock(state.topText, alignment, lineSpacing);
  drawTextBlock(state.bottomText, alignment, lineSpacing);
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

  const padding = 40;
  const maxWidth = canvas.width - padding * 2;
  
  const manualLines = block.text.split("\n");
  const wrappedLines = [];
  
  manualLines.forEach(line => {
    const wrapped = wrapText(line, maxWidth);
    wrappedLines.push(...wrapped);
  });

  ctx.textAlign = alignment;
  let y = block.y;

  wrappedLines.forEach((line, idx) => {
    const lineY = y + idx * state.fontSize * lineSpacing;
    ctx.strokeText(line, block.x, lineY);
    ctx.fillText(line, block.x, lineY);
  });
}

function handleTemplateSelection(event) {
  const value = event.target.value;
  if (!value) return;
  loadImage(value)
    .then((img) => {
      state.baseImage = img;
      state.baseImageAspect = img.width / img.height;
      fitCanvasToImage(state.baseImageAspect);
      resetTextPositions();
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
        resetTextPositions();
        renderCanvas();
        templateSelect.value = "";
      })
      .catch(() => alert("Could not load the uploaded image."));
  };
  reader.readAsDataURL(file);
}

function resetTextPositions() {
  const padding = 30;
  if (state.alignment === "left") {
    state.topText.x = padding;
    state.bottomText.x = padding;
  } else if (state.alignment === "right") {
    state.topText.x = canvas.width - padding;
    state.bottomText.x = canvas.width - padding;
  } else {
    state.topText.x = canvas.width / 2;
    state.bottomText.x = canvas.width / 2;
  }
  state.topText.y = padding;
  state.bottomText.y = canvas.height - state.fontSize * 2;
}

function handleTextChange() {
  state.topText.text = topTextInput.value.toUpperCase();
  state.bottomText.text = bottomTextInput.value.toUpperCase();
  renderCanvas();
}

function handleFontSizeChange(event) {
  state.fontSize = parseInt(event.target.value, 10);
  renderCanvas();
}

function handleAlignmentChange(event) {
  state.alignment = event.target.value;
  resetTextPositions();
  renderCanvas();
}

function handleLineSpacingChange(event) {
  state.lineSpacing = parseFloat(event.target.value);
  renderCanvas();
}

function handleTextColorChange(event) {
  state.textColor = event.target.value;
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
  
  const fontSize = state.fontSize;
  const fontFamily = "Impact, 'Arial Black', sans-serif";
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  const padding = 40;
  const maxWidth = canvas.width - padding * 2;
  
  const manualLines = block.text.split("\n");
  const wrappedLines = [];
  
  manualLines.forEach(line => {
    const wrapped = wrapText(line, maxWidth);
    wrappedLines.push(...wrapped);
  });
  
  const textHeight = wrappedLines.length * state.fontSize * state.lineSpacing;
  const widthEstimate = Math.max(...wrappedLines.map((line) => ctx.measureText(line).width)) + state.fontSize;

  let xStart = block.x;
  if (state.alignment === "center") {
    xStart -= widthEstimate / 2;
  } else if (state.alignment === "right") {
    xStart -= widthEstimate;
  }

  return (
    point.x >= xStart &&
    point.x <= xStart + widthEstimate &&
    point.y >= block.y &&
    point.y <= block.y + textHeight
  );
}

function handleMouseDown(evt) {
  if (!state.baseImage) return;
  const pos = getMousePosition(evt);
  if (isPointInTextBlock(pos, state.topText)) {
    state.isDragging = {
      block: state.topText,
      offsetX: pos.x - state.topText.x,
      offsetY: pos.y - state.topText.y,
    };
  } else if (isPointInTextBlock(pos, state.bottomText)) {
    state.isDragging = {
      block: state.bottomText,
      offsetX: pos.x - state.bottomText.x,
      offsetY: pos.y - state.bottomText.y,
    };
  }
}

function handleMouseMove(evt) {
  if (!state.isDragging) return;
  const pos = getMousePosition(evt);
  state.isDragging.block.x = pos.x - state.isDragging.offsetX;
  state.isDragging.block.y = pos.y - state.isDragging.offsetY;
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

populateTemplates();
renderCanvas();

templateSelect.addEventListener("change", handleTemplateSelection);
imageUpload.addEventListener("change", handleUpload);
topTextInput.addEventListener("input", handleTextChange);
bottomTextInput.addEventListener("input", handleTextChange);
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

