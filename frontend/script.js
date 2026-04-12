/* =====================================================
   WhyStock AI — script.js
   Dashboard logic: API calls, chart, result rendering
   ===================================================== */

const API_BASE = 'http://127.0.0.1:8000';
let priceChart = null;

// ── DOM refs ─────────────────────────────────────────
const symbolInput   = document.getElementById('symbolInput');
const analyzeBtn    = document.getElementById('analyzeBtn');
const loadingState  = document.getElementById('loadingState');
const loadingSymSel = document.getElementById('loadingSymbol');
const errorState    = document.getElementById('errorState');
const resultSection = document.getElementById('resultSection');
const emptyState    = document.getElementById('emptyState');

// Stock
const stockSymbolEl = document.getElementById('stockSymbol');
const trendBadgeEl  = document.getElementById('trendBadge');
const latestPriceEl = document.getElementById('latestPrice');
const openPriceEl   = document.getElementById('openPrice');
const highPriceEl   = document.getElementById('highPrice');
const lowPriceEl    = document.getElementById('lowPrice');
const volumeEl      = document.getElementById('stockVolume');

// Sentiment
const sentOrbEl       = document.getElementById('sentOrb');
const sentLabelEl     = document.getElementById('sentLabelMain');
const sentScoreEl     = document.getElementById('sentScore');
const scoreTrackFill  = document.getElementById('scoreTrackFill');
const sentDescEl      = document.getElementById('sentDesc');

// Content
const explanationEl = document.getElementById('explanationText');
const newsListEl    = document.getElementById('newsList');
const chartMetaEl   = document.getElementById('chartMeta');

// ── Enter key ───────────────────────────────────────
if (symbolInput) {
  symbolInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') analyzeStock();
  });
}

