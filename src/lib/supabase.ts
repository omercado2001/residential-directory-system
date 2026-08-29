import { createClient } from '@supabase/supabase-js';
import { getStoredAuthToken, isTokenExpired, clearAuthToken } from './jwt';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://pwekbsghbkkvarglsmmk.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_Ve1Nqj9PY_AiE-B1vnqyBg_7oEWCJ73';

const customAuthFetch: typeof fetch = async (input, init = {}) => {
  const token = getStoredAuthToken();
  const headers = new Headers(init.headers || {});

  if (!headers.has('apikey')) {
    headers.set('apikey', supabaseAnonKey);
  }
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
  }

  if (token) {
    if (isTokenExpired(token)) {
      clearAuthToken();
    } else {
      headers.set('X-JWT-Auth', token);
      headers.set('X-Session-Token', token);
    }
  }

  return fetch(input, {
    ...init,
    headers,
  });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: customAuthFetch,
  },
});

export async function testConnection(): Promise<{
  online: boolean;
  message: string;
  url: string;
}> {
  try {
    const { error } = await supabase.from('categories').select('id', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      return { online: true, message: `Conectado a Supabase`, url: supabaseUrl };
    }
    return { online: true, message: `Conexión activa a Supabase`, url: supabaseUrl };
  } catch (err: any) {
    return {
      online: false,
      message: `Error de conexión: ${err.message || 'Sin respuesta'}`,
      url: supabaseUrl,
    };
  }
}
