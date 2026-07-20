// ============================================================
//  COMPONENTS/STATS.JS — Pàgina d'estadístiques
// ============================================================

let goalsChartInstance = null;

function renderStats(state) {
  const { players } = state;

  return `
    <!-- Note: header is now globally rendered by app shell -->

    <div class="section">
      <p class="section-title">${t('team_summary')}</p>
      ${renderTeamSummary(state)}
    </div>

    <div class="section">
      <p class="section-title">${t('chart_goals_label')} & ${t('chart_assists_label')}</p>
      <div class="chart-container">
        <canvas id="goals-chart" aria-label="Gràfica de gols per jugador"></canvas>
      </div>
    </div>

    <div class="section">
      <p class="section-title">${t('rivalry_title')}</p>
      ${renderRivalryView(players, state.comparison)}
    </div>
  `;
}

function renderTeamSummary(state) {
  const { players, matches } = state;
  const gf = matches.reduce((sum, m) => sum + m.score[0], 0);
  const pj = matches.length;
  let wins = 0, draws = 0, losses = 0;
  matches.forEach(m => {
    const r = getMatchResult(m.score);
    if (r === 'W') wins++;
    else if (r === 'D') draws++;
    else losses++;
  });
  const winRate = pj > 0 ? Math.round((wins / pj) * 100) : 0;
  const avgGoals = pj > 0 ? (gf / pj).toFixed(1) : '0.0';
  const avgElo = players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.elo, 0) / players.length) : 0;

  return `
    <div class="team-summary-card">
      <div class="team-summary-grid">
        <div class="team-summary-item accent-neon">
          <div class="ts-val">${avgElo}</div>
          <div class="ts-lbl">${t('avg_elo')}</div>
        </div>
        <div class="team-summary-item">
          <div class="ts-val">${gf}</div>
          <div class="ts-lbl">${t('total_goals')}</div>
        </div>
        <div class="team-summary-item accent-cyan">
          <div class="ts-val">${avgGoals}</div>
          <div class="ts-lbl">${t('goals_per_game')}</div>
        </div>
        <div class="team-summary-item">
          <div class="ts-val">${winRate}%</div>
          <div class="ts-lbl">${t('win_rate')}</div>
        </div>
        <div class="team-summary-item" style="grid-column: 1 / -1; display: flex; flex-direction: row; justify-content: space-between; align-items: center; border-color: rgba(255,255,255,0.04);">
          <div>
            <div class="ts-val" style="font-size: 1.1rem; color: var(--text-secondary);">${wins}W – ${draws}D – ${losses}L</div>
            <div class="ts-lbl">${t('v_e_d')}</div>
          </div>
          <div>
            <div class="ts-val" style="font-size: 1.1rem; color: var(--text-secondary); text-align: right;">${pj}</div>
            <div class="ts-lbl" style="text-align: right;">${t('played')}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRivalryView(players, comparison) {
  const pA = players.find(p => p.id === comparison.player1) || players[0];
  const pB = players.find(p => p.id === comparison.player2) || players[1];

  // Build player cards for picker
  const pickerCards = players.map(p => {
    const avatarInner = p.photo
      ? `<img src="${p.photo}" alt="${p.name}">`
      : p.emoji;
    const isA = pA && p.id === pA.id;
    const isB = pB && p.id === pB.id;
    const activeClass = isA ? 'active-a' : isB ? 'active-b' : '';
    return `
      <div class="rivalry-picker-card ${activeClass}" data-player-id="${p.id}" id="rivalry-pick-${p.id}" role="button" tabindex="0" aria-label="Seleccionar ${p.name}">
        <div class="rivalry-picker-avatar">${avatarInner}</div>
        <div class="rivalry-picker-name">${p.name}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="card">
      <div class="rivalry-picker-instructions">
        <span class="rivalry-picker-hint-a">
          <span style="width:10px;height:10px;border-radius:50%;background:var(--neon);flex-shrink:0;display:inline-block;"></span>
          1er toc → Jugador A
        </span>
        <span class="rivalry-picker-hint-b">
          <span style="width:10px;height:10px;border-radius:50%;background:var(--cyan);flex-shrink:0;display:inline-block;"></span>
          2n toc → Jugador B
        </span>
      </div>
      <div class="rivalry-player-picker-grid" id="rivalry-picker-grid">
        ${pickerCards}
      </div>
      <div id="rivalry-content-wrapper">
        ${pA && pB ? renderRivalryContent(pA, pB) : '<p style="text-align:center;color:var(--text-muted);padding:20px 0;font-size:0.82rem;">Selecciona dos jugadors per comparar</p>'}
      </div>
    </div>
  `;
}

function renderRivalryContent(pA, pB) {
  const prob = ELO.winProbability(pA, pB);

  const metrics = [
    { label: 'ELO',         a: pA.elo,         b: pB.elo },
    { label: t('goals'),    a: pA.goals,       b: pB.goals },
    { label: t('assists'),  a: pA.assists,     b: pB.assists },
    { label: t('played'),   a: pA.matches,     b: pB.matches },
    { label: 'Win %',       a: getWinRate(pA), b: getWinRate(pB) },
  ];

  const rows = metrics.map(m => `
    <div class="rivalry-stat-row">
      <div class="rivalry-stat-a">${m.a}</div>
      <div class="rivalry-stat-label">${m.label}</div>
      <div class="rivalry-stat-b">${m.b}</div>
    </div>
  `).join('');

  const avatarA = pA.photo ? `<img src="${pA.photo}" alt="${pA.name}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--neon);">` : `<span style="font-size:2rem">${pA.emoji}</span>`;
  const avatarB = pB.photo ? `<img src="${pB.photo}" alt="${pB.name}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--cyan);">` : `<span style="font-size:2rem">${pB.emoji}</span>`;

  return `
    <div class="rivalry-player-header">
      <div class="rivalry-player-card player-a" style="display:flex;flex-direction:column;align-items:center;">
        <div style="margin-bottom:8px;">${avatarA}</div>
        <p class="rivalry-player-name" style="color:var(--neon)">${pA.name}</p>
      </div>
      <div class="rivalry-player-card player-b" style="display:flex;flex-direction:column;align-items:center;">
        <div style="margin-bottom:8px;">${avatarB}</div>
        <p class="rivalry-player-name" style="color:var(--cyan)">${pB.name}</p>
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="win-prob-bar">
        <div class="win-prob-fill" style="width:${prob}%"></div>
      </div>
      <div class="win-prob-labels">
        <span>${pA.name}: ${prob}%</span>
        <span>${pB.name}: ${100-prob}%</span>
      </div>
    </div>

    <div class="rivalry-stats">
      ${rows}
    </div>
  `;
}

function initStats(state) {
  const { players } = state;

  // ---- Visual rivalry card picker ----
  // Track A/B selection state
  let selectionStep = 'a'; // next click picks A or B

  const grid = document.getElementById('rivalry-picker-grid');
  if (grid) {
    grid.querySelectorAll('.rivalry-picker-card').forEach(card => {
      const handlePick = () => {
        const pid = parseInt(card.dataset.playerId);

        if (selectionStep === 'a') {
          state.comparison.player1 = pid;
          selectionStep = 'b';
        } else {
          state.comparison.player2 = pid;
          selectionStep = 'a';
        }

        // Re-render section
        const section = document.getElementById('page-stats');
        if (section) {
          const rivalrySection = grid.closest('.section') || grid.closest('.card')?.parentElement;
          // Refresh just the rivalry part
          const wrapper = document.getElementById('rivalry-content-wrapper');
          const newGrid = document.getElementById('rivalry-picker-grid');
          if (newGrid) {
            newGrid.querySelectorAll('.rivalry-picker-card').forEach(c => {
              const cid = parseInt(c.dataset.playerId);
              c.classList.remove('active-a', 'active-b');
              if (cid === state.comparison.player1) c.classList.add('active-a');
              else if (cid === state.comparison.player2) c.classList.add('active-b');
            });
          }
          if (wrapper) {
            const pA = players.find(p => p.id === state.comparison.player1) || players[0];
            const pB = players.find(p => p.id === state.comparison.player2) || players[1];
            if (pA && pB && pA.id !== pB.id) {
              wrapper.innerHTML = renderRivalryContent(pA, pB);
            }
          }
        }
      };

      card.addEventListener('click', handlePick);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handlePick(); });
    });
  }

  // Goals Chart
  initGoalsChart(players);
}

function initGoalsChart(players) {
  const ctx = document.getElementById('goals-chart');
  if (!ctx) return;

  if (goalsChartInstance) {
    goalsChartInstance.destroy();
    goalsChartInstance = null;
  }

  const sorted = [...players].sort((a, b) => b.goals - a.goals).slice(0, 6);

  goalsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(p => `${p.emoji} ${p.name}`),
      datasets: [{
        label: t('chart_goals_label'),
        data: sorted.map(p => p.goals),
        backgroundColor: sorted.map((_, i) => {
          const alpha = 1 - (i * 0.1);
          return `rgba(167, 139, 250, ${alpha})`;
        }),
        borderRadius: 8,
        borderSkipped: false,
      }, {
        label: t('chart_assists_label'),
        data: sorted.map(p => p.assists),
        backgroundColor: sorted.map((_, i) => {
          const alpha = 0.7 - (i * 0.08);
          return `rgba(103, 232, 249, ${Math.max(alpha, 0.2)})`;
        }),
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          labels: {
            color: '#7b7a9a',
            font: { family: 'Space Grotesk', size: 11 },
            boxWidth: 12,
            borderRadius: 3,
          }
        },
        tooltip: {
          backgroundColor: '#111222',
          borderColor: 'rgba(167, 139, 250, 0.3)',
          borderWidth: 1,
          titleColor: '#a78bfa',
          bodyColor: '#c4c2d4',
          titleFont: { family: 'Space Grotesk', size: 12, weight: '600' },
          bodyFont: { family: 'Inter', size: 11 },
          padding: 10,
          cornerRadius: 10,
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#7b7a9a',
            font: { family: 'Space Grotesk', size: 10 },
          },
          border: { color: 'transparent' }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#c4c2d4',
            font: { family: 'Space Grotesk', size: 12, weight: '600' },
          },
          border: { color: 'transparent' }
        }
      }
    }
  });

  // Set canvas height
  ctx.parentElement.style.height = `${sorted.length * 52 + 40}px`;
}
