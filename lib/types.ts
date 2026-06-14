export interface Profile {
  id: string;
  full_name: string;
  school_name: string | null;
  created_at: string;
}

export interface LessonSlot {
  id: string;
  teacher_id: string;
  name: string; // e.g., "1. Ders", "2. Ders"
  start_time: string; // "HH:MM:SS" or "HH:MM"
  end_time: string; // "HH:MM:SS" or "HH:MM"
  order_index: number;
  created_at?: string;
}

export interface TeacherSchedule {
  id: string;
  teacher_id: string;
  day_of_week: number; // 1 = Monday, 5 = Friday
  slot_id: string;
  subject: string | null;
  classroom: string | null;
  created_at?: string;
}

export interface BellSettings {
  teacher_id: string;
  sound_type: 'classic' | 'melodic' | 'digital' | 'synth';
  volume: number; // 0.0 to 1.0
  vibrate: boolean;
  ring_duration: number; // seconds
  ring_on_start: boolean;
  ring_on_end: boolean;
  updated_at?: string;
}

export interface ScheduleItemWithSlot extends TeacherSchedule {
  lesson_slots: LessonSlot;
}
