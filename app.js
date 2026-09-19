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

function card(title, body) {
  return `<section class="card"><h2>${esc(title)}</h2>${body}</section>`;
}

function notify(error) {
  alert(error?.message || String(error) || 'Terjadi kesalahan.');
}

function menuForRole() {
  const common = [['dashboard', '🏠', 'Dashboard']];
  if (state.role === 'admin') return common.concat([
    ['classes', '🏫', 'Kelola Kelas'], ['subjects', '📚', 'Mata Pelajaran'],
    ['students', '👥', 'Siswa'], ['users', '🔐', 'Akun Guru'], ['links', '🔗', 'Link Google Forms']
  ]);
  if (state.role === 'guru') return common.concat([
    ['classes', '🏫', 'Kelas Saya'], ['subjects', '📚', 'Mata Pelajaran'],
    ['students', '👥', 'Siswa'], ['links', '🔗', 'Link Google Forms']
  ]);
  return common.concat([['exams', '📝', 'Ulangan'], ['scores', '📊', 'Nilai Saya'], ['profile', '👤', 'Profil']]);
}

async function refreshData() {
  const db = client();
  if (!db || !state.user) return;

  const queries = [];
  if (state.role === 'admin' || state.role === 'guru') {
    queries.push(db.from('classes').select('*').order('class_name'));
    queries.push(db.from('subjects').select('*').order('name'));
    queries.push(db.from('students').select('id,nis,class_id,profile_id,profiles(full_name,email)').order('nis'));
    queries.push(db.from('exam_links').select('id,title,url,status,class_id,subject_id,created_by').order('created_at', { ascending: false }));
  } else {
    queries.push(db.from('exam_links').select('id,title,url,status,class_id,subject_id').eq('status', 'active'));
    queries.push(db.from('exam_results').select('id,score,status,exam_link_id,student_id,exam_links(title)').order('created_at', { ascending: false }));
  }

  const responses = await Promise.all(queries);
  responses.forEach(response => { if (response.error) throw response.error; });

  if (state.role === 'admin' || state.role === 'guru') {
    [state.classes, state.subjects, state.students, state.links] = responses.map(r => r.data || []);
    if (state.role === 'admin') {
      const users = await db.from('profiles').select('id,full_name,email,role,nis').order('full_name');
      if (users.error) throw users.error;
      state.users = users.data || [];
    }
  } else {
    state.links = responses[0].data || [];
    state.results = responses[1].data || [];
  }
}

async function login() {
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  if (!email || !password) return alert('Email dan password wajib diisi.');
  try {
    const result = await window.SMPN5TSGAuth.login({ email, password, role });
    state.user = { id: result.profile.id, name: result.profile.full_name || result.profile.email, email: result.profile.email };
    state.role = result.profile.role;
    state.view = 'dashboard';
    await refreshData();
    render();
  } catch (error) { notify(error); }
}

async function restoreSession() {
  try {
    const profile = await window.SMPN5TSGAuth.restoreSession();
    if (!profile) return render();
    state.user = { id: profile.id, name: profile.full_name || profile.email, email: profile.email };
    state.role = profile.role;
    state.view = 'dashboard';
    await refreshData();
    render();
  } catch (error) { console.warn('Session restore:', error); render(); }
}

async function logout() {
  try { await window.SMPN5TSGAuth.logout(); } catch (error) { console.warn(error); }
  state.user = null; state.role = ''; state.view = 'login';
  localStorage.removeItem('smpn5tsg-view'); render();
}

function go(view) { state.view = view; saveView(); render(); }

function renderLogin() {
  return `<main class="login"><section class="card login-card"><div class="logo">S</div><h1>SMPN5TSG</h1><p class="muted">Sistem Ulangan Online</p>
    <label class="field">Email<input id="email" type="email" autocomplete="username" placeholder="email Anda"></label>
    <label class="field">Password<input id="password" type="password" autocomplete="current-password" placeholder="password Anda"></label>
    <label class="field">Masuk sebagai<select id="role"><option value="admin">Admin</option><option value="guru">Guru</option><option value="student">Siswa</option></select></label>
    <button class="btn primary" onclick="login()">Masuk</button></section></main>`;
}

