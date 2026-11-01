import { Member } from '../types';

/**
 * Rule definitions from FANTASY_SPEC.md:
 * - Gol +1, asistencia +1, autogol -1, victoria +1, MVP +1 extra.
 * - Solo portero: parada +1, gol encajado -1.
 * - Quien no asiste puntúa 0.
 * - Puntos del manager = suma de puntos de sus jugadores, con el capitán x2.
 */

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
      return playerStat.value;
    case 'assist':
      return playerStat.value;
    case 'own_goal':
      return -(playerStat.value);
    case 'win':
      return playerStat.value;
    case 'mvp':
      return playerStat.value + 1;
    case 'save':
      if (isGoalkeeper) return playerStat.value;
      return 0;
    case 'goal_against':
      if (isGoalkeeper) return -(playerStat.value);
      return 0;
    default:
      return 0;
  }
};

export const calculatePachangaScores = (
  pachangaId: string,
  managerPicks: any[], // Picks for this pachanga
  playerStats: any[],   // Raw stats for this pachanga
  teamWinners: { team: 'A' | 'B'; score: number }[]
) => {
  // 1. Calculate base points for every player in this pachanga
  const pointsMap: Record<string, number> = {};

  // We assume playerStats is an array of entries: { playerId, type, value }
  playerStats.forEach(stat => {
    // We'd need to know if the player is a goalkeeper here.
    // For now, we'll assume a helper or a flag in the player profile.
    const isGoalkeeper = false; // Placeholder logic
    const points = calculatePlayerPoints(stat, isGoalkeeper);
    pointsMap[stat.playerId] = (pointsMap[stat.playerId] || 0) + points;
  });

  // 2. Add victory points
  // Only players who are on the winning team get the +1 'win' point?
  // The spec says "victoria +1". Usually this means every player on the winning team.
  // We need to know who is on which team for this pachanga.
  // Let's assume teamWinners tells us which team won.

  // 3. Calculate manager totals
  const managerTotals: Record<string, number> = {};

  managerPicks.forEach(pick => {
    let total = 0;
    pick.selectedPlayerIds.forEach(playerId => {
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
