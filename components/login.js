// ============================================================
//  COMPONENTS/LOGIN.JS — Pantalla de login / registre
// ============================================================

function renderLogin(state) {
  // Preset list of battle emojis
  const emojis = ['⚽', '⚡', '🔥', '💪', '🎯', '🦁', '🌊', '🏔️', '🎭', '👑', '👽', '🦊', '🐯', '🌟', '🛡️', '⚔️'];
  
  const emojiItems = emojis.map((em, i) => `
    <button type="button" class="emoji-picker-item ${i === 0 ? 'active' : ''}" data-emoji="${em}">${em}</button>
  `).join('');

  const playerOptions = state.players.length > 0
    ? state.players.map(p => `<option value="${p.id}">${p.emoji} ${p.name} (${p.elo} ELO)</option>`).join('')
    : `<option value="" disabled selected>— ${t('no_assign')} —</option>`;

  const isLoginActive = state.players.length > 0;

  return `
    <div class="login-container">
      <div class="login-card">
        
        <div class="login-header">
          <div class="login-logo">⚽</div>
          <h2>${t('login_welcome')}</h2>
          <p>${t('login_subtitle')}</p>
        </div>

        <div class="login-tabs">
          <button class="login-tab-btn ${isLoginActive ? 'active' : ''}" id="btn-tab-login" data-tab="login" ${!isLoginActive ? 'disabled' : ''}>${t('login_tab_login')}</button>
          <button class="login-tab-btn ${!isLoginActive ? 'active' : ''}" id="btn-tab-signup" data-tab="signup">${t('login_tab_signup')}</button>
        </div>

        <!-- Log In Tab -->
        <div class="login-tab-content ${isLoginActive ? 'active' : ''}" id="content-tab-login">
          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label" for="login-select">${t('login_select_player')}</label>
            <select class="form-select" id="login-select" aria-label="${t('login_select_player')}">
              ${playerOptions}
            </select>
          </div>
          <button class="btn-primary" id="btn-submit-login" ${!isLoginActive ? 'disabled' : ''}>${t('login_btn_enter')}</button>
        </div>

        <!-- Sign Up Tab -->
        <div class="login-tab-content ${!isLoginActive ? 'active' : ''}" id="content-tab-signup">
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" for="signup-name">${t('login_name_label')}</label>
            <input type="text" class="form-input" id="signup-name" placeholder="${t('login_name_placeholder')}" required>
          </div>
          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label">${t('login_emoji_label')}</label>
            <div class="emoji-picker" id="signup-emoji-picker">
              ${emojiItems}
            </div>
          </div>
          <button class="btn-primary" id="btn-submit-signup">${t('login_btn_create')}</button>
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
  let selectedEmoji = '⚽';

  // Tab switching
  const btnLogin = document.getElementById('btn-tab-login');
  const btnSignup = document.getElementById('btn-tab-signup');
  const contentLogin = document.getElementById('content-tab-login');
  const contentSignup = document.getElementById('content-tab-signup');

  const switchTab = (tab) => {
    if (tab === 'login' && btnLogin && !btnLogin.disabled) {
      btnLogin.classList.add('active');
      btnSignup.classList.remove('active');
      contentLogin.classList.add('active');
      contentSignup.classList.remove('active');
    } else if (tab === 'signup' && btnSignup) {
      btnSignup.classList.add('active');
      if (btnLogin) btnLogin.classList.remove('active');
      contentSignup.classList.add('active');
      if (contentLogin) contentLogin.classList.remove('active');
    }
  };

  if (btnLogin) btnLogin.addEventListener('click', () => switchTab('login'));
  if (btnSignup) btnSignup.addEventListener('click', () => switchTab('signup'));

  // Emoji picker selection
  document.querySelectorAll('#signup-emoji-picker .emoji-picker-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#signup-emoji-picker .emoji-picker-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedEmoji = btn.dataset.emoji;
    });
  });

  // Log In Form Submission
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  if (btnSubmitLogin) {
    btnSubmitLogin.addEventListener('click', () => {
      const selectEl = document.getElementById('login-select');
      if (!selectEl || !selectEl.value) return;
      
      const pid = parseInt(selectEl.value);
      const player = state.players.find(p => p.id === pid);
      if (player) {
        state.currentUserId = pid;
        saveState(state);
        translateStaticElements();
        navigate('home');
        showToast(`⚽ ${t('login_welcome')} ${player.name}!`);
      }
    });
  }

  // Sign Up Form Submission
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
        emoji: selectedEmoji,
        elo: 1400,
        goals: 0,
        assists: 0,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        streak: [],
        photo: null,
        eloHistory: [1400]
      };

      state.players.push(newPlayer);
      state.currentUserId = newId;
      saveState(state);
      
      translateStaticElements();
      navigate('home');
      showToast(`✨ ${t('login_welcome')} ${name}!`);
    });
  }

  // Guest Entrance Submission
  const btnSubmitGuest = document.getElementById('btn-submit-guest');
  if (btnSubmitGuest) {
    btnSubmitGuest.addEventListener('click', () => {
      state.currentUserId = 'guest';
      saveState(state);
      translateStaticElements();
      navigate('home');
      showToast(`🔑 ${t('login_guest_btn')}`);
    });
  }
}
