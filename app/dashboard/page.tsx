'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import { getLessonSlots, getTeacherSchedule, getBellSettings } from '@/lib/db';
import { LessonSlot, TeacherSchedule, BellSettings } from '@/lib/types';
import { playBell, stopBell } from '@/lib/audio';
import { 
  Play, Square, Volume2, ShieldCheck, AlertCircle, 
  Clock, Bell, BellOff, VolumeX, ShieldAlert, Award
} from 'lucide-react';
import styles from './page.module.css';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, isDemoMode } = useAuth();

  // Settings and schedules
  const [slots, setSlots] = useState<LessonSlot[]>([]);
  const [schedule, setSchedule] = useState<TeacherSchedule[]>([]);
  const [settings, setSettings] = useState<BellSettings | null>(null);

  // Status states
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);

  // Ringing status
  const [activeAlarm, setActiveAlarm] = useState<{
    message: string;
    lessonName: string;
    type: 'start' | 'end';
  } | null>(null);

  // References to prevent double ringing in the same minute
  const lastRungRef = useRef<string | null>(null);

  // Wake lock ref to handle visibility change
  const isMonitoringRef = useRef(false);
  isMonitoringRef.current = isMonitoring;

  // Next bell details
  const [nextBell, setNextBell] = useState<{
    name: string;
    type: 'start' | 'end';
    timeStr: string;
    timeLeftStr: string;
    secondsLeft: number;
    subject: string | null;
    classroom: string | null;
  } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Check Wake Lock support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWakeLockSupported('wakeLock' in navigator);
    }
  }, []);

  // Fetch user data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const fetchedSlots = await getLessonSlots(user.id, isDemoMode);
      const fetchedSchedule = await getTeacherSchedule(user.id, isDemoMode);
      const fetchedSettings = await getBellSettings(user.id, isDemoMode);

      setSlots(fetchedSlots);
      setSchedule(fetchedSchedule);
      setSettings(fetchedSettings);
      setLoading(false);
    };

    fetchData();
  }, [user, isDemoMode]);

  // Set up ticker (runs once per second)
  useEffect(() => {
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Wake lock request and release handlers
  const requestWakeLock = async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      const sentinel = await (navigator as any).wakeLock.request('screen');
      setWakeLock(sentinel);
      console.log('Screen Wake Lock acquired.');
    } catch (err: any) {
      console.error('Failed to acquire Screen Wake Lock:', err.message);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        console.log('Screen Wake Lock released.');
      } catch (err) {
        console.error('Error releasing Screen Wake Lock:', err);
      }
    }
  };

  // Re-acquire wake lock if page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isMonitoringRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [wakeLock]);

  // Handle monitoring toggle
  const toggleMonitoring = async () => {
    if (isMonitoring) {
      setIsMonitoring(false);
      await releaseWakeLock();
      stopBell();
      setActiveAlarm(null);
    } else {
      // Trigger short silent sound or unlock browser audio
      try {
        const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        tempCtx.close();
      } catch (e) {}

      setIsMonitoring(true);
      if (wakeLockSupported) {
        await requestWakeLock();
      }
    }
  };

  // Main alarm check & Next Bell calculation loop
  useEffect(() => {
    if (!currentTime || slots.length === 0 || !settings) return;

    const currentDay = currentTime.getDay() || 7; // Convert 0 (Sun) to 7 (Sun)
    
    // Parse time to HH:MM
    const currentHours = String(currentTime.getHours()).padStart(2, '0');
    const currentMinutes = String(currentTime.getMinutes()).padStart(2, '0');
    const timeHHMM = `${currentHours}:${currentMinutes}`;
    
    // 1. FILTER TODAY'S ACTIVE LESSONS
    const todaySchedule = schedule.filter(item => item.day_of_week === currentDay);
    const todayItems = todaySchedule.map(item => {
      const slot = slots.find(s => s.id === item.slot_id);
      return {
        ...item,
        slot
      };
    }).filter(item => item.slot !== undefined) as (TeacherSchedule & { slot: LessonSlot })[];

    // Sort today's lessons chronologically
    todayItems.sort((a, b) => a.slot.order_index - b.slot.order_index);

    // 2. CHECK ALARM RING TIMES (Only if monitoring is active)
    if (isMonitoring) {
      todayItems.forEach(item => {
        const slot = item.slot;
        
        // Strip seconds if database has time with seconds e.g. "08:30:00" -> "08:30"
        const slotStartHHMM = slot.start_time.substring(0, 5);
        const slotEndHHMM = slot.end_time.substring(0, 5);

        // A unique key for this minute event to prevent multi-ringing in the same minute
        const startKey = `${timeHHMM}_${item.id}_start`;
        const endKey = `${timeHHMM}_${item.id}_end`;

        // Check start ring
        if (timeHHMM === slotStartHHMM && settings.ring_on_start && lastRungRef.current !== startKey) {
          lastRungRef.current = startKey;
          triggerAlarm(`Ders Başladı! Sınıfa Giriş Zili`, slot.name, 'start');
        }

        // Check end ring
        if (timeHHMM === slotEndHHMM && settings.ring_on_end && lastRungRef.current !== endKey) {
          lastRungRef.current = endKey;
          triggerAlarm(`Ders Bitti! Teneffüs Zili`, slot.name, 'end');
        }
      });
    }

    // 3. CALCULATE NEXT BELL COUNTDOWN
    let nextEvent: {
      name: string;
      type: 'start' | 'end';
      timeStr: string;
      secondsLeft: number;
      subject: string | null;
      classroom: string | null;
    } | null = null;

    // We search today's timeline
    for (const item of todayItems) {
      const slot = item.slot;
      
      const startParts = slot.start_time.split(':');
      const endParts = slot.end_time.split(':');

      const startDate = new Date(currentTime);
      startDate.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0);

      const endDate = new Date(currentTime);
      endDate.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);

      // If start is in the future
      if (startDate.getTime() > currentTime.getTime()) {
        const seconds = Math.floor((startDate.getTime() - currentTime.getTime()) / 1000);
        nextEvent = {
          name: slot.name,
          type: 'start',
          timeStr: slot.start_time.substring(0, 5),
          secondsLeft: seconds,
          subject: item.subject,
          classroom: item.classroom
        };
        break; // Found first future event
      }

      // If end is in the future
      if (endDate.getTime() > currentTime.getTime()) {
        const seconds = Math.floor((endDate.getTime() - currentTime.getTime()) / 1000);
        nextEvent = {
          name: slot.name,
          type: 'end',
          timeStr: slot.end_time.substring(0, 5),
          secondsLeft: seconds,
          subject: item.subject,
          classroom: item.classroom
        };
        break; // Found first future event
      }
    }

    if (nextEvent) {
      const h = Math.floor(nextEvent.secondsLeft / 3600);
      const m = Math.floor((nextEvent.secondsLeft % 3600) / 60);
      const s = nextEvent.secondsLeft % 60;
      
      let leftStr = '';
      if (h > 0) leftStr += `${h} saat `;
      if (m > 0 || h > 0) leftStr += `${m} dakika `;
      leftStr += `${s} saniye`;

      setNextBell({
        ...nextEvent,
        timeLeftStr: leftStr
      });
    } else {
      setNextBell(null); // No more classes today
    }

  }, [currentTime, slots, schedule, settings, isMonitoring]);

  // Trigger sound & visual alerts
  const triggerAlarm = (message: string, lessonName: string, type: 'start' | 'end') => {
    if (!settings) return;
    
    // Play bell sound
    playBell(settings.sound_type, settings.volume, settings.ring_duration);
    
    // Vibrate phone if supported
    if (settings.vibrate && 'vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }

    setActiveAlarm({
      message,
      lessonName,
      type
    });

    // Close visual alarm screen after duration
    setTimeout(() => {
      setActiveAlarm(null);
    }, settings.ring_duration * 1000 + 2000);
  };

  const handleStopAlarm = () => {
    stopBell();
    setActiveAlarm(null);
  };

  const testAlarm = () => {
    if (!settings) return;
    playBell(settings.sound_type, settings.volume, 3);
  };

  // Helper: Format Dates to Turkish Locales
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  // Find today's day of week
  const todayDay = currentTime ? currentTime.getDay() || 7 : 1;
  const todaySchedule = schedule.filter(item => item.day_of_week === todayDay);
  const todayItems = todaySchedule.map(item => {
    const slot = slots.find(s => s.id === item.slot_id);
    return { ...item, slot };
  }).filter(item => item.slot !== undefined) as (TeacherSchedule & { slot: LessonSlot })[];
  todayItems.sort((a, b) => a.slot.order_index - b.slot.order_index);

  return (
    <>
      <Navbar />
      <main className="main-wrapper">
        
        {/* VISUAL ALARM SCREEN COVER (FULL SCREEN GLOW ON PLAYBACK) */}
        {activeAlarm && (
          <div className={`${styles.alarmOverlay} alarm-active`}>
            <div className={styles.alarmModal}>
              <Bell className="animate-ring" size={90} />
              <h2>{activeAlarm.message}</h2>
              <div className={styles.alarmModalDetails}>
                <span className={styles.alarmModalBadge}>{activeAlarm.lessonName}</span>
                {nextBell?.subject && <p>{nextBell.subject} ({nextBell.classroom})</p>}
              </div>
              <button onClick={handleStopAlarm} className="glass-button" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--accent-danger)' }}>
                <VolumeX size={18} />
                <span>Zili Sustur</span>
              </button>
            </div>
          </div>
        )}

        <div className={styles.dashboardGrid}>
          
          {/* COLUMN 1: LIVE TIME MONITOR */}
          <div className={`${styles.clockCard} glass-panel animate-clock`}>
            <div className={styles.clockHeader}>
              <Clock size={20} className={styles.clockIcon} />
              <span>GÜNCEL SAAT</span>
            </div>
            
            <div className={styles.clockTime}>
              {currentTime ? formatTime(currentTime) : '00:00:00'}
            </div>
            
            <div className={styles.clockDate}>
              {currentTime ? formatDate(currentTime) : ''}
            </div>

            {/* MONITOR ACTIVATOR BUTTON */}
            <button 
              onClick={toggleMonitoring} 
              className={`glass-button ${isMonitoring ? styles.monitoringActive : styles.monitoringIdle}`}
            >
              {isMonitoring ? (
                <>
                  <Bell className="animate-ring" size={20} />
                  <span>ZİL MONİTÖRÜ AKTİF</span>
                </>
              ) : (
                <>
                  <Play size={20} fill="white" />
                  <span>ZİL MONİTÖRÜNÜ BAŞLAT</span>
                </>
              )}
            </button>

            {/* STATUS LABELS */}
            <div className={styles.statusRow}>
              <div className={styles.statusItem}>
                <span className={`${styles.statusDot} ${isMonitoring ? styles.dotGreen : styles.dotRed}`}></span>
                <span className={styles.statusText}>
                  Ses Modu: {isMonitoring ? 'Aktif (Zil çalabilir)' : 'Kapalı (Sessiz)'}
                </span>
              </div>
              
              <div className={styles.statusItem}>
                <span className={`${styles.statusDot} ${wakeLock ? styles.dotGreen : styles.dotRed}`}></span>
                <span className={styles.statusText}>
                  Uyanık Kalma: {wakeLock ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>

            {/* MOBILE BROWSER DISCLAIMER */}
            {!isMonitoring && (
              <div className={styles.disclaimer}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>Zil sesinin çalması için <strong>Giriş Zili Monitörünü Başlat</strong> butonuna tıklamalısınız. Ekranınız açık kalacaktır.</span>
              </div>
            )}
          </div>

          {/* COLUMN 2: NEXT BELL COUNTDOWN */}
          <div className={`${styles.countdownCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <Bell size={20} className={styles.headerIcon} />
              <h2>Sıradaki Zil</h2>
            </div>

            {nextBell ? (
              <div className={styles.countdownContent}>
                <div className={styles.countdownTimer}>
                  {nextBell.timeLeftStr}
                </div>
                <div className={styles.countdownDetails}>
                  <p>
                    <strong>{nextBell.name} {nextBell.type === 'start' ? 'Giriş' : 'Çıkış'} Zili</strong> saat{' '}
                    <span className={styles.timeBadge}>{nextBell.timeStr}</span>'da çalacak.
                  </p>
                  
                  {nextBell.subject && (
                    <div className={styles.lessonMeta}>
                      <span className={styles.metaLabel}>Ders:</span>
                      <span className={styles.metaValue}>{nextBell.subject} ({nextBell.classroom || 'Sınıf Belirtilmedi'})</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.noCountdown}>
                <BellOff size={40} className={styles.noCountdownIcon} />
                <p>Bugün için planlanmış başka bir ders ziliniz bulunmuyor.</p>
                <Link href="/dashboard/schedule" className="glass-button" style={{ marginTop: '10px' }}>
                  Programı Düzenle
                </Link>
              </div>
            )}

            <div className={styles.testButtons}>
              <button onClick={testAlarm} className="glass-button" style={{ flex: 1 }}>
                <Volume2 size={16} />
                <span>Ses Testi</span>
              </button>
            </div>
          </div>

        </div>

        {/* ROW 3: TODAY'S LESSONS */}
        <section className={`${styles.todaySection} glass-panel`}>
          <div className={styles.cardHeader}>
            <Award size={20} className={styles.headerIcon} />
            <h2>Bugünkü Ders Programınız</h2>
          </div>

          {todayItems.length > 0 ? (
            <div className={styles.tableResponsive}>
              <table className={styles.scheduleTable}>
                <thead>
                  <tr>
                    <th>Ders</th>
                    <th>Saat</th>
                    <th>Ders Adı</th>
                    <th>Sınıf / Şube</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {todayItems.map(item => {
                    const slot = item.slot;
                    const startParts = slot.start_time.split(':');
                    const endParts = slot.end_time.split(':');

                    const start = new Date(currentTime!);
                    start.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0);
                    
                    const end = new Date(currentTime!);
                    end.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0);

                    const isActiveLesson = currentTime!.getTime() >= start.getTime() && currentTime!.getTime() <= end.getTime();
                    const isPassedLesson = currentTime!.getTime() > end.getTime();

                    return (
                      <tr key={item.id} className={isActiveLesson ? styles.activeRow : ''}>
                        <td>
                          <strong>{slot.name}</strong>
                        </td>
                        <td>
                          <span className={styles.timeSpan}>
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </span>
                        </td>
                        <td>{item.subject || '-'}</td>
                        <td>
                          <span className={styles.classBadge}>
                            {item.classroom || '-'}
                          </span>
                        </td>
                        <td>
                          {isActiveLesson ? (
                            <span className={`${styles.badge} ${styles.badgeActive}`}>Dersi İşliyorsunuz</span>
                          ) : isPassedLesson ? (
                            <span className={`${styles.badge} ${styles.badgePassed}`}>Tamamlandı</span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgePending}`}>Bekliyor</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyToday}>
              <p>Bugün için ders tanımlanmamış. Boş gününüzün tadını çıkarın ya da programınızı düzenleyin.</p>
            </div>
          )}
        </section>

      </main>
    </>
  );
}
