'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, hasSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import { KeyRound, Mail, User, School, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import styles from './page.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('Nuri Erbak Anadolu Lisesi');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Handle URL param ?demo=true to trigger instant demo mode
  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      handleDemoMode();
    }
  }, [searchParams]);

  const handleDemoMode = () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const mockUserId = 'demo-teacher-uuid';
      const demoData = {
        user: {
          id: mockUserId,
          email: 'ogretmen@nurierbak.edu.tr',
          user_metadata: {},
        },
        profile: {
          id: mockUserId,
          full_name: 'Nuri Hoca (Örnek Hesap)',
          school_name: 'Nuri Erbak Anadolu Lisesi',
          created_at: new Date().toISOString(),
        }
      };

      // Set demo credentials
      localStorage.setItem('demo_user', JSON.stringify(demoData));
      
      // Inject some default lesson slots to localStorage if not exists
      const savedSlots = localStorage.getItem(`slots_${mockUserId}`);
      if (!savedSlots) {
        const defaultSlots = [
          { id: 's1', teacher_id: mockUserId, name: '1. Ders', start_time: '08:30', end_time: '09:10', order_index: 1 },
          { id: 's2', teacher_id: mockUserId, name: '2. Ders', start_time: '09:20', end_time: '10:00', order_index: 2 },
          { id: 's3', teacher_id: mockUserId, name: '3. Ders', start_time: '10:10', end_time: '10:50', order_index: 3 },
          { id: 's4', teacher_id: mockUserId, name: '4. Ders', start_time: '11:00', end_time: '11:40', order_index: 4 },
          { id: 's5', teacher_id: mockUserId, name: '5. Ders', start_time: '11:50', end_time: '12:30', order_index: 5 },
          { id: 's6', teacher_id: mockUserId, name: '6. Ders', start_time: '13:15', end_time: '13:55', order_index: 6 },
          { id: 's7', teacher_id: mockUserId, name: '7. Ders', start_time: '14:05', end_time: '14:45', order_index: 7 },
          { id: 's8', teacher_id: mockUserId, name: '8. Ders', start_time: '14:55', end_time: '15:35', order_index: 8 },
        ];
        localStorage.setItem(`slots_${mockUserId}`, JSON.stringify(defaultSlots));
      }

      // Inject some default schedules to localStorage if not exists
      const savedSchedule = localStorage.getItem(`schedule_${mockUserId}`);
      if (!savedSchedule) {
        // Find current day of week (1-7, Monday-Sunday)
        const currentDay = new Date().getDay() || 7; // Convert 0 (Sunday) to 7
        const defaultSchedule = [
          { id: 'sch1', teacher_id: mockUserId, day_of_week: currentDay, slot_id: 's1', subject: 'Matematik', classroom: '10-A' },
          { id: 'sch2', teacher_id: mockUserId, day_of_week: currentDay, slot_id: 's2', subject: 'Matematik', classroom: '10-A' },
          { id: 'sch3', teacher_id: mockUserId, day_of_week: currentDay, slot_id: 's3', subject: 'Geometri', classroom: '11-C' },
          { id: 'sch4', teacher_id: mockUserId, day_of_week: currentDay, slot_id: 's5', subject: 'Etüt', classroom: 'Kütüphane' },
          { id: 'sch5', teacher_id: mockUserId, day_of_week: currentDay, slot_id: 's6', subject: 'Matematik', classroom: '12-B' },
        ];
        localStorage.setItem(`schedule_${mockUserId}`, JSON.stringify(defaultSchedule));
      }

      // Inject default bell settings if not exists
      const savedSettings = localStorage.getItem(`settings_${mockUserId}`);
      if (!savedSettings) {
        const defaultSettings = {
          teacher_id: mockUserId,
          sound_type: 'melodic',
          volume: 1.0,
          vibrate: true,
          ring_duration: 10,
          ring_on_start: true,
          ring_on_end: true,
        };
        localStorage.setItem(`settings_${mockUserId}`, JSON.stringify(defaultSettings));
      }

      // Small delay for UX feel, then reload to let AuthContext see the localStorage changes
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 800);
    } catch (err: any) {
      setErrorMsg('Demo girişinde bir sorun oluştu.');
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    if (!hasSupabaseConfigured()) {
      setErrorMsg('Supabase bağlantı değişkenleri yapılandırılmamış. Lütfen Demo Modunu kullanın.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // SIGN IN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      } else {
        // SIGN UP
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              school_name: schoolName,
            }
          }
        });
        if (error) throw error;

        if (data.user) {
          // Explicitly create profile to guarantee it exists
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: data.user.id, full_name: fullName, school_name: schoolName }]);
          
          if (profileError) {
            console.error('Error inserting profile on signup:', profileError);
          }
          
          // Seed default lesson slots for the new user
          const defaultSlots = [
            { teacher_id: data.user.id, name: '1. Ders', start_time: '08:30:00', end_time: '09:10:00', order_index: 1 },
            { teacher_id: data.user.id, name: '2. Ders', start_time: '09:20:00', end_time: '10:00:00', order_index: 2 },
            { teacher_id: data.user.id, name: '3. Ders', start_time: '10:10:00', end_time: '10:50:00', order_index: 3 },
            { teacher_id: data.user.id, name: '4. Ders', start_time: '11:00:00', end_time: '11:40:00', order_index: 4 },
            { teacher_id: data.user.id, name: '5. Ders', start_time: '11:50:00', end_time: '12:30:00', order_index: 5 },
            { teacher_id: data.user.id, name: '6. Ders', start_time: '13:15:00', end_time: '13:55:00', order_index: 6 },
            { teacher_id: data.user.id, name: '7. Ders', start_time: '14:05:00', end_time: '14:45:00', order_index: 7 },
            { teacher_id: data.user.id, name: '8. Ders', start_time: '14:55:00', end_time: '15:35:00', order_index: 8 },
          ];

          await supabase.from('lesson_slots').insert(defaultSlots);

          // Seed default bell settings
          const defaultSettings = {
            teacher_id: data.user.id,
            sound_type: 'classic',
            volume: 1.0,
            vibrate: true,
            ring_duration: 8,
            ring_on_start: true,
            ring_on_end: true,
          };
          await supabase.from('bell_settings').insert([defaultSettings]);
        }

        setInfoMsg('Kayıt başarılı! E-posta onayından sonra giriş yapabilirsiniz (veya onay kapatıldıysa doğrudan giriş yapın).');
        setIsLogin(true);
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.authCard} glass-panel`}>
      <div className={styles.tabHeader}>
        <button 
          className={`${styles.tabBtn} ${isLogin ? styles.activeTab : ''}`}
          onClick={() => { setIsLogin(true); setErrorMsg(null); }}
        >
          Giriş Yap
        </button>
        <button 
          className={`${styles.tabBtn} ${!isLogin ? styles.activeTab : ''}`}
          onClick={() => { setIsLogin(false); setErrorMsg(null); }}
        >
          Kayıt Ol
        </button>
      </div>

      <form onSubmit={handleAuth} className={styles.form}>
        {!isLogin && (
          <>
            <div className={styles.inputGroup}>
              <label htmlFor="fullName">Ad Soyad</label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} />
                <input 
                  id="fullName"
                  type="text" 
                  placeholder="Nuri Erbak" 
                  className="glass-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="schoolName">Okul Adı</label>
              <div className={styles.inputWrapper}>
                <School size={18} className={styles.inputIcon} />
                <input 
                  id="schoolName"
                  type="text" 
                  placeholder="Nuri Erbak Anadolu Lisesi" 
                  className="glass-input"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            </div>
          </>
        )}

        <div className={styles.inputGroup}>
          <label htmlFor="email">E-Posta Adresi</label>
          <div className={styles.inputWrapper}>
            <Mail size={18} className={styles.inputIcon} />
            <input 
              id="email"
              type="email" 
              placeholder="isim@okul.k12.tr" 
              className="glass-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password">Şifre</label>
          <div className={styles.inputWrapper}>
            <KeyRound size={18} className={styles.inputIcon} />
            <input 
              id="password"
              type="password" 
              placeholder="••••••••" 
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}
        {infoMsg && <div className={styles.infoBanner}>{infoMsg}</div>}

        <button type="submit" className="glass-button glass-button-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
          {loading ? 'İşleniyor...' : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          <ArrowRight size={18} />
        </button>
      </form>

      <div className={styles.divider}>
        <span>VEYA</span>
      </div>

      <button onClick={handleDemoMode} className={`${styles.demoBtn} glass-button`} disabled={loading}>
        <ShieldCheck size={18} className={styles.demoIcon} />
        <span>Giriş Yapmadan Demo Modunu Aç</span>
      </button>

      {!hasSupabaseConfigured() && (
        <div className={styles.warningMessage}>
          <HelpCircle size={14} style={{ flexShrink: 0 }} />
          <span>Proje sahibi henüz Supabase anahtarlarını girmemiştir. Lütfen <strong>Demo Modu</strong> butonunu kullanarak uygulamayı deneyimleyin.</span>
        </div>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <>
      <Navbar />
      <main className="main-wrapper" style={{ justifyContent: 'center', alignItems: 'center', minHeight: 'calc(80vh - 70px)' }}>
        <Suspense fallback={<div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
