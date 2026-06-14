'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfigured } from './supabase';
import { Profile } from './types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  isDemoMode: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      if (!hasSupabaseConfigured()) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGLS_READ_DENIED' || error.code === 'PGRST116') {
          const defaultName = user?.email?.split('@')[0] || 'Öğretmen';
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: userId, full_name: defaultName, school_name: 'Nuri Erbak Anadolu Lisesi' }])
            .select()
            .single();

          if (!createError && newProfile) {
            setProfile(newProfile);
            return;
          }
        }
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error('Exception fetching profile:', e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Check if Supabase keys are configured
    if (!hasSupabaseConfigured()) {
      console.log('Supabase not configured. Activating Demo/Local Storage mode.');
      setIsDemoMode(true);
      // Create mock user in local storage to let them play with the app immediately
      const savedUser = localStorage.getItem('demo_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed.user);
        setProfile(parsed.profile);
      }
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (e) {
        console.error('Session check failed:', e);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem('demo_user');
      setUser(null);
      setProfile(null);
      return;
    }
    
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
