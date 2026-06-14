'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Bell, LogOut, Clock, Calendar, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, profile, signOut, isDemoMode } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      await signOut();
      router.push('/');
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* MOBILE TOP LOGO HEADER */}
      <header className={`${styles.topHeader} glass-panel`}>
        <div className={styles.topContainer}>
          <Link href="/" className={styles.logo}>
            <Bell className={`${styles.logoIcon} ${isActive('/') ? 'animate-ring' : ''}`} />
            <span className={styles.logoText}>NEAL <span className={styles.logoHighlight}>ZİL</span></span>
          </Link>

          <div className={styles.topRight}>
            {isDemoMode && (
              <div className={styles.demoBadge} title="Demo modu aktif. Tarayıcı hafızası kullanılıyor.">
                <ShieldAlert size={14} />
                <span>Demo</span>
              </div>
            )}
            
            {user && (
              <button 
                onClick={handleSignOut} 
                className={styles.logoutBtn} 
                title="Çıkış Yap"
                aria-label="Çıkış Yap"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION TABS BAR (Only shown when authenticated) */}
      {user && (
        <nav className={`${styles.bottomNav} glass-panel`}>
          <Link 
            href="/dashboard" 
            className={`${styles.tabItem} ${isActive('/dashboard') ? styles.activeTab : ''}`}
          >
            <Clock size={22} />
            <span>Monitör</span>
          </Link>
          
          <Link 
            href="/dashboard/schedule" 
            className={`${styles.tabItem} ${isActive('/dashboard/schedule') ? styles.activeTab : ''}`}
          >
            <Calendar size={22} />
            <span>Programı</span>
          </Link>

          <Link 
            href="/dashboard/settings" 
            className={`${styles.tabItem} ${isActive('/dashboard/settings') ? styles.activeTab : ''}`}
          >
            <SettingsIcon size={22} />
            <span>Ayarlar</span>
          </Link>
        </nav>
      )}
    </>
  );
}
