import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export async function GET(request: Request) {
  // 1. Güvenlik: Dışarıdan herkes bu linke tıklayıp bildirim atamasın
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Yetkisiz Erişim', { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. SQL fonksiyonunu çağır (Saati gelen dersleri ve abonelikleri getirir)
  const { data: notifications, error } = await supabase.rpc('get_lessons_to_notify');

  if (error || !notifications || notifications.length === 0) {
    return NextResponse.json({ message: 'Şu an ders yok.' });
  }

  // 3. VAPID Anahtarları ile Gönderim Yap
  webpush.setVapidDetails(
    'mailto:senin-emailin@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const results = await Promise.all(
    notifications.map(async (n: any) => {
      return webpush.sendNotification(
        n.subscription,
        JSON.stringify({
          title: 'Ders Başlıyor! 🔔',
          body: `${n.subject} dersi saati geldi.`,
          url: '/schedule'
        })
      );
    })
  );

  return NextResponse.json({ sent: results.length });
}