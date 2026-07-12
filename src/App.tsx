import React, { useState, useEffect } from 'react';
import TrainerPortal from './components/TrainerPortal';
import StudentPortal from './components/StudentPortal';
import { motion } from 'motion/react';
import { 
  User, 
  School, 
  Sparkles, 
  HelpCircle, 
  Clock, 
  Globe, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Bell,
  X
} from 'lucide-react';

export default function App() {
  // Global active role: 'landing' (selector), 'trainer' or 'student'
  const [role, setRole] = useState<'landing' | 'trainer' | 'student'>('landing');
  
  // Real-time PKT Date & Time Clock
  const [pktTime, setPktTime] = useState<string>('');
  
  // Real-time notifications state
  const [notifications, setNotifications] = useState<Array<{ id: number; text: string; time: string; type: 'info' | 'success' | 'alert' }>>([
    { id: 1, text: "HEC Pakistan: Autumn 2026 Registration Portal is online.", time: "Just Now", type: "success" },
    { id: 2, text: "BISE Lahore: Secondary Board practical marks are now editable.", time: "5 mins ago", type: "info" },
    { id: 3, text: "FAST NUCES: National Talent Hunt entry deadline set to July 31.", time: "15 mins ago", type: "info" },
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  // Verification widget state
  const [verificationInput, setVerificationInput] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');
  const [verifiedRecord, setVerifiedRecord] = useState<any | null>(null);

  // Mock Pakistani Education Registry Database
  const verifiedDatabase: Record<string, any> = {
    'LHR-2026-1082': {
      studentName: 'Shayan Javed',
      fatherName: 'Muhammad Javed Iqbal',
      board: 'Punjab Information Technology Board (PITB)',
      institution: 'Arfa Software Technology Park Campus, Lahore',
      course: 'UI/UX Design Masterclass',
      batch: 'Batch 42-Lahore (B-42)',
      enrolledStatus: 'ENROLLED',
      attendance: '15 / 24 Classes (62%)',
      voucherStatus: 'PAID (Verified via Easypaisa)',
      gradePoint: 'Active Term (3.85 GPA Class Rank-A)',
      digitalSeal: 'PITB-SEC-9923'
    },
    'KHI-2026-1120': {
      studentName: 'Muhammad Bilal Ahmed',
      fatherName: 'Ahmed Raza Siddiqui',
      board: 'FAST National University of Computer & Emerging Sciences',
      institution: 'FAST-NUCES Main Campus, Karachi',
      course: 'Advanced React & Next.js Frameworks',
      batch: 'Batch 40-Karachi (B-40)',
      enrolledStatus: 'COMPLETED',
      attendance: '24 / 24 Classes (100%)',
      voucherStatus: 'PAID (Verified via JazzCash)',
      gradePoint: 'A+ (4.00 CGPA Gold medalist)',
      digitalSeal: 'HEC-FAST-KHI-4001'
    },
    'ISB-2026-1505': {
      studentName: 'Aisha Fatima Sana',
      fatherName: 'Sanaullah Khan',
      board: 'National University of Sciences & Technology (NUST)',
      institution: 'NUST School of Electrical Engineering & CS, Islamabad',
      course: 'Python & Artificial Intelligence',
      batch: 'Batch 43-Islamabad (B-43)',
      enrolledStatus: 'ENROLLED',
      attendance: '0 / 15 Classes (Pending Start)',
      voucherStatus: 'PAID (Verified via HBL Konnect)',
      gradePoint: 'Term Starts July 15, 2026',
      digitalSeal: 'NUST-SEECS-AI-7782'
    }
  };

  // Live Marquee items
  const marqueeItems = [
    "🇵🇰 PAKISTAN EDUCATION SYSTEM: HEC Degree Attestation online portal synchronized for Punjab, Sindh, KPK, Balochistan & Gilgit-Baltistan.",
    "📢 PITB UPDATE: National Vocational Database (NAVTTC) Batch 42 classes commenced on schedule.",
    "💼 FINTECH LINK: Pakistan Digital Board integrates Easypaisa, JazzCash, Nayapay & Sadapay for real-time voucher settlements.",
    "🎓 SCHOLARSHIP ALERT: Prime Minister's Digital Skills Laptop distribution details will be posted soon."
  ];

  // Tick the clock in Pakistan Standard Time (UTC+5)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Calculate UTC+5 for Pakistan Standard Time (PKT)
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const pktOffset = 5; 
      const pktDate = new Date(utc + (3600000 * pktOffset));
      
      const formatted = pktDate.toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setPktTime(formatted + " (PKT)");
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Periodic mock live notifications to simulate a "real-time website"
  useEffect(() => {
    const alertsList = [
      "New attendance sheet generated for FAST-Karachi Batch 40.",
      "Voucher VCH-9823101 cleared via Easypaisa Wallet.",
      "Dr. Tariq Mahmood scheduled new AI Assessment for Wednesday.",
      "Notice: 14th August Independence Day preparations finalized.",
      "Student Portal feedback system received feedback for UI/UX.",
    ];

    const interval = setInterval(() => {
      const randomAlert = alertsList[Math.floor(Math.random() * alertsList.length)];
      const now = new Date();
      const newNotification = {
        id: Date.now(),
        text: `Live Push: ${randomAlert}`,
        time: "Just Now",
        type: 'info' as const
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
      setNotificationCount(c => c + 1);
    }, 25000); // simulated real-time push notification every 25 seconds

    return () => clearInterval(interval);
  }, []);

  // Search verifier trigger
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInput.trim()) return;

    setVerificationStatus('searching');
    setTimeout(() => {
      const cleanedInput = verificationInput.trim().toUpperCase();
      if (verifiedDatabase[cleanedInput]) {
        setVerifiedRecord(verifiedDatabase[cleanedInput]);
        setVerificationStatus('found');
      } else {
        setVerifiedRecord(null);
        setVerificationStatus('not_found');
      }
    }, 1200); // Real-time server load simulation
  };

  // Framer motion variants for staggered child buttons
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 110,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* 1. TOP ANNOUNCEMENT MARQUEE (PAKISTANI CONTEXT) */}
      <div className="bg-emerald-900 text-emerald-50 text-[11px] py-1.5 border-b border-emerald-800 relative overflow-hidden z-40 shadow-xs">
        <div className="flex whitespace-nowrap animate-marquee">
          <div className="flex gap-16 shrink-0 font-medium">
            {marqueeItems.map((item, idx) => (
              <span key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {item}
              </span>
            ))}
          </div>
          <div className="flex gap-16 shrink-0 font-medium" aria-hidden="true">
            {marqueeItems.map((item, idx) => (
              <span key={`dup-${idx}`} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME LANDING HEADER */}
      {role === 'landing' && (
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 md:px-8 py-3 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* National Crest Design Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center font-bold text-lg border border-emerald-700/30">
                ⭐
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-bold tracking-widest font-mono block uppercase">Government of Pakistan</span>
                <span className="text-sm font-bold font-display text-slate-800 leading-tight">National digital Academic & Skill Portal</span>
              </div>
            </div>

            {/* PKT Clock & Notification Bell */}
            <div className="flex items-center gap-4">
              {/* PKT Ticking Clock */}
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl text-xs text-slate-500 font-medium font-mono">
                <Clock size={13} className="text-emerald-600" />
                <span>{pktTime || 'Loading PKT...'}</span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotificationDropdown(!showNotificationDropdown);
                    setNotificationCount(0);
                  }}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer transition-all relative flex items-center justify-center"
                >
                  <Bell size={16} className="text-emerald-700" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                      {notificationCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-slate-200/80 shadow-lg p-3 z-50 animate-scale-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-emerald-800">Pak-Edu Live Updates</span>
                      <button onClick={() => setShowNotificationDropdown(false)} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
                    </div>
                    <div className="space-y-2.5 mt-2.5 max-h-60 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="text-[11px] p-2 bg-slate-50/80 rounded-lg border border-slate-100 flex gap-2">
                          <span className="text-xs shrink-0">🇵🇰</span>
                          <div className="space-y-0.5 flex-1">
                            <p className="text-slate-700 font-medium leading-tight">{notif.text}</p>
                            <span className="text-[9px] text-slate-400 font-mono block">{notif.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* LANDING PORTAL HOME VIEW */}
      {role === 'landing' && (
        <div className="flex-1 flex flex-col items-center p-4 md:p-8 max-w-6xl mx-auto w-full gap-8 my-auto py-12">
          
          {/* TOP INTRO HERO */}
          <div className="text-center max-w-3xl space-y-4 animate-fade-in">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono">
              ⭐ National Digital Skills Initiative
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display text-slate-900 tracking-tight leading-none">
              BISE, HEC & PITB <span className="text-emerald-700 underline decoration-amber-400 decoration-3">Digital Board Ledger</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Welcome to Pakistan's centralized Academic and Vocational Management System. 
              Manage training batch hours, verify tuition fee challans instantly, track real-time attendance logs, 
              and explore syllabus completion metrics for HEC-accredited courses.
            </p>
          </div>

          {/* TWO MAIN LAYOUT BLOCKS: STAGGERED SELECTOR & REGISTRY VERIFIER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full mt-4 items-stretch">
            
            {/* COLUMN 1: ROLE SELECTOR PANEL (STAGGERED ANIMATION) */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-6"
            >
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-700" />
                  Secured Portal Gateways
                </h2>
                <p className="text-xs text-slate-400">
                  Select your assigned regulatory role to enter your workspace dashboard.
                </p>
              </div>

              {/* Role Options List with staggered variants */}
              <div className="space-y-4 py-1">
                {/* Option A: Trainer */}
                <motion.button
                  variants={itemVariants}
                  id="role-select-trainer"
                  onClick={() => setRole('trainer')}
                  className="w-full flex items-center gap-4 p-4 border border-slate-200/60 rounded-xl bg-white text-left hover:border-emerald-600 hover:bg-emerald-50/10 hover:shadow-xs transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition-colors shrink-0">
                    <User size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-800">Faculty Trainer Portal</h3>
                      <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase">GOV-PK</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Manage PITB class schedules, mark daily attendance logs, and compile term assessments.
                    </p>
                  </div>
                </motion.button>

                {/* Option B: Student */}
                <motion.button
                  variants={itemVariants}
                  id="role-select-student"
                  onClick={() => setRole('student')}
                  className="w-full flex items-center gap-4 p-4 border border-slate-200/60 rounded-xl bg-white text-left hover:border-emerald-600 hover:bg-emerald-50/10 hover:shadow-xs transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-100 transition-colors shrink-0">
                    <School size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-800">Student Portal Dashboard</h3>
                      <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">BISE</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Track topic timelines, inspect approved Easypaisa receipts, and attempt assigned school quizzes.
                    </p>
                  </div>
                </motion.button>
              </div>

              {/* Informational badge */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Globe size={11} className="text-emerald-700 animate-spin-slow" />
                  National Core Registry Online
                </span>
                <span className="font-mono">IP: 182.178.X.X (NTC Islamabad)</span>
              </div>
            </motion.div>

            {/* COLUMN 2: PAKISTAN DIGITAL CREDENTIAL VERIFIER (REAL-TIME REGISTRY SEARCH) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 md:p-8 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
              {/* Crescent background overlay */}
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-800/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-widest uppercase">Live Search Verification</span>
                  <h2 className="text-lg font-bold font-display flex items-center gap-1.5 text-white">
                    🇵🇰 HEC Academic Registry
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Verify mock students enrolled in our system instantly by their Board Roll ID.
                  </p>
                </div>

                {/* Form Search bar */}
                <form onSubmit={handleVerify} className="space-y-3">
                  <div className="relative">
                    <input 
                      type="text"
                      value={verificationInput}
                      onChange={(e) => setVerificationInput(e.target.value)}
                      placeholder="e.g. LHR-2026-1082, KHI-2026-1120"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-3 pr-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono transition-all"
                    />
                    <button type="submit" className="absolute right-2.5 top-2.5 text-emerald-400 hover:text-emerald-300">
                      <Search size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 items-center font-mono">
                    <span>Try:</span>
                    <button type="button" onClick={() => setVerificationInput('LHR-2026-1082')} className="underline hover:text-emerald-400">LHR-2026-1082 (PITB)</button>
                    <span>•</span>
                    <button type="button" onClick={() => setVerificationInput('KHI-2026-1120')} className="underline hover:text-emerald-400">KHI-2026-1120 (FAST)</button>
                  </div>
                </form>

                {/* Search result states */}
                <div className="pt-2">
                  {verificationStatus === 'searching' && (
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center py-6 gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
                      <p className="text-[11px] text-emerald-400 font-mono">Connecting Federal Education API Ledger...</p>
                    </div>
                  )}

                  {verificationStatus === 'not_found' && (
                    <div className="p-4 bg-red-950/20 rounded-xl border border-red-900/40 text-center text-xs text-red-300 space-y-1">
                      <AlertCircle size={18} className="mx-auto text-red-500 animate-bounce" />
                      <p className="font-bold">Invalid Board Ledger Key</p>
                      <p className="text-[10px] text-red-400/80">No verification matched. Ensure standard roll format is entered.</p>
                    </div>
                  )}

                  {verificationStatus === 'found' && verifiedRecord && (
                    <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-900/30 text-xs space-y-3 relative">
                      {/* Certified Stamp */}
                      <div className="absolute right-3 top-3 border-2 border-dashed border-emerald-400/40 text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest px-1.5 py-0.5 rounded transform rotate-12">
                        HEC VERIFIED
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-emerald-400 uppercase block">Government of Pakistan Registered Marks Ledger</span>
                        <h4 className="font-bold text-slate-100 text-sm">{verifiedRecord.studentName}</h4>
                        <p className="text-[10px] text-slate-400">Father: {verifiedRecord.fatherName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-300">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-mono">Board System</span>
                          <span className="font-medium truncate block" title={verifiedRecord.board}>{verifiedRecord.board.split(' ')[0]} Board</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-mono">Affiliated Course</span>
                          <span className="font-medium truncate block">{verifiedRecord.course}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-mono">Easypaisa/JazzCash Fee</span>
                          <span className="text-emerald-400 font-bold font-mono">{verifiedRecord.voucherStatus.split(' ')[0]} challan</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-mono">Performance Index</span>
                          <span className="font-bold text-amber-400 font-mono">{verifiedRecord.gradePoint.split(' ')[0]}</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/80 p-2 rounded-lg text-[9px] text-slate-400 font-mono flex justify-between items-center">
                        <span>Digital Seal: {verifiedRecord.digitalSeal}</span>
                        <span className="text-emerald-400">✓ Cryptographic Audit Ok</span>
                      </div>
                    </div>
                  )}

                  {verificationStatus === 'idle' && (
                    <div className="p-4 border border-slate-800 bg-slate-900/40 rounded-xl text-center text-xs text-slate-500 py-6">
                      <BookOpen size={18} className="mx-auto mb-2 text-slate-600" />
                      Enter student Roll Number to preview their live database verified transcript.
                    </div>
                  )}
                </div>
              </div>

              {/* National symbols list */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>🇵🇰 HEC Board Ledger</span>
                <span>Audit: SHA-256 Hash Verified</span>
              </div>
            </div>

          </div>

          {/* PERSISTENT HELP ACCREDITATION BANNER */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-xs gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                ⭐
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Higher Education Commission (HEC) of Pakistan Compliance</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  This system complies with the national accreditation parameters for technical and vocational program registries.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-50 py-1.5 px-3 rounded-full border border-slate-200 text-[10px] text-slate-500 shadow-3xs font-medium">
              <HelpCircle size={13} className="text-emerald-700 shrink-0" />
              <span>Toggle roles anytime using the header portal anchors.</span>
            </div>
          </div>

        </div>
      )}

      {/* TRAINER VIEW */}
      {role === 'trainer' && (
        <TrainerPortal onSwitchToStudent={() => setRole('student')} />
      )}

      {/* STUDENT VIEW */}
      {role === 'student' && (
        <StudentPortal onSwitchToTrainer={() => setRole('trainer')} />
      )}

      {/* DYNAMIC ROLE WATERMARK SWITCHER FOR EASY IN-APP NAVIGATION */}
      {role !== 'landing' && (
        <div className="fixed bottom-4 right-4 z-50 print:hidden hidden md:block">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white p-2.5 rounded-xl shadow-lg flex items-center gap-3">
            <div className="flex items-center gap-1.5 pl-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-300 font-mono tracking-widest uppercase">PK PORTAL SYSTEM</span>
            </div>
            <button
              onClick={() => setRole(role === 'trainer' ? 'student' : 'trainer')}
              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-700 text-emerald-50 rounded-lg hover:bg-emerald-600 transition-all shadow-2xs cursor-pointer border border-emerald-600"
            >
              Switch to {role === 'trainer' ? 'Student Dashboard' : 'Trainer Portal'}
            </button>
            <button
              onClick={() => setRole('landing')}
              className="p-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-md transition-all text-[11px] font-medium cursor-pointer"
              title="Return to Welcome Screen"
            >
              Exit to Home
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL FOOTER */}
      {role === 'landing' && (
        <footer className="bg-slate-900 text-slate-400 text-center py-6 text-xs border-t border-slate-800 font-mono w-full">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>© 2026 Ministry of Federal Education & Vocational Training, Pakistan.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-emerald-400 transition-colors">HEC Registry</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">PITB Digital</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">NAVTTC Portal</a>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}
