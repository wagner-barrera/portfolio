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
  previewText.textContent = buildNotePlain();
}

function updateCanvasCount() {
  const n = images.length;
  canvasCount.textContent = `${n} image${n !== 1 ? 's' : ''}`;
  downloadPdfBtn.disabled = n === 0;
}

/* ═══════════════════════════════════════════════════
   LEFT PANEL — COPY (HTML clipboard for bold labels)
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
    } catch (e) {
      // ClipboardItem blocked — fall through to plain text
    }
  }

  if (!copiedRich) {
    try {
      await navigator.clipboard.writeText(plain);
    } catch (e) {
      showToast('Could not access clipboard', 'error');
      return;
    }
  }

  copyButton.innerHTML = '<span class="btn-icon">✅</span><span class="btn-label">Copied!</span>';
  copyButton.classList.add('copied');
  statusBadge.textContent = 'Copied!';
  statusBadge.classList.add('copying');
  showToast(copiedRich ? 'Copied with bold labels ✓' : 'Copied (plain text) ✓', 'success');

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

  // Editable caption (above the image)
  const caption           = document.createElement('div');
  caption.className       = 'image-caption';
  caption.contentEditable = 'true';
  caption.dataset.placeholder = 'Add a description\u2026';
  caption.title           = 'Click to add a description';
  caption.addEventListener('input', () => {
    images[idx].caption = caption.innerText.trim();
  });
  caption.addEventListener('paste', e => e.stopPropagation());

  // Image
  const img   = document.createElement('img');
  img.src     = dataUrl;
  img.alt     = name || `Screenshot ${id}`;
  img.loading = 'lazy';
  img.title   = 'Double-click to zoom';
  img.addEventListener('dblclick', () => openLightbox(idx));

  // Actions (delete button)
  const actions     = document.createElement('div');
  actions.className = 'image-card-actions';

  const deleteBtn       = document.createElement('button');
  deleteBtn.className   = 'img-action-btn';
  deleteBtn.title       = 'Remove image';
  deleteBtn.textContent = '\u2715';
  deleteBtn.addEventListener('click', () => removeImage(id, card));
  actions.appendChild(deleteBtn);

  // Footer label
  const label       = document.createElement('div');
  label.className   = 'image-label';
  label.innerHTML   = `<span class="image-number">#${images.length}</span><span>${name || 'Screenshot'} \u00b7 ${ts}</span>`;

  card.appendChild(caption);
  card.appendChild(img);
  card.appendChild(actions);
  card.appendChild(label);
  canvasImages.appendChild(card);

  showCanvas();
  updateCanvasCount();
  // Auto-focus the caption field so user can type right away
  setTimeout(() => caption.focus(), 80);
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

/* Drag & Drop */
[canvasDropzone, panelRight].forEach(el => {
  el.addEventListener('dragover',  e => { e.preventDefault(); canvasDropzone.classList.add('drag-over'); });
  el.addEventListener('dragleave', e => {
    if (!panelRight.contains(e.relatedTarget)) canvasDropzone.classList.remove('drag-over');
  });
  el.addEventListener('drop', e => {
    e.preventDefault(); canvasDropzone.classList.remove('drag-over');
    processFiles(e.dataTransfer.files);
  });
});

/* Paste (Ctrl+V) */
document.addEventListener('paste', e => {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  let found   = false;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      found = true;
      const file   = item.getAsFile();
      const reader = new FileReader();
      reader.onload = ev => addImage(ev.target.result, 'Pasted screenshot');
      reader.readAsDataURL(file);
    }
  }
  if (found) showToast('Screenshot added to canvas \uD83D\uDDBC\uFE0F', 'success');
});

