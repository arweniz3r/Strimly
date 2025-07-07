const form = document.getElementById('stream-form');
const input = document.getElementById('stream-input');
const container = document.getElementById('streams-container');
const warning = document.getElementById('warning');

// Store added streams as {platform, id} objects
const addedStreams = [];

// --- Session Persistence ---
const STORAGE_KEY = 'strimly_streams';



// --- Theme toggle ---
const themeToggleBtn = document.getElementById('theme-toggle');
function setTheme(light) {
  document.body.classList.toggle('light-theme', light);
  if (themeToggleBtn) themeToggleBtn.textContent = light ? '☀️' : '🌙';
  localStorage.setItem('strimly_theme', light ? 'light' : 'dark');
}
if (themeToggleBtn) {
  themeToggleBtn.onclick = () => setTheme(!document.body.classList.contains('light-theme'));
}
// On load, restore theme
const savedTheme = localStorage.getItem('strimly_theme');
if (savedTheme === 'light') setTheme(true);

// --- Minimize and expand stream data for sharing (array of arrays) ---
function minimizeStreams(streams) {
  return streams.map(s => [s.platform[0], s.id]);
}
function expandStreams(minimized) {
  return minimized.map(s => ({
    platform: s[0] === 't' ? 'twitch' : s[0] === 'k' ? 'kick' : s[0] === 'y' ? 'youtube' : s[0],
    id: s[1]
  }));
}

// --- Share functionality (most compact) ---
const shareBtn = document.getElementById('share-btn');
if (shareBtn) {
  shareBtn.addEventListener('click', () => {
    if (addedStreams.length === 0) {
      showWarning('Add some streams first before sharing!');
      return;
    }
    // Minimize and base64 encode (array of arrays)
    const minimized = minimizeStreams(addedStreams);
    const streamData = btoa(unescape(encodeURIComponent(JSON.stringify(minimized))));
    const shareUrl = `${window.location.origin}${window.location.pathname}?s=${streamData}`;
    if (navigator.share) {
      navigator.share({
        title: 'Strimly Stream Setup',
        text: 'Check out my multi-stream setup!',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showWarning('Share URL copied to clipboard!');
      }).catch(() => {
        prompt('Copy this URL to share:', shareUrl);
      });
    }
  });
}

// --- URL stream loading (most compact) ---
function loadStreamsFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const base64Param = urlParams.get('s');
  if (base64Param) {
    try {
      const decoded = decodeURIComponent(escape(atob(base64Param)));
      const minimized = JSON.parse(decoded);
      if (Array.isArray(minimized)) {
        const expanded = expandStreams(minimized);
        addedStreams.length = 0; // Clear existing
        expanded.forEach(stream => {
          if (stream.platform && stream.id) {
            addedStreams.push(stream);
          }
        });
        saveStreams();
        return true;
      }
    } catch (e) {
      console.error('Failed to parse streams from base64 URL:', e);
    }
  }
  return false;
}

// --- Kick warning banner ---
function showKickWarningBanner() {
  if (document.getElementById('kick-warning-banner')) return;
  
  const banner = document.createElement('div');
  banner.id = 'kick-warning-banner';
  banner.className = 'kick-warning-banner';
  banner.innerHTML = `
    <b>🟢 Kick streams may be unstable and occasionally fail to load.</b>
    If a Kick stream doesn't work, try refreshing the page or removing and re-adding it.
  `;
  
  const streamsContainer = document.getElementById('streams-container');
  streamsContainer.parentNode.insertBefore(banner, streamsContainer);
}

function hideKickWarningBanner() {
  const banner = document.getElementById('kick-warning-banner');
  if (banner) banner.remove();
}

function showWarning(msg) {
  warning.textContent = msg;
  warning.style.display = 'block';
  warning.style.opacity = '1';
  warning.style.transition = 'opacity 0.4s';
  setTimeout(() => {
    warning.style.opacity = '0';
    setTimeout(() => { warning.style.display = 'none'; }, 400);
  }, 2500);
}

function parseStreamInput(value) {
  value = value.trim();
  // Detect Kick VODs (recorded videos)
  const kickVodRegex = /^(?:https?:\/\/)?(?:www\.)?kick\.com\/video\/[a-zA-Z0-9-]+$/;
  if (kickVodRegex.test(value)) {
    showWarning('Kick VODs (recorded videos) cannot be embedded. Only live Kick channels are supported.');
    return null;
  }
  // Twitch
  const twitchRegex = /^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)$|^([a-zA-Z0-9_]{4,25})$/;
  
  // Kick
  const kickRegex = /^(?:https?:\/\/)?(?:www\.)?kick\.com\/([a-zA-Z0-9_]+)$|^([a-zA-Z0-9_]{3,25})$/;
  
  // YouTube - improved to handle URLs with extra parameters
  const ytUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})(?:[&\?].*)?$/;
  const ytIdRegex = /^([\w-]{11})$/;

  let match;
  
  // Twitch
  match = value.match(twitchRegex);
  if (match && (match[1] || match[2])) {
    return { platform: 'twitch', id: match[1] || match[2] };
  }
  
  // Kick
  match = value.match(kickRegex);
  if (match && (match[1] || match[2])) {
    return { platform: 'kick', id: match[1] || match[2] };
  }
  
  // YouTube
  match = value.match(ytUrlRegex);
  if (match && match[1]) {
    return { platform: 'youtube', id: match[1] };
  }
  
  match = value.match(ytIdRegex);
  if (match && match[1]) {
    return { platform: 'youtube', id: match[1] };
  }
  
  return null;
}

