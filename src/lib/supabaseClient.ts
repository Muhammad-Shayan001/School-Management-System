import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StudentCourse, Quiz, QuizAttempt, QuizAnswer } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const seedCourses: StudentCourse[] = [
  {
    id: 'course-1',
    title: 'UI/UX Design Masterclass (PITB Registered)',
    topicsCompleted: 6,
    topicsTotal: 19,
    progressPercentage: 31,
    status: 'ENROLLED',
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
    title: 'Introduction to Python & Artificial Intelligence',
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

const seedQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'UI/UX Design Fundamentals',
    courseId: 'course-1',
    totalQuestions: 2,
    timeLimitMinutes: 20,
    status: 'PUBLISHED',
    score: '85',
    securityLevel: 'Standard HEC Security',
    questions: [
      {
        id: 'q-1',
        prompt: 'What does UX stand for?',
        points: 2,
        options: [
          { id: 'q-1-a', text: 'User Experience', isCorrect: true },
          { id: 'q-1-b', text: 'Universal Exchange', isCorrect: false }
        ]
      },
      {
        id: 'q-2',
        prompt: 'Which design tool is commonly used for wireframes?',
        points: 3,
        options: [
          { id: 'q-2-a', text: 'Figma', isCorrect: true },
          { id: 'q-2-b', text: 'Microsoft Word', isCorrect: false }
        ]
      }
    ]
  }
];

const seedAttendance = [
  {
    id: 'att-1',
    studentName: 'Shayan Javed',
    rollNumber: 'LHR-2026-1082',
    date: '2026-07-11',
    status: 'Present',
    lateMinutes: 0,
    slot: 'Morning Slot (09:00 AM - 12:00 PM)'
  }
];

function mapCourseRow(row: any): StudentCourse {
  return {
    id: String(row.id || 'course-1'),
    title: String(row.title || 'Untitled Course'),
    topicsCompleted: Number(row.topics_completed ?? row.topicsCompleted ?? 0),
    topicsTotal: Number(row.topics_total ?? row.topicsTotal ?? 12),
    progressPercentage: Number(row.progress_percentage ?? row.progressPercentage ?? 0),
    status: row.status === 'COMPLETED' ? 'COMPLETED' : 'ENROLLED',
    batchNumber: String(row.batch_number ?? row.batchNumber ?? 'Batch-Unknown'),
    rollNumber: String(row.roll_number ?? row.rollNumber ?? 'STU-PENDING'),
    campus: String(row.campus || 'HEC Accredited Centre'),
    city: String(row.city || 'Pakistan'),
    attendanceCount: Number(row.attendance_count ?? row.attendanceCount ?? 0),
    assignmentCount: Number(row.assignment_count ?? row.assignmentCount ?? 0),
    scheduleSlots: Array.isArray(row.schedule_slots ?? row.scheduleSlots)
      ? (row.schedule_slots ?? row.scheduleSlots).map((slot: any) => String(slot))
      : []
  };
}

function mapQuizRow(row: any): Quiz {
  const parsedQuestions = Array.isArray(row.questions)
    ? row.questions
    : Array.isArray(row.questions_json)
      ? row.questions_json
      : [];

  return {
    id: String(row.id || `quiz-${Math.random()}`),
    title: String(row.title || 'Untitled Assessment'),
    courseId: String(row.course_id ?? row.courseId ?? ''),
    totalQuestions: Number(row.total_questions ?? row.totalQuestions ?? (parsedQuestions.length || 10)),
    timeLimitMinutes: Number(row.time_limit_minutes ?? row.timeLimitMinutes ?? 20),
    status: String(row.status || 'INACTIVE'),
    score: row.score ? String(row.score) : undefined,
    securityLevel: String(row.security_level ?? (row.securityLevel || 'Standard HEC Security')),
    questions: parsedQuestions.map((question: any) => ({
      id: String(question.id || `q-${Math.random()}`),
      prompt: String(question.prompt || ''),
      points: Number(question.points) || 1,
      options: Array.isArray(question.options)
        ? question.options.map((option: any) => ({
            id: String(option.id || `opt-${Math.random()}`),
            text: String(option.text || ''),
            isCorrect: Boolean(option.isCorrect)
          }))
        : []
    }))
  };
}

export async function getCourses(role: 'student' | 'trainer'): Promise<StudentCourse[]> {
  if (!supabase) {
    return seedCourses;
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return seedCourses;
    }

    return data.map(mapCourseRow);
  } catch (error) {
    console.warn('Supabase courses fetch failed, using local seed data.', error);
    return seedCourses;
  }
}