// ── Analyze ─────────────────────────────────────────
async function analyzeStock() {
  const symbol = symbolInput.value.trim().toUpperCase();

  if (!symbol) {
    shakeElement(symbolInput);
    showToast('Enter a stock symbol first', 'error');
    return;
  }

  setState('loading', symbol);

  try {
    const res = await fetch(`${API_BASE}/analyze/${encodeURIComponent(symbol)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    if (!json || !json.data) throw new Error('Bad response');

    renderAll(json.data, symbol);
    setState('results');
  } catch (err) {
    console.error('[WhyStock]', err);
    setState('error');
  }
}

// ── State ────────────────────────────────────────────
function setState(state, symbol = '') {
  [loadingState, errorState, resultSection, emptyState].forEach(el => {
    if (el) el.classList.add('hidden');
  });

  analyzeBtn.disabled = false;

  switch (state) {
    case 'loading':
      if (loadingSymSel) loadingSymSel.textContent = symbol;
      loadingState.classList.remove('hidden');
      analyzeBtn.disabled = true;
      break;
    case 'error':
      errorState.classList.remove('hidden');
      break;
    case 'results':
      resultSection.classList.remove('hidden');
      // replay animation
      resultSection.style.animation = 'none';
      void resultSection.offsetHeight;
      resultSection.style.animation = '';
      break;
    default:
      if (emptyState) emptyState.classList.remove('hidden');
  }
}

// ── Render all ───────────────────────────────────────
function renderAll(data, symbol) {
  const stock     = data.stock      || data.stock_info  || {};
  const sentiment = data.sentiment  || {};
  const news      = data.news       || [];
  const explain   = data.insights?.explanation || data.explanation || '';

  renderStock(stock, symbol);
  renderSentiment(sentiment);
  renderChart(stock);
  renderExplanation(explain);
  renderNews(news);
}

// ── Stock Info ────────────────────────────────────────
function renderStock(stock, symbol) {
  stockSymbolEl.textContent = stock.symbol || symbol;

  const price = stock.current_price ?? stock.latest_price ?? stock.close ?? stock.price ?? 0;
  latestPriceEl.textContent = fmtPrice(price);

  openPriceEl.textContent   = fmtOptional(stock.open   ?? stock.open_price);
  highPriceEl.textContent   = fmtOptional(stock.high   ?? stock.day_high);
  lowPriceEl.textContent    = fmtOptional(stock.low    ?? stock.day_low);
  volumeEl.textContent      = fmtVolume(stock.volume   ?? stock.avg_volume);

  const trend = detectTrend(stock);
  const trendLabels = { up: '▲ Uptrend', down: '▼ Downtrend', flat: '─ Flat' };
  trendBadgeEl.textContent = trendLabels[trend];
  trendBadgeEl.className   = `trend-badge-db ${trend}`;
}

function detectTrend(stock) {
  const t = (stock.trend || stock.direction || '').toLowerCase();
  if (t.includes('up')   || t === 'bullish') return 'up';
  if (t.includes('down') || t === 'bearish') return 'down';
  const { prices } = extractChartData(stock);
  if (prices.length >= 2) {
    const d = prices[prices.length - 1] - prices[0];
    if (d > 0) return 'up';
    if (d < 0) return 'down';
  }
  return 'flat';
}

// ── Sentiment ─────────────────────────────────────────
function renderSentiment(sentiment) {
  const raw   = (sentiment.label || sentiment.sentiment || 'neutral').toLowerCase();
  const label = raw.includes('pos') ? 'positive' : raw.includes('neg') ? 'negative' : 'neutral';
  const score = sentiment.score ?? sentiment.compound ?? sentiment.confidence ?? 0;
  const pct   = Math.min(Math.abs(score) * 100, 100);

  sentLabelEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  sentScoreEl.textContent = `Score: ${typeof score === 'number' ? score.toFixed(4) : score}`;

  const descs = {
    positive: 'Markets are leaning bullish. News and momentum signals appear favorable.',
    negative: 'Bearish signals detected. Negative press and selling pressure noted.',
    neutral:  'Mixed signals. Market sentiment is neither strongly bullish nor bearish.',
  };
  sentDescEl.textContent = descs[label];

  // Orb
  sentOrbEl.className = `sent-orb ${label}`;

  // Detect sibling label color via CSS class on wrapper
  sentLabelEl.style.color = label === 'positive' ? 'var(--green)'
                          : label === 'negative' ? 'var(--red)'
                          : 'var(--t-mid)';

  // Bar
  scoreTrackFill.className = `score-track-fill ${label}`;
  requestAnimationFrame(() => {
    setTimeout(() => { scoreTrackFill.style.width = `${pct}%`; }, 80);
  });
}

// ── Chart ─────────────────────────────────────────────
function renderChart(stock) {
  const canvas = document.getElementById('priceChart');
  if (!canvas) return;

  if (priceChart) { priceChart.destroy(); priceChart = null; }

  const { labels, prices } = extractChartData(stock);
  if (!prices.length) return;

  const isUp = prices[prices.length - 1] >= prices[0];
  const lineColor = isUp ? '#00e5a0' : '#ff3b6b';
  const fillHi    = isUp ? 'rgba(0,229,160,0.15)' : 'rgba(255,59,107,0.15)';

  if (chartMetaEl) {
    const change = prices[prices.length - 1] - prices[0];
    const pct    = ((change / prices[0]) * 100).toFixed(2);
    chartMetaEl.textContent = `${isUp ? '+' : ''}${pct}% over period`;
    chartMetaEl.style.color = isUp ? 'var(--green)' : 'var(--red)';
  }

  priceChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Price',
        data: prices,
        borderColor: lineColor,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: lineColor,
        tension: 0.4,
        fill: true,
        backgroundColor: (ctx) => {
          const { chartArea, ctx: c } = ctx.chart;
          if (!chartArea) return fillHi;
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, fillHi);
          g.addColorStop(1, 'rgba(5,8,16,0)');
          return g;
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0c1220',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#7a8599',
          bodyColor: '#f0f4ff',
          padding: 12,
          callbacks: {
            label: ctx => `  ₹ ${Number(ctx.raw).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: { color: '#323d52', font: { family: "'Fira Code'", size: 9 }, maxTicksLimit: 7, maxRotation: 0 }
        },
        y: {
          position: 'right',
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: {
            color: '#323d52',
            font: { family: "'Fira Code'", size: 9 },
            callback: v => '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })
          }
        }
      }
    }
  });
}

function extractChartData(stock) {
  if (stock.history && Array.isArray(stock.history)) {
    return {
      labels: stock.history.map(h => h.date || h.timestamp || ''),
      prices: stock.history.map(h => h.close || h.price || h.value || 0)
    };
  }
  if (stock.dates && stock.prices) return { labels: stock.dates, prices: stock.prices };
  if (stock.price_history) {
    const keys = Object.keys(stock.price_history).sort();
    return { labels: keys, prices: keys.map(k => stock.price_history[k]) };
  }
  const p = stock.current_price ?? stock.latest_price ?? stock.close ?? 0;
  return { labels: ['Latest'], prices: [p] };
}

