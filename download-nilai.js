/* Download nilai siswa untuk Admin dan Guru. */
(function () {
  const state = () => window.SMPN5TSGApp?.state;
  const db = () => window.SMPN5TSGAuth?.state?.client;

  function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  function downloadCsv(rows) {
    const headers = ['Nama Siswa', 'NIS', 'Email', 'Ulangan', 'Nilai', 'Status', 'Waktu Mengumpulkan'];
    const lines = [headers, ...rows.map(row => [
      row.student?.profiles?.full_name || '-',
      row.student?.nis || '-',
      row.student?.profiles?.email || '-',
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

  async function downloadStudentScores() {
    const current = state();
    const client = db();
    if (!current?.user || !client) return alert('Sesi Supabase tidak aktif. Silakan login ulang.');
    if (!['admin', 'guru'].includes(current.role)) return alert('Hanya Admin dan Guru yang dapat mengunduh nilai.');

    const button = document.querySelector('[data-download-scores]');
    if (button) { button.disabled = true; button.textContent = 'Memuat...'; }

    try {
      const { data, error } = await client
        .from('exam_results')
        .select('score,status,submitted_at,students(nis,profiles(full_name,email)),exam_links(title,class_id,subject_id)')
        .in('status', ['submitted', 'graded'])
        .order('submitted_at', { ascending: false });
      if (error) throw error;

      const rows = (data || []).map(item => ({
        student: item.students,
        exam: item.exam_links,
        score: item.score,
        status: item.status,
        submitted_at: item.submitted_at
      }));

      if (!rows.length) return alert('Belum ada siswa yang mengerjakan ulangan.');
      downloadCsv(rows);
    } catch (error) {
      alert(error?.message || 'Gagal mengambil daftar nilai. Pastikan policy exam_results mengizinkan Admin/Guru membaca nilai.');
    } finally {
      if (button) { button.disabled = false; button.textContent = '⬇ Download Nilai'; }
    }
  }

  function addButton() {
    const current = state();
    if (!current?.user || !['admin', 'guru'].includes(current.role)) return;
    if (document.querySelector('[data-download-scores]')) return;

    const heads = document.querySelectorAll('.page-head');
    if (!heads.length) return;
    const button = document.createElement('button');
    button.className = 'btn primary small';
    button.dataset.downloadScores = 'true';
    button.textContent = '⬇ Download Nilai';
    button.addEventListener('click', downloadStudentScores);
    heads[0].appendChild(button);
  }

  const observer = new MutationObserver(addButton);
  observer.observe(document.body, { childList: true, subtree: true });
  window.downloadStudentScores = downloadStudentScores;
  setTimeout(addButton, 0);
})();
