'use strict';

/* ═══════════════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════════════ */
const copyButton     = document.getElementById('copyButton');
const clearButton    = document.getElementById('clearButton');
const saveCaseBtn    = document.getElementById('saveCaseBtn');
const statusBadge    = document.getElementById('statusBadge');
const previewText    = document.getElementById('previewText');
const toast          = document.getElementById('toast');

const nameText       = document.getElementById('nameText');
const issueText      = document.getElementById('issueText');
const actionText     = document.getElementById('actionText');
const resolutionText = document.getElementById('resolutionText');
const allTextareas   = [nameText, issueText, actionText, resolutionText];

const canvasDropzone = document.getElementById('canvasDropzone');
const canvasScroll   = document.getElementById('canvasScroll');
const canvasImages   = document.getElementById('canvasImages');
const canvasCount    = document.getElementById('canvasCount');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const fileInput      = document.getElementById('fileInput');
const fileInputExtra = document.getElementById('fileInputExtra');
const selectFileBtn  = document.getElementById('selectFileBtn');
const addMoreBtn     = document.getElementById('addMoreBtn');
const panelLeft      = document.getElementById('panelLeft');
const panelDivider   = document.getElementById('panelDivider');
const panelRight     = document.getElementById('panelRight');

/* ═══════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════ */
let images = [], imgIdCounter = 0;

/* ═══════════════════════════════════════════════════
   UNLOAD GUARD
═══════════════════════════════════════════════════ */
window.addEventListener('beforeunload', e => {
  const hasText = allTextareas.some(ta => ta.value.trim().length > 0);
  if (hasText || images.length > 0) {
    e.preventDefault();
    e.returnValue = 'You have unsaved work. Are you sure you want to leave?';
    return e.returnValue;
  }
});

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
  const [c,i,a,r] = allTextareas.map(t => t.value.trim());
  return `${c}\n\nIssue: \n${i}\n\nAction: \n${a}\n\nResolution: \n${r}`;
}

function buildNoteHTML() {
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  const [c,i,a,r] = allTextareas.map(t => esc(t.value.trim()));
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">` +
    `<p>${c}</p><p><strong>Issue:</strong><br>${i}</p>` +
    `<p><strong>Action:</strong><br>${a}</p><p><strong>Resolution:</strong><br>${r}</p></div>`;
}

function updatePreview() { if (previewText) previewText.textContent = buildNotePlain(); }

function updateCanvasCount() {
  const n = images.length;
  canvasCount.textContent = `${n} image${n !== 1 ? 's' : ''}`;
  downloadPdfBtn.disabled = n === 0;
}

/* ── Filename builder — first line of Customer Information ── */
function buildSaveFilename(ext) {
  const customer  = nameText.value.trim();
  const firstLine = customer ? customer.split('\n')[0].trim() : 'Case Report';
  const safe      = firstLine.replace(/[<>:"/\\|?*\n\r]/g,' ').trim().replace(/\s+/g,'_').substring(0, 60) || 'Case_Report';
  const now = new Date();
  const dd  = String(now.getDate()).padStart(2,'0');
  const mm  = String(now.getMonth()+1).padStart(2,'0');
  const yy  = now.getFullYear();
  const hh  = String(now.getHours()).padStart(2,'0');
  const mn  = String(now.getMinutes()).padStart(2,'0');
  return `${safe}_${yy}-${mm}-${dd}_${hh}${mn}.${ext}`;
}

function showOverlay(msg) {
  const el = document.createElement('div');
  el.className = 'pdf-overlay';
  el.innerHTML = `<div class="pdf-spinner"><div class="spinner-ring"></div><p>${msg}</p></div>`;
  document.body.appendChild(el);
  return el;
}

/* ═══════════════════════════════════════════════════
   LEFT PANEL — COPY / CLEAR
═══════════════════════════════════════════════════ */
copyButton.addEventListener('click', async () => {
  const plain = buildNotePlain(), html = buildNoteHTML();
  let copiedRich = false;
  if (window.ClipboardItem) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html':  new Blob([html],  { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      })]);
      copiedRich = true;
    } catch(e) {}
  }
  if (!copiedRich) {
    try { await navigator.clipboard.writeText(plain); }
    catch(e) { showToast('Could not access clipboard', 'error'); return; }
  }
  copyButton.innerHTML = '<span class="btn-icon">✅</span><span class="btn-label">Copied!</span>';
  copyButton.classList.add('copied');
  statusBadge.textContent = 'Copied!'; statusBadge.classList.add('copying');
  showToast(copiedRich ? 'Copied with bold labels ✓' : 'Copied (plain text) ✓', 'success');
  setTimeout(() => {
    copyButton.innerHTML = '<span class="btn-icon btn-copy-icon">📋</span><span class="btn-label">Copy</span>';
    copyButton.classList.remove('copied');
    statusBadge.textContent = 'Ready'; statusBadge.classList.remove('copying');
  }, 2500);
});