function getEmbedUrl(platform, id) {
  switch (platform) {
    case 'twitch':
      return `https://player.twitch.tv/?channel=${id}&parent=${location.hostname}&muted=false&autoplay=true`;
    case 'kick':
      return `https://player.kick.com/${id}`;
    case 'youtube':
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    default:
      return '';
  }
}

function getStreamLabel(platform, id) {
  switch (platform) {
    case 'twitch': return `Twitch: ${id}`;
    case 'kick': return `Kick: ${id}`;
    case 'youtube': return `YouTube: ${id}`;
    default: return `${platform}: ${id}`;
  }
}

function getPlatformIcon(platform) {
  switch (platform) {
    case 'twitch': return '🟣';
    case 'kick': return '🟢';
    case 'youtube': return '🔴';
    default: return '📺';
  }
}

function createErrorOverlay(platform, id, message) {
  const overlay = document.createElement('div');
  overlay.className = 'stream-error-overlay';
  let platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  let icon = '⚠️';
  let extra = '';
  if (platform === 'kick') {
    icon = '🟢';
    extra = '<div style="margin-top:0.5em;font-size:0.97em;">Kick embeds are unstable and may not always work. Try refreshing or removing/re-adding the stream.</div>';
  }
  overlay.innerHTML = `
    <div class="stream-error-content">
      <span class="stream-error-icon">${icon}</span>
      <div><b>${platformName} stream failed to load</b></div>
      <div style="margin-top:0.3em; font-size:0.98em;">${message}</div>
      ${extra}
    </div>
  `;
  return overlay;
}

// Show a persistent warning if running on file://
function showServerWarningBanner() {
  if (document.getElementById('server-warning-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'server-warning-banner';
  banner.innerHTML = `
    <b>⚠️ Strimly requires running on a web server for Twitch and YouTube streams to work.</b><br>
    Please <span style="text-decoration:underline;cursor:pointer;" id="show-server-instructions">click here for instructions</span>.<br>
    <span style="font-size:0.95em;">(Kick streams work without a server.)</span>
  `;
  document.body.prepend(banner);
  document.getElementById('show-server-instructions').onclick = () => {
    alert('To run Strimly locally, open a terminal in your project folder and run:\n\nPython 3:  python -m http.server 8000\n\nThen open http://localhost:8000 in your browser.');
  };
}

if (location.protocol === 'file:') {
  showServerWarningBanner();
}

function saveStreams() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addedStreams));
}

function loadStreams() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;
  try {
    const streams = JSON.parse(data);
    if (Array.isArray(streams)) {
      streams.forEach(s => {
        // Only add if not already present
        if (!addedStreams.some(x => x.platform === s.platform && x.id === s.id)) {
          addedStreams.push(s);
        }
      });
    }
  } catch {}
}

function showLoadingOverlay(player) {
  let overlay = player.querySelector('.stream-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'stream-loading-overlay';
    overlay.innerHTML = '<div class="stream-loading-spinner"></div>';
    player.appendChild(overlay);
  }
}

function hideLoadingOverlay(player) {
  const overlay = player.querySelector('.stream-loading-overlay');
  if (overlay) overlay.remove();
}

