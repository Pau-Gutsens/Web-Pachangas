// ============================================================
//  COMPONENTS/PARTITS.JS — Pàgina de partits (4 tabs)
// ============================================================

// Drag state for tactical editor & lineup proposal system
const DRAG_STATE = {
  dragging: null,
  currentTeam: 'teamA',   // 'teamA' or 'teamB'
  viewMode: 'my_proposal', // 'my_proposal' or 'colla_proposals'
  teamFormations: { teamA: '4-3-3', teamB: '4-3-3' },
  teamPositions: { teamA: {}, teamB: {} },
  playerPositions: {},   // points to DRAG_STATE.teamPositions[DRAG_STATE.currentTeam]
  formation: '4-3-3',     // points to DRAG_STATE.teamFormations[DRAG_STATE.currentTeam]
  activePositions: null, // working copy of positions array [{pos,x,y,label}]
  editMode: false,       // true = editing positions
  nextPosId: 100,        // auto-increment for new custom positions
};

function syncDragStateTeam() {
  if (!DRAG_STATE.currentTeam) DRAG_STATE.currentTeam = 'teamA';
  if (!DRAG_STATE.teamFormations) DRAG_STATE.teamFormations = { teamA: '4-3-3', teamB: '4-3-3' };
  if (!DRAG_STATE.teamPositions) DRAG_STATE.teamPositions = { teamA: {}, teamB: {} };
  if (!DRAG_STATE.teamPositions.teamA) DRAG_STATE.teamPositions.teamA = {};
  if (!DRAG_STATE.teamPositions.teamB) DRAG_STATE.teamPositions.teamB = {};

  const team = DRAG_STATE.currentTeam;
  DRAG_STATE.formation = DRAG_STATE.teamFormations[team] || '4-3-3';
  DRAG_STATE.playerPositions = DRAG_STATE.teamPositions[team];
}

function getUpcomingJornada(state) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const playedIds = new Set((state.matches || []).map(m => m.id));
  const fullCalendar = getFullCalendar(state);
  return fullCalendar
    .filter(j => !j.matchId || !playedIds.has(j.matchId))
    .filter(j => !j.matchId)
    .map(j => ({ ...j, dateObj: new Date(j.date) }))
    .sort((a, b) => a.dateObj - b.dateObj)
    .find(j => j.dateObj >= today) || fullCalendar[fullCalendar.length - 1];
}

function renderPartits(state) {
  const activeTab = state.partitsTab || 'historial';
  return `
    <!-- Note: header is now globally rendered by app shell -->

    <div class="tabs" role="tablist" id="partits-tabs">
      <button class="tab-btn ${activeTab === 'historial'  ? 'active' : ''}" data-tab="historial"  role="tab" id="tab-historial"  aria-selected="${activeTab==='historial'}">${t('tab_history')}</button>
      <button class="tab-btn ${activeTab === 'calendari'  ? 'active' : ''}" data-tab="calendari"  role="tab" id="tab-calendari"  aria-selected="${activeTab==='calendari'}">${t('tab_calendar')}</button>
      <button class="tab-btn ${activeTab === 'registrar'  ? 'active' : ''}" data-tab="registrar"  role="tab" id="tab-registrar"  aria-selected="${activeTab==='registrar'}">${t('tab_register')}</button>
      <button class="tab-btn ${activeTab === 'alineacio'  ? 'active' : ''}" data-tab="alineacio"  role="tab" id="tab-alineacio"  aria-selected="${activeTab==='alineacio'}">${t('tab_lineup')}</button>
    </div>

    <div id="tab-content-historial" class="tab-content ${activeTab === 'historial' ? 'active' : ''}">
      ${renderHistorial(state)}
    </div>
    <div id="tab-content-calendari" class="tab-content ${activeTab === 'calendari' ? 'active' : ''}">
      ${renderCalendari(state)}
    </div>
    <div id="tab-content-registrar" class="tab-content ${activeTab === 'registrar' ? 'active' : ''}">
      ${renderRegistrarForm(state)}
    </div>
    <div id="tab-content-alineacio" class="tab-content ${activeTab === 'alineacio' ? 'active' : ''}">
      ${renderAlineacio(state)}
    </div>
  `;
}

// ---- HISTORIAL ----
function renderHistorial(state) {
  const { matches, players, historialFilters } = state;
  const filters = historialFilters || { rival: '', dateFrom: '', dateTo: '', result: 'all' };
  const sorted = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = sorted.filter(m => {
    if (filters.rival && !m.rival.toLowerCase().includes(filters.rival.toLowerCase())) return false;
    if (filters.dateFrom && m.date < filters.dateFrom) return false;
    if (filters.dateTo   && m.date > filters.dateTo)   return false;
    if (filters.result && filters.result !== 'all') {
      const r = getMatchResult(m.score);
      if (filters.result !== r) return false;
    }
    return true;
  });

  const matchCards = filtered.length
    ? filtered.map(m => renderMatchCard(m, players)).join('')
    : `<div class="empty-state"><div class="empty-state-icon">🔍</div><p class="empty-state-text">${t('no_matches_found')}</p></div>`;

  return `
    <div class="section">
      <div class="filters-row">
        <input type="text" class="filter-input" id="filter-rival" placeholder="${t('search_rival')}" value="${filters.rival || ''}" aria-label="${t('search_rival')}">
        <input type="date" class="filter-input" id="filter-date-from" value="${filters.dateFrom || ''}" style="max-width:140px;" aria-label="${t('date_from')}">
        <input type="date" class="filter-input" id="filter-date-to"   value="${filters.dateTo || ''}" style="max-width:140px;" aria-label="${t('date_to')}">
      </div>
      <div class="filter-chips">
        <button class="filter-chip ${!filters.result || filters.result === 'all' ? 'active' : ''}" data-filter-result="all"   id="chip-all" aria-label="${t('filter_all')}">${t('filter_all')}</button>
        <button class="filter-chip chip-w ${filters.result === 'W' ? 'active' : ''}" data-filter-result="W" id="chip-w" aria-label="${t('victory')}">${t('victory')}</button>
        <button class="filter-chip chip-d ${filters.result === 'D' ? 'active' : ''}" data-filter-result="D" id="chip-d" aria-label="${t('draw')}">${t('draw')}</button>
        <button class="filter-chip chip-l ${filters.result === 'L' ? 'active' : ''}" data-filter-result="L" id="chip-l" aria-label="${t('defeat')}">${t('defeat')}</button>
      </div>
      <div id="match-list">${matchCards}</div>
    </div>
  `;
}

