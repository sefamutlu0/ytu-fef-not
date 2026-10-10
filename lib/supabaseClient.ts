import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eukgijboytdkkdfpneap.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2dpamJveXRka2tkZnBuZWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MDQ0MjYsImV4cCI6MjEwNzE4MDQyNn0.kYduJhjiXHac7JbEWEEWAacqqreBNrNT_KRSNfLDZQY';

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!clientInstance) {
    clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return clientInstance;
};

// Proxy sayesinde mevcut `supabase.from(...)` veya `supabase.storage` çağrıları bozulmadan çalışır
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: keyof SupabaseClient) {
    const client = getSupabase();
    return client[prop];
  },
});
