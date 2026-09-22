// ============================================================
//  DATA.JS — Motor de Datos, Estadísticas y SR para Pachangas
// ============================================================

const STORAGE_KEY = 'pachangas_data_v1';

// Posiciones válidas en el fútbol pachanga
const POSITIONS = {
  PORTERO: 'portero',
  DEFENSA: 'defensa',
  CENTROCAMPISTA: 'centrocampista',
  DELANTERO: 'delantero'
};

const POSITION_LABELS = {
  portero: { label: 'Portero', short: 'POR', emoji: '🧤' },
  defensa: { label: 'Defensa', short: 'DEF', emoji: '🛡️' },
  centrocampista: { label: 'Centrocampista', short: 'MED', emoji: '⚙️' },
  delantero: { label: 'Delantero', short: 'DEL', emoji: '⚡' }
};

// Jugadores iniciales por defecto (amigos de la pachanga)
const SEED_PLAYERS = [
  { id: 'p1', name: 'Pau', emoji: '🔥', positions: ['delantero', 'centrocampista'] },
  { id: 'p2', name: 'Marc', emoji: '⚡', positions: ['centrocampista', 'delantero'] },
  { id: 'p3', name: 'Jordi', emoji: '🧤', positions: ['portero', 'defensa'] },
  { id: 'p4', name: 'Xavi', emoji: '🎯', positions: ['centrocampista', 'defensa'] },
  { id: 'p5', name: 'Dani', emoji: '🛡️', positions: ['defensa', 'centrocampista'] },
  { id: 'p6', name: 'Toni', emoji: '🦁', positions: ['delantero', 'centrocampista'] },
  { id: 'p7', name: 'Sergi', emoji: '🧱', positions: ['defensa', 'portero'] },
  { id: 'p8', name: 'Pol', emoji: '🌪️', positions: ['centrocampista', 'delantero'] },
  { id: 'p9', name: 'Roger', emoji: '🎩', positions: ['delantero', 'defensa'] },
  { id: 'p10', name: 'Nil', emoji: '🧤', positions: ['portero'] },
  { id: 'p11', name: 'Álex', emoji: '🚀', positions: ['defensa', 'delantero'] },
  { id: 'p12', name: 'Adri', emoji: '💪', positions: ['centrocampista', 'defensa'] }
];

