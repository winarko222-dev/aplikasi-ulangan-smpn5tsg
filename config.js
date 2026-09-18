/* Isi dari Supabase Dashboard > Project Settings > API. Jangan masukkan service_role key. */
window.SMPN5TSG_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  googleAppsScriptUrl: '',
  useSupabase: false
};

window.SMPN5TSG_CONFIG.isSupabaseConfigured = function () {
  return this.useSupabase === true
    && /^https:\/\/[^/]+\.supabase\.co$/.test(this.supabaseUrl)
    && this.supabaseAnonKey.length > 20;
};
