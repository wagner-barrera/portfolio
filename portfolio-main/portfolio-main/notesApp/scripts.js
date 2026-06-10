'use strict';

/* ═══════════════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════════════ */
const copyButton      = document.getElementById('copyButton');
const clearButton     = document.getElementById('clearButton');
const statusBadge     = document.getElementById('statusBadge');
const previewText     = document.getElementById('previewText');
const toast           = document.getElementById('toast');

const nameText        = document.getElementById('nameText');
const issueText       = document.getElementById('issueText');
const actionText      = document.getElementById('actionText');
const resolutionText  = document.getElementById('resolutionText');
const allTextareas    = [nameText, issueText, actionText, resolutionText];

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
const panelLeft       = document.getElementById('panelLeft');
const panelDivider    = document.getElementById('panelDivider');
const panelRight      = document.getElementById('panelRight');

/* ═══════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════ */
let images = [];
let imgIdCounter = 0;

/* ═══════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════ */
function showToast(msg, type = 'info', duration = 2500) {
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

function buildNotePlain() {
  const c = nameText.value.trim();
  const i = issueText.value.trim();
  const a = actionText.value.trim();
  const r = resolutionText.value.trim();
  return `${c}\n\nIssue: \n${i}\n\nAction: \n${a}\n\nResolution: \n${r}`;
}

function buildNoteHTML() {
  const c = (nameText.value.trim()       || '').replace(/\n/g, '<br>');
  const i = (issueText.value.trim()      || '').replace(/\n/g, '<br>');
  const a = (actionText.value.trim()     || '').replace(/\n/g, '<br>');
  const r = (resolutionText.value.trim() || '').replace(/\n/g, '<br>');
  return (
    `${c}<br><br>` +
    `<strong>Issue:</strong><br>${i}<br><br>` +
    `<strong>Action:</strong><br>${a}<br><br>` +
    `<strong>Resolution:</strong><br>${r}`
  );
}

function updatePreview() {
  previewText.textContent = buildNotePlain();
}

function updateCanvasCount() {
  const n = images.length;
  canvasCount.textContent = `${n} image${n !== 1 ? 's' : ''}`;
  downloadPdfBtn.disabled = n === 0;
}

/* ═══════════════════════════════════════════════════
   LEFT PANEL — COPY (with bold labels via HTML clipboard)
═══════════════════════════════════════════════════ */
copyButton.addEventListener('click', async () => {
  const plainText = buildNotePlain();
  const htmlText  = buildNoteHTML();

  try {
    // Write both HTML (bold) and plain text to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html':  new Blob([htmlText],  { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      })
    ]);
  } catch {
    // Fallback — plain text only (some browsers restrict ClipboardItem)
    await navigator.clipboard.writeText(plainText).catch(() => {});
  }

  copyButton.innerHTML = '<span class="btn-icon">✅</span><span class="btn-label">Copied!</span>';
  copyButton.classList.add('copied');
  statusBadge.textContent = 'Copied!';
  statusBadge.classList.add('copying');
  showToast('Note copied to clipboard (bold labels) ✓', 'success');

  setTimeout(() => {
    copyButton.innerHTML = '<span class="btn-icon btn-copy-icon">📋</span><span class="btn-label">Copy</span>';
    copyButton.classList.remove('copied');
    statusBadge.textContent = 'Ready';
    statusBadge.classList.remove('copying');
  }, 2500);
});

clearButton.addEventListener('click', () => {
  allTextareas.forEach(ta => (ta.value = ''));
  updatePreview();
  showToast('Fields cleared', 'info');
  nameText.focus();
});

allTextareas.forEach(ta => ta.addEventListener('input', updatePreview));
updatePreview();

/* ═══════════════════════════════════════════════════
   RIGHT PANEL — IMAGE CANVAS
═══════════════════════════════════════════════════ */
function showCanvas() {
  canvasDropzone.style.display = 'none';
  canvasScroll.style.display   = 'flex';
  canvasScroll.style.flexDirection = 'column';
}
function maybeShowDropzone() {
  if (images.length === 0) {
    canvasDropzone.style.display = 'flex';
    canvasScroll.style.display   = 'none';
  }
}

function addImage(dataUrl, name = '') {
  const id = ++imgIdCounter;
  const ts = new Date().toLocaleTimeString();
  images.push({ id, dataUrl, name, timestamp: ts });

  const card = document.createElement('div');
  card.className   = 'image-card';
  card.dataset.id  = id;

  const img    = document.createElement('img');
  img.src      = dataUrl;
  img.alt      = name || `Screenshot ${id}`;
  img.loading  = 'lazy';

  const actions   = document.createElement('div');
  actions.className = 'image-card-actions';

  const deleteBtn = document.createElement('button');
  deleteBtn.className   = 'img-action-btn';
  deleteBtn.title       = 'Remove image';
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
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

function removeImage(id, cardEl) {
  images = images.filter(img => img.id !== id);
  cardEl.style.animation = 'cardSlideIn 0.2s ease reverse';
  setTimeout(() => {
    cardEl.remove();
    canvasImages.querySelectorAll('.image-number').forEach((el, i) => {
      el.textContent = `#${i + 1}`;
    });
    updateCanvasCount();
    maybeShowDropzone();
  }, 180);
}

function processFiles(files) {
  if (!files || files.length === 0) return;
  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (imageFiles.length === 0) { showToast('No image files found', 'error'); return; }
  imageFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => addImage(e.target.result, file.name);
    reader.readAsDataURL(file);
  });
  showToast(`Adding ${imageFiles.length} image${imageFiles.length !== 1 ? 's' : ''}…`, 'info', 1500);
}

