const defaultState = {
  role: '',
  user: null,
  view: 'login'
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
    console.warn('Gagal memuat state localStorage:', error);
  }
}

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
          <input id="email" type="email" placeholder="admin@guru.smp.belajar.id" />
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
  const roleLabel = state.role || 'user';

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
          <p class="muted">Akses: ${esc(roleLabel)}</p>
        </div>
      </section>

      <section class="grid">
        <div class="card">
          <h3>Ringkasan</h3>
          <p>Login berhasil menggunakan Supabase Auth.</p>
          <p>Role aktif: <strong>${esc(roleLabel)}</strong></p>
        </div>

        <div class="card">
          <h3>Menu cepat</h3>
          <ul>
            <li>Kelola kelas</li>
            <li>Kelola mata pelajaran</li>
            <li>Kelola siswa</li>
            <li>Kelola link Google Form</li>
          </ul>
        </div>
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
    save();
    render();
  } catch (error) {
    console.warn('Session restore gagal:', error);
  }
}

load();
render();
restoreSessionOnLoad();