// ── Explanation ───────────────────────────────────────
function renderExplanation(text) {
  const container = document.getElementById('explanationText');
  if (!container) return;
  container.innerHTML = '';

  if (!text || !text.trim()) {
    container.innerHTML = `
      <div class="expl-empty">
        <span class="expl-empty-icon">🧠</span>
        <span>No explanation available for this stock at the moment.</span>
      </div>`;
    return;
  }

  const points = parseExplanationPoints(text);

  if (points.length === 0) {
    container.innerHTML = `<div class="expl-point"><p class="expl-point-text">${esc(text.trim())}</p></div>`;
    return;
  }

  // Icon pool cycling through meaningful fintech icons
  const icons = ['◎', '◈', '▸', '◆', '⬡', '◉', '▦', '◐'];

  points.forEach((point, i) => {
    const div = document.createElement('div');
    div.className = 'expl-point';
    div.style.animationDelay = `${i * 0.07}s`;

    div.innerHTML = `
      <div class="expl-point-icon">${icons[i % icons.length]}</div>
      <div class="expl-point-body">
        ${point.heading ? `<p class="expl-point-heading">${esc(point.heading)}</p>` : ''}
        <p class="expl-point-text">${esc(point.body)}</p>
      </div>`;

    container.appendChild(div);
  });
}

/**
 * Parses raw AI text into structured point objects.
 * Handles:
 *   - Numbered lists:   "1. Some text"  "1) Some text"
 *   - Bullet lists:     "• text"  "- text"  "* text"
 *   - Bold headings:    "**Heading:** body text"
 *   - Plain paragraphs: split on double newlines
 */
function parseExplanationPoints(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const points = [];

  // Check if text is clearly a numbered / bulleted list
  const listPattern = /^(\d+[.)]\s+|[-•*]\s+)/;
  const isListFormat = lines.some(l => listPattern.test(l));

  if (isListFormat) {
    let buffer = [];

    lines.forEach(line => {
      if (listPattern.test(line)) {
        if (buffer.length) {
          points.push(buildPoint(buffer.join(' ')));
          buffer = [];
        }
        // Strip the list marker
        buffer.push(line.replace(/^(\d+[.)]\s+|[-•*]\s+)/, '').trim());
      } else {
        // Continuation of previous point
        buffer.push(line);
      }
    });

    if (buffer.length) points.push(buildPoint(buffer.join(' ')));

  } else {
    // Paragraph format: split on blank-line boundaries
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

    if (paragraphs.length > 1) {
      paragraphs.forEach(p => points.push(buildPoint(p.replace(/\n/g, ' '))));
    } else {
      // Single block — try splitting on sentence boundaries (. followed by capital)
      const sentences = text
        .split(/(?<=[.!?])\s+(?=[A-Z])/)
        .map(s => s.trim())
        .filter(s => s.length > 20); // skip tiny fragments

      if (sentences.length > 1) {
        sentences.forEach(s => points.push(buildPoint(s)));
      } else {
        // Fall back: one single point
        points.push(buildPoint(text.trim()));
      }
    }
  }

  return points;
}

/**
 * Given a raw string, extract an optional bold heading and the body.
 * "**Heading:** rest of text"  →  { heading: 'Heading', body: 'rest of text' }
 */
function buildPoint(raw) {
  // Match **Heading:** or *Heading:* patterns
  const headingMatch = raw.match(/^\*{1,2}([^*:]+)[:]\*{0,2}\s*(.*)/s);
  if (headingMatch) {
    return {
      heading: headingMatch[1].trim(),
      body: headingMatch[2].trim() || headingMatch[1].trim(),
    };
  }

  // Match "Heading: body" only if heading is short (≤ 5 words)
  const colonMatch = raw.match(/^([^:]{3,40}):\s+(.+)/s);
  if (colonMatch && colonMatch[1].trim().split(/\s+/).length <= 5) {
    return {
      heading: colonMatch[1].trim(),
      body: colonMatch[2].trim(),
    };
  }

  return { heading: null, body: raw };
}

