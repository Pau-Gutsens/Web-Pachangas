const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ID fix del grup principal de la colla
const MAIN_GROUP_NAME = 'FC😎';

async function getOrCreateMainGroup() {
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (group) return group;

  const { data: newGroup, error } = await supabase
    .from('groups')
    .insert({ name: MAIN_GROUP_NAME, invite_code: 'COLLA' })
    .select()
    .single();

  if (error) throw new Error('Error al crear el grup principal: ' + error.message);
  return newGroup;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  try {
    const mainGroup = await getOrCreateMainGroup();

    // 1. LOG IN
    if (action === 'login') {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Correu i contrasenya requerits' });
      }

      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authErr) return res.status(401).json({ error: authErr.message });

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, groups(*)')
        .eq('id', authData.user.id)
        .maybeSingle();

      return res.status(200).json({
        user: authData.user,
        session: authData.session,
        profile: profile || null,
        group: mainGroup
      });
    }

    // 2. SIGN UP (Registre directe al grup principal)
    if (action === 'signup') {
      const { displayName, email, password } = req.body || {};
      if (!displayName || !email || !password) {
        return res.status(400).json({ error: 'Tots els camps són obligatoris' });
      }

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password
      });

      if (authErr) return res.status(400).json({ error: authErr.message });

      // Crea el perfil vinculat automàticament al grup principal
      const { data: profile, error: profileErr } = await supabase.from('profiles').insert({
        id: authData.user.id,
        group_id: mainGroup.id,
        display_name: displayName,
        role: 'member',
        elo: 1400,
        emoji: '⚽'
      }).select().single();

      if (profileErr) console.warn('Error al crear perfil:', profileErr);

      return res.status(200).json({
        user: authData.user,
        session: authData.session,
        profile: profile || null,
        group: mainGroup
      });
    }

    return res.status(400).json({ error: 'Acció no vàlida' });
  } catch (err) {
    console.error('[API Auth Error]:', err);
    return res.status(500).json({ error: err.message || 'Error del servidor' });
  }
};
