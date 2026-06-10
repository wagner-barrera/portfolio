'use strict';

/* ═══════════════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════════════ */
const copyButton      = document.getElementById('copyButton');
const clearButton     = document.getElementById('clearButton');
const statusBadge     = document.getElementById('statusBadge');
const previewText     = document.getElementById('previewText');
const toast           = document.getElementById('toast');

// Left panel textareas
const nameText       = document.getElementById('nameText');
const issueText      = document.getElementById('issueText');
const actionText     = document.getElementById('actionText');
const resolutionText = document.getElementById('resolutionText');
const allTextareas   = [nameText, issueText, actionText, resolutionText];

// Right panel canvas
const canvasDropzone  = document.getElementById('canvasDropzone');
const canvasScroll    = document.getElementById('canvasScroll');
const canvasImages    = document.getElementById('canvasImages');
const canvasCount     = document.getElementById('canvasCount');
const downloadPdfBtn  = document.getElementById('downloadPdfBtn');
const clearCanvasBtn  = document.getElementById('clearCanvasBtn');
const fileInput       = document.getElementById('fileInput');
const fileInputExtra  = document.getElementById('fileInputExtra');
const selectFileBtn   = document.getElementById('selectFileBtn');
const addMoreBtn      = document.getElementById('addMoreBtn');

// Divider resize
const panelLeft     = document.getElementById('panelLeft');
const panelDivider  = document.getElementById('panelDivider');

/* ═══════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════ */
let images = []; // Array of { id, dataUrl, name, timestamp }
let imgIdCounter = 0;

/* ═══════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════ */
function showToast(msg, type = 'info', duration = 2500) {
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function buildNoteText() {
  const customer   = nameText.value.trim();
  const issue      = issueText.value.trim();
  const action     = actionText.value.trim();
  const resolution = resolutionText.value.trim();
  return `${customer}\n\nIssue: \n${issue}\n\nAction: \n${action}\n\nResolution: \n${resolution}`;
}

function updatePreview() {
  previewText.textContent = buildNoteText();
}

function updateCanvasCount() {
  const n = images.length;
  canvasCount.textContent = `${n} image${n !== 1 ? 's' : ''}`;
  downloadPdfBtn.disabled = n === 0;
}

/* ═══════════════════════════════════════════════════
   LEFT PANEL — COPY / CLEAR
═══════════════════════════════════════════════════ */
copyButton.addEventListener('click', () => {
  const text = buildNoteText();
  navigator.clipboard.writeText(text).then(() => {
    copyButton.innerHTML = '<span class="btn-icon">✅</span><span class="btn-label">Copied!</span>';
    copyButton.classList.add('copied');
    statusBadge.textContent = 'Copied!';
    statusBadge.classList.add('copying');
    showToast('Note copied to clipboard ✓', 'success');
    setTimeout(() => {
      copyButton.innerHTML = '<span class="btn-icon btn-copy-icon">📋</span><span class="btn-label">Copy</span>';
      copyButton.classList.remove('copied');
      statusBadge.textContent = 'Ready';
      statusBadge.classList.remove('copying');
    }, 2500);
  }).catch(() => {
    showToast('Could not access clipboard', 'error');
  });
});

clearButton.addEventListener('click', () => {
  allTextareas.forEach(ta => ta.value = '');
  updatePreview();
  showToast('Fields cleared', 'info');
  nameText.focus();
});

// Live preview update
allTextareas.forEach(ta => {
  ta.addEventListener('input', updatePreview);
});

// Initial preview
updatePreview();

/* ═══════════════════════════════════════════════════
   RIGHT PANEL — IMAGE CANVAS
═══════════════════════════════════════════════════ */

// Show/hide zones
function showCanvas() {
  canvasDropzone.style.display = 'none';
  canvasScroll.style.display = 'flex';
  canvasScroll.style.flexDirection = 'column';
}

function maybeShowDropzone() {
  if (images.length === 0) {
    canvasDropzone.style.display = 'flex';
    canvasScroll.style.display = 'none';
  }
}

// Add image from dataUrl
function addImage(dataUrl, name = '') {
  const id = ++imgIdCounter;
  const ts = new Date().toLocaleTimeString();
  images.push({ id, dataUrl, name, timestamp: ts });

  const card = document.createElement('div');
  card.className = 'image-card';
  card.dataset.id = id;

  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = name || `Screenshot ${id}`;
  img.loading = 'lazy';

  const actions = document.createElement('div');
  actions.className = 'image-card-actions';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'img-action-btn';
  deleteBtn.title = 'Remove image';
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', () => removeImage(id, card));

  actions.appendChild(deleteBtn);

  const label = document.createElement('div');
  label.className = 'image-label';
  label.innerHTML = `<span class="image-number">#${images.length}</span><span>${name || 'Screenshot'} · ${ts}</span>`;

  card.appendChild(img);
  card.appendChild(actions);
  card.appendChild(label);
  canvasImages.appendChild(card);

  showCanvas();
  updateCanvasCount();

  // Scroll to new image
  setTimeout(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
}

function removeImage(id, cardEl) {
  images = images.filter(img => img.id !== id);
  cardEl.style.animation = 'cardSlideIn 0.2s ease reverse';
  setTimeout(() => {
    cardEl.remove();
    // Re-number remaining cards
    const labels = canvasImages.querySelectorAll('.image-number');
    labels.forEach((el, i) => el.textContent = `#${i + 1}`);
    updateCanvasCount();
    maybeShowDropzone();
  }, 180);
}

// Process File objects
function processFiles(files) {
  if (!files || files.length === 0) return;
  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (imageFiles.length === 0) {
    showToast('No image files found', 'error');
    return;
  }
  imageFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => addImage(e.target.result, file.name);
    reader.readAsDataURL(file);
  });
  showToast(`Adding ${imageFiles.length} image${imageFiles.length !== 1 ? 's' : ''}…`, 'info', 1500);
}

