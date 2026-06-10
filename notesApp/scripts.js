'use strict';

/* ═══════════════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════════════ */
const copyButton      = document.getElementById('copyButton');
const clearButton     = document.getElementById('clearButton');
const statusBadge     = document.getElementById('statusBadge');
const previewText     = document.getElementById('previewText'); // may be null after UI update
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
let images       = [];
let imgIdCounter = 0;

/* ═══════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════ */
function showToast(msg, type = 'info', duration = 2500) {
  toast.textContent = msg;
  toast.className   = `toast show ${type}`;
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
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  const c = esc(nameText.value.trim());
  const i = esc(issueText.value.trim());
  const a = esc(actionText.value.trim());
  const r = esc(resolutionText.value.trim());
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">` +
    `<p>${c}</p>` +
    `<p><strong>Issue:</strong><br>${i}</p>` +
    `<p><strong>Action:</strong><br>${a}</p>` +
    `<p><strong>Resolution:</strong><br>${r}</p>` +
    `</div>`;
}

function updatePreview() {
  if (previewText) previewText.textContent = buildNotePlain();
}

function updateCanvasCount() {
  const n = images.length;
  canvasCount.textContent = `${n} image${n !== 1 ? 's' : ''}`;
  downloadPdfBtn.disabled = n === 0;
}

/* ═══════════════════════════════════════════════════
   LEFT PANEL — COPY
═══════════════════════════════════════════════════ */
copyButton.addEventListener('click', async () => {
  const plain = buildNotePlain();
  const html  = buildNoteHTML();
  let copiedRich = false;

  if (window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html':  new Blob([html],  { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        })
      ]);
      copiedRich = true;
    } catch (e) { /* fall through */ }
  }

  if (!copiedRich) {
    try { await navigator.clipboard.writeText(plain); }
    catch (e) { showToast('Could not access clipboard', 'error'); return; }
  }

  copyButton.innerHTML = '<span class="btn-icon">\u2705</span><span class="btn-label">Copied!</span>';
  copyButton.classList.add('copied');
  statusBadge.textContent = 'Copied!';
  statusBadge.classList.add('copying');
  showToast(copiedRich ? 'Copied with bold labels \u2713' : 'Copied (plain text) \u2713', 'success');

  setTimeout(() => {
    copyButton.innerHTML = '<span class="btn-icon btn-copy-icon">\uD83D\uDCCB</span><span class="btn-label">Copy</span>';
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
  canvasDropzone.style.display     = 'none';
  canvasScroll.style.display       = 'flex';
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
  images.push({ id, dataUrl, name, timestamp: ts, caption: '' });
  const idx = images.length - 1;

  const card      = document.createElement('div');
  card.className  = 'image-card';
  card.dataset.id = id;

  const caption           = document.createElement('div');
  caption.className       = 'image-caption';
  caption.contentEditable = 'true';
  caption.dataset.placeholder = 'Add a description\u2026';
  caption.title           = 'Click to add a description';
  caption.addEventListener('input', () => { images[idx].caption = caption.innerText.trim(); });
  caption.addEventListener('paste', e => e.stopPropagation());

  const img   = document.createElement('img');
  img.src     = dataUrl;
  img.alt     = name || `Screenshot ${id}`;
  img.loading = 'lazy';
  img.title   = 'Double-click to zoom';
  img.addEventListener('dblclick', () => openLightbox(idx));

  const actions     = document.createElement('div');
  actions.className = 'image-card-actions';
  const deleteBtn       = document.createElement('button');
  deleteBtn.className   = 'img-action-btn';
  deleteBtn.title       = 'Remove image';
  deleteBtn.textContent = '\u2715';
  deleteBtn.addEventListener('click', () => removeImage(id, card));
  actions.appendChild(deleteBtn);

  const label     = document.createElement('div');
  label.className = 'image-label';
  label.innerHTML = `<span class="image-number">#${images.length}</span><span>${name || 'Screenshot'} \u00b7 ${ts}</span>`;

  card.appendChild(caption);
  card.appendChild(img);
  card.appendChild(actions);
  card.appendChild(label);
  canvasImages.appendChild(card);

  showCanvas();
  updateCanvasCount();
  setTimeout(() => caption.focus(), 80);
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

function removeImage(id, cardEl) {
  images = images.filter(img => img.id !== id);
  cardEl.style.animation = 'cardSlideIn 0.2s ease reverse';
  setTimeout(() => {
    cardEl.remove();
    canvasImages.querySelectorAll('.image-number').forEach((el, i) => { el.textContent = `#${i + 1}`; });
    updateCanvasCount();
    maybeShowDropzone();
  }, 180);
}

function processFiles(files) {
  if (!files || files.length === 0) return;
  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (imageFiles.length === 0) { showToast('No image files found', 'error'); return; }
  imageFiles.forEach(file => {
    const reader  = new FileReader();
    reader.onload = e => addImage(e.target.result, file.name);
    reader.readAsDataURL(file);
  });
  showToast(`Adding ${imageFiles.length} image${imageFiles.length !== 1 ? 's' : ''}\u2026`, 'info', 1500);
}

selectFileBtn.addEventListener('click', () => fileInput.click());
addMoreBtn.addEventListener('click',    () => fileInputExtra.click());
fileInput.addEventListener('change',      e => { processFiles(e.target.files); e.target.value = ''; });
fileInputExtra.addEventListener('change', e => { processFiles(e.target.files); e.target.value = ''; });

[canvasDropzone, panelRight].forEach(el => {
  el.addEventListener('dragover',  e => { e.preventDefault(); canvasDropzone.classList.add('drag-over'); });
  el.addEventListener('dragleave', e => { if (!panelRight.contains(e.relatedTarget)) canvasDropzone.classList.remove('drag-over'); });
  el.addEventListener('drop', e => {
    e.preventDefault(); canvasDropzone.classList.remove('drag-over');
    processFiles(e.dataTransfer.files);
  });
});

document.addEventListener('paste', e => {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  let found = false;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      found = true;
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = ev => addImage(ev.target.result, 'Pasted screenshot');
      reader.readAsDataURL(file);
    }
  }
  if (found) showToast('Screenshot added to canvas \uD83D\uDDBC\uFE0F', 'success');
});

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
   HELPERS
