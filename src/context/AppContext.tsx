import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TeacherAccount, LessonSlot, Timetable, LogEntry, DayName } from '../types';
import { playLessonStartBell, playLessonEndBell } from '../utils/bellAudio';
import { sendLocalNotification, getNotificationPermissionStatus, requestNotificationPermission } from '../utils/notifications';
import { startBackgroundKeepAlive, stopBackgroundKeepAlive } from '../utils/backgroundKeepAlive';

interface AppContextType {
  currentTeacher: TeacherAccount | null;
  accounts: Record<string, TeacherAccount>;
  logs: LogEntry[];
  turkeyTime: Date;
  activeLessonIndex: number | null; // 0 to 7, or null
  activeLessonState: 'lesson' | 'break' | 'weekend' | 'before_school' | 'after_school';
  countdownText: string;
  rememberMe: boolean;
  volume: number;
  wakeLockActive: boolean;
  isSimulatorActive: boolean;
  simulatedTimeOffset: number; // in seconds
  playTestStartBell: () => void;
  playTestEndBell: () => void;
  testNotification: () => void;
  signUp: (email: string, fullName: string, schoolName: string) => boolean;
  login: (email: string, rememberMe: boolean) => boolean;
  logout: () => void;
  updateTimetableCell: (day: DayName, slotId: number, lessonName: string, classTeacher: string) => void;
  updateLessonSlots: (slots: LessonSlot[]) => void;
  setRememberMe: (val: boolean) => void;
  setVolume: (val: number) => void;
  toggleWakeLock: () => Promise<void>;
  setIsSimulatorActive: (val: boolean) => void;
  setSimulatedTimeOffset: (val: number) => void;
  clearLogs: () => void;
  triggerManualBell: (lessonId: number, type: 'start' | 'end') => void;
  requestNotificationPerm: () => void;
  notificationPermission: NotificationPermission;
  backgroundModeActive: boolean;
  toggleBackgroundMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial empty/default timetable matching the grid size: 8 slots for 5 days
const createEmptyTimetable = (): Timetable => {
  const days: DayName[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
  const timetable: Partial<Timetable> = {};
  days.forEach(day => {
    timetable[day] = Array(8).fill(null).map(() => ({ lessonName: '', classTeacher: '' }));
  });
  return timetable as Timetable;
};

// Deferring standard start and end times matching teacher's screenshot & Turkish regulations
const defaultLessonSlots: LessonSlot[] = [
  { id: 1, start: '08:45', end: '09:25' },
  { id: 2, start: '09:35', end: '10:15' },
  { id: 3, start: '10:25', end: '11:05' },
  { id: 4, start: '11:15', end: '11:55' },
  { id: 5, start: '12:05', end: '12:45' },
  { id: 6, start: '13:35', end: '14:15' },
  { id: 7, start: '14:25', end: '15:05' },
  { id: 8, start: '15:15', end: '15:55' },
];

// Pre-fill Arif Biçer's lessons as requested in the image (outstanding User Experience fallback)
const getArifBicerTimetable = (): Timetable => {
  const timetable = createEmptyTimetable();
  
  // Pazartesi
  timetable['Pazartesi'][0] = { lessonName: 'TDT', classTeacher: 'S.TÜ F' };
  timetable['Pazartesi'][1] = { lessonName: 'TDT', classTeacher: 'S.TÜ F' };
  timetable['Pazartesi'][2] = { lessonName: 'TDE', classTeacher: 'Ö.GE Z' };
  timetable['Pazartesi'][3] = { lessonName: 'TDE', classTeacher: 'Ö.GE Z' };
  timetable['Pazartesi'][4] = { lessonName: 'MAT', classTeacher: 'S ÖZK' };
  timetable['Pazartesi'][5] = { lessonName: 'MAT', classTeacher: 'S ÖZK' };
  timetable['Pazartesi'][6] = { lessonName: 'İNG', classTeacher: 'HD' };
  timetable['Pazartesi'][7] = { lessonName: 'İNG', classTeacher: 'HD' };

  // Salı
  timetable['Salı'][0] = { lessonName: 'TDE', classTeacher: 'Ö.GE Z' };
  timetable['Salı'][1] = { lessonName: 'GÖR MÜZ', classTeacher: 'K.ŞEN' };
  timetable['Salı'][2] = { lessonName: 'GÖR MÜZ', classTeacher: 'K.ŞEN' };
  timetable['Salı'][3] = { lessonName: 'S FRAN', classTeacher: 'M.YIL' };
  timetable['Salı'][4] = { lessonName: 'S FRAN', classTeacher: 'M.YIL' };
  timetable['Salı'][5] = { lessonName: 'REH', classTeacher: 'S ÖZK' };
  timetable['Salı'][6] = { lessonName: 'BİY2', classTeacher: 'H.SÜR R' };
  timetable['Salı'][7] = { lessonName: 'BİY2', classTeacher: 'H.SÜR R' };

  // Çarşamba
  timetable['Çarşamba'][0] = { lessonName: 'DİN', classTeacher: 'B ŞAN' };
  timetable['Çarşamba'][1] = { lessonName: 'DİN', classTeacher: 'B ŞAN' };
  timetable['Çarşamba'][2] = { lessonName: 'MAT', classTeacher: 'S ÖZK' };
  timetable['Çarşamba'][3] = { lessonName: 'MAT', classTeacher: 'S ÖZK' };
  timetable['Çarşamba'][4] = { lessonName: 'BED', classTeacher: 'D.NER R' };
  timetable['Çarşamba'][5] = { lessonName: 'BED', classTeacher: 'D.NER R' };
  timetable['Çarşamba'][6] = { lessonName: 'SP EĞ', classTeacher: 'T.DNZ Z' };
  timetable['Çarşamba'][7] = { lessonName: 'SP EĞ', classTeacher: 'T.DNZ Z' };

  // Perşembe
  timetable['Perşembe'][0] = { lessonName: 'FİZ', classTeacher: 'A.FUZ Z' };
  timetable['Perşembe'][1] = { lessonName: 'FİZ', classTeacher: 'A.FUZ Z' };
  timetable['Perşembe'][2] = { lessonName: 'FEL', classTeacher: 'S.TÜ F' };
  timetable['Perşembe'][3] = { lessonName: 'FEL', classTeacher: 'S.TÜ F' };
  timetable['Perşembe'][4] = { lessonName: 'COĞ', classTeacher: 'C YIL' };
  timetable['Perşembe'][5] = { lessonName: 'COĞ', classTeacher: 'C YIL' };
  timetable['Perşembe'][6] = { lessonName: 'KİM', classTeacher: 'N.ÇİN K' };
  timetable['Perşembe'][7] = { lessonName: 'KİM', classTeacher: 'N.ÇİN K' };

  // Cuma
  timetable['Cuma'][0] = { lessonName: 'TDE', classTeacher: 'Ö.GE Z' };
  timetable['Cuma'][1] = { lessonName: 'TDE', classTeacher: 'Ö.GE Z' };
  timetable['Cuma'][2] = { lessonName: 'TAR', classTeacher: 'Ş.ŞİM' };
  timetable['Cuma'][3] = { lessonName: 'TAR', classTeacher: 'Ş.ŞİM' };
  timetable['Cuma'][4] = { lessonName: 'İNG', classTeacher: 'HD' };
  timetable['Cuma'][5] = { lessonName: 'İNG', classTeacher: 'HD' };
  timetable['Cuma'][6] = { lessonName: 'MAT', classTeacher: 'S ÖZK' };
  timetable['Cuma'][7] = { lessonName: 'MAT', classTeacher: 'S ÖZK' };

  return timetable;
};

// Map day index (Sunday=0, Monday=1, etc.) to DayName string
const getDayNameFromIndex = (dayIndex: number): DayName | 'Weekend' => {
  const map: Record<number, DayName | 'Weekend'> = {
    1: 'Pazartesi',
    2: 'Salı',
    3: 'Çarşamba',
    4: 'Perşembe',
    5: 'Cuma',
    0: 'Weekend',
    6: 'Weekend'
  };
  return map[dayIndex] || 'Weekend';
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store all registered teacher accounts key-value style in local state synced with LocalStorage
  const [accounts, setAccounts] = useState<Record<string, TeacherAccount>>(() => {
    const saved = localStorage.getItem('ekolzil_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }
    }
    
    // Seed the primary Demo Account for Arif Bey so they can play instantly
    const seed: Record<string, TeacherAccount> = {
      'arif.bicer@okul.k12.tr': {
        email: 'arif.bicer@okul.k12.tr',
        fullName: 'Arif Biçer',
        schoolName: 'Zübeyde Hanım Anadolu Lisesi',
        timetable: getArifBicerTimetable(),
        lessonSlots: defaultLessonSlots
      }
    };
    localStorage.setItem('ekolzil_accounts', JSON.stringify(seed));
    return seed;
  });

  const [currentTeacher, setCurrentTeacher] = useState<TeacherAccount | null>(() => {
    const rememberedMail = localStorage.getItem('ekolzil_remembered_email');
    if (rememberedMail) {
      const savedAccounts = localStorage.getItem('ekolzil_accounts');
      if (savedAccounts) {
        try {
          const parsed = JSON.parse(savedAccounts);
          if (parsed[rememberedMail]) {
            return parsed[rememberedMail];
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
    return null;
  });

  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem('ekolzil_remember_flag') === 'true';
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('ekolzil_logs');
    return saved ? JSON.parse(saved) : [
      { id: 'start', timestamp: '14:22:43', type: 'system', message: 'Akıllı Okul Zili Aktifleştirildi.' }
    ];
  });

  const [volume, setVolume] = useState<number>(0.8);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const wakeLockRef = useRef<any>(null);
  const [backgroundModeActive, setBackgroundModeActive] = useState<boolean>(() => {
    return localStorage.getItem('ekolzil_background_mode') === 'true';
  });

  // Time Simulator states - vital for teachers to immediately test triggers!
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [simulatedTimeOffset, setSimulatedTimeOffset] = useState(0); // in seconds
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return getNotificationPermissionStatus();
  });

  const [turkeyTime, setTurkeyTime] = useState<Date>(new Date());
  const [countdownText, setCountdownText] = useState<string>('--:--');
  const [activeLessonIndex, setActiveLessonIndex] = useState<number | null>(null);
  const [activeLessonState, setActiveLessonState] = useState<'lesson' | 'break' | 'weekend' | 'before_school' | 'after_school'>('weekend');

  const triggeredRef = useRef<Record<string, boolean>>({});

  // Triggered on page loads to restore or set permissions
  useEffect(() => {
    setNotificationPermission(getNotificationPermissionStatus());
    
    // Save any updates on logs to LocalStorage
    localStorage.setItem('ekolzil_logs', JSON.stringify(logs));
  }, [logs]);

  // Monitor background keep alive mode state
  useEffect(() => {
    if (backgroundModeActive && currentTeacher) {
      startBackgroundKeepAlive();
    } else {
      stopBackgroundKeepAlive();
    }
  }, [backgroundModeActive, currentTeacher]);

  // Handle periodic ticks - running every 500ms for tight clock synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate genuine Turkey local time (UTC+3)
      const dateLocal = new Date();
      let calculatedTime = dateLocal;
      
      if (isSimulatorActive) {
        // Fast Simulator offset addition
        calculatedTime = new Date(dateLocal.getTime() + (simulatedTimeOffset * 1000));
      }
      
      // Force conversion to Istanbul timezone timezone offset
      try {
        const estTimeStr = calculatedTime.toLocaleString("en-US", {timeZone: "Europe/Istanbul"});
        const estDate = new Date(estTimeStr);
        setTurkeyTime(estDate);
      } catch (e) {
        setTurkeyTime(calculatedTime);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isSimulatorActive, simulatedTimeOffset]);

  // Synchronise state calculations (which lesson is active, what is the countdown) based on the ticking clock
  useEffect(() => {
    calculateLessonState();
  }, [turkeyTime, currentTeacher]);

  const requestNotificationPerm = async () => {
    const status = await requestNotificationPermission();
    setNotificationPermission(status);
  };

  const playTestStartBell = () => {
    playLessonStartBell(volume);
    addLog('system', 'Sistem Testi: Ders Başlama (Yeşil) zili tetiklendi.');
  };

  const playTestEndBell = () => {
    playLessonEndBell(volume);
    addLog('system', 'Sistem Testi: Ders Bitiş (Kırmızı) zili tetiklendi.');
  };

  const testNotification = () => {
    sendLocalNotification('🔔 Zil Testi Başarılı', 'Akıllı Okul Zili bildirimleri telefonunuzda aktif!', true);
    addLog('system', 'Zil test bildirimi gönderildi.');
  };

  const addLog = (type: 'start' | 'end' | 'system', message: string, lessonName?: string) => {
    const trStr = turkeyTime.toLocaleTimeString('tr-TR', { hour12: false });
    const log: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: trStr,
      type,
      message,
      lessonName
    };
    setLogs(prev => [log, ...prev].slice(0, 50)); // limit logs to last 50 items
  };