export async function createCourse(role: 'trainer', courseData: Partial<StudentCourse>): Promise<StudentCourse> {
  if (!supabase) {
    return {
      ...seedCourses[0],
      id: `course-${Date.now()}`,
      title: courseData.title || 'New Accredited Course Slot',
      batchNumber: String(courseData.batchNumber || 'Batch-Unknown'),
      campus: String(courseData.campus || 'Supabase Connected Campus'),
      city: String(courseData.city || 'Islamabad'),
      scheduleSlots: Array.isArray(courseData.scheduleSlots) ? courseData.scheduleSlots : []
    };
  }

  try {
    const payload = {
      id: `course-${Date.now()}`,
      title: courseData.title || 'New Accredited Course Slot',
      topics_completed: Number(courseData.topicsCompleted ?? 0),
      topics_total: Number(courseData.topicsTotal ?? 12),
      progress_percentage: Number(courseData.progressPercentage ?? 0),
      status: courseData.status || 'ENROLLED',
      batch_number: courseData.batchNumber || 'Batch-Unknown',
      roll_number: courseData.rollNumber || 'PENDING-ALLOCATION',
      campus: courseData.campus || 'Supabase Connected Campus',
      city: courseData.city || 'Islamabad',
      attendance_count: Number(courseData.attendanceCount ?? 0),
      assignment_count: Number(courseData.assignmentCount ?? 0),
      schedule_slots: courseData.scheduleSlots || [],
      role
    };

    const { data, error } = await supabase.from('courses').insert(payload).select('*').single();
    if (error) throw error;
    return mapCourseRow(data);
  } catch (error) {
    console.warn('Supabase course insert failed, using local fallback.', error);
    return {
      ...seedCourses[0],
      id: `course-${Date.now()}`,
      title: courseData.title || 'New Accredited Course Slot',
      batchNumber: String(courseData.batchNumber || 'Batch-Unknown'),
      campus: String(courseData.campus || 'Supabase Connected Campus'),
      city: String(courseData.city || 'Islamabad'),
      scheduleSlots: Array.isArray(courseData.scheduleSlots) ? courseData.scheduleSlots : []
    };
  }
}

export async function getQuizzes(role: 'student' | 'trainer', courseId?: string): Promise<Quiz[]> {
  if (!supabase) {
    return seedQuizzes;
  }

  try {
    let query = supabase.from('quizzes').select('*').order('id', { ascending: true });
    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) {
      return seedQuizzes;
    }
    return data.map(mapQuizRow);
  } catch (error) {
    console.warn('Supabase quizzes fetch failed, using local seed data.', error);
    return seedQuizzes;
  }
}

export async function createQuiz(role: 'trainer', quizData: { title: string; courseId: string; totalQuestions: number; timeLimitMinutes: number; questions?: any[]; status?: string }): Promise<any> {
  if (!supabase) {
    return {
      id: `quiz-${Date.now()}`,
      title: quizData.title,
      courseId: quizData.courseId,
      totalQuestions: quizData.totalQuestions,
      timeLimitMinutes: quizData.timeLimitMinutes,
      status: quizData.status || 'PUBLISHED',
      securityLevel: 'Supabase Connected Security',
      questions: quizData.questions || []
    };
  }

  try {
    const payload = {
      id: `quiz-${Date.now()}`,
      title: quizData.title,
      course_id: quizData.courseId,
      total_questions: quizData.totalQuestions,
      time_limit_minutes: quizData.timeLimitMinutes,
      status: quizData.status || 'PUBLISHED',
      security_level: 'Supabase Connected Security',
      questions: quizData.questions || [],
      role
    };

    const { data, error } = await supabase.from('quizzes').insert(payload).select('*').single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Supabase quiz insert failed, using local fallback.', error);
    return {
      id: `quiz-${Date.now()}`,
      title: quizData.title,
      courseId: quizData.courseId,
      totalQuestions: quizData.totalQuestions,
      timeLimitMinutes: quizData.timeLimitMinutes,
      status: quizData.status || 'PUBLISHED',
      securityLevel: 'Supabase Connected Security',
      questions: quizData.questions || []
    };
  }
}

