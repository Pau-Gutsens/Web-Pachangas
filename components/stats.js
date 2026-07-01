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

  return `
    <div class="card">
      <div class="rivalry-selectors">
        <select class="rivalry-select" id="rivalry-select-a" aria-label="Jugador A">
          ${players.map(p => `<option value="${p.id}" ${p.id === pA.id ? 'selected' : ''}>${p.emoji} ${p.name}</option>`).join('')}
        </select>
        <div class="rivalry-vs">${t('rivalry_vs')}</div>
        <select class="rivalry-select" id="rivalry-select-b" aria-label="Jugador B">
          ${players.map(p => `<option value="${p.id}" ${p.id === pB.id ? 'selected' : ''}>${p.emoji} ${p.name}</option>`).join('')}
        </select>
      </div>

      <div id="rivalry-content-wrapper">
        ${renderRivalryContent(pA, pB)}
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

  // Rivalry selects
  const selA = document.getElementById('rivalry-select-a');
  const selB = document.getElementById('rivalry-select-b');
  if (selA && selB) {
    const refresh = () => {
      state.comparison.player1 = parseInt(selA.value);
      state.comparison.player2 = parseInt(selB.value);
      const wrapper = document.getElementById('rivalry-content-wrapper');
      if (wrapper) {
        const pA = players.find(p => p.id === state.comparison.player1) || players[0];
        const pB = players.find(p => p.id === state.comparison.player2) || players[1];
        wrapper.innerHTML = renderRivalryContent(pA, pB);
      }
    };
    selA.addEventListener('change', refresh);
    selB.addEventListener('change', refresh);
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
          return `rgba(184, 255, 0, ${alpha})`;
        }),
        borderRadius: 8,
        borderSkipped: false,
      }, {
        label: t('chart_assists_label'),
        data: sorted.map(p => p.assists),
        backgroundColor: sorted.map((_, i) => {
          const alpha = 0.7 - (i * 0.08);
          return `rgba(0, 217, 255, ${Math.max(alpha, 0.2)})`;
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
            color: '#7a8a7a',
            font: { family: 'Space Grotesk', size: 11 },
            boxWidth: 12,
            borderRadius: 3,
          }
        },
        tooltip: {
          backgroundColor: '#0F2218',
          borderColor: 'rgba(184,255,0,0.3)',
          borderWidth: 1,
          titleColor: '#B8FF00',
          bodyColor: '#c0c0c0',
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
            color: '#7a8a7a',
            font: { family: 'Space Grotesk', size: 10 },
          },
          border: { color: 'transparent' }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#c0c0c0',
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
