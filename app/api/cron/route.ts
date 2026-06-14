import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export async function GET(request: Request) {
  // Güvenlik Kontrolü
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: list } = await supabase.rpc('get_lessons_to_notify');

  if (!list || list.length === 0) return NextResponse.json({ ok: true });

  webpush.setVapidDetails('mailto:admin@site.com', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);

  const sends = list.map((n: any) => 
    webpush.sendNotification(n.subscription, JSON.stringify({
      title: 'Ders Başlıyor!',
      body: `${n.subject} dersi saati geldi.`,
    }))
  );

  await Promise.all(sends);
  return NextResponse.json({ sent: list.length });
}