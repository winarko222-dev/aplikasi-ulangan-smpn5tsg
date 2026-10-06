(function () {
  function getAppState() {
    return window.SMPN5TSGApp?.state || null;
  }

  function getClient() {
    return window.SMPN5TSGAuth?.state?.client || null;
  }

  function generatePassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i += 1) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  function parseCsv(text) {
    const lines = String(text || '').split(/\r?\n/).filter(line => line.trim());
    const rows = [];

    for (const line of lines) {
      const cells = line.split(',').map(value => value.trim());
      if (cells.length < 3 || !cells[0]) continue;
      rows.push({ nama: cells[0], nisn: cells[1], kelas: cells[2] });
    }

    return rows;
  }

  function validateDuplicateNisn(rows) {
    const seen = new Set();
    const dupes = [];

    rows.forEach(row => {
      const nisn = String(row.nisn || '').trim();
      if (!nisn) return;
      if (seen.has(nisn)) dupes.push(nisn);
      seen.add(nisn);
    });

    return [...new Set(dupes)];
  }

  async function importSiswaFromCsv() {
    const state = getAppState();
    const client = getClient();

    if (!state || !state.user) {
      alert('Sesi login belum aktif. Silakan login ulang sebagai Admin.');
      return;
    }

    if (state.role !== 'admin') {
      alert('Hanya Admin yang dapat mengimport siswa.');
      return;
    }

    if (!client) {
      alert('Supabase belum aktif. Pastikan config.js dan auth.js sudah dimuat.');
      return;
    }

    if (!state.classes?.length) {
      alert('Belum ada kelas yang dibuat. Buat kelas dulu sebelum import siswa.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.style.display = 'none';

    input.onchange = async (event) => {
      const file = event.target?.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const rows = parseCsv(text);

        if (!rows.length) {
          alert('File CSV tidak valid. Format yang benar: Nama,NISN,Kelas');
          return;
        }

        const dupes = validateDuplicateNisn(rows);
        if (dupes.length) {
          alert('NISN duplikat ditemukan: ' + dupes.join(', '));
          return;
        }

        const results = [];
        let successCount = 0;
        let failedCount = 0;

        for (const row of rows) {
          const klass = state.classes.find(c => String(c.class_name || '').trim().toLowerCase() === String(row.kelas || '').trim().toLowerCase());
          if (!klass) {
            results.push({ nama: row.nama, nisn: row.nisn, status: 'GAGAL: kelas tidak ditemukan' });
            failedCount += 1;
            continue;
          }

          const email = `${String(row.nisn).trim()}@siswa.smpn5tsg.id`;
          const password = generatePassword();

          try {
            const payload = {
              full_name: row.nama,
              email,
              password,
              nis: String(row.nisn).trim(),
              class_id: klass.id
            };

            const { data, error } = await client.functions.invoke('admin-create-student', { body: payload });

            if (error || data?.error) {
              const message = data?.error || error?.message || 'gagal dibuat';
              results.push({ nama: row.nama, nisn: row.nisn, status: `GAGAL: ${message}` });
              failedCount += 1;
            } else {
              localStorage.setItem(`smpn5tsg-password-changed:${String(row.nisn).trim()}`, '0');
              results.push({ nama: row.nama, nisn: row.nisn, email, password, status: 'BERHASIL' });
              successCount += 1;
            }
          } catch (err) {
            results.push({ nama: row.nama, nisn: row.nisn, status: `ERROR: ${err?.message || 'tidak diketahui'}` });
            failedCount += 1;
          }
        }

        alert(`Import selesai.\nBerhasil: ${successCount}\nGagal: ${failedCount}`);

        const exportRows = [
          ['Nama', 'NISN', 'Email', 'Password', 'Status'],
          ...results.map(item => [item.nama, item.nisn, item.email || '-', item.password || '-', item.status])
        ];

        const csvText = exportRows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([`\ufeff${csvText}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `import-siswa-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        if (window.SMPN5TSGApp?.refreshData) {
          await window.SMPN5TSGApp.refreshData();
        }
        if (window.SMPN5TSGApp?.render) {
          window.SMPN5TSGApp.render();
        }
      } catch (error) {
        console.error('Import CSV error:', error);
        alert(error?.message || 'Gagal membaca file CSV.');
      }
    };

    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 1000);
  }

  window.importSiswaFromCsv = importSiswaFromCsv;
  window.SMPN5TSGImport = { importSiswaFromCsv };
})();