function renderMatchCard(match, players) {
  const result = getMatchResult(match.score);
  const badgeCls = result === 'W' ? 'badge-w' : result === 'D' ? 'badge-d' : 'badge-l';
  const badgeTxt = result === 'W' ? t('victory') : result === 'D' ? t('draw') : t('defeat');
  const mvpPlayer = match.mvp ? getPlayerById(players, match.mvp) : null;
  const goalCount = match.goals.length;

  return `
    <div class="match-card" data-match-id="${match.id}" id="match-card-${match.id}" role="button" tabindex="0" aria-label="Partit vs ${match.rival}, ${match.score[0]}-${match.score[1]}">
      <div class="match-card-top">
        <span class="match-rival">vs ${match.rival}</span>
        <span class="match-date">${formatDate(match.date)}</span>
      </div>
      <div class="match-score-row">
        <div class="match-score">
          <span class="us">${match.score[0]}</span>
          <span class="sep">–</span>
          <span class="them">${match.score[1]}</span>
        </div>
        <span class="match-badge ${badgeCls}">${badgeTxt}</span>
      </div>
      <div class="match-meta">
        ${mvpPlayer ? `<span class="match-mvp">⭐ ${mvpPlayer.name}</span>` : ''}
        <span class="match-goals-preview">⚽ ${goalCount} ${t('goals')}</span>
      </div>
    </div>
  `;
}

// ---- CALENDARI ----
function renderCalendari(state) {
  const { matches } = state;
  const played = matches.reduce((acc, m) => { acc[m.id] = m; return acc; }, {});
  const fullCalendar = getFullCalendar(state);

  let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
  fullCalendar.forEach(j => {
    if (j.matchId && played[j.matchId]) {
      const m = played[j.matchId];
      const r = getMatchResult(m.score);
      if (r === 'W') wins++;
      else if (r === 'D') draws++;
      else losses++;
      gf += m.score[0];
      ga += m.score[1];
    }
  });
  const pj = wins + draws + losses;
  const pts = wins * 3 + draws;

  const calItems = fullCalendar.map(j => {
    const match = j.matchId ? played[j.matchId] : null;
    if (!match) {
      const isPast = new Date(j.date) < new Date();
      const metaStr = j.time ? ` ⏱ ${j.time}` : '';
      return `
        <div class="cal-jornada pending" id="cal-j-${j.jornada}" aria-label="${t('jornada')} ${j.jornada} pendent">
          <p class="cal-j-num">J${j.jornada}</p>
          <p class="cal-j-rival">${j.rival}</p>
          <p class="cal-j-date">${formatDate(j.date)}${metaStr}</p>
          <p class="cal-j-score pend">${isPast ? '? – ?' : t('pending')}</p>
        </div>
      `;
    }
    const r = getMatchResult(match.score);
    const resCls = r === 'W' ? 'result-w' : r === 'D' ? 'result-d' : 'result-l';
    const scoreCls = r === 'W' ? 'win' : r === 'D' ? 'draw' : 'loss';
    return `
      <div class="cal-jornada ${resCls}" id="cal-j-${j.jornada}" data-match-id="${match.id}" role="button" tabindex="0" aria-label="${t('jornada')} ${j.jornada} vs ${j.rival}">
        <p class="cal-j-num">J${j.jornada}</p>
        <p class="cal-j-rival">${j.rival}</p>
        <p class="cal-j-date">${formatDate(j.date)}</p>
        <p class="cal-j-score ${scoreCls}">${match.score[0]} – ${match.score[1]}</p>
      </div>
    `;
  }).join('');

  return `
    <div class="section">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="font-family:var(--font-display); font-size:0.9rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary); margin:0;">📅 ${t('tab_calendar')}</h3>
        <button class="btn-primary" id="btn-open-schedule-modal" style="padding: 8px 14px; font-size: 0.8rem; border-radius: var(--radius-md); max-width: fit-content;">
          ➕ ${t('schedule_match')}
        </button>
      </div>

      <div class="season-stats-bar">
        <div><div class="ss-stat-val">${pj}</div><div class="ss-stat-lbl">${t('played').toUpperCase()}</div></div>
        <div><div class="ss-stat-val">${wins}–${draws}–${losses}</div><div class="ss-stat-lbl">${t('v_e_d')}</div></div>
        <div><div class="ss-stat-val">${gf}–${ga}</div><div class="ss-stat-lbl">GF–GC</div></div>
        <div><div class="ss-stat-val">${pts}</div><div class="ss-stat-lbl">Pts</div></div>
        <div><div class="ss-stat-val">${pj > 0 ? Math.round(gf/pj*10)/10 : 0}</div><div class="ss-stat-lbl">G/PJ</div></div>
        <div><div class="ss-stat-val">${pj > 0 ? Math.round(wins/pj*100) : 0}%</div><div class="ss-stat-lbl">WR</div></div>
      </div>
      <div class="calendar-grid">${calItems}</div>
    </div>
  `;
}

// ---- REGISTRAR ----
function renderRegistrarForm(state) {
  const playerOptions = state.players
    .map(p => `<option value="${p.id}">${p.emoji} ${p.name}</option>`)
    .join('');

  return `
    <div class="section">
      <div class="card">
        <form id="register-match-form" novalidate onsubmit="return false">
          <div class="form-group">
            <label class="form-label" for="reg-rival">${t('reg_rival')}</label>
            <input type="text" class="form-input" id="reg-rival" placeholder="${t('reg_rival')}..." required aria-required="true">
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-date">${t('reg_date')}</label>
            <input type="date" class="form-input" id="reg-date" value="${new Date().toISOString().split('T')[0]}" required aria-required="true">
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-duration">Durada del Partit (minuts) <span style="color:var(--text-muted);font-weight:400;">(opcional)</span></label>
            <input type="number" class="form-input" id="reg-duration" placeholder="ex: 90" min="1" max="200" aria-label="Durada en minuts" style="max-width:140px;">
          </div>

          <div class="form-group">
            <label class="form-label">${t('reg_result')}</label>
            <div class="score-inputs">
              <input type="number" class="form-input" id="reg-score-us" placeholder="${t('reg_score_us')}" min="0" max="99" required aria-label="${t('reg_score_us')}">
              <div class="score-sep">–</div>
              <input type="number" class="form-input" id="reg-score-them" placeholder="${t('reg_score_them')}" min="0" max="99" required aria-label="${t('reg_score_them')}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-mvp">${t('reg_mvp')}</label>
            <select class="form-select" id="reg-mvp" aria-label="${t('reg_mvp')}">
              <option value="">— ${t('reg_no_mvp')} —</option>
              ${playerOptions}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">${t('reg_goals')}</label>
            <div id="goals-list"></div>
            <button type="button" class="btn-add-goal" id="btn-add-goal" aria-label="${t('reg_add_goal')}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              ${t('reg_add_goal')}
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">${t('reg_assists')}</label>
            <div id="assists-list"></div>
            <button type="button" class="btn-add-goal" id="btn-add-assist" aria-label="${t('reg_add_assist')}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              ${t('reg_add_assist')}
            </button>
          </div>

          <button type="button" class="btn-primary" id="btn-register-match">
            ⚽ ${t('reg_submit')}
          </button>
        </form>
      </div>
    </div>
  `;
}

