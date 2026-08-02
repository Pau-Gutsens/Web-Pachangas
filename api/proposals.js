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

  try {
    const { matchJornada, userId, proposalData } = req.body || {};
    if (!matchJornada || !userId || !proposalData) {
      return res.status(400).json({ error: 'Camps requerits no vàlids' });
    }

    const { data, error } = await supabase.from('lineup_proposals').upsert({
      match_jornada: parseInt(matchJornada),
      user_id: userId,
      team_a_formation: proposalData.teamA ? proposalData.teamA.formation : '4-3-3',
      team_a_positions: proposalData.teamA ? proposalData.teamA.positions : {},
      team_b_formation: proposalData.teamB ? proposalData.teamB.formation : '4-3-3',
      team_b_positions: proposalData.teamB ? proposalData.teamB.positions : {},
      updated_at: new Date().toISOString()
    }, { onConflict: 'match_jornada,user_id' });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[API Proposals Error]:', err);
    return res.status(500).json({ error: err.message || 'Error en desar la proposta' });
  }
};
