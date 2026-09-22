// ============================================================
//  DATA.JS — Motor de Datos, Estadísticas y SR para Pachangas
// ============================================================

const STORAGE_KEY = 'pachangas_data_v2'; // v2: sin datos de ejemplo, sin emojis

// Posiciones válidas en el fútbol pachanga
const POSITIONS = {
  PORTERO: 'portero',
  DEFENSA: 'defensa',
  CENTROCAMPISTA: 'centrocampista',
  DELANTERO: 'delantero'
};

const POSITION_LABELS = {
  portero:        { label: 'Portero',        short: 'POR' },
  defensa:        { label: 'Defensa',        short: 'DEF' },
  centrocampista: { label: 'Centrocampista', short: 'MED' },
  delantero:      { label: 'Delantero',      short: 'DEL' }
};

// App starts empty — players and matches are added by the group
const SEED_PLAYERS = [];
const SEED_MATCHES  = [];




class DataStore {
  constructor() {
    this.players = [];
    this.matches = [];
    this.listeners = [];
    this.load();
  }

  // Carga desde localStorage o si no existe, siembra los datos iniciales
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.players = parsed.players || [];
        this.matches = parsed.matches || [];
        return;
      }
    } catch (e) {
      console.error('Error cargando datos de localStorage:', e);
    }
    // Si está vacío o falla, inicializar con datos seed
    this.players = JSON.parse(JSON.stringify(SEED_PLAYERS));
    this.matches = JSON.parse(JSON.stringify(SEED_MATCHES));
    this.save();
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        players: this.players,
        matches: this.matches
      }));
      this.notifyListeners();
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try { cb(); } catch (e) { console.error(e); }
    });
  }

  resetToDefaults() {
    this.players = JSON.parse(JSON.stringify(SEED_PLAYERS));
    this.matches = JSON.parse(JSON.stringify(SEED_MATCHES));
    this.save();
  }

  // -------------------------------------------------------------
  //  FÓRMULA DE SR NORMALIZADO POR POSICIÓN
  // -------------------------------------------------------------
  // Puntos brutos por partido (todas las posiciones):
  //   Gol: +1  |  Asistencia: +1  |  Autogol: -1
  //   Victoria: +1  |  MVP: +1 extra
  //   Portero solo: Parada +1, Gol encajado -1
  //
  // Normalización por posición jugada ese partido:
  //   SR = 5 + (promedio bruto del jugador − promedio bruto global de su posición)
  //
  // Si un jugador juega distintas posiciones, cada partido se compara
  // con la media de la posición que jugó ese partido concreto.

  // Calcula los puntos BRUTOS de un jugador en un partido concreto.
  // Devuelve null si el jugador no participó.
  calculateMatchPointsForPlayer(playerId, match) {
    const stats = match.playerStats ? match.playerStats[playerId] : null;
    if (!stats) return null;

    const team = stats.team;
    const teamWon = (team === 'A' && match.teamA.score > match.teamB.score) ||
                    (team === 'B' && match.teamB.score > match.teamA.score);
    const isMVP = (match.mvp === playerId);

    // Derivar posición jugada: campo explícito > isGoalkeeper > posición preferida del jugador
    let positionPlayed = stats.positionPlayed || null;
    if (!positionPlayed) {
      positionPlayed = stats.isGoalkeeper ? 'portero' : (() => {
        const p = this.players.find(pl => pl.id === playerId);
        return (p && p.positions && p.positions[0]) ? p.positions[0] : 'centrocampista';
      })();
    }

    let points = 0;
    points += (stats.goals || 0);
    points += (stats.assists || 0);
    points -= (stats.ownGoals || 0);
    if (stats.isGoalkeeper || positionPlayed === 'portero') {
      points += (stats.saves || 0);
      points -= (stats.goalsConceded || 0);
    }
    if (teamWon) points += 1;
    if (isMVP)   points += 1;

    return { points, teamWon, isMVP, positionPlayed, stats };
  }

  // Calcula la media de puntos brutos por posición, agregando TODOS los partidos.
  // Devuelve { portero: avgPts, defensa: avgPts, centrocampista: avgPts, delantero: avgPts }
  _computeGlobalPositionAverages() {
    const posAccum = {
      portero:        { sum: 0, count: 0 },
      defensa:        { sum: 0, count: 0 },
      centrocampista: { sum: 0, count: 0 },
      delantero:      { sum: 0, count: 0 }
    };

    this.matches.forEach(match => {
      Object.keys(match.playerStats || {}).forEach(pid => {
        const result = this.calculateMatchPointsForPlayer(pid, match);
        if (!result) return;
        const pos = result.positionPlayed || 'centrocampista';
        if (posAccum[pos]) {
          posAccum[pos].sum   += result.points;
          posAccum[pos].count += 1;
        }
      });
    });

    const avgs = {};
    Object.entries(posAccum).forEach(([pos, { sum, count }]) => {
      avgs[pos] = count > 0 ? sum / count : 0;
    });
    return avgs;
  }

  // Obtiene estadísticas acumuladas y SR normalizado en tiempo real de un jugador.
  getPlayerStats(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    let matchesPlayed = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goals = 0;
    let assists = 0;
    let saves = 0;
    let goalsConceded = 0;
    let ownGoals = 0;
    let mvpCount = 0;
    let totalRawPoints = 0;
    const historyPoints = []; // puntos brutos por partido, en orden cronológico

    // Medias globales de puntos por posición (para normalización)
    const posAvgs = this._computeGlobalPositionAverages();

    // Recorrer partidos en orden cronológico
    const sortedMatches = [...this.matches].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Acumular normalizedDelta: suma de (puntosPartido - mediaPosiónEsePartido)
    let totalNormalizedDelta = 0;

    sortedMatches.forEach(m => {
      const pData = this.calculateMatchPointsForPlayer(playerId, m);
      if (!pData) return;

      matchesPlayed++;
      totalRawPoints += pData.points;
      historyPoints.push(pData.points);

      // Usar la media global de esa posición como referencia de normalización
      const posRef = posAvgs[pData.positionPlayed] ?? posAvgs['centrocampista'] ?? 0;
      totalNormalizedDelta += (pData.points - posRef);

      const isTeamA = pData.stats.team === 'A';
      const myScore    = isTeamA ? m.teamA.score : m.teamB.score;
      const rivalScore = isTeamA ? m.teamB.score : m.teamA.score;

      if (myScore > rivalScore)      wins++;
      else if (myScore === rivalScore) draws++;
      else                             losses++;

      goals          += pData.stats.goals          || 0;
      assists        += pData.stats.assists        || 0;
      saves          += pData.stats.saves          || 0;
      goalsConceded  += pData.stats.goalsConceded  || 0;
      ownGoals       += pData.stats.ownGoals       || 0;
      if (pData.isMVP) mvpCount++;
    });

    const totalGroupMatches = this.matches.length;
    const attendanceRate = totalGroupMatches > 0
      ? (matchesPlayed / totalGroupMatches) * 100
      : 0;

    // SR normalizado: 5 + (avg puntos brutos del jugador − avg global de su(s) posición/es)
    // Si no ha jugado ningún partido, SR base = 5.00
    let sr = 5.0;
    if (matchesPlayed > 0) {
      const avgRaw = totalRawPoints / matchesPlayed;
      // Media ponderada de las posiciones preferidas del jugador (fallback)
      const prefPositions = player.positions && player.positions.length > 0
        ? player.positions
        : ['centrocampista'];
      const prefAvg = prefPositions.reduce((acc, pos) => acc + (posAvgs[pos] ?? 0), 0) / prefPositions.length;

      // Si el jugador ha jugado partidos con posición registrada, usar normalización exacta por partido;
      // si no, comparar su media global contra la media ponderada de sus posiciones preferidas.
      const avgNormDelta = totalNormalizedDelta / matchesPlayed;
      sr = 5 + avgNormDelta;
    }

    return {
      id: player.id,
      name: player.name,
      emoji: player.emoji || '⚽',
      positions: player.positions || [],
      matchesPlayed,
      wins,
      draws,
      losses,
      goals,
      assists,
      saves,
      goalsConceded,
      ownGoals,
      mvpCount,
      totalRawPoints,
      sr: parseFloat(sr.toFixed(2)),
      attendanceRate: parseFloat(attendanceRate.toFixed(1)),
      winRate: matchesPlayed > 0 ? parseFloat(((wins / matchesPlayed) * 100).toFixed(1)) : 0,
      historyPoints
    };
  }

  // Obtiene ranking completo de todos los jugadores con sus estadísticas
  getAllPlayersWithStats() {
    return this.players.map(p => this.getPlayerStats(p.id));
  }

  // -------------------------------------------------------------
  //  GESTIÓN DE JUGADORES
  // -------------------------------------------------------------
  addPlayer({ name, emoji, positions }) {
    const id = 'p_' + Date.now();
    const newPlayer = {
      id,
      name: name.trim(),
      emoji: emoji || '⚽',
      positions: positions && positions.length > 0 ? positions.slice(0, 3) : ['centrocampista']
    };
    this.players.push(newPlayer);
    this.save();
    return newPlayer;
  }

  updatePlayer(id, { name, emoji, positions }) {
    const idx = this.players.findIndex(p => p.id === id);
    if (idx !== -1) {
      if (name) this.players[idx].name = name.trim();
      if (emoji) this.players[idx].emoji = emoji;
      if (positions) this.players[idx].positions = positions.slice(0, 3);
      this.save();
      return this.players[idx];
    }
    return null;
  }

  deletePlayer(id) {
    this.players = this.players.filter(p => p.id !== id);
    this.save();
  }

  // -------------------------------------------------------------
  //  GESTIÓN DE PARTIDOS Y VOTACIÓN MVP
  // -------------------------------------------------------------
  addMatch(matchData) {
    const id = 'm_' + Date.now();
    const match = {
      id,
      date: matchData.date || new Date().toISOString().split('T')[0],
      teamA: {
        name: matchData.teamA.name || 'Equipo Petos',
        score: parseInt(matchData.teamA.score, 10) || 0,
        players: matchData.teamA.players || []
      },
      teamB: {
        name: matchData.teamB.name || 'Equipo Sin Peto',
        score: parseInt(matchData.teamB.score, 10) || 0,
        players: matchData.teamB.players || []
      },
      playerStats: matchData.playerStats || {},
      mvp: matchData.mvp || null,
      mvpVotes: matchData.mvpVotes || {}
    };

    this.matches.unshift(match); // Al inicio (más reciente primero)
    this.save();
    return match;
  }

  updateMatch(id, updatedFields) {
    const idx = this.matches.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.matches[idx] = { ...this.matches[idx], ...updatedFields };
      this.save();
      return this.matches[idx];
    }
    return null;
  }

  deleteMatch(id) {
    this.matches = this.matches.filter(m => m.id !== id);
    this.save();
  }

  recordMvpVote(matchId, voterPlayerId, candidatePlayerId) {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return false;

    if (!match.mvpVotes) match.mvpVotes = {};
    match.mvpVotes[voterPlayerId] = candidatePlayerId;

    // Calcular si se define el MVP
    const tally = {};
    Object.values(match.mvpVotes).forEach(candId => {
      tally[candId] = (tally[candId] || 0) + 1;
    });

    let topVotes = 0;
    let topCandidate = null;
    Object.entries(tally).forEach(([candId, count]) => {
      if (count > topVotes) {
        topVotes = count;
        topCandidate = candId;
      }
    });

    if (topCandidate) {
      match.mvp = topCandidate;
    }

    this.save();
    return { match, tally, topCandidate };
  }

  setMatchMvp(matchId, candidatePlayerId) {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return false;
    match.mvp = candidatePlayerId;
    this.save();
    return match;
  }

  // -------------------------------------------------------------
  //  FORMACIÓN AUTOMÁTICA DE EQUIPOS
  // -------------------------------------------------------------
  // Reparte equipos intentando:
  // 1. Igualar el SR total/promedio de cada equipo
  // 2. Respetar posiciones preferidas (portero por equipo, equilibrio de defensas/medios/delanteros)
  balanceTeams(attendingPlayerIds) {
    if (!attendingPlayerIds || attendingPlayerIds.length < 2) {
      return { teamA: attendingPlayerIds || [], teamB: [], diffSR: 0 };
    }

    const playersData = attendingPlayerIds.map(id => this.getPlayerStats(id)).filter(Boolean);

    // Separar porteros preferidos
    const goalkeepers = playersData.filter(p => p.positions.includes(POSITIONS.PORTERO));
    const others = playersData.filter(p => !p.positions.includes(POSITIONS.PORTERO));

    // Ordenar de mayor a menor SR
    goalkeepers.sort((a, b) => b.sr - a.sr);
    others.sort((a, b) => b.sr - a.sr);

    const teamA = [];
    const teamB = [];
    let srA = 0;
    let srB = 0;

    // 1. Si hay porteros, repartirlos equilibradamente
    if (goalkeepers.length >= 2) {
      teamA.push(goalkeepers[0].id);
      srA += goalkeepers[0].sr;
      teamB.push(goalkeepers[1].id);
      srB += goalkeepers[1].sr;
      for (let i = 2; i < goalkeepers.length; i++) {
        others.push(goalkeepers[i]);
      }
      others.sort((a, b) => b.sr - a.sr);
    } else if (goalkeepers.length === 1) {
      teamA.push(goalkeepers[0].id);
      srA += goalkeepers[0].sr;
    }

    // 2. Reparto balanceado con tamaño parejo
    const targetSizePerTeam = Math.ceil(playersData.length / 2);

    others.forEach(player => {
      const canGoToA = teamA.length < targetSizePerTeam;
      const canGoToB = teamB.length < targetSizePerTeam;

      if (canGoToA && !canGoToB) {
        teamA.push(player.id);
        srA += player.sr;
      } else if (!canGoToA && canGoToB) {
        teamB.push(player.id);
        srB += player.sr;
      } else {
        if (srA <= srB) {
          teamA.push(player.id);
          srA += player.sr;
        } else {
          teamB.push(player.id);
          srB += player.sr;
        }
      }
    });

    const avgA = teamA.length > 0 ? (srA / teamA.length) : 0;
    const avgB = teamB.length > 0 ? (srB / teamB.length) : 0;

    return {
      teamA,
      teamB,
      totalSRA: parseFloat(srA.toFixed(2)),
      totalSRB: parseFloat(srB.toFixed(2)),
      avgSRA: parseFloat(avgA.toFixed(2)),
      avgSRB: parseFloat(avgB.toFixed(2)),
      diffSR: parseFloat(Math.abs(avgA - avgB).toFixed(2))
    };
  }

  // -------------------------------------------------------------
  //  EXPORTAR / IMPORTAR
  // -------------------------------------------------------------
  exportBackup() {
    return JSON.stringify({
      version: 1,
      timestamp: new Date().toISOString(),
      players: this.players,
      matches: this.matches
    }, null, 2);
  }

  importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.players) && Array.isArray(parsed.matches)) {
        this.players = parsed.players;
        this.matches = parsed.matches;
        this.save();
        return true;
      }
    } catch (e) {
      console.error('Error importando backup:', e);
    }
    return false;
  }
}

// Instancia global
window.PachangasData = new DataStore();
