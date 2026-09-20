const state = {
  role: '',
  user: null,
  view: 'login',
  classes: [],
  subjects: [],
  students: [],
  links: [],
  users: [],
  results: []
};

const client = () => window.SMPN5TSGAuth?.state?.client || null;
const roleLabel = { admin: 'Admin', guru: 'Guru', student: 'Siswa' };

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function saveView() {
  localStorage.setItem('smpn5tsg-view', JSON.stringify({ view: state.view }));
}

function notify(error) {
  const msg = error?.message || String(error || '');
  alert(msg || 'Terjadi kesalahan.');
}

function card(title, body) {
  return `<section class="card"><h2>${esc(title)}</h2>${body}</section>`;
}

function menuForRole() {
  const base = [['dashboard', '🏠', 'Dashboard']];

  if (state.role === 'admin') {
    return base.concat([
      ['classes', '🏫', 'Kelas'],
      ['subjects', '📚', 'Mapel'],
      ['students', '👥', 'Siswa'],
      ['users', '🔐', 'Akun Guru'],
      ['links', '🔗', 'Link Ulangan']
    ]);
  }

  if (state.role === 'guru') {
    return base.concat([
      ['classes', '🏫', 'Kelas'],
      ['subjects', '📚', 'Mapel'],
      ['students', '👥', 'Siswa'],
      ['links', '🔗', 'Link Ulangan']
    ]);
  }

  return base.concat([
    ['exams', '📝', 'Ulangan'],
    ['scores', '📊', 'Nilai'],
    ['profile', '👤', 'Profil']
  ]);
}

async function refreshData() {
  const db = client();
  if (!db || !state.user) return;

  try {
    if (state.role === 'admin') {
      const [classesRes, subjectsRes, studentsRes, linksRes, usersRes] = await Promise.all([
        db.from('classes').select('*').order('class_name'),
        db.from('subjects').select('*').order('name'),
        db.from('students').select('id, nis, class_id, profile_id, profiles(full_name, email)').order('nis'),
        db.from('exam_links').select('*').order('created_at', { ascending: false }),
        db.from('profiles').select('*').order('full_name')
      ]);

      if (classesRes.error) throw classesRes.error;
      if (subjectsRes.error) throw subjectsRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (linksRes.error) throw linksRes.error;
      if (usersRes.error) throw usersRes.error;

      state.classes = classesRes.data || [];
      state.subjects = subjectsRes.data || [];
      state.students = studentsRes.data || [];
      state.links = linksRes.data || [];
      state.users = usersRes.data || [];
      return;
    }

    if (state.role === 'guru') {
      const [classesRes, subjectsRes, studentsRes, linksRes] = await Promise.all([
        db.from('classes').select('*').order('class_name'),
        db.from('subjects').select('*').order('name'),
        db.from('students').select('id, nis, class_id, profile_id, profiles(full_name, email)').order('nis'),
        db.from('exam_links').select('*').order('created_at', { ascending: false })
      ]);

      if (classesRes.error) throw classesRes.error;
      if (subjectsRes.error) throw subjectsRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (linksRes.error) throw linksRes.error;

      state.classes = classesRes.data || [];
      state.subjects = subjectsRes.data || [];
      state.students = studentsRes.data || [];
      state.links = linksRes.data || [];
      return;
    }

    const [linksRes, resultsRes] = await Promise.all([
      db.from('exam_links').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      db.from('exam_results').select('id, score, status, exam_link_id, student_id, exam_links(title)').eq('student_id', state.user.id)
    ]);

    if (linksRes.error) throw linksRes.error;
    if (resultsRes.error) throw resultsRes.error;

    state.links = linksRes.data || [];
    state.results = resultsRes.data || [];
  } catch (error) {
    console.warn('refreshData error:', error);
    notify(error);
  }
}

async function login() {
  const email = document.getElementById('email')?.value.trim().toLowerCase();
  const password = document.getElementById('password')?.value;
  const role = document.getElementById('role')?.value;

  if (!email || !password) {
    alert('Email dan password wajib diisi.');
    return;
  }

  try {
    const result = await window.SMPN5TSGAuth.login({ email, password, role });
    state.user = {
      id: result.profile.id,
      name: result.profile.full_name || result.profile.email,
      email: result.profile.email
    };
    state.role = result.profile.role;
    state.view = 'dashboard';
    saveView();
    await refreshData();
    render();
  } catch (error) {
    notify(error);
  }
}

