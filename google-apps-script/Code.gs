const SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_ROLE_KEY');
const SHEET_NAME = 'Form Responses 1';

function onFormSubmit(event) {
  const values = event.namedValues || {};
  const email = first(values, 'Email', 'EMAIL', 'Alamat email');
  const nis = first(values, 'NIS', 'nis');
  const score = first(values, 'Nilai', 'NILAI', 'Score');
  const examLinkId = first(values, 'exam_link_id', 'EXAM_LINK_ID');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Script Properties belum diatur.');
  if (!examLinkId || (!email && !nis)) throw new Error('Baris Forms belum memiliki exam_link_id dan email/NIS.');

  const student = findStudent(email, nis);
  if (!student) throw new Error('Siswa tidak ditemukan.');

  const payload = {
    student_id: student.id,
    exam_link_id: examLinkId,
    score: score === '' ? null : Number(score),
    status: score === '' ? 'submitted' : 'graded'
  };

  request('/rest/v1/exam_results?on_conflict=student_id,exam_link_id', 'post', payload, { Prefer: 'resolution=merge-duplicates' });
}

function findStudent(email, nis) {
  const filters = [];
  if (email) filters.push('email.eq.' + encodeURIComponent(email));
  if (nis) filters.push('nis.eq.' + encodeURIComponent(nis));
  for (const filter of filters) {
    const rows = request('/rest/v1/students?select=id,nis,profiles!inner(email)&' + filter, 'get');
    if (rows && rows.length) return rows[0];
  }
  return null;
}

function request(path, method, body, extraHeaders) {
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

function first(values) {
  for (let i = 1; i < arguments.length; i++) {
    const value = values[arguments[i]];
    if (value && value[0]) return value[0].trim();
  }
  return '';
}