  const clearLogs = () => {
    setLogs([{ id: 'clear', timestamp: turkeyTime.toLocaleTimeString('tr-TR'), type: 'system', message: 'Log geçmişi temizlendi.' }]);
  };

  const signUp = (email: string, fullName: string, schoolName: string): boolean => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !fullName) return false;
    if (accounts[trimmedEmail]) return false; // email in use

    const newTeacher: TeacherAccount = {
      email: trimmedEmail,
      fullName,
      schoolName,
      timetable: createEmptyTimetable(),
      lessonSlots: defaultLessonSlots
    };

    const newAccounts = { ...accounts, [trimmedEmail]: newTeacher };
    setAccounts(newAccounts);
    localStorage.setItem('ekolzil_accounts', JSON.stringify(newAccounts));
    return true;
  };

  const login = (email: string, checkFlag: boolean): boolean => {
    const trimmedEmail = email.trim().toLowerCase();
    if (accounts[trimmedEmail]) {
      setCurrentTeacher(accounts[trimmedEmail]);
      setRememberMe(checkFlag);
      localStorage.setItem('ekolzil_remember_flag', checkFlag ? 'true' : 'false');
      if (checkFlag) {
        localStorage.setItem('ekolzil_remembered_email', trimmedEmail);
      } else {
        localStorage.removeItem('ekolzil_remembered_email');
      }
      addLog('system', `${accounts[trimmedEmail].fullName} sisteme giriş yaptı.`);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('ekolzil_remembered_email');
    localStorage.setItem('ekolzil_remember_flag', 'false');
    stopBackgroundKeepAlive();
    setCurrentTeacher(null);
    setRememberMe(false);
  };

  const updateTimetableCell = (day: DayName, slotId: number, lessonName: string, classTeacher: string) => {
    if (!currentTeacher) return;
    
    const updatedTimetable = { ...currentTeacher.timetable };
    updatedTimetable[day][slotId] = { lessonName, classTeacher };
    
    const updatedUser: TeacherAccount = {
      ...currentTeacher,
      timetable: updatedTimetable
    };

    setCurrentTeacher(updatedUser);
    const newAccounts = { ...accounts, [currentTeacher.email]: updatedUser };
    setAccounts(newAccounts);
    localStorage.setItem('ekolzil_accounts', JSON.stringify(newAccounts));
  };

  const updateLessonSlots = (newSlots: LessonSlot[]) => {
    if (!currentTeacher) return;

    const updatedUser: TeacherAccount = {
      ...currentTeacher,
      lessonSlots: newSlots
    };

    setCurrentTeacher(updatedUser);
    const newAccounts = { ...accounts, [currentTeacher.email]: updatedUser };
    setAccounts(newAccounts);
    localStorage.setItem('ekolzil_accounts', JSON.stringify(newAccounts));
    
    // Clear trigger cache to re-trigger based on new schedules immediately
    triggeredRef.current = {};
    addLog('system', 'Zil seans saatleri güncellendi.');
  };

  // Prevent screen-sleeping on mobile devices for continuous monitoring
  const toggleWakeLock = async () => {
    if (!('wakeLock' in navigator)) {
      alert("Cihazınızda Ekran Açık Tutma (Wake Lock) özelliği desteklenmiyor. Ekranı açık tutmak için tarayıcı ayarlarınızı kontrol edin.");
      return;
    }

    try {
      if (!wakeLockActive) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setWakeLockActive(true);
        addLog('system', 'Ekran koruyucu uyku modu devre dışı bırakıldı (Ekran açık kalacak).');
        
        wakeLockRef.current.addEventListener('release', () => {
          setWakeLockActive(false);
        });
      } else {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
        setWakeLockActive(false);
        addLog('system', 'Ekran koruyucu sistemine izin verildi.');
      }
    } catch (err: any) {
      console.error('WakeLock request error:', err);
      setWakeLockActive(false);
      
      const isPolicyError = err.name === 'SecurityError' || 
                            err.name === 'NotAllowedError' ||
                            err.message?.toLowerCase().includes('permissions policy') || 
                            err.message?.toLowerCase().includes('disallowed');
                            
      if (isPolicyError) {
        addLog('system', '⚠️ HATA: Güvenlik politikası nedeniyle ekran kilidine izin verilmedi. Uygulamayı yeni sekmede açmayı deneyin.');
        alert(
          "EkolZil önizleme (iframe) modunda çalıştığı için tarayıcı güvenlik politikası gereği ekranı açık tutma özelliğine izin verilmiyor.\n\n" +
          "💡 Nasıl Çözülür?\n" +
          "1. Bu uygulamayı yeni sekmede (pencerede) açarak deneyin.\n" +
          "2. Cihazınızın sistem ayarlarından ekran kapama / uyku süresini kapatın veya uzatın."
        );
      } else {
        addLog('system', `⚠️ Ekran kilidi hatası: ${err.message || err}`);
      }
    }
  };

  const toggleBackgroundMode = () => {
    const newVal = !backgroundModeActive;
    setBackgroundModeActive(newVal);
    localStorage.setItem('ekolzil_background_mode', newVal ? 'true' : 'false');
    if (newVal) {
      addLog('system', 'Kesintisiz arka plan çalışma motoru aktifleştirildi (Sesli bildirim korunması aktif).');
    } else {
      addLog('system', 'Kesintisiz arka plan çalışma motoru kapatıldı.');
    }
  };

  // Convert time "HH:MM" into seconds of the day for numeric calculations
  const timeToSeconds = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 3600) + (m * 60);
  };

  // Format seconds into digital display "MM:SS" or "HH:MM:SS"
  const formatCountdown = (totalSecs: number): string => {
    if (totalSecs < 0) return '00:00';
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    const hPad = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
    const mPad = mins.toString().padStart(2, '0');
    const sPad = secs.toString().padStart(2, '0');
    return `${hPad}${mPad}:${sPad}`;
  };

  // Main chronological engine to trigger bells, adjust counters, and handle active states
  const calculateLessonState = () => {
    if (!currentTeacher) return;

    const dayIndex = turkeyTime.getDay();
    const currentDayName = getDayNameFromIndex(dayIndex);
    
    const currentH = turkeyTime.getHours();
    const currentM = turkeyTime.getMinutes();
    const currentS = turkeyTime.getSeconds();
    const currentTotalSecs = (currentH * 3600) + (currentM * 60) + currentS;

    const formattedTodayKey = `${turkeyTime.getFullYear()}-${turkeyTime.getMonth() + 1}-${turkeyTime.getDate()}`;

    // 1. Weekend Handling
    if (currentDayName === 'Weekend') {
      setActiveLessonState('weekend');
      setActiveLessonIndex(null);
      setCountdownText('Cumartesi/Pazar Tatili');
      return;
    }

    const todaySlots = currentTeacher.lessonSlots;
    const todayTimetable = currentTeacher.timetable[currentDayName];

    // Find if the time is before some lesson starts, inside a lesson, in break, or after all lessons are done
    let detectedState: 'before_school' | 'lesson' | 'break' | 'after_school' = 'after_school';
    let currentLessonIdx: number | null = null;
    let secondsRemaining = 0;
    let nextTargetText = '';

    const firstLessonSecs = timeToSeconds(todaySlots[0].start);
    const lastLessonSecs = timeToSeconds(todaySlots[todaySlots.length - 1].end);

    if (currentTotalSecs < firstLessonSecs) {
      detectedState = 'before_school';
      secondsRemaining = firstLessonSecs - currentTotalSecs;
      setCountdownText(`${formatCountdown(secondsRemaining)} kaldı`);
      setActiveLessonIndex(null);
      setActiveLessonState('before_school');
      return;
    }

    if (currentTotalSecs > lastLessonSecs) {
      detectedState = 'after_school';
      setCountdownText('Dersler Bitti');
      setActiveLessonIndex(null);
      setActiveLessonState('after_school');
      return;
    }

    // Traverse the 8 lessons
    for (let i = 0; i < todaySlots.length; i++) {
      const slot = todaySlots[i];
      const startSecs = timeToSeconds(slot.start);
      const endSecs = timeToSeconds(slot.end);

      // Check: Is currently IN class?
      if (currentTotalSecs >= startSecs && currentTotalSecs < endSecs) {
        detectedState = 'lesson';
        currentLessonIdx = i;
        secondsRemaining = endSecs - currentTotalSecs;
        
        const cell = todayTimetable[i];
        const nextPrompt = cell.lessonName ? `"${cell.lessonName}" Bitmesine` : `${i + 1}. Dersin Bitmesine`;
        setCountdownText(formatCountdown(secondsRemaining));
        
        // ------------------ REAL-TIME TRIGGER FOR LESSON START ------------------
        const triggerKey = `${formattedTodayKey}-lesson-${i}-start`;
        // Only trigger exactly on transition or if not already rung in this state
        if (!triggeredRef.current[triggerKey] && currentTotalSecs >= startSecs) {
          triggeredRef.current[triggerKey] = true;
          const lessonNameStr = cell.lessonName || `${i + 1}. Ders`;
          playLessonStartBell(volume);
          sendLocalNotification(
            '🟢 Ders Başladı!', 
            `${lessonNameStr} ders saati geldi (${slot.start}). İyi dersler dileriz!`, 
            true
          );
          addLog('start', `Saat geldi! ${lessonNameStr} Dersi Başladı.`, lessonNameStr);
        }
        
        break;
      }

      // Check: Is currently IN break (Teneffüs) between lessons?
      if (i < todaySlots.length - 1) {
        const nextSlot = todaySlots[i + 1];
        const currentEndSecs = endSecs;
        const nextStartSecs = timeToSeconds(nextSlot.start);

        if (currentTotalSecs >= currentEndSecs && currentTotalSecs < nextStartSecs) {
          detectedState = 'break';
          currentLessonIdx = i; // we just finished i, waiting for i+1
          secondsRemaining = nextStartSecs - currentTotalSecs;
          
          const nextCell = todayTimetable[i + 1];
          const nextPrompt = nextCell.lessonName ? `"${nextCell.lessonName}" Hazırlığına` : `${i + 2}. Ders Başlangıcına`;
          setCountdownText(formatCountdown(secondsRemaining));

          // ------------------ REAL-TIME TRIGGER FOR BREAK / LESSON END ------------------
          const triggerKey = `${formattedTodayKey}-lesson-${i}-end`;
          if (!triggeredRef.current[triggerKey] && currentTotalSecs >= currentEndSecs) {
            triggeredRef.current[triggerKey] = true;
            const finishedLessonName = todayTimetable[i].lessonName || `${i + 1}. Ders`;
            playLessonEndBell(volume);
            sendLocalNotification(
              '🔴 Ders Bitti!', 
              `${finishedLessonName} bitti. Teneffüs zamanı!`, 
              false
            );
            addLog('end', `Saat geldi! ${finishedLessonName} Dersi Sona Erdi.`, finishedLessonName);
          }
          
          break;
        }
      }
    }

    setActiveLessonState(detectedState);
    setActiveLessonIndex(currentLessonIdx);
  };

  // Support manual trigger for demonstration or classroom testing
  const triggerManualBell = (lessonId: number, type: 'start' | 'end') => {
    if (!currentTeacher) return;
    
    // Convert 1-based index (for rendering/display) to 0-based index
    const idx = lessonId - 1;
    const dayIndex = turkeyTime.getDay();
    const currentDayName = getDayNameFromIndex(dayIndex === 0 || dayIndex === 6 ? 1 : dayIndex); // default Pazartesi if weekend
    const cell = currentTeacher.timetable[currentDayName as DayName][idx];
    const lessonName = cell?.lessonName || `${lessonId}. Ders`;

    if (type === 'start') {
      playLessonStartBell(volume);
      sendLocalNotification('🟢 Ders Başladı!', `${lessonName} dersi başladı. İyi dersler dileriz!`, true);
      addLog('start', `Manuel Tetiklendi: ${lessonName} Dersi Başladı.`, lessonName);
    } else {
      playLessonEndBell(volume);
      sendLocalNotification('🔴 Ders Bitti!', `${lessonName} dersi sona erdi. Teneffüs başladı!`, false);
      addLog('end', `Manuel Tetiklendi: ${lessonName} Dersi Bitti.`, lessonName);
    }
  };

  return (
    <AppContext.Provider value={{
      currentTeacher,
      accounts,
      logs,
      turkeyTime,
      activeLessonIndex,
      activeLessonState,
      countdownText,
      rememberMe,
      volume,
      wakeLockActive,
      isSimulatorActive,
      simulatedTimeOffset,
      playTestStartBell,
      playTestEndBell,
      testNotification,
      signUp,
      login,
      logout,
      updateTimetableCell,
      updateLessonSlots,
      setRememberMe,
      setVolume,
      toggleWakeLock,
      setIsSimulatorActive,
      setSimulatedTimeOffset,
      clearLogs,
      triggerManualBell,
      requestNotificationPerm,
      notificationPermission,
      backgroundModeActive,
      toggleBackgroundMode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
