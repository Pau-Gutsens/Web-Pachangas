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
};

// ---- Persistence ----
function saveState(state) {
  try {
    const toSave = {
      players: state.players,
      matches: state.matches,
      customFormations: state.customFormations || {},
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
      };
    }
  } catch (e) {
    console.warn('Could not load state:', e);
  }
  return {
    players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS)),
    matches: JSON.parse(JSON.stringify(DEFAULT_MATCHES)),
    customFormations: {},
  };
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

  // Update nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  state.currentPage = page;

  // Render new page
  renderPage(page, state);

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

  // Init navigation
  initNavigation();

  // Render initial page (Home)
  renderPage('home', state);
  document.getElementById('page-home')?.classList.add('active');

  console.log('%c⚽ FC Colla App Ready!', 'color:#B8FF00;font-weight:bold;font-size:14px;');
  console.log(`%c${state.players.length} jugadors · ${state.matches.length} partits`, 'color:#00D9FF;font-size:11px;');
}

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
