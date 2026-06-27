// ============================================================
//  COMPONENTS/PARTITS.JS — Pàgina de partits (4 tabs)
// ============================================================

// Drag state for tactical editor
const DRAG_STATE = {
  dragging: null,
  playerPositions: {},   // { posId: playerId }
  formation: '4-3-3',
  activePositions: null, // working copy of positions array [{pos,x,y,label}]
  editMode: false,       // true = editing positions
  nextPosId: 100,        // auto-increment for new custom positions
};

function renderPartits(state) {
  const activeTab = state.partitsTab || 'historial';
  return `
    <div class="page-header">
      <h1>Partits</h1>
      <span class="header-badge">${state.matches.length} jugats</span>
    </div>

    <div class="tabs" role="tablist" id="partits-tabs">
      <button class="tab-btn ${activeTab === 'historial'  ? 'active' : ''}" data-tab="historial"  role="tab" id="tab-historial"  aria-selected="${activeTab==='historial'}">Historial</button>
      <button class="tab-btn ${activeTab === 'calendari'  ? 'active' : ''}" data-tab="calendari"  role="tab" id="tab-calendari"  aria-selected="${activeTab==='calendari'}">Calendari</button>
      <button class="tab-btn ${activeTab === 'registrar'  ? 'active' : ''}" data-tab="registrar"  role="tab" id="tab-registrar"  aria-selected="${activeTab==='registrar'}">Registrar</button>
      <button class="tab-btn ${activeTab === 'alineacio'  ? 'active' : ''}" data-tab="alineacio"  role="tab" id="tab-alineacio"  aria-selected="${activeTab==='alineacio'}">Alineació</button>
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
    : `<div class="empty-state"><div class="empty-state-icon">🔍</div><p class="empty-state-text">Cap partit trobat amb aquests filtres</p></div>`;

  return `
    <div class="section">
      <div class="filters-row">
        <input type="text" class="filter-input" id="filter-rival" placeholder="Cercar rival..." value="${filters.rival || ''}" aria-label="Filtrar per rival">
        <input type="date" class="filter-input" id="filter-date-from" value="${filters.dateFrom || ''}" style="max-width:140px;" aria-label="Data des de">
        <input type="date" class="filter-input" id="filter-date-to"   value="${filters.dateTo || ''}" style="max-width:140px;" aria-label="Data fins a">
      </div>
      <div class="filter-chips">
        <button class="filter-chip ${!filters.result || filters.result === 'all' ? 'active' : ''}" data-filter-result="all"   id="chip-all" aria-label="Tots">Tots</button>
        <button class="filter-chip chip-w ${filters.result === 'W' ? 'active' : ''}" data-filter-result="W" id="chip-w" aria-label="Victòries">Victòria</button>
        <button class="filter-chip chip-d ${filters.result === 'D' ? 'active' : ''}" data-filter-result="D" id="chip-d" aria-label="Empats">Empat</button>
        <button class="filter-chip chip-l ${filters.result === 'L' ? 'active' : ''}" data-filter-result="L" id="chip-l" aria-label="Derrotes">Derrota</button>
      </div>
      <div id="match-list">${matchCards}</div>
    </div>
  `;
}

function renderMatchCard(match, players) {
  const result = getMatchResult(match.score);
  const badgeCls = result === 'W' ? 'badge-w' : result === 'D' ? 'badge-d' : 'badge-l';
  const badgeTxt = result === 'W' ? 'Victòria' : result === 'D' ? 'Empat' : 'Derrota';
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
        <span class="match-goals-preview">⚽ ${goalCount} gol${goalCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  `;
}

