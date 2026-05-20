import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, Volume2, ShieldOff, CheckCircle2, Shield, AlertTriangle, 
  Clock, Play, Square, LogOut, Sun, Monitor, RefreshCw, Trash2, Sliders, Smartphone
} from 'lucide-react';
import { DayName } from '../types';

export const Dashboard: React.FC<{ onViewTimetable: () => void }> = ({ onViewTimetable }) => {
  const {
    currentTeacher,
    logs,
    turkeyTime,
    activeLessonIndex,
    activeLessonState,
    countdownText,
    volume,
    setVolume,
    wakeLockActive,
    toggleWakeLock,
    playTestStartBell,
    playTestEndBell,
    testNotification,
    isSimulatorActive,
    setIsSimulatorActive,
    simulatedTimeOffset,
    setSimulatedTimeOffset,
    logout,
    clearLogs,
    triggerManualBell,
    requestNotificationPerm,
    notificationPermission,
    backgroundModeActive,
    toggleBackgroundMode
  } = useApp();

  const [simHour, setSimHour] = useState('08');
  const [simMin, setSimMin] = useState('44');

  if (!currentTeacher) return null;

  // Find Day in Turkey (Istanbul Time)
  const daysTurkish: Record<string, string> = {
    'Monday': 'Pazartesi',
    'Tuesday': 'Salı',
    'Wednesday': 'Çarşamba',
    'Thursday': 'Perşembe',
    'Friday': 'Cuma',
    'Saturday': 'Cumartesi',
    'Sunday': 'Pazar'
  };

  const englishDay = turkeyTime.toLocaleDateString('en-US', { weekday: 'long' });
  const turkishDay = daysTurkish[englishDay] || englishDay;

  // Find current and next lesson models
  const currentDayName = turkishDay as DayName;
  const isWeekend = turkishDay === 'Cumartesi' || turkishDay === 'Pazar';
  
  const todayLessons = !isWeekend ? currentTeacher.timetable[currentDayName] : null;
  const currentActiveLesson = (activeLessonIndex !== null && todayLessons) ? todayLessons[activeLessonIndex] : null;

  // Let's find what is the NEXT lesson
  let nextLesson = null;
  let nextLessonTime = '';
  if (todayLessons && activeLessonIndex !== null) {
    if (activeLessonState === 'lesson' && activeLessonIndex < 7) {
      nextLesson = todayLessons[activeLessonIndex + 1];
      nextLessonTime = currentTeacher.lessonSlots[activeLessonIndex + 1].start;
    } else if (activeLessonState === 'break' && activeLessonIndex < 7) {
      nextLesson = todayLessons[activeLessonIndex + 1];
      nextLessonTime = currentTeacher.lessonSlots[activeLessonIndex + 1].start;
    }
  } else if (todayLessons && activeLessonState === 'before_school') {
    nextLesson = todayLessons[0];
    nextLessonTime = currentTeacher.lessonSlots[0].start;
  }

  // Calculate simulated time from picker
  const handleApplySimTime = () => {
    // We calculate difference in seconds between picker time and actual date
    const now = new Date();
    // Convert to Turkey zone base
    const trStr = now.toLocaleString("en-US", {timeZone: "Europe/Istanbul"});
    const trNow = new Date(trStr);
    
    const target = new Date(trNow);
    target.setHours(parseInt(simHour), parseInt(simMin), 0);
    
    const diffSeconds = Math.round((target.getTime() - trNow.getTime()) / 1000);
    setSimulatedTimeOffset(diffSeconds);
    setIsSimulatorActive(true);
  };

  const handleResetSimTime = () => {
    setIsSimulatorActive(false);
    setSimulatedTimeOffset(0);
  };

  // Status Cards colors mapping
  const getBannerConfig = () => {
    switch (activeLessonState) {
      case 'lesson':
        return {
          header: 'DERS DEVAM EDİYOR',
          bg: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900',
          badge: 'bg-emerald-600 text-white',
          glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.08)] ring-1 ring-emerald-500/10'
        };
      case 'break':
        return {
          header: 'TENEFFÜSTESİNİZ',
          bg: 'bg-amber-50/70 border-amber-200/80 text-amber-900',
          badge: 'bg-amber-600 text-white',
          glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.08)] ring-1 ring-amber-500/10'
        };
      case 'before_school':
        return {
          header: 'DERS SAATİ BEKLENİYOR',
          bg: 'bg-blue-50/70 border-blue-200/80 text-blue-900',
          badge: 'bg-blue-600 text-white',
          glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.05)] ring-1 ring-blue-500/10'
        };
      case 'after_school':
        return {
          header: 'BUGÜNKÜ DERSLER BİTTİ',
          bg: 'bg-indigo-50/70 border-indigo-200/80 text-indigo-900',
          badge: 'bg-indigo-600 text-white',
          glow: 'shadow-[0_4px_20px_rgba(99,102,241,0.05)] ring-1 ring-indigo-500/10'
        };
      case 'weekend':
      default:
        return {
          header: 'HAFTA SONU TATİLİ',
          bg: 'bg-slate-50/70 border-slate-200/85 text-slate-600',
          badge: 'bg-slate-500 text-white',
          glow: 'shadow-sm ring-1 ring-slate-300/30'
        };
    }
  };

  const banner = getBannerConfig();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 px-1 py-1 text-slate-800">
      
      {/* 1. Header Profile & Quick Logout */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5 self-start sm:self-center">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 shadow-inner">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 text-lg leading-tight">{currentTeacher.fullName}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-250 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Aktif</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{currentTeacher.schoolName || 'Okul Tanımlanmadı'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            onClick={onViewTimetable}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Programı Düzenle</span>
          </button>
          
          <button
            onClick={logout}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl text-xs font-bold border border-red-200 transition-all flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* 2. Clock & Main Interactive Bell Screen */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* BIG TACTILE CLOCK AND THE COUNTDOWN TIMER (8 Columns) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* Main Visual Clock */}
          <div className={`bg-white rounded-2xl border border-slate-205 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden ${banner.glow} transition-all`}>
            
            {/* Header pill representation of today */}
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-500 uppercase bg-slate-50 border border-slate-200 px-3.5 py-1 rounded-full mb-4">
              {turkeyTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} • {turkishDay}
            </span>

            {/* Simulated Banner Indicator */}
            {isSimulatorActive && (
              <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold tracking-wider px-3 py-0.5 rounded-full mb-4 animate-pulse uppercase">
                ⚙️ Simülatör Modu Aktif
              </span>
            )}

            {/* Ticking Live Standard Clock (Istanbul Timezone) */}
            <h2 className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 select-none">
              {turkeyTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </h2>
            <div className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-1.5 font-bold">Türkiye Gerçek Saati (UTC+3)</div>

            {/* Countdown Area */}
            <div className={`w-full mt-6 p-4 rounded-xl border ${banner.bg} flex flex-col items-center transition-all`}>
              <span className="text-[10px] uppercase font-extrabold tracking-widest opacity-80 mb-0.5">{banner.header}</span>
              
              {/* Massive Countdown Text */}
              <div className="text-4 relative font-mono text-slate-900 tracking-wider my-2.5 font-black text-4xl">
                {countdownText}
              </div>

              {/* Detail message about current/next lesson */}
              <div className="text-xs text-slate-650 font-medium max-w-sm text-center mt-1 leading-relaxed">
                {activeLessonState === 'lesson' && currentActiveLesson && (
                  <span>
                    Şu anki Ders: <strong className="text-emerald-750 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded font-bold font-sans">{currentActiveLesson.lessonName}</strong> ({currentActiveLesson.classTeacher})
                  </span>
                )}
                {activeLessonState === 'break' && todayLessons && activeLessonIndex !== null && (
                  <span>
                    Az önce biten: <strong className="text-red-750 bg-red-100 border border-red-200 px-2 py-0.5 rounded font-bold font-sans">{todayLessons[activeLessonIndex].lessonName}</strong>. Dinlenme zamanı!
                  </span>
                )}
                {activeLessonState === 'before_school' && (
                  <span>Okulun başlamasına hazır olunuz. İlk ders zili 08:45'te çalacak.</span>
                )}
                {activeLessonState === 'after_school' && (
                  <span>Günün ders planı başarıyla tamamlandı.</span>
                )}
                {activeLessonState === 'weekend' && (
                  <span>Güzel bir hafta sonu dinlenmesi dileriz!</span>
                )}
              </div>
            </div>

            {/* Next Lesson Status Bar */}
            {nextLesson && (
              <div className="w-full mt-4 flex items-center justify-between text-xs px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sıradaki Ders:</span>
                  <strong className="text-slate-800 font-extrabold">{nextLesson.lessonName || 'Boş Seans'}</strong>
                  {nextLesson.classTeacher && <span className="text-[10px] text-slate-400 font-bold">({nextLesson.classTeacher})</span>}
                </span>
                <span className="font-mono text-emerald-600 font-bold">Saat: {nextLessonTime}</span>
              </div>
            )}
          </div>

          {/* Sound & Physical Awake Controls */}
          <div className="bg-white rounded-2xl border border-slate-205 p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>Zil & Mobil Cihaz Ayarları</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Volume Controller Slider */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">Zil Ses Seviyesi</span>
                  <span className="text-xs font-mono font-bold text-emerald-600">% {Math.round(volume * 100)}</span>
                </div>
                <div className="flex items-center space-x-3 mt-2">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-slate-900 bg-slate-200 rounded-lg appearance-none cursor-pointer h-1.5"
                  />
                </div>
                <p className="text-[10px] text-slate-450 mt-2.5 leading-tight font-medium">
                  Uygulama arka plandayken çalan zil ses yüksekliğini ayarlar.
                </p>
              </div>

              {/* Wake Lock Screen Awake Controller */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Ekranı Her Zaman Açık Tut</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${wakeLockActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></span>
                </div>
                
                <button
                  onClick={toggleWakeLock}
                  className={`mt-3 py-2 w-full text-xs font-bold rounded-lg border transition-all ${
                    wakeLockActive 
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                    : 'bg-white hover:bg-slate-100 border-slate-250 text-slate-700'
                  }`}
                >
                  {wakeLockActive ? '🟢 Ekran Koruması Aktif (Açık)' : '🔒 Ekranı Açık Tutmayı Etkinleştir'}
                </button>

                <p className="text-[10px] text-slate-450 mt-2.5 leading-tight font-medium">
                  Telefonun ders sırasında uyku moduna geçip kapanmasını engeller.
                </p>
              </div>

              {/* Kesintisiz Arka Plan Calisma Motoru - PWA Keep-Alive */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Kesintisiz Arka Plan Motoru</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${backgroundModeActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></span>
                </div>
                
                <button
                  onClick={toggleBackgroundMode}
                  className={`mt-3 py-2 w-full text-xs font-bold rounded-lg border transition-all ${
                    backgroundModeActive 
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                    : 'bg-white hover:bg-slate-100 border-slate-250 text-slate-700'
                  }`}
                >
                  {backgroundModeActive ? '🟢 Kesintisiz Motor Aktif (Açık)' : '⚙️ Arka Plan Motorunu Etkinleştir'}
                </button>

                <p className="text-[10px] text-slate-450 mt-2.5 leading-tight font-medium">
                  Ekran kilitliyken veya uygulama arka plandayken çan çalma hassasiyetini garantiler.
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* NOTIFICATION CONTROLS & MANUAL TRIGGERS (4 Columns) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* Push Notifications Configuration Box */}
          <div className="bg-white rounded-2xl border border-slate-205 p-4 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Bildirim İzin Durumu</span>
            </h3>

            {/* Render Status Representation */}
            {notificationPermission === 'granted' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <div className="inline-flex p-1.5 bg-emerald-100 text-emerald-600 rounded-full mb-1">
                  <CheckCircle2 className="w-5 h-5 pointer-events-none" />
                </div>
                <h4 className="text-xs font-bold text-emerald-800">Bildirim İzni Aktif</h4>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">Ders zil vakitlerinde tarayıcı üzerinden sesli ve görsel uyarılar iletilir.</p>
              </div>
            ) : notificationPermission === 'denied' ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <div className="inline-flex p-1.5 bg-red-100 text-red-650 rounded-full mb-1">
                  <ShieldOff className="w-5 h-5 pointer-events-none" />
                </div>
                <h4 className="text-xs font-bold text-red-850">İzin Verilmedi</h4>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">Tarayıcı ayarlarından bildirim gönderme izni vermeniz önerilir.</p>
              </div>
            ) : (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                <div className="inline-flex p-1.5 bg-indigo-100 text-indigo-600 rounded-full mb-1">
                  <Shield className="w-5 h-5 animate-bounce pointer-events-none" />
                </div>
                <h4 className="text-xs font-bold text-indigo-850 font-sans">İzin Alınmadı</h4>
                <p className="text-[10px] text-slate-500 mt-1 mb-3 leading-relaxed font-medium">
                  Zilin arka planda çalışabilmesi için bildirim izni vermelisiniz.
                </p>
                <button
                  onClick={requestNotificationPerm}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-sm"
                >
                  İzin İste
                </button>
              </div>
            )}

            {/* Test Utilities Group */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest block">SİSTEM SES TESTLERİ</span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={playTestStartBell}
                  className="py-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-extrabold font-sans flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span>Giriş Zili</span>
                </button>

                <button
                  onClick={playTestEndBell}
                  className="py-2.5 bg-red-50 hover:bg-red-100/80 text-red-700 border border-red-200 rounded-lg text-xs font-extrabold font-sans flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Bell className="w-4 h-4 text-red-600" />
                  <span>Çıkış Zili</span>
                </button>
              </div>

              <button
                onClick={testNotification}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all"
              >
                📱 Telefonuma Test Bildirimi At
              </button>
            </div>

          </div>

          {/* Quick Manual Ring Panel */}
          {!isWeekend && todayLessons && (
            <div className="bg-white rounded-2xl border border-slate-205 p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Manuel Zil Çaldır</span>
              </h3>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Dersi beklemeden sınıfta zili çalmak için Giriş/Çıkış butonlarını kullanın:
              </p>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {todayLessons.map((cell, idx) => {
                  const lessonNum = idx + 1;
                  const hasLesson = !!cell.lessonName;
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
                        activeLessonIndex === idx 
                          ? 'bg-emerald-50 border-emerald-300' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-800 text-[11px]">{lessonNum}. Ders</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[100px] font-medium">
                          {hasLesson ? cell.lessonName : 'Boş Seans'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => triggerManualBell(lessonNum, 'start')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[9px] font-bold uppercase transition-all"
                          title="Ders Başladı Zili Çal"
                        >
                          Giriş
                        </button>
                        <button
                          onClick={() => triggerManualBell(lessonNum, 'end')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-[9px] font-bold uppercase transition-all"
                          title="Ders Bitti Zili Çal"
                        >
                          Çıkış
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 3. TIME TRAVEL SIMULATOR MODULE FOR TESTING */}
      <div className="bg-white rounded-2xl border border-slate-205 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin-slow" />
            <h3 className="text-sm font-bold text-slate-900 font-sans">EkolZil Test Simülatörü (Zaman Yolculuğu)</h3>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Zillerin tam vaktinde çaldığını test etmek için saati değiştirebilirsiniz.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 py-1">
          <div className="flex items-center space-x-3 w-full sm:w-auto bg-slate-55 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider font-sans shrink-0">Simüle Edilecek Saat:</span>
            
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="0"
                max="23"
                value={simHour}
                onChange={(e) => setSimHour(e.target.value.padStart(2, '0'))}
                className="w-12 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-sm py-1 focus:outline-none focus:border-emerald-500 text-slate-900"
              />
              <span className="text-slate-400 font-bold">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={simMin}
                onChange={(e) => setSimMin(e.target.value.padStart(2, '0'))}
                className="w-12 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-sm py-1 focus:outline-none focus:border-emerald-500 text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleApplySimTime}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all w-full sm:w-auto justify-center shadow-sm"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zamanı Değiştir</span>
            </button>

            {isSimulatorActive && (
              <button
                onClick={handleResetSimTime}
                className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 border border-red-200 transition-all justify-center"
              >
                <Square className="w-3.5 h-3.5 text-red-500" />
                <span>Simülasyonu Kapat (Gerçek Saat)</span>
              </button>
            )}
          </div>
        </div>

        {/* Mini shortcut badge clicks */}
        <div className="flex flex-wrap gap-1.5 items-center pt-1">
          <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider mr-1">Önerilen Test Saatleri:</span>
          
          <button
            onClick={() => { setSimHour('08'); setSimMin('44'); }}
            className={`px-3 py-1 text-[11px] rounded-lg font-mono font-bold border transition ${simHour === '08' && simMin === '44' ? 'bg-slate-900 text-white border-transparent' : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700'}`}
          >
            08:44 (1. Ders Girişi - 08:45)
          </button>
          
          <button
            onClick={() => { setSimHour('09'); setSimMin('24'); }}
            className={`px-3 py-1 text-[11px] rounded-lg font-mono font-bold border transition ${simHour === '09' && simMin === '24' ? 'bg-slate-900 text-white border-transparent' : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700'}`}
          >
            09:24 (1. Ders Bitişi - 09:25)
          </button>

          <button
            onClick={() => { setSimHour('10'); setSimMin('14'); }}
            className={`px-3 py-1 text-[11px] rounded-lg font-mono font-bold border transition ${simHour === '10' && simMin === '14' ? 'bg-slate-900 text-white border-transparent' : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700'}`}
          >
            10:14 (2. Ders Bitişi - 10:15)
          </button>

          <button
            onClick={() => { setSimHour('12'); setSimMin('04'); }}
            className={`px-3 py-1 text-[11px] rounded-lg font-mono font-bold border transition ${simHour === '12' && simMin === '04' ? 'bg-slate-900 text-white border-transparent' : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700'}`}
          >
            12:04 (5. Ders Girişi - 12:05)
          </button>
        </div>
      </div>

      {/* 4. SYSTEM LOGGER FLOW REPORT */}
      <div className="bg-white rounded-2xl border border-slate-205 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>Sistem Günlüğü ve Bildirim Logları</span>
          </h3>
          <button
            onClick={clearLogs}
            className="p-1 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-[10px] font-bold text-red-650 border border-red-200 transition-all flex items-center space-x-1 shadow-sm"
          >
            <Trash2 className="w-3" />
            <span>Sıfırla</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl max-h-[220px] overflow-y-auto font-mono text-[11px] leading-relaxed p-4 space-y-2 divide-y divide-slate-800">
          {logs.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Herhangi bir sistem olayı kaydedilmedi.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="pt-2 flex items-start space-x-2 text-slate-350 justify-between">
                <div className="flex items-start space-x-2">
                  <span className="text-[10px] text-slate-500 tracking-tight select-none pt-0.5 font-bold">[{log.timestamp}]</span>
                  
                  {/* Categorized badges */}
                  {log.type === 'start' && (
                    <span className="px-1.5 py-0.25 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded font-sans shrink-0 uppercase tracking-wider">GİRİŞ</span>
                  )}
                  {log.type === 'end' && (
                    <span className="px-1.5 py-0.25 text-[9px] font-bold bg-red-400/25 text-red-400 border border-red-400/20 rounded font-sans shrink-0 uppercase tracking-wider">ÇIKIŞ</span>
                  )}
                  {log.type === 'system' && (
                    <span className="px-1.5 py-0.25 text-[9px] font-bold bg-cyan-400/25 text-cyan-400 border border-cyan-400/20 rounded font-sans shrink-0 uppercase tracking-wider">SİSTEM</span>
                  )}
                  
                  <span className="text-slate-300 break-all">{log.message}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
