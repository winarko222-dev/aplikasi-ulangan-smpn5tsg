(function () {
  function getState() {
    return window.SMPN5TSGApp?.state;
  }

  function addStudent() {
    const state = getState();
    const db = window.SMPN5TSGAuth?.state?.client;

    if (!state || !db) {
      alert('Sesi Supabase tidak aktif. Silakan login ulang.');
      return;
    }

    if (state.role !== 'admin') {
      alert('Hanya Admin yang dapat menambahkan akun siswa.');
      return;
    }

    if (!state.classes.length) {
      alert('Buat kelas terlebih dahulu.');
      return;
    }

    const fullName = prompt('Nama lengkap siswa');
    const email = prompt('Email login siswa');
    const password = prompt('Password awal siswa (minimal 6 karakter)');
    const nis = prompt('NIS siswa');
    const className = prompt(`Kelas: ${state.classes.map(c => c.class_name).join(', ')}`);

    if (!fullName?.trim() || !email?.trim() || !password || !nis?.trim() || !className?.trim()) return;

    const klass = state.classes.find(c => c.class_name.toLowerCase() === className.trim().toLowerCase());
    if (!klass) {
      alert('Kelas tidak ditemukan.');
      return;
    }

    const payload = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      nis: nis.trim(),
      class_id: klass.id
    };

    db.functions.invoke('admin-create-student', { body: payload })
      .then(({ data, error }) => {
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        alert('Akun siswa berhasil dibuat. Password telah dikirim secara aman ke siswa.');
        return window.SMPN5TSGApp.refreshData();
      })
      .then(() => window.SMPN5TSGApp.render())
      .catch((error) => {
        alert(error?.message || 'Edge Function admin-create-student belum terdeploy.');
      });
  }

  window.addStudent = addStudent;

  const style = document.createElement('style');
  style.textContent = '.layout{display:flex;min-height:calc(100vh - 64px)}.sidebar{display:flex!important;flex-direction:column;gap:8px;width:230px;padding:20px;background:#fff;border-right:1px solid #dbe5f0}.nav{display:block;width:100%;text-align:left;padding:12px;border:0;border-radius:8px;background:transparent;cursor:pointer}.nav.active,.nav:hover{background:#eaf2ff;color:#143b6b}.wrap{flex:1;padding:24px}.top{display:flex;align-items:center;gap:16px;padding:14px 22px;background:#143b6b;color:#fff}.top span{margin-left:auto}.top .btn{margin-left:0}@media(max-width:700px){.layout{display:block}.sidebar{width:100%;flex-direction:row;overflow:auto}.nav{white-space:nowrap;width:auto}.wrap{padding:14px}}';
  document.head.appendChild(style);
})();