function addGoalEntry(containerId, players, type = 'goal') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const idx = container.children.length;
  const playerOpts = players.map(p => `<option value="${p.id}">${p.emoji} ${p.name}</option>`).join('');
  const div = document.createElement('div');
  div.className = 'goal-entry';
  div.dataset.idx = idx;
  div.innerHTML = `
    <select aria-label="${t('nav_players')}" class="goal-player">
      <option value="">— ${t('nav_players')} —</option>
      ${playerOpts}
    </select>
    <input type="number" min="1" max="120" placeholder="Min" class="goal-minute" aria-label="Minut" style="max-width:60px;">
    <button type="button" class="btn-remove-goal" aria-label="Eliminar">✕</button>
  `;
  div.querySelector('.btn-remove-goal').addEventListener('click', () => div.remove());
  container.appendChild(div);
}

// ---- ALINEACIÓ ----
function getActivePositions(state) {
  syncDragStateTeam();
  if (DRAG_STATE.activePositions) return DRAG_STATE.activePositions;
  const customFormations = (state && state.customFormations) || window.APP_STATE.customFormations || {};
  if (customFormations[DRAG_STATE.formation]) {
    DRAG_STATE.activePositions = JSON.parse(JSON.stringify(customFormations[DRAG_STATE.formation]));
  } else if (FORMATIONS[DRAG_STATE.formation]) {
    DRAG_STATE.activePositions = JSON.parse(JSON.stringify(FORMATIONS[DRAG_STATE.formation]));
  } else {
    DRAG_STATE.activePositions = JSON.parse(JSON.stringify(FORMATIONS['4-3-3']));
  }
  return DRAG_STATE.activePositions;
}

function renderAlineacio(state) {
  syncDragStateTeam();
  const upcomingJornades = getUpcomingJornades(state);
  const upcoming = (state.activeLineupJornada && upcomingJornades.find(j => String(j.jornada) === String(state.activeLineupJornada)))
    || upcomingJornades[0]
    || getUpcomingJornada(state);

  const isCollaMode = DRAG_STATE.viewMode === 'colla_proposals';

  const proposalsForJornada = (state.lineupProposals && state.lineupProposals[upcoming.jornada]) || {};
  const proposalCount = Object.keys(proposalsForJornada).length;

  const hasSpecificRival = upcoming.rival && upcoming.rival.trim().toLowerCase() !== 'rival' && upcoming.rival.trim() !== '';

  const matchSelectHTML = upcomingJornades.length > 1 ? `
    <div class="lineup-match-selector-wrapper" style="margin-bottom: 10px;">
      <label for="lineup-match-select" style="font-size: 0.7rem; font-family: var(--font-display); font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 4px;">
        🎯 Seleccionar Partit Programat:
      </label>
      <select id="lineup-match-select" class="form-select" style="padding: 8px 12px; font-size: 0.85rem; font-weight: 600; background: var(--bg-card); color: var(--text-primary); border-color: var(--border-subtle); width: 100%;">
        ${upcomingJornades.map(j => {
          const rStr = j.rival && j.rival.trim().toLowerCase() !== 'rival' ? 'vs ' + j.rival : 'Partit';
          return `
            <option value="${j.jornada}" ${String(j.jornada) === String(upcoming.jornada) ? 'selected' : ''}>
              ${rStr} (${formatDate(j.date)})
            </option>
          `;
        }).join('')}
      </select>
    </div>
  ` : '';

  const bannerHTML = `
    <div class="lineup-match-banner">
      ${matchSelectHTML}
      <div class="lmb-top">
        <div class="lmb-title-group">
          <h3 class="lmb-title">${hasSpecificRival ? 'vs <strong>' + upcoming.rival + '</strong>' : 'Partit Programat'}</h3>
          <span class="lmb-date">📅 ${formatDate(upcoming.date)}${upcoming.time ? ' ⏱ ' + upcoming.time : ''}</span>
        </div>
      </div>
      <div class="lmb-mode-selector">
        <button class="lmb-mode-btn ${!isCollaMode ? 'active' : ''}" data-view-mode="my_proposal">
          🙋 ${t('view_my_proposal')}
        </button>
        <button class="lmb-mode-btn ${isCollaMode ? 'active' : ''}" data-view-mode="colla_proposals">
          👥 ${t('view_colla_proposals')} <span class="proposal-count-pill">${proposalCount}</span>
        </button>
      </div>
    </div>
  `;

  if (isCollaMode) {
    return `
      <div class="tactical-wrapper">
        ${bannerHTML}
        ${renderCollaProposalsView(state, upcoming, proposalsForJornada)}
      </div>
    `;
  }

  const currentTeam = DRAG_STATE.currentTeam || 'teamA';
  const formation = DRAG_STATE.formation;
  const positions = getActivePositions(state);
  const editMode = DRAG_STATE.editMode;
  const customFormations = state.customFormations || {};
  const allFormationKeys = [
    ...Object.keys(FORMATIONS),
    ...Object.keys(customFormations),
  ];

  const formationBtns = allFormationKeys.map(f => {
    const isCustom = !FORMATIONS[f];
    return `
      <button class="formation-btn ${f === formation ? 'active' : ''} ${isCustom ? 'formation-btn-custom' : ''}" 
              data-formation="${f}" id="formation-btn-${f.replace(/[^a-z0-9]/gi,'-')}" 
              aria-label="Formació ${f}">
        ${isCustom ? '⭐ ' : ''}${f}
        ${isCustom ? `<span class="formation-delete-btn" data-delete-formation="${f}" title="Esborrar">✕</span>` : ''}
      </button>
    `;
  }).join('');

  const editToolbar = editMode ? `
    <div class="edit-mode-toolbar" id="edit-toolbar">
      <div class="edit-toolbar-left">
        <button class="btn-add-pos" id="btn-add-pos" ${positions.length >= 11 ? 'disabled' : ''} aria-label="${t('add_position')}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          ${t('add_position')} (${positions.length}/11)
        </button>
      </div>
      <div class="edit-toolbar-right">
        <div class="save-formation-group">
          <input type="text" class="save-formation-input" id="save-formation-name" placeholder="${t('formation_name')}" value="${formation && !FORMATIONS[formation] ? formation : ''}" maxlength="20" aria-label="${t('formation_name')}">
          <button class="btn-save-formation" id="btn-save-formation" aria-label="${t('save_formation')}">💾 ${t('save_formation')}</button>
        </div>
        <button class="btn-cancel-edit" id="btn-cancel-edit" aria-label="${t('cancel')}">✕ ${t('cancel')}</button>
      </div>
    </div>
  ` : '';

  const editToggleBtn = !editMode ? `
    <button class="btn-edit-positions" id="btn-edit-positions" aria-label="${t('edit_positions')}">
      ✏️ ${t('edit_positions')}
    </button>
  ` : '';

  return `
    <div class="tactical-wrapper">
      ${bannerHTML}

      <!-- Team Selector Switcher & AI Balance Button -->
      <div class="team-selector-card">
        <span class="tsc-label">${t('select_team_label')}</span>
        <div class="tsc-tabs">
          <button class="tsc-tab ${currentTeam === 'teamA' ? 'active' : ''}" data-team="teamA">
            ⚪ ${t('team_a')} <span class="tsc-badge">${DRAG_STATE.teamFormations.teamA || '4-3-3'}</span>
          </button>
          <button class="tsc-tab ${currentTeam === 'teamB' ? 'active' : ''}" data-team="teamB">
            ⬛ ${t('team_b')} <span class="tsc-badge">${DRAG_STATE.teamFormations.teamB || '4-3-3'}</span>
          </button>
        </div>
        <button class="btn-secondary" id="btn-suggest-balanced-teams" style="margin-top: 8px; font-size: 0.8rem; font-weight: 700; background: linear-gradient(135deg, rgba(103, 232, 249, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%); border: 1px solid var(--neon-dim); color: var(--text-primary); border-radius: 8px; padding: 8px 12px; cursor: pointer;">
          ${t('suggest_balanced_teams')}
        </button>
      </div>

      <div class="tactical-formation-selector" id="formation-selector">
        ${formationBtns}
      </div>

      ${editToggleBtn}
      ${editToolbar}

      <div class="field-container ${editMode ? 'edit-mode' : ''}" id="tactical-field">
        ${renderFieldSVG()}
        ${renderTacticalPositions(positions, state.players, editMode)}
      </div>

      <div style="margin-top: 14px; margin-bottom: 18px;">
        <button class="btn-primary btn-save-proposal" id="btn-save-proposal">
          ${t('save_proposal_btn')}
        </button>
      </div>

      <div class="tactical-player-selector">
        <h4>${editMode ? `✏️ ${t('edit_mode_active')}` : t('assign_players')} (${currentTeam === 'teamA' ? t('team_a') : t('team_b')})</h4>
        <div id="tactical-positions-list">
          ${editMode ? renderEditPositionsList(positions) : renderPositionAssignments(positions, state.players)}
        </div>
      </div>
    </div>
  `;
}

