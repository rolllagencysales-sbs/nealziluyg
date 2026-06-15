'use client';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import NotificationButton from "@/components/NotificationButton";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent-blue)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="main-wrapper">
        <h1 className="text-center" style={{ margin: '10px 0 20px 0', textAlign: 'center' }}>Öğretmen Paneli</h1>
        
        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Zil ve Bildirim Ayarı
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Ders saatlerinde alarmın çalması için bildirimleri aktif etmeniz gerekmektedir.
              </p>
              <NotificationButton />
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Giriş Yapılan Hesap:</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user.email}</p>
            </div>

            <a href="/dashboard" className="glass-button glass-button-primary" style={{ width: '100%', textDecoration: 'none' }}>
              Monitöre Git
            </a>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', borderStyle: 'dashed', borderWidth: '2px' }}>
            <p style={{ color: 'var(--accent-danger)', fontWeight: '500' }}>Sistemi kullanmak için giriş yapmalısınız.</p>
            <a href="/login" className="glass-button glass-button-primary" style={{ textDecoration: 'none' }}>
              Giriş Yap
            </a>
          </div>
        )}
      </main>
    </>
  );
}