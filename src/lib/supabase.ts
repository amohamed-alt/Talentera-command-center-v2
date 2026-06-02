import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type RuntimeConfig = {
  appName?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  schema?: string;
};

declare global {
  interface Window {
    TALENTERA_CONFIG?: RuntimeConfig;
  }
}

export function getRuntimeConfig(): Required<RuntimeConfig> {
  const config = window.TALENTERA_CONFIG || {};
  return {
    appName: config.appName || 'Talentera Sales Command Center',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || config.supabaseUrl || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey || '',
    schema: config.schema || 'public'
  };
}

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  const config = getRuntimeConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      db: { schema: config.schema },
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return client;
}
