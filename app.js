const defaultState = {
  role: 'Admin',
  view: 'dashboard',
  classes: [
    ['VII-A', '32'],
    ['VIII-B', '30'],
    ['IX-A', '28']
  ],
  subjects: ['Matematika', 'IPA', 'Bahasa Indonesia', 'IPS', 'PKN'],
  students: [
    ['Andi Pratama', '001', 'IX-A'],
    ['Budi Santoso', '002', 'IX-A'],
    ['Citra Dewi', '003', 'IX-A'],
    ['Dewi Lestari', '004', 'VIII-B'],
    ['Fajar Nugraha', '005', 'VII-A']
  ],
  links: [
    ['IX-A', 'Matematika', 'Ulangan Bab Bilangan', 'Aktif', 'https://forms.gle/contoh-matematika'],
    ['VIII-B', 'IPA', 'Ulangan Sistem Pernapasan', 'Aktif', 'https://forms.gle/contoh-ipa'],
    ['VII-A', 'Bahasa Indonesia', 'Teks Deskripsi', 'Draft', 'https://forms.gle/contoh-indonesia']
  ],
  statuses: [
    ['Andi Pratama', 'IX-A', 'Matematika', 'Sudah mengerjakan', '86'],
    ['Budi Santoso', 'IX-A', 'Matematika', 'Belum mengerjakan', '-'],
    ['Citra Dewi', 'IX-A', 'Matematika', 'Sudah mengerjakan', '92'],
    ['Dewi Lestari', 'VIII-B', 'IPA', 'Sudah mengerjakan', '88'],
    ['Fajar Nugraha', 'VII-A', 'Bahasa Indonesia', 'Belum mengerjakan', '-']
  ]
};

const state = JSON.parse(JSON.stringify(defaultState));

function saveState() {
  localStorage.setItem('smpn5tsg-demo', JSON.stringify(state));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('smpn5tsg-demo') || 'null');
    if (saved) {
      Object.assign(state, saved);
    }
  } catch (e) {
    console.warn('Tidak bisa membaca localStorage', e);
  }
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function login() {
  const email = document.getElementById('email')?.value?.trim();
  const role = document.getElementById('role')?.value || 'Admin';

  if (!email) {
    alert('Silakan masukkan email atau akun Anda.');
    return;
  }

  state.role = role;
  state.view = 'dashboard';
  saveState();
  render();
}

function logout() {
  state.role = 'Admin';
  state.view = 'dashboard';
  localStorage.removeItem('smpn5tsg-demo');
  renderLogin();
}

const menuByRole = {
  Admin: [
    ['dashboard', '🏠', 'Dashboard'],
    ['classes', '🏫', 'Kelola Kelas'],
    ['subjects', '📚', 'Mata Pelajaran'],
    ['students', '👥', 'Siswa'],
    ['links', '🔗', 'Link Google Forms'],
    ['status', '📊', 'Status & Nilai']
  ],
  Guru: [
    ['dashboard', '🏠', 'Dashboard'],
    ['classes', '🏫', 'Kelas Saya'],
    ['links', '🔗', 'Link Google Forms'],
    ['status', '📊', 'Status Pengerjaan'],
    ['reports', '⬇️', 'Download Rekap']
  ],
  Siswa: [
    ['dashboard', '🏠', 'Dashboard'],
    ['exams', '📝', 'Ulangan Tersedia'],
    ['scores', '🏆', 'Nilai Saya'],
    ['profile', '👤', 'Profil']
  ]
};

function shell(content) {
  const nav = menuByRole[state.role]
    .map((item) => {
      const active = state.view === item[0] ? 'active' : '';
      return `<button class="nav ${active}" onclick="go('${item[0]}')">${item[1]} ${item[2]}</button>`;
    })
    .join('');

  return `
    <header class="top">
      <h2>🎓 SMPN5TSG</h2>
      <button class="btn secondary" onclick="logout()">Keluar</button>
    </header>
    <div class="layout">
      <aside class="sidebar">
        <b>${esc(state.role)}</b>
        ${nav}
      </aside>
      <main class="wrap content">${content}</main>
    </div>
  `;
}

function go(view) {
  state.view = view;
  saveState();
  render();
}

function card(title, body, extraClass = '') {
  return `<section class="card ${extraClass}"><h2>${esc(title)}</h2>${body}</section>`;
}

