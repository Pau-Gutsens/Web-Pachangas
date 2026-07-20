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
    ? state.players.map(p => {
        const avatar = p.photo
          ? `<img src="${p.photo}" style="width:18px;height:18px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:4px;">`
          : `${p.emoji} `;
        return `<option value="${p.id}">${p.emoji || ''} ${p.name} (${p.elo} ELO)</option>`;
      }).join('')
    : `<option value="" disabled selected>— ${t('no_assign')} —</option>`;

  // isFirstVisit: no saved state ever → force signup tab only
  const isFirstVisit = state.isFirstVisit;
  // hasPlayers: there are existing profiles → allow login tab
  const hasPlayers = state.players.length > 0;

  // Show tabs only if there are existing players (otherwise only show signup)
  const showTabs = hasPlayers;
  // Default tab: login if returning user with no session, signup if first visit
  const defaultTab = isFirstVisit || !hasPlayers ? 'signup' : 'login';

  return `
    <div class="login-container">
      <div class="login-card">

        <div class="login-header">
          <div class="login-logo">⚽</div>
          <h2>Benvingut a FC😎</h2>
          <p>${t('login_subtitle')}</p>
        </div>

        ${showTabs ? `
        <div class="login-tabs">
          <button class="login-tab-btn ${defaultTab === 'login' ? 'active' : ''}" id="btn-tab-login" data-tab="login">${t('login_tab_login')}</button>
          <button class="login-tab-btn ${defaultTab === 'signup' ? 'active' : ''}" id="btn-tab-signup" data-tab="signup">${t('login_tab_signup')}</button>
        </div>
        ` : `
        <div class="login-first-visit-badge">
          <span>👋 ${t('login_first_time')}</span>
        </div>
        `}

        <!-- Log In Tab -->
        <div class="login-tab-content ${defaultTab === 'login' ? 'active' : ''}" id="content-tab-login">
          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label" for="login-select">${t('login_select_player')}</label>
            <select class="form-select" id="login-select" aria-label="${t('login_select_player')}">
              ${playerOptions}
            </select>
          </div>
          <button class="btn-primary" id="btn-submit-login">${t('login_btn_enter')}</button>
        </div>

        <!-- Sign Up Tab -->
        <div class="login-tab-content ${defaultTab === 'signup' ? 'active' : ''}" id="content-tab-signup">
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" for="signup-name">${t('login_name_label')}</label>
            <input type="text" class="form-input" id="signup-name" placeholder="${t('login_name_placeholder')}" required>
          </div>

          <!-- Avatar selector: emoji or photo -->
          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label">${t('login_avatar_label')}</label>
            <div class="avatar-type-toggle">
              <button type="button" class="avatar-type-btn active" id="btn-avatar-emoji" data-type="emoji">
                😀 ${t('login_avatar_emoji')}
              </button>
              <button type="button" class="avatar-type-btn" id="btn-avatar-photo" data-type="photo">
                📷 ${t('login_avatar_photo')}
              </button>
            </div>

            <!-- Emoji picker section -->
            <div id="signup-emoji-section" class="avatar-section active">
              <div class="emoji-picker" id="signup-emoji-picker">
                ${emojiItems}
              </div>
            </div>

            <!-- Photo upload section -->
            <div id="signup-photo-section" class="avatar-section">
              <div class="photo-upload-area" id="photo-upload-area">
                <div class="photo-upload-preview" id="photo-preview-container">
                  <div class="photo-upload-icon">📷</div>
                  <p class="photo-upload-text">${t('login_photo_tap')}</p>
                </div>
                <input type="file" id="signup-photo-input" accept="image/*" style="display:none;">
              </div>
              <button type="button" class="photo-clear-btn" id="btn-clear-photo" style="display:none;">
                ✕ ${t('login_photo_clear')}
              </button>
            </div>
          </div>

          <button class="btn-primary" id="btn-submit-signup">${t('login_btn_create')}</button>
        </div>

        <!-- Guest Entry -->
        ${showTabs || !isFirstVisit ? `
        <div class="login-footer">
          <button class="login-guest-btn" id="btn-submit-guest">${t('login_guest_btn')} →</button>
        </div>
        ` : `
        <div class="login-footer">
          <button class="login-guest-btn" id="btn-submit-guest">${t('login_guest_btn')} →</button>
        </div>
        `}

      </div>
    </div>
  `;
}

