// ============================================================
//  APP.JS — FC Colla · Router, State & Init
// ============================================================

const STORAGE_KEY = 'fc-colla-state-v1';

// ---- Global State ----
window.APP_STATE = {
  currentPage: 'home',
  players: [],
  matches: [],
  customCalendar: [],     // [ { jornada, date, rival, matchId, time, location, notes }, ... ]
  customFormations: {},   // { name: [ {pos, x, y, label}, ... ] }
  lineupProposals: {},    // { [jornadaId]: { [userId]: { teamA: {formation, positions}, teamB: {formation, positions} } } }
  partitsTab: 'historial',
  historialFilters: { rival: '', dateFrom: '', dateTo: '', result: 'all' },
  comparison: { player1: 1, player2: 2 },
  perfilSearch: '',
  perfilSort: 'elo',
  lang: 'ca',             // Localization ('ca', 'es', 'en')
  currentUserId: null,    // Logged player ID or 'guest' or null
};


// ---- Persistence ----
function saveState(state) {
  try {
    const toSave = {
      players: state.players,
      matches: state.matches,
      customCalendar: state.customCalendar || [],
      customFormations: state.customFormations || {},
      lineupProposals: state.lineupProposals || {},
      activeLineupJornada: state.activeLineupJornada || null,
      lang: state.lang || 'ca',
      currentUserId: state.currentUserId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Could not save state:', e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        players: parsed.players || DEFAULT_PLAYERS,
        matches: parsed.matches || DEFAULT_MATCHES,
        customCalendar: parsed.customCalendar || [],
        customFormations: parsed.customFormations || {},
        lineupProposals: parsed.lineupProposals || {},
        activeLineupJornada: parsed.activeLineupJornada || null,
        lang: parsed.lang || 'ca',
        currentUserId: parsed.currentUserId !== undefined ? parsed.currentUserId : null,
      };
    }
  } catch (e) {
    console.warn('Could not load state:', e);
  }
  return {
    players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS)),
    matches: JSON.parse(JSON.stringify(DEFAULT_MATCHES)),
    customCalendar: [],
    customFormations: {},
    lineupProposals: {},
    activeLineupJornada: null,
    lang: 'ca',
    currentUserId: null,
  };
}

// ---- Dynamic Header Update ----
function updateHeader(page, state) {
  const titleEl = document.getElementById('app-title');
  const badgeEl = document.getElementById('header-badge');
  const userStatusEl = document.getElementById('header-user-status');
  if (!titleEl) return;

  if (badgeEl) {
    badgeEl.className = 'header-badge';
  }

  switch (page) {
    case 'home':
      titleEl.textContent = 'FC😎';
      if (badgeEl) { badgeEl.textContent = `${t('season')} 26`; badgeEl.classList.add('badge-neon'); }
      break;
    case 'stats':
      titleEl.textContent = t('stats_title');
      if (badgeEl) { badgeEl.textContent = 'ELO · Gols'; badgeEl.classList.add('badge-cyan'); }
      break;
    case 'partits':
      titleEl.textContent = t('matches_title');
      if (badgeEl) { badgeEl.textContent = `${state.matches.length} ${t('played')}`; badgeEl.classList.add('badge-orange'); }
      break;
    case 'perfil':
      titleEl.textContent = t('players_title');
      if (badgeEl) { badgeEl.textContent = `${state.players.length} ${t('players_count')}`; badgeEl.classList.add('badge-gold'); }
      break;
  }

  // Update active user status in header
  if (userStatusEl) {
    if (state.currentUserId) {
      if (state.currentUserId === 'guest') {
        userStatusEl.innerHTML = `
          <div class="header-user-pill" style="cursor: default;">
            <div class="header-user-avatar">👤</div>
            <div class="header-user-info">
              <span class="header-user-name">${t('guest_short') || 'Convidat'}</span>
            </div>
          </div>
        `;
      } else {
        const player = state.players.find(p => p.id === state.currentUserId);
        if (player) {
          userStatusEl.innerHTML = `
            <div class="header-user-pill" id="header-user-pill-btn" role="button" tabindex="0" aria-label="Veure el meu perfil">
              <div class="header-user-avatar">
                ${player.photo ? `<img src="${player.photo}">` : player.emoji}
              </div>
              <div class="header-user-info">
                <span class="header-user-name">${player.name}</span>
                <span class="header-user-elo">${player.elo} ELO</span>
              </div>
            </div>
          `;
          const btn = document.getElementById('header-user-pill-btn');
          if (btn) {
            btn.addEventListener('click', () => {
              if (typeof openPlayerModal === 'function') {
                openPlayerModal(player, state.players, state.matches);
              }
            });
          }
        } else {
          userStatusEl.innerHTML = '';
        }
      }
    } else {
      userStatusEl.innerHTML = '';
    }
  }
}