async function restoreSession() {
  try {
    if (!window.SMPN5TSGAuth) return render();
    const profile = await window.SMPN5TSGAuth.restoreSession();
    if (!profile) return render();

    state.user = {
      id: profile.id,
      name: profile.full_name || profile.email,
      email: profile.email
    };
    state.role = profile.role;
    state.view = 'dashboard';
    await refreshData();
    render();
  } catch (error) {
    console.warn('Session restore gagal:', error);
    render();
  }
}

async function logout() {
  try {
    await window.SMPN5TSGAuth.logout();
  } catch (error) {
    console.warn('Logout error:', error);
  }

  state.user = null;
  state.role = '';
  state.view = 'login';
  localStorage.removeItem('smpn5tsg-view');
  render();
}

function go(view) {
  state.view = view;
  saveView();
  render();
}

function renderLogin() {
  return `<main class="login"><section class="card login-card"><div class="logo">S</div><h1>SMPN5TSG</h1><p class="muted">Sistem Ulangan Online</p>
    <label class="field"><span>Email</span><input id="email" type="email" placeholder="email Anda" /></label>
    <label class="field"><span>Password</span><input id="password" type="password" placeholder="password Anda" /></label>
    <label class="field"><span>Masuk sebagai</span><select id="role"><option value="admin">Admin</option><option value="guru">Guru</option><option value="student">Siswa</option></select></label>
    <button class="btn primary" onclick="login()">Masuk</button>
  </section></main>`;
}

function shell(content) {
  const items = menuForRole();
  return `<header class="top"><h2>🎓 SMPN5TSG</h2><span>${esc(state.user?.name || '')} · ${esc(roleLabel[state.role] || state.role)}</span><button class="btn secondary" onclick="logout()">Keluar</button></header>
  <div class="layout"><aside class="sidebar">${items.map(([key, icon, label]) => `<button class="nav ${state.view === key ? 'active' : ''}" onclick="go('${key}')">${icon} ${label}</button>`).join('')}</aside><main class="wrap">${content}</main></div>`;
}

function dashboard() {
  const data = state.role === 'student'
    ? [['Ulangan', state.links.length], ['Nilai', state.results.length]]
    : [['Kelas', state.classes.length], ['Mapel', state.subjects.length], ['Siswa', state.students.length], ['Link Ulangan', state.links.length]];

  return `
    <div class="welcome">
      <p class="muted">Sistem Ulangan Online</p>
      <h1>Selamat datang, ${esc(state.user.name)}</h1>
      <p class="muted">Akses: ${esc(roleLabel[state.role] || state.role)}</p>
    </div>
    <div class="grid">
      ${data.map(([label, value]) => `<div class="tile"><h3>${esc(label)}</h3><strong>${value}</strong></div>`).join('')}
    </div>
  `;
}

async function addClass() {
  const name = prompt('Nama kelas, contoh: VII-A');
  if (!name?.trim()) return;

  const cleanName = name.trim();
  const exists = state.classes.some(item => item.class_name.toLowerCase() === cleanName.toLowerCase());
  if (exists) {
    alert('Kelas dengan nama yang sama sudah ada. Gunakan nama lain.');
    return;
  }

  const payload = {
    class_name: cleanName,
    homeroom_teacher_id: state.role === 'guru' ? state.user.id : null
  };

  try {
    const { error } = await client().from('classes').insert(payload);
    if (error) throw error;
    await refreshData();
    render();
  } catch (error) {
    notify(error);
  }
}

async function deleteClass(id) {
  if (!confirm('Hapus kelas ini?')) return;

  try {
    const { error } = await client().from('classes').delete().eq('id', id);
    if (error) throw error;
    await refreshData();
    render();
  } catch (error) {
    notify(error);
  }
}

