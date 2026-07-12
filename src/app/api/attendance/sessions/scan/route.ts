import { scanAttendanceToken } from '../../../../../lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, token, scannedBy } = body || {};
    if (!sessionId || !token) return new Response(JSON.stringify({ success: false, message: 'Missing sessionId or token' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const rec = await scanAttendanceToken(sessionId, token, scannedBy);
    return new Response(JSON.stringify({ success: true, record: rec }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