═══════════════════════════════════════════════════ */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s  = document.createElement('script');
    s.src    = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function getImageDimensions(dataUrl) {
  return new Promise(resolve => {
    const img  = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.src    = dataUrl;
  });
}

/**
 * Compresses a screenshot dataUrl:
 *  - Resizes so the longest side is at most MAX_PX pixels
 *  - Re-encodes as JPEG at QUALITY (0-1)
 * Returns { dataUrl, width, height } of the compressed result.
 */
function compressImage(dataUrl, maxPx = 1000, quality = 0.75) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      // Calculate scaled dimensions
      const scale = Math.min(1, maxPx / Math.max(w, h));
      const sw = Math.round(w * scale);
      const sh = Math.round(h * scale);

      const cv = document.createElement('canvas');
      cv.width = sw; cv.height = sh;
      const ctx = cv.getContext('2d');
      // White background (avoids black fill when PNG alpha → JPEG)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sw, sh);
      ctx.drawImage(img, 0, 0, sw, sh);

      const compressed = cv.toDataURL('image/jpeg', quality);
      resolve({ dataUrl: compressed, width: sw, height: sh });
    };
    img.onerror = () => resolve({ dataUrl, width: 0, height: 0 }); // fallback unchanged
    img.src = dataUrl;
  });
}

/**
 * Loads an image, auto-crops whitespace margins via canvas,
 * and returns { dataUrl, width, height } of the cropped result.
 * Returns null if the image fails to load.
 */
