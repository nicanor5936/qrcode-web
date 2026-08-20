// Version web (PWA) du generateur QR Code — memes fonctionnalites que la version
// desktop, mais telechargement via lien direct et historique via localStorage
// (pas d'acces au systeme de fichiers natif dans un navigateur).

const modeEl = document.getElementById('mode');
const contentEl = document.getElementById('content');
const sizeEl = document.getElementById('size');
const sizeValEl = document.getElementById('size-val');
const eccEl = document.getElementById('ecc');
const fgEl = document.getElementById('fg');
const bgEl = document.getElementById('bg');
const marginEl = document.getElementById('margin');
const marginValEl = document.getElementById('margin-val');
const canvas = document.getElementById('qr-canvas');
const statusEl = document.getElementById('status');
const logoInput = document.getElementById('logo');
const btnRemoveLogo = document.getElementById('btn-remove-logo');

const websiteUrl = document.getElementById('website-url');
const waNumber = document.getElementById('wa-number');
const waMessage = document.getElementById('wa-message');
const fbUsername = document.getElementById('fb-username');
const igUsername = document.getElementById('ig-username');
const ttUsername = document.getElementById('tt-username');
const ytChannel = document.getElementById('yt-channel');
const liUsername = document.getElementById('li-username');
const xUsername = document.getElementById('x-username');
const scUsername = document.getElementById('sc-username');
const smsNumber = document.getElementById('sms-number');
const smsMessage = document.getElementById('sms-message');
const emAddress = document.getElementById('em-address');
const emSubject = document.getElementById('em-subject');
const wifiSsid = document.getElementById('wifi-ssid');
const wifiPassword = document.getElementById('wifi-password');
const wifiEnc = document.getElementById('wifi-enc');
const wifiHidden = document.getElementById('wifi-hidden');
const vcName = document.getElementById('vc-name');
const vcPhone = document.getElementById('vc-phone');
const vcEmail = document.getElementById('vc-email');
const vcOrg = document.getElementById('vc-org');

let debounceTimer = null;
let logoImage = null;