function classesPage() {
  const canEdit = state.role === 'admin' || state.role === 'guru';
  const rows = state.classes.map(c => `<tr><td>${esc(c.class_name)}</td><td>${esc(c.homeroom_teacher_id || '-')}</td><td>${canEdit ? `<button class="btn danger small" onclick="deleteClass('${c.id}')">Hapus</button>` : ''}</td></tr>`).join('');

  return `
    <div class="page-head"><h1>Kelas</h1>${canEdit ? '<button class="btn primary small" onclick="addClass()">+ Tambah Kelas</button>' : ''}</div>
    ${card('Daftar kelas', `<table class="table"><tr><th>Nama kelas</th><th>Wali kelas</th><th>Aksi</th></tr>${rows || '<tr><td colspan="3">Belum ada kelas.</td></tr>'}</table>`)}
  `;
}

async function addSubject() {
  const name = prompt('Nama mata pelajaran');
  if (!name?.trim()) return;

  const cleanName = name.trim();
  const exists = state.subjects.some(item => item.name.toLowerCase() === cleanName.toLowerCase());
  if (exists) {
    alert('Mata pelajaran dengan nama yang sama sudah ada.');
    return;
  }

  try {
    const { error } = await client().from('subjects').insert({ name: cleanName });
    if (error) throw error;
    await refreshData();
    render();
  } catch (error) {
    notify(error);
  }
}

async function deleteSubject(id) {
  if (!confirm('Hapus mapel ini?')) return;

  try {
    const { error } = await client().from('subjects').delete().eq('id', id);
    if (error) throw error;
    await refreshData();
    render();
  } catch (error) {
    notify(error);
  }
}

function subjectsPage() {
  const canEdit = state.role === 'admin' || state.role === 'guru';
  const rows = state.subjects.map(s => `<tr><td>${esc(s.name)}</td><td>${canEdit ? `<button class="btn danger small" onclick="deleteSubject('${s.id}')">Hapus</button>` : ''}</td></tr>`).join('');

  return `
    <div class="page-head"><h1>Mata Pelajaran</h1>${canEdit ? '<button class="btn primary small" onclick="addSubject()">+ Tambah Mapel</button>' : ''}</div>
    ${card('Daftar mapel', `<table class="table"><tr><th>Nama</th><th>Aksi</th></tr>${rows || '<tr><td colspan="2">Belum ada mapel.</td></tr>'}</table>`)}
  `;
}

function studentsPage() {
  const rows = state.students.map(s => `<tr><td>${esc(s.profiles?.full_name || '-')}</td><td>${esc(s.nis || '-')}</td><td>${esc(state.classes.find(c => c.id === s.class_id)?.class_name || '-')}</td><td>${esc(s.profiles?.email || '-')}</td></tr>`).join('');

  return `
    <div class="page-head"><h1>Siswa</h1>${state.role === 'admin' ? '<button class="btn primary small" onclick="addStudent()">+ Tambah Akun Siswa</button>' : ''}</div>
    ${card('Daftar siswa', `<p class="notice">Admin dapat menambah siswa dari aplikasi. Siswa harus dibuat melalui akun Supabase Auth via Edge Function yang aman.</p><table class="table"><tr><th>Nama</th><th>NIS</th><th>Kelas</th><th>Email</th></tr>${rows || '<tr><td colspan="4">Belum ada siswa.</td></tr>'}</table>`)}
  `;
}

function usersPage() {
  const rows = state.users.filter(u => u.role === 'guru').map(u => `<tr><td>${esc(u.full_name)}</td><td>${esc(u.email)}</td><td>${esc(roleLabel[u.role] || u.role)}</td></tr>`).join('');
  return `
    <div class="page-head"><h1>Akun Guru</h1></div>
    ${card('Daftar guru', `<table class="table"><tr><th>Nama</th><th>Email</th><th>Role</th></tr>${rows || '<tr><td colspan="3">Belum ada guru.</td></tr>'}</table>`)}
  `;
}