clearButton.addEventListener('click', () => {
  allTextareas.forEach(ta => (ta.value = ''));
  updatePreview(); showToast('Fields cleared', 'info'); nameText.focus();
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
  const id = ++imgIdCounter, ts = new Date().toLocaleTimeString();
  images.push({ id, dataUrl, name, timestamp: ts, caption: '' });
  const idx = images.length - 1;

  const card = document.createElement('div');
  card.className = 'image-card'; card.dataset.id = id;

  const caption = document.createElement('div');
  caption.className = 'image-caption'; caption.contentEditable = 'true';
  caption.dataset.placeholder = 'Add a description…';
  caption.addEventListener('input', () => { images[idx].caption = caption.innerText.trim(); });
  caption.addEventListener('paste', e => e.stopPropagation());

  const img = document.createElement('img');
  img.src = dataUrl; img.alt = name || `Screenshot ${id}`;
  img.loading = 'lazy'; img.title = 'Double-click to zoom';
  img.addEventListener('dblclick', () => openLightbox(idx));

  const actions = document.createElement('div'); actions.className = 'image-card-actions';
  const delBtn  = document.createElement('button');
  delBtn.className = 'img-action-btn'; delBtn.title = 'Remove'; delBtn.textContent = '✕';
  delBtn.addEventListener('click', () => removeImage(id, card));
  actions.appendChild(delBtn);

  const label = document.createElement('div'); label.className = 'image-label';
  label.innerHTML = `<span class="image-number">#${images.length}</span><span>${name || 'Screenshot'} · ${ts}</span>`;

  card.appendChild(caption); card.appendChild(img); card.appendChild(actions); card.appendChild(label);
  canvasImages.appendChild(card);
  showCanvas(); updateCanvasCount();
  setTimeout(() => caption.focus(), 80);
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

function removeImage(id, cardEl) {
  images = images.filter(img => img.id !== id);
  cardEl.style.animation = 'cardSlideIn 0.2s ease reverse';
  setTimeout(() => {
    cardEl.remove();
    canvasImages.querySelectorAll('.image-number').forEach((el, i) => { el.textContent = `#${i + 1}`; });
    updateCanvasCount(); maybeShowDropzone();
  }, 180);
}

function processFiles(files) {
  if (!files || files.length === 0) return;
  const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (imgs.length === 0) { showToast('No image files found', 'error'); return; }
  imgs.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => addImage(e.target.result, file.name);
    reader.readAsDataURL(file);
  });
  showToast(`Adding ${imgs.length} image${imgs.length !== 1 ? 's' : ''}…`, 'info', 1500);
}

selectFileBtn.addEventListener('click', () => fileInput.click());
addMoreBtn.addEventListener('click',    () => fileInputExtra.click());
fileInput.addEventListener('change',      e => { processFiles(e.target.files); e.target.value = ''; });
fileInputExtra.addEventListener('change', e => { processFiles(e.target.files); e.target.value = ''; });

