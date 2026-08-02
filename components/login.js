// ============================================================
//  COMPONENTS/LOGIN.JS — Auth via Vercel Serverless API
// ============================================================

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function renderLogin(state) {
  const currentTab = state.authTab || 'login';

  return `
    <div class="login-container">
      <div class="login-card">

        <div class="auth-header">
          <h2 class="auth-card-title">FC😎 Colla</h2>
          <p class="auth-card-sub">Gestió privada de partits, ELO i alineacions</p>
        </div>

        <!-- Auth Tabs Navigation -->
        <div class="auth-nav-tabs">
          <button class="auth-nav-btn ${currentTab === 'login' ? 'active' : ''}" data-authtab="login">
            🔑 Iniciar Sessió
          </button>
          <button class="auth-nav-btn ${currentTab === 'signup' ? 'active' : ''}" data-authtab="signup">
            ✨ Registrar-me
          </button>
        </div>

        <!-- 1. LOG IN -->
        <div class="login-tab-content ${currentTab === 'login' ? 'active' : ''}" id="tab-auth-login">
          <div class="auth-field-group">
            <label class="auth-label">Correu Electrònic</label>
            <div class="auth-input-wrapper">
              <input type="email" class="auth-input" id="login-email" placeholder="pau@exemple.com" autocomplete="email">
            </div>
          </div>
          <div class="auth-field-group">
            <label class="auth-label">Contrasenya</label>
            <div class="auth-input-wrapper">
              <input type="password" class="auth-input" id="login-password" placeholder="••••••••" autocomplete="current-password">
            </div>
          </div>
          <button class="btn-auth-primary" id="btn-submit-login">Entrar →</button>
        </div>

        <!-- 2. SIGN UP -->
        <div class="login-tab-content ${currentTab === 'signup' ? 'active' : ''}" id="tab-auth-signup">
          <div class="auth-field-group">
            <label class="auth-label">El teu nom de jugador/a</label>
            <div class="auth-input-wrapper">
              <input type="text" class="auth-input" id="signup-name" placeholder="Marc / Pau / Laura..." autocomplete="name">
            </div>
          </div>
          <div class="auth-field-group">
            <label class="auth-label">Correu Electrònic</label>
            <div class="auth-input-wrapper">
              <input type="email" class="auth-input" id="signup-email" placeholder="correu@exemple.com" autocomplete="email">
            </div>
          </div>
          <div class="auth-field-group">
            <label class="auth-label">Contrasenya (mínim 6 caràcters)</label>
            <div class="auth-input-wrapper">
              <input type="password" class="auth-input" id="signup-password" placeholder="••••••••" autocomplete="new-password">
            </div>
          </div>
          <button class="btn-auth-primary" id="btn-submit-signup">Crear compte i entrar ✨</button>
        </div>

        <!-- Guest -->
        <div class="login-footer">
          <button class="login-guest-btn" id="btn-submit-guest">Entrar com a Convidat (Mode Demo) →</button>
        </div>

      </div>
    </div>
  `;
}

function initLogin(state) {

  // ---- Tab Switcher ----
  document.querySelectorAll('[data-authtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.authTab = btn.dataset.authtab;
      const container = document.getElementById('page-login');
      if (container) { container.innerHTML = renderLogin(state); initLogin(state); }
    });
  });

  // ---- 1. LOG IN ----
  const btnLogin = document.getElementById('btn-submit-login');
  if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
      const email = document.getElementById('login-email')?.value.trim();
      const password = document.getElementById('login-password')?.value;

      if (!email || !password) { showToast('⚠️ Omple el correu i la contrasenya'); return; }
      if (!isValidEmail(email)) { showToast('⚠️ Correu no vàlid (ex: nom@domini.com)'); return; }

      btnLogin.disabled = true;
      btnLogin.textContent = 'Verificant...';

      try {
        const res = await signInUser({ email, password });
        if (!res || !res.user) throw new Error('Resposta invàlida del servidor');

        state.currentUserId = res.user.id;
        state.userGroup = res.group || null;

        if (res.group && res.group.id) {
          const gData = await fetchGroupData(res.group.id);
          if (gData) {
            state.players = gData.players;
            state.matches = gData.matches;
            state.customCalendar = gData.customCalendar;
            state.lineupProposals = gData.lineupProposals;
          }
        }

        saveState(state);
        navigate('home');
        showToast('⚽ Benvingut/da de nou!');
      } catch (err) {
        showToast('❌ Error d\'accés: ' + (err.message || 'Credencials incorrectes'));
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar →';
      }
    });
  }

  // ---- 2. SIGN UP ----
  const btnSignup = document.getElementById('btn-submit-signup');
  if (btnSignup) {
    btnSignup.addEventListener('click', async () => {
      const name = document.getElementById('signup-name')?.value.trim();
      const email = document.getElementById('signup-email')?.value.trim();
      const password = document.getElementById('signup-password')?.value;

      if (!name || !email || !password) { showToast('⚠️ Omple tots els camps'); return; }
      if (!isValidEmail(email)) { showToast('⚠️ Correu no vàlid (ex: nom@domini.com)'); return; }
      if (password.length < 6) { showToast('⚠️ La contrasenya ha de tenir mínim 6 caràcters'); return; }

      btnSignup.disabled = true;
      btnSignup.textContent = 'Creant compte...';

      try {
        const res = await signUpUser({ displayName: name, email, password });
        if (!res || !res.user) throw new Error('Resposta invàlida del servidor');

        state.currentUserId = res.user.id;
        state.userGroup = res.group || null;

        if (res.group && res.group.id) {
          const gData = await fetchGroupData(res.group.id);
          if (gData) {
            state.players = gData.players;
            state.matches = gData.matches;
            state.customCalendar = gData.customCalendar;
            state.lineupProposals = gData.lineupProposals;
          }
        }

        saveState(state);
        navigate('home');
        showToast('✨ Compte creat amb èxit!');
      } catch (err) {
        showToast('❌ Error en registrar-se: ' + (err.message || 'Error del servidor'));
        btnSignup.disabled = false;
        btnSignup.textContent = 'Crear compte i entrar ✨';
      }
    });
  }

  // ---- 3. GUEST ----
  const btnGuest = document.getElementById('btn-submit-guest');
  if (btnGuest) {
    btnGuest.addEventListener('click', () => {
      state.currentUserId = 'guest';
      state.userGroup = { name: 'FC Colla', invite_code: 'DEMO' };
      saveState(state);
      navigate('home');
      showToast('🔑 Mode Convidat activat');
    });
  }
}
