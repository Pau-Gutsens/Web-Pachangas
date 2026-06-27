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
  const topEloPlayer = getTopElo(players);

  return `
    <div class="page-header">
      <h1>FC Colla</h1>
      <span class="header-badge">Temporada 26</span>
    </div>

    ${renderLastMatchHero(lastMatch, players)}

    <div class="section">
      <p class="section-title">Hall of Fame</p>
      ${renderHallOfFame(topScorer, topAssist, bestStreak)}
    </div>

    <div class="section">
      <p class="section-title">Roster</p>
      ${renderPlayerRoster(players)}
    </div>
  `;
}

function renderLastMatchHero(match, players) {
  if (!match) {
    return `<div class="last-match-hero"><p class="lmh-label">Últim Partit</p><p style="color:var(--text-muted)">Cap partit registrat</p></div>`;
  }
  const result = getMatchResult(match.score);
  const badgeCls = result === 'W' ? 'badge-w' : result === 'D' ? 'badge-d' : 'badge-l';
  const badgeTxt = result === 'W' ? 'Victòria' : result === 'D' ? 'Empat' : 'Derrota';
  const mvpPlayer = match.mvp ? getPlayerById(players, match.mvp) : null;

  const scorersText = match.goals.length
    ? match.goals.map(g => {
        const p = getPlayerById(players, g.player);
        return p ? `${p.emoji} ${p.name} ${g.minute}'` : '';
      }).filter(Boolean).join(' · ')
    : 'Sense gols';

  return `
    <div class="last-match-hero" id="lmh-card" data-match-id="${match.id}" role="button" tabindex="0" aria-label="Veure detalls de l'últim partit">
      <p class="lmh-label">⚽ Últim Partit</p>
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
    </div>
  `;
}

function renderHallOfFame(topScorer, topAssist, bestStreak) {
  const streakWins = bestStreak.streak.filter(s => s === 'W').length;

  return `
    <div class="hof-grid">
      <div class="hof-card card-glow" id="hof-scorer" role="button" tabindex="0" data-player-id="${topScorer.id}" aria-label="Top Golejador: ${topScorer.name}">
        <span class="hof-icon">🏆</span>
        <p class="hof-label">Top Golejador</p>
        <div class="hof-player-emoji">${topScorer.emoji}</div>
        <p class="hof-player-name">${topScorer.name}</p>
        <p class="hof-value">${topScorer.goals} gols</p>
      </div>
      <div class="hof-card card-glow" id="hof-assist" role="button" tabindex="0" data-player-id="${topAssist.id}" aria-label="Top Assistent: ${topAssist.name}">
        <span class="hof-icon">🎯</span>
        <p class="hof-label">Top Assistent</p>
        <div class="hof-player-emoji">${topAssist.emoji}</div>
        <p class="hof-player-name">${topAssist.name}</p>
        <p class="hof-value">${topAssist.assists} assists</p>
      </div>
      <div class="hof-card card-glow" id="hof-streak" role="button" tabindex="0" data-player-id="${bestStreak.id}" aria-label="Millor Racha: ${bestStreak.name}">
        <span class="hof-icon">🔥</span>
        <p class="hof-label">Millor Racha</p>
        <div class="hof-player-emoji">${bestStreak.emoji}</div>
        <p class="hof-player-name">${bestStreak.name}</p>
        <p class="hof-value">${streakWins}W consec.</p>
      </div>
    </div>
  `;
}

function renderPlayerRoster(players) {
  const sorted = [...players].sort((a, b) => b.elo - a.elo);
  const cards = sorted.map(p => {
    const avatarContent = p.photo
      ? `<img src="${p.photo}" alt="${p.name}">`
      : p.emoji;
    return `
      <div class="player-card" data-player-id="${p.id}" id="roster-player-${p.id}" role="button" tabindex="0" aria-label="Veure perfil de ${p.name}">
        <div class="player-avatar">${avatarContent}</div>
        <div class="player-info">
          <p class="player-name">${p.name}</p>
          <p class="player-elo">${p.elo} ELO</p>
          <div class="player-stats-mini">
            <span>⚽ ${p.goals}</span>
            <span>🎯 ${p.assists}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `<div class="player-grid">${cards}</div>`;
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

  // HoF cards → open player modal
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
}
