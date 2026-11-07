/**
 * Configuración de puntuación y reglas de negocio de EGOL Fantasy
 * Basado en CAMBIOS_PUNTUACION.md
 */
import { SCORING_CONSTANTS } from './constants';

export const SCORING_CONFIG = {
  POINTS: {
    GOAL: 3,
    ASSIST: 2,
    SAVE: 1,
    OWN_GOAL: -2,
    WIN: 2,
    MVP: 3,
  },
  GOALS_AGAINST_BRACKETS: [
    { max: 0, pts: 10 },
    { max: 3, pts: 5 },
    { max: 5, pts: 3 },
    { max: 7, pts: 2 },
    { max: 10, pts: 1 },
    { max: Infinity, pts: 0 },
  ],
};

/**
 * Obtiene puntos por goles encajados basados en los tramos configurados.
 */
export function getGoalsAgainstPoints(goalsAgainst: number): number {
  const bracket = SCORING_CONFIG.GOALS_AGAINST_BRACKETS.find(b => goalsAgainst <= b.max);
  return bracket ? bracket.pts : 0;
}

export type PlayerStatType = 'goal' | 'assist' | 'own_goal' | 'save' | 'goal_against' | 'mvp' | 'win';

export interface ScoringInput {
  pachangaId: string;
  stats: {
    playerId: string;
    type: PlayerStatType;
    value: number;
  }[];
  winners: {
    team: 'A' | 'B';
    score: number;
  }[];
}

export const calculatePlayerPoints = (
  playerStat: { type: PlayerStatType; value: number },
  isGoalkeeper: boolean
): number => {
  switch (playerStat.type) {
    case 'goal':
      return playerStat.value * SCORING_CONFIG.POINTS.GOAL;
    case 'assist':
      return playerStat.value * SCORING_CONFIG.POINTS.ASSIST;
    case 'own_goal':
      return playerStat.value * SCORING_CONFIG.POINTS.OWN_GOAL;
    case 'win':
      return playerStat.value * SCORING_CONFIG.POINTS.WIN;
    case 'mvp':
      return playerStat.value * SCORING_CONFIG.POINTS.MVP;
    case 'save':
      return playerStat.value * SCORING_CONFIG.POINTS.SAVE;
    case 'goal_against':
      return getGoalsAgainstPoints(playerStat.value);
    default:
      return 0;
  }
};

/**
 * Calcula la parte subjetiva (0-10) de un jugador basada en el ranking de votos.
 *
 * @param playerRank - La posición media del jugador (P)
 * @param m - El número total de jugadores que cada votante debe ordenar (n - 1)
 * @param totalVoters - El número total de votantes en la pachanga
 * @returns La puntuación subjetiva (N_subj) redondeada a entero.
 */
export function calculateSubjectiveScore(
  playerRank: number,
  m: number,
  totalVoters: number
): number {
  if (totalVoters < SCORING_CONSTANTS.SUBJETIVO.MIN_VOTANTES_PARA_NEUTRO) {
    return SCORING_CONSTANTS.SUBJETIVO.NEUTRO;
  }

  // N_subj = 10 * (m - P) / (m - 1)
  const score = 10 * (m - playerRank) / (m - 1);
  return Math.round(score);
}

export const calculateObjectiveScore = (
  bruto: number
): number => {
  const tope = SCORING_CONSTANTS.OBJETIVO.TOPE_OBJ;
  const clamped = Math.min(tope, Math.max(0, bruto));
  const score = 10 * clamped / tope;
  return Math.round(score);
};

export const calculatePachangaScores = (
  pachangaId: string,
  managerPicks: any[],
  playerStats: any[],
  teamWinners: { team: 'A' | 'B'; score: number }[]
) => {
  const pointsMap: Record<string, number> = {};

  playerStats.forEach(stat => {
    const isGoalkeeper = stat.type === 'save' || stat.type === 'goal_against';
    const points = calculatePlayerPoints(stat, isGoalkeeper);
    pointsMap[stat.playerId] = (pointsMap[stat.playerId] || 0) + points;
  });

  const managerTotals: Record<string, number> = {};

  managerPicks.forEach(pick => {
    let total = 0;
    (pick.selectedPlayerIds || []).forEach((playerId: string) => {
      const points = pointsMap[playerId] || 0;
      if (playerId === pick.captainId) {
        total += points * 2;
      } else {
        total += points;
      }
    });
    managerTotals[pick.managerId] = total;
  });

  return managerTotals;
};
