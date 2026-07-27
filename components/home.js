// ============================================================
//  COMPONENTS/HOME.JS — Pàgina d'inici (minimalista)
// ============================================================

function renderHome(state) {
  const { players, matches } = state;

  // Find the next upcoming match from the calendar (matchId null = not played yet)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const playedIds = new Set(matches.map(m => m.id));
  const fullCalendar = getFullCalendar(state);
  const upcomingJornada = fullCalendar
    .filter(j => !j.matchId || !playedIds.has(j.matchId))
    .filter(j => !j.matchId) // truly unplayed (no matchId linked)
    .map(j => ({ ...j, dateObj: new Date(j.date) }))
    .sort((a, b) => a.dateObj - b.dateObj)
    .find(j => j.dateObj >= today); // next future one

  // Also look for the most recent past unplayed entry (already past but not registered)
  const pastPending = fullCalendar
    .filter(j => !j.matchId)
    .map(j => ({ ...j, dateObj: new Date(j.date) }))
    .sort((a, b) => b.dateObj - a.dateObj)
    .find(j => j.dateObj < today);

  // Priority: upcoming future > past unregistered > last played
  const pendingJornada = upcomingJornada || pastPending || null;

  const lastMatch = pendingJornada
    ? null
    : [...matches].sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  return `
    <!-- Note: header is now globally rendered by app shell -->
    ${pendingJornada
      ? renderUpcomingCard(pendingJornada)
      : renderLastMatchHero(lastMatch, players)
    }
  `;
}

