(function () {
  const AUTH = {
    client: null,
    session: null,
    profile: null,
  };

  function ensureSupabaseLoaded() {
    if (!window.supabase) {
      throw new Error('Supabase client belum aktif. Tambahkan script Supabase dan atur URL serta anon key.');
    }
  }

  function initSupabase({ url, anonKey }) {
    if (!url || !anonKey) {
      throw new Error('SUPABASE_URL dan SUPABASE_ANON_KEY wajib diisi.');
    }

    const { createClient } = window.supabase;
    if (!createClient) {
      throw new Error('TypeScript/JS client Supabase belum tersedia di window.supabase.');
    }

    AUTH.client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    return AUTH.client;
  }

  async function login({ email, password, role }) {
    ensureSupabaseLoaded();

    const { data: authData, error: authError } = await AUTH.client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const { data: profile, error: profileError } = await AUTH.client
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (role && profile.role !== role) {
      await AUTH.client.auth.signOut();
      throw new Error('Role tidak sesuai. Anda tidak memiliki akses ke halaman ini.');
    }

    AUTH.session = authData.session;
    AUTH.profile = profile;
    return { session: AUTH.session, profile: AUTH.profile };
  }

  async function logout() {
    if (!AUTH.client) return;
    const { error } = await AUTH.client.auth.signOut();
    if (error) throw new Error(error.message);
    AUTH.session = null;
    AUTH.profile = null;
    return true;
  }

  async function getCurrentSession() {
    ensureSupabaseLoaded();
    const { data, error } = await AUTH.client.auth.getSession();
    if (error) throw new Error(error.message);
    AUTH.session = data.session;
    return data.session;
  }

  async function requireRole(requiredRole) {
    ensureSupabaseLoaded();
    const session = await getCurrentSession();
    if (!session) {
      throw new Error('Silakan login terlebih dahulu.');
    }

    const { data: profile, error } = await AUTH.client
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) {
      throw new Error('Profil tidak ditemukan.');
    }

    AUTH.profile = profile;

    if (requiredRole && profile.role !== requiredRole) {
      throw new Error(`Akses ditolak. Role yang dibutuhkan: ${requiredRole}`);
    }

    return profile;
  }

  async function createUser({ fullName, email, password, role, nis }) {
    ensureSupabaseLoaded();

    const { data, error } = await AUTH.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          nis,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  window.SMPN5TSGAuth = {
    initSupabase,
    login,
    logout,
    getCurrentSession,
    requireRole,
    createUser,
    get state() {
      return AUTH;
    },
  };
})();
