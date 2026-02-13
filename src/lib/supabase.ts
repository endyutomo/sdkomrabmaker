import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://osizusigsteogyivmgfa.supabase.co').trim().replace(/["']/g, "");
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zaXp1c2lnc3Rlb2d5aXZtZ2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzkwMjIsImV4cCI6MjA4NjU1NTAyMn0.hOgsqHUmqnlLM8g4eUAkbw00X-XIiMdXZslvZ7vNrEc').trim().replace(/["']/g, "");

// Safety check for build time
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.warn('Invalid Supabase URL detected:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
