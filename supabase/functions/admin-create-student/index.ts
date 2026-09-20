import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return response({ error: 'Method tidak diizinkan.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response({ error: 'Belum login.' }, 401);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const token = authorization.replace('Bearer ', '');
  const { data: { user: caller }, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller) return response({ error: 'Sesi tidak valid.' }, 401);

  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', caller.id).single();
  if (callerProfile?.role !== 'admin') return response({ error: 'Hanya Admin yang dapat membuat akun siswa.' }, 403);

  let payload: { full_name?: string; email?: string; password?: string; nis?: string; class_id?: string };
  try { payload = await request.json(); } catch { return response({ error: 'Data JSON tidak valid.' }, 400); }

  const fullName = payload.full_name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password;
  const nis = payload.nis?.trim();
  const classId = payload.class_id;
  if (!fullName || !email || !password || !nis || !classId) return response({ error: 'Nama, email, password, NIS, dan kelas wajib diisi.' }, 400);
  if (password.length < 6) return response({ error: 'Password minimal 6 karakter.' }, 400);

  const { data: authResult, error: createError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName, role: 'student', nis }
  });
  if (createError || !authResult.user) return response({ error: createError?.message || 'Gagal membuat akun siswa.' }, 400);

  const studentId = authResult.user.id;
  const { error: profileError } = await admin.from('profiles').upsert({ id: studentId, full_name: fullName, email, role: 'student', nis });
  const { error: studentError } = await admin.from('students').insert({ profile_id: studentId, class_id: classId, nis });
  if (profileError || studentError) {
    await admin.auth.admin.deleteUser(studentId);
    return response({ error: profileError?.message || studentError?.message || 'Gagal menyimpan data siswa.' }, 400);
  }

  return response({ ok: true, id: studentId });
});
