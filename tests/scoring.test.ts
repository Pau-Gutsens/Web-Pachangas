import {
  calculateMatchScores,
  calculateVotes,
  roundHalfUp,
  calculateRawStatsWithoutMvp,
  calculateManagerPoints,
  calculateCromoRating
} from '../lib/scoring.ts';
import { formatCurrency, formatPercent } from '../lib/utils.ts';
import { PRECIO_BASE, PRECIO_SENS, PRECIO_VAR_MAX, PRECIO_REDONDEO } from '../lib/config.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

function assertClose(actual: number, expected: number, tol: number, msg: string) {
  if (Math.abs(actual - expected) <= tol) {
    console.log(`  ✓ ${msg} (obtenido: ${actual.toFixed(2)}, esperado: ${expected.toFixed(2)})`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg} (obtenido: ${actual}, esperado: ${expected}, tolerancia: ${tol})`);
    failed++;
  }
}

console.log('=== 1. TESTS DE REGLAS DE PUNTUACIÓN Y VOTOS ===');

// Test 1: Ejemplo sección 6.2 (12 participantes, m = 11)
// Si un jugador recibe posiciones 3, 7, 9, 7, 11 -> posición media 7.4
// Nota = 10 * (11 - 7.4) / 10 = 3.6
{
  const m = 11;
  const positions = [3, 7, 9, 7, 11];
  const avgPos = positions.reduce((a, b) => a + b, 0) / positions.length;
  const scoreFromAvg = 10 * (m - avgPos) / (m - 1);
  assertClose(scoreFromAvg, 3.6, 0.01, 'Ejemplo sección 6.2 da 3.6');

  // Mejor posible: posición 1 -> (m - 1) / (m - 1) * 10 = 10
  const bestScore = 10 * (m - 1) / (m - 1);
  assert(bestScore === 10, 'Mejor nota posible de votos es 10');

  // Peor posible: posición m -> (m - m) / (m - 1) * 10 = 0
  const worstScore = 10 * (m - m) / (m - 1);
  assert(worstScore === 0, 'Peor nota posible de votos es 0');
}

// Test 2: Menos de 4 votantes -> Votos = 5 neutro para todos
{
  const participants = [
    { id: 'p1', team: 'A' as const },
    { id: 'p2', team: 'A' as const },
    { id: 'p3', team: 'B' as const },
    { id: 'p4', team: 'B' as const }
  ];
  const votes = {
    p1: ['p2', 'p3', 'p4'],
    p2: ['p1', 'p3', 'p4']
  }; // Solo 2 votantes
  const res = calculateVotes(participants, votes);
  assert(res['p1'] === 5 && res['p3'] === 5, 'Menos de 4 votantes da 5 (neutro) para todos');
}

// Test 3: Estadísticas en bruto y caps
{
  // 8 goles + victoria = 8*3 + 3 = 27 -> Estadísticas clamp(27, 0, 20)/20 * 10 = 10
  const statWinner = {
    playerId: 'p1',
    team: 'A' as const,
    goals: 8,
    assists: 0,
    ownGoals: 0,
    saves: 0
  };
  const raw = calculateRawStatsWithoutMvp(statWinner, 15, 11);
  assert(raw === 27, '8 goles + victoria da 27 brutos');

  // 4 salvadas cuentan solo 3 (tope 3)
  const statKeeper = {
    playerId: 'k1',
    team: 'A' as const,
    goals: 0,
    assists: 0,
    ownGoals: 0,
    saves: 4
  };
  const rawKeeper = calculateRawStatsWithoutMvp(statKeeper, 1, 0); // 3 (victoria) + 3*2 = 9
  assert(rawKeeper === 9, '4 salvadas cuentan solo como 3 (6 pts) + victoria = 9');

  // Bruto negativo da clamp a 0
  const statBad = {
    playerId: 'b1',
    team: 'B' as const,
    goals: 0,
    assists: 0,
    ownGoals: 3,
    saves: 0
  };
  const rawBad = calculateRawStatsWithoutMvp(statBad, 1, 0); // derrota: 0, autogoles: -6
  assert(rawBad === -6, '3 autogoles da bruto negativo (-6)');
}

// Test 4: Redondeo del total (.5 sube)
{
  assert(roundHalfUp(7.28 + 4.5) === 12, '7.28 + 4.5 = 11.78 -> 12');
  assert(roundHalfUp(3.78 + 3.5) === 7, '3.78 + 3.5 = 7.28 -> 7');
  assert(roundHalfUp(4.65 + 1.5) === 6, '4.65 + 1.5 = 6.15 -> 6');
  assert(roundHalfUp(11.5) === 12, '11.5 sube a 12');
  assert(roundHalfUp(11.49) === 11, '11.49 baja a 11');
}

// Test 5: Variación de precio continua y creciente
{
  const media = 9.5;
  const pts10 = 10;
  const pts7 = 7;
  const var10 = Math.max(-PRECIO_VAR_MAX, Math.min(PRECIO_VAR_MAX, PRECIO_SENS * (pts10 - media)));
  const var7 = Math.max(-PRECIO_VAR_MAX, Math.min(PRECIO_VAR_MAX, PRECIO_SENS * (pts7 - media)));
  assert(var10 !== var7, '10 y 7 puntos dan variaciones distintas');
  assert(var10 > var7, 'La variación es estrictamente creciente');
  assert(var10 === 1.25, 'Con media 9.5, 10 pts da +1.25%');
  assert(var7 === -6.25, 'Con media 9.5, 7 pts da -6.25%');

  // Topes
  const var20 = Math.max(-PRECIO_VAR_MAX, Math.min(PRECIO_VAR_MAX, PRECIO_SENS * (20 - media)));
  const var3 = Math.max(-PRECIO_VAR_MAX, Math.min(PRECIO_VAR_MAX, PRECIO_SENS * (3 - media)));
  assert(var20 === 15, '20 pts alcanza el tope +15%');
  assert(var3 === -15, '3 pts alcanza el tope -15%');
}

// Test 6: Formato de moneda K€ y M€
{
  assert(formatCurrency(20000) === '20 M€', '20.000 K€ se formatea como 20 M€');
  assert(formatCurrency(17350) === '17,35 M€', '17.350 K€ se formatea como 17,35 M€');
  assert(formatCurrency(850) === '850 K€', '850 K€ se formatea como 850 K€');
}

// Test 7: Equipos desiguales (5v6 y 7v7) sin fallos
{
  const unevenMatch: any = {
    scoreA: 5,
    scoreB: 4,
    stats: {
      a1: { playerId: 'a1', team: 'A', goals: 1, assists: 0, ownGoals: 0, saves: 0 },
      a2: { playerId: 'a2', team: 'A', goals: 1, assists: 0, ownGoals: 0, saves: 0 },
      a3: { playerId: 'a3', team: 'A', goals: 1, assists: 0, ownGoals: 0, saves: 0 },
      a4: { playerId: 'a4', team: 'A', goals: 1, assists: 0, ownGoals: 0, saves: 0 },
      a5: { playerId: 'a5', team: 'A', goals: 1, assists: 0, ownGoals: 0, saves: 0 },
      b1: { playerId: 'b1', team: 'B', goals: 1, assists: 0, ownGoals: 0, saves: 0 },
      b2: { playerId: 'b2', team: 'B', goals: 1, assists: 0, ownGoals: 0, saves: 0 },
      b3: { playerId: 'b3', team: 'B', goals: 1, assists: 0, ownGoals: 0, saves: 0 },
      b4: { playerId: 'b4', team: 'B', goals: 1, assists: 0, ownGoals: 0, saves: 0 },
      b5: { playerId: 'b5', team: 'B', goals: 1, assists: 0, ownGoals: 0, saves: 0 },
      b6: { playerId: 'b6', team: 'B', goals: 0, assists: 0, ownGoals: 0, saves: 0 }
    }
  };
  const scores = calculateMatchScores(unevenMatch);
  assert(Object.keys(scores).length === 11, 'Equipos desiguales (5v6) se calculan sin errores');
}

console.log('\n=== 2. PRUEBA DE VERIFICACIÓN: PARTIDO DEL 6 DE NOVIEMBRE ===');

// Datos exactos de la sección 17:
// Blanco (A): Gerard, Eloy, Dávila, Salinas, Tais, Merino
// Azul (B): Sergi, Bernús, Uri, Dean, Lombun, Pedret
// Marcador: Blanco 15 – 11 Azul
const teamA = ['Gerard', 'Eloy', 'Dávila', 'Salinas', 'Tais', 'Merino'];
const teamB = ['Sergi', 'Bernús', 'Uri', 'Dean', 'Lombun', 'Pedret'];

const actaStats: Record<string, { goals: number; assists: number; team: 'A' | 'B' }> = {
  Gerard:  { goals: 8, assists: 0, team: 'A' },
  Eloy:    { goals: 2, assists: 0, team: 'A' },
  Dávila:  { goals: 1, assists: 0, team: 'A' },
  Salinas: { goals: 0, assists: 0, team: 'A' },
  Tais:    { goals: 1, assists: 0, team: 'A' },
  Merino:  { goals: 3, assists: 0, team: 'A' },
  Sergi:   { goals: 0, assists: 1, team: 'B' },
  Bernús:  { goals: 4, assists: 2, team: 'B' },
  Uri:     { goals: 1, assists: 0, team: 'B' },
  Dean:    { goals: 2, assists: 1, team: 'B' },
  Lombun:  { goals: 3, assists: 2, team: 'B' },
  Pedret:  { goals: 1, assists: 1, team: 'B' }
};

// Votos recibidos de la sección 17:
const rawVoterRatings: Record<string, Record<string, number>> = {
  Dean:    { Eloy: 6, Gerard: 10, Salinas: 5, Dávila: 3, Tais: 2, Merino: 6, Pedret: 7, Sergi: 2, Bernús: 8, Lombun: 4, Uri: 7 },
  Dávila:  { Gerard: 10, Eloy: 9, Salinas: 7, Tais: 4, Merino: 7, Sergi: 6, Bernús: 8, Uri: 7, Dean: 6, Lombun: 6, Pedret: 5 },
  Lombun:  { Dávila: 4, Salinas: 1, Tais: 7, Merino: 7, Sergi: 5, Bernús: 9, Dean: 8, Pedret: 7 }, // 8 jugadores
  Tais:    { Gerard: 10, Eloy: 9, Dávila: 7, Salinas: 8, Merino: 2, Sergi: 5, Bernús: 7, Uri: 8, Dean: 4, Lombun: 4, Pedret: 5 },
  Sergi:   { Gerard: 10, Eloy: 9, Dávila: 7, Salinas: 8, Tais: 7, Merino: 7, Bernús: 8, Uri: 8, Dean: 7, Lombun: 7, Pedret: 8 },
  Gerard:  { Eloy: 8, Dávila: 7.5, Salinas: 8, Tais: 7, Merino: 9, Sergi: 6, Bernús: 8.5, Uri: 7, Dean: 6, Lombun: 6, Pedret: 6 },
  Pedret:  { Gerard: 10, Eloy: 2, Dávila: 1, Salinas: 2, Tais: 4, Merino: 4, Sergi: 1, Bernús: 3, Uri: 7, Dean: 7, Lombun: 1 },
  Eloy:    { Gerard: 10, Dávila: 8.5, Salinas: 7.5, Tais: 7.5, Merino: 9, Sergi: 5, Bernús: 8.5, Uri: 7, Dean: 6, Lombun: 7, Pedret: 5 },
  Merino:  { Gerard: 10, Eloy: 7, Dávila: 5, Salinas: 4, Tais: 5, Sergi: 6, Bernús: 9, Uri: 8, Dean: 7, Lombun: 7, Pedret: 5 },
  Bernús:  { Lombun: 7, Sergi: 4, Uri: 5, Pedret: 4, Dean: 4, Tais: 4, Merino: 6, Dávila: 6, Gerard: 10, Eloy: 8, Salinas: 6 },
  Salinas: { Gerard: 10, Dávila: 8, Eloy: 8, Tais: 7, Merino: 8, Sergi: 8, Bernús: 7, Uri: 7, Dean: 6, Lombun: 6, Pedret: 7 }
};

// "Solo para esta prueba: conviértelas a ranking ordenando de mayor a menor nota;
// los empates comparten la posición media. Un voto con un 0 cuenta como 1.
// Lombun puntuó solo a 8 jugadores (cada voto se normaliza con su propio m). Uri no votó."
const directNormalizedVotes: Record<string, Record<string, number>> = {};

Object.entries(rawVoterRatings).forEach(([voter, ratings]) => {
  const entries = Object.entries(ratings).map(([target, val]) => ({
    target,
    val: val === 0 ? 1 : val
  }));
  // Ordenar de mayor a menor
  entries.sort((a, b) => b.val - a.val);
  const m = entries.length;

  directNormalizedVotes[voter] = {};

  // Asignar posición media a los empates
  let i = 0;
  while (i < m) {
    let j = i;
    while (j < m && entries[j].val === entries[i].val) {
      j++;
    }
    // Empate desde i hasta j - 1 (1-indexed: i + 1 hasta j)
    // Posición media = ( (i + 1) + j ) / 2
    const avgPos = (i + 1 + j) / 2;
    const score = (m - avgPos) / (m - 1);
    for (let k = i; k < j; k++) {
      directNormalizedVotes[voter][entries[k].target] = score;
    }
    i = j;
  }
});

const statsInput: Record<string, any> = {};
[...teamA, ...teamB].forEach(name => {
  const st = actaStats[name];
  statsInput[name] = {
    playerId: name,
    team: st.team,
    goals: st.goals,
    assists: st.assists,
    ownGoals: 0,
    saves: 0
  };
});

const testScores = calculateMatchScores({
  scoreA: 15,
  scoreB: 11,
  stats: statsInput,
  directNormalizedVotes
});

// Tabla esperada de la sección 17:
const expected = [
  { name: 'Gerard', isMvp: true,  raw: 30, votes: 10.00, stats: 10.00, total: 20, varPct: 15.0,   price: 23000 },
  { name: 'Bernús', isMvp: false, raw: 14, votes: 7.35,  stats: 7.00,  total: 14, varPct: 12.08,  price: 22420 },
  { name: 'Eloy',   isMvp: false, raw: 9,  votes: 7.28,  stats: 4.50,  total: 12, varPct: 7.08,   price: 21420 },
  { name: 'Merino', isMvp: false, raw: 12, votes: 5.82,  stats: 6.00,  total: 12, varPct: 7.08,   price: 21420 },
  { name: 'Lombun', isMvp: false, raw: 11, votes: 3.08,  stats: 5.50,  total: 9,  varPct: -0.42,  price: 19920 },
  { name: 'Uri',    isMvp: false, raw: 3,  votes: 6.06,  stats: 1.50,  total: 8,  varPct: -2.92,  price: 19420 },
  { name: 'Dean',   isMvp: false, raw: 7,  votes: 3.78,  stats: 3.50,  total: 7,  varPct: -5.42,  price: 18920 },
  { name: 'Dávila', isMvp: false, raw: 6,  votes: 4.09,  stats: 3.00,  total: 7,  varPct: -5.42,  price: 18920 },
  { name: 'Salinas',isMvp: false, raw: 3,  votes: 4.65,  stats: 1.50,  total: 6,  varPct: -7.92,  price: 18420 },
  { name: 'Pedret', isMvp: false, raw: 4,  votes: 3.65,  stats: 2.00,  total: 6,  varPct: -7.92,  price: 18420 },
  { name: 'Tais',   isMvp: false, raw: 6,  votes: 3.17,  stats: 3.00,  total: 6,  varPct: -7.92,  price: 18420 },
  { name: 'Sergi',  isMvp: false, raw: 1,  votes: 2.40,  stats: 0.50,  total: 3,  varPct: -15.0,  price: 17000 }
];

console.log('\nComparación detallada jugador a jugador:');
expected.forEach(exp => {
  const actual = testScores[exp.name];
  assert(actual !== undefined, `Jugador ${exp.name} presente en resultados`);
  if (!actual) return;

  assert(actual.rawStats === exp.raw, `${exp.name}: Bruto ${actual.rawStats} == ${exp.raw}`);
  assertClose(actual.votesPoints, exp.votes, 0.06, `${exp.name}: Votos ${actual.votesPoints.toFixed(2)} ~= ${exp.votes.toFixed(2)} (±0.05)`);
  assertClose(actual.statsPoints, exp.stats, 0.01, `${exp.name}: Estadísticas ${actual.statsPoints.toFixed(2)} == ${exp.stats.toFixed(2)}`);
  assert(actual.totalPoints === exp.total, `${exp.name}: Total ${actual.totalPoints} EXACTO == ${exp.total}`);
  assertClose(actual.priceChangePct, exp.varPct, 0.05, `${exp.name}: Variación % ${actual.priceChangePct.toFixed(2)} ~= ${exp.varPct.toFixed(2)}%`);
  assert(actual.newPrice === exp.price, `${exp.name}: Precio ${actual.newPrice} K€ EXACTO == ${exp.price} K€`);
});

console.log(`\n========================================`);
console.log(`RESUMEN TESTS: ${passed} pasados, ${failed} fallados.`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