// ── News ──────────────────────────────────────────────
function renderNews(newsArr) {
  newsListEl.innerHTML = '';

  if (!newsArr.length) {
    newsListEl.innerHTML = '<li style="color:var(--t-lo);font-size:0.8rem;padding:12px 0;">No recent news found.</li>';
    return;
  }

  newsArr.slice(0, 5).forEach((article, i) => {
    const title = esc(article.title || article.headline || 'Untitled');
    const desc  = esc(article.description || article.summary || article.content || '');
    const url   = esc(article.url || article.link || '#');
    const src   = esc(article.source || article.publisher || '');

    const li = document.createElement('li');
    li.className = 'news-item-db';
    li.innerHTML = `
      <span class="news-num-db">0${i + 1}</span>
      <div class="news-content-db">
        <a class="news-title-db" href="${url}" target="_blank" rel="noopener noreferrer">
          ${title} <span style="opacity:0.45;font-size:0.8em">↗</span>
        </a>
        ${desc ? `<p class="news-desc-db">${desc}</p>` : ''}
        ${src  ? `<span class="news-source-db">${src}</span>` : ''}
      </div>`;
    newsListEl.appendChild(li);
  });
}

// ── Helpers ───────────────────────────────────────────
function fmtPrice(val) {
  const n = Number(val);
  if (isNaN(n) || val === null || val === undefined) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtOptional(val) {
  if (val === null || val === undefined || val === '') return '—';
  const n = Number(val);
  return isNaN(n) ? String(val) : fmtPrice(n);
}

function fmtVolume(val) {
  if (!val) return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString('en-IN');
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function shakeElement(el) {
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
  el.style.borderColor = 'var(--red)';
  el.style.boxShadow = '0 0 0 3px var(--red-dim)';
  setTimeout(() => {
    el.style.animation  = '';
    el.style.borderColor = '';
    el.style.boxShadow  = '';
  }, 700);
}

function showToast(msg, type = 'info') {
  const colors = { error: '#ff3b6b', success: '#00e5a0', info: '#4f8fff' };
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:#080c18; border:1px solid ${colors[type]}40;
    color:${colors[type]}; font-family:'Cabinet Grotesk',sans-serif;
    font-size:0.82rem; padding:11px 20px; border-radius:10px;
    z-index:9999; animation:fadeUp 0.3s ease both;
    box-shadow:0 8px 32px rgba(0,0,0,0.6);
    backdrop-filter:blur(12px);
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; }, 2700);
  setTimeout(() => toast.remove(), 3100);
}

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (emptyState) emptyState.classList.remove('hidden');
});


/* =====================================================
   WhyStock AI — EXTENSIONS
   Watchlist · Portfolio · Alerts · Navigation
   ===================================================== */

// ── Storage Keys ──────────────────────────────────────
const SK = {
  WATCHLIST: 'ws_watchlist',
  PORTFOLIO: 'ws_portfolio',
  ALERTS:    'ws_alerts',
};

// ── Active page tracking ──────────────────────────────
let currentPage = 'dashboard';
let currentSymbol = '';        // last analyzed symbol
let alertInterval = null;

// ═══════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════

function navigateTo(page) {
  const pages = ['dashboard', 'watchlist', 'portfolio', 'alerts'];

  // Update section visibility
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.classList.toggle('hidden', p !== page);
  });

  // Update nav active states
  pages.forEach(p => {
    const nav = document.getElementById(`nav-${p}`);
    if (nav) nav.classList.toggle('active', p === page);
  });

  currentPage = page;

  // Update topbar title for mobile (sidebar hidden on mobile)
  const titles = {
    dashboard: 'Market Intelligence',
    watchlist: 'Watchlist',
    portfolio: 'Portfolio',
    alerts:    'Price Alerts',
  };
  const el = document.querySelector('.topbar-title');
  if (el) el.textContent = titles[page] || 'WhyStock AI';

  // Refresh content
  if (page === 'watchlist') renderWatchlist();
  if (page === 'portfolio') renderPortfolio();
  if (page === 'alerts')    renderAlerts();
}

// ═══════════════════════════════════════════════════════
// WATCHLIST
// ═══════════════════════════════════════════════════════

function getWatchlist() {
  try { return JSON.parse(localStorage.getItem(SK.WATCHLIST) || '[]'); }
  catch { return []; }
}

