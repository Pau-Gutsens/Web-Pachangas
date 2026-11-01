import { calculatePlayerPoints, calculatePachangaScores } from '../lib/scoring';

describe('Scoring Engine', () => {
  test('calculatePlayerPoints - goal', () => {
    expect(calculatePlayerPoints({ type: 'goal', value: 1 }, false)).toBe(1);
  });

  test('calculatePlayerPoints - own_goal', () => {
    expect(calculatePlayerPoints({ type: 'own_goal', value: 1 }, false)).toBe(-1);
  });

  test('calculatePlayerPoints - mvp', () => {
    expect(calculatePlayerPoints({ type: 'mvp', value: 1 }, false)).toBe(2);
  });

  test('calculatePlayerPoints - goalkeeper save', () => {
    expect(calculatePlayerPoints({ type: 'save', value: 1 }, true)).toBe(1);
    expect(calculatePlayerPoints({ type: 'save', value: 1 }, false)).toBe(0);
  });

  test('calculatePlayerPoints - goalkeeper goal_against', () => {
    expect(calculatePlayerPoints({ type: 'goal_against', value: 1 }, true)).toBe(-1);
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
    // p1 (captain) = 1 * 2 = 2
    // p2 = 1
    // total = 3
    expect(scores['m1']).toBe(3);
  });
});
