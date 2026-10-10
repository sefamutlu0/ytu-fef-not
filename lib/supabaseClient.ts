import { createClient } from '@supabase/supabase-js';

export const SupabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eukgijboytdkkdfpneap.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2dpamJveXRka2tkZnBuZWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MDQ0MjYsImV4cCI6MjEwNzE4MDQyNn0.kYduJhjiXHac7JbEWEEWAacqqreBNrNT_KRSNfLDZQY',
};

export const supabase = createClient(SupabaseConfig.url, SupabaseConfig.anonKey);