function shell(content) {
  const items = menuForRole();
  return `<header class="top"><h2>🎓 SMPN5TSG</h2><span>${esc(state.user?.name || '')} · ${esc(roleLabel[state.role] || state.role)}</span><button class="btn secondary" onclick="logout()">Keluar</button></header>
  <div class="layout"><aside class="sidebar"><b>${esc(roleLabel[state.role] || state.role)}</b>${items.map(x => `<button class="nav ${state.view === x[0] ? 'active' : ''}" onclick="go('${x[0]}')">${x[1]} ${x[2]}</button>`).join('')}</aside><main class="wrap">${content}</main></div>`;
}

function dashboard() {
  const counts = state.role === 'student' ? [['Ulangan', state.links.length], ['Nilai', state.results.length]] : [['Kelas', state.classes.length], ['Mata Pelajaran', state.subjects.length], ['Siswa', state.students.length], ['Link Ulangan', state.links.length]];
  return `<div class="welcome"><p class="muted">Sistem Ulangan Online</p><h1>Selamat datang, ${esc(state.user.name)}</h1><p class="muted">Akses: ${esc(roleLabel[state.role] || state.role)}</p></div><div class="grid">${counts.map(c => `<div class="tile"><h3>${esc(c[0])}</h3><strong>${c[1]}</strong></div>`).join('')}</div>${card('Panduan', `<p>${state.role === 'admin' ? 'Admin mengatur akun guru dan data utama.' : state.role === 'guru' ? 'Guru dapat menambah kelas, mata pelajaran, siswa, dan link ulangan.' : 'Siswa membuka ulangan aktif dan melihat nilainya.'}</p>`)}`;
}

function classesPage() {
  const canEdit = state.role === 'admin' || state.role === 'guru';
  const rows = state.classes.map(c => `<tr><td>${esc(c.class_name)}</td><td>${esc(c.homeroom_teacher_id || '-')}</td><td>${canEdit ? `<button class="btn danger small" onclick="deleteClass('${c.id}')">Hapus</button>` : ''}</td></tr>`).join('');
  return `<div class="page-head"><h1>${state.role === 'guru' ? 'Kelas Saya' : 'Kelola Kelas'}</h1>${canEdit ? '<button class="btn primary small" onclick="addClass()">+ Tambah Kelas</button>' : ''}</div>${card('Daftar kelas', `<div class="table-wrap"><table class="table"><tr><th>Nama kelas</th><th>Wali kelas</th><th>Aksi</th></tr>${rows || '<tr><td colspan="3">Belum ada kelas.</td></tr>'}</table></div>`)}`;
}

async function addClass() {
  const name = prompt('Nama kelas, contoh VII-A');
  if (!name?.trim()) return;
  const { error } = await client().from('classes').insert({ class_name: name.trim(), homeroom_teacher_id: state.role === 'guru' ? state.user.id : null });
  if (error) return notify(error);
  await refreshData(); render();
}

async function deleteClass(id) {
  if (!confirm('Hapus kelas ini? Data yang masih terkait dapat mencegah penghapusan.')) return;
  const { error } = await client().from('classes').delete().eq('id', id);
  if (error) return notify(error);
  await refreshData(); render();
}

function subjectsPage() {
  const canEdit = state.role === 'admin' || state.role === 'guru';
  const rows = state.subjects.map(s => `<tr><td>${esc(s.name)}</td><td>${canEdit ? `<button class="btn danger small" onclick="deleteSubject('${s.id}')">Hapus</button>` : ''}</td></tr>`).join('');
  return `<div class="page-head"><h1>Mata Pelajaran</h1>${canEdit ? '<button class="btn primary small" onclick="addSubject()">+ Tambah</button>' : ''}</div>${card('Daftar mata pelajaran', `<table class="table"><tr><th>Nama</th><th>Aksi</th></tr>${rows || '<tr><td colspan="2">Belum ada mata pelajaran.</td></tr>'}</table>`)}`;
}

async function addSubject() {
  const name = prompt('Nama mata pelajaran');
  if (!name?.trim()) return;
  const { error } = await client().from('subjects').insert({ name: name.trim() });
  if (error) return notify(error);
  await refreshData(); render();
}

async function deleteSubject(id) {
  if (!confirm('Hapus mata pelajaran ini?')) return;
  const { error } = await client().from('subjects').delete().eq('id', id);
  if (error) return notify(error);
  await refreshData(); render();
}

