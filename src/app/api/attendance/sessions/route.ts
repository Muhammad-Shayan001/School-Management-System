import { NextRequest } from 'next/server';
import { createAttendanceSession } from '../../../../lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.id || !body.class_id || !body.date) {
      return new Response(JSON.stringify({ success: false, message: 'Missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const session = await createAttendanceSession(body);
    return new Response(JSON.stringify({ success: true, session }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
