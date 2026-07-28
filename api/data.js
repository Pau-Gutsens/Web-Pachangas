const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { groupId } = req.query;

  if (!groupId) {
    return res.status(400).json({ error: 'groupId és requerit' });
  }

  try {
    // 1. Fetch Profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('group_id', groupId);

    // 2. Fetch Played Matches
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: false });

    // 3. Fetch Scheduled Matches
    const { data: scheduled } = await supabase
      .from('scheduled_matches')
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: true });

    // 4. Fetch Lineup Proposals
    const { data: proposals } = await supabase
      .from('lineup_proposals')
      .select('*')
      .eq('group_id', groupId);

    // Format profiles
    const formattedPlayers = (profiles || []).map(p => ({
      id: p.id,
      name: p.display_name,
      emoji: p.emoji || '⚽',
      photo: p.photo_url || null,
      elo: p.elo || 1400,
      goals: p.goals || 0,
      assists: p.assists || 0,
      matches: p.matches || 0,
      wins: p.wins || 0,
      draws: p.draws || 0,
      losses: p.losses || 0,
      streak: p.streak || [],
      eloHistory: p.elo_history || [1400],
      role: p.role || 'member'
    }));

    // Format custom calendar
    const formattedCalendar = (scheduled || []).map(s => ({
      id: s.id,
      jornada: s.jornada || 99,
      date: s.date,
      time: s.time || '',
      rival: s.rival || '',
      location: s.location || '',
      notes: s.notes || ''
    }));

    // Format proposals
    const formattedProposals = {};
    (proposals || []).forEach(pr => {
      const jKey = pr.match_jornada;
      if (!formattedProposals[jKey]) formattedProposals[jKey] = {};
      formattedProposals[jKey][pr.user_id] = {
        userId: pr.user_id,
        teamA: { formation: pr.team_a_formation, positions: pr.team_a_positions },
        teamB: { formation: pr.team_b_formation, positions: pr.team_b_positions },
        updatedAt: pr.updated_at
      };
    });

    return res.status(200).json({
      players: formattedPlayers,
      matches: matches || [],
      customCalendar: formattedCalendar,
      lineupProposals: formattedProposals
    });
  } catch (err) {
    console.error('[API Data Error]:', err);
    return res.status(500).json({ error: err.message || 'Error en obtenir dades' });
  }
};
