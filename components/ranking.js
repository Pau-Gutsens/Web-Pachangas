// ============================================================
//  COMPONENTS/RANKING.JS — Ranking y Estadísticas Ordenables
// ============================================================

window.RankingComponent = {
  currentSort: 'sr', // 'sr' | 'goals' | 'saves' | 'wins' | 'mvpCount' | 'attendanceRate'

  render(container) {
    if (!container) return;

    const dataStore = window.PachangasData;
    const allPlayers = dataStore.getAllPlayersWithStats();

    // Ordenación
    const sorted = [...allPlayers].sort((a, b) => {
      if (this.currentSort === 'sr') {
        if (b.sr !== a.sr) return b.sr - a.sr;
        return b.goals - a.goals;
      }
      if (this.currentSort === 'goals') {
        if (b.goals !== a.goals) return b.goals - a.goals;
        return b.sr - a.sr;
      }
      if (this.currentSort === 'saves') {
        if (b.saves !== a.saves) return b.saves - a.saves;
        return b.sr - a.sr;
      }
      if (this.currentSort === 'wins') {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.sr - a.sr;
      }
      if (this.currentSort === 'mvpCount') {
        if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
        return b.sr - a.sr;
      }
      if (this.currentSort === 'attendanceRate') {
        if (b.attendanceRate !== a.attendanceRate) return b.attendanceRate - a.attendanceRate;
        return b.sr - a.sr;
      }
      return 0;
    });

    const totalMatches = dataStore.matches.length;
    const top3 = sorted.slice(0, 3);
    const rest = sorted.slice(3);

    const sortLabels = {
      sr: 'Skill Rating (SR)',
      goals: 'Goles',
      saves: 'Paradas',
      wins: 'Victorias',
      mvpCount: 'Veces MVP',
      attendanceRate: '% Asistencia'
    };

    container.innerHTML = `
      <div class="ranking-view">
        <!-- Encabezado con métricas clave del grupo -->
        <div class="stats-hero-banner">
          <div class="hero-metric">
            <span class="hero-val">${totalMatches}</span>
            <span class="hero-label">Pachangas</span>
          </div>
          <div class="hero-divider"></div>
          <div class="hero-metric">
            <span class="hero-val">${dataStore.players.length}</span>
            <span class="hero-label">Colegas</span>
          </div>
          <div class="hero-divider"></div>
          <div class="hero-metric">
            <span class="hero-val">${sorted[0] ? sorted[0].name : '-'}</span>
            <span class="hero-label">Líder SR 👑</span>
          </div>
        </div>

        <!-- Barra de filtros / ordenación táctil -->
        <div class="sort-selector-container">
          <span class="sort-title">Ordenar por:</span>
          <div class="sort-pills" id="ranking-sort-pills">
            <button class="sort-pill ${this.currentSort === 'sr' ? 'active' : ''}" data-sort="sr">
              ⭐ SR
            </button>
            <button class="sort-pill ${this.currentSort === 'goals' ? 'active' : ''}" data-sort="goals">
              ⚽ Goles
            </button>
            <button class="sort-pill ${this.currentSort === 'saves' ? 'active' : ''}" data-sort="saves">
              🧤 Paradas
            </button>
            <button class="sort-pill ${this.currentSort === 'wins' ? 'active' : ''}" data-sort="wins">
              🏆 Victorias
            </button>
            <button class="sort-pill ${this.currentSort === 'mvpCount' ? 'active' : ''}" data-sort="mvpCount">
              🎖️ MVP
            </button>
            <button class="sort-pill ${this.currentSort === 'attendanceRate' ? 'active' : ''}" data-sort="attendanceRate">
              📊 % Asistencia
            </button>
          </div>
        </div>

        <!-- Podio Top 3 -->
        ${top3.length > 0 ? this.renderPodium(top3) : ''}

        <!-- Lista completa de jugadores -->
        <div class="ranking-list-card">
          <div class="ranking-list-header">
            <span>Pos / Jugador</span>
            <span class="header-right-stat">${sortLabels[this.currentSort]}</span>
          </div>
          <div class="ranking-rows">
            ${sorted.map((p, index) => this.renderPlayerRow(p, index + 1)).join('')}
          </div>
        </div>

        <!-- Info Card de la Fórmula SR -->
        <div class="sr-formula-card">
          <div class="formula-header">
            <span class="formula-icon">💡</span>
            <h4>¿Cómo funciona el SR?</h4>
          </div>
          <p class="formula-text">
            <strong>SR = 5 + (tu promedio de puntos − media de tu posición)</strong><br>
            SR 5 = rendimiento igual a la media. Mejor que la media → SR &gt; 5. Peor → SR &lt; 5.
          </p>
          <div class="formula-grid">
            <span class="formula-item">⚽ Gol: <strong>+1</strong></span>
            <span class="formula-item">👟 Asistencia: <strong>+1</strong></span>
            <span class="formula-item">🧤 Parada <em>(POR)</em>: <strong>+1</strong></span>
            <span class="formula-item">🥅 Encajado <em>(POR)</em>: <strong>-1</strong></span>
            <span class="formula-item">⚠️ Autogol: <strong>-1</strong></span>
            <span class="formula-item">🏆 Victoria: <strong>+1</strong></span>
            <span class="formula-item highlight">👑 MVP: <strong>+1 extra</strong></span>
            <span class="formula-item">📊 Normalizado por <strong>posición jugada</strong></span>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  renderPodium(top3) {
    // Orden visual en el podio: [Plata (2), Oro (1), Bronce (3)]
    const gold = top3[0];
    const silver = top3[1];
    const bronze = top3[2];

    const formatStat = (player) => {
      if (!player) return '';
      if (this.currentSort === 'sr') return `${player.sr >= 0 ? '+' : ''}${player.sr.toFixed(2)} SR`;
      if (this.currentSort === 'goals') return `${player.goals} goles`;
      if (this.currentSort === 'saves') return `${player.saves} paradas`;
      if (this.currentSort === 'wins') return `${player.wins} victorias`;
      if (this.currentSort === 'mvpCount') return `${player.mvpCount} MVP`;
      if (this.currentSort === 'attendanceRate') return `${player.attendanceRate}% asist.`;
      return `${player.sr.toFixed(2)} SR`;
    };

    return `
      <div class="podium-container">
        <!-- 2do Puesto (Plata) -->
        ${silver ? `
          <div class="podium-col silver" onclick="window.App.openPlayerModal('${silver.id}')">
            <div class="podium-avatar">
              <span class="player-emoji">${silver.emoji}</span>
              <span class="podium-medal">🥈</span>
            </div>
            <span class="podium-name">${silver.name}</span>
            <span class="podium-stat">${formatStat(silver)}</span>
            <div class="podium-block step-2">2</div>
          </div>
        ` : '<div class="podium-col empty"></div>'}

        <!-- 1er Puesto (Oro) -->
        ${gold ? `
          <div class="podium-col gold" onclick="window.App.openPlayerModal('${gold.id}')">
            <div class="crown-icon">👑</div>
            <div class="podium-avatar">
              <span class="player-emoji">${gold.emoji}</span>
              <span class="podium-medal">🥇</span>
            </div>
            <span class="podium-name">${gold.name}</span>
            <span class="podium-stat highlight">${formatStat(gold)}</span>
            <div class="podium-block step-1">1</div>
          </div>
        ` : ''}

        <!-- 3er Puesto (Bronce) -->
        ${bronze ? `
          <div class="podium-col bronze" onclick="window.App.openPlayerModal('${bronze.id}')">
            <div class="podium-avatar">
              <span class="player-emoji">${bronze.emoji}</span>
              <span class="podium-medal">🥉</span>
            </div>
            <span class="podium-name">${bronze.name}</span>
            <span class="podium-stat">${formatStat(bronze)}</span>
            <div class="podium-block step-3">3</div>
          </div>
        ` : '<div class="podium-col empty"></div>'}
      </div>
    `;
  },

  renderPlayerRow(player, rank) {
    let mainStat = '';
    let mainBadgeClass = 'badge-sr';

    if (this.currentSort === 'sr') {
      mainStat = `${player.sr >= 0 ? '+' : ''}${player.sr.toFixed(2)}`;
      mainBadgeClass = player.sr >= 3 ? 'badge-sr-fire' : (player.sr >= 1 ? 'badge-sr-good' : 'badge-sr-low');
    } else if (this.currentSort === 'goals') {
      mainStat = `${player.goals} ⚽`;
    } else if (this.currentSort === 'saves') {
      mainStat = `${player.saves} 🧤`;
    } else if (this.currentSort === 'wins') {
      mainStat = `${player.wins}W (${player.winRate}%)`;
    } else if (this.currentSort === 'mvpCount') {
      mainStat = `${player.mvpCount} 🎖️`;
    } else if (this.currentSort === 'attendanceRate') {
      mainStat = `${player.attendanceRate}% (${player.matchesPlayed}P)`;
    }

    const posBadges = (player.positions || []).map(pos => {
      const cfg = POSITION_LABELS[pos] || { short: pos, emoji: '' };
      return `<span class="pos-badge pos-${pos}">${cfg.short}</span>`;
    }).join('');

    return `
      <div class="ranking-row" onclick="window.App.openPlayerModal('${player.id}')">
        <div class="rank-num">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}</div>
        <div class="rank-player-avatar">${player.emoji}</div>
        <div class="rank-player-info">
          <div class="rank-player-name-line">
            <span class="rank-name">${player.name}</span>
            ${player.mvpCount > 0 ? `<span class="mvp-star-tag" title="${player.mvpCount} veces MVP">★ ${player.mvpCount}</span>` : ''}
          </div>
          <div class="rank-player-sub">
            <span class="rank-positions">${posBadges}</span>
            <span class="rank-matches-count">${player.matchesPlayed} part.</span>
          </div>
        </div>
        <div class="rank-stat-badge ${mainBadgeClass}">
          ${mainStat}
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    const pills = container.querySelectorAll('.sort-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        const sortKey = e.currentTarget.dataset.sort;
        if (sortKey) {
          this.currentSort = sortKey;
          this.render(container);
        }
      });
    });
  }
};
