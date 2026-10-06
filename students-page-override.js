function studentsPage() {
  const state = window.SMPN5TSGApp?.state;
  if (!state) return '';

  const canImport = state.role === 'admin';
  const rows = state.students.map(s => `<tr><td>${esc(s.profiles?.full_name || '-')}</td><td>${esc(s.nis || '-')}</td><td>${esc(state.classes.find(c => c.id === s.class_id)?.class_name || '-')}</td><td>${esc(s.profiles?.email || '-')}</td></tr>`).join('');

  return `
    <div class="page-head">
      <h1>Siswa</h1>
      ${canImport ? `<button class="btn primary small" onclick="importSiswaFromCsv()">📥 Import Siswa (CSV)</button>` : ''}
    </div>
    <section class="card">
      <h2>Daftar siswa</h2>
      ${canImport ? `<p class="notice"><strong>Cara import:</strong> Siapkan file CSV dengan kolom: Nama, NISN, Kelas. Contoh:<br/><code>Budi Santoso,12345678,VII-A<br/>Siti Nurhaliza,12345679,VII-A</code></p>` : ''}
      <div class="table-wrap">
        <table class="table">
          <tr><th>Nama</th><th>NISN</th><th>Kelas</th><th>Email</th></tr>
          ${rows || '<tr><td colspan="4">Belum ada siswa.</td></tr>'}
        </table>
      </div>
    </section>
  `;
}
