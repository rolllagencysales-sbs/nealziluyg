import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, UserPlus, Clock, HelpCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, signUp, rememberMe, setRememberMe, accounts } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('Zübeyde Hanım Anadolu Lisesi');
  const [password, setPassword] = useState(''); // cosmetic/security feeling as requested
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('E-posta adresi yazmalısınız.');
      return;
    }

    if (isSignUp) {
      if (!fullName) {
        setError('Lütfen isminizi ve soyisminizi girin.');
        return;
      }
      if (!password || password.length < 4) {
        setError('Şifre en az 4 karakter olmalıdır.');
        return;
      }
      const created = signUp(email, fullName, schoolName);
      if (created) {
        setSuccess('Hesabınız oluşturuldu! Şimdi giriş yapabilirsiniz.');
        setIsSignUp(false);
        setEmail(email);
        setPassword('');
      } else {
        setError('Bu e-posta adresi zaten kullanımda.');
      }
    } else {
      const logged = login(email, rememberMe);
      if (logged) {
        // Logged in successfully
      } else {
        setError('Girdiğiniz e-posta bulunamadı! Lütfen önce "Öğretmen Hesabı Oluştur" kısmından kayıt olun.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-800 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Subtle modern radial background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 relative z-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900 text-emerald-400 rounded-2xl mb-3 shadow-md">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-sans">
            EkolZil<span className="text-emerald-500">.io</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Öğretmen Sınıf Zili & Akıllı Ders Alarm Takibi
          </p>
        </div>

        {/* Display notifications error/success */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-center font-bold">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs text-center font-bold">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 mb-1 tracking-widest uppercase">
              E-POSTA ADRESİ
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="isim@okul.k12.tr"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 font-sans transition-all"
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 mb-1 tracking-widest uppercase">
                AD SOYAD
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Örn. Arif Biçer"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 font-sans transition-all"
                required={isSignUp}
              />
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 mb-1 tracking-widest uppercase">
                OKUL ADI (ZORUNLU DEĞİL)
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Örn. Zübeyde Hanım Lisesi"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 font-sans transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 mb-1 tracking-widest uppercase">
              ŞİFRE
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 font-sans transition-all"
              required
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
              />
              <span className="text-xs text-slate-550 font-medium">Beni Hatırla</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:transform active:scale-98 text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
          >
            {isSignUp ? <UserPlus className="w-4 h-4 text-emerald-400" /> : <LogIn className="w-4 h-4 text-emerald-400" />}
            <span>{isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}</span>
          </button>
        </form>

        {/* Change account creation toggle */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-xs text-slate-500 hover:text-emerald-600 font-semibold underline transition-colors"
          >
            {isSignUp ? 'Zaten bir hesabım var, Giriş Yap' : 'Öğretmen Hesabı Oluştur (Ücretsiz)'}
          </button>
        </div>



      </div>
    </div>
  );
};
