'use strict';

// â”€â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Stores arrays of { dataUrl, filename } per field
const imageStore = {
  issue:      [],
  action:     [],
  resolution: [],
};

// â”€â”€â”€ DOM References â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const form         = document.getElementById('form');
const copyButton   = document.getElementById('copyButton');
const copyBtnText  = document.getElementById('copyBtnText');
const toast        = document.getElementById('toast');
const lightbox     = document.getElementById('lightbox');
const lightboxImg  = document.getElementById('lightboxImg');
const lightboxClose= document.getElementById('lightboxClose');

const fields = ['issue', 'action', 'resolution'];

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function showToast() {
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
}

function resetCopyButton() {
  copyButton.classList.remove('copied');
  copyBtnText.textContent = 'Copy Note';
}

function renderPreviews(field) {
  const container = document.getElementById(`previews-${field}`);
  const zone      = document.getElementById(`imageZone-${field}`);
  const images    = imageStore[field];

  container.innerHTML = '';

  images.forEach((img, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'image-thumb-wrapper';

    const thumb = document.createElement('img');
    thumb.className = 'image-thumb';
    thumb.src = img.dataUrl;
    thumb.alt = img.filename || 'Screenshot';
    thumb.title = 'Click to expand';
    thumb.addEventListener('click', () => openLightbox(img.dataUrl));

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'image-remove';
    removeBtn.innerHTML = 'âœ•';
    removeBtn.title = 'Remove image';
    removeBtn.setAttribute('aria-label', 'Remove image');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageStore[field].splice(index, 1);
      renderPreviews(field);
      resetCopyButton();
    });

    wrapper.appendChild(thumb);
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);
  });

  zone.classList.toggle('has-images', images.length > 0);
}

function addImageFromFile(field, file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    imageStore[field].push({ dataUrl: e.target.result, filename: file.name });
    renderPreviews(field);
    resetCopyButton();
  };
  reader.readAsDataURL(file);
}

// â”€â”€â”€ Paste Handler (works on textarea + image zones) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  // Find which field is focused or hovered
  const activeField = getActiveField();
  if (!activeField) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      addImageFromFile(activeField, file);
      return; // only handle image paste here
    }
  }
  // text paste falls through to browser default (into textarea)
});

function getActiveField() {
  const focused = document.activeElement;
  if (focused?.id === 'issueText')      return 'issue';
  if (focused?.id === 'actionText')     return 'action';
  if (focused?.id === 'resolutionText') return 'resolution';
  // fallback: check which zone is being hovered (via data attr)
  const hovered = document.querySelector('.image-zone:hover');
  return hovered?.dataset?.field || null;
}

// â”€â”€â”€ Drag & Drop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
fields.forEach((field) => {
  const zone = document.getElementById(`imageZone-${field}`);

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const files = e.dataTransfer?.files;
    if (files) {
      Array.from(files).forEach((f) => addImageFromFile(field, f));
    }
  });

  // Click on zone â†’ open file picker
  zone.addEventListener('click', (e) => {
    if (e.target.classList.contains('image-remove') || e.target.closest('.image-thumb')) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = () => {
      Array.from(input.files).forEach((f) => addImageFromFile(field, f));
    };
    input.click();
  });
});

// Allow paste from textarea focus into the same field's image zone
fields.forEach((field) => {
  const textarea = document.getElementById(`${field}Text`) ||
                   document.getElementById(field === 'issue' ? 'issueText' : field === 'action' ? 'actionText' : 'resolutionText');
  if (textarea) {
    textarea.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          addImageFromFile(field, item.getAsFile());
          return;
        }
      }
    });
  }
});

// â”€â”€â”€ Lightbox â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { lightboxImg.src = ''; }, 200);
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

// â”€â”€â”€ Copy Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
copyButton.addEventListener('click', () => {
  const customer   = document.getElementById('nameText').value;
  const issue      = document.getElementById('issueText').value;
  const action     = document.getElementById('actionText').value;
  const resolution = document.getElementById('resolutionText').value;

  const textToCopy =
    `${customer}\n\nIssue: \n${issue}\n\nAction: \n${action}\n\nResolution: \n${resolution}`;

  navigator.clipboard.writeText(textToCopy).then(() => {
    copyButton.classList.add('copied');
    copyBtnText.textContent = 'Copied âœ“';
    showToast();
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = textToCopy;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copyButton.classList.add('copied');
    copyBtnText.textContent = 'Copied âœ“';
    showToast();
  });
});

// â”€â”€â”€ Reset copy button on any input change â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelectorAll('.input').forEach((el) => {
  el.addEventListener('input', resetCopyButton);
});

// â”€â”€â”€ Clear Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
form.addEventListener('submit', (e) => {
  e.preventDefault();
  document.querySelectorAll('.input').forEach((el) => { el.value = ''; });
  fields.forEach((field) => {
    imageStore[field] = [];
    renderPreviews(field);
  });
  resetCopyButton();
});
