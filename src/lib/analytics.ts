import { supabase } from '@/lib/supabase';
import { AppAnalyticsEvent } from '@/types/database';

export const SQL_SETUP_ANALYTICS_TABLE = `CREATE TABLE IF NOT EXISTS public.app_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL DEFAULT 'query',
  entity_type TEXT DEFAULT 'business',
  entity_id TEXT,
  search_query TEXT,
  platform TEXT NOT NULL DEFAULT 'android',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to app_analytics" 
  ON public.app_analytics FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select from app_analytics" 
  ON public.app_analytics FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_app_analytics_platform_date 
  ON public.app_analytics (platform, created_at DESC);
`;

export async function logAndroidQueryEvent(event: {
  event_type: 'query' | 'search' | 'view_business' | 'view_category' | 'whatsapp_click' | 'phone_click';
  entity_type?: 'business' | 'category' | 'menu_item' | 'promotion' | 'event';
  entity_id?: string;
  search_query?: string;
  platform?: 'android';
  user_id?: string;
}): Promise<void> {
  try {
    await supabase.from('app_analytics').insert({
      id: crypto.randomUUID(),
      event_type: event.event_type,
      entity_type: event.entity_type || 'business',
      entity_id: event.entity_id || null,
      search_query: event.search_query || null,
      platform: 'android',
      user_id: event.user_id || null,
      created_at: new Date().toISOString(),
    });
  } catch {}
}

export async function fetchMobileAnalytics(): Promise<AppAnalyticsEvent[]> {
  try {
    const { data, error } = await supabase
      .from('app_analytics')
      .select('*')
      .eq('platform', 'android')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}
