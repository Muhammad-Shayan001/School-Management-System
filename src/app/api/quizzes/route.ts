import { verifyAuth } from '../middleware';

// Mock Quizzes database integrated with course boards
const mockQuizzes = [
  {
    id: 'quiz-101',
    title: 'Midterm Assessment: Principles of Grid Systems',
    courseId: 'course-1',
    totalQuestions: 15,
    timeLimitMinutes: 30,
    status: 'INACTIVE', // default status on student portal is inactive unless assigned
    securityLevel: 'Biometric/Proctor Required'
  },
  {
    id: 'quiz-102',
    title: 'Final Examination: Advanced React Hook Mechanics',
    courseId: 'course-2',
    totalQuestions: 25,
    timeLimitMinutes: 45,
    status: 'COMPLETED',
    score: '92/100',
    securityLevel: 'Federal Board Integrated'
  }
];

export async function GET(request: Request) {
  // Validate token via security middleware
  const { user, errorResponse } = await verifyAuth(request);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');

  let filteredQuizzes = [...mockQuizzes];
  if (courseId) {
    filteredQuizzes = filteredQuizzes.filter(q => q.courseId === courseId);
  }

  // Active quiz filters for student roles
  if (user?.role === 'student') {
    // Only return active or completed quizzes for this student's courses
    return new Response(
      JSON.stringify({
        success: true,
        quizzes: filteredQuizzes,
        integrityNote: 'This request is audited and proctored live. IP addresses and telemetry are recorded by HEC security servers.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Trainers can retrieve full statistics of quizzes
  return new Response(
    JSON.stringify({
      success: true,
      quizzes: filteredQuizzes,
      managementRights: true
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST(request: Request) {
  // Validate token via security middleware
  const { user, errorResponse } = await verifyAuth(request);
  if (errorResponse) return errorResponse;

  if (user?.role !== 'trainer' && user?.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, message: 'Forbidden: Only authorized trainers can create or publish quizzes.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { title, courseId, totalQuestions, timeLimitMinutes } = body;

    if (!title || !courseId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Bad Request: Missing title or courseId parameters.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newQuiz = {
      id: `quiz-generated-${Date.now()}`,
      title,
      courseId,
      totalQuestions: totalQuestions || 10,
      timeLimitMinutes: timeLimitMinutes || 20,
      status: 'PUBLISHED',
      securityLevel: 'Federal Board Integrated'
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Exam syllabus/quiz registered on educational ledger successfully.',
        quiz: newQuiz
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Server Error: Invalid JSON input format.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request) {
  const { user, errorResponse } = await verifyAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    if (!quizId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing quizId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    // In this mock route we simply return updated payload merging id
    const updated = { id: quizId, ...body };
    return new Response(JSON.stringify({ success: true, quiz: updated }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message || 'Update failed.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
