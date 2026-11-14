import {
  TOPE_OBJ,
  PUNTOS,
  SALVADA_MAX,
  MIN_VOTANTES,
  MIN_VOTOS_POR_GRUPO,
  VOTOS_NEUTRO,
  PRECIO_SENS,
  PRECIO_VAR_MAX,
  PRECIO_REDONDEO,
  CROMO_K,
  CROMO_MIN_PACHANGAS
} from './config.ts';
import type { PlayerMatchScore } from '../types/index.ts';

export interface PlayerStatsInput {
  playerId: string;
  team: 'A' | 'B';
  goals: number;
  assists: number;
  ownGoals: number;
  saves: number; // salvadas
}

export interface MatchScoreInput {
  scoreA: number;
  scoreB: number;
  stats: Record<string, PlayerStatsInput>; // playerId -> stats
  // rawVotes: mapa de voterPlayerId -> ranking de playerIds ordenados del 1 (mejor) al último (peor)
  // O bien pares [targetPlayerId, scoreEntre0y1]
  votesByVoter?: Record<string, string[]>;
  // Opcional para pruebas directas o votos normalizados:
  directNormalizedVotes?: Record<string, Record<string, number>>; // voterPlayerId -> { targetPlayerId: 0 a 1 }
  currentPrices?: Record<string, number>; // playerId -> precio actual en K€ (defecto 20000)
}

/**
 * Redondeo donde .5 sube siempre (como especifica EGOL_FANTASY.md)
 */
export function roundHalfUp(num: number): number {
  return Math.floor(num + 0.5);
}

/**
 * Calcula los puntos brutos de estadísticas de un jugador (sin contar MVP todavía).
 */
export function calculateRawStatsWithoutMvp(
  playerStats: PlayerStatsInput,
  scoreA: number,
  scoreB: number
): number {
  const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'draw';
  let pts = 0;

  // Goles y asistencias
  pts += (playerStats.goals || 0) * PUNTOS.GOL;
  pts += (playerStats.assists || 0) * PUNTOS.ASISTENCIA;

  // Autogoles
  pts += (playerStats.ownGoals || 0) * PUNTOS.AUTOGOL;

  // Salvadas (máximo 3)
  const clampedSaves = Math.min(SALVADA_MAX, Math.max(0, playerStats.saves || 0));
  pts += clampedSaves * PUNTOS.SALVADA;

  // Resultado
  if (winner === playerStats.team) {
    pts += PUNTOS.VICTORIA;
  } else if (winner === 'draw') {
    pts += PUNTOS.EMPATE;
  }

  return pts;
}

/**
 * Calcula la puntuación de Votos (0 a 10) para cada jugador según la Sección 6.2:
 * 1. Cada voto da (m - pos) / (m - 1), de 0 (último) a 1 (primero).
 * 2. Se calcula la media de los votos de sus compañeros y la de los rivales.
 * 3. Votos = 10 * (0.5 * media_compañeros + 0.5 * media_rivales).
 * 4. Si uno de los grupos tiene < 2 votos, se usa la media de todos juntos.
 * 5. Si hay menos de 4 votantes en total, Votos = 5 para todos.
 */
