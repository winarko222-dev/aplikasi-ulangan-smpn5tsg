(function () {
  const AUTH = { client: null, session: null, profile: null };

  function initSupabase({ url, anonKey }) {
    if (!url || !anonKey || !window.supabase?.createClient) return null;
    AUTH.client = window.supabase.createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return AUTH.client;
  }

  async function login({ email, password, role }) {
    if (!AUTH.client) throw new Error('Supabase belum dikonfigurasi. Isi config.js terlebih dahulu.');
    const { data, error } = await AUTH.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const { data: profile, error: profileError } = await AUTH.client.from('profiles').select('*').eq('id', data.user.id).single();
    if (profileError) throw new Error(profileError.message);
    if (role && profile.role !== role) { await AUTH.client.auth.signOut(); throw new Error('Role tidak sesuai.'); }
    AUTH.session = data.session; AUTH.profile = profile;
    return { session: data.session, profile };
  }

  async function logout() {
    if (AUTH.client) await AUTH.client.auth.signOut();
    AUTH.session = null; AUTH.profile = null;
  }

  async function requireRole(requiredRole) {
    if (!AUTH.client) throw new Error('Supabase belum dikonfigurasi.');
    const { data: sessionData } = await AUTH.client.auth.getSession();
    if (!sessionData.session) throw new Error('Silakan login terlebih dahulu.');
    const { data: profile, error } = await AUTH.client.from('profiles').select('*').eq('id', sessionData.session.user.id).single();
    if (error || !profile) throw new Error('Profil tidak ditemukan.');
    if (requiredRole && profile.role !== requiredRole) throw new Error('Akses ditolak.');
    AUTH.session = sessionData.session; AUTH.profile = profile; return profile;
  }

  const config = window.SMPN5TSG_CONFIG || {};
  if (config.isSupabaseConfigured && config.isSupabaseConfigured()) initSupabase({ url: config.supabaseUrl, anonKey: config.supabaseAnonKey });
  window.SMPN5TSGAuth = { initSupabase, login, logout, requireRole, get state() { return AUTH; }, get configured() { return Boolean(AUTH.client); } };
})();