function dashboard() {
  const doneCount = state.statuses.filter((x) => x[3].startsWith('Sudah')).length;
  const summaryTiles = [
    ['🏫', state.classes.length, 'Kelas'],
    ['📚', state.subjects.length, 'Mapel'],
    ['✅', doneCount, 'Sudah'],
    ['📝', state.links.length, 'Ulangan']
  ];

  const quick = menuByRole[state.role]
    .slice(1, 4)
    .map((item) => `<button class="btn secondary" onclick="go('${item[0]}')">${item[1]} ${item[2]}</button>`)
    .join('');

  const tiles = summaryTiles
    .map((tile) => `
      <div class="tile">
        <div class="icon">${tile[0]}</div>
        <h3>${tile[1]}</h3>
        <p class="muted">${tile[2]}</p>
      </div>
    `)
    .join('');

  return `
    <div class="welcome">
      <div>
        <p class="muted">Sistem Ulangan Online</p>
        <h1>Selamat datang, ${esc(state.role)}</h1>
      </div>
      <span class="badge ok">Prototype aktif</span>
    </div>

    <div class="grid">${tiles}</div>

    ${card('Aksi cepat', `<div class="quick">${quick}</div>`) }

    <p class="notice">
      Data demo ini sedang berjalan di browser perangkat Anda. Integrasi Google Forms, Google Sheets, dan database online akan ditambahkan pada tahap berikutnya.
    </p>
  `;
}

function classes() {
  return `
    <div class="page-head">
      <h1>Kelola Kelas</h1>
      <button class="btn primary small" onclick="addClass()">+ Tambah Kelas</button>
    </div>
    ${card('Daftar kelas', `
      <div class="table-wrap">
        <table class="table">
          <tr>
            <th>Kelas</th>
            <th>Jumlah siswa</th>
            <th>Aksi</th>
          </tr>
          ${state.classes
            .map(
              ([kelas, jumlah]) => `
                <tr>
                  <td>${esc(kelas)}</td>
                  <td>${esc(jumlah)}</td>
                  <td><button class="btn secondary small" onclick="alert('Detail kelas ${esc(kelas)} siap dibuat.')">Lihat</button></td>
                </tr>
              `
            )
            .join('')}
        </table>
      </div>
    `)}
  `;
}

function subjects() {
  return `
    <div class="page-head">
      <h1>Mata Pelajaran</h1>
      <button class="btn primary small" onclick="addSubject()">+ Tambah Mapel</button>
    </div>
    ${card('Daftar mata pelajaran', `
      <div class="chips">
        ${state.subjects.map((name) => `<span class="chip">📚 ${esc(name)}</span>`).join('')}
      </div>
    `)}
  `;
}

function students() {
  return `
    <div class="page-head">
      <h1>Data Siswa</h1>
      <button class="btn primary small" onclick="addStudent()">+ Tambah Siswa</button>
    </div>
    ${card('Daftar siswa', `
      <div class="table-wrap">
        <table class="table">
          <tr>
            <th>Nama</th>
            <th>NIS</th>
            <th>Kelas</th>
          </tr>
          ${state.students
            .map(
              ([nama, nis, kelas]) => `
                <tr>
                  <td>${esc(nama)}</td>
                  <td>${esc(nis)}</td>
                  <td>${esc(kelas)}</td>
                </tr>
              `
            )
            .join('')}
        </table>
      </div>
    `)}
  `;
}

function linksPage() {
  return `
    <div class="page-head">
      <h1>Link Google Forms</h1>
      <button class="btn primary small" onclick="addLink()">+ Tambah Link</button>
    </div>
    <p class="muted">Tiap mata pelajaran dapat memiliki tautan Google Forms yang berbeda.</p>
    ${state.links
      .map(
        ([kelas, mapel, title, status, url]) => card(
          `${esc(kelas)} • ${esc(mapel)}`,
          `
            <p><b>${esc(title)}</b> <span class="badge ${status === 'Aktif' ? 'ok' : 'wait'}">${esc(status)}</span></p>
            <p class="link">${esc(url)}</p>
            <div class="button-row">
              <button class="btn secondary small" onclick="window.open('${esc(url)}', '_blank')">Buka Forms</button>
              <button class="btn secondary small" onclick="alert('Edit link ${esc(title)} akan dibuat pada tahap integrasi.')">Edit</button>
            </div>
          `,
          'link-card'
        )
      )
      .join('')}
  `;
}

