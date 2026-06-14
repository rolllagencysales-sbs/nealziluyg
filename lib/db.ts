import { supabase } from './supabase';
import { LessonSlot, TeacherSchedule, BellSettings } from './types';

// Helper to check if a string is a valid UUID
const isValidUUID = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

// --- LESSON SLOTS ---

export async function getLessonSlots(userId: string, isDemo: boolean): Promise<LessonSlot[]> {
  if (isDemo) {
    const data = localStorage.getItem(`slots_${userId}`);
    return data ? JSON.parse(data) : [];
  }

  const { data, error } = await supabase
    .from('lesson_slots')
    .select('*')
    .eq('teacher_id', userId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching lesson slots:', error);
    return [];
  }
  return data || [];
}

export async function saveLessonSlots(userId: string, slots: LessonSlot[], isDemo: boolean): Promise<boolean> {
  if (isDemo) {
    localStorage.setItem(`slots_${userId}`, JSON.stringify(slots));
    return true;
  }

  // To prevent constraint errors, we can perform a transaction upsert or delete and re-insert
  // Supabase doesn't support easy transaction arrays in single queries unless we upsert
  // Since order_index and slots are managed, we can delete all existing and insert new, or upsert.
  // Deleting and inserting is simple and robust for user configurations.
  try {
    // Delete existing
    const { error: deleteError } = await supabase
      .from('lesson_slots')
      .delete()
      .eq('teacher_id', userId);

    if (deleteError) throw deleteError;

    if (slots.length === 0) return true;

    // Insert new (removing IDs if they are temporary client-side uuid to let postgres generate them, or keep them if they are valid uuid)
    const cleanedSlots = slots.map(s => {
      const copy = { ...s };
      if (!isValidUUID(copy.id)) {
        // Let DB generate UUID
        delete (copy as any).id;
      }
      return copy;
    });

    const { error: insertError } = await supabase
      .from('lesson_slots')
      .insert(cleanedSlots);

    if (insertError) throw insertError;
    return true;
  } catch (e) {
    console.error('Error saving lesson slots:', e);
    return false;
  }
}

// --- TEACHER SCHEDULE ---

export async function getTeacherSchedule(userId: string, isDemo: boolean): Promise<TeacherSchedule[]> {
  if (isDemo) {
    const data = localStorage.getItem(`schedule_${userId}`);
    return data ? JSON.parse(data) : [];
  }

  const { data, error } = await supabase
    .from('teacher_schedule')
    .select('*')
    .eq('teacher_id', userId);

  if (error) {
    console.error('Error fetching teacher schedule:', error);
    return [];
  }
  return data || [];
}

export async function saveTeacherSchedule(
  userId: string, 
  scheduleItems: Omit<TeacherSchedule, 'id'>[], 
  isDemo: boolean
): Promise<boolean> {
  if (isDemo) {
    const mapped = scheduleItems.map((item, idx) => ({
      ...item,
      id: `sch_${idx}_${Date.now()}`
    }));
    localStorage.setItem(`schedule_${userId}`, JSON.stringify(mapped));
    return true;
  }

  try {
    // Clear existing schedule and rewrite (simple bulk save)
    const { error: deleteError } = await supabase
      .from('teacher_schedule')
      .delete()
      .eq('teacher_id', userId);

    if (deleteError) throw deleteError;

    if (scheduleItems.length === 0) return true;

    const { error: insertError } = await supabase
      .from('teacher_schedule')
      .insert(scheduleItems);

    if (insertError) throw insertError;
    return true;
  } catch (e) {
    console.error('Error saving schedule:', e);
    return false;
  }
}

// --- BELL SETTINGS ---

export async function getBellSettings(userId: string, isDemo: boolean): Promise<BellSettings> {
  const defaultSettings: BellSettings = {
    teacher_id: userId,
    sound_type: 'classic',
    volume: 1.0,
    vibrate: true,
    ring_duration: 8,
    ring_on_start: true,
    ring_on_end: true,
  };

  if (isDemo) {
    const data = localStorage.getItem(`settings_${userId}`);
    return data ? JSON.parse(data) : defaultSettings;
  }

  const { data, error } = await supabase
    .from('bell_settings')
    .select('*')
    .eq('teacher_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Record not found, insert default settings
      const { data: newSettings, error: insertError } = await supabase
        .from('bell_settings')
        .insert([defaultSettings])
        .select()
        .single();
      
      if (!insertError && newSettings) {
        return newSettings;
      }
    }
    console.error('Error fetching bell settings:', error);
    return defaultSettings;
  }
  return data;
}

export async function saveBellSettings(userId: string, settings: BellSettings, isDemo: boolean): Promise<boolean> {
  if (isDemo) {
    localStorage.setItem(`settings_${userId}`, JSON.stringify(settings));
    return true;
  }

  const { error } = await supabase
    .from('bell_settings')
    .upsert({
      ...settings,
      teacher_id: userId,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving settings:', error);
    return false;
  }
  return true;
}
