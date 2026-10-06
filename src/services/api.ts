import { supabase } from '@/lib/supabase';
import {
  Category,
  Business,
  MenuItem,
  Promotion,
  CommunityEvent,
  LostPetRequest,
  LostItemRequest,
  EmergencyContact,
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
  let finalCategoryId = promotion.category_id && promotion.category_id.trim() ? promotion.category_id.trim() : null;

  if (!finalCategoryId && promotion.business_id) {
    const { data: biz } = await supabase.from('businesses').select('category_id').eq('id', promotion.business_id).maybeSingle();
    if (biz?.category_id) {
      finalCategoryId = biz.category_id;
    }
  }

  if (!finalCategoryId) {
    finalCategoryId = 'comercio';
  }

  const payload: any = {
    id: promotion.id || crypto.randomUUID(),
    business_id: promotion.business_id,
    category_id: finalCategoryId,
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

  if (error) {
    console.error('Error in savePromotionApi:', error);
    throw new Error(error.message || 'Error al guardar la oferta en la base de datos');
  }

  broadcastPushToAllDevices(
    '🔥 Nueva Promoción',
    `${payload.title} - ¡Aprovecha ahora en la app!`,
    { url: '/(tabs)/promociones' }
  ).catch((e) => console.error('Push error:', e));

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
  const isNew = !event.id;
  const payload: any = {
    id: event.id || crypto.randomUUID(),
    title: event.title.trim(),
    category: event.category && event.category.trim() ? event.category.trim() : 'Comunitario 🏘️',
    location: event.location && event.location.trim() ? event.location.trim() : null,
    event_date: event.event_date && event.event_date.trim() ? event.event_date.trim() : null,
    description: event.description && event.description.trim() ? event.description.trim() : null,
    organizer_phone: event.organizer_phone && event.organizer_phone.trim() ? event.organizer_phone.trim() : null,
    whatsapp: event.whatsapp && event.whatsapp.trim() ? event.whatsapp.trim().replace(/\D/g, '') : null,
    image: event.image && event.image.trim() ? event.image.trim() : null,
    status: event.status || 'APROBADO',
    created_at: event.created_at || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('events')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error in saveEventApi:', error);
    throw new Error(error.message || 'Error al guardar el evento');
  }

  if (payload.status === 'APROBADO' && isNew) {
    broadcastPushToAllDevices(
      '📅 Nuevo Evento Programado',
      `${payload.title} - ¡Revisa los detalles en la app!`,
      { url: '/(tabs)/' }
    ).catch((e) => console.error('Push error:', e));
  }

  return data;
}

export async function approveEventApi(event: CommunityEvent): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ status: 'APROBADO' })
    .eq('id', event.id);

  if (error) throw new Error(error.message);

  await broadcastPushToAllDevices(
    '🎉 ¡Nuevo Evento en Residencial City!',
    `"${event.title}" (${event.category || 'Evento'}) este ${event.event_date || 'próximamente'} en ${event.location || 'el residencial'}.`,
    { type: 'event', id: event.id }
  );
}

export async function deleteEventApi(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchPendingPetsApi(): Promise<LostPetRequest[]> {
  const { data, error } = await supabase
    .from('lost_pets')
    .select('*')
    .eq('status', 'SOLICITUD')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending pets:', error);
    return [];
  }
  return data || [];
}

export async function approvePetApi(pet: LostPetRequest): Promise<void> {
  const { error } = await supabase
    .from('lost_pets')
    .update({ status: 'APROBADO' })
    .eq('id', pet.id);

  if (error) throw new Error(error.message);

  await broadcastPushToAllDevices(
    '🚨 ¡Mascota Perdida en Residencial City!',
    `Se busca a ${pet.name} (${pet.type || 'Mascota'}) en ${pet.sector || 'el residencial'}. Contacto: ${pet.phone || 'Ver app'}`,
    { type: 'lost_pet', id: pet.id }
  );
}

export async function rejectPetApi(id: string): Promise<void> {
  const { error } = await supabase.from('lost_pets').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchPendingItemsApi(): Promise<LostItemRequest[]> {
  const { data, error } = await supabase
    .from('lost_items')
    .select('*')
    .eq('status', 'SOLICITUD')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending items:', error);
    return [];
  }
  return data || [];
}

export async function approveItemApi(item: LostItemRequest): Promise<void> {
  const { error } = await supabase
    .from('lost_items')
    .update({ status: 'APROBADO' })
    .eq('id', item.id);

  if (error) throw new Error(error.message);

  await broadcastPushToAllDevices(
    '🔍 ¡Objeto Reportado en Residencial City!',
    `"${item.title}" (${item.category || 'Objeto'}) en ${item.sector || 'el residencial'}. Contacto: ${item.phone || 'Ver app'}`,
    { type: 'lost_item', id: item.id }
  );
}

export async function rejectItemApi(id: string): Promise<void> {
  const { error } = await supabase.from('lost_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchEmergencyContactsApi(): Promise<EmergencyContact[]> {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveEmergencyContactApi(contact: EmergencyContact): Promise<EmergencyContact> {
  const payload: any = {
    id: contact.id || crypto.randomUUID(),
    title: contact.title.trim(),
    subtitle: contact.subtitle && contact.subtitle.trim() ? contact.subtitle.trim() : null,
    phone: contact.phone.trim(),
    whatsapp: contact.whatsapp && contact.whatsapp.trim() ? contact.whatsapp.trim().replace(/\D/g, '') : null,
    icon: contact.icon && contact.icon.trim() ? contact.icon.trim() : 'phone',
    color: contact.color || '#3b82f6',
    sort_order: typeof contact.sort_order === 'number' ? contact.sort_order : 1,
    created_at: contact.created_at || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('emergency_contacts')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error in saveEmergencyContactApi:', error);
    throw new Error(error.message || 'Error al guardar el contacto de emergencia en la base de datos');
  }
  return data;
}

export async function deleteEmergencyContactApi(id: string): Promise<void> {
  const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
  if (error) {
    console.error('Error in deleteEmergencyContactApi:', error);
    throw new Error(error.message || 'Error al eliminar el contacto de emergencia');
  }
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
      .limit(50000);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}


// ==========================================
// EXPO PUSH NOTIFICATIONS
// ==========================================
export async function broadcastPushToAllDevices(title: string, body: string, dataPayload?: any) {
  try {
    const res = await fetch('/api/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        dataPayload: dataPayload || {},
      }),
    });

    const data = await res.json();
    console.log('📡 Resultado de envío push desde /api/push:', data);
    return data;
  } catch (err) {
    console.error('Error en broadcastPushToAllDevices:', err);
  }
}
