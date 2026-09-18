/* Fill these values from Supabase Project Settings > API. Never put the service_role key here. */
window.SMPN5TSG_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  googleAppsScriptUrl: ''
};

window.SMPN5TSG_CONFIG.isSupabaseConfigured = function () {
  return Boolean(this.supabaseUrl && this.supabaseAnonKey);
};
