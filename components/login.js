// ============================================================
//  COMPONENTS/LOGIN.JS — Auth UI amb visualitzador de contrasenya i indicador de força
// ============================================================

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function renderLogin(state) {
  const currentTab = state.authTab || 'login';

  return `
    <div class="login-container">
      <div class="login-card">

        <!-- Title -->
        <div class="auth-header">
          <h2 class="auth-card-title">FC😎</h2>
        </div>

        <!-- Auth Tabs Navigation -->
        <div class="auth-nav-tabs">
          <button class="auth-nav-btn ${currentTab === 'login' ? 'active' : ''}" data-authtab="login">
            Iniciar Sessió
          </button>
          <button class="auth-nav-btn ${currentTab === 'signup' ? 'active' : ''}" data-authtab="signup">
            Registrar-me
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
              <button type="button" class="password-toggle-btn" data-target="login-password" aria-label="Mostrar contrasenya">
                <svg class="eye-icon eye-off" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                  <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                  <line x1="2" y1="2" x2="22" y2="22"/>
                </svg>
                <svg class="eye-icon eye-on" style="display:none;" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <button class="btn-auth-primary" id="btn-submit-login">Entrar →</button>
        </div>

        <!-- 2. SIGN UP -->
        <div class="login-tab-content ${currentTab === 'signup' ? 'active' : ''}" id="tab-auth-signup">
          <div class="auth-field-group">
            <label class="auth-label">Nom de jugador/a</label>
            <div class="auth-input-wrapper">
              <input type="text" class="auth-input" id="signup-name" placeholder="Nom..." autocomplete="name">
            </div>
          </div>

          <div class="auth-field-group">
            <label class="auth-label">Correu Electrònic</label>
            <div class="auth-input-wrapper">
              <input type="email" class="auth-input" id="signup-email" placeholder="correu@exemple.com" autocomplete="email">
            </div>
          </div>

          <div class="auth-field-group">
            <label class="auth-label">Contrasenya</label>
            <div class="auth-input-wrapper">
              <input type="password" class="auth-input" id="signup-password" placeholder="••••••••" autocomplete="new-password">
              <button type="button" class="password-toggle-btn" data-target="signup-password" aria-label="Mostrar contrasenya">
                <svg class="eye-icon eye-off" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                  <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                  <line x1="2" y1="2" x2="22" y2="22"/>
                </svg>
                <svg class="eye-icon eye-on" style="display:none;" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>

            <!-- Indicador visual de la contrasenya -->
            <div class="pwd-strength-container" id="pwd-strength-container" style="display:none;">
              <div class="pwd-strength-bar-bg">
                <div class="pwd-strength-bar-fill" id="pwd-strength-fill"></div>
              </div>
              <div class="pwd-requirements">
                <span class="pwd-req-item" id="req-length">✕ Mínim 6 caràcters</span>
                <span class="pwd-req-item" id="req-number">✕ Un número o símbol (opcional)</span>
              </div>
            </div>
          </div>

          <button class="btn-auth-primary" id="btn-submit-signup">Crear compte →</button>
        </div>

        <!-- Guest -->
        <div class="login-footer">
          <button class="login-guest-btn" id="btn-submit-guest">Entrar com a Convidat →</button>
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

  // ---- Password Toggle Buttons (Ull 👁️) ----
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const eyeOff = btn.querySelector('.eye-off');
      const eyeOn = btn.querySelector('.eye-on');

      if (input.type === 'password') {
        input.type = 'text';
        if (eyeOff) eyeOff.style.display = 'none';
        if (eyeOn) eyeOn.style.display = 'block';
      } else {
        input.type = 'password';
        if (eyeOff) eyeOff.style.display = 'block';
        if (eyeOn) eyeOn.style.display = 'none';
      }
    });
  });

  // ---- Real-time Password Strength Check ----
  const signupPwdInput = document.getElementById('signup-password');
  const pwdStrengthContainer = document.getElementById('pwd-strength-container');
  const pwdStrengthFill = document.getElementById('pwd-strength-fill');
  const reqLength = document.getElementById('req-length');
  const reqNumber = document.getElementById('req-number');

  if (signupPwdInput) {
    signupPwdInput.addEventListener('input', () => {
      const val = signupPwdInput.value;
      if (val.length === 0) {
        if (pwdStrengthContainer) pwdStrengthContainer.style.display = 'none';
        return;
      }

      if (pwdStrengthContainer) pwdStrengthContainer.style.display = 'block';

      const hasMinLength = val.length >= 6;
      const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(val);

      if (reqLength) {
        reqLength.textContent = hasMinLength ? '✓ Mínim 6 caràcters' : '✕ Mínim 6 caràcters';
        reqLength.classList.toggle('valid', hasMinLength);
      }

      if (reqNumber) {
        reqNumber.textContent = hasNumberOrSymbol ? '✓ Inclou números/símbols' : '○ Un número o símbol (opcional)';
        reqNumber.classList.toggle('valid', hasNumberOrSymbol);
      }

      // Bar progress & color
      if (pwdStrengthFill) {
        if (!hasMinLength) {
          pwdStrengthFill.style.width = '33%';
          pwdStrengthFill.style.background = '#ef4444'; // Red
        } else if (hasMinLength && !hasNumberOrSymbol) {
          pwdStrengthFill.style.width = '66%';
          pwdStrengthFill.style.background = '#f59e0b'; // Yellow/Orange
        } else {
          pwdStrengthFill.style.width = '100%';
          pwdStrengthFill.style.background = '#10b981'; // Green
        }
      }
    });
  }

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
        btnSignup.textContent = 'Crear compte →';
      }
    });
  }

  // ---- 3. GUEST ----
  const btnGuest = document.getElementById('btn-submit-guest');
  if (btnGuest) {
    btnGuest.addEventListener('click', () => {
      state.currentUserId = 'guest';
      state.userGroup = { name: 'FC 😎', invite_code: 'DEMO' };
      saveState(state);
      navigate('home');
      showToast('🔑 Mode Convidat activat');
    });
  }
}