function studentsPage() {
  const rows = state.students.map(s => `<tr><td>${esc(s.profiles?.full_name || '-')}</td><td>${esc(s.nis)}</td><td>${esc(state.classes.find(c => c.id === s.class_id)?.class_name || '-')}</td><td>${esc(s.profiles?.email || '')}</td></tr>`).join('');
  return `<div class="page-head"><h1>Siswa</h1></div>${card('Daftar siswa', `<p class="notice">Akun siswa dibuat di Authentication → Users. Setelah itu lengkapi profil dan kelasnya di Supabase.</p><div class="table-wrap"><table class="table"><tr><th>Nama</th><th>NIS</th><th>Kelas</th><th>Email</th></tr>${rows || '<tr><td colspan="4">Belum ada siswa.</td></tr>'}</table></div>`)}`;
}

function usersPage() {
  const rows = state.users.filter(u => u.role === 'guru').map(u => `<tr><td>${esc(u.full_name)}</td><td>${esc(u.email)}</td><td>${esc(roleLabel[u.role])}</td></tr>`).join('');
  return `<div class="page-head"><h1>Akun Guru</h1></div>${card('Manajemen akun guru', `<p class="notice">Agar aman, buat user melalui Supabase → Authentication → Users. Trigger database otomatis membuat profil; ubah role profil menjadi <b>guru</b>. Password tidak pernah disimpan di aplikasi.</p><table class="table"><tr><th>Nama</th><th>Email</th><th>Role</th></tr>${rows || '<tr><td colspan="3">Belum ada akun guru.</td></tr>'}</table>`)}`;
}

function linksPage() {
  const rows = state.links.map(l => `<tr><td>${esc(l.title)}</td><td>${esc(state.classes.find(c => c.id === l.class_id)?.class_name || '-')}</td><td>${esc(l.status)}</td><td><a href="${esc(l.url)}" target="_blank" rel="noopener">Buka</a></td></tr>`).join('');
  return `<div class="page-head"><h1>Link Google Forms</h1>${state.role !== 'student' ? '<button class="btn primary small" onclick="addLink()">+ Tambah Link</button>' : ''}</div>${card('Daftar link', `<table class="table"><tr><th>Judul</th><th>Kelas</th><th>Status</th><th>Link</th></tr>${rows || '<tr><td colspan="4">Belum ada link.</td></tr>'}</table>`)}`;
}

async function addLink() {
  if (!state.classes.length || !state.subjects.length) return alert('Buat kelas dan mata pelajaran terlebih dahulu.');
  const title = prompt('Judul ulangan');
  const url = prompt('URL Google Form');
  if (!title?.trim() || !url?.trim()) return;
  const className = prompt(`Kelas (${state.classes.map(c => c.class_name).join(', ')})`);
  const subjectName = prompt(`Mata pelajaran (${state.subjects.map(s => s.name).join(', ')})`);
  const klass = state.classes.find(c => c.class_name.toLowerCase() === className?.trim().toLowerCase());
  const subject = state.subjects.find(s => s.name.toLowerCase() === subjectName?.trim().toLowerCase());
  if (!klass || !subject) return alert('Kelas atau mata pelajaran tidak ditemukan.');
  const { error } = await client().from('exam_links').insert({ title: title.trim(), url: url.trim(), class_id: klass.id, subject_id: subject.id, status: 'draft', created_by: state.user.id });
  if (error) return notify(error);
  await refreshData(); render();
}

function examsPage() { return linksPage(); }
function scoresPage() { return card('Nilai Saya', `<table class="table"><tr><th>Ulangan</th><th>Status</th><th>Nilai</th></tr>${state.results.map(r => `<tr><td>${esc(r.exam_links?.title || '-')}</td><td>${esc(r.status)}</td><td>${esc(r.score ?? '-')}</td></tr>`).join('') || '<tr><td colspan="3">Belum ada nilai.</td></tr>'}</table>`); }
function profilePage() { return card('Profil', `<p>Nama: <b>${esc(state.user.name)}</b></p><p>Email: <b>${esc(state.user.email)}</b></p><p>Role: <b>${esc(roleLabel[state.role])}</b></p>`); }

function render() {
  const app = document.getElementById('app');
  if (!app) return;
  if (!state.user || !state.role) return (app.innerHTML = renderLogin());
  const pages = { dashboard, classes: classesPage, subjects: subjectsPage, students: studentsPage, users: usersPage, links: linksPage, exams: examsPage, scores: scoresPage, profile: profilePage };
  app.innerHTML = shell((pages[state.view] || dashboard)());
}

loadInitial();
function loadInitial() { restoreSession(); }

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.warn);
});

window.SMPN5TSGApp = { state, refreshData, login, logout, render, addClass, addSubject, addLink };
