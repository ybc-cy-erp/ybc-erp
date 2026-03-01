import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://iklibzcyfxcahbquuurv.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbGliemN5ZnhjYWhicXV1dXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTg1NjEsImV4cCI6MjA4NzkzNDU2MX0.ezhQTWc_aWufFFAw3g55-LmRDRW14EUeLlEKv7ePCi4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