function renderCollaProposalsView(state, upcoming, proposals) {
  const proposalList = Object.values(proposals);

  if (proposalList.length === 0) {
    return `
      <div class="empty-state" style="padding: 40px 20px;">
        <div class="empty-state-icon">👥</div>
        <p class="empty-state-text">${t('no_proposals_yet')}</p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px;">
          Sigues el primer a crear i desar el teu suggeriment per a aquest partit!
        </p>
      </div>
    `;
  }

  // Count formation votes
  const votesA = {};
  const votesB = {};
  proposalList.forEach(p => {
    const fA = p.teamA ? p.teamA.formation : '4-3-3';
    const fB = p.teamB ? p.teamB.formation : '4-3-3';
    votesA[fA] = (votesA[fA] || 0) + 1;
    votesB[fB] = (votesB[fB] || 0) + 1;
  });

  const topFormA = Object.entries(votesA).sort((a, b) => b[1] - a[1])[0];
  const topFormB = Object.entries(votesB).sort((a, b) => b[1] - a[1])[0];

  const cardsHTML = proposalList.map(p => {
    const timeStr = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    const avatar = p.userPhoto
      ? `<img src="${p.userPhoto}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
      : `<span style="font-size:1.2rem;">${p.userEmoji || '👤'}</span>`;

    return `
      <div class="colla-proposal-card">
        <div class="cpc-header">
          <div class="cpc-user">
            <div class="cpc-avatar">${avatar}</div>
            <div>
              <span class="cpc-name">${p.userName}</span>
              <span class="cpc-time">${timeStr}</span>
            </div>
          </div>
          <button class="btn-secondary btn-sm" data-load-proposal="${p.userId}">
            🔍 Carregar suggeriment
          </button>
        </div>
        <div class="cpc-formations-summary">
          <div class="cpc-team-summary">
            <span class="cpc-team-tag">⚪ Equip A</span>
            <span class="cpc-form-val">${p.teamA ? p.teamA.formation : '4-3-3'}</span>
          </div>
          <div class="cpc-team-summary">
            <span class="cpc-team-tag">⬛ Equip B</span>
            <span class="cpc-form-val">${p.teamB ? p.teamB.formation : '4-3-3'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="colla-proposals-container">
      <div class="colla-summary-stats">
        <div class="css-stat-card">
          <span class="css-stat-lbl">⚪ ${t('most_voted_formation')} (Equip A)</span>
          <span class="css-stat-val">${topFormA ? `${topFormA[0]} (${topFormA[1]} vots)` : '—'}</span>
        </div>
        <div class="css-stat-card">
          <span class="css-stat-lbl">⬛ ${t('most_voted_formation')} (Equip B)</span>
          <span class="css-stat-val">${topFormB ? `${topFormB[0]} (${topFormB[1]} vots)` : '—'}</span>
        </div>
      </div>

      <h4 style="margin: 18px 0 10px; font-family: var(--font-display); font-size: 0.85rem; text-transform: uppercase; color: var(--text-muted);">
        ${t('colla_proposals_title')} (${proposalList.length})
      </h4>
      <div class="colla-proposals-list">
        ${cardsHTML}
      </div>
    </div>
  `;
}

function renderFieldSVG() {
  return `
    <svg class="field-svg" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#0d2c14"/>
          <stop offset="50%"  stop-color="#0f3016"/>
          <stop offset="100%" stop-color="#0d2c14"/>
        </linearGradient>
        <pattern id="stripes" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="15" height="30" fill="rgba(255,255,255,0.02)"/>
        </pattern>
      </defs>
      <rect width="300" height="420" fill="url(#grassGrad)"/>
      <rect width="300" height="420" fill="url(#stripes)"/>

      <rect x="15" y="15" width="270" height="390" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" rx="2"/>
      <line x1="15" y1="210" x2="285" y2="210" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <circle cx="150" cy="210" r="35" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <circle cx="150" cy="210" r="2" fill="rgba(255,255,255,0.3)"/>

      <rect x="75" y="15" width="150" height="60" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <rect x="110" y="15" width="80" height="25" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <circle cx="150" cy="57" r="2" fill="rgba(255,255,255,0.25)"/>
      <path d="M 115 75 A 35 35 0 0 1 185 75" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

      <rect x="75" y="345" width="150" height="60" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <rect x="110" y="380" width="80" height="25" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <circle cx="150" cy="363" r="2" fill="rgba(255,255,255,0.25)"/>
      <path d="M 115 345 A 35 35 0 0 0 185 345" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

      <path d="M 15 30 A 10 10 0 0 1 30 15" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <path d="M 270 15 A 10 10 0 0 1 285 30" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <path d="M 285 390 A 10 10 0 0 1 270 405" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <path d="M 30 405 A 10 10 0 0 1 15 390" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>

      <rect x="120" y="8" width="60" height="10" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <rect x="120" y="402" width="60" height="10" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    </svg>
  `;
}

// Renders draggable position tokens on the field
function renderTacticalPositions(positions, players, editMode) {
  return positions.map((pos) => {
    const assignedId = DRAG_STATE.playerPositions[pos.pos];
    const player = assignedId ? players.find(p => p.id === assignedId) : null;
    const display = player ? (player.photo ? `<img src="${player.photo}" alt="${player.name}">` : player.emoji) : (editMode ? '' : '?');
    const name = player ? player.name : (editMode ? '' : pos.label);
    const bg = player ? 'var(--neon)' : (editMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)');
    const color = player ? '#000' : 'rgba(255,255,255,0.6)';
    const posLabel = editMode
      ? `<input type="text" class="pos-label-input" data-pos-label="${pos.pos}" value="${pos.label}" maxlength="4" aria-label="Nom de la posició" />`
      : `<span class="tactical-player-pos">${pos.label}</span>`;
    const removeBtn = editMode
      ? `<button class="btn-remove-pos" data-remove-pos="${pos.pos}" aria-label="Eliminar posició ${pos.label}">✕</button>`
      : '';

    return `
      <div class="tactical-player ${editMode ? 'edit-mode-pos' : ''}" id="tp-${pos.pos}"
           style="left:${pos.x}%;top:${pos.y}%;background:transparent;"
           data-pos="${pos.pos}" data-x="${pos.x}" data-y="${pos.y}">
        ${removeBtn}
        <div class="tactical-player-avatar" style="background:${bg};color:${color};">
          ${display}
          ${posLabel}
        </div>
        ${!editMode ? `<span class="tactical-player-name">${name}</span>` : ''}
      </div>
    `;
  }).join('');
}

// Legacy alias (still used by assignment sync)
function renderTacticalPlayers(positions, players) {
  return renderTacticalPositions(positions, players, false);
}

function renderEditPositionsList(positions) {
  return `
    <div class="edit-positions-hint">
      ${t('edit_mode_hint')}
    </div>
    <div class="edit-positions-summary">
      ${positions.map(p => `
        <span class="edit-pos-chip" id="chip-${p.pos}">${p.label}</span>
      `).join('')}
    </div>
  `;
}

function renderPositionAssignments(positions, players) {
  const playerOpts = players.map(p => `<option value="${p.id}">${p.emoji} ${p.name}</option>`).join('');
  return positions.map(pos => {
    const assignedId = DRAG_STATE.playerPositions[pos.pos] || '';
    return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:0.7rem;font-family:var(--font-display);font-weight:700;color:var(--neon);width:30px;flex-shrink:0;">${pos.label}</span>
        <select class="form-select" style="flex:1;padding:8px 12px;font-size:0.8rem;" data-position="${pos.pos}" id="pos-select-${pos.pos}" aria-label="Assignar jugador a ${pos.label}">
          <option value="">— ${t('no_assign')} —</option>
          ${playerOpts}
        </select>
      </div>
    `;
  }).join('');
}

function initPartits(state) {
  // Tab switching
  const tabBtns = document.querySelectorAll('#partits-tabs .tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      state.partitsTab = tab;
      tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      document.querySelectorAll('#page-partits .tab-content').forEach(c => c.classList.remove('active'));
      const activeContent = document.getElementById(`tab-content-${tab}`);
      if (activeContent) activeContent.classList.add('active');

      // Re-init tab-specific things
      if (tab === 'historial')  initHistorial(state);
      if (tab === 'calendari')  initCalendari(state);
      if (tab === 'registrar')  initRegistrar(state);
      if (tab === 'alineacio')  initAlineacio(state);
    });
  });

  // Init active tab
  const activeTab = state.partitsTab || 'historial';
  if (activeTab === 'historial')  initHistorial(state);
  if (activeTab === 'calendari')  initCalendari(state);
  if (activeTab === 'registrar')  initRegistrar(state);
  if (activeTab === 'alineacio')  initAlineacio(state);
}