selectFileBtn.addEventListener('click', () => fileInput.click());
addMoreBtn.addEventListener('click',    () => fileInputExtra.click());
fileInput.addEventListener('change',      e => { processFiles(e.target.files); e.target.value = ''; });
fileInputExtra.addEventListener('change', e => { processFiles(e.target.files); e.target.value = ''; });

/* — Drag & Drop — */
[canvasDropzone, panelRight].forEach(el => {
  el.addEventListener('dragover',  e => { e.preventDefault(); canvasDropzone.classList.add('drag-over'); });
  el.addEventListener('dragleave', e => { if (!panelRight.contains(e.relatedTarget)) canvasDropzone.classList.remove('drag-over'); });
  el.addEventListener('drop',      e => { e.preventDefault(); canvasDropzone.classList.remove('drag-over'); processFiles(e.dataTransfer.files); });
});

/* — Paste (Ctrl+V) — */
document.addEventListener('paste', e => {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  let found = false;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      found = true;
      const file   = item.getAsFile();
      const reader = new FileReader();
      reader.onload = ev => addImage(ev.target.result, 'Pasted screenshot');
      reader.readAsDataURL(file);
    }
  }
  if (found) showToast('Screenshot added to canvas 🖼️', 'success');
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
   PDF DOWNLOAD — Professional cover + centered images + watermark
