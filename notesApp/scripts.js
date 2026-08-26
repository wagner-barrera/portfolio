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

/* ── PDF Quality picker ── */
const QUALITY_PRESETS = {
  min: { maxPx: 1000, quality: 0.65 },
  mod: { maxPx: 1400, quality: 0.78 },
  max: { bypass: true },  // no resize, no recompression — original image
};
let currentQuality = localStorage.getItem('pdfQuality') || 'mod';

document.querySelectorAll('.quality-btn').forEach(btn => {
  if (btn.dataset.quality === currentQuality) btn.classList.add('active');
  else btn.classList.remove('active');

  btn.addEventListener('click', () => {
    document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentQuality = btn.dataset.quality;
    localStorage.setItem('pdfQuality', currentQuality);
  });
});

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
 */
function compressImage(dataUrl, maxPx = 1000, quality = 0.75) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxPx / Math.max(w, h));
      const sw = Math.round(w * scale);
      const sh = Math.round(h * scale);
      const cv = document.createElement('canvas');
      cv.width = sw; cv.height = sh;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sw, sh);
      ctx.drawImage(img, 0, 0, sw, sh);
      resolve({ dataUrl: cv.toDataURL('image/jpeg', quality), width: sw, height: sh });
    };
    img.onerror = () => resolve({ dataUrl, width: 0, height: 0 });
    img.src = dataUrl;
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
    const pageW = pdf.internal.pageSize.getWidth();   // 210
    const pageH = pdf.internal.pageSize.getHeight();  // 297
    const mg    = 15;
    const availW = pageW - mg * 2;
    const now   = new Date();
    const customer = nameText.value.trim();

    /* ── One clean page per screenshot ── */
    for (let i = 0; i < images.length; i++) {
      if (i > 0) pdf.addPage();

      const { dataUrl, caption } = images[i];

      // Caption block — rendered ABOVE the image in large bold text
      const CAP_FS     = 16;
      const CAP_LINE_H = CAP_FS * 0.45; // ~7.2 mm per line
      let capLines  = [];
      let capBlockH = 0;

      if (caption && caption.trim()) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(CAP_FS);
        capLines  = pdf.splitTextToSize(caption.trim(), availW);
        capBlockH = capLines.length * CAP_LINE_H + 8; // +8 mm gap below text
      }

      // Image — full resolution, original format, no compression
      const dims  = await getImageDimensions(dataUrl);
      const ratio = dims.width / dims.height;

      const imgAreaH = pageH - mg - capBlockH - mg;
      let imgW = availW;
      let imgH = imgW / ratio;
      if (imgH > imgAreaH) { imgH = imgAreaH; imgW = imgH * ratio; }

      const imgX = mg + (availW - imgW) / 2;
      const imgY = mg + capBlockH;

      // Draw caption
      if (capLines.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(CAP_FS);
        pdf.setTextColor(15, 23, 42);
        pdf.text(capLines, mg, mg + CAP_LINE_H);
      }

      // Draw image — original format, no compression
      const imgFmt = dataUrl.startsWith('data:image/png') ? 'PNG'
                   : dataUrl.startsWith('data:image/gif') ? 'GIF' : 'JPEG';
      pdf.addImage(dataUrl, imgFmt, imgX, imgY, imgW, imgH);

      // Subtle page counter — bottom-right only
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(180, 185, 195);
      pdf.text(`${i + 1} / ${images.length}`, pageW - mg, pageH - 5, { align: 'right' });
    }

    /* ── Filename: first line of Customer field + date + time ── */
    const firstLine = customer ? customer.split('\n')[0].trim() : 'Screenshots';
    const safeName  = firstLine.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').substring(0, 40) || 'Screenshots';
    const dd   = String(now.getDate()).padStart(2, '0');
    const mm   = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh   = String(now.getHours()).padStart(2, '0');
    const mn   = String(now.getMinutes()).padStart(2, '0');
    const filename = `${safeName}_${yyyy}-${mm}-${dd}_${hh}${mn}.pdf`;

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
