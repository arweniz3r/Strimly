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

// --- Share functionality ---
const shareBtn = document.getElementById('share-btn');
if (shareBtn) {
  shareBtn.addEventListener('click', () => {
    if (addedStreams.length === 0) {
      showWarning('Add some streams first before sharing!');
      return;
    }
    
    const streamData = encodeURIComponent(JSON.stringify(addedStreams));
    const shareUrl = `${window.location.origin}${window.location.pathname}?streams=${streamData}`;
    
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

// --- URL stream loading ---
function loadStreamsFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const streamsParam = urlParams.get('streams');
  
  if (streamsParam) {
    try {
      const streams = JSON.parse(decodeURIComponent(streamsParam));
      if (Array.isArray(streams)) {
        addedStreams.length = 0; // Clear existing
        streams.forEach(stream => {
          if (stream.platform && stream.id) {
            addedStreams.push(stream);
          }
        });
        saveStreams();
        return true;
      }
    } catch (e) {
      console.error('Failed to parse streams from URL:', e);
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

// --- Gaming News Widget ---
const newsToggle = document.getElementById('news-toggle');
const newsWidget = document.getElementById('news-widget');
const newsContent = document.getElementById('news-content');
const refreshNewsBtn = document.getElementById('refresh-news');

// News sources (free RSS feeds)
const newsSources = [
  {
    name: 'Polygon',
    url: 'https://polygon.com/rss/index.xml',
    icon: '📰'
  },
  {
    name: 'Kotaku',
    url: 'https://kotaku.com/rss',
    icon: '🎮'
  },
  {
    name: 'IGN',
    url: 'https://feeds.feedburner.com/ign/all',
    icon: '🔥'
  },
  {
    name: 'GameSpot',
    url: 'https://gamespot.com/feeds/game-news/',
    icon: '🎯'
  }
];

// Alternative: Use JSON feeds or simpler sources
const alternativeNewsSources = [
  {
    name: 'Gaming News',
    url: 'https://newsapi.org/v2/everything?q=gaming&language=en&sortBy=publishedAt&apiKey=demo',
    icon: '🎮',
    type: 'json'
  }
];

let newsCache = [];
let newsCacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Toggle news widget
if (newsToggle) {
  newsToggle.addEventListener('click', () => {
    const isOpen = newsWidget.classList.contains('open');
    
    if (isOpen) {
      // Closing the widget
      newsWidget.classList.remove('open');
      newsToggle.classList.remove('active');
      localStorage.removeItem('strimly_news_visible');
    } else {
      // Opening the widget
      newsWidget.classList.add('open');
      newsToggle.classList.add('active');
      
      if (newsCache.length === 0) {
        fetchGamingNews();
      }
      
      // Only save preference when opening
      localStorage.setItem('strimly_news_visible', 'true');
    }
  });
}

// Refresh news
if (refreshNewsBtn) {
  refreshNewsBtn.addEventListener('click', () => {
    fetchGamingNews(true);
  });
}

// Load news visibility preference - always start closed
const newsVisible = localStorage.getItem('strimly_news_visible') === 'true';
if (newsWidget) {
  // Always start closed, regardless of previous preference
  newsWidget.classList.remove('open');
  newsToggle.classList.remove('active');
  // Clear the stored preference to ensure it stays closed
  localStorage.removeItem('strimly_news_visible');
}

async function fetchGamingNews(forceRefresh = false) {
  const now = Date.now();
  
  // Use cache if available and not expired
  if (!forceRefresh && newsCache.length > 0 && (now - newsCacheTime) < CACHE_DURATION) {
    displayNews(newsCache);
    return;
  }
  
  // Show loading state
  if (refreshNewsBtn) {
    refreshNewsBtn.classList.add('loading');
  }
  
  // For now, immediately show fallback content since CORS proxies are unreliable
  // In the future, you could implement a server-side solution or use a paid API
  setTimeout(() => {
    displayFallbackNews();
    if (refreshNewsBtn) {
      refreshNewsBtn.classList.remove('loading');
    }
  }, 500); // Small delay to show loading state
}

function displayNews(news) {
  if (!newsContent) return;
  
  if (news.length === 0) {
    newsContent.innerHTML = '<div class="news-error">No news available at the moment.</div>';
    return;
  }
  
  const newsHTML = news.map(item => `
    <div class="news-item" onclick="window.open('${item.link}', '_blank')">
      <div class="news-source">${item.sourceIcon} ${item.source}</div>
      <div class="news-title">${item.title}</div>
      <div class="news-date">${item.pubDate}</div>
    </div>
  `).join('');
  
  newsContent.innerHTML = newsHTML;
}

function displayNewsError(message) {
  if (!newsContent) return;
  newsContent.innerHTML = `<div class="news-error">${message}</div>`;
}

function displayFallbackNews() {
  if (!newsContent) return;
  
  const fallbackNews = [
    {
      title: "Latest Gaming News & Reviews",
      link: "https://www.polygon.com/gaming",
      pubDate: "Updated regularly",
      source: "Polygon",
      sourceIcon: "📰"
    },
    {
      title: "Gaming Culture & Industry News",
      link: "https://kotaku.com",
      pubDate: "Updated regularly", 
      source: "Kotaku",
      sourceIcon: "🎮"
    },
    {
      title: "Game Reviews & Previews",
      link: "https://www.ign.com/games",
      pubDate: "Updated regularly",
      source: "IGN", 
      sourceIcon: "🔥"
    },
    {
      title: "Gaming News & Features",
      link: "https://www.gamespot.com/news/",
      pubDate: "Updated regularly",
      source: "GameSpot",
      sourceIcon: "🎯"
    },
    {
      title: "PC Gaming News",
      link: "https://www.pcgamer.com/news/",
      pubDate: "Updated regularly",
      source: "PC Gamer",
      sourceIcon: "🖥️"
    },
    {
      title: "Esports News & Coverage",
      link: "https://www.eslgaming.com/news",
      pubDate: "Updated regularly",
      source: "ESL Gaming",
      sourceIcon: "🏆"
    }
  ];
  
  const newsHTML = fallbackNews.map(item => `
    <div class="news-item" onclick="window.open('${item.link}', '_blank')">
      <div class="news-source">${item.sourceIcon} ${item.source}</div>
      <div class="news-title">${item.title}</div>
      <div class="news-date">${item.pubDate}</div>
    </div>
  `).join('');
  
  newsContent.innerHTML = `
    <div style="margin-bottom: 1em; padding: 0.8em; background: rgba(46,234,106,0.1); border-radius: 0.5em; border-left: 3px solid #2eea6a; color: #2eea6a; font-size: 0.9em;">
      🎮 Quick access to top gaming news sites
    </div>
    ${newsHTML}
  `;
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    return dateString;
  }
}

// Auto-refresh news every 30 minutes
setInterval(() => {
  if (newsWidget.classList.contains('open')) {
    fetchGamingNews();
  }
}, 30 * 60 * 1000);

// --- Ad Blocker Detection ---
function detectAdBlocker() {
  // Method 1: Check if AdSense script is blocked
  const adsenseScript = document.querySelector('script[src*="googlesyndication"]');
  
  if (!adsenseScript) {
    showAdBlockerWarning();
    return;
  }
  
  // Method 2: Check if adsbygoogle function exists
  if (typeof adsbygoogle === 'undefined') {
    showAdBlockerWarning();
    return;
  }
  
  // Method 3: Create a test ad element and check if it gets blocked
  const testAd = document.createElement('div');
  testAd.className = 'adsbygoogle';
  testAd.style.cssText = 'position:absolute;left:-10000px;width:100px;height:100px;background:red;';
  testAd.setAttribute('data-ad-client', 'ca-pub-4364635918140374');
  testAd.setAttribute('data-ad-slot', 'test-slot');
  testAd.setAttribute('data-ad-format', 'auto');
  testAd.setAttribute('data-full-width-responsive', 'true');
  
  document.body.appendChild(testAd);
  
  // Method 4: Check if common ad blocker selectors are present
  const adBlockerSelectors = [
    '.ad',
    '.ads',
    '.advertisement',
    '[class*="ad-"]',
    '[id*="ad-"]',
    '[class*="ads-"]',
    '[id*="ads-"]'
  ];
  
  adBlockerSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    // Check for ad elements but don't log
  });
  
  // Check if the test ad element is hidden or removed
  setTimeout(() => {
    const isHidden = testAd.offsetHeight === 0 || 
                    testAd.offsetWidth === 0 || 
                    testAd.style.display === 'none' ||
                    testAd.style.visibility === 'hidden' ||
                    window.getComputedStyle(testAd).display === 'none' ||
                    !document.body.contains(testAd);
    
    document.body.removeChild(testAd);
    
    if (isHidden) {
      showAdBlockerWarning();
    }
  }, 200);
}

function showAdBlockerWarning() {
  // Check if user has already dismissed the warning
  const dismissed = localStorage.getItem('strimly_ad_warning_dismissed');
  if (dismissed) {
    return;
  }
  
  const warning = document.getElementById('ad-blocker-warning');
  if (warning) {
    warning.style.display = 'block';
  }
}

// Manual test function - you can call this in console to test
function testAdBlockerDetection() {
  localStorage.removeItem('strimly_ad_warning_dismissed'); // Reset dismissal
  detectAdBlocker();
}

function hideAdBlockerWarning() {
  const warning = document.getElementById('ad-blocker-warning');
  if (warning) {
    warning.style.display = 'none';
    localStorage.setItem('strimly_ad_warning_dismissed', 'true');
  }
}

// Dismiss button functionality
const dismissAdWarning = document.getElementById('dismiss-ad-warning');
if (dismissAdWarning) {
  dismissAdWarning.addEventListener('click', hideAdBlockerWarning);
}

// Run ad blocker detection after page loads
window.addEventListener('load', () => {
  // Run detection immediately and after a delay
  detectAdBlocker();
  setTimeout(detectAdBlocker, 2000);
});

// Also run detection when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  detectAdBlocker();
});
