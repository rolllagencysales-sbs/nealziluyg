'use client';
// Dosya yollarını @/ yerine ../ ile güncelledik
import { useAuth } from "../context/AuthContext"; 
import NotificationButton from "../components/NotificationButton";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  return (
    <main className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Öğretmen Paneli</h1>
        
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Zil ve Bildirim Ayarı</h2>
          <p className="text-blue-600 mb-4 text-sm">
            Ders saatlerinde alarmın çalması için bildirimleri aktif etmeniz gerekmektedir.
          </p>
          <NotificationButton />
        </div>

        <div className="bg-white shadow rounded-lg p-6 border">
          <h3 className="font-medium mb-2">Hesap Bilgileri</h3>
          <p className="text-gray-600 text-sm">Giriş yapılan hesap: {user?.email}</p>
        </div>
      </div>
    </main>
  );
}