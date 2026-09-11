import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://pwekbsghbkkvarglsmmk.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_Ve1Nqj9PY_AiE-B1vnqyBg_7oEWCJ73';

const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const { title, body, dataPayload } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios (title, body)' },
        { status: 400 }
      );
    }

    // 1. Obtener tokens registrados en Supabase
    const { data: tokenRecords, error } = await supabaseServer
      .from('push_tokens')
      .select('token');

    if (error) {
      console.error('Error fetching push tokens on server:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!tokenRecords || tokenRecords.length === 0) {
      console.log('No hay tokens en push_tokens.');
      return NextResponse.json({ success: true, count: 0, message: 'No registered tokens' });
    }

    const validTokens = tokenRecords
      .map((r) => r.token)
      .filter((t) => t && (t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken')));

    if (validTokens.length === 0) {
      console.log('No hay tokens Expo válidos.');
      return NextResponse.json({ success: true, count: 0, message: 'No valid Expo tokens' });
    }

    console.log(`📤 [Server Push] Enviando a ${validTokens.length} dispositivo(s)...`);

    const messages = validTokens.map((tokenStr) => ({
      to: tokenStr,
      sound: 'default',
      priority: 'high',
      channelId: 'tuvecino_alertas_v2',
      title,
      body,
      data: dataPayload || {},
    }));

    const BATCH_SIZE = 100;
    let successCount = 0;

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const chunk = messages.slice(i, i + BATCH_SIZE);
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (res.ok) {
        successCount += chunk.length;
      } else {
        const errText = await res.text();
        console.error('Error en lote de push Expo:', errText);
      }
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      totalDevices: validTokens.length,
    });
  } catch (err: any) {
    console.error('Error en API route /api/push:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno al enviar push' },
      { status: 500 }
    );
  }
}
