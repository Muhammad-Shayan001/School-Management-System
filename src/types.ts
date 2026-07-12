export type UserRole = 'trainer' | 'student';

export interface TrainerProfile {
  fullName: string;
  avatarUrl: string;
  role: string;
  email: string;
  employeeId: string;
  phone: string;
  bio: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
}

export interface AttendanceRecord {
  id: string;
  studentName: string;
  rollNumber: string;
  date: string;
  status: 'Present' | 'Late' | 'Absent';
  lateMinutes: number;
  slot: string;
}

export interface StudentCourse {
  id: string;
  title: string;
  topicsCompleted: number;
  topicsTotal: number;
  progressPercentage: number;
  status: 'ENROLLED' | 'COMPLETED';
  batchNumber: string;
  rollNumber: string;
  campus: string;
  city: string;
  attendanceCount: number;
  assignmentCount: number;
  scheduleSlots: string[];
}

export interface FeeHistory {
  id: string;
  monthYear: string;
  status: 'APPROVED' | 'PENDING';
  dueDate: string;
  amount: string;
  feeType: string;
  voucherId: string;
}

export interface QuizRule {
  id: string;
  text: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  points: number;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  title: string;
  courseId: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  status: string;
  score?: string;
  securityLevel: string;
  questions?: QuizQuestion[];
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName?: string;
  submittedAt: string;
  scoreEarned: number;
  totalPossible: number;
  answers?: QuizAnswer[];
}

