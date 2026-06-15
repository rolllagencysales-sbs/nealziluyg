'use client';
import { useAuth } from '@/lib/AuthContext';
// Yolu tam olarak böyle dene, eğer klasör root'taysa bu doğrudur
import NotificationButton from "../components/NotificationButton";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  return (
    <main className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Öğretmen Paneli</h1>
        
        {user ? (
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Zil ve Bildirim Ayarı</h2>
              <p className="text-blue-600 mb-4 text-sm">
                Ders saatlerinde alarmın çalması için bildirimleri aktif etmeniz gerekmektedir.
              </p>
              <NotificationButton />
            </div>

            <div className="bg-white shadow rounded-lg p-6 border">
              <p className="text-gray-600 text-sm font-medium">Giriş Yapılan Hesap:</p>
              <p className="text-gray-900">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center border-2 border-dashed rounded-xl">
            <p className="mb-4 text-red-500 font-medium">Sistemi kullanmak için giriş yapmalısınız.</p>
            <a href="/login" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
              Giriş Yap
            </a>
          </div>
        )}
      </div>
    </main>
  );
}