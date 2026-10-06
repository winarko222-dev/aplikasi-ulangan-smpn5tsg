/* Import siswa dari CSV untuk Admin. */
(function () {
  const state = () => window.SMPN5TSGApp?.state;
  const db = () => window.SMPN5TSGAuth?.state?.client;

  function generatePassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  function parseCsv(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length < 3 || !parts[0]) continue;
      rows.push({
        nama: parts[0],
        nisn: parts[1],
        kelas: parts[2]
      });
    }
    return rows;
  }

  async function importSiswaFromCsv() {
    const current = state();
    const client = db();

    if (!current?.user || !client) return alert('Sesi Supabase tidak aktif.');
    if (current.role !== 'admin') return alert('Hanya Admin yang bisa import siswa.');
    if (!current.classes.length) return alert('Buat kelas terlebih dahulu.');

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      const rows = parseCsv(text);

      if (!rows.length) return alert('File CSV tidak valid. Format: Nama, NISN, Kelas');

      const results = [];
      let success = 0;
      let failed = 0;

      for (const row of rows) {
        const klass = current.classes.find(c => c.class_name.toLowerCase() === row.kelas.toLowerCase());
        if (!klass) {
          results.push({ nama: row.nama, nisn: row.nisn, status: 'GAGAL: Kelas tidak ditemukan' });
          failed++;
          continue;
        }

        const email = `${row.nisn}@siswa.smpn5tsg.id`;
        const password = generatePassword();

        try {
          const { data, error } = await client.functions.invoke('admin-create-student', {
            body: {
              full_name: row.nama,
              email: email,
              password: password,
              nis: row.nisn,
              class_id: klass.id
            }
          });

          if (error || data?.error) {
            results.push({ nama: row.nama, nisn: row.nisn, status: 'GAGAL: ' + (data?.error || error?.message) });
            failed++;
          } else {
            results.push({ nama: row.nama, nisn: row.nisn, email: email, password: password, status: 'BERHASIL' });
            success++;
          }
        } catch (err) {
          results.push({ nama: row.nama, nisn: row.nisn, status: 'ERROR: ' + err.message });
          failed++;
        }
      }

      alert(`Import selesai.\nBerhasil: ${success}\nGagal: ${failed}`);

      // Download hasil
      const headers = ['Nama', 'NISN', 'Email', 'Password', 'Status'];
      const lines = [headers, ...results.map(r => [
        r.nama,
        r.nisn,
        r.email || '-',
        r.password || '-',
        r.status
      ])].map(line => line.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));

      const blob = new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `import-siswa-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      await window.SMPN5TSGApp.refreshData();
      window.SMPN5TSGApp.render();
    };
    input.click();
  }

  window.importSiswaFromCsv = importSiswaFromCsv;
})();
