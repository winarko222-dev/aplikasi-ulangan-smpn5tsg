/* UI fixes for role navigation and student enrollment. */
(function () {
  const originalStudentsPage = window.studentsPage;

  window.addStudent = async function () {
    const db = window.SMPN5TSGAuth?.state?.client;
    const app = window.SMPN5TSGApp;
    if (!db || !app?.state?.user) return alert('Sesi Supabase tidak aktif. Silakan login ulang.');
    const state = app.state;
    const email = prompt('Email siswa yang sudah dibuat di Supabase Authentication');
    const nis = prompt('NIS siswa');
    const className = prompt(`Kelas: ${state.classes.map(c => c.class_name).join(', ')}`);
    if (!email?.trim() || !nis?.trim() || !className?.trim()) return;

    const klass = state.classes.find(c => c.class_name.toLowerCase() === className.trim().toLowerCase());
    if (!klass) return alert('Kelas tidak ditemukan atau bukan kelas yang Anda kelola.');

    const profile = await db.from('profiles').select('id, role').eq('email', email.trim().toLowerCase()).eq('role', 'student').maybeSingle();
    if (profile.error) return alert(profile.error.message);
    if (!profile.data) return alert('Profil siswa tidak ditemukan. Buat akun siswa di Authentication → Users dan pastikan role-nya student.');

    const result = await db.from('students').upsert({ profile_id: profile.data.id, class_id: klass.id, nis: nis.trim() }, { onConflict: 'profile_id' });
    if (result.error) return alert(result.error.message);
    await app.refreshData();
    app.render();
  };

  window.studentsPage = function () {
    const state = window.SMPN5TSGApp?.state;
    if (!state) return originalStudentsPage ? originalStudentsPage() : '';
    const rows = state.students.map(s => `<tr><td>${esc(s.profiles?.full_name || '-')}</td><td>${esc(s.nis || '-')}</td><td>${esc(state.classes.find(c => c.id === s.class_id)?.class_name || '-')}</td><td>${esc(s.profiles?.email || '-')}</td></tr>`).join('');
    return `<div class="page-head"><h1>Siswa</h1>${state.role === 'admin' || state.role === 'guru' ? '<button class="btn primary small" onclick="addStudent()">+ Tambah Siswa</button>' : ''}</div><section class="card"><h2>Daftar siswa</h2><p class="notice">Siswa harus dibuat terlebih dahulu di Supabase Authentication → Users, lalu role profilnya diatur menjadi student.</p><div class="table-wrap"><table class="table"><tr><th>Nama</th><th>NIS</th><th>Kelas</th><th>Email</th></tr>${rows || '<tr><td colspan="4">Belum ada siswa.</td></tr>'}</table></div></section>`;
  };

  const style = document.createElement('style');
  style.textContent = '.layout{display:flex;min-height:calc(100vh - 64px)}.sidebar{display:flex!important;flex-direction:column;gap:8px;width:230px;padding:20px;background:#fff;border-right:1px solid #dbe5f0}.nav{display:block;width:100%;text-align:left;padding:12px;border:0;border-radius:8px;background:transparent;cursor:pointer}.nav.active,.nav:hover{background:#eaf2ff;color:#143b6b}.wrap{flex:1;padding:24px}.top{display:flex;align-items:center;gap:16px;padding:14px 22px;background:#143b6b;color:#fff}.top span{margin-left:auto}.top .btn{margin-left:0}@media(max-width:700px){.layout{display:block}.sidebar{width:100%;flex-direction:row;overflow:auto}.nav{white-space:nowrap;width:auto}.wrap{padding:14px}}';
  document.head.appendChild(style);
})();
