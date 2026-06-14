'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import { getLessonSlots, saveLessonSlots, getTeacherSchedule, saveTeacherSchedule } from '@/lib/db';
import { LessonSlot, TeacherSchedule } from '@/lib/types';
import { 
  Plus, Trash2, Save, Calendar, Clock, Edit3, 
  Trash, ChevronRight, BookOpen, MapPin, CheckCircle
} from 'lucide-react';
import styles from './page.module.css';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Pazartesi' },
  { id: 2, name: 'Salı' },
  { id: 3, name: 'Çarşamba' },
  { id: 4, name: 'Perşembe' },
  { id: 5, name: 'Cuma' },
  { id: 6, name: 'Cumartesi' },
  { id: 7, name: 'Pazar' }
];

export default function Schedule() {
  const router = useRouter();
  const { user, loading: authLoading, isDemoMode } = useAuth();

  // Dual tab state: 'grid' (Timetable) vs 'slots' (Bell hours)
  const [activeTab, setActiveTab] = useState<'grid' | 'slots'>('grid');

  // Loaded database states
  const [slots, setSlots] = useState<LessonSlot[]>([]);
  const [schedule, setSchedule] = useState<TeacherSchedule[]>([]);

  // Editing states (slots)
  const [editedSlots, setEditedSlots] = useState<LessonSlot[]>([]);
  
  // Editing states (schedule cell details)
  const [editingCell, setEditingCell] = useState<{
    dayOfWeek: number;
    slotId: string;
    subject: string;
    classroom: string;
  } | null>(null);

  // Status flags
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showWeekend, setShowWeekend] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Redirect if unauthorized
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load schedule and slots
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      const fetchedSlots = await getLessonSlots(user.id, isDemoMode);
      const fetchedSchedule = await getTeacherSchedule(user.id, isDemoMode);

      setSlots(fetchedSlots);
      setEditedSlots(fetchedSlots);
      setSchedule(fetchedSchedule);
      setLoading(false);
    };

    loadData();
  }, [user, isDemoMode]);

  // Trigger temporary notification toast
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // --- SLOT HOURS MANAGEMENT ACTIONS ---

  const addSlot = () => {
    const nextIndex = editedSlots.length + 1;
    // Guess start time based on last slot end time + 10 mins recess
    let newStart = '08:30';
    let newEnd = '09:10';

    if (editedSlots.length > 0) {
      const lastSlot = editedSlots[editedSlots.length - 1];
      const parts = lastSlot.end_time.split(':');
      const date = new Date();
      date.setHours(parseInt(parts[0]), parseInt(parts[1]) + 10, 0);
      
      const startH = String(date.getHours()).padStart(2, '0');
      const startM = String(date.getMinutes()).padStart(2, '0');
      newStart = `${startH}:${startM}`;
      
      date.setMinutes(date.getMinutes() + 40); // Standard 40 mins lesson
      const endH = String(date.getHours()).padStart(2, '0');
      const endM = String(date.getMinutes()).padStart(2, '0');
      newEnd = `${endH}:${endM}`;
    }

    const newSlot: LessonSlot = {
      id: `temp_${Date.now()}`,
      teacher_id: user?.id || '',
      name: `${nextIndex}. Ders`,
      start_time: newStart,
      end_time: newEnd,
      order_index: nextIndex
    };

    setEditedSlots([...editedSlots, newSlot]);
  };

  const removeSlot = (id: string) => {
    // Alert if this slot is active in timetable
    const inUse = schedule.some(item => item.slot_id === id);
    if (inUse) {
      if (!confirm('Bu ders saati programınızda kullanılıyor. Silerseniz ders programındaki bu hücreler de silinecektir. Devam edilsin mi?')) {
        return;
      }
    }
    setEditedSlots(editedSlots.filter(s => s.id !== id));
  };

  const handleSlotChange = (id: string, field: keyof LessonSlot, value: any) => {
    setEditedSlots(editedSlots.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const saveSlotsConfig = async () => {
    if (!user) return;
    setSaving(true);

    // Validate inputs
    const invalid = editedSlots.some(s => !s.name || !s.start_time || !s.end_time);
    if (invalid) {
      triggerToast('Lütfen tüm ders saati alanlarını doldurun.', 'error');
      setSaving(false);
      return;
    }

    // Sort slots by start time to enforce order index
    const sorted = [...editedSlots].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const reordered = sorted.map((s, index) => ({
      ...s,
      order_index: index + 1
    }));

    const success = await saveLessonSlots(user.id, reordered, isDemoMode);
    if (success) {
      setSlots(reordered);
      setEditedSlots(reordered);
      
      // Clean up orphaned schedule items if their slots were deleted
      const activeSlotIds = reordered.map(s => s.id);
      const filteredSchedule = schedule.filter(item => activeSlotIds.includes(item.slot_id));
      if (filteredSchedule.length !== schedule.length) {
        await saveTeacherSchedule(user.id, filteredSchedule, isDemoMode);
        setSchedule(filteredSchedule);
      }

      triggerToast('Ders zil saatleri başarıyla kaydedildi.');
    } else {
      triggerToast('Kaydederken bir hata oluştu.', 'error');
    }
    setSaving(false);
  };

  // --- WEEKLY SCHEDULE GRID MANAGEMENT ACTIONS ---

  const handleCellClick = (dayOfWeek: number, slotId: string) => {
    // Find if cell already exists in schedule
    const cell = schedule.find(item => item.day_of_week === dayOfWeek && item.slot_id === slotId);
    
    setEditingCell({
      dayOfWeek,
      slotId,
      subject: cell?.subject || '',
      classroom: cell?.classroom || ''
    });
  };

  const handleSaveCell = () => {
    if (!editingCell || !user) return;

    let updatedSchedule = [...schedule];
    const matchIdx = schedule.findIndex(
      item => item.day_of_week === editingCell.dayOfWeek && item.slot_id === editingCell.slotId
    );

    if (editingCell.subject.trim() === '') {
      // Delete active cell if subject cleared
      if (matchIdx !== -1) {
        updatedSchedule.splice(matchIdx, 1);
      }
    } else {
      // Upsert
      const newItem: Omit<TeacherSchedule, 'id'> = {
        teacher_id: user.id,
        day_of_week: editingCell.dayOfWeek,
        slot_id: editingCell.slotId,
        subject: editingCell.subject.trim(),
        classroom: editingCell.classroom.trim()
      };

      if (matchIdx !== -1) {
        updatedSchedule[matchIdx] = {
          ...updatedSchedule[matchIdx],
          ...newItem
        };
      } else {
        updatedSchedule.push({
          id: `temp_sch_${Date.now()}`,
          ...newItem
        });
      }
    }

    setSchedule(updatedSchedule);
    setEditingCell(null);
  };

  const handleClearCell = () => {
    if (!editingCell) return;
    setEditingCell({
      ...editingCell,
      subject: '',
      classroom: ''
    });
  };

  const saveWeeklySchedule = async () => {
    if (!user) return;
    setSaving(true);

    // Strip temp IDs before posting to DB
    const cleaned = schedule.map(item => {
      const copy = { ...item };
      if (copy.id.startsWith('temp_')) {
        delete (copy as any).id;
      }
      return copy;
    });

    const success = await saveTeacherSchedule(user.id, cleaned, isDemoMode);
    if (success) {
      triggerToast('Haftalık ders programınız başarıyla kaydedildi.');
      
      // Reload from source to ensure proper IDs are assigned
      const refetched = await getTeacherSchedule(user.id, isDemoMode);
      setSchedule(refetched);
    } else {
      triggerToast('Kaydederken bir hata oluştu.', 'error');
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  // Filter out Saturday and Sunday if showWeekend is false
  const activeDays = showWeekend ? DAYS_OF_WEEK : DAYS_OF_WEEK.filter(d => d.id <= 5);

  return (
    <>
      <Navbar />
      <main className="main-wrapper">
        
        {/* TOAST NOTIFICATION FLOATER */}
        {toast && (
          <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
            <CheckCircle size={18} />
            <span>{toast.message}</span>
          </div>
        )}

        {/* CELL EDITOR MODAL OVERLAY */}
        {editingCell && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalCard} glass-panel`}>
              <div className={styles.modalHeader}>
                <Edit3 size={18} className={styles.modalIcon} />
                <h2>Ders Bilgilerini Düzenle</h2>
              </div>
              
              <div className={styles.modalMeta}>
                <span>{DAYS_OF_WEEK.find(d => d.id === editingCell.dayOfWeek)?.name}</span>
                <ChevronRight size={14} />
                <span>{slots.find(s => s.id === editingCell.slotId)?.name}</span>
              </div>

              <div className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="subject">Ders Adı</label>
                  <div className={styles.inputWrapper}>
                    <BookOpen size={18} className={styles.inputIcon} />
                    <input 
                      id="subject"
                      type="text" 
                      placeholder="Örn: Matematik"
                      className="glass-input"
                      value={editingCell.subject}
                      onChange={(e) => setEditingCell({ ...editingCell, subject: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="classroom">Sınıf / Şube</label>
                  <div className={styles.inputWrapper}>
                    <MapPin size={18} className={styles.inputIcon} />
                    <input 
                      id="classroom"
                      type="text" 
                      placeholder="Örn: 9-A, Laboratuvar"
                      className="glass-input"
                      value={editingCell.classroom}
                      onChange={(e) => setEditingCell({ ...editingCell, classroom: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button onClick={handleClearCell} className={`${styles.clearBtn} glass-button`} title="Dersi Sil">
                  <Trash size={16} />
                  <span>Kaldır</span>
                </button>
                
                <div className={styles.modalPrimaryActions}>
                  <button onClick={() => setEditingCell(null)} className="glass-button">
                    İptal
                  </button>
                  <button onClick={handleSaveCell} className="glass-button glass-button-primary">
                    Uygula
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEADER AREA */}
        <div className={styles.headerArea}>
          <div>
            <h1>Ders Programı ve Zil Planlayıcı</h1>
            <p className={styles.subtitle}>
              Okulunuzun ders zil saatlerini belirleyin ve derslerinizi haftalık çizelgeye yerleştirin.
            </p>
          </div>

          <div className={styles.tabSwitcher}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'grid' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('grid')}
            >
              <Calendar size={16} />
              <span>Haftalık Program</span>
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'slots' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('slots')}
            >
              <Clock size={16} />
              <span>Zil Saatleri</span>
            </button>
          </div>
        </div>

        {/* --- VIEW 1: WEEKLY CALENDAR GRID --- */}
        {activeTab === 'grid' && (
          <div className={`${styles.scheduleContainer} glass-panel`}>
            
            <div className={styles.gridToolbar}>
              <div className={styles.toolbarLeft}>
                <label className={styles.toggleLabel}>
                  <input 
                    type="checkbox" 
                    checked={showWeekend} 
                    onChange={(e) => setShowWeekend(e.target.checked)} 
                  />
                  <span>Hafta Sonunu Göster</span>
                </label>
              </div>
              
              <button 
                onClick={saveWeeklySchedule} 
                className="glass-button glass-button-primary"
                disabled={saving}
              >
                <Save size={16} />
                <span>Programı Kaydet</span>
              </button>
            </div>

            {slots.length === 0 ? (
              <div className={styles.emptyGridState}>
                <Clock size={48} className={styles.emptyIcon} />
                <h3>Henüz Zil Saati Tanımlanmamış</h3>
                <p>Haftalık programınızı oluşturmak için önce ders zil saatlerini tanımlamanız gerekmektedir.</p>
                <button onClick={() => setActiveTab('slots')} className="glass-button" style={{ marginTop: '10px' }}>
                  Zil Saatlerini Tanımla
                </button>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.gridTable}>
                  <thead>
                    <tr>
                      <th className={styles.hourCol}>Saat Dilimi</th>
                      {activeDays.map(day => (
                        <th key={day.id}>{day.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map(slot => (
                      <tr key={slot.id}>
                        {/* Time period column */}
                        <td className={styles.hourCell}>
                          <span className={styles.slotName}>{slot.name}</span>
                          <span className={styles.slotRange}>
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </span>
                        </td>
                        
                        {/* Days cells */}
                        {activeDays.map(day => {
                          const cell = schedule.find(
                            item => item.day_of_week === day.id && item.slot_id === slot.id
                          );
                          
                          return (
                            <td 
                              key={day.id} 
                              className={`${styles.gridCell} ${cell ? styles.cellPopulated : ''}`}
                              onClick={() => handleCellClick(day.id, slot.id)}
                            >
                              {cell ? (
                                <div className={styles.cellContent}>
                                  <strong className={styles.cellSubject}>{cell.subject}</strong>
                                  <span className={styles.cellClass}>{cell.classroom || '-'}</span>
                                </div>
                              ) : (
                                <span className={styles.cellAdd}>+ Ekle</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 2: PERIOD SLOT HOURS TIMINGS --- */}
        {activeTab === 'slots' && (
          <div className={`${styles.slotsContainer} glass-panel`}>
            <div className={styles.gridToolbar}>
              <h3>Zil Saatleri Ayarları</h3>
              
              <div className={styles.toolbarButtons}>
                <button onClick={addSlot} className="glass-button">
                  <Plus size={16} />
                  <span>Ders Saati Ekle</span>
                </button>
                <button 
                  onClick={saveSlotsConfig} 
                  className="glass-button glass-button-primary"
                  disabled={saving}
                >
                  <Save size={16} />
                  <span>Saatleri Kaydet</span>
                </button>
              </div>
            </div>

            {editedSlots.length === 0 ? (
              <div className={styles.emptyGridState}>
                <Plus size={48} className={styles.emptyIcon} />
                <h3>Zil Saati Tanımlanmamış</h3>
                <p>Okulunuzdaki ders giriş ve çıkış zil saatlerini yapılandırmak için <strong>Ders Saati Ekle</strong> butonuna basın.</p>
                <button onClick={addSlot} className="glass-button" style={{ marginTop: '10px' }}>
                  Hemen Ekle
                </button>
              </div>
            ) : (
              <div className={styles.slotsList}>
                <div className={styles.slotsHeader}>
                  <span>Sıra / İsim</span>
                  <span>Başlangıç Saati</span>
                  <span>Bitiş Saati</span>
                  <span>İşlem</span>
                </div>
                
                {editedSlots.map((slot, index) => (
                  <div key={slot.id} className={styles.slotRow}>
                    <div className={styles.slotNameField}>
                      <span className={styles.slotIndex}>{index + 1}</span>
                      <input 
                        type="text" 
                        placeholder="Örn: 1. Ders, Öğle Arası"
                        className="glass-input"
                        value={slot.name}
                        onChange={(e) => handleSlotChange(slot.id, 'name', e.target.value)}
                      />
                    </div>
                    
                    <div className={styles.slotTimeField}>
                      <Clock size={16} className={styles.fieldIcon} />
                      <input 
                        type="time" 
                        className="glass-input"
                        value={slot.start_time.substring(0, 5)}
                        onChange={(e) => handleSlotChange(slot.id, 'start_time', e.target.value)}
                      />
                    </div>

                    <div className={styles.slotTimeField}>
                      <Clock size={16} className={styles.fieldIcon} />
                      <input 
                        type="time" 
                        className="glass-input"
                        value={slot.end_time.substring(0, 5)}
                        onChange={(e) => handleSlotChange(slot.id, 'end_time', e.target.value)}
                      />
                    </div>

                    <button 
                      onClick={() => removeSlot(slot.id)} 
                      className={styles.deleteSlotBtn} 
                      title="Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </>
  );
}