[canvasDropzone, panelRight].forEach(el => {
  el.addEventListener('dragover',  e => { e.preventDefault(); canvasDropzone.classList.add('drag-over'); });
  el.addEventListener('dragleave', e => { if (!panelRight.contains(e.relatedTarget)) canvasDropzone.classList.remove('drag-over'); });
  el.addEventListener('drop', e => {
    e.preventDefault(); canvasDropzone.classList.remove('drag-over'); processFiles(e.dataTransfer.files);
  });
});

document.addEventListener('paste', e => {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  let found = false;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      found = true;
      const file = item.getAsFile(), reader = new FileReader();
      reader.onload = ev => addImage(ev.target.result, 'Pasted screenshot');
      reader.readAsDataURL(file);
    }
  }
  if (found) showToast('Screenshot added to canvas 🖼️', 'success');
});

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
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

function xmlEsc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ═══════════════════════════════════════════════════
   INDEXED DB — persist FileSystemDirectoryHandle
   so the user only picks a save folder once per machine
═══════════════════════════════════════════════════ */
const IDB_NAME  = 'case-tracker-db';
const IDB_STORE = 'handles';
const IDB_KEY   = 'save-directory';

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function saveDirHandle(handle) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror    = e => { db.close(); reject(e.target.error); };
  });
}

async function loadDirHandle() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror   = e => { db.close(); reject(e.target.error); };
  });
}

async function verifyDirPermission(handle) {
  const opts = { mode: 'readwrite' };
  if (await handle.queryPermission(opts) === 'granted') return true;
  if (await handle.requestPermission(opts) === 'granted') return true;
  return false;
}

/**
 * Returns a FileSystemDirectoryHandle for saving files.
 * - Loads persisted handle from IDB and verifies permission.
 * - If none or permission denied, shows the folder picker.
 * - forceNew = true always shows the picker (Shift+Save).
 */
async function getSaveDirectory(forceNew = false) {
  if (!window.showDirectoryPicker) return null; // API not available

  if (!forceNew) {
    try {
      const saved = await loadDirHandle();
      if (saved && await verifyDirPermission(saved)) {
        return { handle: saved, isNew: false };
      }
    } catch (e) { /* permission check failed — fall through to picker */ }
  }

  const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
  await saveDirHandle(handle);
  return { handle, isNew: true };
}

