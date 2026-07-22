// ============================================================
//  COMPONENTS/LOGIN.JS — Pantalla de Log In / Sign Up
// ============================================================

function renderLogin(state) {
  const isFirstVisit = state.isFirstVisit;
  const hasPlayers = state.players.length > 0;
  const defaultTab = isFirstVisit || !hasPlayers ? 'signup' : 'login';

  return `
    <div class="login-container">
      <div class="login-card">

        <!-- Title -->
        <h2 class="auth-card-title" id="auth-card-title">
          ${defaultTab === 'signup' ? t('login_title_signup') : t('login_title_login')}
        </h2>

        <!-- Log In Form Content -->
        <div class="login-tab-content ${defaultTab === 'login' ? 'active' : ''}" id="content-tab-login">

          <div class="auth-field-group">
            <div class="auth-input-wrapper">
              <input type="text" class="auth-input" id="login-identifier" placeholder="${t('login_name_placeholder')}" autocomplete="username">
            </div>
          </div>

          <div class="auth-field-group">
            <div class="auth-input-wrapper">
              <input type="password" class="auth-input" id="login-password" placeholder="${t('login_password_placeholder')}" autocomplete="current-password">
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

          <button class="btn-auth-primary" id="btn-submit-login">${t('login_title_login')}</button>

          <div class="auth-footer-toggle">
            ${t('login_no_account')} <button type="button" class="auth-toggle-link" id="link-to-signup">${t('login_title_signup')}</button>
          </div>
        </div>

        <!-- Sign Up Form Content -->
        <div class="login-tab-content ${defaultTab === 'signup' ? 'active' : ''}" id="content-tab-signup">

          <div class="auth-field-group">
            <div class="auth-input-wrapper">
              <input type="text" class="auth-input" id="signup-name" placeholder="${t('login_name_placeholder')}" required autocomplete="username">
            </div>
          </div>

          <div class="auth-field-group">
            <div class="auth-input-wrapper">
              <input type="password" class="auth-input" id="signup-password" placeholder="${t('login_password_placeholder')}" required autocomplete="new-password">
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
          </div>

          <button class="btn-auth-primary" id="btn-submit-signup">${t('login_title_signup')}</button>

          <div class="auth-footer-toggle">
            ${t('login_already_account')} <button type="button" class="auth-toggle-link" id="link-to-login">${t('login_title_login')}</button>
          </div>
        </div>

        <!-- Guest Entry -->
        <div class="login-footer">
          <button class="login-guest-btn" id="btn-submit-guest">${t('login_guest_btn')} →</button>
        </div>

      </div>
    </div>
  `;
}

function initLogin(state) {
  const titleEl = document.getElementById('auth-card-title');
  const contentLogin = document.getElementById('content-tab-login');
  const contentSignup = document.getElementById('content-tab-signup');
  const linkToSignup = document.getElementById('link-to-signup');
  const linkToLogin = document.getElementById('link-to-login');
  const loginIdentifier = document.getElementById('login-identifier');

  const switchTab = (tab) => {
    if (tab === 'login') {
      if (titleEl) titleEl.textContent = t('login_title_login');
      if (contentLogin) contentLogin.classList.add('active');
      if (contentSignup) contentSignup.classList.remove('active');
    } else if (tab === 'signup') {
      if (titleEl) titleEl.textContent = t('login_title_signup');
      if (contentSignup) contentSignup.classList.add('active');
      if (contentLogin) contentLogin.classList.remove('active');
    }
  };

  if (linkToSignup) linkToSignup.addEventListener('click', () => switchTab('signup'));
  if (linkToLogin) linkToLogin.addEventListener('click', () => switchTab('login'));

  // ---- Password Visibility Toggles ----
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

  // ---- Log In Form Submission ----
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  if (btnSubmitLogin) {
    btnSubmitLogin.addEventListener('click', () => {
      const typedId = loginIdentifier ? loginIdentifier.value.trim().toLowerCase() : '';

      if (!typedId) {
        showToast('⚠️ Introduïu el vostre correu o nom de jugador');
        if (loginIdentifier) loginIdentifier.focus();
        return;
      }

      let player = state.players.find(p => p.name.toLowerCase() === typedId);

      // If no player profile exists with exact name, create or login first player
      if (!player && state.players.length > 0) {
        player = state.players[0];
      }

      if (player) {
        state.currentUserId = player.id;
        state.isFirstVisit = false;
        saveState(state);
        translateStaticElements();
        navigate('home');
        showToast(`⚽ ${t('login_welcome_back')} ${player.name}!`);
      } else {
        // Create new player with this identifier
        const newId = state.players.length > 0 ? Math.max(...state.players.map(p => p.id)) + 1 : 1;
        const newPlayer = {
          id: newId,
          name: typedId,
          emoji: '⚽',
          photo: null,
          elo: 1400,
          goals: 0,
          assists: 0,
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          streak: [],
          eloHistory: [1400]
        };
        state.players.push(newPlayer);
        state.currentUserId = newId;
        state.isFirstVisit = false;
        saveState(state);
        translateStaticElements();
        navigate('home');
        showToast(`✨ Benvingut/da ${typedId}!`);
      }
    });
  }

  // ---- Sign Up Form Submission ----
  const btnSubmitSignup = document.getElementById('btn-submit-signup');
  if (btnSubmitSignup) {
    btnSubmitSignup.addEventListener('click', () => {
      const nameInput = document.getElementById('signup-name');
      const name = nameInput ? nameInput.value.trim() : '';

      if (!name) {
        showToast(t('login_error_empty'));
        if (nameInput) nameInput.focus();
        return;
      }

      // Create new player profile
      const newId = state.players.length > 0 ? Math.max(...state.players.map(p => p.id)) + 1 : 1;
      const newPlayer = {
        id: newId,
        name: name,
        emoji: '⚽',
        photo: null,
        elo: 1400,
        goals: 0,
        assists: 0,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        streak: [],
        eloHistory: [1400]
      };

      state.players.push(newPlayer);
      state.currentUserId = newId;
      state.isFirstVisit = false;
      saveState(state);

      translateStaticElements();
      navigate('home');
      showToast(`✨ Benvingut/da ${name}! Ara formes part de FC😎`);
    });
  }

  // ---- Guest Entrance Submission ----
  const btnSubmitGuest = document.getElementById('btn-submit-guest');
  if (btnSubmitGuest) {
    btnSubmitGuest.addEventListener('click', () => {
      state.currentUserId = 'guest';
      state.isFirstVisit = false;
      saveState(state);
      translateStaticElements();
      navigate('home');
      showToast(`🔑 ${t('login_guest_btn')}`);
    });
  }
}
