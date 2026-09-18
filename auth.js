(function () {
  const AUTH = { client: null, session: null, profile: null };

  function initSupabase({ url, anonKey }) {
    if (!url || !anonKey || !window.supabase?.createClient) {
      return null;
    }
    AUTH.client = window.supabase.createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return AUTH.client;
  }

  async function loadProfile(userId) {
    const { data, error } = await AUTH.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw new Error(error.message);
    AUTH.profile = data;
    return data;
  }

  async function login({ email, password, role }) {
    if (!AUTH.client) throw new Error('Supabase belum dikonfigurasi. Isi config.js lalu aktifkan useSupabase.');
    const { data, error } = await AUTH.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const profile = await loadProfile(data.user.id);
    if (role && profile.role !== role) {
      await AUTH.client.auth.signOut();
      throw new Error('Role tidak sesuai.');
    }
    AUTH.session = data.session;
    return { session: AUTH.session, profile };
  }

  async function restoreSession() {
    if (!AUTH.client) return null;
    const { data, error } = await AUTH.client.auth.getSession();
    if (error) throw new Error(error.message);
    AUTH.session = data.session;
    if (data.session) await loadProfile(data.session.user.id);
    return AUTH.profile;
  }

  async function logout() {
    if (AUTH.client) {
      const { error } = await AUTH.client.auth.signOut();
      if (error) throw new Error(error.message);
    }
    AUTH.session = null;
    AUTH.profile = null;
  }

  async function requireRole(requiredRole) {
    const profile = await restoreSession();
    if (!profile) throw new Error('Silakan login terlebih dahulu.');
    if (requiredRole && profile.role !== requiredRole) throw new Error('Akses ditolak.');
    return profile;
  }

  const config = window.SMPN5TSG_CONFIG || {};
  if (config.isSupabaseConfigured?.()) {
    initSupabase({ url: config.supabaseUrl, anonKey: config.supabaseAnonKey });
  }

  window.SMPN5TSGAuth = {
    initSupabase,
    login,
    restoreSession,
    logout,
    requireRole,
    get state() { return AUTH; },
    get configured() { return Boolean(AUTH.client); }
  };
})();
