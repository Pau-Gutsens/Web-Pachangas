// ============================================================
//  DATA.JS — FC Colla · Dades de jugadors i partits
// ============================================================

const DEFAULT_PLAYERS = [
  {
    id: 1, name: "Marc", emoji: "⚡", elo: 1485, goals: 22, assists: 9,
    matches: 28, wins: 17, draws: 5, losses: 6,
    streak: ["W","W","W","L","W"], value: 95, photo: null,
    eloHistory: [1340, 1365, 1390, 1410, 1430, 1455, 1468, 1485]
  },
  {
    id: 2, name: "Pau", emoji: "🔥", elo: 1462, goals: 18, assists: 12,
    matches: 26, wins: 15, draws: 4, losses: 7,
    streak: ["W","L","W","W","D"], value: 88, photo: null,
    eloHistory: [1320, 1345, 1380, 1402, 1420, 1438, 1450, 1462]
  },
  {
    id: 3, name: "Jordi", emoji: "💪", elo: 1431, goals: 14, assists: 8,
    matches: 25, wins: 13, draws: 6, losses: 6,
    streak: ["D","W","W","L","W"], value: 82, photo: null,
    eloHistory: [1310, 1328, 1355, 1372, 1390, 1408, 1420, 1431]
  },
  {
    id: 4, name: "Xavi", emoji: "🎯", elo: 1418, goals: 11, assists: 15,
    matches: 27, wins: 14, draws: 5, losses: 8,
    streak: ["W","D","L","W","W"], value: 79, photo: null,
    eloHistory: [1300, 1318, 1342, 1360, 1378, 1395, 1408, 1418]
  },
  {
    id: 5, name: "Dani", emoji: "🦁", elo: 1395, goals: 9, assists: 6,
    matches: 24, wins: 12, draws: 5, losses: 7,
    streak: ["L","W","W","D","W"], value: 72, photo: null,
    eloHistory: [1290, 1305, 1325, 1345, 1362, 1378, 1388, 1395]
  },
  {
    id: 6, name: "Toni", emoji: "🌊", elo: 1378, goals: 7, assists: 11,
    matches: 23, wins: 11, draws: 4, losses: 8,
    streak: ["W","L","D","W","L"], value: 68, photo: null,
    eloHistory: [1280, 1295, 1312, 1330, 1348, 1360, 1370, 1378]
  },
  {
    id: 7, name: "Sergi", emoji: "🎪", elo: 1352, goals: 13, assists: 4,
    matches: 22, wins: 10, draws: 6, losses: 6,
    streak: ["W","W","L","L","W"], value: 65, photo: null,
    eloHistory: [1270, 1282, 1298, 1315, 1328, 1340, 1348, 1352]
  },
  {
    id: 8, name: "Pol", emoji: "🏔️", elo: 1330, goals: 6, assists: 7,
    matches: 20, wins: 9, draws: 5, losses: 6,
    streak: ["D","L","W","W","D"], value: 61, photo: null,
    eloHistory: [1260, 1270, 1285, 1298, 1310, 1320, 1326, 1330]
  },
  {
    id: 9, name: "Roger", emoji: "⭐", elo: 1308, goals: 5, assists: 9,
    matches: 19, wins: 8, draws: 4, losses: 7,
    streak: ["L","D","W","L","W"], value: 57, photo: null,
    eloHistory: [1250, 1258, 1272, 1285, 1295, 1302, 1306, 1308]
  },
  {
    id: 10, name: "Nil", emoji: "🎭", elo: 1285, goals: 4, assists: 3,
    matches: 18, wins: 7, draws: 3, losses: 8,
    streak: ["L","L","W","D","L"], value: 52, photo: null,
    eloHistory: [1240, 1248, 1258, 1268, 1275, 1280, 1283, 1285]
  }
];

