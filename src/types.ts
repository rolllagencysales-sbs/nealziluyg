export type DayName = 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma';

export interface LessonSlot {
  id: number;
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface TimetableCell {
  lessonName: string;   // e.g. "MAT", "TDT"
  classTeacher: string; // e.g. "ÖZK" or "S.TÜ F"
}

// Maps each day to 8 slots (index 0 to 7 represents lesson 1 to 8)
export type Timetable = Record<DayName, TimetableCell[]>;

export interface TeacherAccount {
  email: string;
  fullName: string;
  schoolName?: string;
  timetable: Timetable;
  lessonSlots: LessonSlot[];
}

export interface LogEntry {
  id: string;
  timestamp: string; // HH:MM:SS
  type: 'start' | 'end' | 'system';
  message: string;
  lessonName?: string;
}
