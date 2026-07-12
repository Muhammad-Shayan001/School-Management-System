import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutGrid,
  BookOpen,
  ClipboardList,
  Users,
  Plus,
  RefreshCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  GraduationCap
} from 'lucide-react';
import { StudentCourse, Quiz, QuizAttempt } from '../types';
import { portalApi } from '../lib/apiClient';

interface AdminPortalProps {
  onSwitchToStudent: () => void;
  onSwitchToTrainer: () => void;
}

const mockStudents = [
  { name: 'Shayan Javed', roll: 'LHR-2026-1082' },
  { name: 'Muhammad Bilal Ahmed', roll: 'KHI-2026-1120' },
  { name: 'Aisha Fatima Sana', roll: 'ISB-2026-1505' },
  { name: 'Hamza Shehzad', roll: 'LHR-2026-1402' }
];

export default function AdminPortal({ onSwitchToStudent, onSwitchToTrainer }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'quizzes' | 'attendance'>('overview');
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attemptsModalOpen, setAttemptsModalOpen] = useState(false);
  const [selectedQuizAttempts, setSelectedQuizAttempts] = useState<QuizAttempt[]>([]);
  const [selectedQuizForResults, setSelectedQuizForResults] = useState<Quiz | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    batchNumber: 'Batch 44-Lahore',
    campus: 'Arfa Software Technology Park',
    city: 'Lahore',
    topicsTotal: '12',
    scheduleSlots: 'Monday 10:00 AM - 01:00 PM'
  });
  const [quizForm, setQuizForm] = useState({
    title: '',
    courseId: 'course-1',
    totalQuestions: '10',
    timeLimitMinutes: '20'
  });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));

  const loadAdminData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [fetchedCourses, fetchedQuizzes, fetchedAttendance] = await Promise.all([
        portalApi.getCourses('trainer'),
        portalApi.getQuizzes('trainer'),
        portalApi.getAttendance('trainer')
      ]);
      setCourses(fetchedCourses);
      setQuizzes(fetchedQuizzes);
      setAttendance(fetchedAttendance);
    } catch (error: any) {
      setMessage(error.message || 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const metrics = useMemo(() => ({
    courses: courses.length,
    quizzes: quizzes.length,
    attendance: attendance.length,
    enrolled: courses.filter((course) => course.status === 'ENROLLED').length,
    completed: courses.filter((course) => course.status === 'COMPLETED').length
  }), [courses, quizzes, attendance]);

  const handleCreateCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const createdCourse = await portalApi.createCourse('trainer', {
        title: courseForm.title,
        batchNumber: courseForm.batchNumber,
        campus: courseForm.campus,
        city: courseForm.city,
        topicsTotal: Number(courseForm.topicsTotal),
        scheduleSlots: [courseForm.scheduleSlots]
      });
      setCourses((prev) => [createdCourse, ...prev]);
      setCourseForm({
        title: '',
        batchNumber: 'Batch 44-Lahore',
        campus: 'Arfa Software Technology Park',
        city: 'Lahore',
        topicsTotal: '12',
        scheduleSlots: 'Monday 10:00 AM - 01:00 PM'
      });
      setMessage('Course created successfully and synced.');
    } catch (error: any) {
      setMessage(error.message || 'Course creation failed.');
    }
  };

  const handleCreateQuiz = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const createdQuiz = await portalApi.createQuiz('admin' as any, {
        title: quizForm.title,
        courseId: quizForm.courseId,
        totalQuestions: Number(quizForm.totalQuestions),
        timeLimitMinutes: Number(quizForm.timeLimitMinutes),
        status: 'PUBLISHED'
      });
      setQuizzes((prev) => [createdQuiz, ...prev]);
      try { window.dispatchEvent(new CustomEvent('quizzes-updated')); } catch {}
      setQuizForm({ title: '', courseId: 'course-1', totalQuestions: '10', timeLimitMinutes: '20' });
      setMessage('Quiz created successfully.');
    } catch (error: any) {
      setMessage(error.message || 'Quiz creation failed.');
    }
  };

  const handleSubmitAttendance = async () => {
    try {
      const payload = {
        courseId: 'course-1',
        date: attendanceDate,
        studentsList: mockStudents.map((student) => ({
          studentName: student.name,
          rollNumber: student.roll,
          status: 'Present',
          lateMinutes: 0,
          slot: 'Morning Slot (09:00 AM - 12:00 PM)'
        }))
      };
      const result = await portalApi.submitAttendance('trainer', payload);
      setAttendance((prev) => [
        ...prev,
        ...payload.studentsList.map((student, index) => ({
          id: `att-${Date.now()}-${index}`,
          studentName: student.studentName,
          rollNumber: student.rollNumber,
          date: payload.date,
          status: student.status,
          lateMinutes: student.lateMinutes,
          slot: student.slot
        }))
      ]);
      setMessage(result?.message || 'Attendance synced to backend.');
    } catch (error: any) {
      setMessage(error.message || 'Attendance sync failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-700">Admin Control Center</p>
            <h1 className="text-2xl font-bold tracking-tight">National Academic Operations Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onSwitchToTrainer} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Trainer View</button>
            <button onClick={onSwitchToStudent} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Student View</button>
            <button onClick={() => void loadAdminData()} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Refresh</button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
        {message && (
          <div className={`rounded-2xl border p-4 text-sm ${message.includes('successfully') || message.includes('synced') ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            <div className="flex items-center gap-2">
              {message.includes('successfully') || message.includes('synced') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message}</span>
            </div>
          </div>
        )}

        {attemptsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 text-white">
            <div className="w-[90%] max-w-2xl bg-white rounded-xl p-6 text-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Results for: {selectedQuizForResults?.title}</h3>
                <button onClick={() => setAttemptsModalOpen(false)} className="text-sm text-slate-500">Close</button>
              </div>
              <div className="mt-4 space-y-3">
                {selectedQuizAttempts.length === 0 ? (
                  <p className="text-sm text-slate-500">No attempts yet.</p>
                ) : (
                  selectedQuizAttempts.map((att) => (
                    <div key={att.id} className="flex items-center justify-between border-b border-slate-100 py-2">
                      <div>
                        <p className="font-semibold">{att.studentName || att.studentId}</p>
                        <p className="text-xs text-slate-400">{new Date(att.submittedAt || '').toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{att.scoreEarned}/{att.totalPossible}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Courses', value: metrics.courses, icon: GraduationCap },
            { label: 'Quizzes', value: metrics.quizzes, icon: BookOpen },
            { label: 'Attendance', value: metrics.attendance, icon: ClipboardList },
            { label: 'Enrolled', value: metrics.enrolled, icon: Users }
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <card.icon size={16} className="text-emerald-600" />
              </div>
              <p className="mt-3 text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'courses', label: 'Courses' },
            { id: 'quizzes', label: 'Quizzes' },
            { id: 'attendance', label: 'Attendance' }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
              {tab.label}
            </button>
          ))}
        </section>

        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="text-emerald-600" size={18} />
                <h2 className="text-lg font-semibold">Operations Summary</h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">Admin controls are live and connected to the Supabase-powered data layer with local fallback support.</p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active Classes</p>
                  <p className="mt-2 text-xl font-bold">{metrics.enrolled}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completed Programs</p>
                  <p className="mt-2 text-xl font-bold">{metrics.completed}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Plus className="text-emerald-600" size={18} />
                <h2 className="text-lg font-semibold">Create New Course</h2>
              </div>
              <form onSubmit={handleCreateCourse} className="mt-4 space-y-3">
                <input required value={courseForm.title} onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Course title" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={courseForm.batchNumber} onChange={(event) => setCourseForm((prev) => ({ ...prev, batchNumber: event.target.value }))} placeholder="Batch" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <input value={courseForm.topicsTotal} onChange={(event) => setCourseForm((prev) => ({ ...prev, topicsTotal: event.target.value }))} placeholder="Topics total" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={courseForm.campus} onChange={(event) => setCourseForm((prev) => ({ ...prev, campus: event.target.value }))} placeholder="Campus" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <input value={courseForm.city} onChange={(event) => setCourseForm((prev) => ({ ...prev, city: event.target.value }))} placeholder="City" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <input value={courseForm.scheduleSlots} onChange={(event) => setCourseForm((prev) => ({ ...prev, scheduleSlots: event.target.value }))} placeholder="Schedule slot" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <button type="submit" className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Create Course <ArrowRight size={15} /></button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Course Library</h2>
              <button onClick={() => setActiveTab('overview')} className="text-sm font-semibold text-emerald-700">Add New</button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Course</th>
                    <th className="py-2">Batch</th>
                    <th className="py-2">Progress</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-slate-100">
                      <td className="py-3 font-semibold">{course.title}</td>
                      <td className="py-3">{course.batchNumber}</td>
                      <td className="py-3">{course.progressPercentage}%</td>
                      <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${course.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{course.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Create Quiz</h2>
              <form onSubmit={handleCreateQuiz} className="mt-4 space-y-3">
                <input required value={quizForm.title} onChange={(event) => setQuizForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Quiz title" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={quizForm.courseId} onChange={(event) => setQuizForm((prev) => ({ ...prev, courseId: event.target.value }))} placeholder="Course ID" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <input value={quizForm.totalQuestions} onChange={(event) => setQuizForm((prev) => ({ ...prev, totalQuestions: event.target.value }))} placeholder="Questions" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <input value={quizForm.timeLimitMinutes} onChange={(event) => setQuizForm((prev) => ({ ...prev, timeLimitMinutes: event.target.value }))} placeholder="Time limit (min)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <button type="submit" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Publish Quiz</button>
              </form>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Quiz Queue</h2>
              <div className="mt-4 space-y-3">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{quiz.title}</p>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{quiz.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{quiz.totalQuestions} questions • {quiz.timeLimitMinutes} min</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={async () => {
                        setSelectedQuizForResults(quiz);
                        try {
                          const attempts = await portalApi.getQuizAttempts('trainer', quiz.id);
                          setSelectedQuizAttempts(attempts as QuizAttempt[]);
                        } catch (err) {
                          setSelectedQuizAttempts([]);
                        }
                        setAttemptsModalOpen(true);
                      }} className="rounded-xl bg-slate-900 px-3 py-1 text-xs text-white">View Results</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-emerald-600" size={18} />
                <h2 className="text-lg font-semibold">Attendance Sync</h2>
              </div>
              <div className="mt-4 space-y-3">
                <label className="block text-sm text-slate-500">Attendance date</label>
                <input type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <button onClick={() => void handleSubmitAttendance()} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><RefreshCcw size={15} /> Sync Attendance</button>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Attendance Log</h2>
              <div className="mt-4 space-y-3">
                {attendance.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                    <div>
                      <p className="font-semibold">{entry.studentName || entry.student_name}</p>
                      <p className="text-sm text-slate-500">{entry.rollNumber || entry.roll_number} • {entry.date}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{entry.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
