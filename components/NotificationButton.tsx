'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function BildirimAc() {
  const supabase = createClientComponentClient();

  const zilSesiniAc = async () => {
    // 1. Tarayıcıdan izin iste
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // 2. Service Worker'ı kaydet
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // 3. Abonelik oluştur
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // 4. Supabase'e gönder
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions').upsert({
          teacher_id: user.id,
          subscription: subscription
        });
        alert('Zil Başarıyla Aktif Edildi! Artık ders saatinde bildirim gelecek.');
      } else {
        alert('Lütfen önce giriş yapın.');
      }
    } else {
      alert('Bildirim izni reddedildi. Lütfen tarayıcı ayarlarından izni açın.');
    }
  };

  return (
    <button 
      onClick={zilSesiniAc}
      style={{padding: '10px', backgroundColor: '#0070f3', color: 'white', borderRadius: '5px', cursor: 'pointer'}}
    >
      🔔 Bildirimleri / Zil Sesini Aktifleştir
    </button>
  );
}