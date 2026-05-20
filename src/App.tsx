import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { TimetableEditor } from './components/TimetableEditor';
import { BellRing, CheckSquare, Settings, Smartphone, Clock, Calendar, ShieldCheck, ShieldAlert, LogOut, CheckCircle } from 'lucide-react';
import { DayName } from './types';

function SchoolBellApp() {
  const { 
    currentTeacher, 
    activeLessonState, 
    countdownText, 
    turkeyTime, 
    notificationPermission, 
    logout,
    activeLessonIndex
  } = useApp();

  const [activeView, setActiveView] = useState<'dashboard' | 'timetable'>('dashboard');

  if (!currentTeacher) {
    return <LoginScreen />;
  }

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
  const currentDayName = turkishDay as DayName;
  const isWeekend = turkishDay === 'Cumartesi' || turkishDay === 'Pazar';
  
  const todayLessons = !isWeekend ? currentTeacher.timetable[currentDayName] : null;

  // Let's find what is the NEXT school ring label
  let nextZilLabel = 'TAKİP DIŞI';
  if (todayLessons) {
    if (activeLessonState === 'lesson' && activeLessonIndex !== null) {
      const currentSlot = currentTeacher.lessonSlots[activeLessonIndex];
      if (currentSlot) {
        nextZilLabel = `${currentSlot.end} — DERS BİTİŞ`;
      }
    } else if (activeLessonState === 'break' && activeLessonIndex !== null) {
      const nextIdx = activeLessonIndex < 7 ? activeLessonIndex + 1 : activeLessonIndex;
      const nextSlot = currentTeacher.lessonSlots[nextIdx];
      if (nextSlot) {
        nextZilLabel = `${nextSlot.start} — DERS GİRİŞ`;
      }
    } else if (activeLessonState === 'before_school') {
      const firstSlot = currentTeacher.lessonSlots[0];
      if (firstSlot) {
        nextZilLabel = `${firstSlot.start} — DERS GİRİŞ`;
      }
    } else if (activeLessonState === 'after_school') {
      nextZilLabel = 'YARIN 08:45';
    }
  } else if (isWeekend) {
    nextZilLabel = 'PAZARTESİ 08:45';
  }

  // Dynamic state config for Status sidebar card representation
  const getSidebarStatus = () => {
    switch (activeLessonState) {
      case 'lesson':
        return {
          title: 'DERS DEVAM EDİYOR',
          colorClass: 'text-green-400 bg-green-500/10 border-green-500/30',
          pulseClass: 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]'
        };
      case 'break':
        return {
          title: 'TENEFFÜSTESİNİZ',
          colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          pulseClass: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
        };
      case 'before_school':
        return {
          title: 'BAŞLAMA BEKLENİYOR',
          colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
          pulseClass: 'bg-blue-400'
        };
      case 'after_school':
        return {
          title: 'DERSLER TAMAMLANDI',
          colorClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
          pulseClass: 'bg-indigo-400'
        };
      case 'weekend':
      default:
        return {
          title: 'HAFTA SONU TATİLİ',
          colorClass: 'text-slate-400 bg-slate-800 border-slate-700',
          pulseClass: 'bg-slate-500'
        };
    }
  };

  const statusStyle = getSidebarStatus();

  return (
    <div id="school-bell-app-container" className="flex flex-col md:flex-row h-screen w-full bg-[#f0f2f5] font-sans text-slate-800 overflow-hidden relative">
      
      {/* 1. Left Sidebar: Status & Auth (High Density Dark Accent) */}
      <aside id="left-sidebar-panel" className="w-full md:w-80 bg-slate-900 text-white flex flex-col border-r border-slate-800 shadow-xl shrink-0 z-30">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-emerald-400 flex items-center gap-1.5 font-sans">
              <BellRing className="w-5 h-5 text-emerald-400" />
              EkolZil<span className="text-white font-light text-base">.io</span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-mono font-bold">Öğretmen Sınıf Asistanı</p>
          </div>
          <span className="text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">
            V1.2
          </span>
        </div>

        {/* Status Panel (Visible mostly on desktop sidebar, collapsed elegantly on mobile layout) */}
        <div id="sidebar-status-space" className="p-6 flex-1 space-y-6 overflow-y-auto hidden md:block">
          
          {/* Currently Running State Card */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Şu Anki Durum</div>
            <div className={`border rounded-xl p-4 flex items-center gap-4 ${statusStyle.colorClass}`}>
              <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${statusStyle.pulseClass}`}></div>
              <div>
                <div className="font-extrabold text-xs tracking-wider uppercase">{statusStyle.title}</div>
                <div className="text-[11px] opacity-80 font-mono mt-0.5">Süre: {countdownText}</div>
              </div>
            </div>
          </div>

          {/* Next Ring Alarm Counter Widget */}
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
              <div className="text-[10px] text-slate-450 uppercase font-bold tracking-wider mb-1.5">Sıradaki Zil Alarmı</div>
              <div className="text-[15px] font-mono text-red-400 font-bold tracking-tight">
                🔔 {nextZilLabel}
              </div>
            </div>

            {/* Notification Privilege Indicator Flag */}
            <div className="flex items-center gap-3 p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-xl">
              {notificationPermission === 'granted' ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-400 pointer-events-none" />
                  <span className="text-[11px] font-semibold text-slate-300">
                    Sistem Sesleri: <span className="text-emerald-400 font-bold">AKTİF (İZİNLİ)</span>
                  </span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-amber-400 pointer-events-none" />
                  <span className="text-[11px] font-semibold text-slate-450">
                    Sistem Sesleri: <span className="text-amber-400 font-bold">İZİN GEREKLİ</span>
                  </span>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Mini Login Profile Area & Sign Out Controls */}
        <div id="sidebar-teacher-profile" className="p-6 bg-slate-950/80 border-t border-slate-800/80 flex md:flex-col items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center justify-center font-bold text-sm text-emerald-300">
              {currentTeacher.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="text-xs font-bold text-white line-clamp-1">{currentTeacher.fullName}</div>
              <div className="text-[10px] text-slate-400 max-w-[130px] truncate">{currentTeacher.schoolName || 'Okul Tanımlanmadı'}</div>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-slate-850 hover:bg-red-500/10 hover:text-red-400 text-xs font-semibold rounded-lg transition-colors text-slate-300 border border-slate-800 hover:border-red-500/20 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Çıkış</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Frame: Holds the dynamic selected page views */}
      <main id="primary-view-container" className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <header id="main-content-header" className="h-20 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">
                {currentDayName} • {turkeyTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-slate-900 tracking-tight leading-none select-none">
                {turkeyTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
            <div className="flex-col hidden sm:flex">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">ZİL MODELİ</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/80 px-2 py-0.5 rounded-md font-sans">
                KİŞİSEL MELODİ (WEB AUDIO)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveView(activeView === 'dashboard' ? 'timetable' : 'dashboard')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-slate-500/10 transition-all flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>{activeView === 'dashboard' ? 'PROGRAMI KONTROL ET' : 'TAKİP PANELİNE DÖN'}</span>
            </button>
          </div>
        </header>

        {/* Outer scrollable viewport matching #f0f2f5 layout perfectly */}
        <div className="flex-1 overflow-y-auto bg-[#f0f2f5] p-4 sm:p-6 space-y-6 pb-24 sm:pb-8">
          
          {/* Quick Info Box for Mobile View showing status since Left status is hidden on devices! */}
          <div className="block md:hidden bg-slate-900 text-white rounded-xl p-4 shadow-md border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${statusStyle.pulseClass}`}></div>
                <span className="text-xs font-bold tracking-wider uppercase">{statusStyle.title}</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                Süre: {countdownText}
              </span>
            </div>
            <div className="text-xs text-slate-350 border-t border-slate-800 pt-2.5 flex items-center justify-between font-mono">
              <span className="opacity-70">SIradaki Zil:</span>
              <span className="text-red-400 font-bold">{nextZilLabel}</span>
            </div>
          </div>

          {/* Core View Component Renderer */}
          {activeView === 'dashboard' ? (
            <Dashboard onViewTimetable={() => setActiveView('timetable')} />
          ) : (
            <TimetableEditor onBackToHome={() => setActiveView('dashboard')} />
          )}

        </div>
      </main>

      {/* 3. Floating Quick-Menu Dock (Specifically created for mobile web screen shortcuts!) */}
      <nav id="mobile-dock-navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-6 py-3 flex justify-around shadow-2xl items-center sm:hidden">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition ${
            activeView === 'dashboard' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>TAKİP PANELİ</span>
        </button>

        <button
          onClick={() => setActiveView('timetable')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition ${
            activeView === 'timetable' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>DERS PROGRAMI</span>
        </button>
      </nav>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SchoolBellApp />
    </AppProvider>
  );
}