function statusPage() {
  return `
    <div class="page-head">
      <h1>Status & Nilai</h1>
      <button class="btn primary small" onclick="downloadCSV()">⬇️ Download CSV</button>
    </div>
    ${card('Daftar pengerjaan', `
      <div class="table-wrap">
        <table class="table">
          <tr>
            <th>Nama</th>
            <th>Kelas</th>
            <th>Mapel</th>
            <th>Status</th>
            <th>Nilai</th>
          </tr>
          ${state.statuses
            .map(
              ([nama, kelas, mapel, status, nilai]) => `
                <tr>
                  <td>${esc(nama)}</td>
                  <td>${esc(kelas)}</td>
                  <td>${esc(mapel)}</td>
                  <td><span class="badge ${status.startsWith('Sudah') ? 'ok' : 'wait'}">${esc(status)}</span></td>
                  <td>${esc(nilai)}</td>
                </tr>
              `
            )
            .join('')}
        </table>
      </div>
    `)}
  `;
}

function reports() {
  return statusPage();
}

function exams() {
  return `
    <h1>Ulangan Tersedia</h1>
    ${state.links
      .filter(([kelas, mapel, title, status]) => status === 'Aktif')
      .map(
        ([kelas, mapel, title, status, url]) => card(
          `${esc(title)}`,
          `
            <p>${esc(kelas)} • ${esc(mapel)}</p>
            <button class="btn primary small" onclick="window.open('${esc(url)}', '_blank')">Buka Google Forms</button>
          `
        )
      )
      .join('')}
  `;
}

function scores() {
  return `
    <h1>Nilai Saya</h1>
    ${card('Hasil ulangan', `
      <div class="table-wrap">
        <table class="table">
          <tr>
            <th>Mata Pelajaran</th>
            <th>Nilai</th>
            <th>Status</th>
          </tr>
          <tr>
            <td>Matematika</td>
            <td><b>86</b></td>
            <td><span class="badge ok">Sudah dinilai</span></td>
          </tr>
          <tr>
            <td>IPA</td>
            <td><b>88</b></td>
            <td><span class="badge ok">Sudah dinilai</span></td>
          </tr>
        </table>
      </div>
    `)}
  `;
}

function profile() {
  return `
    <h1>Profil Siswa</h1>
    ${card('Data profil', `
      <p><b>Nama:</b> Andi Pratama</p>
      <p><b>NIS:</b> 001</p>
      <p><b>Kelas:</b> IX-A</p>
      <p><b>Email:</b> andi.pratama@student.smpn5tsg.sch.id</p>
    `)}
  `;
}

function addClass() {
  const kelas = prompt('Masukkan nama kelas, contoh IX-B');
  if (kelas && kelas.trim()) {
    state.classes.push([kelas.trim(), '0']);
    saveState();
    render();
  }
}

function addSubject() {
  const nama = prompt('Masukkan nama mata pelajaran');
  if (nama && nama.trim()) {
    state.subjects.push(nama.trim());
    saveState();
    render();
  }
}

function addStudent() {
  const nama = prompt('Nama siswa');
  const nis = prompt('NIS');
  const kelas = prompt('Kelas');

  if (nama && nis && kelas) {
    state.students.push([nama.trim(), nis.trim(), kelas.trim()]);
    saveState();
    render();
  }
}

function addLink() {
  const kelas = prompt('Kelas, contoh IX-A');
  const mapel = prompt('Mata pelajaran');
  const title = prompt('Judul ulangan');
  const url = prompt('Link Google Forms');

  if (kelas && mapel && title && url) {
    state.links.push([kelas.trim(), mapel.trim(), title.trim(), 'Draft', url.trim()]);
    saveState();
    render();
  }
}

function downloadCSV() {
  const rows = [
    ['Nama', 'Kelas', 'Mata Pelajaran', 'Status', 'Nilai'],
    ...state.statuses
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'rekap-nilai-smpn5tsg.csv';
  link.click();
}

function render() {
  const route = {
    dashboard,
    classes,
    subjects,
    students,
    links: linksPage,
    status: statusPage,
    reports,
    exams,
    scores,
    profile
  };

  const content = route[state.view]?.() || dashboard();
  document.getElementById('app').innerHTML = shell(content);
}

function renderLogin() {
  document.getElementById('app').innerHTML = `
    <main class="login">
      <section class="card login-card">
        <div class="logo">S</div>
        <h1>SMPN5TSG</h1>
        <p class="muted">Sistem Ulangan Online</p>

        <label class="field">Email atau akun Google</label>
        <input id="email" placeholder="contoh@belajar.id" />

        <label class="field">Masuk sebagai</label>
        <select id="role">
          <option>Admin</option>
          <option>Guru</option>
          <option>Siswa</option>
        </select>

        <button class="btn primary" onclick="login()">Masuk ke Aplikasi</button>
        <p class="muted">Versi demo — data tersimpan di browser perangkat ini</p>
      </section>
    </main>
  `;
}

loadState();
renderLogin();
