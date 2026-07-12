import crypto from 'crypto';
import { getStudentQrToken } from '../../../../lib/supabaseClient';

function base64Url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJwt(payload: object, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB = base64Url(JSON.stringify(header));
  const payloadB = base64Url(JSON.stringify(payload));
  const toSign = `${headerB}.${payloadB}`;
  const sig = crypto.createHmac('sha256', secret).update(toSign).digest();
  const sigB = base64Url(sig);
  return `${toSign}.${sigB}`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId') || undefined;

    if (!studentId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing studentId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const secret = process.env.QR_TOKEN_SECRET || 'demo-insecure-secret';
    // If we have a supabase helper, use it so the token is persisted in DB
    try {
      const studentData = await getStudentQrToken(studentId);
      return new Response(JSON.stringify({ success: true, token: studentData.jwt || studentData.jwt_token, qrUrl: studentData.qrUrl || studentData.qrUrl }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      const payload = { uid: studentId, iat: Math.floor(Date.now() / 1000) };
      const token = signJwt(payload, secret);
      const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(token)}`;
      return new Response(JSON.stringify({ success: true, token, qrUrl }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