export function calculateVotes(
  participants: { id: string; team: 'A' | 'B' }[],
  votesByVoter?: Record<string, string[]>,
  directNormalizedVotes?: Record<string, Record<string, number>>
): Record<string, number> {
  const allParticipantIds = participants.map(p => p.id);
  const teamMap: Record<string, 'A' | 'B'> = {};
  participants.forEach(p => { teamMap[p.id] = p.team; });

  const voterIds = Object.keys(directNormalizedVotes || votesByVoter || {});

  // Menos de 4 votantes: Votos neutro (5) para todos
  if (voterIds.length < MIN_VOTANTES) {
    const defaultVotes: Record<string, number> = {};
    allParticipantIds.forEach(id => {
      defaultVotes[id] = VOTOS_NEUTRO;
    });
    return defaultVotes;
  }

  // Normalizar los votos a valores [0, 1]
  // normalizedVotes: voterId -> { targetId -> score 0 a 1 }
  const normalizedVotes: Record<string, Record<string, number>> = {};

  if (directNormalizedVotes) {
    Object.entries(directNormalizedVotes).forEach(([voterId, targets]) => {
      normalizedVotes[voterId] = targets;
    });
  } else if (votesByVoter) {
    Object.entries(votesByVoter).forEach(([voterId, ranking]) => {
      const m = ranking.length;
      normalizedVotes[voterId] = {};
      if (m <= 1) {
        if (m === 1) normalizedVotes[voterId][ranking[0]] = 1;
      } else {
        ranking.forEach((targetId, index) => {
          const pos = index + 1; // 1-indexed (1 = mejor, m = peor)
          const score = (m - pos) / (m - 1);
          normalizedVotes[voterId][targetId] = score;
        });
      }
    });
  }

  const result: Record<string, number> = {};

  allParticipantIds.forEach(targetId => {
    const targetTeam = teamMap[targetId];
    const teammateScores: number[] = [];
    const rivalScores: number[] = [];
    const allScores: number[] = [];

    Object.entries(normalizedVotes).forEach(([voterId, targetScores]) => {
      // Un votante no se vota a sí mismo
      if (voterId === targetId) return;

      const score = targetScores[targetId];
      if (score === undefined) return;

      allScores.push(score);
      const voterTeam = teamMap[voterId];
      if (voterTeam === targetTeam) {
        teammateScores.push(score);
      } else if (voterTeam && voterTeam !== targetTeam) {
        rivalScores.push(score);
      }
    });

    if (allScores.length === 0) {
      result[targetId] = VOTOS_NEUTRO;
      return;
    }

    // Si uno de los dos grupos tiene menos de 2 votos, se usa la media de todos juntos
    if (teammateScores.length < MIN_VOTOS_POR_GRUPO || rivalScores.length < MIN_VOTOS_POR_GRUPO) {
      const avgAll = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      result[targetId] = 10 * avgAll;
    } else {
      const avgTeammates = teammateScores.reduce((a, b) => a + b, 0) / teammateScores.length;
      const avgRivals = rivalScores.reduce((a, b) => a + b, 0) / rivalScores.length;
      result[targetId] = 10 * (0.5 * avgTeammates + 0.5 * avgRivals);
    }
  });

  return result;
}

/**
 * Calcula la puntuación completa de todos los jugadores de un partido,
 * incluyendo MVP, estadísticas (0-10), votos (0-10), total entero y variación de precios.
 */
