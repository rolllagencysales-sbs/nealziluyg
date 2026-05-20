import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/Auth';

function AppContent() {
  const { user } = useAuth();

  // Eğer kullanıcı giriş yapmadıysa Auth sayfasını göster
  if (!user) {
    return <AuthPage />;
  }

  // Giriş yaptıysa ana uygulamayı göster
  return (
    <div>
      <h1>Hoş geldin, {user.email}</h1>
      <button onClick={() => supabase.auth.signOut()}>Çıkış Yap</button>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;