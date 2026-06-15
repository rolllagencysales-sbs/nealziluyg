'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

export default function NotificationButton() {
  const [status, setStatus] = useState<string>('');
  const { user, isDemoMode } = useAuth();

  const handlePermission = async () => {
    try {
      setStatus('İzin isteniyor...');

      // 1. Tarayıcı desteğini kontrol et
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('Tarayıcınız bildirim desteklemiyor.');
        return;
      }

      // 2. Bildirim izni iste
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setStatus('İzin reddedildi. Lütfen tarayıcı ayarlarından zil ikonuna basıp izin verin.');
        return;
      }

      // 3. Service Worker'ı al
      const registration = await navigator.serviceWorker.ready;

      // 4. Push Aboneliği oluştur (VAPID Key'i ENV'den çekiyoruz)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // 5. Kaydet (Demo Modunda yerel hafıza, aksi halde Supabase)
      if (user) {
        if (isDemoMode) {
          localStorage.setItem('demo_push_subscription', JSON.stringify(subscription));
          setStatus('Zil başarıyla açıldı! ✅ (Demo Modu)');
        } else {
          const { error } = await supabase.from('push_subscriptions').upsert({
            teacher_id: user.id,
            subscription: subscription
          });

          if (error) throw error;
          setStatus('Zil başarıyla açıldı! ✅');
        }
      } else {
        setStatus('Önce giriş yapmalısınız.');
      }

    } catch (error) {
      console.error(error);
      setStatus('Bir hata oluştu.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={handlePermission}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        🔔 Bildirimleri / Zil Sesini Aç
      </button>
      {status && <p className="text-sm text-gray-500">{status}</p>}
    </div>
  );
}