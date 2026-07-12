import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Calendar as CalendarIcon, 
  CalendarCheck, 
  User, 
  BookOpen, 
  Users, 
  UserMinus, 
  Plus, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Download, 
  Mail, 
  Phone, 
  ShieldAlert, 
  Key, 
  Linkedin, 
  Github, 
  Twitter, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  X,
  Search
} from 'lucide-react';
import { TrainerProfile, AttendanceRecord, StudentCourse, Quiz, QuizQuestion, QuizOption } from '../types';
import { portalApi } from '../lib/apiClient';
import { buildAttendanceRecords, buildClassDatesForRange } from '../lib/attendanceUtils';

interface TrainerPortalProps {
  onSwitchToStudent: () => void;
}

export default function TrainerPortal({ onSwitchToStudent }: TrainerPortalProps) {
  // Navigation tabs for trainer portal
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'attendance' | 'profile'>('dashboard');

  // Interactive Trainer States
  const [profile, setProfile] = useState<TrainerProfile>({
    fullName: 'Prof. Dr. Tariq Mahmood',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop',
    role: 'Senior IT Advisor & Faculty Lead',
    email: 'tariq.mahmood@pitb.gov.pk',
    employeeId: 'GOV-PK-2026-8942',
    phone: '+92 (300) 456-7890',
    bio: 'Senior Academic Consultant at Punjab Information Technology Board (PITB) & Professor of Computer Science. Helping shape Pakistan\'s youth skills curriculum.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/tariq-mahmood',
      github: 'https://github.com/tariq-pitb',
      twitter: ''
    }
  });

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<TrainerProfile>({ ...profile });
  const [showIdCard, setShowIdCard] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordState, setPasswordState] = useState({ current: '', new: '', confirm: '' });
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Active training courses assigned state (for interactive "+")
  interface TrainingSlot {
    id: string;
    courseName: string;
    batch: string;
    time: string;
    room: string;
    students: number;
  }
  const [assignedSlots, setAssignedSlots] = useState<TrainingSlot[]>([
    {
      id: 'slot-default-1',
      courseName: 'UI/UX Design Masterclass (PITB Registered)',
      batch: 'Batch 42-Lahore (B-42)',
      time: '10:00 AM - 01:00 PM',
      room: 'Lab 302, Arfa STP Lahore',
      students: 45
    },
    {
      id: 'slot-default-2',
      courseName: 'Advanced React & Next.js Frameworks',
      batch: 'Batch 40-Karachi (B-40)',
      time: '02:00 PM - 05:00 PM',
      room: 'CS-Lab 2, FAST Karachi',
      students: 55
    }
  ]);

  // Async API hooks and error handlers
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadTrainerData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [fetchedCourses, fetchedQuizzes] = await Promise.all([
        portalApi.getCourses('trainer'),
        portalApi.getQuizzes('trainer')
      ]);
      
      // Transform verified HEC courses into assigned slots representation
      const slots: TrainingSlot[] = fetchedCourses.map((course) => ({
        id: course.id,
        courseName: course.title,
        batch: course.batchNumber,
        time: course.scheduleSlots[0] || '10:00 AM - 01:00 PM',
        room: course.campus.includes('Arfa') ? 'Room 302, Arfa STP' : 'Lecturer Hall C',
        students: course.progressPercentage > 50 ? 55 : 45
      }));
      
      setAssignedSlots(slots);
      setQuizzes(fetchedQuizzes);
    } catch (err: any) {
      setApiError(err.message || 'HEC Central Ledger Database timed out.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTrainerData();
  }, []);

  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlot, setNewSlot] = useState({ courseName: '', batch: '', time: '', room: '', students: 15 });
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizBuilder, setQuizBuilder] = useState({
    title: '',
    courseId: 'course-1',
    totalQuestions: '1',
    timeLimitMinutes: '15',
    status: 'PUBLISHED'
  });
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: `q-${Date.now()}-1`,
      prompt: '',
      points: 1,
      options: [
        { id: `opt-${Date.now()}-1`, text: '', isCorrect: true },
        { id: `opt-${Date.now()}-2`, text: '', isCorrect: false }
      ]
    }
  ]);
  const [quizMessage, setQuizMessage] = useState<string | null>(null);

  const formatDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatLongDate = (date: Date) => date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Calendar state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<number | null>(new Date().getDate());

  // Attendance state
  const [selectedSlot, setSelectedSlot] = useState('all');
  const [attendanceView, setAttendanceView] = useState<'overall' | 'slot'>('overall');
  const [fromDate, setFromDate] = useState(() => formatDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [toDate, setToDate] = useState(() => formatDateInputValue(new Date()));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [checkedInRollsByDate, setCheckedInRollsByDate] = useState<Record<string, string[]>>({});
  const [qrScanInput, setQrScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const recordsPerPage = 5;

  // Mock student directory to populate attendance
  const mockStudents = [
    { name: 'Shayan Javed', roll: 'LHR-2026-1082' },
    { name: 'Muhammad Bilal Ahmed', roll: 'KHI-2026-1120' },
    { name: 'Aisha Fatima Sana', roll: 'ISB-2026-1505' },
    { name: 'Hamza Shehzad', roll: 'LHR-2026-1402' },
    { name: 'Zainab Bibi', roll: 'KHI-2026-1505' },
    { name: 'Syed Usman Ali', roll: 'ISB-2026-1601' },
    { name: 'Fatima Sana', roll: 'LHR-2026-1702' },
    { name: 'Saad Ahmed Siddiqui', roll: 'KHI-2026-1823' },
  ];

  const handleGenerateAttendance = () => {
    const scheduleSlots = selectedSlot === 'all'
      ? assignedSlots.map((slot: TrainingSlot) => slot.time)
      : [selectedSlot];

    const resolvedSlots = scheduleSlots.length > 0 ? scheduleSlots : ['Monday 10:00 AM - 01:00 PM'];

    const list = buildAttendanceRecords({
      students: mockStudents.map((student) => ({ name: student.name, rollNumber: student.roll })),
      slotLabel: selectedSlot === 'all' ? resolvedSlots[0] : selectedSlot,
      scheduleSlots: resolvedSlots,
      startDate: fromDate,
      endDate: toDate,
      checkedInRollsByDate,
      courseId: 'course-1'
    });

    setAttendanceRecords(list);
    setCurrentPage(1);
  };

  const handleClearAttendance = () => {
    setAttendanceRecords([]);
  };

  const handleQrScan = () => {
    const payload = qrScanInput.trim();
    if (!payload.startsWith('SCHOOL-QR|')) {
      setScanMessage('That code is not a valid school attendance QR payload.');
      return;
    }

    const parts = payload.split('|');
    if (parts.length < 4) {
      setScanMessage('The QR payload is incomplete.');
      return;
    }

    const [, rollNumber, , date] = parts;
    const selectedDate = date || toDate || formatDateInputValue(new Date());

    setCheckedInRollsByDate((prev: Record<string, string[]>) => ({
      ...prev,
      [selectedDate]: Array.from(new Set([...(prev[selectedDate] ?? []), rollNumber]))
    }));

    setAttendanceRecords((prev: AttendanceRecord[]) =>
      prev.map((record: AttendanceRecord) =>
        record.rollNumber === rollNumber && record.date === selectedDate
          ? { ...record, status: 'Present', lateMinutes: 0 }
          : record
      )
    );

    setScanMessage(`Checked in ${rollNumber} for ${selectedDate}.`);
    setQrScanInput('');
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.courseName || !newSlot.time) return;

    const slot: TrainingSlot = {
      id: `slot-${Date.now()}`,
      courseName: newSlot.courseName,
      batch: newSlot.batch || 'B-45',
      time: newSlot.time,
      room: newSlot.room || 'Room 302',
      students: newSlot.students || 12
    };

    setAssignedSlots([...assignedSlots, slot]);
    setShowAddSlotModal(false);
    setNewSlot({ courseName: '', batch: '', time: '', room: '', students: 15 });
  };

  const handleQuizQuestionChange = (questionId: string, field: 'prompt' | 'points', value: string | number) => {
    setQuizQuestions((prev) => prev.map((question) => question.id === questionId ? { ...question, [field]: field === 'points' ? Number(value) : value } : question));
  };

  const handleQuizOptionChange = (questionId: string, optionId: string, value: string) => {
    setQuizQuestions((prev) => prev.map((question) => question.id === questionId ? {
      ...question,
      options: question.options.map((option) => option.id === optionId ? { ...option, text: value } : option)
    } : question));
  };

  const handleQuizCorrectToggle = (questionId: string, optionId: string) => {
    setQuizQuestions((prev) => prev.map((question) => question.id === questionId ? {
      ...question,
      options: question.options.map((option) => ({ ...option, isCorrect: option.id === optionId }))
    } : question));
  };

  const addQuizQuestion = () => {
    setQuizQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        prompt: '',
        points: 1,
        options: [
          { id: `opt-${Date.now()}-1`, text: '', isCorrect: true },
          { id: `opt-${Date.now()}-2`, text: '', isCorrect: false }
        ]
      }
    ]);
  };

  const handlePublishQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdQuiz = await portalApi.createQuiz('trainer', {
        title: quizBuilder.title,
        courseId: quizBuilder.courseId,
        totalQuestions: Number(quizBuilder.totalQuestions || quizQuestions.length),
        timeLimitMinutes: Number(quizBuilder.timeLimitMinutes),
        questions: quizQuestions,
        status: quizBuilder.status
      });
      setQuizzes((prev) => [createdQuiz, ...prev]);
      setQuizBuilder({ title: '', courseId: 'course-1', totalQuestions: '1', timeLimitMinutes: '15', status: 'PUBLISHED' });
      setQuizQuestions([{ id: `q-${Date.now()}-1`, prompt: '', points: 1, options: [{ id: `opt-${Date.now()}-1`, text: '', isCorrect: true }, { id: `opt-${Date.now()}-2`, text: '', isCorrect: false }] }]);
      setQuizMessage('Quiz published successfully and is now available to your students.');
    } catch (error: any) {
      setQuizMessage(error.message || 'Quiz publishing failed.');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({ ...editForm });
    setIsEditingProfile(false);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordState.new !== passwordState.confirm) {
      alert("New passwords do not match!");
      return;
    }
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
      setPasswordState({ current: '', new: '', confirm: '' });
    }, 1500);
  };

  const getDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long' });

  const slotMatchesDay = (slotTime: string, targetDate: Date) => {
    const dayName = getDayName(targetDate).toLowerCase();
    const shortName = dayName.slice(0, 3);
    const candidate = slotTime.toLowerCase();
    return candidate.includes(dayName) || candidate.includes(shortName);
  };

  const todayIso = formatDateInputValue(new Date());
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const daysOfWeek = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      iso: formatDateInputValue(date),
      isToday: formatDateInputValue(date) === todayIso
    };
  });

  // Calendar calculation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const calendarYear = currentDate.getFullYear();
  const calendarMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDayIndex = getFirstDayOfMonth(calendarYear, calendarMonth);
  const monthStart = formatDateInputValue(new Date(calendarYear, calendarMonth, 1));
  const monthEnd = formatDateInputValue(new Date(calendarYear, calendarMonth + 1, 0));
  const scheduledCalendarDates = new Set(buildClassDatesForRange(monthStart, monthEnd, assignedSlots.map((slot: TrainingSlot) => slot.time)));
  const selectedDateLabel = selectedCalendarDate !== null
    ? formatDateInputValue(new Date(calendarYear, calendarMonth, selectedCalendarDate))
    : null;
  const selectedDateEvents = selectedDateLabel
    ? assignedSlots.filter((slot: TrainingSlot) => slotMatchesDay(slot.time, new Date(selectedDateLabel)))
    : [];

  const prevMonth = () => {
    setCurrentDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  // Filtered Attendance Records
  const filteredAttendance = attendanceRecords.filter((rec: AttendanceRecord) => {
    const matchesSearch = rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rec.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSlot = selectedSlot === 'all' ? true : rec.slot === selectedSlot;
    return matchesSearch && matchesSlot;
  });

  // Pagination maths
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAttendance.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredAttendance.length / recordsPerPage) || 1;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans relative pb-16 md:pb-0">
      
      {/* Top Banner for Switching Roles (For previewers) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 z-50"></div>
      
      {/* LEFT SIDEBAR (Desktop: icon-only sidebar, fixed) */}
      <aside className="hidden md:flex flex-col items-center justify-between w-20 bg-white border-r border-slate-200/60 py-6 min-h-screen sticky top-0 shadow-xs z-20">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Institution Logo placeholder */}
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-base shadow-sm">
            ⭐
          </div>
          
          {/* Navigation Items (Icon-only) */}
          <nav className="flex flex-col gap-4 w-full px-2">
            <button
              id="trainer-nav-dashboard"
              onClick={() => setActiveTab('dashboard')}
              title="Dashboard"
              className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-50 text-emerald-700 shadow-2xs' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid size={22} />
            </button>
            <button
              id="trainer-nav-calendar"
              onClick={() => setActiveTab('calendar')}
              title="Calendar"
              className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'calendar' 
                  ? 'bg-emerald-50 text-emerald-700 shadow-2xs' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CalendarIcon size={22} />
            </button>
            <button
              id="trainer-nav-attendance"
              onClick={() => setActiveTab('attendance')}
              title="Attendance"
              className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'attendance' 
                  ? 'bg-emerald-50 text-emerald-700 shadow-2xs' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CalendarCheck size={22} />
            </button>
            <button
              id="trainer-nav-profile"
              onClick={() => setActiveTab('profile')}
              title="Profile"
              className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-emerald-50 text-emerald-700 shadow-2xs' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User size={22} />
            </button>
          </nav>
        </div>

        {/* Bottom Avatar + Role Quick Switch */}
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={() => setActiveTab('profile')}
            className="w-10 h-10 rounded-full border-2 border-blue-100 overflow-hidden hover:border-blue-500 transition-all shadow-xs cursor-pointer"
          >
            <img src={profile.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
          </button>
          
          <button 
            onClick={onSwitchToStudent}
            title="Switch to Student Portal"
            className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap cursor-pointer"
          >
            Student Portal
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER (with hamburger menu or active indicators) */}
      <header className="md:hidden bg-white border-b border-slate-200/60 px-4 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            T
          </div>
          <span className="font-semibold text-slate-800 text-sm">Trainer View</span>
        </div>
        
        {/* Navigation Indicators / Icons for Mobile Row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === 'calendar' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
          >
            <CalendarIcon size={18} />
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === 'attendance' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
          >
            <CalendarCheck size={18} />
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
          >
            <User size={18} />
          </button>
          
          <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
          
          <button 
            onClick={onSwitchToStudent}
            className="text-xs font-semibold bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition-all shadow-xs cursor-pointer"
          >
            Student
          </button>
        </div>
      </header>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* SUPABASE STATUS BAR */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs shadow-3xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <span className="font-bold text-slate-700">SUPABASE LIVE SYNC: ACTIVE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-[10px]">Trainer schedules and attendance are synced from your connected backend.</span>
            <button
              onClick={() => void loadTrainerData()}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all text-[11px]"
            >
              Refresh Ledger
            </button>
          </div>
        </div>

        {apiError && (
          <div className="p-5 rounded-2xl border border-red-200 bg-red-50 text-red-950 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="animate-bounce shrink-0" size={18} />
              <h3 className="font-bold font-display text-sm">Synchronized Syllabus Checksum Mismatch</h3>
            </div>
            <p className="text-[11px] font-mono leading-relaxed">{apiError}</p>
            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => void loadTrainerData()}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all"
              >
                Retry Dispatch
              </button>
            </div>
          </div>
        )}

        {/* TOP STATUS BAR (Dynamic Context) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900 tracking-tight capitalize">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'calendar' && 'Calendar'}
              {activeTab === 'attendance' && 'Attendance'}
              {activeTab === 'profile' && 'My Profile'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as {profile.fullName} ({profile.employeeId}) • {formatLongDate(new Date())}
            </p>
          </div>

          {/* PAGE SPECIFIC ACTION BUTTONS (Top Right) */}
          <div className="w-full md:w-auto flex items-center justify-end gap-2">
            {activeTab === 'attendance' && (
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Slot:</span>
                <select 
                  id="trainer-slot-select"
                  value={selectedSlot}
                  onChange={(e) => {
                    setSelectedSlot(e.target.value);
                    setAttendanceRecords([]); // Reset to show empty state when slot changes to allow mock toggle
                  }}
                  className="text-xs font-semibold text-slate-700 bg-transparent border-none focus:outline-hidden focus:ring-0 cursor-pointer"
                >
                  <option value="all">Choose a slot (All)</option>
                  <option value="Mon/Wed 09:00 AM - 12:00 PM">Mon/Wed Morning</option>
                  <option value="Tue/Thu 02:00 PM - 05:00 PM">Tue/Thu Afternoon</option>
                  <option value="Friday 06:00 PM - 09:00 PM">Friday Evening</option>
                </select>
              </div>
            )}
            
            {activeTab === 'dashboard' && (
              <button
                onClick={() => setShowAddSlotModal(true)}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> Assign Slot
              </button>
            )}

            {activeTab === 'profile' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditForm({ ...profile });
                    setIsEditingProfile(true);
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/60 font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 size={15} className="text-blue-600" /> Edit Profile
                </button>
                <button
                  onClick={() => setShowIdCard(true)}
                  className="bg-slate-950 hover:bg-slate-900 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={15} /> Download Card
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 1. TRAINER DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Active Courses */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-slate-900 font-display">
                    {assignedSlots.length || '0'}
                  </span>
                  <p className="text-sm font-medium text-slate-500 mt-1">Active Courses</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <BookOpen size={20} />
                </div>
              </div>

              {/* Card 2: Enrolled Students */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-slate-900 font-display">145</span>
                  <p className="text-sm font-medium text-slate-500 mt-1">Enrolled Students</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users size={20} />
                </div>
              </div>

              {/* Card 3: Dropout Students */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-slate-900 font-display">3</span>
                  <p className="text-sm font-medium text-slate-500 mt-1">Dropout Students</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <UserMinus size={20} />
                </div>
              </div>
            </div>

            {/* ACTIVE COURSES SECTION */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Active Courses</h2>
                {assignedSlots.length > 0 && (
                  <button 
                    onClick={() => setAssignedSlots([])}
                    className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                  >
                    Clear All Slots
                  </button>
                )}
              </div>

              {isLoading ? (
                /* Pulsing Skeleton state */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div 
                      key={`trainer-sk-${i}`}
                      className="border border-slate-200/60 p-4 rounded-xl flex items-center justify-between bg-white animate-pulse"
                    >
                      <div className="space-y-3 flex-1 pr-4">
                        <div className="h-4 bg-slate-150 rounded-md w-1/4"></div>
                        <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                        <div className="h-3 bg-slate-150 rounded-md w-1/2"></div>
                      </div>
                      <div className="w-16 h-8 bg-slate-150 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : assignedSlots.length === 0 ? (
                /* Bordered Empty-State Card */
                <div className="border border-dashed border-slate-200 rounded-xl py-12 px-4 flex flex-col items-center justify-center text-center bg-slate-50/50">
                  <button 
                    onClick={() => setShowAddSlotModal(true)}
                    className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-all cursor-pointer shadow-xs mb-3"
                  >
                    <Plus size={20} />
                  </button>
                  <p className="font-bold text-slate-800 text-sm">No training slots assigned</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    You currently have no active teaching course hours mapped. Click the plus button above or top-right to allocate a slot.
                  </p>
                </div>
              ) : (
                /* Interactive Assigned Slots List */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedSlots.map((slot) => (
                    <div key={slot.id} className="border border-slate-200/60 p-4 rounded-xl flex items-center justify-between bg-white hover:border-blue-200 hover:shadow-xs transition-all">
                      <div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{slot.batch}</span>
                        <h3 className="font-bold text-slate-800 text-sm mt-1">{slot.courseName}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                          <span className="flex items-center gap-1"><Clock size={12} /> {slot.time}</span>
                          <span>•</span>
                          <span>{slot.room}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-500 block">{slot.students} enrolled</span>
                        <button 
                          onClick={() => setAssignedSlots(assignedSlots.filter(s => s.id !== slot.id))}
                          className="text-[10px] text-red-500 hover:underline mt-2 inline-block cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TEACHING SCHEDULE CARD */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="text-blue-600" size={18} />
                <h2 className="text-lg font-semibold text-slate-800">Teaching Schedule</h2>
              </div>
              
              {/* Row of 7 Day Boxes */}
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((d, index) => (
                  <div 
                    key={`${d.iso}-${index}`} 
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                      d.isToday
                        ? 'bg-blue-50/50 border-2 border-blue-600 shadow-xs' 
                        : 'border border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-medium ${d.isToday ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                      {d.day}
                    </span>
                    <span className={`text-lg font-bold mt-1 font-display ${d.isToday ? 'text-blue-700' : 'text-slate-800'}`}>
                      {d.date}
                    </span>
                    {d.isToday && (
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5"></span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Scheduled slots for today:</span>
                <span className="text-xs font-bold text-slate-700">
                  {assignedSlots.length === 0 ? 'No slots scheduled' : `${assignedSlots.length} slots active today`}
                </span>
              </div>
            </div>

          </div>
        )}

        {/* 2. ATTENDANCE PAGE */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Row with Overall Stats label, date range, toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-2xs">
              <div>
                <span className="text-sm font-bold text-slate-800">Overall Stats</span>
                <p className="text-xs text-slate-400 font-mono">{fromDate || '2026-07-01'} to {toDate || '2026-07-11'}</p>
              </div>
              
              {/* Toggle with two tabs: "Overall" / "This Slot" */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  id="attendance-tab-overall"
                  onClick={() => setAttendanceView('overall')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    attendanceView === 'overall' 
                      ? 'bg-white text-slate-900 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Overall
                </button>
                <button
                  id="attendance-tab-thisslot"
                  onClick={() => setAttendanceView('slot')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    attendanceView === 'slot' 
                      ? 'bg-white text-slate-900 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  This Slot
                </button>
              </div>
            </div>

            {/* THREE STAT CARDS IN A ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Total Classes */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-slate-900 font-display">24</span>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Total Classes</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <CalendarIcon size={18} />
                </div>
              </div>

              {/* Card 2: Total Time Served */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-slate-900 font-display">72 Hrs</span>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Total Time Served</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Clock size={18} />
                </div>
              </div>

              {/* Card 3: Total Late Minutes */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-red-600 font-display">120 Mins</span>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Total Late Minutes</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <Clock size={18} />
                </div>
              </div>
            </div>

            {/* "From" / "To" DATE RANGE PICKER ROW */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">From:</span>
                    <input 
                      type="date" 
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">To:</span>
                    <input 
                      type="date" 
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <input 
                      type="text" 
                      placeholder="Search Student..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                  </div>
                  <button
                    onClick={handleGenerateAttendance}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Load Records
                  </button>
                  {attendanceRecords.length > 0 && (
                    <button
                      onClick={handleClearAttendance}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* QR CHECK-IN BAR */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">QR Check-In</h3>
                <p className="text-xs text-slate-400 mt-0.5">Scan a student QR code to mark attendance for the selected class date.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={qrScanInput}
                  onChange={(e) => setQrScanInput(e.target.value)}
                  placeholder="SCHOOL-QR|roll|course|date"
                  className="border border-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white min-w-[220px]"
                />
                <button
                  onClick={handleQrScan}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-all"
                >
                  Check In
                </button>
              </div>
            </div>
            {scanMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
                {scanMessage}
              </div>
            )}

            {/* RESULTS TABLE / LIST AREA */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
              {filteredAttendance.length === 0 ? (
                /* Bordered Empty Card */
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-dashed border-slate-200 mb-3">
                    <CalendarCheck size={20} />
                  </div>
                  <p className="font-bold text-slate-800 text-sm">No attendance records found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Please click "Load Records" above to generate and inspect mock school attendance data.
                  </p>
                  <button
                    onClick={handleGenerateAttendance}
                    className="mt-4 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold px-4 py-2 rounded-xl border border-blue-100 transition-all cursor-pointer shadow-2xs"
                  >
                    Quick Load Mock Data
                  </button>
                </div>
              ) : (
                /* Interactive Table list */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-semibold uppercase">
                        <th className="px-5 py-3">Student Name</th>
                        <th className="px-5 py-3">Roll Number</th>
                        <th className="px-5 py-3 font-mono">Date</th>
                        <th className="px-5 py-3">Slot Map</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {currentRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{rec.studentName}</td>
                          <td className="px-5 py-3.5 font-mono text-slate-500">{rec.rollNumber}</td>
                          <td className="px-5 py-3.5 text-slate-400 font-mono">{rec.date}</td>
                          <td className="px-5 py-3.5 text-slate-500 max-w-[180px] truncate" title={rec.slot}>
                            {rec.slot}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                rec.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                rec.status === 'Late' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                'bg-red-50 text-red-700 border border-red-100'
                              }`}>
                                {rec.status} {rec.status === 'Late' && `(${rec.lateMinutes}m)`}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <select 
                              value={rec.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'Present' | 'Late' | 'Absent';
                                  setAttendanceRecords(attendanceRecords.map(r => 
                                    r.id === rec.id ? { 
                                      ...r, 
                                      status: newStatus, 
                                      lateMinutes: newStatus === 'Late' ? 15 : 0 
                                    } : r
                                  ));
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-md text-[10px] p-1 font-semibold text-slate-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value="Present">Present</option>
                              <option value="Late">Late</option>
                              <option value="Absent">Absent</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAGINATION PANEL */}
              <div className="bg-white border-t border-slate-100 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  {filteredAttendance.length === 0 
                    ? 'Showing 0-0 of 0 records' 
                    : `Showing ${indexOfFirstRecord + 1}-${Math.min(indexOfLastRecord, filteredAttendance.length)} of ${filteredAttendance.length} records`
                  }
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={`p-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer ${
                      currentPage === 1 
                        ? 'opacity-40 cursor-not-allowed bg-slate-50' 
                        : 'bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  
                  <span className="text-xs font-bold text-blue-600 px-3 py-1 bg-blue-50 rounded-md font-mono">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={`p-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer ${
                      currentPage === totalPages 
                        ? 'opacity-40 cursor-not-allowed bg-slate-50' 
                        : 'bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 3. CALENDAR PAGE */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Calendar Container Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
              
              {/* Header: Month/Year navigation */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold font-display text-slate-800">
                  {monthNames[calendarMonth]} {calendarYear}
                </h2>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      const today = new Date();
                      setCurrentDate(today);
                      setSelectedCalendarDate(today.getDate());
                    }}
                    className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-all cursor-pointer font-mono"
                  >
                    Today
                  </button>
                  <button 
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day-of-week header row */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Date Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Empty cells before the 1st of the month */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square bg-slate-50/50 rounded-lg"></div>
                ))}

                {/* Date numbers */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dateNum = i + 1;
                  const dateValue = new Date(calendarYear, calendarMonth, dateNum);
                  const dateString = formatDateInputValue(dateValue);
                  const isCurrentDate = dateString === todayIso;
                  const isSelected = selectedCalendarDate === dateNum;
                  const hasSchedule = scheduledCalendarDates.has(dateString);

                  return (
                    <button
                      key={`day-${dateNum}`}
                      onClick={() => setSelectedCalendarDate(dateNum)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 transition-all relative cursor-pointer font-mono ${
                        isCurrentDate 
                          ? 'bg-blue-600 text-white font-bold shadow-xs hover:bg-blue-700' 
                          : isSelected 
                            ? 'border-2 border-blue-600 text-blue-600 font-bold bg-blue-50/20'
                            : 'bg-white border border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs self-start">{dateNum}</span>
                      
                      {/* marker for current date */}
                      {isCurrentDate && (
                        <span className="w-1.5 h-1.5 bg-white rounded-full mb-1"></span>
                      )}

                      {/* schedule marker */}
                      {hasSchedule && (
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mb-1"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Day details or schedule preview */}
              {selectedCalendarDate !== null && (
                <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200/60 animate-fade-in">
                  <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">
                    Schedule for {monthNames[calendarMonth]} {selectedCalendarDate}, {calendarYear}
                  </h3>
                  
                  <div className="mt-3 space-y-2">
                    {/* Event 1 */}
                    {(selectedCalendarDate === 11 || selectedCalendarDate % 3 === 0) ? (
                      <div className="bg-white p-3 rounded-lg border border-slate-200/60 flex items-center justify-between shadow-3xs">
                        <div className="flex items-center gap-3">
                          <span className="w-1.5 h-10 bg-blue-600 rounded-full"></span>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Advanced React Implementation</p>
                            <span className="text-[10px] text-slate-400 font-mono">Classroom 402 • 10:00 AM - 12:00 PM</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono">B-42</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No schedules or training blocks assigned for this date.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* 4. TRAINER PROFILE PAGE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Profile Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
              
              {/* Colored gradient banner strip */}
              <div className="h-28 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 relative"></div>
              
              {/* Avatar overlapping banner */}
              <div className="px-6 pb-6 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-4 -mt-12">
                <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
                    <img src={profile.avatarUrl} alt="Trainer Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="md:mb-2">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">{profile.fullName}</h2>
                    <span className="inline-block mt-1 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-semibold">
                      {profile.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid of details cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Card A: Personal Information */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 py-2 border-b border-slate-50">
                    <Mail className="text-blue-500" size={16} />
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Email Address</span>
                      <span className="text-xs font-bold text-slate-700">{profile.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-2 border-b border-slate-50">
                    <ShieldAlert className="text-blue-500" size={16} />
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Employee ID</span>
                      <span className="text-xs font-mono font-bold text-slate-700">{profile.employeeId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <Phone className="text-blue-500" size={16} />
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Phone Number</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">{profile.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card B: Security */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2">Security</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Maintain secure portal access. Update your credentials regularly to secure student records.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPasswordState({ current: '', new: '', confirm: '' });
                    setShowPasswordModal(true);
                  }}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs py-2.5 rounded-xl border border-blue-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Key size={15} /> Update Password
                </button>
              </div>

              {/* Card C: Bio */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm">Bio</h3>
                  <button 
                    onClick={() => {
                      setEditForm({ ...profile });
                      setIsEditingProfile(true);
                    }}
                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                {profile.bio ? (
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{profile.bio}</p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No bio added yet.</p>
                )}
              </div>

              {/* Card D: Social Links */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm">Social Links</h3>
                  <button 
                    onClick={() => {
                      setEditForm({ ...profile });
                      setIsEditingProfile(true);
                    }}
                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                
                {profile.socialLinks.linkedin || profile.socialLinks.github || profile.socialLinks.twitter ? (
                  <div className="flex flex-col gap-2 mt-2">
                    {profile.socialLinks.linkedin && (
                      <a href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-xs text-gray-700">
                        <span className="flex items-center gap-2"><Linkedin size={14} className="text-blue-500" /> LinkedIn</span>
                        <ExternalLink size={12} className="text-gray-400" />
                      </a>
                    )}
                    {profile.socialLinks.github && (
                      <a href={profile.socialLinks.github} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-xs text-gray-700">
                        <span className="flex items-center gap-2"><Github size={14} className="text-gray-700" /> GitHub</span>
                        <ExternalLink size={12} className="text-gray-400" />
                      </a>
                    )}
                    {profile.socialLinks.twitter && (
                      <a href={profile.socialLinks.twitter} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-xs text-gray-700">
                        <span className="flex items-center gap-2"><Twitter size={14} className="text-blue-400" /> Twitter</span>
                        <ExternalLink size={12} className="text-gray-400" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No social links added yet.</p>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* 5. SLIDE-OVER PANEL / MODAL FOR PROFILE EDITING */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200/80 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base font-display">Edit Trainer Profile</h3>
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Full Name</label>
                <input 
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Email Address</label>
                <input 
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Phone Number</label>
                <input 
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Employee ID</label>
                <input 
                  type="text"
                  value={editForm.employeeId}
                  onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-xs text-slate-400 cursor-not-allowed focus:outline-hidden font-mono"
                  disabled
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Biography</label>
                <textarea 
                  rows={3}
                  value={editForm.bio}
                  placeholder="Tell students about your academic background..."
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/50"
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2 font-mono">Social Profiles</span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Linkedin size={14} className="text-slate-400" />
                    <input 
                      type="text"
                      placeholder="LinkedIn URL"
                      value={editForm.socialLinks.linkedin || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        socialLinks: { ...editForm.socialLinks, linkedin: e.target.value } 
                      })}
                      className="flex-1 border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Github size={14} className="text-slate-400" />
                    <input 
                      type="text"
                      placeholder="GitHub Profile URL"
                      value={editForm.socialLinks.github || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        socialLinks: { ...editForm.socialLinks, github: e.target.value } 
                      })}
                      className="flex-1 border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter size={14} className="text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Twitter URL"
                      value={editForm.socialLinks.twitter || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        socialLinks: { ...editForm.socialLinks, twitter: e.target.value } 
                      })}
                      className="flex-1 border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN SLOT */}
      {showAddSlotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200/80 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base font-display">Assign Course Slot</h3>
              <button 
                onClick={() => setShowAddSlotModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Course Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Masterclass in UX Research"
                  value={newSlot.courseName}
                  onChange={(e) => setNewSlot({ ...newSlot, courseName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Batch Code</label>
                  <input 
                    type="text"
                    placeholder="e.g. B-45"
                    value={newSlot.batch}
                    onChange={(e) => setNewSlot({ ...newSlot, batch: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50/50 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Room No.</label>
                  <input 
                    type="text"
                    placeholder="e.g. Lab 202"
                    value={newSlot.room}
                    onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50/50 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Timing Slot</label>
                <select 
                  required
                  value={newSlot.time}
                  onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-hidden bg-slate-50/50 transition-all cursor-pointer font-semibold text-slate-600"
                >
                  <option value="">Select Class Duration</option>
                  <option value="Mon/Wed 09:00 AM - 12:00 PM">Mon/Wed (09:00 - 12:00)</option>
                  <option value="Tue/Thu 02:00 PM - 05:00 PM">Tue/Thu (14:00 - 17:00)</option>
                  <option value="Friday 06:00 PM - 09:00 PM">Friday (18:00 - 21:00)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOWNLOAD CARD (MOCK VISUAL SPEC) */}
      {showIdCard && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200/80 animate-scale-in text-center">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase font-mono">Trainer ID Card</span>
              <button onClick={() => setShowIdCard(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"><X size={18} /></button>
            </div>
            
            {/* The Badge Container */}
            <div id="trainer-printable-id-card" className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden p-6 mx-auto max-w-[280px]">
              <div className="bg-blue-600 text-white py-3 rounded-xl mb-4">
                <h4 className="font-bold text-sm tracking-wider uppercase font-display">School Portal</h4>
                <p className="text-[9px] uppercase tracking-widest opacity-80 font-mono">Official Faculty ID</p>
              </div>
              
              <div className="w-20 h-20 rounded-full mx-auto overflow-hidden border-2 border-blue-100 mb-3 shadow-xs">
                <img src={profile.avatarUrl} alt="Trainer" className="w-full h-full object-cover" />
              </div>

              <h5 className="font-bold text-base text-slate-800 font-display">{profile.fullName}</h5>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mt-1.5 inline-block">
                {profile.role}
              </span>

              <div className="mt-4 border-t border-slate-100 pt-3 text-left space-y-1.5 text-[10px] text-slate-500">
                <div className="flex justify-between"><span className="font-semibold">ID No:</span><span className="font-mono font-bold text-slate-700">{profile.employeeId}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Email:</span><span className="text-slate-700 font-medium">{profile.email}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Mobile:</span><span className="text-slate-700 font-mono font-medium">{profile.phone}</span></div>
              </div>

              <div className="mt-4 border-t border-dashed border-slate-200 pt-3">
                <div className="w-32 h-6 bg-slate-50 mx-auto rounded-xs flex items-center justify-center font-mono text-[9px] tracking-widest text-slate-400">
                  ||||| | ||||| | ||
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
              Click print or download below to acquire a mock high-resolution card.
            </p>

            <div className="flex items-center gap-2 mt-4">
              <button 
                onClick={() => alert("Simulating card generation... Saved TrainerCard.pdf to system!")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download size={14} /> Download PDF
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2 rounded-xl cursor-pointer transition-colors"
              >
                Print Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SECURITY / PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200/80 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base font-display">Update Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"><X size={18} /></button>
            </div>

            {passwordSuccess ? (
              <div className="py-6 text-center text-xs space-y-2">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle size={24} />
                </div>
                <p className="font-bold text-slate-800 font-display">Password Updated Successfully!</p>
                <p className="text-slate-400">Your portal security credentials have been updated.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Current Password</label>
                  <input 
                    type="password"
                    required
                    value={passwordState.current}
                    onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">New Password</label>
                  <input 
                    type="password"
                    required
                    value={passwordState.new}
                    onChange={(e) => setPasswordState({ ...passwordState, new: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Confirm New Password</label>
                  <input 
                    type="password"
                    required
                    value={passwordState.confirm}
                    onChange={(e) => setPasswordState({ ...passwordState, confirm: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50/50 transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setShowPasswordModal(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    Change Password
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
