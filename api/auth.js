const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'COLLA-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
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

      if (authErr) {
        return res.status(401).json({ error: authErr.message });
      }

      // Fetch user profile and group
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, groups(*)')
        .eq('id', authData.user.id)
        .maybeSingle();

      return res.status(200).json({
        user: authData.user,
        session: authData.session,
        profile: profile || null,
        group: profile ? profile.groups : null
      });
    }

    // 2. CREATE GROUP
    if (action === 'create-group') {
      const { displayName, email, password, groupName } = req.body || {};
      if (!groupName || !displayName || !email || !password) {
        return res.status(400).json({ error: 'Tots els camps són obligatoris' });
      }

      const inviteCode = generateInviteCode();

      // Create group
      const { data: group, error: groupErr } = await supabase
        .from('groups')
        .insert({ name: groupName, invite_code: inviteCode })
        .select()
        .single();

      if (groupErr) {
        return res.status(500).json({ error: 'Error al crear la colla: ' + groupErr.message });
      }

      // Sign up user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password
      });

      if (authErr) {
        return res.status(400).json({ error: authErr.message });
      }

      // Create admin profile
      await supabase.from('profiles').insert({
        id: authData.user.id,
        group_id: group.id,
        display_name: displayName,
        role: 'admin',
        elo: 1400,
        emoji: '⚽'
      });

      return res.status(200).json({
        user: authData.user,
        session: authData.session,
        group,
        inviteCode
      });
    }

    // 3. JOIN GROUP
    if (action === 'join-group') {
      const { displayName, email, password, inviteCode } = req.body || {};
      if (!inviteCode || !displayName || !email || !password) {
        return res.status(400).json({ error: 'Tots els camps són obligatoris' });
      }

      const codeClean = inviteCode.trim().toUpperCase();

      // Verify code
      const { data: group, error: groupErr } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', codeClean)
        .maybeSingle();

      if (groupErr || !group) {
        return res.status(404).json({ error: 'El codi d\'invitació és incorrecte o no existeix' });
      }

      // Sign up user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password
      });

      if (authErr) {
        return res.status(400).json({ error: authErr.message });
      }

      // Create member profile
      await supabase.from('profiles').insert({
        id: authData.user.id,
        group_id: group.id,
        display_name: displayName,
        role: 'member',
        elo: 1400,
        emoji: '⚽'
      });

      return res.status(200).json({
        user: authData.user,
        session: authData.session,
        group
      });
    }

    return res.status(400).json({ error: 'Acció no vàlida' });
  } catch (err) {
    console.error('[API Auth Error]:', err);
    return res.status(500).json({ error: err.message || 'Error del servidor' });
  }
};