═══════════════════════════════════════════════════ */
downloadPdfBtn.addEventListener('click', async () => {
  if (images.length === 0) return;

  const overlay = document.createElement('div');
  overlay.className = 'pdf-overlay';
  overlay.innerHTML = `<div class="pdf-spinner"><div class="spinner-ring"></div><p>Generating PDF…</p></div>`;
  document.body.appendChild(overlay);

  try {
    if (!window.jspdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }

    const { jsPDF } = window.jspdf;
    const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW  = pdf.internal.pageSize.getWidth();   // 210
    const pageH  = pdf.internal.pageSize.getHeight();  // 297
    const margin = 20;
    const now    = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

    // ── COVER PAGE ────────────────────────────────────────────────
    // Header band
    pdf.setFillColor(15, 25, 50);
    pdf.rect(0, 0, pageW, 52, 'F');

    // Accent stripe
    pdf.setFillColor(31, 111, 235);
    pdf.rect(0, 52, pageW, 3, 'F');

    // "TRIMBLE" label top-right
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(88, 166, 255);
    pdf.text('TRIMBLE', pageW - margin, 14, { align: 'right' });

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(26);
    pdf.setTextColor(230, 237, 243);
    pdf.text('CASE REPORT', margin, 32);

    // Subtitle
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(139, 148, 158);
    pdf.text('Technical Support Documentation', margin, 43);

    // Date / time badge area
    pdf.setFontSize(9);
    pdf.setTextColor(139, 148, 158);
    pdf.text(`${dateStr}  ·  ${timeStr}`, margin, 63);

    // Divider line
    pdf.setDrawColor(36, 41, 50);
    pdf.setLineWidth(0.4);
    pdf.line(margin, 70, pageW - margin, 70);

    // ── Bitácora section ──────────────────────────────────────────
    let y = 80;

    function sectionLabel(label, color) {
      pdf.setFillColor(...color);
      pdf.roundedRect(margin, y - 4, 3, 14, 1, 1, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...color);
      pdf.text(label.toUpperCase(), margin + 7, y + 5);
      y += 12;
    }

    function sectionBody(text) {
      if (!text.trim()) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(72, 79, 88);
        pdf.text('—', margin + 7, y);
        y += 8;
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.5);
        pdf.setTextColor(60, 70, 85);
        const lines = pdf.splitTextToSize(text.trim(), pageW - margin * 2 - 7);
        pdf.text(lines, margin + 7, y);
        y += lines.length * 5.5 + 6;
      }
    }

    const customer   = nameText.value.trim();
    const issue      = issueText.value.trim();
    const action     = actionText.value.trim();
    const resolution = resolutionText.value.trim();

    // Customer block (no colored label, just grey)
    if (customer) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(30, 40, 60);
      const cLines = pdf.splitTextToSize(customer, pageW - margin * 2);
      pdf.text(cLines, margin, y);
      y += cLines.length * 6 + 8;
      pdf.setDrawColor(220, 230, 240);
      pdf.line(margin, y, pageW - margin, y);
      y += 10;
    }

    sectionLabel('Issue', [220, 60, 60]);
    sectionBody(issue);

    sectionLabel('Action', [210, 150, 30]);
    sectionBody(action);

    sectionLabel('Resolution', [35, 160, 80]);
    sectionBody(resolution);

    // ── Footer on cover ───────────────────────────────────────────
    pdf.setFillColor(240, 244, 250);
    pdf.rect(0, pageH - 28, pageW, 28, 'F');
    pdf.setDrawColor(210, 220, 235);
    pdf.line(0, pageH - 28, pageW, pageH - 28);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(30, 60, 120);
    pdf.text('Wagner A. Barrera', margin, pageH - 16);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 110, 130);
    pdf.text('Support Specialist  ·  Trimble Inc.', margin, pageH - 8);

    pdf.setFontSize(8);
    pdf.setTextColor(150, 160, 175);
    pdf.text(`Page 1 of ${images.length + 1}`, pageW - margin, pageH - 8, { align: 'right' });

    // ── IMAGE PAGES ───────────────────────────────────────────────
    for (let i = 0; i < images.length; i++) {
      pdf.addPage();

      const { dataUrl } = images[i];
      const dims  = await getImageDimensions(dataUrl);
      const ratio = dims.width / dims.height;

      // Usable area (leave room for header bar + footer)
      const headerH  = 14;
      const footerH  = 14;
      const availW   = pageW - margin * 2;
      const availH   = pageH - headerH - footerH - margin * 2;

      // Fit image within available area preserving aspect ratio
      let imgW = availW;
      let imgH = imgW / ratio;
      if (imgH > availH) { imgH = availH; imgW = imgH * ratio; }

      // Center horizontally and vertically in available area
      const x = margin + (availW - imgW) / 2;
      const y0 = headerH + margin + (availH - imgH) / 2;

      // Subtle header bar
      pdf.setFillColor(245, 248, 252);
      pdf.rect(0, 0, pageW, headerH, 'F');
      pdf.setDrawColor(220, 230, 240);
      pdf.line(0, headerH, pageW, headerH);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(130, 140, 155);
      pdf.text('CASE REPORT  ·  Trimble', margin, 9);
      pdf.text(`Screenshot ${i + 1} of ${images.length}`, pageW - margin, 9, { align: 'right' });

      // Draw image
      const fmt = dataUrl.startsWith('data:image/png') ? 'PNG' :
                  dataUrl.startsWith('data:image/gif') ? 'GIF' : 'JPEG';
      pdf.addImage(dataUrl, fmt, x, y0, imgW, imgH);

      // Optional subtle image border
      pdf.setDrawColor(210, 220, 235);
      pdf.setLineWidth(0.3);
      pdf.rect(x, y0, imgW, imgH);

      // ── WATERMARK ──────────────────────────────────────────────
      addWatermark(pdf, pageW, pageH, 'Wagner A. Barrera');

      // ── Footer ─────────────────────────────────────────────────
      pdf.setFillColor(245, 248, 252);
      pdf.rect(0, pageH - footerH, pageW, footerH, 'F');
      pdf.setDrawColor(220, 230, 240);
      pdf.line(0, pageH - footerH, pageW, pageH - footerH);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(130, 140, 155);
      pdf.text('Wagner A. Barrera  ·  Trimble Inc.', margin, pageH - 4);
      pdf.text(`Page ${i + 2} of ${images.length + 1}`, pageW - margin, pageH - 4, { align: 'right' });
    }

    const filename = `case-report-${now.toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
    showToast(`PDF saved: ${filename} ✓`, 'success', 3500);

  } catch (err) {
    console.error('PDF error:', err);
    showToast('Error generating PDF', 'error');
  } finally {
    overlay.remove();
  }
});

/**
 * Draw a subtle diagonal watermark text on the current page.
 */
function addWatermark(pdf, pageW, pageH) {
  pdf.saveGraphicsState();
  // GState for transparency isn't universally available in jsPDF,
  // so we use a very light gray color to simulate subtlety
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(215, 220, 228);  // very light gray

  // Center of page, rotated 45°
  const cx = pageW / 2;
  const cy = pageH / 2;
  pdf.text('Wagner A. Barrera', cx, cy, {
    align: 'center',
    angle: 45,
    renderingMode: 'fill',
  });

  pdf.restoreGraphicsState();
}

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function getImageDimensions(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = dataUrl;
  });
}

/* ═══════════════════════════════════════════════════
   PANEL DIVIDER — drag resize
═══════════════════════════════════════════════════ */
let isResizing = false, startX = 0, startWidth = 0;

panelDivider.addEventListener('mousedown', e => {
  isResizing = true; startX = e.clientX; startWidth = panelLeft.offsetWidth;
  panelDivider.classList.add('dragging');
  document.body.style.cursor    = 'col-resize';
  document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', e => {
  if (!isResizing) return;
  const newW = Math.min(Math.max(startWidth + (e.clientX - startX), 280), 680);
  panelLeft.style.width = newW + 'px';
});
document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false;
  panelDivider.classList.remove('dragging');
  document.body.style.cursor    = '';
  document.body.style.userSelect = '';
});

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
updateCanvasCount();
