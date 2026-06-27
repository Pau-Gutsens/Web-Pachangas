// ============================================================
//  COMPONENTS/PERFIL.JS — Pàgina de jugadors / perfils
// ============================================================

function renderPerfil(state) {
  const { players, perfilSearch, perfilSort } = state;
  const search = perfilSearch || '';
  const sort   = perfilSort   || 'elo';

  const topPlayer = getTopElo(players);
  const topScorer = getTopScorer(players);
  const topAssist = getTopAssist(players);

  // Filter & sort
  let filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  filtered.sort((a, b) => {
    if (sort === 'elo')     return b.elo     - a.elo;
    if (sort === 'goals')   return b.goals   - a.goals;
    if (sort === 'assists') return b.assists  - a.assists;
    if (sort === 'winrate') return getWinRate(b) - getWinRate(a);
    return 0;
  });

  const maxGoals   = Math.max(...players.map(p => p.goals), 1);
  const maxAssists = Math.max(...players.map(p => p.assists), 1);

  return `
    <div class="page-header">
      <h1>Jugadors</h1>
      <span class="header-badge">${players.length} jugadors</span>
    </div>

    ${renderProfileHero(topPlayer)}
    ${renderQuickStats(players, topScorer)}

    <div class="search-wrapper">
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="search" class="search-input" id="perfil-search" placeholder="Cercar jugador..." value="${search}" aria-label="Cercar jugador">
    </div>

    <div class="sort-row">
      <span class="sort-label">Ordenar:</span>
      <div class="sort-chips">
        ${[
          { key: 'elo',     label: 'ELO' },
          { key: 'goals',   label: 'Gols' },
          { key: 'assists', label: 'Assists' },
          { key: 'winrate', label: 'Win%' },
        ].map(s => `
          <button class="filter-chip ${sort === s.key ? 'active' : ''}" data-sort="${s.key}" id="sort-${s.key}" aria-label="Ordenar per ${s.label}">${s.label}</button>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <div class="player-list" id="player-list">
        ${filtered.map((p, i) => renderPlayerRow(p, i + 1, filtered, maxGoals, maxAssists, players)).join('')}
      </div>
    </div>
  `;
}

function renderProfileHero(player) {
  const avatarContent = player.photo
    ? `<img src="${player.photo}" alt="${player.name}">`
    : player.emoji;
  const trend = ELO.getTrend(player);
  const winRate = getWinRate(player);

  return `
    <div class="profile-hero" id="profile-hero-player" data-player-id="${player.id}" role="button" tabindex="0" aria-label="Millor jugador: ${player.name}">
      <div class="profile-hero-avatar">${avatarContent}</div>
      <div class="profile-hero-info">
        <p class="profile-hero-label">⭐ Millor Jugador</p>
        <p class="profile-hero-name">${player.name}</p>
        <p class="profile-hero-elo">${player.elo} ELO <span class="elo-trend ${trend.cls}" style="font-size:0.65rem;padding:2px 6px;">${trend.label}</span></p>
        <div class="profile-hero-stats">
          <div class="profile-hero-stat">
            <div class="profile-hero-stat-val">${player.goals}</div>
            <div class="profile-hero-stat-lbl">Gols</div>
          </div>
          <div class="profile-hero-stat">
            <div class="profile-hero-stat-val">${player.assists}</div>
            <div class="profile-hero-stat-lbl">Assists</div>
          </div>
          <div class="profile-hero-stat">
            <div class="profile-hero-stat-val">${winRate}%</div>
            <div class="profile-hero-stat-lbl">WR</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderQuickStats(players, topScorer) {
  const totalGoals = players.reduce((s, p) => s + p.goals, 0);
  const avgElo = Math.round(players.reduce((s, p) => s + p.elo, 0) / players.length);
  const totalMatches = Math.max(...players.map(p => p.matches));

  return `
    <div class="quick-stats">
      <div class="qs-card">
        <div class="qs-val">${players.length}</div>
        <div class="qs-lbl">Total Jugadors</div>
      </div>
      <div class="qs-card">
        <div class="qs-val">${totalGoals}</div>
        <div class="qs-lbl">Total Gols</div>
      </div>
      <div class="qs-card">
        <div class="qs-val">${topScorer.emoji} ${topScorer.name}</div>
        <div class="qs-lbl">Top Scorer</div>
      </div>
      <div class="qs-card">
        <div class="qs-val">${avgElo}</div>
        <div class="qs-lbl">ELO Mitjà</div>
      </div>
    </div>
  `;
}

function renderPlayerRow(player, rank, allPlayers, maxGoals, maxAssists, players) {
  const topScorer = getTopScorer(players);
  const topAssist = getTopAssist(players);
  const topEloP   = getTopElo(players);

  const badges = [];
  if (player.id === topScorer.id) badges.push(`<span class="badge-mini badge-top-scorer">🏆 Gols</span>`);
  if (player.id === topAssist.id) badges.push(`<span class="badge-mini badge-top-assist">🎯 Assist</span>`);
  if (player.id === topEloP.id)   badges.push(`<span class="badge-mini badge-best-elo">⚡ ELO</span>`);

  const rankCls = rank <= 3 ? `rank-${rank}` : '';
  const goalsPct   = Math.round((player.goals   / maxGoals)   * 100);
  const assistsPct = Math.round((player.assists / maxAssists) * 100);
  const winRate    = getWinRate(player);
  const trend      = ELO.getTrend(player);

  const avatarContent = player.photo
    ? `<img src="${player.photo}" alt="${player.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
    : player.emoji;

  const streakDots = (player.streak || []).map(s => {
    const cls = s === 'W' ? 'streak-w' : s === 'D' ? 'streak-d' : 'streak-l';
    return `<span class="streak-dot ${cls}">${s}</span>`;
  }).join('');

  return `
    <div class="player-row" data-player-id="${player.id}" id="player-row-${player.id}" role="button" tabindex="0" aria-label="Veure perfil de ${player.name}">
      <div class="player-row-rank ${rankCls}">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}</div>
      <div class="player-avatar" style="width:44px;height:44px;font-size:1.3rem;flex-shrink:0;">${avatarContent}</div>
      <div class="player-row-main">
        <div class="player-row-namerow">
          <span class="player-row-name">${player.name}</span>
          <div class="player-row-badges">${badges.join('')}</div>
        </div>
        <div class="stat-bar-row">
          <span class="stat-bar-label">G</span>
          <div class="stat-bar-track"><div class="stat-bar-fill bar-goals" style="width:${goalsPct}%"></div></div>
          <span class="stat-bar-val">${player.goals}</span>
        </div>
        <div class="stat-bar-row">
          <span class="stat-bar-label">A</span>
          <div class="stat-bar-track"><div class="stat-bar-fill bar-assists" style="width:${assistsPct}%"></div></div>
          <span class="stat-bar-val">${player.assists}</span>
        </div>
        <div class="streak-row">${streakDots}</div>
      </div>
      <div class="player-row-elo">
        <div class="player-row-elo-val">${player.elo}</div>
        <div class="elo-trend ${trend.cls}" style="font-size:0.62rem;padding:2px 5px;">${trend.label}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px;">${winRate}% WR</div>
      </div>
    </div>
  `;
}

function initPerfil(state) {
  // Hero click
  const heroEl = document.getElementById('profile-hero-player');
  if (heroEl) {
    const pid = parseInt(heroEl.dataset.playerId);
    heroEl.addEventListener('click', () => {
      const p = state.players.find(pl => pl.id === pid);
      if (p) openPlayerModal(p, state.players, state.matches);
    });
    heroEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') heroEl.click();
    });
  }

  // Player rows click
  document.querySelectorAll('#player-list .player-row').forEach(el => {
    el.addEventListener('click', () => {
      const pid = parseInt(el.dataset.playerId);
      const p = state.players.find(pl => pl.id === pid);
      if (p) openPlayerModal(p, state.players, state.matches);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') el.click();
    });
  });

  // Search
  const searchEl = document.getElementById('perfil-search');
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      state.perfilSearch = searchEl.value;
      refreshPerfil(state);
    });
  }

  // Sort chips
  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.perfilSort = btn.dataset.sort;
      refreshPerfil(state);
    });
  });
}

function refreshPerfil(state) {
  const page = document.getElementById('page-perfil');
  if (!page) return;
  page.innerHTML = renderPerfil(state);
  initPerfil(state);
}

// ============================================================
//  SHARED MODALS (used by all pages)
// ============================================================

function openPlayerModal(player, players, matches) {
  const avgGoals   = parseFloat(getAvgGoals(players));
  const avgAssists = parseFloat(getAvgAssists(players));
  const maxGoals   = Math.max(...players.map(p => p.goals), 1);
  const maxAssists = Math.max(...players.map(p => p.assists), 1);
  const avgElo     = Math.round(players.reduce((s, p) => s + p.elo, 0) / players.length);
  const winRate    = getWinRate(player);
  const trend      = ELO.getTrend(player);

  // Player's recent matches
  const playerMatches = matches
    .filter(m => m.goals.some(g => g.player === player.id) || m.assists.some(a => a.player === player.id) || m.mvp === player.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const avatarContent = player.photo
    ? `<img src="${player.photo}" alt="${player.name}">`
    : `<span style="font-size:2.5rem">${player.emoji}</span>`;

  const streakDots = (player.streak || []).map(s => {
    const cls = s === 'W' ? 'streak-w' : s === 'D' ? 'streak-d' : 'streak-l';
    const label = s === 'W' ? 'Victòria' : s === 'D' ? 'Empat' : 'Derrota';
    return `<span class="streak-dot ${cls}" title="${label}" style="width:22px;height:22px;font-size:0.65rem;">${s}</span>`;
  }).join('');

  const recentMatchesHTML = playerMatches.length
    ? playerMatches.map(m => {
        const r = getMatchResult(m.score);
        const bCls = r==='W'?'badge-w':r==='D'?'badge-d':'badge-l';
        const bTxt = r==='W'?'V':r==='D'?'E':'D';
        const playerGoals   = m.goals.filter(g => g.player === player.id).length;
        const playerAssists = m.assists.filter(a => a.player === player.id).length;
        return `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-elevated);border-radius:var(--radius-md);margin-bottom:6px;">
            <span class="match-badge ${bCls}" style="font-size:0.6rem;padding:2px 7px;">${bTxt}</span>
            <span style="flex:1;font-family:var(--font-display);font-size:0.8rem;font-weight:600;color:var(--text-primary);">vs ${m.rival}</span>
            <span style="font-size:0.7rem;color:var(--neon);">⚽${playerGoals} 🎯${playerAssists}</span>
            <span style="font-size:0.68rem;color:var(--text-muted);">${formatDate(m.date)}</span>
          </div>
        `;
      }).join('')
    : `<p style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:12px;">Cap registre de participació</p>`;

  const content = `
    <div class="modal-header">
      <div class="player-avatar" style="width:52px;height:52px;font-size:1.6rem;">${avatarContent}</div>
      <div class="modal-title">
        ${player.name}
        <div style="font-size:0.72rem;color:var(--text-muted);font-weight:400;font-family:var(--font-body);">${player.elo} ELO · <span class="elo-trend ${trend.cls}" style="font-size:0.65rem;">${trend.label}</span></div>
      </div>
      <button class="modal-close" id="modal-close-btn" aria-label="Tancar modal">✕</button>
    </div>
    <div class="modal-body">

      <!-- Photo upload -->
      <div class="photo-upload-area" id="photo-upload-area-${player.id}" role="button" tabindex="0" aria-label="Canviar foto de ${player.name}">
        <div class="photo-preview" id="photo-preview-${player.id}">
          ${player.photo ? `<img src="${player.photo}" alt="${player.name}">` : `<span style="font-size:2rem">${player.emoji}</span>`}
        </div>
        <label for="photo-input-${player.id}" style="cursor:pointer;">
          <p class="photo-upload-text">📷 Toca per canviar la foto</p>
          <input type="file" id="photo-input-${player.id}" accept="image/*" aria-label="Pujar foto de ${player.name}">
        </label>
      </div>

      <!-- Quick stats -->
      <div class="modal-stat-grid">
        <div class="modal-stat">
          <div class="modal-stat-val">${player.goals}</div>
          <div class="modal-stat-lbl">Gols</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-val">${player.assists}</div>
          <div class="modal-stat-lbl">Assists</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-val">${player.matches}</div>
          <div class="modal-stat-lbl">Partits</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-val">${player.wins}</div>
          <div class="modal-stat-lbl">Victòries</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-val">${winRate}%</div>
          <div class="modal-stat-lbl">Win Rate</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-val">${player.elo}</div>
          <div class="modal-stat-lbl">ELO</div>
        </div>
      </div>

      <!-- Racha -->
      <p class="modal-section-title" style="margin-bottom:10px;">Racha Última</p>
      <div class="streak-row" style="gap:6px;margin-bottom:20px;">${streakDots}</div>

      <!-- Comparativa vs Mitjana -->
      <p class="modal-section-title" style="margin-bottom:12px;">Comparativa vs Equip</p>
      ${renderCompareBar('Gols', player.goals, avgGoals, maxGoals)}
      ${renderCompareBar('Assists', player.assists, avgAssists, maxAssists)}
      ${renderCompareBar('ELO', player.elo, avgElo, Math.max(...players.map(p => p.elo)), true)}

      <!-- Partits Recents -->
      <p class="modal-section-title" style="margin-bottom:10px;margin-top:20px;">Últims Partits</p>
      ${recentMatchesHTML}
    </div>
  `;

  openModal(content);

  // Photo upload
  const photoInput = document.getElementById(`photo-input-${player.id}`);
  const photoPreview = document.getElementById(`photo-preview-${player.id}`);
  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        player.photo = dataUrl;
        photoPreview.innerHTML = `<img src="${dataUrl}" alt="${player.name}">`;
        // Update the main avatar too
        document.querySelectorAll(`[data-player-id="${player.id}"] .player-avatar`).forEach(av => {
          av.innerHTML = `<img src="${dataUrl}" alt="${player.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        });
        saveState(window.APP_STATE);
        showToast('📷 Foto actualitzada!');
      };
      reader.readAsDataURL(file);
    });
  }
}

function renderCompareBar(label, value, avg, max, hideAvg = false) {
  const playerPct = Math.round((value / max) * 100);
  const avgPct    = Math.round((avg / max) * 100);
  const diff = value - avg;
  const diffStr = diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  const diffColor = diff >= 0 ? 'var(--neon)' : 'var(--red)';

  return `
    <div class="compare-row">
      <div class="compare-label">
        <span>${label}</span>
        <span>${value} <span style="color:${diffColor};font-size:0.65rem;">(${diffStr} vs avg)</span></span>
      </div>
      <div class="compare-bar-track">
        <div class="compare-bar-avg" style="left:${avgPct}%" title="Mitjana: ${avg}"></div>
        <div class="compare-bar-player" style="width:${playerPct}%"></div>
      </div>
    </div>
  `;
}

function openMatchModal(match, players) {
  const result = getMatchResult(match.score);
  const badgeCls = result === 'W' ? 'badge-w' : result === 'D' ? 'badge-d' : 'badge-l';
  const badgeTxt = result === 'W' ? 'Victòria' : result === 'D' ? 'Empat' : 'Derrota';
  const mvpPlayer = match.mvp ? getPlayerById(players, match.mvp) : null;

  const goalEvents = match.goals.length
    ? match.goals.sort((a, b) => a.minute - b.minute).map(g => {
        const p = getPlayerById(players, g.player);
        const assist = match.assists.find(a => a.minute === g.minute && a.player !== g.player);
        const assistP = assist ? getPlayerById(players, assist.player) : null;
        return `
          <div class="goal-event">
            <span class="goal-minute">${g.minute}'</span>
            <span style="font-size:1rem;">⚽</span>
            <div style="flex:1;">
              <p class="goal-player-name">${p ? p.emoji + ' ' + p.name : 'Desconegut'}</p>
              ${assistP ? `<p class="goal-assist-label">🎯 ${assistP.name}</p>` : ''}
            </div>
          </div>
        `;
      }).join('')
    : `<p style="font-size:0.82rem;color:var(--text-muted);text-align:center;padding:12px;">Cap gol registrat</p>`;

  const content = `
    <div class="modal-header">
      <div style="flex:1;">
        <div style="font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:1.5px;text-transform:uppercase;font-family:var(--font-display);margin-bottom:6px;">⚽ Detalls del Partit</div>
        <div class="match-modal-score">
          <span>${match.score[0]}</span>
          <span class="sep"> – </span>
          <span class="them">${match.score[1]}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
          <span class="match-badge ${badgeCls}">${badgeTxt}</span>
          <span style="font-size:0.78rem;color:var(--text-muted);">vs ${match.rival}</span>
          <span style="font-size:0.75rem;color:var(--text-muted);">${formatDate(match.date)}</span>
        </div>
      </div>
      <button class="modal-close" id="modal-close-btn" aria-label="Tancar modal">✕</button>
    </div>
    <div class="modal-body">
      ${mvpPlayer ? `
        <div style="background:var(--gold-dim);border:1px solid rgba(255,215,0,0.2);border-radius:var(--radius-md);padding:14px;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.5rem;">${mvpPlayer.emoji}</span>
          <div>
            <p style="font-size:0.62rem;color:var(--gold);font-family:var(--font-display);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">⭐ MVP del Partit</p>
            <p style="font-family:var(--font-display);font-size:0.92rem;font-weight:700;color:var(--text-primary);">${mvpPlayer.name}</p>
          </div>
        </div>
      ` : ''}

      <p class="modal-section-title">Gols</p>
      <div class="goal-timeline" style="margin-bottom:20px;">
        ${goalEvents}
      </div>
    </div>
  `;

  openModal(content);
}
