/* Isi dari Supabase Dashboard > Project Settings > API. Jangan masukkan service_role key. */
window.SMPN5TSG_CONFIG = {
  supabaseUrl: 'https://xvdrygvcfeqnxtmksbbd.supabase.co',
  supabaseAnonKey: 'sb_publishable_pA2r0LADgwa9QmECD_KWGw_WARY8MUa',
  googleAppsScriptUrl: '',
  useSupabase: true
};

window.SMPN5TSG_CONFIG.isSupabaseConfigured = function () {
  return this.useSupabase === true
    && /^https:\/\/[^/]+\.supabase\.co$/.test(this.supabaseUrl)
    && this.supabaseAnonKey.length > 20;
};
