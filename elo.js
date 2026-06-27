// ============================================================
//  ELO.JS — Sistema de ranking ELO per a FC Colla
// ============================================================

const ELO = {
  K: 32,
  BASE: 1400,

  /**
   * Expected score for player A against player B
   */
  expected(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  },

  /**
   * Calculate new ELO rating
   * @param {number} rating - Current rating
   * @param {number} expected - Expected score (0-1)
   * @param {number} actual - Actual score (1=win, 0.5=draw, 0=loss)
   * @param {number} k - K-factor (default 32)
   */
  calculate(rating, expected, actual, k = this.K) {
    return Math.round(rating + k * (actual - expected));
  },

  /**
   * Process a match result and update ELO for all involved players
   * Returns updated players array
   */
  processMatch(players, match) {
    const updated = players.map(p => ({...p}));
    const result = match.score[0] > match.score[1] ? 'W'
                 : match.score[0] < match.score[1] ? 'L' : 'D';

    // Get players who participated (scored or assisted)
    const involvedIds = new Set();
    match.goals.forEach(g => involvedIds.add(g.player));
    match.assists.forEach(a => involvedIds.add(a.player));
    if (match.mvp) involvedIds.add(match.mvp);

    // If no participants tracked, skip ELO update
    if (involvedIds.size === 0) return updated;

    const involved = updated.filter(p => involvedIds.has(p.id));
    const avgElo = involved.reduce((sum, p) => sum + p.elo, 0) / involved.length;
    const opponentElo = ELO.BASE + (avgElo - ELO.BASE) * 0.8; // estimated opponent ELO

    const actual = result === 'W' ? 1 : result === 'D' ? 0.5 : 0;

    involved.forEach(player => {
      const exp = ELO.expected(player.elo, opponentElo);
      const newElo = ELO.calculate(player.elo, exp, actual);
      const delta = newElo - player.elo;

      const playerInUpdated = updated.find(p => p.id === player.id);
      if (playerInUpdated) {
        playerInUpdated.elo = newElo;
        playerInUpdated.eloHistory = [...(playerInUpdated.eloHistory || [player.elo]), newElo];
        // Update wins/draws/losses
        playerInUpdated.matches = (playerInUpdated.matches || 0) + 1;
        if (result === 'W') playerInUpdated.wins = (playerInUpdated.wins || 0) + 1;
        else if (result === 'D') playerInUpdated.draws = (playerInUpdated.draws || 0) + 1;
        else playerInUpdated.losses = (playerInUpdated.losses || 0) + 1;
        // Update streak
        const streak = [...(playerInUpdated.streak || [])];
        streak.push(result);
        if (streak.length > 5) streak.shift();
        playerInUpdated.streak = streak;
      }
    });

    // Update goals and assists
    match.goals.forEach(g => {
      const p = updated.find(pl => pl.id === g.player);
      if (p) p.goals = (p.goals || 0) + 1;
    });
    match.assists.forEach(a => {
      const p = updated.find(pl => pl.id === a.player);
      if (p) p.assists = (p.assists || 0) + 1;
    });

    return updated;
  },

  /**
   * Get ELO change for a player compared to their previous ELO
   */
  getEloDelta(player) {
    const history = player.eloHistory || [];
    if (history.length < 2) return 0;
    return player.elo - history[history.length - 2];
  },

  /**
   * Get ELO trend label
   */
  getTrend(player) {
    const delta = ELO.getEloDelta(player);
    if (delta > 10) return { label: `+${delta}`, cls: 'trend-up' };
    if (delta < -10) return { label: `${delta}`, cls: 'trend-down' };
    return { label: `${delta > 0 ? '+' : ''}${delta}`, cls: 'trend-neutral' };
  },

  /**
   * Predict win probability between two players
   */
  winProbability(playerA, playerB) {
    return Math.round(ELO.expected(playerA.elo, playerB.elo) * 100);
  }
};