// ---- Static Elements Translation ----
function translateStaticElements() {
  const homeNav = document.querySelector('#nav-home span');
  const statsNav = document.querySelector('#nav-stats span');
  const partitsNav = document.querySelector('#nav-partits span');
  const perfilNav = document.querySelector('#nav-perfil span');

  if (homeNav) homeNav.textContent = t('nav_home');
  if (statsNav) statsNav.textContent = t('nav_stats');
  if (partitsNav) partitsNav.textContent = t('nav_partits');
  if (perfilNav) perfilNav.textContent = t('nav_players');

  updateHeader(window.APP_STATE.currentPage, window.APP_STATE);
}

// ---- Theme Management ----
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('fc-theme', theme);
}

function loadTheme() {
  const saved = localStorage.getItem('fc-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  return saved;
}

// ---- Settings Modal ----
function openSettingsModal() {
  const state = window.APP_STATE;
  const currentTheme = localStorage.getItem('fc-theme') || 'dark';
  const isLight = currentTheme === 'light';

  const content = `
    <div class="modal-header">
      <div class="modal-title">⚙️ ${t('settings_title')}</div>
      <button class="modal-close" id="modal-close-btn" aria-label="${t('close')}">✕</button>
    </div>
    <div class="modal-body settings-modal-body">

      <!-- Theme Toggle -->
      <div class="settings-section">
        <h3>🎨 ${t('settings_appearance')}</h3>
        <div class="theme-toggle-row">
          <span class="theme-toggle-label">
            <span class="theme-icon">${isLight ? '☀️' : '🌙'}</span>
            ${isLight ? t('settings_mode_light') : t('settings_mode_dark')}
          </span>
          <label class="theme-switch" aria-label="Toggle theme">
            <input type="checkbox" id="theme-toggle-checkbox" ${isLight ? 'checked' : ''}>
            <span class="theme-switch-track"></span>
          </label>
        </div>
      </div>

      <!-- Language Selection -->
      <div class="settings-section">
        <h3>🌐 ${t('select_lang')}</h3>
        <div class="lang-selector-group" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
          <button class="lang-btn ${state.lang === 'ca' ? 'active' : ''}" data-lang="ca">Català</button>
          <button class="lang-btn ${state.lang === 'es' ? 'active' : ''}" data-lang="es">Español</button>
        </div>
      </div>

      <!-- Logout -->
      <div class="settings-section">
        <button class="settings-action-btn btn-danger" id="btn-logout">
          🚪 ${t('login_logout')}
        </button>
      </div>

    </div>
  `;

  openModal(content);

  // Theme toggle
  const themeCheckbox = document.getElementById('theme-toggle-checkbox');
  if (themeCheckbox) {
    themeCheckbox.addEventListener('change', () => {
      const newTheme = themeCheckbox.checked ? 'light' : 'dark';
      applyTheme(newTheme);
      // Re-render modal to update icon/label
      openSettingsModal();
    });
  }

  // Bind Language buttons
  document.querySelectorAll('.lang-selector-group .lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedLang = btn.dataset.lang;
      state.lang = selectedLang;
      saveState(state);

      // Re-render modal to update translation immediately!
      openSettingsModal();

      // Update all UI translations
      translateStaticElements();
      renderPage(state.currentPage, state);
    });
  });

  // Log Out
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      state.currentUserId = null;
      saveState(state);
      closeModal();
      navigate('login');
    });
  }
}


// ---- Modal System ----
function openModal(htmlContent) {
  const overlay   = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  const content   = document.getElementById('modal-content');

  content.innerHTML = htmlContent;
  overlay.removeAttribute('aria-hidden');
  container.removeAttribute('aria-hidden');

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
    container.classList.add('visible');
  });

  // Close button
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Click overlay to close
  overlay.onclick = closeModal;

  // Trap focus: close on Escape
  document.addEventListener('keydown', handleModalKey, { once: true });
}

