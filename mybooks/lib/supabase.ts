
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';       // <-- wklej swój URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // <-- wklej swój klucz

const authOptions = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
  ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: authOptions,
});
