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

const roleLabel = { admin: 'Admin', guru: 'Guru', student: 'Siswa' };

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function client() {
  return window.SMPN5TSGAuth?.state?.client || null;
}

function saveState() {
  localStorage.setItem('smpn5tsg-state', JSON.stringify({ role: state.role, user: state.user, view: state.view }));
}

function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem('smpn5tsg-state') || 'null');
    if (saved) {
      state.role = saved.role || '';
      state.user = saved.user || null;
      state.view = saved.view || 'login';
    }
  } catch (error) {
    console.warn('Gagal load state lokal:', error);
  }
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
      state.users = [];
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
    alert(error.message || 'Gagal memuat data.');
  }
}

async function login() {
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  if (!email || !password) {
    alert('Email dan password wajib diisi.');
    return;
  }

  try {
    const result = await window.SMPN5TSGAuth.login({ email, password, role });
    state.user = { id: result.profile.id, name: result.profile.full_name || result.profile.email, email: result.profile.email };
    state.role = result.profile.role;
    state.view = 'dashboard';
    saveState();
    await refreshData();
    render();
  } catch (error) {
    alert(error.message || 'Login gagal.');
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
  saveState();
  render();
}

function go(view) {
  state.view = view;
  saveState();
  render();
}

function loginPage() {
  return `<main class="login"><section class="card login-card"><div class="logo">S</div><h1>SMPN5TSG</h1><p class="muted">Sistem Ulangan Online</p>
    <label class="field"><span>Email</span><input id="email" type="email" placeholder="email Anda" /></label>
    <label class="field"><span>Password</span><input id="password" type="password" placeholder="password Anda" /></label>
    <label class="field"><span>Login sebagai</span><select id="role"><option value="admin">Admin</option><option value="guru">Guru</option><option value="student">Siswa</option></select></label>
    <button class="btn primary" onclick="login()">Masuk</button>
  </section></main>`;
}

function navMenu() {
  const items = state.role === 'admin'
    ? [['dashboard', '🏠', 'Dashboard'], ['classes', '🏫', 'Kelas'], ['subjects', '📚', 'Mapel'], ['students', '👥', 'Siswa'], ['users', '🔐', 'Guru'], ['links', '🔗', 'Link Ulangan']]
    : state.role === 'guru'
      ? [['dashboard', '🏠', 'Dashboard'], ['classes', '🏫', 'Kelas'], ['subjects', '📚', 'Mapel'], ['students', '👥', 'Siswa'], ['links', '🔗', 'Link Ulangan']]
      : [['dashboard', '🏠', 'Dashboard'], ['exams', '📝', 'Ulangan'], ['scores', '📊', 'Nilai'], ['profile', '👤', 'Profil']];

  return items.map(([key, icon, label]) => `<button class="nav ${state.view === key ? 'active' : ''}" onclick="go('${key}')">${icon} ${label}</button>`).join('');
}

function shell(content) {
  return `<header class="top"><h2>🎓 SMPN5TSG</h2><span>${esc(state.user?.name || '')} · ${esc(roleLabel[state.role] || state.role)}</span><button class="btn secondary" onclick="logout()">Keluar</button></header>
  <div class="layout"><aside class="sidebar">${navMenu()}</aside><main class="wrap">${content}</main></div>`;
}

function dashboard() {
  const data = state.role === 'admin'
    ? [['Kelas', state.classes.length], ['Mapel', state.subjects.length], ['Siswa', state.students.length], ['Link Ulangan', state.links.length]]
    : state.role === 'guru'
      ? [['Kelas', state.classes.length], ['Mapel', state.subjects.length], ['Siswa', state.students.length], ['Link Ulangan', state.links.length]]
      : [['Ulangan', state.links.length], ['Nilai', state.results.length]];

  return `<div class="welcome"><p class="muted">Sistem Ulangan Online</p><h1>Selamat datang, ${esc(state.user.name)}</h1><p class="muted">Akses: ${esc(roleLabel[state.role] || state.role)}</p></div><div class="grid">${data.map(([label, value]) => `<div class="tile"><h3>${esc(label)}</h3><strong>${value}</strong></div>`).join('')}</div>`;
}

function classesPage() {
  const rows = state.classes.map(c => `<tr><td>${esc(c.class_name)}</td><td>${esc(c.homeroom_teacher_id || '-')}</td><td>${state.role !== 'student' ? `<button class="btn danger small" onclick="deleteClass('${c.id}')">Hapus</button>` : ''}</td></tr>`).join('');
  return `<div class="page-head"><h1>Kelas</h1>${state.role !== 'student' ? '<button class="btn primary small" onclick="addClass()">+ Tambah Kelas</button>' : ''}</div>${card('Daftar kelas', `<table class="table"><tr><th>Nama kelas</th><th>Wali kelas</th><th>Aksi</th></tr>${rows || '<tr><td colspan="3">Belum ada kelas.</td></tr>'}</table>`)}`;
}

async function addClass() {
  const name = prompt('Nama kelas contoh: VII-A');
  if (!name?.trim()) return;
  const { error } = await client().from('classes').insert({ class_name: name.trim(), homeroom_teacher_id: state.role === 'guru' ? state.user.id : null });
  if (error) { alert(error.message); return; }
  await refreshData(); render();
}

async function deleteClass(id) {
  if (!confirm('Hapus kelas ini?')) return;
  const { error } = await client().from('classes').delete().eq('id', id);
  if (error) { alert(error.message); return; }
  await refreshData(); render();
}

function subjectsPage() {
  const rows = state.subjects.map(s => `<tr><td>${esc(s.name)}</td><td>${state.role !== 'student' ? `<button class="btn danger small" onclick="deleteSubject('${s.id}')">Hapus</button>` : ''}</td></tr>`).join('');
  return `<div class="page-head"><h1>Mata Pelajaran</h1>${state.role !== 'student' ? '<button class="btn primary small" onclick="addSubject()">+ Tambah Mapel</button>' : ''}</div>${card('Daftar mapel', `<table class="table"><tr><th>Nama</th><th>Aksi</th></tr>${rows || '<tr><td colspan="2">Belum ada mapel.</td></tr>'}</table>`)}`;
}

async function addSubject() {
  const name = prompt('Nama mata pelajaran');
  if (!name?.trim()) return;
  const { error } = await client().from('subjects').insert({ name: name.trim() });
  if (error) { alert(error.message); return; }
  await refreshData(); render();
}

async function deleteSubject(id) {
  if (!confirm('Hapus mapel ini?')) return;
  const { error } = await client().from('subjects').delete().eq('id', id);
  if (error) { alert(error.message); return; }
  await refreshData(); render();
}

function studentsPage() {
  const rows = state.students.map(s => `<tr><td>${esc(s.profiles?.full_name || '-')}</td><td>${esc(s.nis || '-')}</td><td>${esc(state.classes.find(c => c.id === s.class_id)?.class_name || '-')}</td><td>${esc(s.profiles?.email || '-')}</td></tr>`).join('');
  return `<div class="page-head"><h1>Siswa</h1></div>${card('Daftar siswa', `<table class="table"><tr><th>Nama</th><th>NIS</th><th>Kelas</th><th>Email</th></tr>${rows || '<tr><td colspan="4">Belum ada siswa.</td></tr>'}</table>`)}`;
}

function usersPage() {
  const rows = state.users.filter(u => u.role === 'guru').map(u => `<tr><td>${esc(u.full_name)}</td><td>${esc(u.email)}</td><td>${esc(roleLabel[u.role] || u.role)}</td></tr>`).join('');
  return `<div class="page-head"><h1>Akun Guru</h1></div>${card('Daftar guru', `<table class="table"><tr><th>Nama</th><th>Email</th><th>Role</th></tr>${rows || '<tr><td colspan="3">Belum ada guru.</td></tr>'}</table>`)}`;
}

function linksPage() {
  const rows = state.links.map(l => `<tr><td>${esc(l.title)}</td><td>${esc(state.classes.find(c => c.id === l.class_id)?.class_name || '-')}</td><td>${esc(l.status)}</td><td><a href="${esc(l.url)}" target="_blank" rel="noopener">Buka</a></td></tr>`).join('');
  return `<div class="page-head"><h1>Link Ulangan</h1>${state.role !== 'student' ? '<button class="btn primary small" onclick="addLink()">+ Tambah Link</button>' : ''}</div>${card('Daftar link', `<table class="table"><tr><th>Judul</th><th>Kelas</th><th>Status</th><th>Link</th></tr>${rows || '<tr><td colspan="4">Belum ada link.</td></tr>'}</table>`)}`;
}

async function addLink() {
  const title = prompt('Judul ulangan');
  const url = prompt('URL Google Form');
  const className = prompt(`Kelas: ${state.classes.map(c => c.class_name).join(', ')}`);
  const subjectName = prompt(`Mapel: ${state.subjects.map(s => s.name).join(', ')}`);
  if (!title?.trim() || !url?.trim() || !className?.trim() || !subjectName?.trim()) return;

  const classObj = state.classes.find(c => c.class_name.toLowerCase() === className.trim().toLowerCase());
  const subjectObj = state.subjects.find(s => s.name.toLowerCase() === subjectName.trim().toLowerCase());
  if (!classObj || !subjectObj) return alert('Kelas atau mapel tidak ditemukan.');

  const { error } = await client().from('exam_links').insert({
    title: title.trim(),
    url: url.trim(),
    class_id: classObj.id,
    subject_id: subjectObj.id,
    status: 'draft',
    created_by: state.user.id
  });

  if (error) { alert(error.message); return; }
  await refreshData(); render();
}

function examsPage() {
  return linksPage();
}

function scoresPage() {
  const rows = state.results.map(r => `<tr><td>${esc(r.exam_links?.title || '-')}</td><td>${esc(r.status)}</td><td>${esc(r.score ?? '-')}</td></tr>`).join('');
  return `<div class="page-head"><h1>Nilai Saya</h1></div>${card('Nilai', `<table class="table"><tr><th>Ulangan</th><th>Status</th><th>Nilai</th></tr>${rows || '<tr><td colspan="3">Belum ada nilai.</td></tr>'}</table>`)}`;
}

function profilePage() {
  return card('Profil Saya', `<p>Nama: <b>${esc(state.user.name)}</b></p><p>Email: <b>${esc(state.user.email)}</b></p><p>Role: <b>${esc(roleLabel[state.role] || state.role)}</b></p>`);
}

function card(title, body) {
  return `<section class="card"><h2>${esc(title)}</h2>${body}</section>`;
}

function render() {
  const app = document.getElementById('app');
  if (!app) return;
  if (!state.user || !state.role) {
    app.innerHTML = loginPage();
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

async function restoreSession() {
  try {
    if (!window.SMPN5TSGAuth) return;
    const profile = await window.SMPN5TSGAuth.restoreSession();
    if (!profile) return render();
    state.user = { id: profile.id, name: profile.full_name || profile.email, email: profile.email };
    state.role = profile.role;
    state.view = 'dashboard';
    saveState();
    await refreshData();
    render();
  } catch (error) {
    console.warn('Restore session:', error);
    render();
  }
}

restoreState();
render();
restoreSession();
window.SMPN5TSGApp = { state, refreshData, login, logout, render, addClass, addSubject, addLink };