function initHistorial(state) {
  // Match card click → modal
  document.querySelectorAll('#tab-content-historial .match-card').forEach(el => {
    el.addEventListener('click', () => {
      const mid = parseInt(el.dataset.matchId);
      const match = state.matches.find(m => m.id === mid);
      if (match) openMatchModal(match, state.players);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') el.click();
    });
  });

  // Filters
  const filterRival = document.getElementById('filter-rival');
  const filterFrom  = document.getElementById('filter-date-from');
  const filterTo    = document.getElementById('filter-date-to');
  const chips = document.querySelectorAll('#tab-content-historial .filter-chip');

  const applyFilters = () => {
    state.historialFilters = {
      rival:    filterRival ? filterRival.value : '',
      dateFrom: filterFrom  ? filterFrom.value  : '',
      dateTo:   filterTo    ? filterTo.value    : '',
      result:   state.historialFilters.result || 'all',
    };
    refreshHistorial(state);
  };

  if (filterRival) filterRival.addEventListener('input', applyFilters);
  if (filterFrom)  filterFrom.addEventListener('change', applyFilters);
  if (filterTo)    filterTo.addEventListener('change', applyFilters);

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      state.historialFilters.result = chip.dataset.filterResult;
      applyFilters();
    });
  });
}

function refreshHistorial(state) {
  const content = document.getElementById('tab-content-historial');
  if (!content) return;
  content.innerHTML = renderHistorial(state);
  initHistorial(state);
}

