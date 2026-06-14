'use client';
// app/dashboard/page.tsx (Veya hangi sayfada görünmesini istiyorsan)
import NotificationButton from '@/components/NotificationButton';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import { Bell, Clock, Calendar, ShieldCheck, Play, ArrowRight, Music, Smartphone } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const { user, loading } = useAuth();
export default function DashboardPage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Öğretmen Paneli</h1>
      
      <div className="my-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Zil Ayarları</h2>
        <p className="mb-4 text-sm text-gray-600">
          Ders saatlerinde telefonunuza bildirim ve alarm gelmesi için aşağıdaki butona basıp izin verin.
        </p>
        
        {/* BUTONU BURAYA KOYUYORUZ */}
        <NotificationButton />
      </div>

      {/* Sayfanın geri kalan diğer içerikleri (ders programı vb.) */}
    </main>
  );
}

  return (
    <>
      <Navbar />
      <main className="main-wrapper">
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.tag}>
              <Smartphone size={16} />
              <span>Telefonunuz Okul Ziliyle Çalsın</span>
            </div>
            
            <h1>Öğretmenler İçin Özel Ders Zili Alarm Sistemi</h1>
            
            <p className={styles.subtitle}>
              Sınıflarda, öğretmenler odasında ya da okul bahçesinde ders saatlerini kaçırmayın. 
              Kendi ders programınızı girin, zil saatlerinde telefonunuzda okul zili çalsın!
            </p>

            <div className={styles.ctaGroup}>
              {loading ? (
                <div className="glass-button" style={{ minWidth: '160px' }}>Yükleniyor...</div>
              ) : user ? (
                <Link href="/dashboard" className="glass-button glass-button-primary">
                  <span>Zil Monitörünü Aç</span>
                  <Play size={18} fill="white" />
                </Link>
              ) : (
                <>
                  <Link href="/login" className="glass-button glass-button-primary">
                    <span>Hemen Ücretsiz Başla</span>
                    <ArrowRight size={18} />
                  </Link>
                  <Link href="/login?demo=true" className="glass-button">
                    <span>Giriş Yapmadan Dene</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={`${styles.bellCard} glass-panel alarm-active`}>
              <Bell className="animate-ring" size={80} />
              <div className={styles.bellCardStatus}>
                <span className={styles.pulseDot}></span>
                <span>Zil çalıyor! (1. Ders Başlangıcı)</span>
              </div>
              <div className={styles.bellCardDetails}>
                <strong>Matematik</strong>
                <span>Sınıf: 10-A | 08:30</span>
              </div>
            </div>
          </div>
        </div>

        <section className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Neden NEAL ZİL?</h2>
          <div className="grid-container">
            
            <div className="glass-panel glass-panel-hover p-6">
              <div className={`${styles.iconContainer} ${styles.blue}`}>
                <Calendar size={24} />
              </div>
              <h3 className={styles.featureTitle}>Kişisel Ders Programı</h3>
              <p className={styles.featureText}>
                Hangi gün, hangi saatte hangi sınıfta dersiniz olduğunu kolayca tanımlayın. Sadece sizin derslerinizde çalsın.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover p-6">
              <div className={`${styles.iconContainer} ${styles.purple}`}>
                <Clock size={24} />
              </div>
              <h3 className={styles.featureTitle}>Ekranı Açık Tutma (Wake Lock)</h3>
              <p className={styles.featureText}>
                Zil monitörü ekranı açık kaldığı sürece telefonunuz uyku moduna geçmez, alarmlarınız milisaniyelik hassasiyetle çalar.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover p-6">
              <div className={`${styles.iconContainer} ${styles.green}`}>
                <Music size={24} />
              </div>
              <h3 className={styles.featureTitle}>Sentezlenmiş Melodiler</h3>
              <p className={styles.featureText}>
                Klasik metal okul zili, modern melodik tınılar veya dijital beeper sesleri arasından dilediğinizi seçin. İnternet gerektirmeden çalar.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover p-6">
              <div className={`${styles.iconContainer} ${styles.orange}`}>
                <ShieldCheck size={24} />
              </div>
              <h3 className={styles.featureTitle}>Supabase Altyapısı</h3>
              <p className={styles.featureText}>
                Verileriniz güvenle bulutta saklanır. Vercel üzerinde barındırılan sisteminiz her an yüksek performansla çalışır.
              </p>
            </div>

          </div>
        </section>

        <footer className={styles.footer}>
          <p>© 2026 NEAL ZİL. Nuri Erbak Anadolu Lisesi Öğretmen Yardımlaşma Platformu.</p>
        </footer>
      </main>
    </>
  );
}
