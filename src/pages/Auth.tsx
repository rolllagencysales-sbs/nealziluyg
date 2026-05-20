import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('Kayıt başarılı! E-postanı kontrol et.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form onSubmit={handleAuth} className="p-8 bg-gray-100 rounded shadow-md">
        <h2 className="text-2xl mb-4">{isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}</h2>
        <input 
          type="email" placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
          className="block w-full p-2 mb-2 border"
        />
        <input 
          type="password" placeholder="Şifre" 
          onChange={(e) => setPassword(e.target.value)} 
          className="block w-full p-2 mb-4 border"
        />
        <button className="w-full bg-blue-500 text-white p-2 rounded">
          {isSignUp ? 'Kaydol' : 'Giriş Yap'}
        </button>
        <button 
          type="button" onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 text-sm text-blue-600 underline"
        >
          {isSignUp ? 'Hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kaydol'}
        </button>
      </form>
    </div>
  );
};