function openScheduleMatchModal(state) {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const content = `
    <div class="modal-header">
      <div class="modal-title">${t('schedule_match_title')}</div>
      <button class="modal-close" id="modal-close-btn" aria-label="${t('close')}">✕</button>
    </div>
    <div class="modal-body">
      <form id="schedule-match-form" novalidate onsubmit="return false">
        <div class="form-group">
          <label class="form-label" for="sched-rival">${t('reg_rival')} *</label>
          <input type="text" class="form-input" id="sched-rival" placeholder="ex: FC Rival" required aria-required="true">
        </div>

        <div class="form-group">
          <label class="form-label" for="sched-date">${t('reg_date')} *</label>
          <input type="date" class="form-input" id="sched-date" value="${defaultDateStr}" required aria-required="true">
        </div>

        <div class="form-group">
          <label class="form-label" for="sched-time">${t('match_time')}</label>
          <input type="time" class="form-input" id="sched-time" value="20:00" style="max-width:140px;">
        </div>

        <div class="form-group">
          <label class="form-label" for="sched-location">${t('match_location')}</label>
          <input type="text" class="form-input" id="sched-location" placeholder="ex: Camp Municipal Pista 2">
        </div>

        <div class="form-group">
          <label class="form-label" for="sched-notes">${t('match_notes')}</label>
          <input type="text" class="form-input" id="sched-notes" placeholder="ex: Pachanga 7v7 (Equips Blancs vs Negres)">
        </div>

        <button type="button" class="btn-primary" id="btn-submit-schedule" style="margin-top:10px;">
          📅 ${t('schedule_submit')}
        </button>
      </form>
    </div>
  `;

  openModal(content);

  const btnSubmit = document.getElementById('btn-submit-schedule');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => {
      const rival = document.getElementById('sched-rival')?.value.trim();
      const date = document.getElementById('sched-date')?.value;
      const time = document.getElementById('sched-time')?.value || '';
      const location = document.getElementById('sched-location')?.value.trim() || '';
      const notes = document.getElementById('sched-notes')?.value.trim() || '';

      if (!rival || !date) {
        showToast(t('reg_fill_fields'));
        return;
      }

      if (!state.customCalendar) state.customCalendar = [];
      const nextJornadaNum = getFullCalendar(state).length + 1;

      const newScheduledMatch = {
        id: 'sched_' + Date.now(),
        jornada: nextJornadaNum,
        date,
        rival,
        time,
        location,
        notes,
        matchId: null
      };

      state.customCalendar.push(newScheduledMatch);
      saveState(state);
      closeModal();
      showToast(`✅ ${t('schedule_success')}`);

      // Re-render current page
      renderPage(state.currentPage, state);
    });
  }
}

function initCalendari(state) {
  const btnSchedule = document.getElementById('btn-open-schedule-modal');
  if (btnSchedule) {
    btnSchedule.addEventListener('click', () => openScheduleMatchModal(state));
  }

  document.querySelectorAll('#tab-content-calendari .cal-jornada[data-match-id]').forEach(el => {
    el.addEventListener('click', () => {
      const mid = parseInt(el.dataset.matchId);
      const match = state.matches.find(m => m.id === mid);
      if (match) openMatchModal(match, state.players);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') el.click();
    });
  });
}

function initRegistrar(state) {
  const btnAddGoal    = document.getElementById('btn-add-goal');
  const btnAddAssist  = document.getElementById('btn-add-assist');
  const btnRegister   = document.getElementById('btn-register-match');

  if (btnAddGoal)   btnAddGoal.addEventListener('click',   () => addGoalEntry('goals-list',   state.players, 'goal'));
  if (btnAddAssist) btnAddAssist.addEventListener('click', () => addGoalEntry('assists-list', state.players, 'assist'));

  // Use button click instead of form submit to avoid file:// URL navigation restrictions
  if (btnRegister) {
    btnRegister.addEventListener('click', () => {
      try {
        const rival  = document.getElementById('reg-rival')?.value.trim();
        const date   = document.getElementById('reg-date')?.value;
        const us     = parseInt(document.getElementById('reg-score-us')?.value);
        const them   = parseInt(document.getElementById('reg-score-them')?.value);
        const mvpVal = document.getElementById('reg-mvp')?.value;

        console.log('[Registrar] submit - rival:', rival, 'date:', date, 'us:', us, 'them:', them);

        if (!rival || !date || isNaN(us) || isNaN(them)) {
          showToast(t('reg_fill_fields'));
          return;
        }

        const goals = [];
        document.querySelectorAll('#goals-list .goal-entry').forEach(entry => {
          const pid = parseInt(entry.querySelector('.goal-player')?.value);
          const min = parseInt(entry.querySelector('.goal-minute')?.value) || 0;
          if (pid) goals.push({ player: pid, minute: min });
        });

        const assists = [];
        document.querySelectorAll('#assists-list .goal-entry').forEach(entry => {
          const pid = parseInt(entry.querySelector('.goal-player')?.value);
          const min = parseInt(entry.querySelector('.goal-minute')?.value) || 0;
          if (pid) assists.push({ player: pid, minute: min });
        });

        const durRaw = parseInt(document.getElementById('reg-duration')?.value);
        const newMatch = {
          id: Date.now(),
          rival,
          date,
          score: [us, them],
          mvp: mvpVal ? parseInt(mvpVal) : null,
          goals,
          assists,
          duration: isNaN(durRaw) ? null : durRaw,
        };

        console.log('[Registrar] newMatch:', newMatch);

        // Add match and update ELO
        state.matches.push(newMatch);
        state.players = ELO.processMatch(state.players, newMatch);
        saveState(state);

        showToast(`✅ ${t('reg_success')}`);
        state.partitsTab = 'historial';

        // Re-render partits page
        const page = document.getElementById('page-partits');
        page.innerHTML = renderPartits(state);
        initPartits(state);
      } catch (err) {
        console.error('[Registrar] Error al registrar partit:', err);
        showToast('❌ Error al registrar. Revisa la consola.');
      }
    });
  }
}


function getActivePositionsForTeam(teamKey, state) {
  const customFormations = (state && state.customFormations) || window.APP_STATE.customFormations || {};
  const formationKey = (DRAG_STATE.teamFormations && DRAG_STATE.teamFormations[teamKey]) || '4-3-3';
  if (customFormations[formationKey]) {
    return JSON.parse(JSON.stringify(customFormations[formationKey]));
  } else if (FORMATIONS[formationKey]) {
    return JSON.parse(JSON.stringify(FORMATIONS[formationKey]));
  }
  return JSON.parse(JSON.stringify(FORMATIONS['4-3-3']));
}

