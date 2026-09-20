/* Siswa dibuat oleh Admin melalui Edge Function yang aman. */
(function () {
  const app = window.SMPN5TSGApp;
  if (!app) return;

  window.addStudent = async function () {
    const state = app.state;
    const db = window.SMPN5TSGAuth?.state?.client;
    if (state.role !== 'admin') return alert('Hanya Admin yang dapat menambahkan akun siswa.');
    if (!db) return alert('Sesi Supabase tidak aktif. Silakan login ulang.');
    if (!state.classes.length) return alert('Buat kelas terlebih dahulu.');

    const fullName = prompt('Nama lengkap siswa');
    const email = prompt('Email/login siswa');
    const password = prompt('Password awal siswa (minimal 6 karakter)');
    const nis = prompt('NIS siswa');
    const className = prompt(`Kelas: ${state.classes.map(c => c.class_name).join(', ')}`);
    if (!fullName?.trim() || !email?.trim() || !password || !nis?.trim() || !className?.trim()) return;
    const klass = state.classes.find(c => c.class_name.toLowerCase() === className.trim().toLowerCase());
    if (!klass) return alert('Kelas tidak ditemukan.');

    try {
      const { data: sessionData } = await db.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return alert('Sesi login habis. Silakan login ulang.');
      const { data, error } = await db.functions.invoke('admin-create-student', {
        body: { full_name: fullName.trim(), email: email.trim().toLowerCase(), password, nis: nis.trim(), class_id: klass.id }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      alert('Akun siswa berhasil dibuat. Simpan email dan password untuk siswa.');
      await app.refreshData();
      app.render();
    } catch (error) {
      alert(error.message || 'Gagal membuat akun siswa. Pastikan Edge Function sudah di-deploy.');
    }
  };

  window.studentsPage = function () {
    const rows = state.students.map(s => `<tr><td>${esc(s.profiles?.full_name || '-')}</td><td>${esc(s.nis || '-')}</td><td>${esc(state.classes.find(c => c.id === s.class_id)?.class_name || '-')}</td><td>${esc(s.profiles?.email || '-')}</td></tr>`).join('');
    return `<div class="page-head"><h1>Siswa</h1>${state.role === 'admin' ? '<button class="btn primary small" onclick="addStudent()">+ Tambah Akun Siswa</button>' : ''}</div><section class="card"><h2>Daftar siswa</h2><p class="notice">Admin dapat membuat akun siswa langsung dari aplikasi. Password awal harus dibagikan secara aman kepada siswa.</p><div class="table-wrap"><table class="table"><tr><th>Nama</th><th>NIS</th><th>Kelas</th><th>Email</th></tr>${rows || '<tr><td colspan="4">Belum ada siswa.</td></tr>'}</table></div></section>`;
  };

  const style = document.createElement('style');
  style.textContent = '.layout{display:flex;min-height:calc(100vh - 64px)}.sidebar{display:flex!important;flex-direction:column;gap:8px;width:230px;padding:20px;background:#fff;border-right:1px solid #dbe5f0}.nav{display:block;width:100%;text-align:left;padding:12px;border:0;border-radius:8px;background:transparent;cursor:pointer}.nav.active,.nav:hover{background:#eaf2ff;color:#143b6b}.wrap{flex:1;padding:24px}.top{display:flex;align-items:center;gap:16px;padding:14px 22px;background:#143b6b;color:#fff}.top span{margin-left:auto}.top .btn{margin-left:0}@media(max-width:700px){.layout{display:block}.sidebar{width:100%;flex-direction:row;overflow:auto}.nav{white-space:nowrap;width:auto}.wrap{padding:14px}}';
  document.head.appendChild(style);
})();
