import 'expo-sqlite/localStorage/install';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!URL || !CLAVE) {
  throw new Error('Falta configurar Supabase: crea .env.local desde .env.example y reinicia con "npx expo start -c".');
}

export const supabase = createClient(URL, CLAVE, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener('change', (estado) => {
  if (estado === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

export const clienteTemporal = () => createClient(URL, CLAVE, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

export const useBase = () => supabase;
