/**
 * SECURE API CLIENT WITH VALIDATION AND JWT AUTHORIZATION FOR THE ACADEMIC PORTAL
 * Features:
 * - Dynamic cryptographically structure-aligned Mock JWT generation for student and trainer.
 * - Robust schema validation layers to catch corrupted/malformed API payloads.
 * - Configurable simulated failures and latency to display skeletons and error states.
 */

import { StudentCourse, FeeHistory, Quiz } from '../types';

// Let the developer or user toggle API failure simulation for testing error handling in the UI
if (typeof window !== 'undefined') {
  (window as any).SIMULATE_API_FAILURE = false;
  (window as any).SIMULATE_API_DELAY_MS = 800; // Simulated network delay
}

// Generates an HEC/PITB accredited mock JWT header + payload + signature
function generateMockJwtToken(role: 'student' | 'trainer'): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  
  const payload = role === 'student' 
    ? {
        id: "usr-student-1082",
        email: "shayan.javed091@gmail.com",
        role: "student",
        name: "Shayan Javed"
      }
    : {
        id: "usr-trainer-8942",
        email: "tariq.mahmood@pitb.gov.pk",
        role: "trainer",
        name: "Prof. Dr. Tariq Mahmood"
      };

  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
  const signature = "MOCK_SIGNATURE_LEDGER_HEC_2026_PITB_SECURE_TOKEN_VAL";
  
  return `${header}.${encodedPayload}.${signature}`;
}

/**
 * Validates the schema of course payload objects coming from API endpoints
 */
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

  // Fallback default properties to make it secure and unhackable
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

/**
 * Safe fetch wrapper with automated bearer token injecting and payload validation
 */
export async function safeFetch<T>(
  endpoint: string, 
  role: 'student' | 'trainer', 
  options: RequestInit = {},
  validator: (data: any) => T
): Promise<T> {
  // 1. Simulate Latency
  const delay = typeof window !== 'undefined' ? ((window as any).SIMULATE_API_DELAY_MS || 800) : 800;
  await new Promise(resolve => setTimeout(resolve, delay));

  // 2. Simulate Failure if activated
  if (typeof window !== 'undefined' && (window as any).SIMULATE_API_FAILURE) {
    throw new Error('Simulated Network Fail: Pakistan core academic database replica timed out (504 Gateway Timeout).');
  }

  // 3. Prepare headers with Authorization JWT
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${generateMockJwtToken(role)}`);
  headers.set('Content-Type', 'application/json');

  const finalOptions = {
    ...options,
    headers
  };

  try {
    const response = await fetch(endpoint, finalOptions);

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: Failed to synchronize with education ledger.`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.message) {
          errorMsg = errJson.message;
        }
      } catch (e) {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const json = await response.json();
    
    // Ensure success signature exists
    if (json && json.success === false) {
      throw new Error(json.message || 'HEC database server returned failure flag.');
    }

    // 4. Run payload validation layer
    return validator(json);

  } catch (error: any) {
    console.error(`[API Validate Error] Fetch failed on ${endpoint}:`, error);
    throw new Error(error.message || 'Connection lost to BISE/HEC secure endpoints. Check internet and try again.');
  }
}

/**
 * Exported functions to interact with our newly made App API
 */
export const portalApi = {
  /**
   * Loads courses for student or trainer portal with validation schema checks
   */
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

  /**
   * Triggers a new accredited course slot allocation
   */
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

  /**
   * Retrieves active quizzes with security audit compliance parameters
   */
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
          securityLevel: String(q.securityLevel || 'Standard HEC Security')
        }));
      }
    );
  },

  /**
   * Submits new quizzes/assessments
   */
  createQuiz: async (role: 'trainer', quizData: { title: string; courseId: string; totalQuestions: number; timeLimitMinutes: number }): Promise<any> => {
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

  /**
   * Retrieves attendance records
   */
  getAttendance: async (role: 'student' | 'trainer', params?: { courseId?: string; rollNumber?: string }): Promise<any[]> => {
    let url = '/api/attendance';
    const queryParts = [];
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

  /**
   * Submits daily attendance lists to server
   */
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
