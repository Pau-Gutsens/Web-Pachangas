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

  const { action } = req.query;

  try {
    // 1. REGISTER PLAYED MATCH
    if (action === 'register') {
      const { matchObj } = req.body || {};
      if (!matchObj) {
        return res.status(400).json({ error: 'matchObj és requerit' });
      }

      const { data, error } = await supabase.from('matches').insert({
        date: matchObj.date,
        rival: matchObj.rival,
        score: Array.isArray(matchObj.score) ? matchObj.score.join('-') : matchObj.score,
        goals_for: Array.isArray(matchObj.score) ? matchObj.score[0] : (matchObj.goalsFor || 0),
        goals_against: Array.isArray(matchObj.score) ? matchObj.score[1] : (matchObj.goalsAgainst || 0),
        mvp_id: matchObj.mvp || null,
        duration: matchObj.duration || null,
        notes: matchObj.notes || '',
        details: { goals: matchObj.goals || [], assists: matchObj.assists || [] }
      }).select().single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, match: data });
    }

    // 2. SCHEDULE UPCOMING MATCH
    if (action === 'schedule') {
      const { scheduledObj } = req.body || {};
      if (!scheduledObj) {
        return res.status(400).json({ error: 'scheduledObj és requerit' });
      }

      const { data, error } = await supabase.from('scheduled_matches').insert({
        jornada: scheduledObj.jornada || 99,
        date: scheduledObj.date,
        time: scheduledObj.time || null,
        rival: scheduledObj.rival || '',
        location: scheduledObj.location || '',
        notes: scheduledObj.notes || ''
      }).select().single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, scheduled: data });
    }

    return res.status(400).json({ error: 'Acció no vàlida' });
  } catch (err) {
    console.error('[API Matches Error]:', err);
    return res.status(500).json({ error: err.message || 'Error del servidor' });
  }
};