/* ---- Upcoming match card ---- */
function renderUpcomingCard(jornada) {
  const dateObj = new Date(jornada.date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const isFuture = dateObj >= now;
  const daysLabel = !isFuture ? 'Pendent de registrar' : daysUntil(dateObj);
  const ctaTitle = isFuture ? (t('prepare_lineup_cta') || 'Preparar Alineació') : 'Toca per registrar el resultat';

  return `
    <div class="last-match-hero upcoming-card"
         id="upcoming-match-card"
         data-rival="${jornada.rival}"
         data-date="${jornada.date}"
         data-jornada="${jornada.jornada}"
         data-is-future="${isFuture}"
         role="button"
         tabindex="0"
         style="cursor:pointer;"
         aria-label="${ctaTitle} vs ${jornada.rival}">
      <div class="lmh-top-row">
        <p class="lmh-label">${isFuture ? '📅 Pròxim Partit' : '⏳ Partit Pendent'}</p>
        <span class="match-badge badge-upcoming">J${jornada.jornada}</span>
      </div>
      <p class="lmh-rival">vs <strong>${jornada.rival}</strong></p>
      <div class="upcoming-date-block">
        <span class="upcoming-date-main">${formatDate(jornada.date)}</span>
        <span class="upcoming-days-left">${daysLabel}</span>
      </div>
      <div class="upcoming-cta">
        <span>${isFuture ? `📐 <strong>${ctaTitle}</strong> (Suggeriment)` : '⚽ Toca per registrar el resultat'}</span>
        <span class="lmh-cta-arrow">→</span>
      </div>
    </div>
  `;
}

function daysUntil(dateObj) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((dateObj - now) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Avui!';
  if (diff === 1) return 'Demà';
  return `En ${diff} dies`;
}

/* ---- Last played match hero (minimal) ---- */
function renderLastMatchHero(match, players) {
  if (!match) {
    return `
      <div class="last-match-hero" style="cursor:default;">
        <p class="lmh-label">⚽ Últim Partit</p>
        <p style="color:var(--text-muted);text-align:center;padding:20px 0 14px;font-size:0.85rem;">Cap partit registrat</p>
        <p style="text-align:center;font-size:0.7rem;color:var(--text-muted);opacity:.5;">Registra el primer partit a la secció Partits</p>
      </div>
    `;
  }

  const result   = getMatchResult(match.score);
  const badgeCls = result === 'W' ? 'badge-w' : result === 'D' ? 'badge-d' : 'badge-l';
  const badgeTxt = result === 'W' ? 'Victòria' : result === 'D' ? 'Empat' : 'Derrota';
  const mvpPlayer = match.mvp ? getPlayerById(players, match.mvp) : null;
  const resultColor = result === 'W' ? 'var(--neon)' : result === 'L' ? 'var(--red)' : 'var(--text-secondary)';

  return `
    <div class="last-match-hero" id="lmh-card" data-match-id="${match.id}" role="button" tabindex="0" aria-label="Veure detalls de l'últim partit">

      <div class="lmh-top-row">
        <p class="lmh-label">⚽ Últim Partit</p>
        <span class="match-badge ${badgeCls}">${badgeTxt}</span>
      </div>

      <p class="lmh-rival">FC Colla vs <strong>${match.rival}</strong></p>

      <!-- Scoreboard: two teams + score -->
      <div class="lmh-scoreboard">
        <div class="lmh-team-block">
          <span class="lmh-team-name">FC Colla</span>
          <span class="lmh-team-score" style="color:${resultColor};">${match.score[0]}</span>
        </div>
        <div class="lmh-score-sep">–</div>
        <div class="lmh-team-block lmh-team-right">
          <span class="lmh-team-score" style="color:var(--text-secondary);">${match.score[1]}</span>
          <span class="lmh-team-name">${match.rival}</span>
        </div>
      </div>

      ${mvpPlayer ? `
        <div class="lmh-mvp-row">
          <div class="lmh-mvp-pill">
            <span class="lmh-mvp-avatar">${mvpPlayer.photo
              ? `<img src="${mvpPlayer.photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
              : mvpPlayer.emoji
            }</span>
            <span>⭐ MVP: <strong>${mvpPlayer.name}</strong></span>
          </div>
        </div>
      ` : ''}

      <div class="lmh-cta">
        <span>Toca per veure el resum</span>
        <span class="lmh-cta-arrow">→</span>
      </div>
    </div>
  `;
}

function initHome(state) {
  // Last match hero click → open match detail modal
  const lmhCard = document.getElementById('lmh-card');
  if (lmhCard) {
    const matchId = parseInt(lmhCard.dataset.matchId);
    lmhCard.addEventListener('click', () => {
      const match = state.matches.find(m => m.id === matchId);
      if (match) openMatchDetailModal(match, state.players);
    });
    lmhCard.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') lmhCard.click();
    });
  }

  // Upcoming match card click → navigate to lineup selection if before match date, or register tab if past
  const upcomingCard = document.getElementById('upcoming-match-card');
  if (upcomingCard) {
    const handleUpcomingClick = () => {
      const isFuture = upcomingCard.dataset.isFuture === 'true';
      if (isFuture) {
        state.partitsTab = 'alineacio';
        navigate('partits');
      } else {
        const rival = upcomingCard.dataset.rival || '';
        const date  = upcomingCard.dataset.date  || '';
        state.partitsTab = 'registrar';
        navigate('partits');
        // navigate() is sync but DOM paint may lag — use rAF to prefill safely
        requestAnimationFrame(() => {
          const rivalInput = document.getElementById('reg-rival');
          const dateInput  = document.getElementById('reg-date');
          if (rivalInput) rivalInput.value = rival;
          if (dateInput)  dateInput.value  = date;
        });
      }
    };
    upcomingCard.addEventListener('click', handleUpcomingClick);
    upcomingCard.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') handleUpcomingClick();
    });
  }
}

/* ---- Match detail modal (new, rich version) ---- */
function openMatchDetailModal(match, players) {
  const result = getMatchResult(match.score);
  const badgeCls = result === 'W' ? 'badge-w' : result === 'D' ? 'badge-d' : 'badge-l';
  const badgeTxt = result === 'W' ? 'Victòria' : result === 'D' ? 'Empat' : 'Derrota';
  const resultColor = result === 'W' ? 'var(--neon)' : result === 'L' ? 'var(--red)' : 'var(--text-secondary)';
  const mvpPlayer = match.mvp ? getPlayerById(players, match.mvp) : null;

  // Duration: optional field on match object
  const duration = match.duration ? `${match.duration}'` : '—';

  // Goals by our team (all registered goals belong to FC Colla)
  const ourGoals = [...match.goals].sort((a, b) => a.minute - b.minute);
  const ourGoalsHTML = ourGoals.length > 0
    ? ourGoals.map(g => {
        const p = getPlayerById(players, g.player);
        const assist = match.assists.find(a => a.minute === g.minute && a.player !== g.player);
        const assistP = assist ? getPlayerById(players, assist.player) : null;
        return `
          <div class="match-detail-goal-row">
            <span class="mdg-minute">${g.minute}'</span>
            <span class="mdg-ball">⚽</span>
            <div class="mdg-info">
              <span class="mdg-scorer">${p ? (p.emoji + ' ' + p.name) : 'Desconegut'}</span>
              ${assistP ? `<span class="mdg-assist">🎯 ${assistP.name}</span>` : ''}
            </div>
          </div>
        `;
      }).join('')
    : `<p class="match-detail-no-goals">Cap gol registrat</p>`;

  // Rival goals count (we only know the number, not who scored)
  const rivalGoalCount = match.score[1];
  const rivalGoalsHTML = rivalGoalCount > 0
    ? Array.from({ length: rivalGoalCount }, (_, i) => `
        <div class="match-detail-goal-row" style="opacity:0.6;">
          <span class="mdg-minute">—'</span>
          <span class="mdg-ball">⚽</span>
          <div class="mdg-info">
            <span class="mdg-scorer">${match.rival}</span>
          </div>
        </div>
      `).join('')
    : `<p class="match-detail-no-goals">Cap gol encaixat</p>`;

  const mvpAvatarInner = mvpPlayer
    ? (mvpPlayer.photo
        ? `<img src="${mvpPlayer.photo}" alt="${mvpPlayer.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
        : `<span style="font-size:1.4rem;">${mvpPlayer.emoji}</span>`)
    : '';

  const content = `
    <!-- Modal header: scoreboard -->
    <div class="modal-header" style="background:linear-gradient(160deg,var(--bg-elevated) 0%,var(--bg-base) 100%);border-bottom:1px solid var(--border-subtle);flex-direction:column;align-items:stretch;gap:0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="font-size:0.6rem;font-weight:700;color:var(--text-muted);letter-spacing:1.5px;text-transform:uppercase;font-family:var(--font-display);margin-bottom:12px;">⚽ Resum del Partit</div>
        <button class="modal-close" id="modal-close-btn" aria-label="Tancar">✕</button>
      </div>

      <!-- Big scoreboard -->
      <div class="modal-scoreboard">
        <div class="modal-team-block">
          <span class="modal-team-name">FC Colla</span>
          <span class="modal-team-score" style="color:${resultColor};">${match.score[0]}</span>
        </div>
        <div class="modal-score-sep">–</div>
        <div class="modal-team-block modal-team-right">
          <span class="modal-team-score" style="color:var(--text-secondary);">${match.score[1]}</span>
          <span class="modal-team-name">${match.rival}</span>
        </div>
      </div>

      <!-- Match meta info -->
      <div class="modal-match-meta">
        <span class="match-badge ${badgeCls}" style="font-size:0.6rem;">${badgeTxt}</span>
        <span class="modal-meta-item">📅 ${formatDate(match.date)}</span>
        <span class="modal-meta-item">⏱ ${duration}</span>
      </div>
    </div>

    <div class="modal-body">

      <!-- MVP -->
      ${mvpPlayer ? `
        <div class="modal-mvp-banner">
          <div class="modal-mvp-avatar">${mvpAvatarInner}</div>
          <div>
            <p class="modal-mvp-label">⭐ MVP del Partit</p>
            <p class="modal-mvp-name">${mvpPlayer.name}</p>
          </div>
        </div>
      ` : ''}

      <!-- Goals: FC Colla -->
      <div class="match-detail-team-section">
        <div class="match-detail-team-header team-us">
          <span>FC Colla</span>
          <span class="match-detail-team-score-badge" style="background:var(--neon-dim);color:var(--neon);">${match.score[0]}</span>
        </div>
        ${ourGoalsHTML}
      </div>

      <!-- Goals: Rival -->
      <div class="match-detail-team-section">
        <div class="match-detail-team-header team-rival">
          <span>${match.rival}</span>
          <span class="match-detail-team-score-badge" style="background:rgba(255,100,100,0.1);color:var(--red);">${match.score[1]}</span>
        </div>
        ${rivalGoalsHTML}
      </div>

    </div>
  `;

  openModal(content);
}