const DEFAULT_MATCHES = [
  {
    id: 1, rival: "FC Rival", date: "2026-06-08", score: [4, 1], mvp: 1,
    goals: [
      {player: 1, minute: 12}, {player: 2, minute: 28},
      {player: 1, minute: 45}, {player: 3, minute: 67}
    ],
    assists: [
      {player: 4, minute: 12}, {player: 1, minute: 28}, {player: 2, minute: 67}
    ]
  },
  {
    id: 2, rival: "Los Cracks", date: "2026-06-01", score: [2, 2], mvp: 4,
    goals: [
      {player: 7, minute: 22}, {player: 4, minute: 88}
    ],
    assists: [
      {player: 2, minute: 22}, {player: 6, minute: 88}
    ]
  },
  {
    id: 3, rival: "Team Astra", date: "2026-05-25", score: [3, 0], mvp: 2,
    goals: [
      {player: 2, minute: 15}, {player: 5, minute: 33}, {player: 1, minute: 71}
    ],
    assists: [
      {player: 3, minute: 15}, {player: 4, minute: 33}
    ]
  },
  {
    id: 4, rival: "Deportivo Sol", date: "2026-05-18", score: [1, 3], mvp: 8,
    goals: [
      {player: 3, minute: 44}
    ],
    assists: [
      {player: 7, minute: 44}
    ]
  },
  {
    id: 5, rival: "FC Rival", date: "2026-05-11", score: [5, 2], mvp: 1,
    goals: [
      {player: 1, minute: 8}, {player: 1, minute: 35},
      {player: 2, minute: 52}, {player: 6, minute: 63}, {player: 3, minute: 80}
    ],
    assists: [
      {player: 4, minute: 8}, {player: 5, minute: 35},
      {player: 1, minute: 52}, {player: 2, minute: 63}
    ]
  },
  {
    id: 6, rival: "Los Meteoros", date: "2026-05-04", score: [2, 1], mvp: 6,
    goals: [
      {player: 6, minute: 18}, {player: 4, minute: 76}
    ],
    assists: [
      {player: 2, minute: 18}, {player: 6, minute: 76}
    ]
  },
  {
    id: 7, rival: "Team Astra", date: "2026-04-27", score: [0, 2], mvp: null,
    goals: [],
    assists: []
  },
  {
    id: 8, rival: "Deportivo Sol", date: "2026-04-20", score: [3, 3], mvp: 3,
    goals: [
      {player: 3, minute: 10}, {player: 7, minute: 55}, {player: 2, minute: 90}
    ],
    assists: [
      {player: 1, minute: 10}, {player: 3, minute: 55}
    ]
  },
  {
    id: 9, rival: "Los Cracks", date: "2026-04-13", score: [4, 0], mvp: 5,
    goals: [
      {player: 5, minute: 20}, {player: 1, minute: 40},
      {player: 4, minute: 60}, {player: 8, minute: 78}
    ],
    assists: [
      {player: 2, minute: 20}, {player: 5, minute: 40}, {player: 1, minute: 60}
    ]
  },
  {
    id: 10, rival: "Galàxia FC", date: "2026-04-06", score: [1, 1], mvp: 9,
    goals: [
      {player: 9, minute: 65}
    ],
    assists: [
      {player: 4, minute: 65}
    ]
  },
  {
    id: 11, rival: "Los Meteoros", date: "2026-03-30", score: [3, 1], mvp: 2,
    goals: [
      {player: 2, minute: 5}, {player: 3, minute: 32}, {player: 1, minute: 89}
    ],
    assists: [
      {player: 1, minute: 5}, {player: 2, minute: 32}
    ]
  },
  {
    id: 12, rival: "Galàxia FC", date: "2026-03-23", score: [2, 0], mvp: 7,
    goals: [
      {player: 7, minute: 25}, {player: 5, minute: 68}
    ],
    assists: [
      {player: 3, minute: 25}, {player: 7, minute: 68}
    ]
  },
  {
    id: 13, rival: "FC Rival", date: "2026-03-16", score: [1, 2], mvp: null,
    goals: [
      {player: 4, minute: 50}
    ],
    assists: []
  },
  {
    id: 14, rival: "Deportivo Sol", date: "2026-03-09", score: [4, 2], mvp: 1,
    goals: [
      {player: 1, minute: 7}, {player: 2, minute: 30},
      {player: 1, minute: 55}, {player: 6, minute: 82}
    ],
    assists: [
      {player: 3, minute: 7}, {player: 4, minute: 30}, {player: 2, minute: 55}
    ]
  },
  {
    id: 15, rival: "Team Astra", date: "2026-03-02", score: [2, 2], mvp: 6,
    goals: [
      {player: 6, minute: 15}, {player: 9, minute: 78}
    ],
    assists: [
      {player: 2, minute: 15}
    ]
  }
];

