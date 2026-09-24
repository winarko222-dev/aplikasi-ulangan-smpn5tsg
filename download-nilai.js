/* Download dan ekspor nilai siswa untuk Admin & Guru. */
(function () {
  const state = () => window.SMPN5TSGApp?.state;
  const db = () => window.SMPN5TSGAuth?.state?.client;

  function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  function getCurrentFilters() {
    const selClass = document.querySelector('[data-score-filter-class]')?.value || 'all';
    const selSubject = document.querySelector('[data-score-filter-subject]')?.value || 'all';
    return { selClass, selSubject };
  }

  function prepareRows(data, filters) {
    return (data || []).filter(item => {
      const exam = item.exam_links || {};
      const classMatch = filters.selClass === 'all' || exam.class_id === filters.selClass;
      const subjectMatch = filters.selSubject === 'all' || exam.subject_id === filters.selSubject;
      return classMatch && subjectMatch;
    }).map(item => ({
      student: item.students,
      exam: item.exam_links,
      score: item.score,
      status: item.status,
      submitted_at: item.submitted_at
    }));
  }

  function downloadCsv(rows) {
    const headers = ['Nama Siswa', 'NIS', 'Email', 'Kelas', 'Mapel', 'Ulangan', 'Nilai', 'Status', 'Waktu Mengumpulkan'];
    const lines = [headers, ...rows.map(row => [
      row.student?.profiles?.full_name || '-',
      row.student?.nis || '-',
      row.student?.profiles?.email || '-',
      row.exam?.classes?.class_name || '-',
      row.exam?.subjects?.name || '-',
      row.exam?.title || '-',
      row.score ?? '-',
      row.status || '-',
      row.submitted_at ? new Date(row.submitted_at).toLocaleString('id-ID') : '-'
    ])].map(line => line.map(csvCell).join(','));

    const blob = new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daftar-nilai-siswa-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function printPdf(rows) {
    const html = `
      <html>
        <head>
          <title>Daftar Nilai Siswa</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2d3d; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d9e2ec; padding: 8px 10px; text-align: left; font-size: 12px; }
            th { background: #edf3ff; }
            h2 { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <h2>Daftar Nilai Siswa</h2>
          <table>
            <thead>
              <tr>
                <th>Nama Siswa</th>
                <th>NIS</th>
                <th>Email</th>
                <th>Kelas</th>
                <th>Mapel</th>
                <th>Ulangan</th>
                <th>Nilai</th>
                <th>Status</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  <td>${row.student?.profiles?.full_name || '-'}</td>
                  <td>${row.student?.nis || '-'}</td>
                  <td>${row.student?.profiles?.email || '-'}</td>
                  <td>${row.exam?.classes?.class_name || '-'}</td>
                  <td>${row.exam?.subjects?.name || '-'}</td>
                  <td>${row.exam?.title || '-'}</td>
                  <td>${row.score ?? '-'}</td>
                  <td>${row.status || '-'}</td>
                  <td>${row.submitted_at ? new Date(row.submitted_at).toLocaleString('id-ID') : '-'}</td>
                </tr>
              `).join('') || '<tr><td colspan="9">Tidak ada data.</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Pop-up diblokir. Izinkan pop-up untuk mencetak PDF.');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function fetchScores() {
    const client = db();
    const current = state();
    if (!current?.user || !client) return [];
    if (!['admin', 'guru'].includes(current.role)) return [];

    const { data, error } = await client
      .from('exam_results')
      .select('id, score, status, submitted_at, students(id, nis, class_id, profiles(full_name,email)), exam_links(id, title, class_id, subject_id, classes(class_name), subjects(name))')
      .in('status', ['submitted', 'graded'])
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async function exportScores(type) {
    const current = state();
    const client = db();
    if (!current?.user || !client) return alert('Sesi Supabase tidak aktif. Silakan login ulang.');
    if (!['admin', 'guru'].includes(current.role)) return alert('Hanya Admin dan Guru yang dapat mengunduh nilai.');

    try {
      const filters = getCurrentFilters();
      const data = await fetchScores();
      const rows = prepareRows(data, filters);
      if (!rows.length) return alert('Belum ada siswa yang mengerjakan ulangan dengan filter yang dipilih.');
      if (type === 'csv') return downloadCsv(rows);
      return printPdf(rows);
    } catch (error) {
      alert(error?.message || 'Gagal mengambil data nilai.');
    }
  }

  function addControls() {
    const current = state();
    if (!current?.user || !['admin', 'guru'].includes(current.role)) return;

    const existing = document.querySelector('[data-score-export-root]');
    if (existing) return;

    const heads = document.querySelectorAll('.page-head');
    if (!heads.length) return;

    const root = document.createElement('div');
    root.dataset.scoreExportRoot = 'true';
    root.style.display = 'flex';
    root.style.gap = '12px';
    root.style.alignItems = 'center';
    root.style.flexWrap = 'wrap';
    root.style.marginTop = '12px';

    const classSelect = document.createElement('select');
    classSelect.dataset.scoreFilterClass = 'true';
    classSelect.style.minWidth = '180px';
    classSelect.innerHTML = `<option value="all">Semua Kelas</option>${(state().classes || []).map(c => `<option value="${c.id}">${c.class_name}</option>`).join('')}`;

    const subjectSelect = document.createElement('select');
    subjectSelect.dataset.scoreFilterSubject = 'true';
    subjectSelect.style.minWidth = '180px';
    subjectSelect.innerHTML = `<option value="all">Semua Mapel</option>${(state().subjects || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('')}`;

    const csvBtn = document.createElement('button');
    csvBtn.className = 'btn primary small';
    csvBtn.textContent = '⬇ CSV';
    csvBtn.onclick = () => exportScores('csv');

    const pdfBtn = document.createElement('button');
    pdfBtn.className = 'btn secondary small';
    pdfBtn.textContent = '🖨 PDF';
    pdfBtn.onclick = () => exportScores('pdf');

    root.appendChild(classSelect);
    root.appendChild(subjectSelect);
    root.appendChild(csvBtn);
    root.appendChild(pdfBtn);

    heads[0].appendChild(root);
  }

  const observer = new MutationObserver(() => addControls());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(addControls, 0);
  window.exportStudentScores = exportScores;
})();
