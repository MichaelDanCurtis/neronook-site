'use strict';
const CATALOG_PUBLIC_KEY = 'BUMOFGiv/IeZQwB7KOnsbYVSzyItxV6+aq4aeDxd9W8=';
const $ = (selector) => document.querySelector(selector);
const node = (tag, text, className) => { const value = document.createElement(tag); if (text != null) value.textContent = text; if (className) value.className = className; return value; };
const icons = {
  'waveform': '<path d="M3 10v4m4-8v12m5-16v20m5-16v12m4-8v4"/>',
  'bubble.left.and.bubble.right.fill': '<path d="M3 4h13v10H8l-5 4V4Zm13 5h5v12l-4-3h-5v-4"/>',
  'printer.fill': '<path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6zM17 11h1"/>',
  'keyboard.fill': '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M5 9h1m3 0h1m3 0h1m3 0h1M5 12h1m3 0h1m3 0h1m3 0h1M7 16h10"/>',
  'computermouse.fill': '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 3v7M6 10h12"/>',
  'display': '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  'cloud.sun.fill': '<path d="M8 17a4 4 0 1 1 1-8 5 5 0 0 1 9 3 3 3 0 1 1 0 6H8Z"/><path d="M3 5 2 4m5-1V1m4 4 1-1M1 9h2"/>',
  'house.fill': '<path d="m2 11 10-8 10 8M5 9v12h5v-7h4v7h5V9"/>',
  'house.and.flag.fill': '<path d="m2 11 10-8 10 8M5 9v12h14V9m-7 12v-7m0-11V1h6v3h-5"/>',
  'calendar': '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6m10-6v6M3 11h18M7 15h2m3 0h2m3 0h1M7 18h2m3 0h2"/>',
  'flame.fill': '<path d="M12 2c2 5 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-6 0 4 2 5 3 5 2-3 2-6 0-10Z"/>',
  'square.grid.2x2': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  'hand.wave.fill': '<path d="M7 12V5a2 2 0 0 1 4 0v7-9a2 2 0 0 1 4 0v9-6a2 2 0 0 1 4 0v9a7 7 0 0 1-13 4l-4-6a2 2 0 0 1 3-2l2 2"/>'
};
function icon(entry) {
  const value = node('span', null, 'plugin-icon');
  value.style.setProperty('--accent', '#' + (/^[0-9A-Fa-f]{6}$/.test(entry.tint) ? entry.tint : '55734d'));
  // Only original, fixed SVG paths enter HTML; catalog strings use textContent.
  value.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (icons[entry.symbol] || icons['square.grid.2x2']) + '</svg>';
  return value;
}
const decode64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
let entries = [], filter = 'all', catalogExpired = true;
function downloadURL(entry) {
  if (catalogExpired || entry.availability !== 'available' || !entry.download || !/^downloads\/[A-Za-z0-9][A-Za-z0-9._-]{0,160}$/.test(entry.download.path)) return null;
  return new URL(entry.download.path, location.href);
}
function render() {
  const grid = $('#plugin-grid'); if (!grid) return;
  grid.replaceChildren();
  const search = ($('#search')?.value || '').trim().toLowerCase();
  const shown = entries.filter(entry => (filter === 'all' || (filter === 'available' ? entry.availability === 'available' : entry.category === filter)) && (entry.name + ' ' + entry.summary).toLowerCase().includes(search));
  for (const entry of shown) {
    const card = node('button', null, 'plugin-card'); card.type = 'button'; card.setAttribute('aria-label', 'Details for ' + entry.name);
    const head = node('div', null, 'plugin-card-head'); head.append(icon(entry), node('span', entry.availability === 'available' ? 'Available now' : 'Preview', 'plugin-badge' + (entry.availability === 'available' ? ' available' : '')));
    const foot = node('div', null, 'plugin-card-footer'); foot.append(node('span', entry.kind === 'native' ? 'Independent Mac plugin' : 'Lightweight module'), node('span', '↗'));
    card.append(head, node('h3', entry.name), node('p', entry.summary), foot);
    card.addEventListener('click', () => showDetail(entry)); grid.append(card);
  }
  if (!shown.length) grid.append(node('p', 'No plugins match this search.'));
  $('#catalog-status').textContent = catalogExpired ? 'Saved listings · this catalog has expired; downloads are paused.' : shown.length + ' plugins · signed catalog · downloads are reviewed before installation in NeroNook';
}
function showDetail(entry) {
  const body = $('#plugin-content'); body.replaceChildren();
  const heading = node('div', null, 'detail-heading'), headingCopy = node('div');
  const title = node('h2', entry.name); title.id = 'plugin-title';
  headingCopy.append(title, node('p', entry.publisher.name + ' · ' + entry.category)); heading.append(icon(entry), headingCopy);
  body.append(heading, node('p', entry.summary), node('p', entry.detail, 'detail-copy'));
  const meta = node('div', null, 'detail-meta');
  for (const [label, value] of [['VERSION', entry.version], ['MACOS', entry.minimumOS + '+'], ['NERONOOK', entry.minimumHost + '+']]) { const item = node('div', value); item.prepend(node('span', label)); meta.append(item); }
  body.append(meta, node('h3', 'Access & requirements'));
  const list = node('ul'); for (const permission of entry.capabilities) list.append(node('li', permission));
  if (!entry.capabilities.length) list.append(node('li', 'No additional capabilities declared.'));
  for (const dependency of entry.dependencies) list.append(node('li', dependency.name + ': ' + dependency.detail));
  body.append(list);
  if (entry.kind === 'native') body.append(node('p', 'Runs as an independent Mac application. Its declared access does not replace macOS permissions.', 'fineprint'));
  body.append(node('h3', 'Release notes'), node('p', entry.releaseNotes, 'fineprint'));
  const url = downloadURL(entry);
  if (url) {
    const download = node('a', 'Download ' + entry.name + ' ↓', 'button dark'); download.href = url.href; download.download = '';
    body.append(download, node('p', 'For a guided install, open Plugin Library inside NeroNook. For a manual install, follow the setup guide.', 'fineprint'));
    const checksum = node('details'); checksum.append(node('summary', 'Download integrity (SHA-256)'), node('code', entry.download.sha256)); checksum.style.overflowWrap = 'anywhere'; checksum.style.fontSize = '10px'; checksum.style.marginTop = '15px'; body.append(checksum);
  } else { body.append(node('p', catalogExpired ? 'Downloads are paused until the catalog is refreshed.' : 'This module is being prepared for public download. Its existing local version remains a separate developer preview.', 'notice')); }
  $('#plugin-detail').showModal();
}
async function loadCatalog() {
  if (!$('#plugin-grid')) return;
  try {
    const response = await fetch('catalog.json', {credentials: 'omit', cache: 'no-store'});
    if (!response.ok) throw new Error('Catalog unavailable');
    const raw = await response.text(); if (raw.length > 1500000) throw new Error('Catalog too large');
    const envelope = JSON.parse(raw);
    if (envelope.keyID !== 'nero-catalog-2026') throw new Error('Unknown catalog signer');
    const payload = decode64(envelope.payload), signature = decode64(envelope.signature);
    const key = await crypto.subtle.importKey('raw', decode64(CATALOG_PUBLIC_KEY), {name:'Ed25519'}, false, ['verify']);
    if (!(await crypto.subtle.verify('Ed25519', key, signature, payload))) throw new Error('Invalid catalog signature');
    const catalog = JSON.parse(new TextDecoder().decode(payload));
    if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.entries) || catalog.entries.length > 200) throw new Error('Unsupported catalog');
    const published = new Date(catalog.publishedAt).getTime(), expires = new Date(catalog.expiresAt).getTime();
    if (!Number.isFinite(published) || !Number.isFinite(expires) || published > Date.now()+300000 || expires <= published || expires-published > 45*86400000 || !Number.isInteger(catalog.sequence) || catalog.sequence<1) throw new Error('Invalid catalog dates or revision');
    catalogExpired = expires <= Date.now(); entries = catalog.entries; render();
    const requested = new URL(location.href).searchParams.get('plugin'); if (requested) { const entry = entries.find(item => item.id === requested); if (entry) showDetail(entry); }
  } catch { $('#catalog-status').textContent = 'The catalog could not be verified. Please refresh, or browse it in NeroNook’s Plugin Library.'; }
}
$('#search')?.addEventListener('input', render);
for (const button of document.querySelectorAll('[data-filter]')) button.addEventListener('click', () => { filter = button.dataset.filter; for (const other of document.querySelectorAll('[data-filter]')) { other.classList.toggle('active', other === button); other.setAttribute('aria-pressed', String(other === button)); } render(); });
$('.dialog-close')?.addEventListener('click', () => $('#plugin-detail').close());
$('#plugin-detail')?.addEventListener('click', event => { if (event.target === $('#plugin-detail')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); } });
const demoCopy = {weather:'Weather, at a glance.',voice:'Dictation, without leaving your app.',workflows:'Progress stays in view.'};
function selectDemo(button) { for (const other of document.querySelectorAll('[data-demo]')) { const active = other === button; other.classList.toggle('selected', active); other.setAttribute('aria-selected', String(active)); other.tabIndex = active ? 0 : -1; $('#panel-' + other.dataset.demo).hidden = !active; } $('#demo-status').textContent = demoCopy[button.dataset.demo]; }
const demoButtons = [...document.querySelectorAll('[data-demo]')];
for (const [index, button] of demoButtons.entries()) { button.tabIndex = index === 0 ? 0 : -1; button.addEventListener('click', () => selectDemo(button)); button.addEventListener('keydown', event => { if (!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? demoButtons.length - 1 : (index + (['ArrowDown','ArrowRight'].includes(event.key) ? 1 : -1) + demoButtons.length) % demoButtons.length; selectDemo(demoButtons[next]); demoButtons[next].focus(); }); }
loadCatalog();