/* — File input buttons — */
selectFileBtn.addEventListener('click', () => fileInput.click());
addMoreBtn.addEventListener('click', () => fileInputExtra.click());
fileInput.addEventListener('change', (e) => { processFiles(e.target.files); e.target.value = ''; });
fileInputExtra.addEventListener('change', (e) => { processFiles(e.target.files); e.target.value = ''; });

/* — Drag & Drop — */
function handleDragOver(e) {
  e.preventDefault();
  canvasDropzone.classList.add('drag-over');
}
function handleDragLeave() {
  canvasDropzone.classList.remove('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  canvasDropzone.classList.remove('drag-over');
  processFiles(e.dataTransfer.files);
}

// Drop on the dropzone
canvasDropzone.addEventListener('dragover', handleDragOver);
canvasDropzone.addEventListener('dragleave', handleDragLeave);
canvasDropzone.addEventListener('drop', handleDrop);

// Drop anywhere on the right panel
const panelRight = document.getElementById('panelRight');
panelRight.addEventListener('dragover', (e) => {
  e.preventDefault();
  canvasDropzone.classList.add('drag-over');
});
panelRight.addEventListener('dragleave', (e) => {
  if (!panelRight.contains(e.relatedTarget)) {
    canvasDropzone.classList.remove('drag-over');
  }
});
panelRight.addEventListener('drop', (e) => {
  e.preventDefault();
  canvasDropzone.classList.remove('drag-over');
  processFiles(e.dataTransfer.files);
});

/* — Paste (Ctrl+V anywhere on page) — */
document.addEventListener('paste', (e) => {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  let found = false;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      found = true;
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (ev) => addImage(ev.target.result, 'Pasted screenshot');
      reader.readAsDataURL(file);
    }
  }
  if (found) {
    showToast('Screenshot added to canvas 🖼️', 'success');
  }
});

/* — Clear canvas — */
clearCanvasBtn.addEventListener('click', () => {
  if (images.length === 0) return;
  if (!confirm(`Remove all ${images.length} image${images.length !== 1 ? 's' : ''} from the canvas?`)) return;
  images = [];
  canvasImages.innerHTML = '';
  updateCanvasCount();
  maybeShowDropzone();
  showToast('Canvas cleared', 'info');
});

/* ═══════════════════════════════════════════════════
   PDF DOWNLOAD — using jsPDF (loaded dynamically)
═══════════════════════════════════════════════════ */
downloadPdfBtn.addEventListener('click', async () => {
  if (images.length === 0) return;

  // Show overlay
  const overlay = document.createElement('div');
  overlay.className = 'pdf-overlay';
  overlay.innerHTML = `
    <div class="pdf-spinner">
      <div class="spinner-ring"></div>
      <p>Generating PDF…</p>
    </div>`;
  document.body.appendChild(overlay);

  try {
    // Dynamically load jsPDF if not already loaded
    if (!window.jspdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }

    const { jsPDF } = window.jspdf;

    // A4 portrait
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const maxW = pageW - margin * 2;

    // Optional: add note text as first page
    const noteText = buildNoteText().trim();
    if (noteText) {
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const lines = pdf.splitTextToSize(noteText, maxW);
      pdf.text(lines, margin, margin + 5);
      pdf.addPage();
    }

    for (let i = 0; i < images.length; i++) {
      const { dataUrl } = images[i];

      // Get image dimensions
      const dims = await getImageDimensions(dataUrl);
      const ratio = dims.width / dims.height;
      let imgW = maxW;
      let imgH = imgW / ratio;

      // If image is taller than page, scale down
      const maxH = pageH - margin * 2;
      if (imgH > maxH) {
        imgH = maxH;
        imgW = imgH * ratio;
      }

      const x = margin + (maxW - imgW) / 2;
      const format = dataUrl.startsWith('data:image/png') ? 'PNG' :
                     dataUrl.startsWith('data:image/gif') ? 'GIF' : 'JPEG';

      pdf.addImage(dataUrl, format, x, margin, imgW, imgH);

      if (i < images.length - 1) pdf.addPage();
    }

    const filename = `case-screenshots-${new Date().toISOString().slice(0,10)}.pdf`;
    pdf.save(filename);
    showToast(`PDF saved: ${filename} ✓`, 'success', 3500);
  } catch (err) {
    console.error('PDF error:', err);
    showToast('Error generating PDF', 'error');
  } finally {
    overlay.remove();
  }
});

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = dataUrl;
  });
}

/* ═══════════════════════════════════════════════════
   PANEL DIVIDER — drag to resize
═══════════════════════════════════════════════════ */
let isResizing = false;
let startX = 0;
let startWidth = 0;

panelDivider.addEventListener('mousedown', (e) => {
  isResizing = true;
  startX = e.clientX;
  startWidth = panelLeft.offsetWidth;
  panelDivider.classList.add('dragging');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const delta = e.clientX - startX;
  const newWidth = Math.min(Math.max(startWidth + delta, 280), 680);
  panelLeft.style.width = newWidth + 'px';
});

document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false;
  panelDivider.classList.remove('dragging');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
});

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
updateCanvasCount();
