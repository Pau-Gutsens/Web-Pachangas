import { Member } from '../types';

/**
 * Reglas de puntuación oficial EGOL Fantasy (Puntos enteros, sin decimales):
 * - Gol: +3 pts
 * - Asistencia: +2 pts
 * - Parada: +1 pt
 * - Autogol: -2 pts
 * - Victoria del equipo: +2 pts
 * 
 * Escala por tramos de goles encajados (para porteros / defensa en meta):
 * - 0 goles encajados: +10 pts (portería a 0)
 * - 1 a 3 goles encajados: +5 pts
 * - 4 a 5 goles encajados: +3 pts
 * - 6 a 7 goles encajados: +2 pts
 * - 8 a 10 goles encajados: +1 pt
 * - Más de 10 goles: 0 pts
 */

export function getGoalsAgainstPoints(goalsAgainst: number): number {
  if (goalsAgainst <= 0) return 10;
  if (goalsAgainst <= 3) return 5;
  if (goalsAgainst <= 5) return 3;
  if (goalsAgainst <= 7) return 2;
  if (goalsAgainst <= 10) return 1;
  return 0;
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
      return playerStat.value * 3;
    case 'assist':
      return playerStat.value * 2;
    case 'own_goal':
      return -(playerStat.value * 2);
    case 'win':
      return playerStat.value * 2;
    case 'mvp':
      return playerStat.value * 3;
    case 'save':
      return playerStat.value * 1;
    case 'goal_against':
      return getGoalsAgainstPoints(playerStat.value);
    default:
      return 0;
  }
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