async function addLink() {
  if (!state.classes.length || !state.subjects.length) {
    alert('Buat kelas dan mata pelajaran terlebih dahulu.');
    return;
  }

  const title = prompt('Judul ulangan');
  const url = prompt('URL Google Form');
  const className = prompt(`Kelas: ${state.classes.map(c => c.class_name).join(', ')}`);
  const subjectName = prompt(`Mapel: ${state.subjects.map(s => s.name).join(', ')}`);

  if (!title?.trim() || !url?.trim() || !className?.trim() || !subjectName?.trim()) return;

  const klass = state.classes.find(c => c.class_name.toLowerCase() === className.trim().toLowerCase());
  const subject = state.subjects.find(s => s.name.toLowerCase() === subjectName.trim().toLowerCase());

  if (!klass || !subject) {
    alert('Kelas atau mapel tidak ditemukan.');
    return;
  }

  try {
    const { error } = await client().from('exam_links').insert({
      title: title.trim(),
      url: url.trim(),
      class_id: klass.id,
      subject_id: subject.id,
      status: 'draft',
      created_by: state.user.id
    });

    if (error) throw error;
    await refreshData();
    render();
  } catch (error) {
    notify(error);
  }
}

function linksPage() {
  const rows = state.links.map(l => `<tr><td>${esc(l.title)}</td><td>${esc(state.classes.find(c => c.id === l.class_id)?.class_name || '-')}</td><td>${esc(l.status)}</td><td><a href="${esc(l.url)}" target="_blank" rel="noopener">Buka</a></td></tr>`).join('');
  return `
    <div class="page-head"><h1>Link Ulangan</h1>${state.role !== 'student' ? '<button class="btn primary small" onclick="addLink()">+ Tambah Link</button>' : ''}</div>
    ${card('Daftar link', `<table class="table"><tr><th>Judul</th><th>Kelas</th><th>Status</th><th>Link</th></tr>${rows || '<tr><td colspan="4">Belum ada link.</td></tr>'}</table>`)}
  `;
}

function examsPage() {
  return linksPage();
}

function scoresPage() {
  const rows = state.results.map(r => `<tr><td>${esc(r.exam_links?.title || '-')}</td><td>${esc(r.status)}</td><td>${esc(r.score ?? '-')}</td></tr>`).join('');
  return `
    <div class="page-head"><h1>Nilai Saya</h1></div>
    ${card('Nilai', `<table class="table"><tr><th>Ulangan</th><th>Status</th><th>Nilai</th></tr>${rows || '<tr><td colspan="3">Belum ada nilai.</td></tr>'}</table>`)}
  `;
}

function profilePage() {
  return card('Profil Saya', `<p>Nama: <b>${esc(state.user.name)}</b></p><p>Email: <b>${esc(state.user.email)}</b></p><p>Role: <b>${esc(roleLabel[state.role] || state.role)}</b></p>`);
}

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.user || !state.role) {
    app.innerHTML = renderLogin();
    return;
  }

  const pages = {
    dashboard,
    classes: classesPage,
    subjects: subjectsPage,
    students: studentsPage,
    users: usersPage,
    links: linksPage,
    exams: examsPage,
    scores: scoresPage,
    profile: profilePage
  };

  app.innerHTML = shell((pages[state.view] || dashboard)());
}

function restoreView() {
  try {
    const saved = JSON.parse(localStorage.getItem('smpn5tsg-view') || 'null');
    if (saved?.view) state.view = saved.view;
  } catch (error) {
    console.warn('Gagal membaca view:', error);
  }
}

restoreView();
render();
restoreSession();

window.SMPN5TSGApp = { state, refreshData, login, logout, render, addClass, addSubject, addLink };
window.addStudent = async function () {
  if (state.role !== 'admin') {
    alert('Hanya Admin yang bisa menambahkan akun siswa.');
    return;
  }

  const db = client();
  if (!db) {
    alert('Sesi Supabase tidak aktif. Silakan login ulang.');
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

  try {
    const fnName = 'admin-create-student';
    const { error, data } = await db.functions.invoke(fnName, {
      body: {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        nis: nis.trim(),
        class_id: klass.id
      }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    alert('Akun siswa berhasil dibuat. Beri email dan password kepada siswa.');
    await refreshData();
    render();
  } catch (error) {
    alert(error?.message || 'Edge Function admin-create-student belum terdeploy. Gunakan Supabase Edge Function agar Admin dapat membuat akun siswa.');
  }
};

window.addStudentFromProfile = window.addStudent;