// --- Rendering helpers ---
function createStreamCard({ platform, id }) {
  // Create player
  const player = document.createElement('div');
  player.className = 'stream-player';
  player.dataset.platform = platform;
  player.dataset.id = id;
  player.draggable = true;

  // Header with label, icon, and remove button
  const header = document.createElement('div');
  header.className = 'stream-header';
  header.textContent = getStreamLabel(platform, id);
  header.setAttribute('data-icon', getPlatformIcon(platform));

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.title = 'Remove stream';
  removeBtn.innerHTML = '❌';
  removeBtn.onclick = () => {
    // Animate fade out
    player.style.transition = 'opacity 0.35s, transform 0.35s';
    player.style.opacity = '0';
    player.style.transform = 'scale(0.96) translateY(20px)';
    setTimeout(() => {
      if (player.parentNode) container.removeChild(player);
      // Remove from addedStreams
      const idx = addedStreams.findIndex(s => s.platform === platform && s.id === id);
      if (idx !== -1) addedStreams.splice(idx, 1);
      saveStreams();
      // If no streams left, show empty state and hide Kick banner
      if (addedStreams.length === 0) {
        renderStreams();
      } else if (!addedStreams.some(s => s.platform === 'kick')) {
        hideKickWarningBanner();
      }
    }, 350);
  };
  header.appendChild(removeBtn);

  // Iframe
  const iframe = document.createElement('iframe');
  iframe.className = 'stream-iframe';
  iframe.src = getEmbedUrl(platform, id);
  if (platform === 'youtube') {
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', `YouTube video: ${id}`);
  } else if (platform === 'kick') {
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('title', `Kick channel: ${id}`);
  } else {
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
  }
  // Error overlay logic
  let errorShown = false;
  function showError(msg) {
    if (errorShown) return;
    errorShown = true;
    const overlay = createErrorOverlay(platform, id, msg);
    player.appendChild(overlay);
  }
  if (platform === 'youtube') {
    iframe.addEventListener('error', () => {
      showError('This YouTube video cannot be embedded. The video owner may have disabled embedding or there may be regional restrictions.');
    });
  }
  if (platform === 'twitch' && location.protocol === 'file:') {
    // Do not show per-stream error overlay
  } else if (platform === 'twitch') {
    const validParent = ['localhost', '127.0.0.1'].includes(location.hostname) || location.hostname.includes('.');
    if (!validParent) {
      showError('Twitch streams require running on a web server (not file://). Please use a local server and access via http://localhost or your domain.');
    }
  }
  iframe.onerror = () => {
    showError('Failed to load the stream. The stream may be offline or embedding may be restricted.');
  };
  // Loading overlay
  showLoadingOverlay(player);
  iframe.addEventListener('load', () => hideLoadingOverlay(player));
  setTimeout(() => hideLoadingOverlay(player), 7000);
  player.appendChild(header);
  player.appendChild(iframe);
  return player;
}

function renderStreams() {
  const emptyState = document.getElementById('empty-state');
  // Remove all stream cards, but NOT the empty state
  Array.from(container.children).forEach(child => {
    if (child.id !== 'empty-state') container.removeChild(child);
  });
  let hasKick = false;
  if (addedStreams.length === 0) {
    if (emptyState) emptyState.style.display = '';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    addedStreams.forEach(s => {
      if (s.platform === 'kick') hasKick = true;
      const card = createStreamCard(s);
      container.appendChild(card);
    });
  }
  enableDragDrop();
  // Show/hide Kick warning banner
  if (hasKick) showKickWarningBanner();
  else hideKickWarningBanner();
}

// On page load, restore streams
window.addEventListener('DOMContentLoaded', () => {
  if (!loadStreamsFromUrl()) loadStreams();
  renderStreams();
  // Add handler for Try an Example button in empty state
  const tryExampleBtn = document.getElementById('try-example');
  if (tryExampleBtn) {
    tryExampleBtn.onclick = () => {
      // Add a sample Twitch stream (e.g., shroud)
      if (!addedStreams.some(s => s.platform === 'twitch' && s.id === 'shroud')) {
        addedStreams.push({ platform: 'twitch', id: 'shroud' });
        saveStreams();
        renderStreams();
      }
    };
  }
});

// When user adds a stream
form.addEventListener('submit', e => {
  e.preventDefault();
  const value = input.value;
  const parsed = parseStreamInput(value);
  if (!parsed) {
    showWarning('Invalid stream input. Please enter a valid Twitch/Kick channel or YouTube video URL/ID.');
    return;
  }
  // Only add if not already present
  if (addedStreams.some(s => s.platform === parsed.platform && s.id === parsed.id)) {
    showWarning('Stream already added!');
    return;
  }
  const wasEmpty = addedStreams.length === 0;
  addedStreams.push(parsed);
  saveStreams();
  if (wasEmpty) {
    renderStreams();
  } else {
    // Hide empty state if visible
    const emptyState = document.getElementById('empty-state');
    if (emptyState) emptyState.style.display = 'none';
    // Add the new stream card only
    const card = createStreamCard(parsed);
    container.appendChild(card);
    enableDragDrop();
    if (parsed.platform === 'kick') showKickWarningBanner();
  }
  input.value = '';
});

// --- Drag-and-drop for stream players ---
function enableDragDrop() {
  let dragSrc = null;
  let dragSrcIndex = null;

  function handleDragStart(e) {
    dragSrc = this;
    dragSrcIndex = Array.from(container.children).indexOf(this);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    this.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (dragSrc === this) return false;
    
    const dropIndex = Array.from(container.children).indexOf(this);
    
    // Update the addedStreams array
    const draggedStream = addedStreams[dragSrcIndex];
    addedStreams.splice(dragSrcIndex, 1);
    addedStreams.splice(dropIndex, 0, draggedStream);
    
    saveStreams();
    renderStreams();
    
    return false;
  }

  function handleDragEnd(e) {
    this.classList.remove('dragging');
    Array.from(container.children).forEach(child => {
      child.classList.remove('drag-over');
    });
  }

  // Add event listeners to all stream players
  Array.from(container.children).forEach(child => {
    if (child.classList.contains('stream-player')) {
      child.addEventListener('dragstart', handleDragStart);
      child.addEventListener('dragover', handleDragOver);
      child.addEventListener('dragenter', handleDragEnter);
      child.addEventListener('dragleave', handleDragLeave);
      child.addEventListener('drop', handleDrop);
      child.addEventListener('dragend', handleDragEnd);
    }
  });
}
