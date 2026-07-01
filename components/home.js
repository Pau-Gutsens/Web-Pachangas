// ============================================================
//  COMPONENTS/HOME.JS — Pàgina d'inici
// ============================================================

function renderHome(state) {
  const { players, matches } = state;
  const sorted = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastMatch = sorted[0];
  const topScorer = getTopScorer(players);
  const topAssist = getTopAssist(players);
  const bestStreak = getBestStreak(players);

  return `
    <!-- Note: header is now globally rendered by app shell -->
    
    ${renderLastMatchHero(lastMatch, players)}

    <div class="section">
      <p class="section-title">${t('hall_of_fame')}</p>
      ${renderHallOfFame(topScorer, topAssist, bestStreak)}
    </div>

    <div class="section">
      <p class="section-title">${t('podium_title')}</p>
      ${renderEloPodium(players)}
    </div>
  `;
}

function renderLastMatchHero(match, players) {
  if (!match) {
    return `
      <div class="last-match-hero" style="cursor: default;">
        <p class="lmh-label">⚽ ${t('last_match')}</p>
        <p style="color:var(--text-muted);text-align:center;padding:10px 0;">${t('no_matches')}</p>
      </div>
    `;
  }
  const result = getMatchResult(match.score);
  const badgeCls = result === 'W' ? 'badge-w' : result === 'D' ? 'badge-d' : 'badge-l';
  const badgeTxt = result === 'W' ? t('victory') : result === 'D' ? t('draw') : t('defeat');
  const mvpPlayer = match.mvp ? getPlayerById(players, match.mvp) : null;

  const scorersText = match.goals.length
    ? match.goals.map(g => {
        const p = getPlayerById(players, g.player);
        return p ? `${p.emoji} ${p.name} ${g.minute}'` : '';
      }).filter(Boolean).join(' · ')
    : t('no_participation'); // "Sense gols" / "No goals"

  return `
    <div class="last-match-hero" id="lmh-card" data-match-id="${match.id}" role="button" tabindex="0" aria-label="Veure detalls de l'últim partit">
      <p class="lmh-label">⚽ ${t('last_match')}</p>
      <p class="lmh-rival">vs ${match.rival}</p>
      <div class="lmh-score">
        <span class="us">${match.score[0]}</span>
        <span class="sep">–</span>
        <span class="them">${match.score[1]}</span>
      </div>
      <div class="lmh-meta">
        <span class="match-badge ${badgeCls}">${badgeTxt}</span>
        ${mvpPlayer ? `<span class="match-mvp">⭐ MVP: ${mvpPlayer.name}</span>` : ''}
        <span class="lmh-date">${formatDate(match.date)}</span>
      </div>
      <p style="font-size:0.75rem;color:var(--text-muted);margin-top:10px;">${scorersText}</p>
      <div class="lmh-cta">
        <span>${t('tap_for_details')}</span>
        <span class="lmh-cta-arrow">→</span>
      </div>
    </div>
  `;
}

function renderHallOfFame(topScorer, topAssist, bestStreak) {
  const streakWins = bestStreak.streak.filter(s => s === 'W').length;

  return `
    <div class="hof-grid">
      <div class="hof-card card-glow" id="hof-scorer" role="button" tabindex="0" data-player-id="${topScorer.id}" aria-label="Top Golejador: ${topScorer.name}">
        <span class="hof-icon">🏆</span>
        <p class="hof-label">${t('top_scorer')}</p>
        <div class="hof-player-emoji">${topScorer.emoji}</div>
        <p class="hof-player-name">${topScorer.name}</p>
        <p class="hof-value">${topScorer.goals} ${t('goals_count')}</p>
      </div>
      <div class="hof-card card-glow" id="hof-assist" role="button" tabindex="0" data-player-id="${topAssist.id}" aria-label="Top Assistent: ${topAssist.name}">
        <span class="hof-icon">🎯</span>
        <p class="hof-label">${t('top_assist')}</p>
        <div class="hof-player-emoji">${topAssist.emoji}</div>
        <p class="hof-player-name">${topAssist.name}</p>
        <p class="hof-value">${topAssist.assists} ${t('assists_count')}</p>
      </div>
      <div class="hof-card card-glow" id="hof-streak" role="button" tabindex="0" data-player-id="${bestStreak.id}" aria-label="Millor Ratxa: ${bestStreak.name}">
        <span class="hof-icon">🔥</span>
        <p class="hof-label">${t('best_streak')}</p>
        <div class="hof-player-emoji">${bestStreak.emoji}</div>
        <p class="hof-player-name">${bestStreak.name}</p>
        <p class="hof-value">${streakWins} ${t('consecutive_wins')}</p>
      </div>
    </div>
  `;
}

