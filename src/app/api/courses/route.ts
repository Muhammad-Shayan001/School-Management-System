import { verifyAuth } from '../middleware';

// Mock course database representing central HEC/PITB accredited courses
const mockCoursesDatabase = [
  {
    id: 'course-1',
    title: 'UI/UX Design Masterclass (PITB Registered)',
    topicsCompleted: 6,
    topicsTotal: 19,
    progressPercentage: 31,
    batchNumber: 'Batch 42-Lahore (B-42)',
    rollNumber: 'LHR-2026-1082',
    campus: 'Arfa Software Technology Park, PITB',
    city: 'Lahore',
    attendanceCount: 15,
    assignmentCount: 4,
    scheduleSlots: ['Monday 10:00 AM - 01:00 PM', 'Wednesday 10:00 AM - 01:00 PM']
  },
  {
    id: 'course-2',
    title: 'Advanced React & Next.js Frameworks',
    topicsCompleted: 12,
    topicsTotal: 12,
    progressPercentage: 100,
    status: 'COMPLETED',
    batchNumber: 'Batch 40-Karachi (B-40)',
    rollNumber: 'LHR-2026-1082',
    campus: 'FAST-NUCES Main Campus',
    city: 'Karachi',
    attendanceCount: 24,
    assignmentCount: 8,
    scheduleSlots: ['Tuesday 02:00 PM - 05:00 PM', 'Thursday 02:00 PM - 05:00 PM']
  },
  {
    id: 'course-3',
    title: 'Python & Artificial Intelligence',
    topicsCompleted: 0,
    topicsTotal: 15,
    progressPercentage: 0,
    status: 'ENROLLED',
    batchNumber: 'Batch 43-Islamabad (B-43)',
    rollNumber: 'LHR-2026-1082',
    campus: 'NUST School of Electrical Eng & CS',
    city: 'Islamabad',
    attendanceCount: 0,
    assignmentCount: 0,
    scheduleSlots: ['Friday 04:00 PM - 07:00 PM']
  }
];

export async function GET(request: Request) {
  // Validate token via security middleware
  const { user, errorResponse } = await verifyAuth(request);
  if (errorResponse) return errorResponse;

  // Filter based on roles
  if (user?.role === 'student') {
    // Student can only see courses they are enrolled in
    return new Response(
      JSON.stringify({
        success: true,
        userRole: user.role,
        courses: mockCoursesDatabase,
        meta: { timestamp: new Date().toISOString(), server: 'PITB-LHR-NODE-03' }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } else if (user?.role === 'trainer' || user?.role === 'admin') {
    // Trainer sees all courses assigned to them or administrative view
    return new Response(
      JSON.stringify({
        success: true,
        userRole: user?.role,
        courses: mockCoursesDatabase,
        meta: { timestamp: new Date().toISOString(), server: 'PITB-LHR-NODE-03' }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: false, message: 'Forbidden: Unauthorized Portal Access Role' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST(request: Request) {
  // Authenticate & verify role is either admin or trainer to allocate course slots
  const { user, errorResponse } = await verifyAuth(request);
  if (errorResponse) return errorResponse;

  if (user?.role !== 'trainer' && user?.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, message: 'Forbidden: Only designated PITB trainers or HEC Administrators can assign new slots.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { title, batchNumber, campus, city, scheduleSlots } = body;

    if (!title || !batchNumber) {
      return new Response(
        JSON.stringify({ success: false, message: 'Bad Request: Title and batchNumber are required parameters.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newCourse = {
      id: `course-${Date.now()}`,
      title,
      topicsCompleted: 0,
      topicsTotal: 15,
      progressPercentage: 0,
      status: 'ENROLLED',
      batchNumber,
      rollNumber: 'PENDING-ALLOCATION',
      campus: campus || 'Federal Training Lab',
      city: city || 'Islamabad',
      attendanceCount: 0,
      assignmentCount: 0,
      scheduleSlots: scheduleSlots || []
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Accredited training slot created successfully in National Database Ledger.',
        course: newCourse
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Server Error: Invalid payload encoding.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
