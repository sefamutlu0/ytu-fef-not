import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eukgijboytdkkdfpneap.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2dpamJveXRka2tkZnBuZWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MDQ0MjYsImV4cCI6MjEwNzE4MDQyNn0.kYduJhjiXHac7JbEWEEWAacqqreBNrNT_KRSNfLDZQY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