// Partidos históricos iniciales para arrancar con datos reales y consistentes
const SEED_MATCHES = [
  {
    id: 'm1',
    date: '2026-03-08',
    teamA: {
      name: 'Equipo Petos',
      score: 6,
      players: ['p1', 'p2', 'p5', 'p8', 'p10']
    },
    teamB: {
      name: 'Equipo Sin Peto',
      score: 4,
      players: ['p3', 'p4', 'p6', 'p7', 'p9']
    },
    playerStats: {
      p1: { team: 'A', isGoalkeeper: false, goals: 3, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p2: { team: 'A', isGoalkeeper: false, goals: 2, assists: 2, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p5: { team: 'A', isGoalkeeper: false, goals: 0, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p8: { team: 'A', isGoalkeeper: false, goals: 1, assists: 0, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p10: { team: 'A', isGoalkeeper: true, goals: 0, assists: 0, saves: 7, goalsConceded: 4, ownGoals: 0 },
      
      p3: { team: 'B', isGoalkeeper: true, goals: 0, assists: 0, saves: 5, goalsConceded: 6, ownGoals: 0 },
      p4: { team: 'B', isGoalkeeper: false, goals: 1, assists: 2, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p6: { team: 'B', isGoalkeeper: false, goals: 2, assists: 0, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p7: { team: 'B', isGoalkeeper: false, goals: 0, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p9: { team: 'B', isGoalkeeper: false, goals: 1, assists: 0, saves: 0, goalsConceded: 0, ownGoals: 0 }
    },
    mvp: 'p1',
    mvpVotes: { p1: 'p2', p2: 'p1', p5: 'p1', p8: 'p1', p10: 'p1', p3: 'p1', p4: 'p6', p6: 'p1', p7: 'p10', p9: 'p4' }
  },
  {
    id: 'm2',
    date: '2026-03-15',
    teamA: {
      name: 'Equipo Petos',
      score: 5,
      players: ['p2', 'p4', 'p6', 'p11', 'p3']
    },
    teamB: {
      name: 'Equipo Sin Peto',
      score: 5,
      players: ['p1', 'p5', 'p7', 'p9', 'p10']
    },
    playerStats: {
      p2: { team: 'A', isGoalkeeper: false, goals: 2, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p4: { team: 'A', isGoalkeeper: false, goals: 1, assists: 2, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p6: { team: 'A', isGoalkeeper: false, goals: 1, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p11: { team: 'A', isGoalkeeper: false, goals: 1, assists: 0, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p3: { team: 'A', isGoalkeeper: true, goals: 0, assists: 0, saves: 8, goalsConceded: 5, ownGoals: 0 },
      
      p1: { team: 'B', isGoalkeeper: false, goals: 3, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p5: { team: 'B', isGoalkeeper: false, goals: 0, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p7: { team: 'B', isGoalkeeper: false, goals: 1, assists: 0, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p9: { team: 'B', isGoalkeeper: false, goals: 1, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p10: { team: 'B', isGoalkeeper: true, goals: 0, assists: 0, saves: 6, goalsConceded: 5, ownGoals: 0 }
    },
    mvp: 'p3',
    mvpVotes: { p2: 'p3', p4: 'p3', p6: 'p1', p11: 'p3', p3: 'p1', p1: 'p3', p5: 'p3', p7: 'p1', p9: 'p3', p10: 'p3' }
  },
  {
    id: 'm3',
    date: '2026-03-21',
    teamA: {
      name: 'Equipo Petos',
      score: 3,
      players: ['p1', 'p3', 'p4', 'p12', 'p7']
    },
    teamB: {
      name: 'Equipo Sin Peto',
      score: 7,
      players: ['p2', 'p6', 'p8', 'p10', 'p11']
    },
    playerStats: {
      p1: { team: 'A', isGoalkeeper: false, goals: 2, assists: 0, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p3: { team: 'A', isGoalkeeper: true, goals: 0, assists: 0, saves: 4, goalsConceded: 7, ownGoals: 0 },
      p4: { team: 'A', isGoalkeeper: false, goals: 1, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p12: { team: 'A', isGoalkeeper: false, goals: 0, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p7: { team: 'A', isGoalkeeper: false, goals: 0, assists: 0, saves: 0, goalsConceded: 0, ownGoals: 1 },
      
      p2: { team: 'B', isGoalkeeper: false, goals: 3, assists: 2, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p6: { team: 'B', isGoalkeeper: false, goals: 2, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p8: { team: 'B', isGoalkeeper: false, goals: 1, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p11: { team: 'B', isGoalkeeper: false, goals: 1, assists: 1, saves: 0, goalsConceded: 0, ownGoals: 0 },
      p10: { team: 'B', isGoalkeeper: true, goals: 0, assists: 0, saves: 9, goalsConceded: 3, ownGoals: 0 }
    },
    mvp: 'p2',
    mvpVotes: { p1: 'p2', p3: 'p2', p4: 'p2', p12: 'p2', p7: 'p2', p2: 'p10', p6: 'p2', p8: 'p2', p10: 'p2', p11: 'p2' }
  }
];

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
  //  FÓRMULA ESTRICTA DE SR
  // -------------------------------------------------------------
  // Por cada partido:
  //   Gol: +1
  //   Asistencia: +1
  //   Parada (portero): +1
  //   Gol encajado (solo portero): -1
  //   Autogol: -1
  //   Victoria del equipo: +1
  //   MVP del partido: +1 extra
  // SR = total de puntos / partidos jugados (o 0 si no ha jugado ninguno)
  calculateMatchPointsForPlayer(playerId, match) {
    const stats = match.playerStats ? match.playerStats[playerId] : null;
    if (!stats) return null; // No jugó este partido

    const team = stats.team;
    let teamWon = false;
    if (team === 'A' && match.teamA.score > match.teamB.score) teamWon = true;
    if (team === 'B' && match.teamB.score > match.teamA.score) teamWon = true;

    const isMVP = (match.mvp === playerId);

    let points = 0;
    points += (stats.goals || 0) * 1;
    points += (stats.assists || 0) * 1;
    if (stats.isGoalkeeper) {
      points += (stats.saves || 0) * 1;
      points -= (stats.goalsConceded || 0) * 1;
    }
    points -= (stats.ownGoals || 0) * 1;
    if (teamWon) {
      points += 1;
    }
    if (isMVP) {
      points += 1;
    }

    return {
      points,
      teamWon,
      isMVP,
      stats
    };
  }

  // Obtiene estadísticas acumuladas y SR en tiempo real de un jugador
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
    let totalPoints = 0;
    const historyPoints = [];

    // Recorrer partidos ordenados cronológicamente
    const sortedMatches = [...this.matches].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedMatches.forEach(m => {
      const pData = this.calculateMatchPointsForPlayer(playerId, m);
      if (pData) {
        matchesPlayed++;
        totalPoints += pData.points;
        historyPoints.push(pData.points);

        const isTeamA = pData.stats.team === 'A';
        const myScore = isTeamA ? m.teamA.score : m.teamB.score;
        const rivalScore = isTeamA ? m.teamB.score : m.teamA.score;

        if (myScore > rivalScore) wins++;
        else if (myScore === rivalScore) draws++;
        else losses++;

        goals += pData.stats.goals || 0;
        assists += pData.stats.assists || 0;
        saves += pData.stats.saves || 0;
        goalsConceded += pData.stats.goalsConceded || 0;
        ownGoals += pData.stats.ownGoals || 0;
        if (pData.isMVP) mvpCount++;
      }
    });

    const totalGroupMatches = this.matches.length;
    const attendanceRate = totalGroupMatches > 0 ? (matchesPlayed / totalGroupMatches) * 100 : 0;
    const sr = matchesPlayed > 0 ? (totalPoints / matchesPlayed) : 0.0;

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
      totalPoints,
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
