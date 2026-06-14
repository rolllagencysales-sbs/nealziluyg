import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isPlaceholder = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-project');

if (typeof window !== 'undefined' && isPlaceholder) {
  console.warn(
    'Supabase environment variables are missing or using placeholders. Please check your .env.local file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const hasSupabaseConfigured = () => {
  return !isPlaceholder;
};