function saveWatchlist(list) {
  localStorage.setItem(SK.WATCHLIST, JSON.stringify(list));
  updateNavBadges();
}

function addToWatchlist(symbol) {
  const sym = symbol.trim().toUpperCase();
  if (!sym) return false;
  const list = getWatchlist();
  if (list.includes(sym)) return false;
  list.push(sym);
  saveWatchlist(list);
  return true;
}

function removeFromWatchlist(symbol) {
  const list = getWatchlist().filter(s => s !== symbol);
  saveWatchlist(list);
  renderWatchlist();
  updateWatchlistBtn(symbol);
}

function isInWatchlist(symbol) {
  return getWatchlist().includes(symbol);
}

// Button on stock card
function toggleWatchlistCurrent() {
  if (!currentSymbol) return;
  if (isInWatchlist(currentSymbol)) {
    removeFromWatchlist(currentSymbol);
    showToast(`${currentSymbol} removed from watchlist`, 'info');
  } else {
    addToWatchlist(currentSymbol);
    showToast(`${currentSymbol} added to watchlist ◈`, 'success');
  }
  updateWatchlistBtn(currentSymbol);
}

function updateWatchlistBtn(symbol) {
  const btn   = document.getElementById('watchlistBtn');
  const label = document.getElementById('watchlistBtnLabel');
  if (!btn || !label) return;
  const inList = isInWatchlist(symbol);
  label.textContent = inList ? '✓ In Watchlist' : '+ Watchlist';
  btn.classList.toggle('btn-action-active', inList);
}

// Manual add from watchlist page input
function addToWatchlistManual() {
  const input = document.getElementById('wlInput');
  if (!input) return;
  const sym = input.value.trim().toUpperCase();
  if (!sym) { shakeElement(input); return; }
  if (addToWatchlist(sym)) {
    input.value = '';
    renderWatchlist();
    showToast(`${sym} added to watchlist`, 'success');
  } else {
    showToast(`${sym} is already in your watchlist`, 'info');
    shakeElement(input);
  }
}

function renderWatchlist() {
  const list    = getWatchlist();
  const grid    = document.getElementById('wlGrid');
  const empty   = document.getElementById('wlEmpty');
  if (!grid || !empty) return;

  if (!list.length) {
    empty.classList.remove('hidden');
    grid.innerHTML = '';
    return;
  }
  empty.classList.add('hidden');
  grid.innerHTML = '';

  list.forEach(sym => {
    const card = document.createElement('div');
    card.className = 'glass-card wl-card';
    card.innerHTML = `
      <div class="wl-card-top">
        <div class="wl-sym">${esc(sym)}</div>
        <button class="wl-remove-btn" onclick="removeFromWatchlist('${esc(sym)}')" title="Remove">✕</button>
      </div>
      <div class="wl-price-row">
        <span class="wl-price" id="wlPrice-${esc(sym)}">—</span>
        <span class="wl-change" id="wlChange-${esc(sym)}">fetching…</span>
      </div>
      <button class="btn-analyze-db wl-analyze-btn" onclick="wlAnalyze('${esc(sym)}')">
        Analyze <span>→</span>
      </button>`;
    grid.appendChild(card);
    fetchWatchlistPrice(sym);
  });
}