function initLogin(state) {
  let selectedEmoji = '⚽';
  let selectedPhoto = null; // base64 string or null
  let avatarMode = 'emoji'; // 'emoji' | 'photo'

  // ---- Tab switching (only if tabs exist) ----
  const btnLogin = document.getElementById('btn-tab-login');
  const btnSignup = document.getElementById('btn-tab-signup');
  const contentLogin = document.getElementById('content-tab-login');
  const contentSignup = document.getElementById('content-tab-signup');

  const switchTab = (tab) => {
    if (tab === 'login') {
      if (btnLogin) { btnLogin.classList.add('active'); }
      if (btnSignup) { btnSignup.classList.remove('active'); }
      if (contentLogin) { contentLogin.classList.add('active'); }
      if (contentSignup) { contentSignup.classList.remove('active'); }
    } else if (tab === 'signup') {
      if (btnSignup) { btnSignup.classList.add('active'); }
      if (btnLogin) { btnLogin.classList.remove('active'); }
      if (contentSignup) { contentSignup.classList.add('active'); }
      if (contentLogin) { contentLogin.classList.remove('active'); }
    }
  };

  if (btnLogin) btnLogin.addEventListener('click', () => switchTab('login'));
  if (btnSignup) btnSignup.addEventListener('click', () => switchTab('signup'));

  // ---- Emoji picker selection ----
  document.querySelectorAll('#signup-emoji-picker .emoji-picker-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#signup-emoji-picker .emoji-picker-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedEmoji = btn.dataset.emoji;
    });
  });

  // ---- Avatar type toggle (emoji vs photo) ----
  const btnAvatarEmoji = document.getElementById('btn-avatar-emoji');
  const btnAvatarPhoto = document.getElementById('btn-avatar-photo');
  const emojiSection = document.getElementById('signup-emoji-section');
  const photoSection = document.getElementById('signup-photo-section');

  const switchAvatarMode = (mode) => {
    avatarMode = mode;
    if (mode === 'emoji') {
      btnAvatarEmoji?.classList.add('active');
      btnAvatarPhoto?.classList.remove('active');
      emojiSection?.classList.add('active');
      photoSection?.classList.remove('active');
    } else {
      btnAvatarPhoto?.classList.add('active');
      btnAvatarEmoji?.classList.remove('active');
      photoSection?.classList.add('active');
      emojiSection?.classList.remove('active');
    }
  };

  if (btnAvatarEmoji) btnAvatarEmoji.addEventListener('click', () => switchAvatarMode('emoji'));
  if (btnAvatarPhoto) btnAvatarPhoto.addEventListener('click', () => switchAvatarMode('photo'));

  // ---- Photo upload ----
  const photoUploadArea = document.getElementById('photo-upload-area');
  const photoInput = document.getElementById('signup-photo-input');
  const previewContainer = document.getElementById('photo-preview-container');
  const clearPhotoBtn = document.getElementById('btn-clear-photo');

  if (photoUploadArea && photoInput) {
    photoUploadArea.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('⚠️ Selecciona una imatge vàlida');
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        selectedPhoto = evt.target.result;
        // Show preview
        previewContainer.innerHTML = `
          <img src="${selectedPhoto}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--neon);box-shadow:0 0 16px rgba(184,255,0,0.25);">
          <p class="photo-upload-text" style="color:var(--neon);margin-top:8px;">✓ Foto carregada</p>
        `;
        if (clearPhotoBtn) clearPhotoBtn.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  if (clearPhotoBtn) {
    clearPhotoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedPhoto = null;
      if (photoInput) photoInput.value = '';
      if (previewContainer) {
        previewContainer.innerHTML = `
          <div class="photo-upload-icon">📷</div>
          <p class="photo-upload-text">${t('login_photo_tap')}</p>
        `;
      }
      clearPhotoBtn.style.display = 'none';
    });
  }

  // ---- Log In Form Submission ----
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  if (btnSubmitLogin) {
    btnSubmitLogin.addEventListener('click', () => {
      const selectEl = document.getElementById('login-select');
      if (!selectEl || !selectEl.value) return;

      const pid = parseInt(selectEl.value);
      const player = state.players.find(p => p.id === pid);
      if (player) {
        state.currentUserId = pid;
        state.isFirstVisit = false;
        saveState(state);
        translateStaticElements();
        navigate('home');
        showToast(`⚽ ${t('login_welcome_back')} ${player.name}!`);
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

      // If photo mode but no photo selected, warn but allow with emoji fallback
      if (avatarMode === 'photo' && !selectedPhoto) {
        showToast('📷 Selecciona una foto o tria un emoji');
        return;
      }

      // Create new player profile
      const newId = state.players.length > 0 ? Math.max(...state.players.map(p => p.id)) + 1 : 1;
      const newPlayer = {
        id: newId,
        name: name,
        emoji: avatarMode === 'emoji' ? selectedEmoji : '👤',
        photo: avatarMode === 'photo' ? selectedPhoto : null,
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
