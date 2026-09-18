const SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_ROLE_KEY');

function onFormSubmit(event) {
  if (!event || !event.namedValues) throw new Error('Jalankan melalui trigger On form submit, bukan tombol Run.');
  assertConfig_();

  const values = event.namedValues;
  const email = first_(values, 'Email', 'EMAIL', 'Alamat email');
  const nis = first_(values, 'NIS', 'nis');
  const scoreText = first_(values, 'Nilai', 'NILAI', 'Score');
  const examLinkId = first_(values, 'exam_link_id', 'EXAM_LINK_ID');
  if (!examLinkId || (!email && !nis)) throw new Error('Form wajib memiliki exam_link_id dan Email atau NIS.');

  const student = findStudent_(email, nis);
  if (!student) throw new Error('Siswa tidak ditemukan berdasarkan Email/NIS.');

  const score = scoreText === '' ? null : Number(String(scoreText).replace(',', '.'));
  if (scoreText !== '' && (!Number.isFinite(score) || score < 0 || score > 100)) {
    throw new Error('Nilai harus berupa angka 0 sampai 100.');
  }

  upsertResult_({
    student_id: student.id,
    exam_link_id: examLinkId,
    score: score,
    status: score === null ? 'submitted' : 'graded',
    submitted_at: new Date().toISOString(),
    graded_at: score === null ? null : new Date().toISOString()
  });
}

function findStudent_(email, nis) {
  if (nis) {
    const rows = request_('/rest/v1/students?select=id,nis&nis=eq.' + encodeURIComponent(nis), 'get');
    if (rows && rows.length) return rows[0];
  }
  if (email) {
    const rows = request_('/rest/v1/students?select=id,nis,profiles!inner(email)&profiles.email=eq.' + encodeURIComponent(email), 'get');
    if (rows && rows.length) return rows[0];
  }
  return null;
}

function upsertResult_(payload) {
  request_('/rest/v1/exam_results?on_conflict=student_id,exam_link_id', 'post', payload, {
    Prefer: 'resolution=merge-duplicates,return=minimal'
  });
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'smpn5tsg-sync' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function assertConfig_() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Atur SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY pada Script Properties.');
  }
}

function request_(path, method, body, extraHeaders) {
  const options = {
    method: method.toUpperCase(),
    headers: Object.assign({
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json'
    }, extraHeaders || {}),
    muteHttpExceptions: true
  };
  if (body) options.payload = JSON.stringify(body);
  const response = UrlFetchApp.fetch(SUPABASE_URL + path, options);
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) throw new Error(code + ': ' + response.getContentText());
  return response.getContentText() ? JSON.parse(response.getContentText()) : null;
}

function first_(values) {
  for (let i = 1; i < arguments.length; i++) {
    const value = values[arguments[i]];
    if (value && value[0]) return String(value[0]).trim();
  }
  return '';
}