function suggestBalancedTeams(state) {
  const players = state.players || [];
  if (players.length < 2) return;

  // Calculate composite skill score incorporating ELO, goals/game, assists/game, winRate
  const scoredPlayers = players.map(p => {
    const pj = p.matches || 1;
    const goalsPerGame = p.goals / pj;
    const assistsPerGame = p.assists / pj;
    const winRate = getWinRate(p);
    const score = p.elo + (goalsPerGame * 50) + (assistsPerGame * 40) + (winRate * 2);
    return { ...p, score };
  });

  // Sort by composite skill score descending
  scoredPlayers.sort((a, b) => b.score - a.score);

  // Snake draft partitioning into Team A and Team B to equalize average ELO/score
  const teamAPlayers = [];
  const teamBPlayers = [];
  let sumA = 0;
  let sumB = 0;

  scoredPlayers.forEach((p, idx) => {
    if (sumA <= sumB) {
      teamAPlayers.push(p);
      sumA += p.score;
    } else {
      teamBPlayers.push(p);
      sumB += p.score;
    }
  });

  const posA = getActivePositionsForTeam('teamA', state);
  const posB = getActivePositionsForTeam('teamB', state);

  const teamAPositionsMap = {};
  posA.forEach((posObj, idx) => {
    if (teamAPlayers[idx]) {
      teamAPositionsMap[posObj.pos] = teamAPlayers[idx].id;
    }
  });

  const teamBPositionsMap = {};
  posB.forEach((posObj, idx) => {
    if (teamBPlayers[idx]) {
      teamBPositionsMap[posObj.pos] = teamBPlayers[idx].id;
    }
  });

  if (!DRAG_STATE.teamPositions) DRAG_STATE.teamPositions = {};
  DRAG_STATE.teamPositions.teamA = teamAPositionsMap;
  DRAG_STATE.teamPositions.teamB = teamBPositionsMap;

  syncDragStateTeam();

  const avgEloA = Math.round(teamAPlayers.reduce((sum, p) => sum + p.elo, 0) / (teamAPlayers.length || 1));
  const avgEloB = Math.round(teamBPlayers.reduce((sum, p) => sum + p.elo, 0) / (teamBPlayers.length || 1));

  showToast(`⚖️ Equips equilibrats generats! (Elo mitjà: ⚪ ${avgEloA} vs ⬛ ${avgEloB})`);
}


function initAlineacio(state) {
  const tabEl = document.getElementById('tab-content-alineacio');

  function rerender() {
    if (tabEl) {
      tabEl.innerHTML = renderAlineacio(state);
      initAlineacio(state);
    }
  }

  // --- Smart Balanced Team Generator ---
  const btnSuggestTeams = document.getElementById('btn-suggest-balanced-teams');
  if (btnSuggestTeams) {
    btnSuggestTeams.addEventListener('click', () => {
      suggestBalancedTeams(state);
      DRAG_STATE.activePositions = null;
      rerender();
    });
  }

  // --- Match Selector (when multiple upcoming matches exist) ---
  const matchSelect = document.getElementById('lineup-match-select');
  if (matchSelect) {
    matchSelect.addEventListener('change', () => {
      state.activeLineupJornada = matchSelect.value;
      // Reset team drag state when switching matches
      DRAG_STATE.activePositions = null;
      DRAG_STATE.teamPositions = { teamA: {}, teamB: {} };
      DRAG_STATE.currentTeam = 'teamA';
      syncDragStateTeam();
      rerender();
    });
  }

  // --- View Mode Switcher (My proposal vs Colla proposals) ---
  document.querySelectorAll('[data-view-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      DRAG_STATE.viewMode = btn.dataset.viewMode;
      rerender();
    });
  });

  // --- Team Selector Switcher (Equip A vs Equip B) ---
  document.querySelectorAll('[data-team]').forEach(btn => {
    btn.addEventListener('click', () => {
      DRAG_STATE.currentTeam = btn.dataset.team;
      syncDragStateTeam();
      DRAG_STATE.activePositions = null;
      rerender();
    });
  });

  // --- Save Proposal Button ---
  const btnSaveProposal = document.getElementById('btn-save-proposal');
  if (btnSaveProposal) {
    btnSaveProposal.addEventListener('click', () => {
      const upcomingList = getUpcomingJornades(state);
      const upcoming = (state.activeLineupJornada && upcomingList.find(j => String(j.jornada) === String(state.activeLineupJornada)))
        || upcomingList[0]
        || getUpcomingJornada(state);
      const jornadaKey = upcoming.jornada;
      if (!state.lineupProposals) state.lineupProposals = {};
      if (!state.lineupProposals[jornadaKey]) state.lineupProposals[jornadaKey] = {};

      const userIdKey = state.currentUserId || 'guest';
      const currentUser = state.players.find(p => p.id === state.currentUserId);

      state.lineupProposals[jornadaKey][userIdKey] = {
        userId: userIdKey,
        userName: currentUser ? currentUser.name : (t('guest_short') || 'Convidat'),
        userEmoji: currentUser ? (currentUser.emoji || '👤') : '👤',
        userPhoto: currentUser ? currentUser.photo : null,
        updatedAt: new Date().toISOString(),
        teamA: {
          formation: DRAG_STATE.teamFormations.teamA || '4-3-3',
          positions: { ...(DRAG_STATE.teamPositions.teamA || {}) }
        },
        teamB: {
          formation: DRAG_STATE.teamFormations.teamB || '4-3-3',
          positions: { ...(DRAG_STATE.teamPositions.teamB || {}) }
        }
      };

      saveState(state);
      showToast(t('proposal_saved_toast') || '✅ El teu suggeriment s\'ha desat!');
      rerender();
    });
  }

  // --- Load Teammate Proposal Button ---
  document.querySelectorAll('[data-load-proposal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetUserId = btn.dataset.loadProposal;
      const upcomingList = getUpcomingJornades(state);
      const upcoming = (state.activeLineupJornada && upcomingList.find(j => String(j.jornada) === String(state.activeLineupJornada)))
        || upcomingList[0]
        || getUpcomingJornada(state);
      const proposals = (state.lineupProposals && state.lineupProposals[upcoming.jornada]) || {};
      const prop = proposals[targetUserId];

      if (prop) {
        if (!DRAG_STATE.teamFormations) DRAG_STATE.teamFormations = {};
        if (!DRAG_STATE.teamPositions) DRAG_STATE.teamPositions = {};

        DRAG_STATE.teamFormations.teamA = prop.teamA ? prop.teamA.formation : '4-3-3';
        DRAG_STATE.teamFormations.teamB = prop.teamB ? prop.teamB.formation : '4-3-3';
        DRAG_STATE.teamPositions.teamA = prop.teamA ? JSON.parse(JSON.stringify(prop.teamA.positions)) : {};
        DRAG_STATE.teamPositions.teamB = prop.teamB ? JSON.parse(JSON.stringify(prop.teamB.positions)) : {};

        DRAG_STATE.viewMode = 'my_proposal';
        syncDragStateTeam();
        DRAG_STATE.activePositions = null;
        rerender();
        showToast(`📐 Carregat el suggeriment de ${prop.userName}!`);
      }
    });
  });

  // --- Formation selector ---
  document.querySelectorAll('.formation-btn').forEach(btn => {
    // Delete custom formation button inside
    const deleteBtn = btn.querySelector('[data-delete-formation]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fname = deleteBtn.dataset.deleteFormation;
        delete state.customFormations[fname];
        saveState(state);
        if (DRAG_STATE.formation === fname) {
          const team = DRAG_STATE.currentTeam || 'teamA';
          DRAG_STATE.teamFormations[team] = '4-3-3';
          DRAG_STATE.formation = '4-3-3';
          DRAG_STATE.activePositions = null;
        }
        rerender();
        showToast(`${t('formation_deleted')} (${fname})`);
      });
    }

    btn.addEventListener('click', (e) => {
      if (e.target.closest('[data-delete-formation]')) return;
      const f = btn.dataset.formation;
      const team = DRAG_STATE.currentTeam || 'teamA';
      DRAG_STATE.teamFormations[team] = f;
      DRAG_STATE.formation = f;
      DRAG_STATE.teamPositions[team] = {};
      DRAG_STATE.playerPositions = DRAG_STATE.teamPositions[team];
      DRAG_STATE.activePositions = null;
      DRAG_STATE.editMode = false;
      rerender();
    });
  });

  // --- Edit mode toggle ---
  const btnEdit = document.getElementById('btn-edit-positions');
  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      DRAG_STATE.editMode = true;
      DRAG_STATE.activePositions = getActivePositions(state);
      rerender();
    });
  }

  // --- Cancel edit ---
  const btnCancel = document.getElementById('btn-cancel-edit');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      DRAG_STATE.editMode = false;
      // Restore positions from saved formation
      DRAG_STATE.activePositions = null;
      rerender();
    });
  }

  // --- Save formation ---
  const btnSave = document.getElementById('btn-save-formation');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const nameInput = document.getElementById('save-formation-name');
      const fname = nameInput ? nameInput.value.trim() : '';
      if (!fname) {
        showToast(t('reg_fill_fields'));
        return;
      }
      const positions = getActivePositions(state);
      state.customFormations[fname] = JSON.parse(JSON.stringify(positions));
      const team = DRAG_STATE.currentTeam || 'teamA';
      DRAG_STATE.teamFormations[team] = fname;
      DRAG_STATE.formation = fname;
      DRAG_STATE.activePositions = null;
      DRAG_STATE.editMode = false;
      saveState(state);
      rerender();
      showToast(`✅ ${t('formation_saved')} (${fname})`);
    });
  }

  // --- Add position ---
  const btnAddPos = document.getElementById('btn-add-pos');
  if (btnAddPos) {
    btnAddPos.addEventListener('click', () => {
      const positions = getActivePositions(state);
      if (positions.length >= 11) return;
      const newId = 'P' + (DRAG_STATE.nextPosId++);
      positions.push({ pos: newId, x: 50, y: 50, label: 'POS' });
      rerender();
    });
  }

  // --- Remove position buttons ---
  document.querySelectorAll('[data-remove-pos]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const posId = btn.dataset.removePos;
      const positions = getActivePositions(state);
      const idx = positions.findIndex(p => p.pos === posId);
      if (idx !== -1) positions.splice(idx, 1);
      delete DRAG_STATE.playerPositions[posId];
      rerender();
    });
  });

  // --- Label inputs (edit mode) ---
  document.querySelectorAll('[data-pos-label]').forEach(input => {
    input.addEventListener('input', () => {
      const posId = input.dataset.posLabel;
      const positions = getActivePositions(state);
      const pos = positions.find(p => p.pos === posId);
      if (pos) pos.label = input.value.toUpperCase().slice(0, 4);
      // Update chip in the sidebar
      const chip = document.getElementById(`chip-${posId}`);
      if (chip) chip.textContent = input.value || posId;
    });
    // Prevent drag from triggering when typing in input
    input.addEventListener('pointerdown', e => e.stopPropagation());
  });

  // --- Position assignment selects (non-edit mode) ---
  document.querySelectorAll('[data-position]').forEach(sel => {
    sel.addEventListener('change', () => {
      const pos = sel.dataset.position;
      const pid = sel.value ? parseInt(sel.value) : null;
      if (pid) {
        Object.keys(DRAG_STATE.playerPositions).forEach(p => {
          if (DRAG_STATE.playerPositions[p] === pid) delete DRAG_STATE.playerPositions[p];
        });
        DRAG_STATE.playerPositions[pos] = pid;
      } else {
        delete DRAG_STATE.playerPositions[pos];
      }

      // Sync other selects
      const positions = getActivePositions(state);
      positions.forEach(p => {
        const selectEl = document.getElementById(`pos-select-${p.pos}`);
        if (selectEl) selectEl.value = DRAG_STATE.playerPositions[p.pos] || '';
      });

      // Re-render player tokens on field
      const field = document.getElementById('tactical-field');
      if (field) {
        field.querySelectorAll('.tactical-player').forEach(el => el.remove());
        const wrapper = document.createElement('div');
        wrapper.innerHTML = renderTacticalPositions(positions, state.players, false);
        while (wrapper.firstChild) field.appendChild(wrapper.firstChild);
        initDragDrop(field, state);
      }
    });
  });

  // Initialize drag & drop for field
  const field = document.getElementById('tactical-field');
  if (field) initDragDrop(field, state);
}

