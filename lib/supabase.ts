
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Access environment variables with fallbacks to the provided credentials
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://gaiovzdhuyutwmnsufkk.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ujzjb9zbvsoCbo_Doc6MWg_txQYmOE0';

/**
 * Checks if the required Supabase environment variables are present.
 */
export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '';
};

/**
 * Initialize the Supabase client. 
 * Defaults are provided so this will no longer throw "supabaseUrl is required".
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
