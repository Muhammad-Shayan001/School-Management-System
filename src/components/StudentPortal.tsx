import React, { useState, useEffect } from 'react';
import { 
  Home as HomeIcon, 
  LayoutDashboard, 
  CreditCard, 
  HelpCircle, 
  TrendingUp,
  Moon,
  Sun,
  MessageSquare,
  Search,
  BookOpen,
  CheckCircle2,
  Calendar,
  MapPin,
  ClipboardList,
  Video,
  Copy,
  Check,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  X,
  Play
} from 'lucide-react';
import { StudentCourse, FeeHistory, Quiz, QuizQuestion } from '../types';
import { portalApi } from '../lib/apiClient';
import { calculateQuizResult } from '../lib/quizUtils';

interface StudentPortalProps {
  onSwitchToTrainer: () => void;
}

export default function StudentPortal({ onSwitchToTrainer }: StudentPortalProps) {
  // Navigation Tabs for Student Portal (Home, Dashboard, Payment, Quiz, Progress)
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'payment' | 'quiz' | 'progress'>('home');

  // Theme states (for the specified dark-mode toggle icon, we can toggle standard dark/light body/frame classes)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Copied Voucher ID feedback state
  const [copiedVoucherId, setCopiedVoucherId] = useState<string | null>(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENROLLED' | 'COMPLETED'>('ALL');

  // Selected course details state (for the detail/progress variant)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>('course-1');

  // Modals
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<Record<string, { score: number; totalPoints: number; correctAnswers: number; accuracy: number }>>({});
  const [submittedQuizIds, setSubmittedQuizIds] = useState<string[]>([]);

  // Student Courses Mock Data
  const [courses, setCourses] = useState<StudentCourse[]>([
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
  ]);

  // Payment mock data
  const [feeHistory, setFeeHistory] = useState<FeeHistory[]>([
    {
      id: 'fee-1',
      monthYear: 'June 2026 Term',
      status: 'APPROVED',
      dueDate: '2026-06-15',
      amount: 'Rs. 12,500',
      feeType: 'Monthly Tuition Fee',
      voucherId: 'VCH-9823101'
    },
    {
      id: 'fee-2',
      monthYear: 'May 2026 Term',
      status: 'APPROVED',
      dueDate: '2026-05-15',
      amount: 'Rs. 12,500',
      feeType: 'Monthly Tuition Fee',
      voucherId: 'VCH-8712395'
    },
    {
      id: 'fee-3',
      monthYear: 'Admission Reg',
      status: 'APPROVED',
      dueDate: '2026-04-01',
      amount: 'Rs. 25,000',
      feeType: 'One-time Registration',
      voucherId: 'VCH-7612308'
    }
  ]);

  // Async core API loading and validation states
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const loadStudentData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [fetchedCourses, fetchedQuizzes] = await Promise.all([
        portalApi.getCourses('student'),
        portalApi.getQuizzes('student')
      ]);

      // Validating and setting states safely
      setCourses(fetchedCourses);
      setQuizzes(fetchedQuizzes);
    } catch (err: any) {
      setApiError(err.message || 'National Board Synchronization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStudentData();
  }, []);

  // Quiz Rules
  const quizRules = [
    'The quiz can only be attempted once. Ensure stable internet connectivity before hitting start.',
    'Time limits are strictly enforced by the Federal Board integration ledger.',
    'Plagiarism or switching tabs will trigger security blocks, resulting in an automatic zero score.',
    'Contact your course coordinator immediately in case of real-time load shedding or power failures.'
  ];

  // Copy helper
  const handleCopyVoucher = (vid: string) => {
    navigator.clipboard.writeText(vid);
    setCopiedVoucherId(vid);
    setTimeout(() => setCopiedVoucherId(null), 1800);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setShowFeedbackModal(false);
      setFeedbackText('');
    }, 1500);
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizAnswers({});
  };

  const handleQuizAnswerChange = (questionId: string, optionId: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeQuiz) return;

    const result = calculateQuizResult(activeQuiz as any, quizAnswers);

    // submit attempt to backend for persistence
    (async () => {
      try {
        const studentId = (activeDetailCourse && activeDetailCourse.rollNumber) || 'demo-student';
        const attempt = await portalApi.submitQuizAttempt('student', {
          quizId: activeQuiz.id,
          studentId,
          studentName: 'Shayan Javed',
          answers: Object.entries(quizAnswers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })),
          score: result.score,
          totalPoints: result.totalPoints
        });

        // persist result locally for UI
        setQuizResults((prev) => ({ ...prev, [activeQuiz.id]: result }));
        setSubmittedQuizIds((prev) => prev.includes(activeQuiz.id) ? prev : [...prev, activeQuiz.id]);
      } catch (err: any) {
        // still show local result if backend fails
        setQuizResults((prev) => ({ ...prev, [activeQuiz.id]: result }));
        setSubmittedQuizIds((prev) => prev.includes(activeQuiz.id) ? prev : [...prev, activeQuiz.id]);
        console.error('Quiz submission failed:', err?.message || err);
      }
    })();
  };

  const activeDetailCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  // Filters search
  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ? true : c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`min-h-screen font-sans flex flex-col pb-24 md:pb-8 transition-all duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50/50 text-slate-900'}`}>
      
      {/* 5. TOP BAR */}
      <header className={`px-4 md:px-8 py-3.5 border-b flex items-center justify-between sticky top-0 z-30 transition-all ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200/60'} backdrop-blur-md shadow-xs`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-emerald-500 overflow-hidden shadow-xs">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop" alt="Student Profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-xs font-bold block leading-none">Shayan Javed</span>
            <span className="text-[10px] text-slate-400 mt-0.5 inline-block font-mono">ID: LHR-2026-1082</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Trainer Portal Role Switcher */}
          <button 
            onClick={onSwitchToTrainer}
            className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-blue-100/60"
          >
            Trainer Portal
          </button>

          {/* Dark-mode toggle icon */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Theme Mode"
            className={`p-2 rounded-lg transition-all cursor-pointer ${isDarkMode ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-500 hover:bg-slate-200/60'}`}
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Feedback pill button */}
          <button
            id="student-feedback-button"
            onClick={() => setShowFeedbackModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare size={12} /> Feedback
          </button>
        </div>
      </header>

      {/* PORTAL WORKSPACE */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full animate-fade-in space-y-6">
        
        {/* SUPABASE STATUS BAR */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs ${
          isDarkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200/60 shadow-3xs'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-bold text-slate-700 dark:text-slate-300">SUPABASE LIVE SYNC: ACTIVE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">Courses and quizzes load from your connected backend.</span>
            <button
              onClick={() => void loadStudentData()}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all text-[11px]"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {apiError && (
          <div className="p-5 rounded-2xl border border-red-200 bg-red-50 text-red-950 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-300 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
              <AlertTriangle className="animate-bounce shrink-0" size={18} />
              <h3 className="font-bold font-display text-sm">Synchronized Syllabus Checksum Mismatch</h3>
            </div>
            <p className="text-[11px] font-mono leading-relaxed">{apiError}</p>
            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => void loadStudentData()}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: COURSE DASHBOARD (HOME) */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-display">Academic Journey</h1>
                <p className="text-xs text-slate-400 mt-0.5">Track your course progression, milestones, and active subjects.</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full flex items-center gap-1 font-mono">
                <Sparkles size={11} /> ACTIVE TERM
              </span>
            </div>

            {/* List of enrolled course cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={`course-sk-${i}`}
                    className={`p-5 rounded-2xl border flex items-center justify-between animate-pulse ${
                      isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200/60'
                    }`}
                  >
                    <div className="space-y-3 flex-1 pr-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/4"></div>
                      <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded-md w-3/4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2"></div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-slate-250 dark:bg-slate-700 shrink-0"></div>
                  </div>
                ))
              ) : courses.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-slate-400">No active course enrollments found.</div>
              ) : (
                courses.map((course) => {
                // Calculate circle values
                const radius = 22;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (course.progressPercentage / 100) * circumference;

                return (
                  <div 
                    key={course.id}
                    className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
                      isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200/60'
                    } shadow-xs hover:shadow-md`}
                  >
                    <div className="space-y-3 flex-1 pr-4">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                          {course.status}
                        </span>
                        <h3 className="font-bold text-sm mt-1.5 leading-snug line-clamp-2 text-slate-800 dark:text-slate-100 font-display">{course.title}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Topics Completed:</span>
                        <span className={`text-xs font-bold font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                          {course.topicsCompleted} / {course.topicsTotal}
                        </span>
                      </div>
                    </div>

                    {/* Circular Percentage Progress Ring */}
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Grey base ring */}
                        <circle 
                          cx="32" 
                          cy="32" 
                          r={radius} 
                          className={`${isDarkMode ? 'stroke-slate-700' : 'stroke-slate-100'}`}
                          strokeWidth="4" 
                          fill="transparent" 
                        />
                        {/* Colored progress arc */}
                        {course.progressPercentage > 0 && (
                          <circle 
                            cx="32" 
                            cy="32" 
                            r={radius} 
                            stroke="url(#blue-gradient)"
                            strokeWidth="4" 
                            fill="transparent" 
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        )}
                        
                        {/* Gradient definition */}
                        <defs>
                          <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      {/* Percent text */}
                      <span className="absolute text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
                        {course.progressPercentage}%
                      </span>
                    </div>
                  </div>
                );
              }))}
            </div>

            {/* Quick Actions Guide */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDarkMode ? 'bg-blue-950/20 border-blue-900/40' : 'bg-blue-50/40 border-blue-100'
            }`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100/80 flex items-center justify-center text-blue-600 shrink-0">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Need help with your topics?</h4>
                  <p className="text-xs text-slate-400 mt-1">Submit anonymous feedback or explore detailed progress timelines from the menu options below.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveTab('progress');
                  setSelectedCourseId('course-1');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Inspect Topic Timelines
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: DASHBOARD (MY COURSES) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-display">My Courses</h1>
                <p className="text-xs text-slate-400 mt-0.5">Explore active batches, search curriculum matrices, or view class detail summaries.</p>
              </div>

              {/* SEARCH BAR & FILTER ROW */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <input 
                    type="text" 
                    placeholder="Search Course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full text-xs rounded-xl pl-8 pr-3 py-2 border focus:outline-hidden transition-all ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-1 focus:ring-blue-500' 
                        : 'bg-white border-slate-200/60 text-slate-900 focus:ring-1 focus:ring-blue-500 shadow-3xs'
                    }`}
                  />
                  <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                </div>

                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ENROLLED' | 'COMPLETED')}
                  className={`text-xs rounded-xl p-2 border focus:outline-hidden cursor-pointer font-semibold transition-all ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200/60 text-slate-700 shadow-3xs'
                  }`}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ENROLLED">Enrolled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {/* Course cards showing title, status pill, progress bar with label, metadata, view details button */}
            <div className="space-y-4">
              {filteredCourses.length === 0 ? (
                <div className={`p-10 text-center rounded-2xl border ${isDarkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-white border-slate-200/60'}`}>
                  <p className="text-sm font-bold text-slate-500">No courses match your search criteria.</p>
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <div 
                    key={course.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200/60'
                    } shadow-xs hover:border-blue-300`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 font-display">{course.title}</h3>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider">Managed Curriculum Block</p>
                      </div>

                      {/* Status pill: Enrolled in blue outline, Completed in green fill */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider font-mono ${
                        course.status === 'COMPLETED' 
                          ? 'bg-green-500 text-white shadow-3xs' 
                          : 'border border-blue-500 text-blue-600 bg-blue-50/40'
                      }`}>
                        {course.status}
                      </span>
                    </div>

                    {/* Progress Bar with percentage label */}
                    <div className="py-4 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Course Completion Rate</span>
                        <span className="font-bold text-blue-600 font-mono">{course.progressPercentage}%</span>
                      </div>
                      <div className={`h-2 rounded-full w-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${course.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Metadata Row with icons (Batch, Roll, Campus, City) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <ClipboardList size={14} className="text-blue-500" />
                        <span>Batch: <strong className="text-slate-700 dark:text-slate-200 font-mono">{course.batchNumber}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={14} className="text-blue-500" />
                        <span>Roll: <strong className="text-slate-700 dark:text-slate-200 font-mono">{course.rollNumber}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-blue-500 animate-pulse" />
                        <span className="truncate" title={course.campus}>Campus: <strong className="text-slate-700 dark:text-slate-200">{course.campus.split(' ')[0]}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-blue-500" />
                        <span>City: <strong className="text-slate-700 dark:text-slate-200">{course.city}</strong></span>
                      </div>
                    </div>

                    {/* Full-width outlined View Details button with small icon */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <button
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setActiveTab('progress'); // Go to Progress detail tab
                        }}
                        className={`w-full border py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isDarkMode 
                            ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-3xs hover:border-blue-500'
                        }`}
                      >
                        View Course Progress Details <ChevronRight size={14} className="text-blue-500" />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENT PAGE */}
        {activeTab === 'payment' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-display">Payments & Receipts</h1>
              <p className="text-xs text-slate-400 mt-0.5">Inspect approved tuition fees, upload receipts, or pay online securely.</p>
            </div>

            {/* Instructional card (light blue/tinted background) with numbered steps */}
            <div className={`p-5 rounded-2xl border ${
              isDarkMode ? 'bg-blue-950/20 border-blue-900/40' : 'bg-blue-50/40 border-blue-100'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="text-blue-600" size={18} />
                <h3 className="font-bold text-sm text-blue-900 dark:text-blue-400 font-display">Pay Tuition Via Mobile Wallet App</h3>
              </div>
              
              <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li>Open your preferred Mobile Wallet application (Easypaisa, JazzCash, Nayapay, Sadapay, or HBL Konnect).</li>
                <li>Tap <strong>Education Payment</strong> or search for school billers by entering our federal billing code <strong className="font-mono text-emerald-600 dark:text-emerald-400">HEC-PITB-2026-X</strong>.</li>
                <li>Enter your Roll Number: <strong className="font-mono text-xs text-emerald-600 dark:text-emerald-400">{activeDetailCourse.rollNumber}</strong>.</li>
                <li>Confirm the payment amount and save the auto-generated transaction voucher code.</li>
              </ol>

              {/* Solid watch guide video button below */}
              <button
                onClick={() => setShowVideoModal(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Video size={14} /> Watch Guide Video
              </button>
            </div>

            {/* List of fee history cards */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest font-mono">Transaction History</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {feeHistory.map((fee) => (
                  <div 
                    key={fee.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200/60 shadow-3xs'
                    }`}
                  >
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 font-display">{fee.monthYear}</span>
                      
                      {/* status pill: APPROVED in green */}
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-full font-mono">
                        {fee.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between"><span className="text-slate-400">Due Date:</span><span className="font-mono font-bold">{fee.dueDate}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Fee Type:</span><span className="font-medium">{fee.feeType}</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400">Amount:</span><strong className="text-blue-600 text-sm font-semibold font-mono">{fee.amount}</strong></div>
                    </div>

                    {/* Voucher ID row with copy-to-clipboard button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono tracking-wider">{fee.voucherId}</span>
                      <button
                        onClick={() => handleCopyVoucher(fee.voucherId)}
                        title="Copy Voucher ID"
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          copiedVoucherId === fee.voucherId 
                            ? 'bg-green-50 text-green-600 border-green-100' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {copiedVoucherId === fee.voucherId ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: QUIZ PAGE */}
        {activeTab === 'quiz' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-display">Active Quizzes</h1>
              <p className="text-xs text-slate-400 mt-0.5">Submit timed assessments assigned by your course trainer.</p>
            </div>

            {/* "Important Information" warning card (warning icon + title) */}
            <div className={`p-5 rounded-2xl border ${
              isDarkMode ? 'bg-orange-950/20 border-orange-900/40' : 'bg-amber-50/60 border-amber-100'
            }`}>
              <div className="flex items-center gap-2 mb-3 text-amber-800 dark:text-amber-400">
                <AlertTriangle className="animate-bounce" size={20} />
                <h3 className="font-bold text-sm font-display">Important Information & Quiz Rules</h3>
              </div>
              
              <ul className="space-y-2 text-xs text-amber-950 dark:text-amber-300">
                {quizRules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Real Quizzes from Secure Ledger */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest font-mono">Assigned Assessments</h3>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div 
                      key={`quiz-sk-${i}`}
                      className={`p-5 rounded-2xl border animate-pulse ${
                        isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200/60 shadow-3xs'
                      } space-y-3`}
                    >
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3"></div>
                      <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded-md w-3/4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : quizzes.length === 0 ? (
                <div className={`border border-dashed rounded-2xl py-12 px-6 text-center ${
                  isDarkMode ? 'bg-slate-800/10 border-slate-700' : 'bg-white border-slate-200 shadow-3xs'
                }`}>
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 mx-auto mb-3">
                    <HelpCircle size={20} />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm font-display">No active quizzes available</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    All scheduled tests are currently locked or completed. Please check back later.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizzes.map((quiz) => (
                    <div 
                      key={quiz.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200/60 shadow-3xs'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono uppercase ${
                            quiz.status === 'COMPLETED' ? 'bg-green-150 text-green-700 dark:bg-green-950/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30'
                          }`}>
                            {quiz.status}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{quiz.securityLevel}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display line-clamp-2">{quiz.title}</h4>
                        <div className="flex gap-4 text-xs text-slate-400 font-mono pt-1">
                          <span>Questions: {quiz.totalQuestions}</span>
                          <span>•</span>
                          <span>Duration: {quiz.timeLimitMinutes} mins</span>
                        </div>
                      </div>

                      {quiz.status === 'COMPLETED' || submittedQuizIds.includes(quiz.id) ? (
                        <div className="bg-green-50 dark:bg-green-950/20 p-2.5 rounded-xl border border-green-100 dark:border-green-900/30 flex justify-between items-center text-xs text-green-850 dark:text-green-300">
                          <span className="font-medium">Score: <strong className="font-bold font-mono">{quiz.score || `${quizResults[quiz.id]?.score ?? 0}/${quizResults[quiz.id]?.totalPoints ?? quiz.totalQuestions}`}</strong></span>
                          <span className="text-[9px] font-mono text-green-600">✓ Verified Ledger Seal</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartQuiz(quiz)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play size={12} /> Start Assessment Attempt
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {activeQuiz && (
          <div className={`rounded-3xl border p-6 shadow-sm ${isDarkMode ? 'border-slate-700 bg-slate-800/70' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">Live Assessment</p>
                <h2 className="mt-1 text-xl font-semibold">{activeQuiz.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{activeQuiz.timeLimitMinutes} minutes • {activeQuiz.totalQuestions} questions</p>
              </div>
              <button onClick={() => setActiveQuiz(null)} className="rounded-full border border-slate-200 p-2 text-slate-500">×</button>
            </div>

            <form onSubmit={handleSubmitQuiz} className="mt-6 space-y-4">
              {(activeQuiz.questions ?? []).map((question, index) => (
                <div key={question.id} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{index + 1}. {question.prompt}</p>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{question.points} pts</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {question.options.map((option) => (
                      <label key={option.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                        <input type="radio" name={question.id} checked={quizAnswers[question.id] === option.id} onChange={() => handleQuizAnswerChange(question.id, option.id)} />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">Answer all questions and submit to view your marks out of total and correct answers.</p>
                <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Submit Quiz</button>
              </div>
            </form>

            {activeQuiz && quizResults[activeQuiz.id] && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <p className="text-sm font-semibold">Result published</p>
                <p className="mt-2 text-sm">You scored {quizResults[activeQuiz.id].score} out of {quizResults[activeQuiz.id].totalPoints} points with {quizResults[activeQuiz.id].correctAnswers} correct answer{quizResults[activeQuiz.id].correctAnswers === 1 ? '' : 's'}.</p>
                <p className="mt-1 text-sm font-semibold">Accuracy: {quizResults[activeQuiz.id].accuracy}%</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROGRESS (COURSE DETAIL VIEW) */}
        {activeTab === 'progress' && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-display">Timeline & Progress</h1>
                <p className="text-xs text-slate-400 mt-0.5">Real-time attendance logs, grade mappings, and topic checklists.</p>
              </div>

              {/* Selector for switching course context inside Progress page */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-750 shadow-3xs text-xs text-slate-700 dark:text-slate-300">
                <span className="text-[10px] font-bold text-slate-400">Select:</span>
                <select
                  value={selectedCourseId || ''}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="bg-transparent border-none focus:outline-hidden font-bold text-slate-700 dark:text-slate-200 cursor-pointer text-xs"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title.split(' ')[0]}...</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TWO STAT CARDS AT TOP above the active course card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Attendance Count */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-slate-950 dark:text-white font-display">
                    {activeDetailCourse.attendanceCount} / 24
                  </span>
                  <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider font-mono">Attendance (Present Classes)</p>
                </div>
                <div className="w-11 h-11 rounded-full bg-green-50 dark:bg-green-950/20 flex items-center justify-center text-green-600 shadow-xs">
                  <CheckCircle2 size={18} />
                </div>
              </div>

              {/* Card 2: Assignment Count */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-slate-950 dark:text-white font-display">
                    {activeDetailCourse.assignmentCount} / 8
                  </span>
                  <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider font-mono">Assignments Submitted</p>
                </div>
                <div className="w-11 h-11 rounded-full bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-600 shadow-xs">
                  <ClipboardList size={18} />
                </div>
              </div>
            </div>

            {/* ACTIVE COURSE DETAIL CARD */}
            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200/60 shadow-xs'}`}>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider font-mono ${
                activeDetailCourse.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {activeDetailCourse.status}
              </span>
              
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-2 font-display">{activeDetailCourse.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Faculty Lead: Prof. Alex Mercer</p>

              {/* Progress bar inside course card */}
              <div className="mt-5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Term Syllabus Covered</span>
                  <span className="font-bold text-blue-600 font-mono">{activeDetailCourse.progressPercentage}%</span>
                </div>
                <div className={`h-2.5 rounded-full w-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${activeDetailCourse.progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Schedule time-slot pills inside the course card */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2.5">Schedule Time Slots</span>
                <div className="flex flex-wrap gap-2">
                  {activeDetailCourse.scheduleSlots.map((slot, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                    >
                      <Calendar size={12} className="text-blue-500" /> {slot}
                    </span>
                  ))}
                </div>
              </div>

              {/* Topic timeline listing */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest font-mono mb-4">Topic Completion Checklist</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-700 shrink-0 text-xs font-bold">✓</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Topic 1: Introduction & Core Methodology</p>
                      <span className="text-[10px] text-slate-400 font-mono">Completed June 12, 2026</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-700 shrink-0 text-xs font-bold">✓</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Topic 2: Designing High-Fidelity Layout Components</p>
                      <span className="text-[10px] text-slate-400 font-mono">Completed June 20, 2026</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-700 shrink-0 text-xs font-bold">✓</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Topic 3: Responsive Spacing & Flex Grid Alignments</p>
                      <span className="text-[10px] text-slate-400 font-mono">Completed July 02, 2026</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      activeDetailCourse.progressPercentage >= 100 
                        ? 'bg-green-100 border border-green-200 text-green-700' 
                        : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-transparent'
                    }`}>{activeDetailCourse.progressPercentage >= 100 ? '✓' : ''}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Topic 4: Multi-Role State Management Structures</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {activeDetailCourse.progressPercentage >= 100 ? 'Completed July 10, 2026' : 'Pending Review'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* 5. BOTTOM TAB BAR WITH 5 ICONS + LABELS */}
      {/* Active tab is shown as a filled colored circle icon */}
      <footer className={`fixed bottom-0 left-0 right-0 z-40 border-t ${
        isDarkMode ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-200/60 shadow-lg'
      } py-2 shadow-xs`}>
        <div className="max-w-md mx-auto px-4 flex justify-between items-center">
          {/* Tab 1: Home */}
          <button
            id="student-tab-home"
            onClick={() => setActiveTab('home')}
            className="flex flex-col items-center gap-1 cursor-pointer w-14 group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'home' 
                ? 'bg-blue-600 text-white scale-110 shadow-md shadow-blue-200 dark:shadow-none' 
                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
            }`}>
              <HomeIcon size={18} />
            </div>
            <span className={`text-[9px] font-bold transition-colors ${
              activeTab === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
            }`}>
              Home
            </span>
          </button>

          {/* Tab 2: Dashboard */}
          <button
            id="student-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className="flex flex-col items-center gap-1 cursor-pointer w-14 group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600 text-white scale-110 shadow-md shadow-blue-200 dark:shadow-none' 
                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
            }`}>
              <LayoutDashboard size={18} />
            </div>
            <span className={`text-[9px] font-bold transition-colors ${
              activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
            }`}>
              Dashboard
            </span>
          </button>

          {/* Tab 3: Payment */}
          <button
            id="student-tab-payment"
            onClick={() => setActiveTab('payment')}
            className="flex flex-col items-center gap-1 cursor-pointer w-14 group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'payment' 
                ? 'bg-blue-600 text-white scale-110 shadow-md shadow-blue-200 dark:shadow-none' 
                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
            }`}>
              <CreditCard size={18} />
            </div>
            <span className={`text-[9px] font-bold transition-colors ${
              activeTab === 'payment' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
            }`}>
              Payment
            </span>
          </button>

          {/* Tab 4: Quiz */}
          <button
            id="student-tab-quiz"
            onClick={() => setActiveTab('quiz')}
            className="flex flex-col items-center gap-1 cursor-pointer w-14 group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'quiz' 
                ? 'bg-blue-600 text-white scale-110 shadow-md shadow-blue-200 dark:shadow-none' 
                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
            }`}>
              <HelpCircle size={18} />
            </div>
            <span className={`text-[9px] font-bold transition-colors ${
              activeTab === 'quiz' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
            }`}>
              Quiz
            </span>
          </button>

          {/* Tab 5: Progress */}
          <button
            id="student-tab-progress"
            onClick={() => setActiveTab('progress')}
            className="flex flex-col items-center gap-1 cursor-pointer w-14 group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'progress' 
                ? 'bg-blue-600 text-white scale-110 shadow-md shadow-blue-200 dark:shadow-none' 
                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
            }`}>
              <TrendingUp size={18} />
            </div>
            <span className={`text-[9px] font-bold transition-colors ${
              activeTab === 'progress' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
            }`}>
              Progress
            </span>
          </button>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* MODAL: WATCH GUIDE VIDEO MOCKUP */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-scale-in border border-slate-100 dark:border-slate-700">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold font-display">Video Walkthrough: Mobile Wallet Payments</span>
              <button onClick={() => setShowVideoModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            
            <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center text-center relative group p-6">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg group-hover:bg-blue-700 transition-all cursor-pointer">
                <Play size={24} className="ml-1" />
              </div>
              <p className="text-white text-xs font-bold mt-4">Visual guide on tuition fee bill settlements</p>
              <p className="text-slate-400 text-[10px] mt-1 font-mono">Duration: 2 mins 15 seconds • Board of Academics</p>
              
              {/* Fake playback control bar overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-between text-[10px] text-slate-300">
                <span className="font-mono">0:00 / 2:15</span>
                <div className="h-1 bg-slate-600 flex-1 mx-3 rounded-full overflow-hidden">
                  <div className="w-0 h-full bg-blue-600"></div>
                </div>
                <span className="font-mono">1080p HD</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-end border-t border-slate-100 dark:border-slate-850">
              <button 
                onClick={() => setShowVideoModal(false)} 
                className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                Close Video Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FEEDBACK SUBMIT */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-xl animate-scale-in border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base font-display">Submit Anonymous Feedback</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>

            {feedbackSuccess ? (
              <div className="py-6 text-center text-xs space-y-2">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-950/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 size={24} />
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Feedback Submitted Successfully!</p>
                <p className="text-slate-400">Prof. Dr. Tariq Mahmood and staff appreciate your insights.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Select Course Context</label>
                  <select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden">
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Your Message</label>
                  <textarea 
                    required
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Provide constructive feedback regarding topic pacing, curriculum material accessibility, or faculty teaching guidelines..."
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    type="button" 
                    onClick={() => setShowFeedbackModal(false)}
                    className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-semibold cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer transition-all"
                  >
                    Submit Feedback
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
