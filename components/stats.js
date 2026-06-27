// ============================================================
//  COMPONENTS/STATS.JS — Pàgina d'estadístiques
// ============================================================

let goalsChartInstance = null;

function renderStats(state) {
  const { players } = state;
  const sorted = [...players].sort((a, b) => b.elo - a.elo);

  return `
    <div class="page-header">
      <h1>Estadístiques</h1>
      <span class="header-badge">ELO · Gols</span>
    </div>

    <div class="section">
      <p class="section-title">Ranking ELO</p>
      <div class="elo-list" id="elo-list">
        ${sorted.map((p, i) => renderEloRow(p, i + 1)).join('')}
      </div>
    </div>

    <div class="section">
      <p class="section-title">Top Goleadors</p>
      <div class="chart-container">
        <canvas id="goals-chart" aria-label="Gràfica de gols per jugador"></canvas>
      </div>
    </div>

    <div class="section">
      <p class="section-title">Rivalitat 1v1</p>
      ${renderRivalryView(players, state.comparison)}
    </div>
  `;
}

function renderEloRow(player, rank) {
  const trend = ELO.getTrend(player);
  const rankCls = rank <= 3 ? `rank-${rank}` : '';
  const rankLabel = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  const winRate = getWinRate(player);
  const avatarContent = player.photo
    ? `<img src="${player.photo}" alt="${player.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
    : player.emoji;

  return `
    <div class="elo-row" id="elo-row-${player.id}" data-player-id="${player.id}" role="button" tabindex="0" aria-label="${player.name} — ELO ${player.elo}">
      <div class="elo-rank ${rankCls}">${rankLabel}</div>
      <div class="player-avatar" style="width:38px;height:38px;font-size:1.1rem;flex-shrink:0;">${avatarContent}</div>
      <div class="elo-player-info">
        <p class="elo-player-name">${player.name}</p>
        <p class="elo-player-sub">${player.matches}PJ · ${winRate}% WR · ${player.goals}⚽ ${player.assists}🎯</p>
      </div>
      <div class="elo-trend ${trend.cls}">${trend.label}</div>
      <div class="elo-score">${player.elo}</div>
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
        <div class="rivalry-vs">VS</div>
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
    { label: 'ELO',     a: pA.elo,     b: pB.elo },
    { label: 'Gols',    a: pA.goals,   b: pB.goals },
    { label: 'Assists', a: pA.assists, b: pB.assists },
    { label: 'Victòries', a: pA.wins, b: pB.wins },
    { label: 'Win %',   a: getWinRate(pA), b: getWinRate(pB) },
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

  // ELO rows click → player modal
  document.querySelectorAll('#page-stats [data-player-id]').forEach(el => {
    el.addEventListener('click', () => {
      const pid = parseInt(el.dataset.playerId);
      const player = players.find(p => p.id === pid);
      if (player) openPlayerModal(player, players, state.matches);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') el.click();
    });
  });

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
        label: 'Gols',
        data: sorted.map(p => p.goals),
        backgroundColor: sorted.map((_, i) => {
          const alpha = 1 - (i * 0.1);
          return `rgba(184, 255, 0, ${alpha})`;
        }),
        borderRadius: 8,
        borderSkipped: false,
      }, {
        label: 'Assists',
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
