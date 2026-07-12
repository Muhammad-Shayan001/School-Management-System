export interface AttendanceStudent {
  name: string;
  rollNumber: string;
}

export interface AttendanceBuildInput {
  students: AttendanceStudent[];
  slotLabel: string;
  scheduleSlots: string[];
  startDate: string;
  endDate: string;
  checkedInRollsByDate?: Record<string, string[]>;
  courseId?: string;
}

export interface AttendanceRecordLike {
  id: string;
  studentName: string;
  rollNumber: string;
  date: string;
  status: 'Present' | 'Late' | 'Absent';
  lateMinutes: number;
  slot: string;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function matchesScheduleSlot(slot: string, dayName: string): boolean {
  const normalizedSlot = slot.toLowerCase();
  const normalizedDay = dayName.toLowerCase();
  const longDay = normalizedDay;
  const shortDay = normalizedDay.slice(0, 3);

  return normalizedSlot.includes(longDay) || normalizedSlot.includes(shortDay);
}

export function buildClassDatesForRange(startDate: string, endDate: string, scheduleSlots: string[]): string[] {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const days: string[] = [];

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const currentDate = formatDate(cursor);
    const dayName = getDayName(cursor);
    const matchesSlot = scheduleSlots.some((slot) => matchesScheduleSlot(slot, dayName));
    if (matchesSlot) {
      days.push(currentDate);
    }
  }

  return days;
}

export function buildAttendanceRecords(input: AttendanceBuildInput): AttendanceRecordLike[] {
  const classDates = buildClassDatesForRange(input.startDate, input.endDate, input.scheduleSlots);
  const checkedInRollsByDate = input.checkedInRollsByDate ?? {};

  return classDates.flatMap((classDate) => {
    const checkedInRolls = checkedInRollsByDate[classDate] ?? [];
    return input.students.map((student) => {
      const checkedIn = checkedInRolls.includes(student.rollNumber);
      const status: AttendanceRecordLike['status'] = checkedIn ? 'Present' : 'Absent';
      return {
        id: `${classDate}-${student.rollNumber}`,
        studentName: student.name,
        rollNumber: student.rollNumber,
        date: classDate,
        status,
        lateMinutes: checkedIn ? 0 : 0,
        slot: input.slotLabel
      };
    });
  });
}

export function createQrPayload(rollNumber: string, courseId: string, date: string): string {
  return `SCHOOL-QR|${rollNumber}|${courseId}|${date}`;
}