async function fetchWatchlistPrice(sym) {
  try {
    const res = await fetch(`${API_BASE}/analyze/${encodeURIComponent(sym)}`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    const stock = json.data?.stock || json.data?.stock_info || {};
    const price = stock.current_price ?? stock.latest_price ?? stock.close ?? stock.price;
    const priceEl  = document.getElementById(`wlPrice-${sym}`);
    const changeEl = document.getElementById(`wlChange-${sym}`);
    if (priceEl && price != null) {
      priceEl.textContent = '₹' + fmtPrice(price);
    }
    if (changeEl) {
      // compute change if history available
      const { prices } = extractChartData(stock);
      if (prices.length >= 2) {
        const chg = prices[prices.length - 1] - prices[0];
        const pct = ((chg / prices[0]) * 100).toFixed(2);
        const up = chg >= 0;
        changeEl.textContent = `${up ? '▲' : '▼'} ${up ? '+' : ''}${pct}%`;
        changeEl.style.color = up ? 'var(--green)' : 'var(--red)';
      } else {
        changeEl.textContent = '';
      }
    }
  } catch {
    const el = document.getElementById(`wlChange-${sym}`);
    if (el) { el.textContent = 'unavailable'; el.style.color = 'var(--t-lo)'; }
  }
}

function wlAnalyze(sym) {
  navigateTo('dashboard');
  document.getElementById('symbolInput').value = sym;
  analyzeStock();
}

// Add watchlist input enter key
document.addEventListener('DOMContentLoaded', () => {
  const wlIn = document.getElementById('wlInput');
  if (wlIn) wlIn.addEventListener('keydown', e => { if (e.key === 'Enter') addToWatchlistManual(); });
});

// ═══════════════════════════════════════════════════════
// PORTFOLIO
// ═══════════════════════════════════════════════════════

function getPortfolio() {
  try { return JSON.parse(localStorage.getItem(SK.PORTFOLIO) || '[]'); }
  catch { return []; }
}

function savePortfolio(list) {
  localStorage.setItem(SK.PORTFOLIO, JSON.stringify(list));
  updateNavBadges();
}

function openPortfolioModal() {
  // Pre-fill symbol if we're on a stock result
  const symInput = document.getElementById('pfSymInput');
  if (symInput && currentSymbol) symInput.value = currentSymbol;
  document.getElementById('pfModalErr')?.classList.add('hidden');
  document.getElementById('portfolioModal')?.classList.remove('hidden');
}

function addPortfolioHolding() {
  const sym = document.getElementById('pfSymInput')?.value.trim().toUpperCase();
  const qty = parseFloat(document.getElementById('pfQtyInput')?.value);
  const buy = parseFloat(document.getElementById('pfBuyInput')?.value);
  const errEl = document.getElementById('pfModalErr');

  if (!sym || isNaN(qty) || qty <= 0 || isNaN(buy) || buy <= 0) {
    if (errEl) errEl.classList.remove('hidden');
    return;
  }

  const portfolio = getPortfolio();
  portfolio.push({ sym, qty, buy, addedAt: Date.now() });
  savePortfolio(portfolio);
  closeModal('portfolioModal');

  // Clear inputs
  ['pfSymInput','pfQtyInput','pfBuyInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  showToast(`${sym} added to portfolio ▦`, 'success');
  if (currentPage === 'portfolio') renderPortfolio();
}

function removePortfolioHolding(idx) {
  const portfolio = getPortfolio();
  portfolio.splice(idx, 1);
  savePortfolio(portfolio);
  renderPortfolio();
  showToast('Holding removed', 'info');
}

async function renderPortfolio() {
  const portfolio = getPortfolio();
  const empty   = document.getElementById('pfEmpty');
  const tableWrap = document.getElementById('pfTable');
  const tbody   = document.getElementById('pfTbody');
  const summary = document.getElementById('pfSummary');
  if (!empty || !tableWrap || !tbody) return;

  if (!portfolio.length) {
    empty.classList.remove('hidden');
    tableWrap.classList.add('hidden');
    summary.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  tableWrap.classList.remove('hidden');
  summary.classList.remove('hidden');

  // Render rows with loading state first
  tbody.innerHTML = portfolio.map((h, i) => `
    <tr id="pfRow-${i}">
      <td><span class="pf-sym-cell">${esc(h.sym)}</span></td>
      <td class="pf-num">${h.qty}</td>
      <td class="pf-num">₹${fmtPrice(h.buy)}</td>
      <td class="pf-num pf-curr" id="pfCurr-${i}"><span class="pf-loading">…</span></td>
      <td class="pf-num">₹${fmtPrice(h.qty * h.buy)}</td>
      <td class="pf-num pf-val" id="pfVal-${i}">—</td>
      <td class="pf-num pf-pl" id="pfPL-${i}">—</td>
      <td class="pf-num pf-ret" id="pfRet-${i}">—</td>
      <td><button class="pf-del-btn" onclick="removePortfolioHolding(${i})">✕</button></td>
    </tr>`).join('');

  // Fetch current prices
  let totalInvested = 0, totalCurrent = 0;
  const fetches = portfolio.map(async (h, i) => {
    totalInvested += h.qty * h.buy;
    try {
      const res = await fetch(`${API_BASE}/analyze/${encodeURIComponent(h.sym)}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const stock = json.data?.stock || json.data?.stock_info || {};
      const curr  = stock.current_price ?? stock.latest_price ?? stock.close ?? stock.price ?? null;
      if (curr == null) throw new Error();

      const value = h.qty * curr;
      const pl    = value - h.qty * h.buy;
      const ret   = ((pl / (h.qty * h.buy)) * 100).toFixed(2);
      const up    = pl >= 0;
      totalCurrent += value;

      setCell(`pfCurr-${i}`, `₹${fmtPrice(curr)}`);
      setCell(`pfVal-${i}`,  `₹${fmtPrice(value)}`);
      setCell(`pfPL-${i}`,   `${up ? '+' : ''}₹${fmtPrice(pl)}`, up ? 'var(--green)' : 'var(--red)');
      setCell(`pfRet-${i}`,  `${up ? '+' : ''}${ret}%`,           up ? 'var(--green)' : 'var(--red)');
    } catch {
      setCell(`pfCurr-${i}`, 'N/A', 'var(--t-lo)');
      setCell(`pfPL-${i}`,   '—',   'var(--t-lo)');
      setCell(`pfRet-${i}`,  '—',   'var(--t-lo)');
    }
  });

  await Promise.all(fetches);

  // Update summary
  const totalPL  = totalCurrent - totalInvested;
  const totalRet = totalInvested ? ((totalPL / totalInvested) * 100).toFixed(2) : 0;
  const up = totalPL >= 0;

  setText('pfTotalInvested', `₹${fmtPrice(totalInvested)}`);
  setText('pfCurrentValue',  `₹${fmtPrice(totalCurrent)}`);
  setCell('pfTotalPL',  `${up ? '+' : ''}₹${fmtPrice(totalPL)}`,  up ? 'var(--green)' : 'var(--red)');
  setCell('pfTotalPct', `${up ? '+' : ''}${totalRet}%`,            up ? 'var(--green)' : 'var(--red)');
}

function setCell(id, text, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  if (color) el.style.color = color;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ═══════════════════════════════════════════════════════
// ALERTS
// ═══════════════════════════════════════════════════════

function getAlerts() {
  try { return JSON.parse(localStorage.getItem(SK.ALERTS) || '[]'); }
  catch { return []; }
}

function saveAlerts(list) {
  localStorage.setItem(SK.ALERTS, JSON.stringify(list));
  updateNavBadges();
}

function openAlertModal() {
  const symInput = document.getElementById('alSymInput');
  if (symInput && currentSymbol) symInput.value = currentSymbol;
  document.getElementById('alModalErr')?.classList.add('hidden');
  document.getElementById('alertModal')?.classList.remove('hidden');
}

function addAlert() {
  const sym   = document.getElementById('alSymInput')?.value.trim().toUpperCase();
  const cond  = document.getElementById('alCondInput')?.value;
  const price = parseFloat(document.getElementById('alPriceInput')?.value);
  const errEl = document.getElementById('alModalErr');

  if (!sym || isNaN(price) || price <= 0) {
    if (errEl) errEl.classList.remove('hidden');
    return;
  }

  const alerts = getAlerts();
  alerts.push({ sym, cond, price, triggered: false, createdAt: Date.now(), id: Date.now() });
  saveAlerts(alerts);
  closeModal('alertModal');

  ['alSymInput','alPriceInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  showToast(`Alert set for ${sym} ${cond} ₹${price}`, 'success');
  requestNotificationPermission();
  if (currentPage === 'alerts') renderAlerts();
}

function removeAlert(id) {
  const alerts = getAlerts().filter(a => a.id !== id);
  saveAlerts(alerts);
  renderAlerts();
  showToast('Alert removed', 'info');
}

function renderAlerts() {
  const alerts  = getAlerts();
  const listEl  = document.getElementById('alList');
  const emptyEl = document.getElementById('alEmpty');
  if (!listEl || !emptyEl) return;

  if (!alerts.length) {
    emptyEl.classList.remove('hidden');
    listEl.innerHTML = '';
    return;
  }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = '';

  alerts.forEach(a => {
    const card = document.createElement('div');
    card.className = `glass-card al-card ${a.triggered ? 'al-triggered' : ''}`;
    const condLabel = a.cond === 'above' ? 'rises above' : 'falls below';
    const statusLabel = a.triggered ? '✓ Triggered' : '⏳ Watching';
    const statusColor = a.triggered ? 'var(--green)' : 'var(--t-mid)';

    card.innerHTML = `
      <div class="al-card-left">
        <div class="al-sym">${esc(a.sym)}</div>
        <div class="al-condition">When price <strong>${condLabel}</strong> ₹${fmtPrice(a.price)}</div>
        <div class="al-created">Added ${new Date(a.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
      </div>
      <div class="al-card-right">
        <span class="al-status" style="color:${statusColor}">${statusLabel}</span>
        <span class="al-curr-price" id="alCurr-${a.id}">fetching…</span>
        <button class="pf-del-btn" onclick="removeAlert(${a.id})">✕</button>
      </div>`;
    listEl.appendChild(card);
    fetchAlertCurrentPrice(a.sym, a.id);
  });
}

async function fetchAlertCurrentPrice(sym, id) {
  try {
    const res = await fetch(`${API_BASE}/analyze/${encodeURIComponent(sym)}`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    const stock = json.data?.stock || json.data?.stock_info || {};
    const price = stock.current_price ?? stock.latest_price ?? stock.close ?? stock.price;
    const el = document.getElementById(`alCurr-${id}`);
    if (el && price != null) el.textContent = `Current: ₹${fmtPrice(price)}`;
  } catch {
    const el = document.getElementById(`alCurr-${id}`);
    if (el) el.textContent = '';
  }
}

// Alert polling
function startAlertPolling() {
  if (alertInterval) clearInterval(alertInterval);
  alertInterval = setInterval(checkAlerts, 60000);
  checkAlerts(); // immediate first check
}

async function checkAlerts() {
  const alerts = getAlerts();
  if (!alerts.length) return;

  let changed = false;
  for (const alert of alerts) {
    if (alert.triggered) continue;
    try {
      const res = await fetch(`${API_BASE}/analyze/${encodeURIComponent(alert.sym)}`);
      if (!res.ok) continue;
      const json = await res.json();
      const stock = json.data?.stock || json.data?.stock_info || {};
      const price = stock.current_price ?? stock.latest_price ?? stock.close ?? stock.price;
      if (price == null) continue;

      const hit = alert.cond === 'above' ? price >= alert.price
                                         : price <= alert.price;
      if (hit) {
        alert.triggered = true;
        changed = true;
        fireAlert(alert, price);
      }
    } catch { /* ignore */ }
  }

  if (changed) {
    saveAlerts(alerts);
    if (currentPage === 'alerts') renderAlerts();
  }
}

function fireAlert(alert, currentPrice) {
  const condLabel = alert.cond === 'above' ? 'risen above' : 'fallen below';
  const msg = `🔔 ${alert.sym} has ${condLabel} ₹${fmtPrice(alert.price)}. Current: ₹${fmtPrice(currentPrice)}`;
  showToast(msg, 'success');

  if (Notification.permission === 'granted') {
    new Notification('WhyStock AI Alert', {
      body: msg,
      icon: 'https://via.placeholder.com/48/00e5a0/020f08?text=W',
    });
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ═══════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function closeModalBackdrop(event, id) {
  if (event.target.id === id) closeModal(id);
}

// ESC key closes modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['portfolioModal','alertModal'].forEach(closeModal);
  }
});

// ═══════════════════════════════════════════════════════
// NAV BADGES  (live counts)
// ═══════════════════════════════════════════════════════

function updateNavBadges() {
  const wl = getWatchlist().length;
  const pf = getPortfolio().length;
  const al = getAlerts().filter(a => !a.triggered).length;

  setBadge('watchlistCountBadge', wl);
  setBadge('portfolioCountBadge', pf);
  setBadge('alertsCountBadge',    al);
}

function setBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  if (count > 0) {
    el.textContent = count;
    el.style.display = 'inline-flex';
  } else {
    el.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════
// HOOK INTO EXISTING analyzeStock / renderAll
// ═══════════════════════════════════════════════════════

// Patch renderAll to track current symbol and update watchlist button
const _origRenderAll = renderAll;
window.renderAll = function(data, symbol) {
  currentSymbol = symbol;
  _origRenderAll(data, symbol);
  updateWatchlistBtn(symbol);
};

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  updateNavBadges();
  startAlertPolling();
  // Ensure dashboard is shown by default
  navigateTo('dashboard');
});