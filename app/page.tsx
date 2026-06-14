'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import NotificationButton from "../components/NotificationButton";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, [supabase]);

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  return (
    <main className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Öğretmen Paneli</h1>
        
        {user ? (
          <>
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Zil ve Bildirim Ayarı</h2>
              <p className="text-blue-600 mb-4 text-sm">
                Ders saatlerinde alarmın çalması için bildirimleri aktif etmeniz gerekmektedir.
              </p>
              <NotificationButton />
            </div>

            <div className="bg-white shadow rounded-lg p-6 border">
              <h3 className="font-medium mb-2">Hesap Bilgileri</h3>
              <p className="text-gray-600 text-sm">Giriş yapılan hesap: {user.email}</p>
            </div>
          </>
        ) : (
          <div className="p-10 text-center border rounded-lg">
            <p className="mb-4 text-red-500">Lütfen önce giriş yapın.</p>
            <a href="/login" className="bg-black text-white px-6 py-2 rounded-lg">Giriş Yap</a>
          </div>
        )}
      </div>
    </main>
  );
}