function escapeWifi(str) {
  return str.replace(/([\\;,:"])/g, '\\$1');
}

function buildContent() {
  const mode = modeEl.value;

  if (mode === 'website') {
    let url = websiteUrl.value.trim();
    if (!url) return null;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    return url;
  }
  if (mode === 'whatsapp') {
    const number = waNumber.value.trim().replace(/[^0-9]/g, '');
    if (!number) return null;
    const msg = waMessage.value.trim();
    return `https://wa.me/${number}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
  }
  if (mode === 'facebook') {
    const raw = fbUsername.value.trim();
    if (!raw) return null;
    return /^https?:\/\//i.test(raw) ? raw : `https://facebook.com/${raw.replace(/^@/, '')}`;
  }
  if (mode === 'instagram') {
    const raw = igUsername.value.trim();
    if (!raw) return null;
    return /^https?:\/\//i.test(raw) ? raw : `https://instagram.com/${raw.replace(/^@/, '')}`;
  }
  if (mode === 'tiktok') {
    const raw = ttUsername.value.trim();
    if (!raw) return null;
    return /^https?:\/\//i.test(raw) ? raw : `https://tiktok.com/@${raw.replace(/^@/, '')}`;
  }
  if (mode === 'youtube') {
    const raw = ytChannel.value.trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://youtube.com/@${raw.replace(/^@/, '')}`;
  }
  if (mode === 'linkedin') {
    const raw = liUsername.value.trim();
    if (!raw) return null;
    return /^https?:\/\//i.test(raw) ? raw : `https://linkedin.com/in/${raw}`;
  }
  if (mode === 'x') {
    const raw = xUsername.value.trim();
    if (!raw) return null;
    return /^https?:\/\//i.test(raw) ? raw : `https://x.com/${raw.replace(/^@/, '')}`;
  }
  if (mode === 'snapchat') {
    const raw = scUsername.value.trim();
    if (!raw) return null;
    return /^https?:\/\//i.test(raw) ? raw : `https://snapchat.com/add/${raw.replace(/^@/, '')}`;
  }
  if (mode === 'sms') {
    const number = smsNumber.value.trim();
    if (!number) return null;
    const msg = smsMessage.value.trim();
    return `SMSTO:${number}:${msg}`;
  }
  if (mode === 'email') {
    const address = emAddress.value.trim();
    if (!address) return null;
    const subject = emSubject.value.trim();
    return `mailto:${address}${subject ? '?subject=' + encodeURIComponent(subject) : ''}`;
  }
  if (mode === 'wifi') {
    const ssid = escapeWifi(wifiSsid.value.trim());
    const pass = escapeWifi(wifiPassword.value.trim());
    const enc = wifiEnc.value;
    const hidden = wifiHidden.value;
    if (!ssid) return null;
    const passPart = enc === 'nopass' ? '' : `P:${pass};`;
    return `WIFI:T:${enc};S:${ssid};${passPart}H:${hidden};;`;
  }
  if (mode === 'vcard') {
    const name = vcName.value.trim();
    const phone = vcPhone.value.trim();
    const email = vcEmail.value.trim();
    const org = vcOrg.value.trim();
    if (!name) return null;
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    vcard += `FN:${name}\n`;
    if (org) vcard += `ORG:${org}\n`;
    if (phone) vcard += `TEL;TYPE=CELL:${phone}\n`;
    if (email) vcard += `EMAIL:${email}\n`;
    vcard += 'END:VCARD';
    return vcard;
  }
  return contentEl.value.trim() || null;
}

function drawLogo() {
  if (!logoImage) return;
  const ctx = canvas.getContext('2d');
  const logoSize = canvas.width * 0.22;
  const x = (canvas.width - logoSize) / 2;
  const y = (canvas.height - logoSize) / 2;
  const pad = 6;
  ctx.fillStyle = bgEl.value;
  ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);
  ctx.drawImage(logoImage, x, y, logoSize, logoSize);
}

function generate() {
  const text = buildContent();
  if (!text) {
    statusEl.textContent = 'Renseigne les champs requis pour ce type de QR code.';
    statusEl.className = 'status';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const size = parseInt(sizeEl.value, 10);
  QRCode.toCanvas(canvas, text, {
    width: size,
    margin: parseInt(marginEl.value, 10),
    errorCorrectionLevel: eccEl.value,
    color: { dark: fgEl.value, light: bgEl.value }
  }, (err) => {
    if (err) {
      statusEl.textContent = 'Erreur : contenu trop long pour ce niveau de correction.';
      statusEl.className = 'status';
    } else {
      statusEl.textContent = '';
      drawLogo();
    }
  });
}

function scheduleGenerate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(generate, 120);
}

function updateModeVisibility() {
  const modes = ['website', 'whatsapp', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'snapchat', 'sms', 'email', 'text', 'wifi', 'vcard'];
  modes.forEach(m => {
    const el = document.getElementById(`fields-${m}`);
    if (el) el.classList.toggle('hidden', modeEl.value !== m);
  });
}

modeEl.addEventListener('change', () => {
  updateModeVisibility();
  scheduleGenerate();
});

[
  contentEl, sizeEl, eccEl, fgEl, bgEl, marginEl,
  websiteUrl, waNumber, waMessage, fbUsername, igUsername, ttUsername,
  ytChannel, liUsername, xUsername, scUsername, smsNumber, smsMessage,
  emAddress, emSubject,
  wifiSsid, wifiPassword, wifiEnc, wifiHidden,
  vcName, vcPhone, vcEmail, vcOrg
].forEach(el => {
  el.addEventListener('input', () => {
    sizeValEl.textContent = `${sizeEl.value} px`;
    marginValEl.textContent = marginEl.value;
    scheduleGenerate();
  });
});

logoInput.addEventListener('change', () => {
  const file = logoInput.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    logoImage = img;
    if (eccEl.value !== 'H') {
      eccEl.value = 'H';
      statusEl.textContent = 'Correction d\'erreur passée en "Maximale" pour rester scannable avec le logo.';
      statusEl.className = 'status';
    }
    scheduleGenerate();
  };
  img.src = URL.createObjectURL(file);
});

btnRemoveLogo.addEventListener('click', () => {
  logoImage = null;
  logoInput.value = '';
  scheduleGenerate();
});

updateModeVisibility();
generate();

// ---------- Telechargement (navigateur : lien direct, pas de dialogue natif) ----------
document.getElementById('btn-download').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  statusEl.textContent = 'QR code téléchargé.';
  statusEl.className = 'status ok';
  saveToHistory();
});

