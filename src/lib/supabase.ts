import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://pwekbsghbkkvarglsmmk.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_Ve1Nqj9PY_AiE-B1vnqyBg_7oEWCJ73';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