export function calculateMatchScores(input: MatchScoreInput): Record<string, PlayerMatchScore> {
  const participants = Object.values(input.stats).map(s => ({ id: s.playerId, team: s.team }));
  const participantIds = participants.map(p => p.id);

  if (participantIds.length === 0) return {};

  // 1. Calcular Votos (0 a 10)
  const votesMap = calculateVotes(participants, input.votesByVoter, input.directNormalizedVotes);

  // 2. Calcular Estadísticas brutas sin MVP
  const rawWithoutMvp: Record<string, number> = {};
  participantIds.forEach(id => {
    rawWithoutMvp[id] = calculateRawStatsWithoutMvp(input.stats[id], input.scoreA, input.scoreB);
  });

  // 3. Determinar MVP:
  // "El jugador con mejor nota de Votos del partido (sin redondear).
  // Empate: el de más puntos en bruto sin contar el MVP. Puede ser un invitado."
  let bestVote = -1;
  let mvpCandidateId: string | null = null;
  let bestTieRaw = -999;

  participantIds.forEach(id => {
    const v = votesMap[id] ?? 0;
    const raw = rawWithoutMvp[id] ?? 0;
    if (v > bestVote + 1e-9) {
      bestVote = v;
      mvpCandidateId = id;
      bestTieRaw = raw;
    } else if (Math.abs(v - bestVote) <= 1e-9) {
      // Empate en votos: desempata el de más bruto
      if (raw > bestTieRaw) {
        mvpCandidateId = id;
        bestTieRaw = raw;
      }
    }
  });

  // 4. Calcular Estadísticas (0-10) y Totales
  // Estadísticas = 10 * clamp(bruto, 0, 20) / 20
  const totals: Record<string, number> = {};
  const rawTotals: Record<string, number> = {};
  const statsPointsMap: Record<string, number> = {};

  participantIds.forEach(id => {
    const isMvp = (id === mvpCandidateId);
    const raw = rawWithoutMvp[id] + (isMvp ? PUNTOS.MVP : 0);
    rawTotals[id] = raw;

    const clampedBruto = Math.max(0, Math.min(TOPE_OBJ, raw));
    const statsPts = 10 * (clampedBruto / TOPE_OBJ);
    statsPointsMap[id] = statsPts;

    const votesPts = votesMap[id] ?? 0;
    const sum = statsPts + votesPts;
    totals[id] = roundHalfUp(sum);
  });

  // 5. Calcular media de la jornada (media de los totales enteros de todos los participantes)
  const allTotals = Object.values(totals);
  const media_de_la_jornada = allTotals.reduce((a, b) => a + b, 0) / allTotals.length;

  // 6. Variación de precios
  // variación_% = clamp(PRECIO_SENS * (puntos - media_de_la_jornada), -PRECIO_VAR_MAX, +PRECIO_VAR_MAX)
  // nuevo_precio = round((precio_actual * (1 + variacion / 100)) / 10) * 10
  const scores: Record<string, PlayerMatchScore> = {};

  participantIds.forEach(id => {
    const pts = totals[id];
    const diff = pts - media_de_la_jornada;
    const varPct = Math.max(-PRECIO_VAR_MAX, Math.min(PRECIO_VAR_MAX, PRECIO_SENS * diff));

    const currentPrice = input.currentPrices?.[id] ?? 20000;
    const rawNewPrice = currentPrice * (1 + varPct / 100);
    const newPrice = Math.round(rawNewPrice / PRECIO_REDONDEO) * PRECIO_REDONDEO;

    scores[id] = {
      playerId: id,
      rawStats: rawTotals[id],
      statsPoints: statsPointsMap[id],
      votesPoints: votesMap[id] ?? 0,
      totalPoints: pts,
      isMvp: id === mvpCandidateId,
      priceChangePct: varPct,
      newPrice: Math.max(10, newPrice)
    };
  });

  return scores;
}

/**
 * Calcula los puntos de un manager a partir de su foto de alineación y las puntuaciones del partido.
 * "Puntos del manager en una jornada = suma de los puntos enteros de los 5 titulares
 * de su foto de alineación, con el capitán x2. Un jugador que no participó suma 0."
 */
export function calculateManagerPoints(
  lineup: { starters: string[]; captainId?: string | null; reserveId?: string | null },
  playerScores: Record<string, PlayerMatchScore>
): { totalPoints: number; breakdown: Record<string, number> } {
  let total = 0;
  const breakdown: Record<string, number> = {};

  lineup.starters.forEach(pId => {
    const sc = playerScores[pId];
    const basePts = sc ? sc.totalPoints : 0;
    const isCap = (pId === lineup.captainId);
    const pts = isCap ? basePts * 2 : basePts;
    breakdown[pId] = pts;
    total += pts;
  });

  return { totalPoints: total, breakdown };
}

/**
 * Calcula la nota media del cromo (ajustada con fórmula Bayesiana de la Sección 6.3):
 * (suma_votos + CROMO_K * media_del_grupo) / (pachangas_con_nota + CROMO_K)
 * Muestra null si tiene menos de CROMO_MIN_PACHANGAS (3).
 */
export function calculateCromoRating(
  playerSeasonVotesSum: number,
  playerSeasonMatches: number,
  groupSeasonVotesMean: number
): number | null {
  if (playerSeasonMatches < CROMO_MIN_PACHANGAS) {
    return null;
  }
  const adjusted = (playerSeasonVotesSum + CROMO_K * groupSeasonVotesMean) / (playerSeasonMatches + CROMO_K);
  return Math.round(adjusted * 10) / 10;
}
