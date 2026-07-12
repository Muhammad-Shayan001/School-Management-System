import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const QR_SECRET = process.env.QR_TOKEN_SECRET || process.env.VITE_QR_TOKEN_SECRET || 'demo-insecure-secret';

function base64Url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB = base64Url(JSON.stringify(header));
  const payloadB = base64Url(JSON.stringify(payload));
  const toSign = `${headerB}.${payloadB}`;
  const sig = crypto.createHmac('sha256', secret).update(toSign).digest();
  const sigB = base64Url(sig);
  return `${toSign}.${sigB}`;
}

function verifyJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB, payloadB, sigB] = parts;
    const toSign = `${headerB}.${payloadB}`;
    const expected = base64Url(crypto.createHmac('sha256', secret).update(toSign).digest());
    if (expected !== sigB) return null;
    const payload = JSON.parse(Buffer.from(payloadB.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    return payload;
  } catch (e) {
    return null;
  }
}

const demo = { sessions: [], records: [] };

app.get('/api/attendance/qr', (req, res) => {
  const studentId = req.query.studentId;
  if (!studentId) return res.status(400).json({ success: false, message: 'Missing studentId' });
  const payload = { uid: String(studentId), iat: Math.floor(Date.now() / 1000) };
  const token = signJwt(payload, QR_SECRET);
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(token)}`;
  return res.json({ success: true, token, qrUrl });
});

app.post('/api/attendance/sessions', (req, res) => {
  const body = req.body || {};
  if (!body.id || !body.class_id || !body.date) return res.status(400).json({ success: false, message: 'Missing fields' });
  demo.sessions.push({ ...body, status: 'OPEN', started_at: new Date().toISOString() });
  return res.status(201).json({ success: true, session: body });
});

app.post('/api/attendance/sessions/scan', (req, res) => {
  const { sessionId, token, scannedBy } = req.body || {};
  if (!sessionId || !token) return res.status(400).json({ success: false, message: 'Missing sessionId or token' });

  // Accept SCHOOL-QR|UID|... or signed JWT
  let uid = null;
  if (typeof token === 'string' && token.startsWith('SCHOOL-QR|')) {
    const parts = token.split('|');
    uid = parts[1] || null;
  } else {
    const parsed = verifyJwt(String(token), QR_SECRET);
    uid = parsed?.uid || null;
  }

  if (!uid) return res.status(400).json({ success: false, message: 'Invalid token' });

  const record = { id: `rec-${Math.random().toString(36).slice(2,9)}`, session_id: sessionId, student_id: uid, status: 'Present', marked_at: new Date().toISOString(), marked_by: scannedBy || 'trainer' };
  const exists = demo.records.find(r => r.session_id === sessionId && r.student_id === uid);
  if (!exists) demo.records.push(record);
  return res.json({ success: true, record });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Dev API server listening on http://localhost:${port}`));

// no export needed for dev server