function renderEloPodium(players) {
  const sorted = [...players].sort((a, b) => b.elo - a.elo);
  const p1 = sorted[0];
  const p2 = sorted[1];
  const p3 = sorted[2];

  if (!p1) return '';

  const avatar1 = p1.photo ? `<img src="${p1.photo}" alt="${p1.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : p1.emoji;
  const avatar2 = p2 ? (p2.photo ? `<img src="${p2.photo}" alt="${p2.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : p2.emoji) : '👤';
  const avatar3 = p3 ? (p3.photo ? `<img src="${p3.photo}" alt="${p3.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : p3.emoji) : '👤';

  return `
    <div class="podium-section">
      <div class="podium-container">
        
        <!-- 2nd Place -->
        ${p2 ? `
        <div class="podium-column" data-player-id="${p2.id}" id="podium-player-${p2.id}" role="button" tabindex="0" aria-label="2n lloc: ${p2.name}">
          <div class="podium-player-emoji player-avatar" style="width:40px;height:40px;font-size:1.2rem;">${avatar2}</div>
          <p class="podium-player-name">${p2.name}</p>
          <p class="podium-player-elo">${p2.elo} ELO</p>
          <div class="podium-step rank-2">
            <span class="podium-rank">2</span>
          </div>
        </div>
        ` : '<div style="flex:1;"></div>'}

        <!-- 1st Place -->
        <div class="podium-column" data-player-id="${p1.id}" id="podium-player-${p1.id}" role="button" tabindex="0" aria-label="1r lloc: ${p1.name}">
          <div class="podium-player-emoji player-avatar" style="width:50px;height:50px;font-size:1.5rem;">
            <span class="podium-crown">👑</span>
            ${avatar1}
          </div>
          <p class="podium-player-name" style="font-size:0.92rem;font-weight:800;color:var(--neon);">${p1.name}</p>
          <p class="podium-player-elo">${p1.elo} ELO</p>
          <div class="podium-step rank-1">
            <span class="podium-rank">1</span>
          </div>
        </div>

        <!-- 3rd Place -->
        ${p3 ? `
        <div class="podium-column" data-player-id="${p3.id}" id="podium-player-${p3.id}" role="button" tabindex="0" aria-label="3r lloc: ${p3.name}">
          <div class="podium-player-emoji player-avatar" style="width:36px;height:36px;font-size:1.1rem;">${avatar3}</div>
          <p class="podium-player-name">${p3.name}</p>
          <p class="podium-player-elo">${p3.elo} ELO</p>
          <div class="podium-step rank-3">
            <span class="podium-rank">3</span>
          </div>
        </div>
        ` : '<div style="flex:1;"></div>'}

      </div>
      
      <button class="home-btn-view-all" id="home-btn-view-all">${t('view_all_players')}</button>
    </div>
  `;
}

function initHome(state) {
  // Last match hero click
  const lmhCard = document.getElementById('lmh-card');
  if (lmhCard) {
    const matchId = parseInt(lmhCard.dataset.matchId);
    lmhCard.addEventListener('click', () => {
      const match = state.matches.find(m => m.id === matchId);
      if (match) openMatchModal(match, state.players);
    });
    lmhCard.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') lmhCard.click();
    });
  }

  // HoF cards & Podium cards → open player modal
  document.querySelectorAll('#page-home [data-player-id]').forEach(el => {
    el.addEventListener('click', () => {
      const pid = parseInt(el.dataset.playerId);
      const player = state.players.find(p => p.id === pid);
      if (player) openPlayerModal(player, state.players, state.matches);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') el.click();
    });
  });

  // View all players button
  const btnViewAll = document.getElementById('home-btn-view-all');
  if (btnViewAll) {
    btnViewAll.addEventListener('click', () => {
      navigate('perfil');
    });
  }
}