/* Clear canvas */
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
    const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const mg    = 20;
    const now   = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const customer   = nameText.value.trim();
    const issue      = issueText.value.trim();
    const action     = actionText.value.trim();
    const resolution = resolutionText.value.trim();

    /* COVER PAGE */

    // Dark navy header band
    pdf.setFillColor(15, 25, 50);
    pdf.rect(0, 0, pageW, 50, 'F');

    // Blue accent stripe
    pdf.setFillColor(31, 111, 235);
    pdf.rect(0, 50, pageW, 3, 'F');

    // Trimble logo - top right of header
    pdf.addImage('data:image/png;base64,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AAAAAAAAAAAAAACAv9mDAwEAAAAAIP/XRlBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVaQ8OBAAAAAAE+VtPsEEFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJ1+yGG8QMTfHAAAAAElFTkSuQmCC', 'PNG', pageW - mg - 24, 5, 24, 5.7);

    // Left accent bar
    pdf.setFillColor(31, 111, 235);
    pdf.rect(mg, 18, 1.2, 22, 'F');

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(230, 237, 243);
    pdf.text('CASE REPORT', mg + 5, 30);

    // Subtitle
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(139, 148, 158);
    pdf.text('Technical Support Documentation  \u00b7  Trimble Inc.', mg + 5, 40);

    // Date/time
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 110, 130);
    pdf.text(`${dateStr}  \u00b7  ${timeStr}`, mg, 62);

    // Separator line
    pdf.setDrawColor(220, 228, 240);
    pdf.setLineWidth(0.3);
    pdf.line(mg, 67, pageW - mg, 67);

    /* Bitacora content — auto-fit font to cover page */
    let y = 77;
    const footerTop = pageH - 30; // don't go below this

    // Measure total height at a given body font size
    function measureContent(bodyFs) {
      let h = 0;
      if (customer) {
        const tmpLines = pdf.setFont('helvetica','bold').setFontSize(13)
          && pdf.splitTextToSize(customer, pageW - mg * 2);
        h += tmpLines.length * 6.5 + 14;
      }
      const measureSec = (txt) => {
        h += 14; // label row
        if (!txt.trim()) { h += 8; }
        else {
          const ls = pdf.setFont('helvetica','normal').setFontSize(bodyFs)
            && pdf.splitTextToSize(txt, pageW - mg * 2 - 6);
          h += ls.length * (bodyFs * 0.56) + 7;
        }
      };
      measureSec(issue); measureSec(action); measureSec(resolution);
      return h;
    }

    let bodyFontSize = 10.5;
    while (bodyFontSize >= 6 && (77 + measureContent(bodyFontSize)) > footerTop) {
      bodyFontSize = Math.round((bodyFontSize - 0.5) * 10) / 10;
    }

    if (customer) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(20, 30, 55);
      const cLines = pdf.splitTextToSize(customer, pageW - mg * 2);
      pdf.text(cLines, mg, y);
      y += cLines.length * 6.5 + 4;

      pdf.setDrawColor(200, 215, 235);
      pdf.line(mg, y, pageW - mg, y);
      y += 10;
    }

    function drawSection(label, r, g, b, bodyText) {
      if (y > footerTop) return;

      pdf.setFillColor(r, g, b);
      pdf.rect(mg, y, 2.5, 11, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(r, g, b);
      pdf.text(label, mg + 6, y + 7.5);

      y += 14;

      if (!bodyText.trim()) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(bodyFontSize);
        pdf.setTextColor(160, 170, 185);
        pdf.text('\u2014', mg + 6, y);
        y += 8;
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(bodyFontSize);
        pdf.setTextColor(45, 55, 75);
        const lines = pdf.splitTextToSize(bodyText, pageW - mg * 2 - 6);
        pdf.text(lines, mg + 6, y);
        y += lines.length * (bodyFontSize * 0.56) + 7;
      }
    }

    drawSection('ISSUE',      210, 60,  60,  issue);
    drawSection('ACTION',     200, 140, 30,  action);
    drawSection('RESOLUTION', 35,  155, 75,  resolution);

    /* Cover footer */
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
    pdf.text(`Page 1 of ${images.length + 1}`, pageW - mg, pageH - 4, { align: 'right' });

    /* IMAGE PAGES */
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

      /* Page header */
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

      /* Image */
      const fmt = dataUrl.startsWith('data:image/png') ? 'PNG' :
                  dataUrl.startsWith('data:image/gif') ? 'GIF' : 'JPEG';
      pdf.addImage(dataUrl, fmt, x, y0, imgW, imgH);

      pdf.setDrawColor(200, 210, 230);
      pdf.setLineWidth(0.25);
      pdf.rect(x, y0, imgW, imgH);

      /* Caption below image */
      if (caption) {
        const capY = y0 + imgH + 6;
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(80, 95, 120);
        const capLines = pdf.splitTextToSize(caption, availW);
        pdf.text(capLines, pageW / 2, capY, { align: 'center' });
      }

      /* Page footer */
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

    const safeName = customer ? customer.split('\n')[0].trim().replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_').substring(0, 40) + '_' : 'Case_Report_';
    const safeDate = now.toLocaleDateString('en-CA');
    const safeTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }).replace(':', '');
    const filename = `\\_\.pdf`;
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
   HELPERS
═══════════════════════════════════════════════════ */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s    = document.createElement('script');
    s.src      = src;
    s.onload   = resolve;
    s.onerror  = reject;
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

/* ═══════════════════════════════════════════════════
   LIGHTBOX — double-click image to zoom
═══════════════════════════════════════════════════ */
let lightboxEl   = null;
let currentLbIdx = -1;

function openLightbox(idx) {
  currentLbIdx = idx;
  renderLightbox();
}

function renderLightbox() {
  closeLightbox(false);
  const { dataUrl, caption, name } = images[currentLbIdx];

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  const closeBtn       = document.createElement('button');
  closeBtn.className   = 'lightbox-close';
  closeBtn.innerHTML   = '\u2715';
  closeBtn.title       = 'Close (Esc)';
  closeBtn.addEventListener('click', closeLightbox);

  const counter       = document.createElement('div');
  counter.className   = 'lightbox-counter';
  counter.textContent = `${currentLbIdx + 1} / ${images.length}`;

  const wrap    = document.createElement('div');
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
    lightboxEl.remove();
    lightboxEl = null;
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
  isResizing  = true;
  startX      = e.clientX;
  startWidth  = panelLeft.offsetWidth;
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
