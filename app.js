// ============================================================
//  APP.JS — FC Colla · Router, State & Init
// ============================================================

const STORAGE_KEY = 'fc-colla-state-v1';

// ---- Global State ----
window.APP_STATE = {
  currentPage: 'home',
  players: [],
  matches: [],
  customFormations: {},   // { name: [ {pos, x, y, label}, ... ] }
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
      customFormations: state.customFormations || {},
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
        customFormations: parsed.customFormations || {},
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
    customFormations: {},
    lang: 'ca',
    currentUserId: null,
  };
}

// ---- Dynamic Header Update ----
function updateHeader(page, state) {
  const titleEl = document.getElementById('app-title');
  const badgeEl = document.getElementById('header-badge');
  if (!titleEl || !badgeEl) return;

  // Remove previous classes
  badgeEl.className = 'header-badge';

  switch (page) {
    case 'home':
      titleEl.textContent = 'FC Colla';
      badgeEl.textContent = `${t('season')} 26`;
      badgeEl.classList.add('badge-neon');
      break;
    case 'stats':
      titleEl.textContent = t('stats_title');
      badgeEl.textContent = 'ELO · Gols';
      badgeEl.classList.add('badge-cyan');
      break;
    case 'partits':
      titleEl.textContent = t('matches_title');
      badgeEl.textContent = `${state.matches.length} ${t('played')}`;
      badgeEl.classList.add('badge-orange');
      break;
    case 'perfil':
      titleEl.textContent = t('players_title');
      badgeEl.textContent = `${state.players.length} ${t('players_count')}`;
      badgeEl.classList.add('badge-gold');
      break;
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

// ---- Settings Modal ----
function openSettingsModal() {
  const state = window.APP_STATE;
  const content = `
    <div class="modal-header">
      <div class="modal-title">⚙️ ${t('settings_title')}</div>
      <button class="modal-close" id="modal-close-btn" aria-label="${t('close')}">✕</button>
    </div>
    <div class="modal-body settings-modal-body">
      
      <!-- Language Selection -->
      <div class="settings-section">
        <h3>🌐 ${t('select_lang')}</h3>
        <div class="lang-selector-group">
          <button class="lang-btn ${state.lang === 'ca' ? 'active' : ''}" data-lang="ca">Català</button>
          <button class="lang-btn ${state.lang === 'es' ? 'active' : ''}" data-lang="es">Español</button>
          <button class="lang-btn ${state.lang === 'en' ? 'active' : ''}" data-lang="en">English</button>
        </div>
      </div>
      
      <!-- Data Management -->
      <div class="settings-section">
        <h3>💾 ${t('data_management')}</h3>
        <div class="settings-data-actions">
          <button class="settings-action-btn" id="btn-export-data">📥 ${t('export_data')}</button>
          <label class="settings-action-btn file-input-label" id="label-import-data" for="input-import-data">
            📤 ${t('import_data')}
            <input type="file" id="input-import-data" accept=".json" style="display:none;">
          </label>
          <button class="settings-action-btn btn-danger" id="btn-reset-data">⚠️ ${t('reset_data')}</button>
          <button class="settings-action-btn btn-danger" id="btn-logout" style="margin-top:12px;border-color:var(--red);color:var(--red);">🚪 ${t('login_logout')}</button>
        </div>
      </div>
      
    </div>
  `;

  openModal(content);

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

  // Export Data
  const btnExport = document.getElementById('btn-export-data');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const toSave = {
        players: state.players,
        matches: state.matches,
        customFormations: state.customFormations || {},
        lang: state.lang || 'ca',
        currentUserId: state.currentUserId
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(toSave, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `fc_colla_data_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('📥 Data exported!');
    });
  }

  // Import Data
  const inputImport = document.getElementById('input-import-data');
  if (inputImport) {
    inputImport.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.players && parsed.matches) {
            state.players = parsed.players;
            state.matches = parsed.matches;
            state.customFormations = parsed.customFormations || {};
            if (parsed.lang) state.lang = parsed.lang;
            if (parsed.currentUserId !== undefined) state.currentUserId = parsed.currentUserId;

            saveState(state);
            closeModal();

            // Refresh whole app
            translateStaticElements();
            renderPage(state.currentPage, state);
            showToast(`✅ ${t('import_success')}`);
          } else {
            showToast(`❌ ${t('import_error')}`);
          }
        } catch (err) {
          showToast(`❌ ${t('import_error')}`);
        }
      };
      reader.readAsText(file);
    });
  }

  // Reset Data
  const btnReset = document.getElementById('btn-reset-data');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm(t('reset_confirm'))) {
        // Clear localStorage
        localStorage.removeItem(STORAGE_KEY);

        // Re-load default values
        const loaded = loadState();
        state.players = loaded.players;
        state.matches = loaded.matches;
        state.customFormations = loaded.customFormations || {};
        state.lang = loaded.lang || 'ca';
        state.currentUserId = null;

        saveState(state);
        closeModal();

        // Refresh whole app
        translateStaticElements();
        navigate('login');
        showToast(`🧹 ${t('reset_success')}`);
      }
    });
  }

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

  // Load persisted data
  const saved = loadState();
  state.players = saved.players;
  state.matches = saved.matches;
  state.customFormations = saved.customFormations || {};
  state.lang = saved.lang || 'ca';
  state.currentUserId = saved.currentUserId;

  // Init navigation
  initNavigation();

  // Bind settings button click
  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', openSettingsModal);
  }

  // Run initial translation on static elements
  translateStaticElements();

  // Redirect to login if no profile chosen, else load home
  if (!state.currentUserId) {
    // Navigate directly to login
    navigate('login');
  } else {
    // Render initial page (Home)
    renderPage('home', state);
    document.getElementById('page-home')?.classList.add('active');
    updateHeader('home', state);
  }

  console.log('%c⚽ FC Colla App Ready!', 'color:#B8FF00;font-weight:bold;font-size:14px;');
  console.log(`%c${state.players.length} jugadors · ${state.matches.length} partits`, 'color:#00D9FF;font-size:11px;');
}

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