function closeModal() {
  const overlay   = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');

  overlay.classList.remove('visible');
  container.classList.remove('visible');

  overlay.setAttribute('aria-hidden', 'true');
  container.setAttribute('aria-hidden', 'true');

  // Clear content after animation
  setTimeout(() => {
    const content = document.getElementById('modal-content');
    if (content) content.innerHTML = '';
  }, 350);
}

function handleModalKey(e) {
  if (e.key === 'Escape') closeModal();
}

// ---- Toast ----
function showToast(message, duration = 2800) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), duration);
}

// ---- Router ----
function navigate(page) {
  const state = window.APP_STATE;
  if (state.currentPage === page) return;

  // Hide current page
  const currentEl = document.getElementById(`page-${state.currentPage}`);
  if (currentEl) currentEl.classList.remove('active');

  // Show/Hide app navigation shell for login
  const isLogin = page === 'login';
  const header = document.querySelector('.app-header');
  const bottomNav = document.getElementById('bottom-nav');
  if (header) header.style.display = isLogin ? 'none' : 'flex';
  if (bottomNav) bottomNav.style.display = isLogin ? 'none' : 'flex';
  
  const appEl = document.getElementById('app');
  if (appEl) {
    appEl.style.paddingTop = isLogin ? '0px' : 'calc(var(--header-height) + 8px)';
  }

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  state.currentPage = page;

  // Render new page
  renderPage(page, state);

  // Update global header title/badge
  if (!isLogin) {
    updateHeader(page, state);
  }

  // Show new page
  const newEl = document.getElementById(`page-${page}`);
  if (newEl) newEl.classList.add('active');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderPage(page, state) {
  const el = document.getElementById(`page-${page}`);
  if (!el) return;

  switch (page) {
    case 'login':
      el.innerHTML = renderLogin(state);
      initLogin(state);
      break;
    case 'home':
      el.innerHTML = renderHome(state);
      initHome(state);
      break;
    case 'stats':
      el.innerHTML = renderStats(state);
      initStats(state);
      break;
    case 'partits':
      el.innerHTML = renderPartits(state);
      initPartits(state);
      break;
    case 'perfil':
      el.innerHTML = renderPerfil(state);
      initPerfil(state);
      break;
  }
}

// ---- Navigation Events ----
function initNavigation() {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    const page = btn.dataset.page;
    if (page) navigate(page);
  });
}

// ---- App Init ----
function init() {
  const state = window.APP_STATE;

  // Apply saved theme immediately (before any rendering)
  loadTheme();

  // Load persisted data
  const saved = loadState();
  state.players = saved.players;
  state.matches = saved.matches;
  state.customCalendar = saved.customCalendar || [];
  state.customFormations = saved.customFormations || {};
  state.lineupProposals = saved.lineupProposals || {};
  state.lang = saved.lang || 'ca';
  state.currentUserId = saved.currentUserId;

  // Detect if this is genuinely the first ever visit
  // (no saved state at all in localStorage)
  const rawSaved = localStorage.getItem(STORAGE_KEY);
  state.isFirstVisit = !rawSaved;

  // Init navigation
  initNavigation();

  // Bind settings button click
  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', openSettingsModal);
  }

  // Run initial translation on static elements
  translateStaticElements();

  // Auto-login logic:
  // - If currentUserId is already set → skip login, go directly to home
  // - If no currentUserId → show login screen
  //   (first visit: open on signup tab; returning user: open on login tab)
  if (state.currentUserId) {
    // Already logged in — go straight to app
    const header = document.querySelector('.app-header');
    const bottomNav = document.getElementById('bottom-nav');
    if (header) header.style.display = 'flex';
    if (bottomNav) bottomNav.style.display = 'flex';
    renderPage('home', state);
    document.getElementById('page-home')?.classList.add('active');
    updateHeader('home', state);
  } else {
    // Not logged in — navigate to login
    navigate('login');
  }

  console.log('%c⚽ FC😎 App Ready!', 'color:#a78bfa;font-weight:bold;font-size:14px;');
  console.log(`%c${state.players.length} jugadors · ${state.matches.length} partits`, 'color:#67e8f9;font-size:11px;');
}

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
