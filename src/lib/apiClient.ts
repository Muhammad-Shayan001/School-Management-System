import { StudentCourse, Quiz, QuizQuestion } from '../types';
import {
  createCourse,
  createQuiz,
  createQuizAttempt,
  getQuizAttempts,
  getAttendance,
  getCourses,
  getQuizzes,
  submitAttendance
} from './supabaseClient';

function validateCoursePayload(course: any): StudentCourse {
  if (!course || typeof course !== 'object') {
    throw new Error('Course record is missing or not a valid object structure.');
  }
  if (typeof course.id !== 'string') {
    throw new Error(`Malformed Course ID: expected string, received ${typeof course.id}`);
  }
  if (typeof course.title !== 'string') {
    throw new Error(`Malformed Course Title for ID [${course.id}]: expected string`);
  }

  return {
    id: course.id,
    title: course.title,
    topicsCompleted: Number(course.topicsCompleted) || 0,
    topicsTotal: Number(course.topicsTotal) || 12,
    progressPercentage: Number(course.progressPercentage) !== undefined ? Number(course.progressPercentage) : 0,
    status: (course.status === 'COMPLETED' || course.status === 'ENROLLED') ? course.status : 'ENROLLED',
    batchNumber: String(course.batchNumber || 'Batch-Unknown'),
    rollNumber: String(course.rollNumber || 'STU-PENDING'),
    campus: String(course.campus || 'HEC Accredited Centre'),
    city: String(course.city || 'Pakistan'),
    attendanceCount: Number(course.attendanceCount) || 0,
    assignmentCount: Number(course.assignmentCount) || 0,
    scheduleSlots: Array.isArray(course.scheduleSlots) ? course.scheduleSlots.map(String) : []
  };
}

function parseBody(body: RequestInit['body']): any {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body as any;
}

export async function safeFetch<T>(
  endpoint: string,
  role: 'student' | 'trainer',
  options: RequestInit = {},
  validator: (data: any) => T
): Promise<T> {
  try {
    if (endpoint === '/api/courses') {
      if (options.method === 'POST') {
        const createdCourse = await createCourse(role, parseBody(options.body));
        return validator({ course: createdCourse });
      }

      const courses = await getCourses(role);
      return validator({ courses });
    }

    if (endpoint === '/api/quizzes' || endpoint.startsWith('/api/quizzes')) {
      if (options.method === 'POST') {
        const quiz = await createQuiz(role, parseBody(options.body));
        return validator({ quiz });
      }

      const params = new URL(endpoint, 'http://localhost').searchParams;
      const quizzes = await getQuizzes(role, params.get('courseId') || undefined);
      return validator({ quizzes });
    }

    if (endpoint === '/api/quizzes/attempts' || endpoint.startsWith('/api/quizzes/attempts')) {
      if (options.method === 'POST') {
        const attempt = await createQuizAttempt(role, parseBody(options.body));
        return validator({ attempt });
      }

      const params = new URL(endpoint, 'http://localhost').searchParams;
      const quizId = params.get('quizId') || '';
      const attempts = await getQuizAttempts(role, quizId);
      return validator({ attempts });
    }

    if (endpoint === '/api/attendance' || endpoint.startsWith('/api/attendance')) {
      if (options.method === 'POST') {
        const result = await submitAttendance(role, parseBody(options.body));
        return validator(result);
      }

      const params = new URL(endpoint, 'http://localhost').searchParams;
      const records = await getAttendance(role, {
        courseId: params.get('courseId') || undefined,
        rollNumber: params.get('rollNumber') || undefined
      });
      return validator({ records });
    }

    throw new Error('Unsupported endpoint');
  } catch (error: any) {
    console.error(`[Supabase API] Request failed on ${endpoint}:`, error);
    throw new Error(error.message || 'Unable to sync with Supabase right now.');
  }
}

