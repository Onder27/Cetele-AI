// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase env vars. Create .env.local with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
