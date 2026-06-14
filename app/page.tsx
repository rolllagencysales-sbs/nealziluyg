'use client';
import { useAuth } from "@/context/AuthContext"; // useAuth yolun doğru mu kontrol et
import NotificationButton from "@/components/NotificationButton";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10">Yükleniyor...</div>;

  return (
    <main className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Öğretmen Paneli</h1>
        
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Zil ve Bildirim Ayarı</h2>
          <p className="text-blue-600 mb-4 text-sm">
            Ders saatlerinde alarmın çalması için bildirimleri aktif etmeniz gerekmektedir.
          </p>
          {/* Bildirim butonu */}
          <NotificationButton />
        </div>

        {/* Buraya ders programı gelecek */}
        <div className="bg-white shadow rounded-lg p-4">
          <p>Hoş geldin, {user?.email}</p>
          {/* Mevcut ders programı kodlarını buraya ekleyebilirsin */}
        </div>
      </div>
    </main>
  );
}