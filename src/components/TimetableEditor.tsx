import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DayName, LessonSlot, Timetable } from '../types';
import { Save, X, Calendar, Edit, Clock, RotateCcw, ShieldCheck, Check } from 'lucide-react';

export const TimetableEditor: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  const { currentTeacher, updateTimetableCell, updateLessonSlots } = useApp();
  
  const [editingCell, setEditingCell] = useState<{ day: DayName; slotId: number } | null>(null);
  const [lessonNameInput, setLessonNameInput] = useState('');
  const [classTeacherInput, setClassTeacherInput] = useState('');
  const [isEditingSlots, setIsEditingSlots] = useState(false);

  // Deep copy lesson slots to local state for editing
  const [localSlots, setLocalSlots] = useState<LessonSlot[]>([]);

  if (!currentTeacher) return null;

  const days: DayName[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
  const slotsCount = 8;

  const openEditModal = (day: DayName, slotId: number) => {
    const cell = currentTeacher.timetable[day][slotId];
    setEditingCell({ day, slotId });
    setLessonNameInput(cell?.lessonName || '');
    setClassTeacherInput(cell?.classTeacher || '');
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    updateTimetableCell(editingCell.day, editingCell.slotId, lessonNameInput, classTeacherInput);
    setEditingCell(null);
  };

  const startEditSlots = () => {
    setLocalSlots(currentTeacher.lessonSlots.map(s => ({ ...s })));
    setIsEditingSlots(true);
  };

  const handleLocalSlotTimeChange = (index: number, type: 'start' | 'end', value: string) => {
    const updated = [...localSlots];
    updated[index] = {
      ...updated[index],
      [type]: value
    };
    setLocalSlots(updated);
  };

  const handleSaveSlots = () => {
    updateLessonSlots(localSlots);
    setIsEditingSlots(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-1 py-1 font-sans text-slate-800">
      
      {/* Back button header navigation banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between text-center gap-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-emerald-600 animate-pulse" />
          <h2 className="text-base sm:text-lg font-extrabold text-slate-950 font-sans">Haftalık Ders Programı & Çan Saatleri</h2>
        </div>
        <button
          onClick={onBackToHome}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 w-full sm:w-auto justify-center shadow-sm"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Kaydet ve Ana Ekrana Dön</span>
        </button>
      </div>

      {/* Interactive 5x8 Timetable visual table block */}
      <div className="bg-white rounded-2xl border border-slate-205 p-4 sm:p-5 shadow-sm overflow-hidden">
        
        {/* Helper info banner */}
        <div className="mb-4 bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-start space-x-2.5">
          <Edit className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-950 leading-relaxed font-semibold">
            Programı hızlıca özelleştirin! <strong>Hangi gün ve saatte dersiniz varsa tıklayın</strong> ve ders adını yazın. Program bittiğinde, o günlerin zil vakitlerinde tarayıcı üzerinden sesli ziller çalacaktır.
          </p>
        </div>

        {/* Timetable Scroll Container with Responsive Overflow */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[750px] border-collapse bg-white text-slate-800">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="p-3 border border-slate-200 text-center font-extrabold text-xs uppercase tracking-wider text-slate-500 w-[110px]">
                  Saatler / Gün
                </th>
                
                {/* 1 to 8 Lesson Columns */}
                {Array(slotsCount).fill(null).map((_, idx) => {
                  const num = idx + 1;
                  const slotConfig = currentTeacher.lessonSlots[idx];
                  return (
                    <th key={idx} className="p-2 border border-slate-200 text-center w-[100px] min-w-[90px]">
                      <div className="text-xs font-extrabold text-slate-900">{num}. Ders</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold tracking-tight bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                        {slotConfig ? `${slotConfig.start} — ${slotConfig.end}` : '--:--'}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            
            <tbody>
              {days.map((day) => {
                const dayCells = currentTeacher.timetable[day];
                return (
                  <tr key={day} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 border border-slate-200 font-extrabold text-xs text-slate-800 bg-slate-50 text-center">
                      {day}
                    </td>

                    {Array(slotsCount).fill(null).map((_, slotIdx) => {
                      const cell = dayCells ? dayCells[slotIdx] : null;
                      const isCellFilled = cell && cell.lessonName;
                      
                      return (
                        <td 
                          key={slotIdx} 
                          onClick={() => openEditModal(day, slotIdx)}
                          className={`p-1.5 border border-slate-200 text-center cursor-pointer transition-all relative group select-none ${
                            isCellFilled 
                            ? 'bg-emerald-50 hover:bg-emerald-100/70 text-slate-900 border-emerald-100 shadow-inner' 
                            : 'bg-white hover:bg-slate-50 text-slate-400'
                          }`}
                        >
                          {isCellFilled ? (
                            <div className="flex flex-col justify-center items-center h-16 min-h-[64px] font-sans">
                              {/* Lesson Code */}
                              <span className="text-xs font-black text-emerald-800 tracking-wide font-sans line-clamp-1">{cell.lessonName}</span>
                              {/* Teacher Alias */}
                              <span className="text-[10px] text-slate-500 font-semibold font-sans whitespace-pre-wrap leading-tight mt-1 truncate max-w-full">
                                {cell.classTeacher || '--'}
                              </span>
                              
                              {/* Edit overlay prompt */}
                              <div className="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-sans shadow-md">
                                Düzenle
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col justify-center items-center h-16 min-h-[64px] group-hover:text-slate-700">
                              <span className="text-[11px] font-bold text-slate-400 font-sans group-hover:text-emerald-700">+ Kutuyu Yaz</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Okul Ders Seans Hour Settings (Editable hours for the school) */}
      <div className="bg-white rounded-2xl border border-slate-205 p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">Okul Giriş ve Çıkış Saatleri</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Müdürlüğünüzün uyguladığı zil vakitlerine göre program saatlerini güncelleyin.</p>
            </div>
          </div>
          
          <button
            onClick={isEditingSlots ? handleSaveSlots : startEditSlots}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 w-full sm:w-auto justify-center shadow-sm ${
              isEditingSlots 
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' 
              : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isEditingSlots ? (
              <>
                <Save className="w-4 h-4 text-slate-950" />
                <span>Kaydet ve Uygula</span>
              </>
            ) : (
              <>
                <Edit className="w-3.5 h-3.5 text-emerald-450" />
                <span>Saatleri Güncelle</span>
              </>
            )}
          </button>
        </div>

        {isEditingSlots ? (
          /* Editable slot times */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-205">
            {localSlots.map((slot, index) => (
              <div key={slot.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-800 font-sans uppercase tracking-wider block">
                  {slot.id}. Ders Seansı:
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Giriş:</label>
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => handleLocalSlotTimeChange(index, 'start', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold rounded-lg p-1 text-center py-1.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Çıkış:</label>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => handleLocalSlotTimeChange(index, 'end', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold rounded-lg p-1 text-center py-1.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Read-only slots review */
          <div className="grid grid-cols-2 md:grid-cols-8 gap-2.5">
            {currentTeacher.lessonSlots.map((slot) => (
              <div key={slot.id} className="bg-slate-55 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center flex flex-col justify-center transition hover:bg-slate-100">
                <span className="text-[10px] font-bold text-slate-500 font-sans">
                  {slot.id}. Ders
                </span>
                <span className="text-xs font-mono font-black text-slate-900 mt-1">
                  {slot.start}
                </span>
                <span className="text-[10px] text-slate-450 font-mono font-bold">
                  {slot.end}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. CELL DETAIL MODAL POPUP */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-1.5">
                <Edit className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>{editingCell.day} • {editingCell.slotId + 1}. Ders</span>
              </h4>
              <button 
                onClick={() => setEditingCell(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1">
                  DERS ADI VEYA KODU (UYARI BİLDİRİMİ)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={lessonNameInput}
                  onChange={(e) => setLessonNameInput(e.target.value.toUpperCase())}
                  placeholder="Msn: MAT , TDE, İNG"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1">
                  DETAY / HOCA / ŞUBE (ÖRN: S.TÜ F)
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={classTeacherInput}
                  onChange={(e) => setClassTeacherInput(e.target.value)}
                  placeholder="Yazılabilir, boş kalabilir"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2.5 pt-2">
              <button
                onClick={() => {
                  setLessonNameInput('');
                  setClassTeacherInput('');
                }}
                type="button"
                className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-red-600 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center justify-center"
                title="Hücreyi temizle"
              >
                Temizle
              </button>

              <button
                onClick={handleSaveCell}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 shadow-sm"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Kutuyu Kaydet</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