// ---------- Copier dans le presse-papiers ----------
document.getElementById('btn-copy').addEventListener('click', () => {
  canvas.toBlob(async (blob) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      statusEl.textContent = 'Image copiée dans le presse-papiers.';
      statusEl.className = 'status ok';
      saveToHistory();
    } catch (e) {
      statusEl.textContent = 'Copie non supportée sur ce navigateur.';
      statusEl.className = 'status';
    }
  });
});

// ---------- Historique (localStorage, propre a chaque navigateur/appareil) ----------
const HISTORY_KEY = 'qrcode-history';
const historyListEl = document.getElementById('history-list');
const btnClearHistory = document.getElementById('btn-clear-history');

const modeLabels = {
  website: 'Site web', whatsapp: 'WhatsApp', facebook: 'Facebook',
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube',
  linkedin: 'LinkedIn', x: 'X', snapchat: 'Snapchat', sms: 'SMS',
  email: 'Email', wifi: 'Wi-Fi', vcard: 'Contact', text: 'Texte'
};

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function writeHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
}

function renderHistory(items) {
  if (!items || items.length === 0) {
    historyListEl.innerHTML = '<p class="history-empty">Aucun QR code généré pour l\'instant.</p>';
    return;
  }
  historyListEl.innerHTML = '';
  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <span class="history-item-label">${escapeHtml(item.label)}</span>
      <span class="history-item-type">${modeLabels[item.mode] || item.mode}</span>
    `;
    div.addEventListener('click', () => loadHistoryItem(item));
    historyListEl.appendChild(div);
  });
}

function loadHistoryItem(item) {
  modeEl.value = item.mode;
  updateModeVisibility();
  const f = item.fields || {};
  Object.keys(f).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = f[id];
  });
  scheduleGenerate();
}

function getCurrentFieldValues() {
  const idsByMode = {
    website: ['website-url'], whatsapp: ['wa-number', 'wa-message'],
    facebook: ['fb-username'], instagram: ['ig-username'], tiktok: ['tt-username'],
    youtube: ['yt-channel'], linkedin: ['li-username'], x: ['x-username'],
    snapchat: ['sc-username'], sms: ['sms-number', 'sms-message'],
    email: ['em-address', 'em-subject'],
    wifi: ['wifi-ssid', 'wifi-password', 'wifi-enc', 'wifi-hidden'],
    vcard: ['vc-name', 'vc-phone', 'vc-email', 'vc-org'],
    text: ['content']
  };
  const ids = idsByMode[modeEl.value] || [];
  const fields = {};
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) fields[id] = el.value;
  });
  return fields;
}

function buildHistoryEntry() {
  const mode = modeEl.value;
  const fields = getCurrentFieldValues();
  let label = '';
  switch (mode) {
    case 'website': label = fields['website-url']; break;
    case 'whatsapp': label = fields['wa-number']; break;
    case 'facebook': label = fields['fb-username']; break;
    case 'instagram': label = fields['ig-username']; break;
    case 'tiktok': label = fields['tt-username']; break;
    case 'youtube': label = fields['yt-channel']; break;
    case 'linkedin': label = fields['li-username']; break;
    case 'x': label = fields['x-username']; break;
    case 'snapchat': label = fields['sc-username']; break;
    case 'sms': label = fields['sms-number']; break;
    case 'email': label = fields['em-address']; break;
    case 'wifi': label = fields['wifi-ssid']; break;
    case 'vcard': label = fields['vc-name']; break;
    default: label = fields['content'];
  }
  return { mode, fields, label: (label || '').slice(0, 60), date: new Date().toISOString() };
}

function saveToHistory() {
  const entry = buildHistoryEntry();
  if (!entry.label) return;
  const items = readHistory();
  items.unshift(entry);
  writeHistory(items);
  renderHistory(readHistory());
}

btnClearHistory.addEventListener('click', () => {
  writeHistory([]);
  renderHistory([]);
});

renderHistory(readHistory());

// ---------- Enregistrement du service worker (fonctionnement hors ligne) ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
