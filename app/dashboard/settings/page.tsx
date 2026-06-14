'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import { getBellSettings, saveBellSettings } from '@/lib/db';
import { BellSettings } from '@/lib/types';
import { playBell, stopBell } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import { 
  Volume2, VolumeX, Play, Save, CheckCircle, Smartphone, 
  User, School, Music, Clock, ShieldAlert, Vibrate
} from 'lucide-react';
import styles from './page.module.css';

export default function Settings() {
  const router = useRouter();
  const { user, profile, loading: authLoading, isDemoMode, refreshProfile } = useAuth();

  // Settings states
  const [settings, setSettings] = useState<BellSettings | null>(null);
  
  // Profile inputs states
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');

  // Status indicators
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Redirect if unauthorized
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load settings & profile
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      const fetchedSettings = await getBellSettings(user.id, isDemoMode);
      setSettings(fetchedSettings);
      
      setFullName(profile?.full_name || '');
      setSchoolName(profile?.school_name || '');
      setLoading(false);
    };

    loadData();
  }, [user, profile, isDemoMode]);

  // Toast notifier
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Sound field handlers
  const handleSettingChange = (field: keyof BellSettings, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value
    });
  };

  // Sound play test handler
  const playTest = () => {
    if (!settings) return;
    setIsPlayingTest(true);
    playBell(settings.sound_type, settings.volume, settings.ring_duration);
    
    if (settings.vibrate && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    setTimeout(() => {
      setIsPlayingTest(false);
    }, settings.ring_duration * 1000);
  };

  const stopTest = () => {
    stopBell();
    setIsPlayingTest(false);
  };

  // Save Settings and Profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !settings) return;

    setSaving(true);

    // 1. Save Bell Settings
    const settingsSuccess = await saveBellSettings(user.id, settings, isDemoMode);

    // 2. Save Profile Info
    let profileSuccess = true;
    if (isDemoMode) {
      // Demo mode local storage save
      const savedUser = localStorage.getItem('demo_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.profile.full_name = fullName.trim();
        parsed.profile.school_name = schoolName.trim();
        localStorage.setItem('demo_user', JSON.stringify(parsed));
      }
    } else {
      // Supabase profiles table update
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          school_name: schoolName.trim(),
        });
      
      if (error) {
        console.error('Error saving profile:', error);
        profileSuccess = false;
      }
    }

    if (settingsSuccess && profileSuccess) {
      await refreshProfile();
      triggerToast('Tüm ayarlar ve profiliniz başarıyla güncellendi.');
    } else {
      triggerToast('Ayarlar kaydedilirken bazı hatalar oluştu.', 'error');
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

  return (
    <>
      <Navbar />
      <main className="main-wrapper">

        {/* TOAST FLOATING BUBBLE */}
        {toast && (
          <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
            <CheckCircle size={18} />
            <span>{toast.message}</span>
          </div>
        )}

        <div className={styles.headerArea}>
          <h1>Zil ve Hesap Ayarları</h1>
          <p className={styles.subtitle}>
            Öğretmen kimlik bilgilerinizi güncelleyin ve ders zillerinizin ses/titreşim tercihlerini özelleştirin.
          </p>
        </div>

        <form onSubmit={handleSave} className={styles.settingsLayout}>
          
          {/* COLUMN 1: BELL SOUND PREFERENCES */}
          <div className={`${styles.settingsCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <Music size={20} className={styles.headerIcon} />
              <h2>Zil Sesi Tercihleri</h2>
            </div>

            {settings && (
              <div className={styles.cardForm}>
                
                {/* SOUND SELECTOR */}
                <div className={styles.formGroup}>
                  <label htmlFor="soundType">Zil Melodisi</label>
                  <select 
                    id="soundType"
                    className="glass-input"
                    value={settings.sound_type}
                    onChange={(e) => handleSettingChange('sound_type', e.target.value)}
                  >
                    <option value="classic">Klasik Okul Zili (Metal Tokmak)</option>
                    <option value="melodic">Melodik Zil (Westminster Saat Melodisi)</option>
                    <option value="digital">Dijital Beep Beep (Alarm Cihazı)</option>
                    <option value="synth">Yumuşak Akor Zil (Modern Elektronik)</option>
                  </select>
                </div>

                {/* VOLUME CONTROLLER */}
                <div className={styles.formGroup}>
                  <div className={styles.labelRow}>
                    <label htmlFor="volume">Ses Seviyesi</label>
                    <span className={styles.labelValue}>{Math.round(settings.volume * 100)}%</span>
                  </div>
                  <div className={styles.rangeWrapper}>
                    {settings.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    <input 
                      id="volume"
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05"
                      value={settings.volume}
                      onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
                      className={styles.rangeInput}
                    />
                  </div>
                </div>

                {/* RING DURATION SLIDER */}
                <div className={styles.formGroup}>
                  <div className={styles.labelRow}>
                    <label htmlFor="ringDuration">Çalma Süresi</label>
                    <span className={styles.labelValue}>{settings.ring_duration} saniye</span>
                  </div>
                  <div className={styles.rangeWrapper}>
                    <Clock size={18} />
                    <input 
                      id="ringDuration"
                      type="range" 
                      min="3" 
                      max="30" 
                      step="1"
                      value={settings.ring_duration}
                      onChange={(e) => handleSettingChange('ring_duration', parseInt(e.target.value))}
                      className={styles.rangeInput}
                    />
                  </div>
                </div>

                {/* VIBRATION TOGGLE */}
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={settings.vibrate}
                      onChange={(e) => handleSettingChange('vibrate', e.target.checked)}
                    />
                    <Vibrate size={18} />
                    <span>Zil çalarken telefon titresin</span>
                  </label>
                </div>

                {/* RING PREFERENCES TOGGLES */}
                <div className={styles.divider}></div>
                
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={settings.ring_on_start}
                      onChange={(e) => handleSettingChange('ring_on_start', e.target.checked)}
                    />
                    <span>Ders Başlangıçlarında Çal (Giriş Zili)</span>
                  </label>
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={settings.ring_on_end}
                      onChange={(e) => handleSettingChange('ring_on_end', e.target.checked)}
                    />
                    <span>Ders Bitişlerinde Çal (Çıkış Zili)</span>
                  </label>
                </div>

                {/* TEST RUNNER BUTTON */}
                <div className={styles.testButtons}>
                  {isPlayingTest ? (
                    <button type="button" onClick={stopTest} className="glass-button" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', width: '100%' }}>
                      <VolumeX size={16} />
                      <span>Testi Durdur</span>
                    </button>
                  ) : (
                    <button type="button" onClick={playTest} className="glass-button" style={{ width: '100%' }}>
                      <Play size={16} fill="white" />
                      <span>Seçilen Zili Test Et</span>
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* COLUMN 2: TEACHER PROFILE INFORMATION */}
          <div className={styles.sidebarColumn}>
            
            <div className={`${styles.settingsCard} glass-panel`}>
              <div className={styles.cardHeader}>
                <User size={20} className={styles.headerIcon} />
                <h2>Öğretmen Profili</h2>
              </div>

              <div className={styles.cardForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="fullName">Ad Soyad</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.inputIcon} />
                    <input 
                      id="fullName"
                      type="text" 
                      placeholder="Ad Soyad"
                      className="glass-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="schoolName">Okul Adı</label>
                  <div className={styles.inputWrapper}>
                    <School size={18} className={styles.inputIcon} />
                    <input 
                      id="schoolName"
                      type="text" 
                      placeholder="Okul Adı"
                      className="glass-input"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Hesap E-Postası</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type="text" 
                      className="glass-input"
                      value={user?.email || ''}
                      disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* DEMO MODE NOTICE BANNER */}
            {isDemoMode && (
              <div className={`${styles.demoBanner} glass-panel`}>
                <ShieldAlert size={20} className={styles.demoIcon} />
                <div>
                  <h4>Demo Hesap Sınırları</h4>
                  <p>Şu anda yerel tarayıcı belleğini kullanıyorsunuz. Profil değişiklikleriniz sadece bu tarayıcıda saklanır.</p>
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              className="glass-button glass-button-primary" 
              style={{ width: '100%', padding: '16px' }}
              disabled={saving}
            >
              <Save size={18} />
              <span>{saving ? 'Güncelleniyor...' : 'Tüm Değişiklikleri Kaydet'}</span>
            </button>
          </div>

        </form>

      </main>
    </>
  );
}