function loadLogoCropped(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const fw = img.naturalWidth, fh = img.naturalHeight;

        // Scan at 1/4 scale for speed (avoid scanning 8M pixels)
        const scale = 0.25;
        const sw = Math.floor(fw * scale);
        const sh = Math.floor(fh * scale);

        const cv  = document.createElement('canvas');
        cv.width  = sw; cv.height = sh;
        const ctx = cv.getContext('2d');
        ctx.drawImage(img, 0, 0, sw, sh);
        const data = ctx.getImageData(0, 0, sw, sh).data;

        const isLight = (x, y) => {
          const i = (y * sw + x) * 4;
          return data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230;
        };

        let top = 0, bot = sh - 1, left = 0, right = sw - 1;

        topScan: for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) { if (!isLight(x, y)) { top = y; break topScan; } }
        }
        botScan: for (let y = sh - 1; y >= 0; y--) {
          for (let x = 0; x < sw; x++) { if (!isLight(x, y)) { bot = y; break botScan; } }
        }
        leftScan: for (let x = 0; x < sw; x++) {
          for (let y = 0; y < sh; y++) { if (!isLight(x, y)) { left = x; break leftScan; } }
        }
        rightScan: for (let x = sw - 1; x >= 0; x--) {
          for (let y = 0; y < sh; y++) { if (!isLight(x, y)) { right = x; break rightScan; } }
        }

        // Map back to full-res coords with small padding
        const pad = 30;
        const sx = Math.max(0, Math.floor(left  / scale) - pad);
        const sy = Math.max(0, Math.floor(top   / scale) - pad);
        const ex = Math.min(fw, Math.floor(right / scale) + pad);
        const ey = Math.min(fh, Math.floor(bot  / scale) + pad);

        const cw = ex - sx, ch = ey - sy;
        const cv2 = document.createElement('canvas');
        cv2.width = cw; cv2.height = ch;
        cv2.getContext('2d').drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);

        resolve({ dataUrl: cv2.toDataURL('image/png'), width: cw, height: ch });
      } catch (e) {
        // Fallback: return full image uncropped
        const cv = document.createElement('canvas');
        cv.width = img.naturalWidth; cv.height = img.naturalHeight;
        cv.getContext('2d').drawImage(img, 0, 0);
        resolve({ dataUrl: cv.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* ═══════════════════════════════════════════════════
   PDF GENERATION
═══════════════════════════════════════════════════ */
downloadPdfBtn.addEventListener('click', async () => {
  if (images.length === 0) return;

  const overlay = document.createElement('div');
  overlay.className = 'pdf-overlay';
  overlay.innerHTML = `<div class="pdf-spinner"><div class="spinner-ring"></div><p>Generating PDF\u2026</p></div>`;
  document.body.appendChild(overlay);

  try {
    if (!window.jspdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }

    const { jsPDF } = window.jspdf;
    const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const pageW = pdf.internal.pageSize.getWidth();   // 210mm
    const pageH = pdf.internal.pageSize.getHeight();  // 297mm
    const mg    = 20;
    const now   = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const customer   = nameText.value.trim();
    const issue      = issueText.value.trim();
    const action     = actionText.value.trim();
    const resolution = resolutionText.value.trim();

    // Load + auto-crop Trimble logo (non-blocking — PDF works without it)
    const logo = await loadLogoCropped('trimble-logo.png');

    /* ── COVER PAGE ─────────────────────────────────── */

    // Dark navy header band (50mm)
    pdf.setFillColor(15, 25, 50);
    pdf.rect(0, 0, pageW, 50, 'F');

    // Blue accent stripe below header
    pdf.setFillColor(31, 111, 235);
    pdf.rect(0, 50, pageW, 3, 'F');

    // Trimble logo — top-right, vertically centered in header
    if (logo) {
      const logoH = 22; // desired height in mm
      const logoW = logoH * (logo.width / logo.height); // correct aspect ratio
      const logoX = pageW - mg - logoW;
      const logoY = (50 - logoH) / 2; // center in the 50mm header
      pdf.addImage(logo.dataUrl, 'PNG', logoX, logoY, logoW, logoH);
    } else {
      // Fallback text
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(88, 166, 255);
      pdf.text('TRIMBLE', pageW - mg, 12, { align: 'right' });
    }

    // Left accent bar
    pdf.setFillColor(31, 111, 235);
    pdf.rect(mg, 18, 1.2, 22, 'F');

    // Title "CASE REPORT"
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(230, 237, 243);
    pdf.text('CASE REPORT', mg + 5, 30);

    // Subtitle
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(139, 148, 158);
    pdf.text('Technical Support Documentation  \u00b7  Trimble Inc.', mg + 5, 40);

    // Date/time (below stripe)
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 110, 130);
    pdf.text(`${dateStr}  \u00b7  ${timeStr}`, mg, 62);

    // Separator line
    pdf.setDrawColor(220, 228, 240);
    pdf.setLineWidth(0.3);
    pdf.line(mg, 67, pageW - mg, 67);

    /* ── Bitacora — multi-page if needed, fixed font ── */
    const BODY_FS   = 10.5;
    const LINE_H    = BODY_FS * 0.56;   // ~5.9mm per line
    const textWidth = pageW - mg * 2 - 6;

    // Footer boundaries per page type
    const COVER_FOOTER = pageH - 30;  // cover page: taller footer (name/email)
    const CONT_FOOTER  = pageH - 16;  // continuation pages: slim footer
    const CONT_TOP     = 20;          // y where content starts on continuation pages

    let y          = 77;              // start of content on cover page
    let bitPage    = 1;              // current bitácora page index

    // Helper: current safe bottom limit
    function safeBottom() { return bitPage === 1 ? COVER_FOOTER : CONT_FOOTER; }

    // Draw the slim footer on a continuation bitácora page, then add a new PDF page
    function pageBreak() {
      // Slim footer on current page
      pdf.setFillColor(240, 244, 252);
      pdf.rect(0, pageH - 13, pageW, 13, 'F');
      pdf.setDrawColor(210, 220, 240);
      pdf.setLineWidth(0.25);
      pdf.line(0, pageH - 13, pageW, pageH - 13);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 115, 145);
      pdf.text('Wagner A. Barrera  \u00b7  Trimble Inc.', mg, pageH - 4);
      // Page number filled in after we know total — leave placeholder
      bitPage++;
      pdf.addPage();
      // Continuation page header
      pdf.setFillColor(248, 250, 255);
      pdf.rect(0, 0, pageW, 13, 'F');
      pdf.setDrawColor(215, 225, 242);
      pdf.setLineWidth(0.25);
      pdf.line(0, 13, pageW, 13);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 115, 145);
      pdf.text('CASE REPORT  \u00b7  Trimble Inc.', mg, 9);
      pdf.text('Continued', pageW - mg, 9, { align: 'right' });
      y = CONT_TOP;
    }

    // Ensure there is at least `needed` mm of vertical space, breaking page if not
    function ensureSpace(needed) {
      if (y + needed > safeBottom()) pageBreak();
    }

    // Customer name block
    if (customer) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(20, 30, 55);
      const cLines = pdf.splitTextToSize(customer, pageW - mg * 2);
      ensureSpace(cLines.length * 6.5 + 14);
      pdf.text(cLines, mg, y);
      y += cLines.length * 6.5 + 4;
      pdf.setDrawColor(200, 215, 235);
      pdf.line(mg, y, pageW - mg, y);
      y += 10;
    }

    // Draw one section; text flows line-by-line with page breaks as needed
    function drawSection(label, r, g, b, bodyText) {
      // Label bar — keep together with at least one line of body
      ensureSpace(22);
      pdf.setFillColor(r, g, b);
      pdf.rect(mg, y, 2.5, 11, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(r, g, b);
      pdf.text(label, mg + 6, y + 7.5);
      y += 14;

      if (!bodyText.trim()) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(BODY_FS);
        pdf.setTextColor(160, 170, 185);
        pdf.text('\u2014', mg + 6, y);
        y += 8;
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(BODY_FS);
        pdf.setTextColor(45, 55, 75);
        const lines = pdf.splitTextToSize(bodyText, textWidth);
        for (const line of lines) {
          ensureSpace(LINE_H);
          pdf.text(line, mg + 6, y);
          y += LINE_H;
        }
        y += 7; // section bottom padding
      }
    }

    drawSection('ISSUE',      210, 60,  60,  issue);
    drawSection('ACTION',     200, 140, 30,  action);
    drawSection('RESOLUTION', 35,  155, 75,  resolution);

    const totalPages = bitPage + images.length;

    /* ── Cover footer ─────────────────────────────── */
    pdf.setFillColor(240, 244, 252);
    pdf.rect(0, pageH - 26, pageW, 26, 'F');
    pdf.setDrawColor(210, 220, 240);
    pdf.setLineWidth(0.3);
    pdf.line(0, pageH - 26, pageW, pageH - 26);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(25, 55, 120);
    pdf.text('Wagner A. Barrera', mg, pageH - 15);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(90, 105, 130);
    pdf.text('Support Specialist  \u00b7  Trimble Inc.', mg, pageH - 9);

    pdf.setTextColor(31, 111, 235);
    pdf.textWithLink('wagner_barrera@trimble.com', mg, pageH - 4, { url: 'mailto:wagner_barrera@trimble.com' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(150, 160, 180);
    pdf.text(`Page 1 of ${totalPages}`, pageW - mg, pageH - 4, { align: 'right' });

    /* ── IMAGE PAGES ─────────────────────────────── */
    for (let i = 0; i < images.length; i++) {
      pdf.addPage();

      const { dataUrl, caption } = images[i];
      const dims  = await getImageDimensions(dataUrl);
      const ratio = dims.width / dims.height;

      const headerH  = 13;
      const footerH  = 13;
      const captionH = caption ? 12 : 0;
      const availW   = pageW - mg * 2;
      const availH   = pageH - headerH - footerH - captionH - mg * 2;

      let imgW = availW;
      let imgH = imgW / ratio;
      if (imgH > availH) { imgH = availH; imgW = imgH * ratio; }

      const x  = mg + (availW - imgW) / 2;
      const y0 = headerH + mg + (availH - imgH) / 2;

      // Header
      pdf.setFillColor(248, 250, 255);
      pdf.rect(0, 0, pageW, headerH, 'F');
      pdf.setDrawColor(215, 225, 242);
      pdf.setLineWidth(0.25);
      pdf.line(0, headerH, pageW, headerH);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 115, 145);
      pdf.text('CASE REPORT  \u00b7  Trimble Inc.', mg, 9);
      pdf.text(`Screenshot ${i + 1} of ${images.length}`, pageW - mg, 9, { align: 'right' });

      // Image — compress before embedding (resize + JPEG 82%)
      const compressed = await compressImage(dataUrl);
      pdf.addImage(compressed.dataUrl, 'JPEG', x, y0, imgW, imgH);
      pdf.setDrawColor(200, 210, 230);
      pdf.setLineWidth(0.25);
      pdf.rect(x, y0, imgW, imgH);

      // Caption
      if (caption) {
        const capY = y0 + imgH + 6;
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(80, 95, 120);
        const capLines = pdf.splitTextToSize(caption, availW);
        pdf.text(capLines, pageW / 2, capY, { align: 'center' });
      }

      // Footer
      pdf.setFillColor(248, 250, 255);
      pdf.rect(0, pageH - footerH, pageW, footerH, 'F');
      pdf.setDrawColor(215, 225, 242);
      pdf.setLineWidth(0.25);
      pdf.line(0, pageH - footerH, pageW, pageH - footerH);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 115, 145);
      pdf.text('Wagner A. Barrera  \u00b7  Trimble Inc.', mg, pageH - 4);
      pdf.text(`Page ${i + 2} of ${images.length + 1}`, pageW - mg, pageH - 4, { align: 'right' });
    }

    /* ── PDF filename: first line of customer + date + time ── */
    const firstLine = customer ? customer.split('\n')[0].trim() : 'Case_Report';
    const safeName  = firstLine.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').substring(0, 40);
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const filename = `${safeName}_${yyyy}-${mm}-${dd}_${hh}${min}.pdf`;

    pdf.save(filename);
    showToast(`PDF saved: ${filename} \u2713`, 'success', 3500);

  } catch (err) {
    console.error('PDF generation error:', err);
    showToast('Error generating PDF \u2014 check console', 'error');
  } finally {
    overlay.remove();
  }
});

