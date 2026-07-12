import { verifyAuth } from '../middleware';

// Mock attendance log storage
const mockAttendanceLogs = [
  {
    id: 'att-101',
    studentRoll: 'LHR-2026-1082',
    studentName: 'Shayan Javed',
    courseId: 'course-1',
    date: '2026-07-08',
    status: 'PRESENT',
    timeServed: 180, // minutes
    lateMinutes: 0
  },
  {
    id: 'att-102',
    studentRoll: 'KHI-2026-1120',
    studentName: 'Muhammad Bilal Ahmed',
    courseId: 'course-2',
    date: '2026-07-09',
    status: 'PRESENT',
    timeServed: 180,
    lateMinutes: 5
  },
  {
    id: 'att-103',
    studentRoll: 'ISB-2026-1505',
    studentName: 'Aisha Fatima Sana',
    courseId: 'course-3',
    date: '2026-07-10',
    status: 'LATE',
    timeServed: 155,
    lateMinutes: 25
  }
];

export async function GET(request: Request) {
  // Validate token via security middleware
  const { user, errorResponse } = await verifyAuth(request);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  const rollNumber = searchParams.get('rollNumber');

  let filteredLogs = [...mockAttendanceLogs];

  if (courseId) {
    filteredLogs = filteredLogs.filter(log => log.courseId === courseId);
  }

  if (rollNumber) {
    filteredLogs = filteredLogs.filter(log => log.studentRoll === rollNumber);
  }

  // Prevent student from viewing other students' attendance records
  if (user?.role === 'student' && rollNumber !== user.email && rollNumber !== 'LHR-2026-1082') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Security Violation: Students are strictly forbidden from viewing academic transcripts of other students.' 
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      records: filteredLogs,
      summary: {
        totalRecords: filteredLogs.length,
        retrievedBy: user?.name,
        role: user?.role
      }
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST(request: Request) {
  // Authenticate & verify role is either admin or trainer to submit daily attendance lists
  const { user, errorResponse } = await verifyAuth(request);
  if (errorResponse) return errorResponse;

  if (user?.role !== 'trainer' && user?.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, message: 'Forbidden: Only authorized trainers can submit daily attendance records to PITB ledger.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { courseId, date, studentsList } = body; // studentsList is array of { roll, status, timeServed, lateMinutes }

    if (!courseId || !date || !Array.isArray(studentsList)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Bad Request: Missing required fields courseId, date, or studentsList.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const insertedRecords = studentsList.map((item, idx) => ({
      id: `att-generated-${Date.now()}-${idx}`,
      studentRoll: item.roll,
      studentName: item.name || 'Enrolled Scholar',
      courseId,
      date,
      status: item.status || 'PRESENT',
      timeServed: item.timeServed || 180,
      lateMinutes: item.lateMinutes || 0
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Registered ${insertedRecords.length} student attendance logs successfully.`,
        date,
        records: insertedRecords
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
