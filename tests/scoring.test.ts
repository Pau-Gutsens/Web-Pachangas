import { calculatePlayerPoints, calculatePachangaScores, getGoalsAgainstPoints } from '../lib/scoring';

describe('EGOL Scoring Engine', () => {
  test('calculatePlayerPoints - goal gives 3 points', () => {
    expect(calculatePlayerPoints({ type: 'goal', value: 1 }, false)).toBe(3);
  });

  test('calculatePlayerPoints - own_goal deducts 2 points', () => {
    expect(calculatePlayerPoints({ type: 'own_goal', value: 1 }, false)).toBe(-2);
  });

  test('calculatePlayerPoints - goalkeeper save gives 1 point', () => {
    expect(calculatePlayerPoints({ type: 'save', value: 1 }, true)).toBe(1);
  });

  test('calculatePlayerPoints - goalkeeper clean sheet gives 10 points', () => {
    expect(getGoalsAgainstPoints(0)).toBe(10);
    expect(getGoalsAgainstPoints(2)).toBe(5);
    expect(getGoalsAgainstPoints(5)).toBe(3);
    expect(getGoalsAgainstPoints(7)).toBe(2);
    expect(getGoalsAgainstPoints(10)).toBe(1);
    expect(getGoalsAgainstPoints(12)).toBe(0);
  });

  test('calculatePachangaScores - simple match', () => {
    const stats = [
      { playerId: 'p1', type: 'goal', value: 1 },
      { playerId: 'p2', type: 'assist', value: 1 },
    ];
    const picks = [{
      managerId: 'm1',
      selectedPlayerIds: ['p1', 'p2'],
      captainId: 'p1'
    }];

    const scores = calculatePachangaScores('pach1', picks, stats, []);
    // p1 (captain) = 3 * 2 = 6
    // p2 = 2
    // total = 8
    expect(scores['m1']).toBe(8);
  });
});
