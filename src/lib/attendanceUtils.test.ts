import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAttendanceRecords, buildClassDatesForRange, createQrPayload } from './attendanceUtils';

test('buildClassDatesForRange only includes scheduled weekdays', () => {
  const dates = buildClassDatesForRange('2026-07-01', '2026-07-10', ['Monday 10:00 AM - 01:00 PM', 'Wednesday 10:00 AM - 01:00 PM']);
  assert.deepEqual(dates, ['2026-07-01', '2026-07-06', '2026-07-08']);
});

test('buildAttendanceRecords marks scanned students present and leaves unscheduled days out', () => {
  const records = buildAttendanceRecords({
    students: [{ name: 'A', rollNumber: 'R1' }],
    slotLabel: 'Monday 10:00 AM - 01:00 PM',
    scheduleSlots: ['Monday 10:00 AM - 01:00 PM'],
    startDate: '2026-07-06',
    endDate: '2026-07-06',
    checkedInRollsByDate: { '2026-07-06': ['R1'] }
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].status, 'Present');
  assert.equal(records[0].date, '2026-07-06');
});

test('createQrPayload includes student, course and date context', () => {
  const payload = createQrPayload('R1', 'course-1', '2026-07-01');
  assert.match(payload, /^SCHOOL-QR\|R1\|course-1\|2026-07-01$/);
});