/* ═══════════════════════════════════════════════════
   LIGHTBOX — double-click to zoom
═══════════════════════════════════════════════════ */
let lightboxEl   = null;
let currentLbIdx = -1;

function openLightbox(idx) { currentLbIdx = idx; renderLightbox(); }

function renderLightbox() {
  closeLightbox(false);
  const { dataUrl, caption, name } = images[currentLbIdx];

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  const closeBtn     = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.innerHTML = '\u2715';
  closeBtn.title     = 'Close (Esc)';
  closeBtn.addEventListener('click', closeLightbox);

  const counter       = document.createElement('div');
  counter.className   = 'lightbox-counter';
  counter.textContent = `${currentLbIdx + 1} / ${images.length}`;

  const wrap     = document.createElement('div');
  wrap.className = 'lightbox-img-wrap';

  const img  = document.createElement('img');
  img.src    = dataUrl;
  img.alt    = name || 'Screenshot';
  wrap.appendChild(img);

  const capText = caption || name || '';
  if (capText) {
    const cap       = document.createElement('div');
    cap.className   = 'lightbox-caption';
    cap.textContent = capText;
    wrap.appendChild(cap);
  }

  lb.appendChild(counter);
  lb.appendChild(closeBtn);
  lb.appendChild(wrap);
  document.body.appendChild(lb);
  lightboxEl = lb;
}

function closeLightbox(animate = true) {
  if (!lightboxEl) return;
  if (animate) {
    lightboxEl.style.animation = 'lbFadeIn 0.15s ease reverse';
    setTimeout(() => { lightboxEl?.remove(); lightboxEl = null; }, 140);
  } else {
    lightboxEl.remove(); lightboxEl = null;
  }
}

document.addEventListener('keydown', e => {
  if (!lightboxEl) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowRight' && currentLbIdx < images.length - 1) { currentLbIdx++; renderLightbox(); }
  if (e.key === 'ArrowLeft'  && currentLbIdx > 0)                  { currentLbIdx--; renderLightbox(); }
});

/* ═══════════════════════════════════════════════════
   PANEL DIVIDER — drag to resize
═══════════════════════════════════════════════════ */
let isResizing = false, startX = 0, startWidth = 0;

panelDivider.addEventListener('mousedown', e => {
  isResizing = true; startX = e.clientX; startWidth = panelLeft.offsetWidth;
  panelDivider.classList.add('dragging');
  document.body.style.cursor     = 'col-resize';
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
  document.body.style.cursor     = '';
  document.body.style.userSelect = '';
});

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
updateCanvasCount();