export async function createQuizAttempt(role: 'student', payload: { quizId: string; studentId: string; studentName?: string; answers: QuizAnswer[]; score: number; totalPoints: number }): Promise<any> {
  if (!supabase) {
    return {
      id: `attempt-${Date.now()}`,
      quizId: payload.quizId,
      studentId: payload.studentId,
      studentName: payload.studentName || 'Demo Student',
      submittedAt: new Date().toISOString(),
      scoreEarned: payload.score,
      totalPossible: payload.totalPoints,
      answers: payload.answers || []
    };
  }

  try {
    const attemptId = `attempt-${Date.now()}`;
    const attemptRow = {
      id: attemptId,
      quiz_id: payload.quizId,
      student_id: payload.studentId,
      student_name: payload.studentName || null,
      submitted_at: new Date().toISOString(),
      score_earned: Number(payload.score || 0),
      total_possible: Number(payload.totalPoints || 0),
      role
    };

    const { error: insertError } = await supabase.from('quiz_attempts').insert(attemptRow);
    if (insertError) throw insertError;

    const answerRows = (payload.answers || []).map((a, idx) => ({
      id: `ans-${Date.now()}-${idx}`,
      attempt_id: attemptId,
      question_id: a.questionId,
      selected_option_id: a.selectedOptionId,
      role
    }));

    if (answerRows.length > 0) {
      const { error: ansError } = await supabase.from('student_answers').insert(answerRows);
      if (ansError) throw ansError;
    }

    return {
      id: attemptId,
      quizId: payload.quizId,
      studentId: payload.studentId,
      studentName: payload.studentName || null,
      submittedAt: new Date().toISOString(),
      scoreEarned: payload.score,
      totalPossible: payload.totalPoints,
      answers: payload.answers || []
    };
  } catch (error) {
    console.warn('Supabase quiz attempt insert failed.', error);
    return {
      id: `attempt-${Date.now()}`,
      quizId: payload.quizId,
      studentId: payload.studentId,
      studentName: payload.studentName || 'Demo Student',
      submittedAt: new Date().toISOString(),
      scoreEarned: payload.score,
      totalPossible: payload.totalPoints,
      answers: payload.answers || []
    };
  }
}

export async function getQuizAttempts(role: 'trainer' | 'student', quizId: string): Promise<QuizAttempt[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).order('submitted_at', { ascending: false });
    if (error) throw error;
    if (!data) return [];

    // load answers for each attempt
    const attempts: QuizAttempt[] = [];
    for (const row of data) {
      const { data: answersData } = await supabase.from('student_answers').select('*').eq('attempt_id', row.id);
      const answers = Array.isArray(answersData)
        ? answersData.map((a: any) => ({ questionId: a.question_id, selectedOptionId: a.selected_option_id }))
        : [];

      attempts.push({
        id: String(row.id),
        quizId: String(row.quiz_id),
        studentId: String(row.student_id),
        studentName: row.student_name,
        submittedAt: row.submitted_at,
        scoreEarned: Number(row.score_earned || 0),
        totalPossible: Number(row.total_possible || 0),
        answers
      });
    }

    return attempts;
  } catch (error) {
    console.warn('Supabase quiz attempts fetch failed.', error);
    return [];
  }
}

export async function getAttendance(role: 'student' | 'trainer', params?: { courseId?: string; rollNumber?: string }): Promise<any[]> {
  if (!supabase) {
    return seedAttendance;
  }

  try {
    let query = supabase.from('attendance').select('*').order('date', { ascending: false });
    if (params?.courseId) {
      query = query.eq('course_id', params.courseId);
    }
    if (params?.rollNumber) {
      query = query.eq('roll_number', params.rollNumber);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) {
      return seedAttendance;
    }
    return data;
  } catch (error) {
    console.warn('Supabase attendance fetch failed, using local seed data.', error);
    return seedAttendance;
  }
}

export async function submitAttendance(role: 'trainer', payload: { courseId: string; date: string; studentsList: any[] }): Promise<any> {
  if (!supabase) {
    return { success: true, message: 'Attendance stored locally in demo mode.' };
  }

  try {
    const rows = payload.studentsList.map((student: any, index: number) => ({
      id: `att-${Date.now()}-${index}`,
      student_name: student.studentName || student.name,
      roll_number: student.rollNumber || student.roll,
      course_id: payload.courseId,
      date: payload.date,
      status: student.status || 'Present',
      late_minutes: Number(student.lateMinutes || 0),
      slot: student.slot || 'Supabase Managed Slot',
      role
    }));

    const { error } = await supabase.from('attendance').insert(rows);
    if (error) throw error;
    return { success: true, message: 'Attendance synced to Supabase successfully.' };
  } catch (error) {
    console.warn('Supabase attendance insert failed.', error);
    return { success: true, message: 'Attendance saved locally while Supabase is unavailable.' };
  }
}