// ---- CALENDARI ----
function renderCalendari(state) {
  const { matches } = state;
  const played = matches.reduce((acc, m) => { acc[m.id] = m; return acc; }, {});

  let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
  SEASON_CALENDAR.forEach(j => {
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

  const calItems = SEASON_CALENDAR.map(j => {
    const match = j.matchId ? played[j.matchId] : null;
    if (!match) {
      const isPast = new Date(j.date) < new Date();
      return `
        <div class="cal-jornada pending" id="cal-j-${j.jornada}" aria-label="Jornada ${j.jornada} pendent">
          <p class="cal-j-num">J${j.jornada}</p>
          <p class="cal-j-rival">${j.rival}</p>
          <p class="cal-j-date">${formatDate(j.date)}</p>
          <p class="cal-j-score pend">${isPast ? '? – ?' : 'Pendent'}</p>
        </div>
      `;
    }
    const r = getMatchResult(match.score);
    const resCls = r === 'W' ? 'result-w' : r === 'D' ? 'result-d' : 'result-l';
    const scoreCls = r === 'W' ? 'win' : r === 'D' ? 'draw' : 'loss';
    return `
      <div class="cal-jornada ${resCls}" id="cal-j-${j.jornada}" data-match-id="${match.id}" role="button" tabindex="0" aria-label="Jornada ${j.jornada} vs ${j.rival}">
        <p class="cal-j-num">J${j.jornada}</p>
        <p class="cal-j-rival">${j.rival}</p>
        <p class="cal-j-date">${formatDate(j.date)}</p>
        <p class="cal-j-score ${scoreCls}">${match.score[0]} – ${match.score[1]}</p>
      </div>
    `;
  }).join('');

  return `
    <div class="section">
      <div class="season-stats-bar">
        <div><div class="ss-stat-val">${pj}</div><div class="ss-stat-lbl">PJ</div></div>
        <div><div class="ss-stat-val">${wins}–${draws}–${losses}</div><div class="ss-stat-lbl">V–E–D</div></div>
        <div><div class="ss-stat-val">${gf}–${ga}</div><div class="ss-stat-lbl">GF–GC</div></div>
        <div><div class="ss-stat-val">${pts}</div><div class="ss-stat-lbl">Pts</div></div>
        <div><div class="ss-stat-val">${pj > 0 ? Math.round(gf/pj*10)/10 : 0}</div><div class="ss-stat-lbl">Gols/PJ</div></div>
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
        <form id="register-match-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="reg-rival">Rival</label>
            <input type="text" class="form-input" id="reg-rival" placeholder="Nom del rival..." required aria-required="true">
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-date">Data del Partit</label>
            <input type="date" class="form-input" id="reg-date" value="${new Date().toISOString().split('T')[0]}" required aria-required="true">
          </div>

          <div class="form-group">
            <label class="form-label">Resultat</label>
            <div class="score-inputs">
              <input type="number" class="form-input" id="reg-score-us" placeholder="Nosaltres" min="0" max="99" required aria-label="Gols a favor">
              <div class="score-sep">–</div>
              <input type="number" class="form-input" id="reg-score-them" placeholder="Rival" min="0" max="99" required aria-label="Gols en contra">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-mvp">MVP del Partit</label>
            <select class="form-select" id="reg-mvp" aria-label="Seleccionar MVP">
              <option value="">— Sense MVP —</option>
              ${playerOptions}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Gols</label>
            <div id="goals-list"></div>
            <button type="button" class="btn-add-goal" id="btn-add-goal" aria-label="Afegir gol">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Afegir Gol
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">Assistències</label>
            <div id="assists-list"></div>
            <button type="button" class="btn-add-goal" id="btn-add-assist" aria-label="Afegir assistència">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Afegir Assistència
            </button>
          </div>

          <button type="submit" class="btn-primary" id="btn-register-match">
            ⚽ Registrar Partit
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
    <select aria-label="Jugador" class="goal-player">
      <option value="">— Jugador —</option>
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
        <button class="btn-add-pos" id="btn-add-pos" ${positions.length >= 11 ? 'disabled' : ''} aria-label="Afegir posició">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Afegir (${positions.length}/11)
        </button>
      </div>
      <div class="edit-toolbar-right">
        <div class="save-formation-group">
          <input type="text" class="save-formation-input" id="save-formation-name" placeholder="Nom formació..." value="${formation && !FORMATIONS[formation] ? formation : ''}" maxlength="20" aria-label="Nom de la formació">
          <button class="btn-save-formation" id="btn-save-formation" aria-label="Guardar formació">💾 Guardar</button>
        </div>
        <button class="btn-cancel-edit" id="btn-cancel-edit" aria-label="Sortir del mode edició">✕ Cancel·lar</button>
      </div>
    </div>
  ` : '';

  const editToggleBtn = !editMode ? `
    <button class="btn-edit-positions" id="btn-edit-positions" aria-label="Editar posicions">
      ✏️ Editar posicions
    </button>
  ` : '';

  return `
    <div class="tactical-wrapper">
      <div class="tactical-formation-selector" id="formation-selector">
        ${formationBtns}
      </div>

      ${editToggleBtn}
      ${editToolbar}

      <div class="field-container ${editMode ? 'edit-mode' : ''}" id="tactical-field">
        ${renderFieldSVG()}
        ${renderTacticalPositions(positions, state.players, editMode)}
      </div>

      <div class="tactical-player-selector">
        <h4>${editMode ? '✏️ Mode edició actiu — arrossega les posicions al camp' : 'Assignar jugadors a posicions'}</h4>
        <div id="tactical-positions-list">
          ${editMode ? renderEditPositionsList(positions) : renderPositionAssignments(positions, state.players)}
        </div>
      </div>
    </div>
  `;
}

function renderFieldSVG() {
  return `
    <svg class="field-svg" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
      <!-- Grass gradient -->
      <defs>
        <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#0d2c14"/>
          <stop offset="50%"  stop-color="#0f3016"/>
          <stop offset="100%" stop-color="#0d2c14"/>
        </linearGradient>
        <!-- Stripes -->
        <pattern id="stripes" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="15" height="30" fill="rgba(255,255,255,0.02)"/>
        </pattern>
      </defs>
      <rect width="300" height="420" fill="url(#grassGrad)"/>
      <rect width="300" height="420" fill="url(#stripes)"/>

      <!-- Field lines -->
      <!-- Outer border -->
      <rect x="15" y="15" width="270" height="390" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" rx="2"/>
      <!-- Center line -->
      <line x1="15" y1="210" x2="285" y2="210" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <!-- Center circle -->
      <circle cx="150" cy="210" r="35" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <circle cx="150" cy="210" r="2" fill="rgba(255,255,255,0.3)"/>

      <!-- Top penalty area -->
      <rect x="75" y="15" width="150" height="60" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <!-- Top goal box -->
      <rect x="110" y="15" width="80" height="25" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <!-- Top penalty spot -->
      <circle cx="150" cy="57" r="2" fill="rgba(255,255,255,0.25)"/>
      <!-- Top penalty arc -->
      <path d="M 115 75 A 35 35 0 0 1 185 75" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

      <!-- Bottom penalty area -->
      <rect x="75" y="345" width="150" height="60" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <!-- Bottom goal box -->
      <rect x="110" y="380" width="80" height="25" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <!-- Bottom penalty spot -->
      <circle cx="150" cy="363" r="2" fill="rgba(255,255,255,0.25)"/>
      <!-- Bottom penalty arc -->
      <path d="M 115 345 A 35 35 0 0 0 185 345" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

      <!-- Corner arcs -->
      <path d="M 15 30 A 10 10 0 0 1 30 15" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <path d="M 270 15 A 10 10 0 0 1 285 30" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <path d="M 285 390 A 10 10 0 0 1 270 405" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <path d="M 30 405 A 10 10 0 0 1 15 390" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>

      <!-- Goals -->
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
      🖱️ Arrossega les posicions al camp per moure-les.<br>
      ✏️ Fes clic als noms per editar-los.<br>
      ✕ Elimina posicions amb el botó vermell.
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
          <option value="">— Sense assignar —</option>
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

function initCalendari(state) {
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
  const btnAddGoal   = document.getElementById('btn-add-goal');
  const btnAddAssist = document.getElementById('btn-add-assist');
  const form         = document.getElementById('register-match-form');

  if (btnAddGoal)   btnAddGoal.addEventListener('click', () => addGoalEntry('goals-list', state.players, 'goal'));
  if (btnAddAssist) btnAddAssist.addEventListener('click', () => addGoalEntry('assists-list', state.players, 'assist'));

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const rival  = document.getElementById('reg-rival')?.value.trim();
      const date   = document.getElementById('reg-date')?.value;
      const us     = parseInt(document.getElementById('reg-score-us')?.value);
      const them   = parseInt(document.getElementById('reg-score-them')?.value);
      const mvpVal = document.getElementById('reg-mvp')?.value;

      if (!rival || !date || isNaN(us) || isNaN(them)) {
        showToast('Omple tots els camps obligatoris');
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

      const newMatch = {
        id: Date.now(),
        rival,
        date,
        score: [us, them],
        mvp: mvpVal ? parseInt(mvpVal) : null,
        goals,
        assists,
      };

      // Add match and update ELO
      state.matches.push(newMatch);
      state.players = ELO.processMatch(state.players, newMatch);
      saveState(state);

      showToast('✅ Partit registrat correctament!');
      state.partitsTab = 'historial';

      // Re-render partits page
      const page = document.getElementById('page-partits');
      page.innerHTML = renderPartits(state);
      initPartits(state);
    });
  }
}

function initAlineacio(state) {
  const tabEl = document.getElementById('tab-content-alineacio');

  function rerender() {
    if (tabEl) {
      tabEl.innerHTML = renderAlineacio(state);
      initAlineacio(state);
    }
  }

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
          DRAG_STATE.formation = '4-3-3';
          DRAG_STATE.activePositions = null;
        }
        rerender();
        showToast(`Formació "${fname}" esborrada`);
      });
    }

    btn.addEventListener('click', (e) => {
      if (e.target.closest('[data-delete-formation]')) return;
      const f = btn.dataset.formation;
      DRAG_STATE.formation = f;
      DRAG_STATE.playerPositions = {};
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
        showToast('Posa un nom a la formació');
        return;
      }
      const positions = getActivePositions(state);
      state.customFormations[fname] = JSON.parse(JSON.stringify(positions));
      DRAG_STATE.formation = fname;
      DRAG_STATE.activePositions = null;
      DRAG_STATE.editMode = false;
      saveState(state);
      rerender();
      showToast(`✅ Formació "${fname}" guardada!`);
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