// Season calendar: 20 jornades
const SEASON_CALENDAR = [
  { jornada: 1,  date: "2026-03-02", rival: "Team Astra",   matchId: 15 },
  { jornada: 2,  date: "2026-03-09", rival: "Deportivo Sol", matchId: 14 },
  { jornada: 3,  date: "2026-03-16", rival: "FC Rival",     matchId: 13 },
  { jornada: 4,  date: "2026-03-23", rival: "Galàxia FC",   matchId: 12 },
  { jornada: 5,  date: "2026-03-30", rival: "Los Meteoros",  matchId: 11 },
  { jornada: 6,  date: "2026-04-06", rival: "Galàxia FC",   matchId: 10 },
  { jornada: 7,  date: "2026-04-13", rival: "Los Cracks",   matchId: 9  },
  { jornada: 8,  date: "2026-04-20", rival: "Deportivo Sol", matchId: 8  },
  { jornada: 9,  date: "2026-04-27", rival: "Team Astra",   matchId: 7  },
  { jornada: 10, date: "2026-05-04", rival: "Los Meteoros",  matchId: 6  },
  { jornada: 11, date: "2026-05-11", rival: "FC Rival",     matchId: 5  },
  { jornada: 12, date: "2026-05-18", rival: "Deportivo Sol", matchId: 4  },
  { jornada: 13, date: "2026-05-25", rival: "Team Astra",   matchId: 3  },
  { jornada: 14, date: "2026-06-01", rival: "Los Cracks",   matchId: 2  },
  { jornada: 15, date: "2026-06-08", rival: "FC Rival",     matchId: 1  },
  { jornada: 16, date: "2026-06-15", rival: "Galàxia FC",   matchId: null },
  { jornada: 17, date: "2026-06-22", rival: "Los Meteoros",  matchId: null },
  { jornada: 18, date: "2026-06-29", rival: "Los Cracks",   matchId: null },
  { jornada: 19, date: "2026-07-06", rival: "Deportivo Sol", matchId: null },
  { jornada: 20, date: "2026-07-13", rival: "Team Astra",   matchId: null }
];

// Formation presets (positions as % of field, origin top-left)
const FORMATIONS = {
  "4-3-3": [
    { pos: "GK", x: 50, y: 88, label: "GK" },
    { pos: "RB", x: 80, y: 72, label: "RD" },
    { pos: "CB1", x: 62, y: 72, label: "DC" },
    { pos: "CB2", x: 38, y: 72, label: "DC" },
    { pos: "LB", x: 20, y: 72, label: "LE" },
    { pos: "CM1", x: 25, y: 52, label: "MC" },
    { pos: "CM2", x: 50, y: 48, label: "MC" },
    { pos: "CM3", x: 75, y: 52, label: "MC" },
    { pos: "RW", x: 78, y: 28, label: "ED" },
    { pos: "ST", x: 50, y: 18, label: "DC" },
    { pos: "LW", x: 22, y: 28, label: "EE" }
  ],
  "4-4-2": [
    { pos: "GK", x: 50, y: 88, label: "GK" },
    { pos: "RB", x: 80, y: 72, label: "RD" },
    { pos: "CB1", x: 62, y: 72, label: "DC" },
    { pos: "CB2", x: 38, y: 72, label: "DC" },
    { pos: "LB", x: 20, y: 72, label: "LE" },
    { pos: "RM", x: 80, y: 50, label: "MD" },
    { pos: "CM1", x: 60, y: 50, label: "MC" },
    { pos: "CM2", x: 40, y: 50, label: "MC" },
    { pos: "LM", x: 20, y: 50, label: "ME" },
    { pos: "ST1", x: 62, y: 22, label: "DC" },
    { pos: "ST2", x: 38, y: 22, label: "DC" }
  ],
  "3-5-2": [
    { pos: "GK", x: 50, y: 88, label: "GK" },
    { pos: "CB1", x: 70, y: 72, label: "DC" },
    { pos: "CB2", x: 50, y: 72, label: "DC" },
    { pos: "CB3", x: 30, y: 72, label: "DC" },
    { pos: "RM", x: 85, y: 52, label: "CD" },
    { pos: "CM1", x: 65, y: 50, label: "MC" },
    { pos: "CM2", x: 50, y: 46, label: "MC" },
    { pos: "CM3", x: 35, y: 50, label: "MC" },
    { pos: "LM", x: 15, y: 52, label: "CE" },
    { pos: "ST1", x: 62, y: 22, label: "DC" },
    { pos: "ST2", x: 38, y: 22, label: "DC" }
  ]
};

// ---- Utility helpers ----

function getPlayerById(players, id) {
  return players.find(p => p.id === id) || null;
}

function getMatchResult(score) {
  if (score[0] > score[1]) return 'W';
  if (score[0] < score[1]) return 'L';
  return 'D';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTopScorer(players) {
  return [...players].sort((a, b) => b.goals - a.goals)[0];
}

function getTopAssist(players) {
  return [...players].sort((a, b) => b.assists - a.assists)[0];
}

function getBestStreak(players) {
  // Best current winning streak
  return [...players].sort((a, b) => {
    const aWins = a.streak.filter(s => s === 'W').length;
    const bWins = b.streak.filter(s => s === 'W').length;
    return bWins - aWins;
  })[0];
}

function getTopElo(players) {
  return [...players].sort((a, b) => b.elo - a.elo)[0];
}

function getWinRate(player) {
  if (player.matches === 0) return 0;
  return Math.round((player.wins / player.matches) * 100);
}

function getAvgGoals(players) {
  const total = players.reduce((sum, p) => sum + p.goals, 0);
  return (total / players.length).toFixed(1);
}

function getAvgAssists(players) {
  const total = players.reduce((sum, p) => sum + p.assists, 0);
  return (total / players.length).toFixed(1);
}
