import { verifyAuth } from '../../middleware';
import { createQuizAttempt, getQuizAttempts } from '../../../../lib/supabaseClient';

export async function GET(request: Request) {
  const { user, errorResponse } = await verifyAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId') || '';

    // Trainers can request all attempts; students only their attempts
    const role = user?.role === 'trainer' ? 'trainer' : 'student';
    const attempts = await getQuizAttempts(role as any, quizId);

    return new Response(JSON.stringify({ success: true, attempts }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message || 'Failed to fetch attempts.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST(request: Request) {
  const { user, errorResponse } = await verifyAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();

    // Students submit attempts; trainers/admins may also submit on behalf
    if (!body || !body.quizId || !body.studentId || !Array.isArray(body.answers)) {
      return new Response(JSON.stringify({ success: false, message: 'Bad Request: Missing required fields.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const role = user?.role === 'trainer' ? 'trainer' : 'student';
    const attempt = await createQuizAttempt(role as any, {
      quizId: body.quizId,
      studentId: body.studentId,
      studentName: body.studentName,
      answers: body.answers,
      score: Number(body.score || 0),
      totalPoints: Number(body.totalPoints || 0)
    });

    return new Response(JSON.stringify({ success: true, attempt }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message || 'Failed to submit attempt.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
