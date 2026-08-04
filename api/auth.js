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

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // ---- 1. LOG IN ----
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
      const msg = authErr.message.includes('Invalid login credentials')
        ? 'El correu no està registrat o la contrasenya és incorrecta'
        : authErr.message;
      return res.status(401).json({ error: msg });
    }

    // Recupera el perfil creat pel trigger
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    return res.status(200).json({
      user: authData.user,
      session: authData.session,
      profile: profile || null
    });
  }

  // ---- 2. SIGN UP ----
  if (action === 'signup') {
    const { displayName, email, password } = req.body || {};
    if (!displayName || !email || !password) {
      return res.status(400).json({ error: 'Tots els camps són obligatoris' });
    }

    // Passem el nom com a metadata → el trigger de Supabase el llegirà automàticament
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    });

    if (authErr) {
      let msg = authErr.message;
      if (msg.includes('User already registered') || msg.includes('already exists')) {
        msg = 'Aquest correu ja està registrat. Utilitza la pestanya Iniciar Sessió.';
      } else if (msg.includes('Password should be at least')) {
        msg = 'La contrasenya ha de tenir com a mínim 6 caràcters';
      }
      return res.status(400).json({ error: msg });
    }

    // El trigger ha creat el perfil automàticament, el llegim
    const { data: profile, error: profileReadErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    return res.status(200).json({
      user: authData.user,
      session: authData.session,
      profile: profile || null,
      // Debug: eliminar quan funcioni
      _debug: profileReadErr ? profileReadErr.message : 'ok'
    });
  }

  return res.status(400).json({ error: 'Acció no vàlida' });
};