export const portalApi = {
  getCourses: async (role: 'student' | 'trainer'): Promise<StudentCourse[]> => {
    return safeFetch<StudentCourse[]>(
      '/api/courses',
      role,
      { method: 'GET' },
      (json) => {
        if (!json || !Array.isArray(json.courses)) {
          throw new Error('Invalid schema: Courses list is missing in server payload.');
        }
        return json.courses.map(validateCoursePayload);
      }
    );
  },

  createCourse: async (role: 'trainer', courseData: Partial<StudentCourse>): Promise<StudentCourse> => {
    return safeFetch<StudentCourse>(
      '/api/courses',
      role,
      {
        method: 'POST',
        body: JSON.stringify(courseData)
      },
      (json) => {
        if (!json || !json.course) {
          throw new Error('Invalid schema: Server did not return created course metadata.');
        }
        return validateCoursePayload(json.course);
      }
    );
  },

  getQuizzes: async (role: 'student' | 'trainer', courseId?: string): Promise<Quiz[]> => {
    const url = courseId ? `/api/quizzes?courseId=${encodeURIComponent(courseId)}` : '/api/quizzes';
    return safeFetch<Quiz[]>(
      url,
      role,
      { method: 'GET' },
      (json) => {
        if (!json || !Array.isArray(json.quizzes)) {
          throw new Error('Invalid schema: Quizzes array is missing in response ledger.');
        }
        return json.quizzes.map((q: any) => ({
          id: String(q.id || `quiz-${Math.random()}`),
          title: String(q.title || 'Untitled Assessment'),
          courseId: String(q.courseId || ''),
          totalQuestions: Number(q.totalQuestions) || 10,
          timeLimitMinutes: Number(q.timeLimitMinutes) || 20,
          status: String(q.status || 'INACTIVE'),
          score: q.score ? String(q.score) : undefined,
          securityLevel: String(q.securityLevel || 'Standard HEC Security'),
          questions: Array.isArray(q.questions)
            ? q.questions.map((question: QuizQuestion) => ({
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
            : []
        }));
      }
    );
  },

  createQuiz: async (role: 'trainer', quizData: { title: string; courseId: string; totalQuestions: number; timeLimitMinutes: number; questions?: QuizQuestion[]; status?: string }): Promise<any> => {
    return safeFetch<any>(
      '/api/quizzes',
      role,
      {
        method: 'POST',
        body: JSON.stringify(quizData)
      },
      (json) => {
        if (!json || !json.quiz) {
          throw new Error('Invalid schema: Quiz creation confirmation missing.');
        }
        return json.quiz;
      }
    );
  },

  submitQuizAttempt: async (role: 'student' | 'trainer', payload: { quizId: string; studentId: string; studentName?: string; answers: any[]; score: number; totalPoints: number }): Promise<any> => {
    return safeFetch<any>(
      '/api/quizzes/attempts',
      role,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      (json) => {
        if (!json || !json.attempt) {
          throw new Error('Invalid schema: Quiz attempt confirmation missing.');
        }
        return json.attempt;
      }
    );
  },

  getQuizAttempts: async (role: 'trainer' | 'student', quizId: string): Promise<any[]> => {
    const url = `/api/quizzes/attempts?quizId=${encodeURIComponent(quizId)}`;
    return safeFetch<any[]>(
      url,
      role,
      { method: 'GET' },
      (json) => {
        if (!json || !Array.isArray(json.attempts)) {
          throw new Error('Invalid schema: Quiz attempts missing in response.');
        }
        return json.attempts;
      }
    );
  },

  getAttendance: async (role: 'student' | 'trainer', params?: { courseId?: string; rollNumber?: string }): Promise<any[]> => {
    let url = '/api/attendance';
    const queryParts: string[] = [];
    if (params?.courseId) queryParts.push(`courseId=${encodeURIComponent(params.courseId)}`);
    if (params?.rollNumber) queryParts.push(`rollNumber=${encodeURIComponent(params.rollNumber)}`);
    if (queryParts.length > 0) url += `?${queryParts.join('&')}`;

    return safeFetch<any[]>(
      url,
      role,
      { method: 'GET' },
      (json) => {
        if (!json || !Array.isArray(json.records)) {
          throw new Error('Invalid schema: Attendance records missing in return logs.');
        }
        return json.records;
      }
    );
  },

  submitAttendance: async (role: 'trainer', payload: { courseId: string; date: string; studentsList: any[] }): Promise<any> => {
    return safeFetch<any>(
      '/api/attendance',
      role,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      (json) => {
        if (!json || !json.success) {
          throw new Error('Server declined the attendance submission.');
        }
        return json;
      }
    );
  }
};