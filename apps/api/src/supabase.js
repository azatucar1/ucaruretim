import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

let authClient;
let adminClient;

export function getAuthClient() {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Supabase Auth ayarları eksik.');
  }
  if (!authClient) {
    authClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return authClient;
}

export function getAdminClient() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('Supabase sunucu bağlantı ayarları eksik.');
  }
  if (!adminClient) {
    adminClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return adminClient;
}