/* ═══════════════════════════════════════════════════
   PDF GENERATION — PAGELESS, MAX QUALITY
   Clean: caption (bold navy) → image → divider
   No counter labels, no accent underline.
═══════════════════════════════════════════════════ */
downloadPdfBtn.addEventListener('click', async () => {
  if (images.length === 0) return;
  const overlay = showOverlay('Generating PDF…');
  try {
    if (!window.jspdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    const { jsPDF } = window.jspdf;

    const PAGE_W    = 210;
    const MG        = 20;
    const AVAIL_W   = PAGE_W - MG * 2;
    const CAP_FS    = 15;
    const CAP_LH    = 7.5;
    const CAP_PAD   = 9;
    const MAX_IMG_H = 185;
    const IMG_BDR   = 0.25;
    const GAP_AFTER   = 22;
    const DIVIDER_GAP = 14;

    const tmpPdf = new jsPDF({ unit: 'mm', format: 'a4' });
    let totalH = MG;
    const items = [];

    for (let i = 0; i < images.length; i++) {
      const { dataUrl, caption } = images[i];
      const dims  = await getImageDimensions(dataUrl);
      const ratio = dims.width / dims.height;

      let capLines = [], capBlockH = 0;
      if (caption && caption.trim()) {
        tmpPdf.setFont('helvetica', 'bold');
        tmpPdf.setFontSize(CAP_FS);
        capLines  = tmpPdf.splitTextToSize(caption.trim(), AVAIL_W);
        capBlockH = capLines.length * CAP_LH + CAP_PAD;
      }

      let imgW = AVAIL_W, imgH = imgW / ratio;
      if (imgH > MAX_IMG_H) { imgH = MAX_IMG_H; imgW = imgH * ratio; }

      const isLast = i === images.length - 1;
      const afterH = isLast ? 0 : GAP_AFTER + 0.25 + DIVIDER_GAP;

      items.push({ dataUrl, capLines, capBlockH, imgW, imgH, isLast });
      totalH += capBlockH + imgH + afterH;
    }
    totalH += MG;

    const pdf = new jsPDF({ unit: 'mm', format: [PAGE_W, totalH], compress: true });
    let y = MG;

    for (let i = 0; i < items.length; i++) {
      const { dataUrl, capLines, capBlockH, imgW, imgH, isLast } = items[i];

      if (capLines.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(CAP_FS);
        pdf.setTextColor(55, 95, 170);
        pdf.text(capLines, MG, y + CAP_LH);
        y += capBlockH;
      }

      const imgX   = MG + (AVAIL_W - imgW) / 2;
      const imgFmt = dataUrl.startsWith('data:image/png') ? 'PNG'
                   : dataUrl.startsWith('data:image/gif') ? 'GIF' : 'JPEG';

      // Max quality — pass original dataUrl unmodified
      pdf.addImage(dataUrl, imgFmt, imgX, y, imgW, imgH);
      pdf.setDrawColor(200, 210, 228);
      pdf.setLineWidth(IMG_BDR);
      pdf.rect(imgX, y, imgW, imgH);
      y += imgH;

      if (!isLast) {
        y += GAP_AFTER + DIVIDER_GAP;
      }
    }

    pdf.save(buildSaveFilename('pdf'));
    showToast('PDF saved ✓', 'success', 3500);
  } catch (err) {
    console.error('PDF error:', err);
    showToast('Error generating PDF — check console', 'error');
  } finally {
    overlay.remove();
  }
});

/* ═══════════════════════════════════════════════════
   SAVE — DOCX with bitácora cover + screenshots
   Filename = first line of Customer Information
   Saves to remembered folder (File System Access API)
   Shift+Save to re-pick the folder
   Falls back to browser download if API unavailable
═══════════════════════════════════════════════════ */
saveCaseBtn.addEventListener('click', async (e) => {
  const hasText = allTextareas.some(ta => ta.value.trim().length > 0);
  if (!hasText && images.length === 0) {
    showToast('Add some content before saving', 'info');
    return;
  }

  const overlay    = showOverlay('Generating DOCX…');
  const forceNew   = e.shiftKey; // Shift+Save → pick a new folder

  try {
    /* ── Generate DOCX blob ── */
    if (!window.JSZip) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    }
    const zip = new JSZip();

    const PAGE_W_EMU = 7560000;
    const MARGIN_EMU = 914400;
    const MAX_W_EMU  = PAGE_W_EMU - 2 * MARGIN_EMU;
    const PX_TO_EMU  = 9525;

    const rels = [], mediaFiles = [];
    let bodyXml = '';

    /* Cover — bitácora table */
    const customer   = nameText.value.trim()       || '—';
    const issue      = issueText.value.trim()      || '—';
    const action     = actionText.value.trim()     || '—';
    const resolution = resolutionText.value.trim() || '—';
    const dateStr    = new Date().toLocaleDateString('en-US',
      { year: 'numeric', month: 'long', day: 'numeric' });

    bodyXml +=
      `<w:p><w:pPr><w:spacing w:before="0" w:after="280"/></w:pPr>` +
      `<w:r><w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/><w:color w:val="0D2461"/></w:rPr>` +
        `<w:t>Case Report</w:t></w:r>` +
      `<w:r><w:rPr><w:sz w:val="22"/><w:color w:val="6B7A99"/></w:rPr>` +
        `<w:t xml:space="preserve">   ·   ${xmlEsc(dateStr)}</w:t></w:r></w:p>`;

    const LABEL_W = 2268, VALUE_W = 7092;
    const borderXml =
      `<w:tblBorders>` +
      ['top','left','bottom','right','insideH','insideV'].map(s =>
        `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="C5D4EA"/>`
      ).join('') +
      `</w:tblBorders>`;

    const makeRow = (label, rawValue) => {
      const lines = String(rawValue).split('\n');
      const valueParas = lines.map(ln =>
        `<w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>` +
        `<w:r><w:rPr><w:sz w:val="20"/><w:color w:val="1E2E4A"/></w:rPr>` +
        `<w:t xml:space="preserve">${xmlEsc(ln || ' ')}</w:t></w:r></w:p>`
      ).join('');
      return `<w:tr>` +
        `<w:tc><w:tcPr><w:tcW w:w="${LABEL_W}" w:type="dxa"/>` +
        `<w:shd w:val="clear" w:color="auto" w:fill="EDF2FB"/></w:tcPr>` +
        `<w:p><w:pPr><w:spacing w:before="140" w:after="140"/></w:pPr>` +
        `<w:r><w:rPr><w:b/><w:sz w:val="20"/><w:color w:val="1A3875"/></w:rPr>` +
        `<w:t>${xmlEsc(label.toUpperCase())}</w:t></w:r></w:p></w:tc>` +
        `<w:tc><w:tcPr><w:tcW w:w="${VALUE_W}" w:type="dxa"/></w:tcPr>` +
        valueParas + `</w:tc></w:tr>`;
    };

    bodyXml +=
      `<w:tbl>` +
      `<w:tblPr><w:tblW w:w="${LABEL_W + VALUE_W}" w:type="dxa"/>${borderXml}</w:tblPr>` +
      `<w:tblGrid><w:gridCol w:w="${LABEL_W}"/><w:gridCol w:w="${VALUE_W}"/></w:tblGrid>` +
      makeRow('Customer',   customer) +
      makeRow('Issue',      issue) +
      makeRow('Action',     action) +
      makeRow('Resolution', resolution) +
      `</w:tbl>`;

    if (images.length > 0) {
      bodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
    }

    /* Screenshots */
    for (let i = 0; i < images.length; i++) {
      const { dataUrl, caption } = images[i];
      const dims  = await getImageDimensions(dataUrl);
      const rawW  = dims.width  * PX_TO_EMU;
      const rawH  = dims.height * PX_TO_EMU;
      const scale = rawW > MAX_W_EMU ? MAX_W_EMU / rawW : 1;
      const wEmu  = Math.round(rawW * scale);
      const hEmu  = Math.round(rawH * scale);
      const rId   = `rId${i + 1}`;
      const ext   = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
      const imgName = `image${i + 1}.${ext}`;

      mediaFiles.push({ name: imgName, data: dataUrl.split(',')[1] });
      rels.push({ rId, name: imgName });

      if (caption && caption.trim()) {
        bodyXml +=
          `<w:p><w:pPr><w:spacing w:after="140"/></w:pPr>` +
          `<w:r><w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/>` +
          `<w:color w:val="0D2461"/></w:rPr>` +
          `<w:t>${xmlEsc(caption.trim())}</w:t></w:r></w:p>`;
      }

      const spAfter = i < images.length - 1 ? '720' : '0';
      bodyXml +=
        `<w:p><w:pPr><w:spacing w:after="${spAfter}"/></w:pPr><w:r><w:drawing>` +
        `<wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">` +
        `<wp:extent cx="${wEmu}" cy="${hEmu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
        `<wp:docPr id="${i+1}" name="Img${i+1}"/>` +
        `<wp:cNvGraphicFramePr>` +
          `<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>` +
        `</wp:cNvGraphicFramePr>` +
        `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
          `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
            `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
              `<pic:nvPicPr><pic:cNvPr id="${i+1}" name="Img${i+1}"/><pic:cNvPicPr/></pic:nvPicPr>` +
              `<pic:blipFill>` +
                `<a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>` +
                `<a:stretch><a:fillRect/></a:stretch>` +
              `</pic:blipFill>` +
              `<pic:spPr>` +
                `<a:xfrm><a:off x="0" y="0"/><a:ext cx="${wEmu}" cy="${hEmu}"/></a:xfrm>` +
                `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
              `</pic:spPr>` +
            `</pic:pic>` +
          `</a:graphicData></a:graphic>` +
        `</wp:inline></w:drawing></w:r></w:p>`;
    }

    /* ZIP */
    zip.file('[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml"  ContentType="application/xml"/>` +
      `<Default Extension="png"  ContentType="image/png"/>` +
      `<Default Extension="jpg"  ContentType="image/jpeg"/>` +
      `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
      `</Types>`);
    zip.file('_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
      `</Relationships>`);
    zip.file('word/_rels/document.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      rels.map(r => `<Relationship Id="${r.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${r.name}"/>`).join('') +
      `</Relationships>`);
    zip.file('word/document.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"` +
      ` xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
      `<w:body>${bodyXml}` +
      `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>` +
      `<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>` +
      `</w:sectPr></w:body></w:document>`);
    for (const m of mediaFiles) zip.file(`word/media/${m.name}`, m.data, { base64: true });

    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE',
    });

    const filename = buildSaveFilename('docx');

    /* ── Try File System Access API (Chrome / Edge) ── */
    if (window.showDirectoryPicker) {
      try {
        const result = await getSaveDirectory(forceNew);
        if (result) {
          const { handle } = result;
          const fileHandle = await handle.getFileHandle(filename, { create: true });
          const writable   = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          overlay.remove();
          showToast(
            `✅ Saved to "${handle.name}"  |  Shift+Save to change folder`,
            'success', 6000
          );
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') { overlay.remove(); return; } // user cancelled picker
        console.warn('File System API failed, falling back to download:', err);
      }
    }

    /* ── Fallback: browser download ── */
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    overlay.remove();
    showToast('Case saved as DOCX ✓', 'success', 4000);

  } catch (err) {
    console.error('Save error:', err);
    showToast('Error saving — check console', 'error');
    overlay.remove();
  }
});

/* ═══════════════════════════════════════════════════
   LIGHTBOX
═══════════════════════════════════════════════════ */
let lightboxEl = null, currentLbIdx = -1;

function openLightbox(idx) { currentLbIdx = idx; renderLightbox(); }

function renderLightbox() {
  closeLightbox(false);
  const { dataUrl, caption, name } = images[currentLbIdx];
  const lb = document.createElement('div'); lb.className = 'lightbox';
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close'; closeBtn.innerHTML = '✕';
  closeBtn.title = 'Close (Esc)'; closeBtn.addEventListener('click', closeLightbox);

  const counter = document.createElement('div'); counter.className = 'lightbox-counter';
  counter.textContent = `${currentLbIdx + 1} / ${images.length}`;

  const wrap = document.createElement('div'); wrap.className = 'lightbox-img-wrap';
  const img  = document.createElement('img'); img.src = dataUrl; img.alt = name || 'Screenshot';
  wrap.appendChild(img);

  const capText = caption || name || '';
  if (capText) {
    const cap = document.createElement('div'); cap.className = 'lightbox-caption';
    cap.textContent = capText; wrap.appendChild(cap);
  }

  lb.appendChild(counter); lb.appendChild(closeBtn); lb.appendChild(wrap);
  document.body.appendChild(lb); lightboxEl = lb;
}

function closeLightbox(animate = true) {
  if (!lightboxEl) return;
  if (animate) {
    lightboxEl.style.animation = 'lbFadeIn 0.15s ease reverse';
    setTimeout(() => { lightboxEl?.remove(); lightboxEl = null; }, 140);
  } else { lightboxEl.remove(); lightboxEl = null; }
}

document.addEventListener('keydown', e => {
  if (!lightboxEl) return;
  if (e.key === 'Escape') closeLightbox();
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
  document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', e => {
  if (!isResizing) return;
  panelLeft.style.width = Math.min(Math.max(startWidth + (e.clientX - startX), 280), 680) + 'px';
});
document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false; panelDivider.classList.remove('dragging');
  document.body.style.cursor = ''; document.body.style.userSelect = '';
});

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
updateCanvasCount();