function initDragDrop(field, state) {
  const editMode = DRAG_STATE.editMode;
  const players = field.querySelectorAll('.tactical-player');

  players.forEach(playerEl => {
    let isDragging = false;
    let startClientX, startClientY;
    let startLeft, startTop;

    const onPointerDown = (e) => {
      // Don't drag when clicking remove-pos button or label input
      if (e.target.closest('[data-remove-pos]') || e.target.tagName === 'INPUT') return;
      e.preventDefault();
      isDragging = true;
      playerEl.classList.add('dragging');
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startClientX = clientX;
      startClientY = clientY;
      startLeft = parseFloat(playerEl.dataset.x);
      startTop  = parseFloat(playerEl.dataset.y);

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const rect = field.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = ((clientX - startClientX) / rect.width)  * 100;
      const dy = ((clientY - startClientY) / rect.height) * 100;
      const newX = Math.max(5, Math.min(95, startLeft + dx));
      const newY = Math.max(5, Math.min(95, startTop  + dy));
      playerEl.style.left = `${newX}%`;
      playerEl.style.top  = `${newY}%`;
      playerEl.dataset.x  = newX;
      playerEl.dataset.y  = newY;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      playerEl.classList.remove('dragging');

      // Persist position to activePositions (works in both normal and edit mode)
      const posId = playerEl.dataset.pos;
      const newX  = parseFloat(playerEl.dataset.x);
      const newY  = parseFloat(playerEl.dataset.y);
      const positions = getActivePositions(state);
      const posObj = positions.find(p => p.pos === posId);
      if (posObj) {
        posObj.x = newX;
        posObj.y = newY;
      }

      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);
    };

    playerEl.addEventListener('pointerdown', onPointerDown);
    playerEl.addEventListener('touchstart', onPointerDown, { passive: false });
  });
}
