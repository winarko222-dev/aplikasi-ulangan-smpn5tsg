const defaultState = {
  role: '',
  user: null,
  view: 'login',
  classes: [],
  subjects: [],
  students: [],
  links: [],
  users: []
};

const state = JSON.parse(JSON.stringify(defaultState));

function save() {
  localStorage.setItem('smpn5tsg-demo', JSON.stringify(state));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem('smpn5tsg-demo') || 'null');
    if (saved) Object.assign(state, saved);
  } catch (error) {
    console.warn('Gagal memuat state dari localStorage:', error);
  }

  state.classes = state.classes || [];
  state.subjects = state.subjects || [];
  state.students = state.students || [];
  state.links = state.links || [];
  state.users = state.users || [];
}

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function refreshData() {
  const client = window.SMPN5TSGAuth?.state?.client;
  if (!client || !state.user) return;

  try {
    const role = state.role;

    if (role === 'admin' || role === 'guru') {
      const [{ data: classesData }, { data: subjectsData }, { data: studentsData }, { data: linksData }] = await Promise.all([
        client.from('classes').select('*').order('class_name'),
        client.from('subjects').select('*').order('name'),
        client.from('students')
          .select('id, nis, class_id, profiles(full_name, email)')
          .order('nis'),
        client.from('exam_links')
          .select('id, title, url, status, class_id, subject_id')
          .order('title')
      ]);

      state.classes = classesData || [];
      state.subjects = subjectsData || [];
      state.students = studentsData || [];
      state.links = linksData || [];
    }

    if (role === 'admin') {
      const { data: profilesData } = await client
        .from('profiles')
        .select('id, full_name, email, role')
        .order('full_name');
      state.users = profilesData || [];
    }

    save();
  } catch (error) {
    console.warn('Gagal memuat data Supabase:', error);
  }
}

async function login() {
  const email = document.getElementById('email').value.trim().toLowerCase();
  const pass = document.getElementById('password').value;
  const chosenRole = document.getElementById('role').value;

  if (!email) {
    alert('Email wajib diisi.');
    return;
  }

  if (!pass) {
    alert('Password wajib diisi.');
    return;
  }

  try {
    if (!window.SMPN5TSGAuth || !window.SMPN5TSGAuth.configured) {
      throw new Error('Supabase belum dikonfigurasi. Isi config.js terlebih dahulu.');
    }

    const { profile } = await window.SMPN5TSGAuth.login({
      email,
      password: pass,
      role: chosenRole
    });

    state.user = {
      id: profile.id,
      name: profile.full_name || profile.email,
      email: profile.email,
      role: profile.role
    };
    state.role = profile.role;
    state.view = 'dashboard';
    await refreshData();
    save();
    render();
  } catch (error) {
    alert(error.message || 'Login gagal.');
  }
}

async function logout() {
  try {
    if (window.SMPN5TSGAuth && window.SMPN5TSGAuth.logout) {
      await window.SMPN5TSGAuth.logout();
    }
  } catch (error) {
    console.warn('Logout Supabase gagal:', error);
  }

  state.user = null;
  state.role = '';
  state.view = 'login';
  save();
  render();
}

function renderLogin() {
  return `
    <main class="login">
      <section class="card login-card">
        <div class="logo">S</div>
        <h1>SMPN5TSG</h1>
        <p class="muted">Sistem Ulangan Online</p>

        <label class="field">
          <span>Email</span>
          <input id="email" type="email" placeholder="admin@sekolah.sch.id" />
        </label>

        <label class="field">
          <span>Password</span>
          <input id="password" type="password" placeholder="Masukkan password" />
        </label>

        <label class="field">
          <span>Login Sebagai</span>
          <select id="role">
            <option value="admin">Admin</option>
            <option value="guru">Guru</option>
            <option value="student">Siswa</option>
          </select>
        </label>

        <button class="btn primary" onclick="login()">Masuk</button>
      </section>
    </main>
  `;
}

function renderDashboard() {
  const userName = state.user?.name || state.user?.email || 'Pengguna';
  const cards = [
    { title: 'Kelas', value: String(state.classes.length) },
    { title: 'Mata Pelajaran', value: String(state.subjects.length) },
    { title: 'Siswa', value: String(state.students.length) },
    { title: 'Link Form', value: String(state.links.length) }
  ];

  return `
    <main class="dashboard">
      <header class="topbar">
        <div>
          <h2>SMPN5TSG</h2>
        </div>
        <div class="topbar-right">
          <span>${esc(userName)}</span>
          <button class="btn secondary" onclick="logout()">Keluar</button>
        </div>
      </header>

      <section class="hero">
        <div>
          <p class="muted">Sistem Ulangan Online</p>
          <h1>Selamat datang, ${esc(userName)}</h1>
          <p class="muted">Akses: ${esc(state.role)}</p>
        </div>
      </section>

      <section class="grid">
        ${cards.map(card => `
          <div class="card compact-card">
            <h3>${esc(card.title)}</h3>
            <p class="big-number">${esc(card.value)}</p>
          </div>
        `).join('')}
      </section>

      <section class="card">
        <h3>Info</h3>
        <p>Data aplikasi dibaca dari Supabase. Login menggunakan akun Supabase yang aktif.</p>
        ${state.role === 'admin' ? `<p>Mode admin aktif.</p>` : ''}
      </section>
    </main>
  `;
}

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (state.role && state.user) {
    app.innerHTML = renderDashboard();
    return;
  }

  app.innerHTML = renderLogin();
}

async function restoreSessionOnLoad() {
  try {
    if (!window.SMPN5TSGAuth || !window.SMPN5TSGAuth.restoreSession) return;

    const profile = await window.SMPN5TSGAuth.restoreSession();
    if (!profile) return;

    state.user = {
      id: profile.id,
      name: profile.full_name || profile.email,
      email: profile.email,
      role: profile.role
    };
    state.role = profile.role;
    state.view = 'dashboard';
    await refreshData();
    save();
    render();
  } catch (error) {
    console.warn('Session restore gagal:', error);
  }
}

load();
render();
restoreSessionOnLoad();

window.SMPN5TSGApp = {
  state,
  refreshData,
  login,
  logout,
  render,
  restoreSessionOnLoad
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

