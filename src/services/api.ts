import { supabase } from '@/lib/supabase';
import {
  Category,
  Business,
  MenuItem,
  Promotion,
  CommunityEvent,
  SystemUser,
  AppLog,
  AppAnalyticsEvent,
} from '@/types/database';

export async function fetchCategoriesApi(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveCategoryApi(category: Category): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .upsert(category)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCategoryApi(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchBusinessesApi(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveBusinessApi(business: Business): Promise<Business> {
  try {
    await supabase.storage
      .from('residential-directory')
      .upload(`businesses/${business.id}/.emptyFolderPlaceholder`, new Blob(['']), { upsert: true });
  } catch {}

  const { data, error } = await supabase
    .from('businesses')
    .upsert(business)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function batchSaveBusinessesApi(batch: Business[]): Promise<Business[]> {
  try {
    await Promise.allSettled(
      batch.map((b) =>
        supabase.storage
          .from('residential-directory')
          .upload(`businesses/${b.id}/.emptyFolderPlaceholder`, new Blob(['']), { upsert: true })
      )
    );
  } catch {}

  const { data, error } = await supabase
    .from('businesses')
    .upsert(batch)
    .select();

  if (error) throw new Error(error.message);
  return data || [];
}

export async function deleteBusinessApi(id: string): Promise<void> {
  const { error } = await supabase.from('businesses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchMenuItemsApi(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveMenuItemApi(item: MenuItem): Promise<MenuItem> {
  const { data, error } = await supabase
    .from('menu_items')
    .upsert(item)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMenuItemApi(id: string): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchPromotionsApi(): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function savePromotionApi(promotion: Promotion): Promise<Promotion> {
  const payload: any = {
    id: promotion.id || crypto.randomUUID(),
    business_id: promotion.business_id,
    category_id: promotion.category_id || null,
    title: promotion.title.trim(),
    description: promotion.description && promotion.description.trim() ? promotion.description.trim() : null,
    badge: promotion.badge && promotion.badge.trim() ? promotion.badge.trim() : null,
    badge_color: promotion.badge_color || '#ef4444',
    valid_until: promotion.valid_until && String(promotion.valid_until).trim() ? String(promotion.valid_until).trim().split('T')[0] : null,
    image: promotion.image && promotion.image.trim() ? promotion.image.trim() : null,
    ribbon: promotion.ribbon && promotion.ribbon.trim() ? promotion.ribbon.trim() : null,
    created_at: promotion.created_at || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('promotions')
    .upsert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deletePromotionApi(id: string): Promise<void> {
  const { error } = await supabase.from('promotions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchEventsApi(): Promise<CommunityEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveEventApi(event: CommunityEvent): Promise<CommunityEvent> {
  const { data, error } = await supabase
    .from('events')
    .upsert(event)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteEventApi(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchSystemUsersApi(): Promise<SystemUser[]> {
  const { data, error } = await supabase
    .from('system_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveSystemUserApi(user: SystemUser): Promise<SystemUser> {
  const payload: any = {
    id: user.id || crypto.randomUUID(),
    username: user.username.trim().toLowerCase(),
    email: user.email.trim().toLowerCase(),
    full_name: user.full_name.trim(),
    role: user.role,
    avatar_url: user.avatar_url || null,
    created_at: user.created_at || new Date().toISOString(),
  };

  if (user.password && user.password.trim()) {
    payload.password = user.password.trim();
  }

  const { data, error } = await supabase
    .from('system_users')
    .upsert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSystemUserApi(id: string): Promise<void> {
  const { error } = await supabase.from('system_users').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchAppLogsApi(): Promise<AppLog[]> {
  const { data, error } = await supabase
    .from('app_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveAppLogApi(log: AppLog): Promise<AppLog> {
  const { data, error } = await supabase
    .from('app_logs')
    .upsert(log)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAppLogApi(id: string): Promise<void> {
  const { error } = await supabase.from('app_logs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function clearAppLogsApi(): Promise<void> {
  const { error } = await supabase.from('app_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw new Error(error.message);
}

export async function fetchAppAnalyticsApi(): Promise<AppAnalyticsEvent[]> {
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
