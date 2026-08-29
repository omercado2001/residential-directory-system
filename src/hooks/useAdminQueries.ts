import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Category,
  Business,
  MenuItem,
  Promotion,
  CommunityEvent,
  EmergencyContact,
  SystemUser,
  AppLog,
  AppAnalyticsEvent,
} from '@/types/database';
import {
  fetchCategoriesApi,
  saveCategoryApi,
  deleteCategoryApi,
  fetchBusinessesApi,
  saveBusinessApi,
  batchSaveBusinessesApi,
  deleteBusinessApi,
  fetchMenuItemsApi,
  saveMenuItemApi,
  deleteMenuItemApi,
  fetchPromotionsApi,
  savePromotionApi,
  deletePromotionApi,
  fetchEventsApi,
  saveEventApi,
  deleteEventApi,
  fetchEmergencyContactsApi,
  saveEmergencyContactApi,
  deleteEmergencyContactApi,
  fetchSystemUsersApi,
  saveSystemUserApi,
  deleteSystemUserApi,
  fetchAppLogsApi,
  saveAppLogApi,
  deleteAppLogApi,
  clearAppLogsApi,
  fetchAppAnalyticsApi,
} from '@/services/api';

export const QUERY_KEYS = {
  categories: ['categories'] as const,
  businesses: ['businesses'] as const,
  menuItems: ['menu_items'] as const,
  promotions: ['promotions'] as const,
  events: ['events'] as const,
  emergencyContacts: ['emergency_contacts'] as const,
  systemUsers: ['system_users'] as const,
  logs: ['app_logs'] as const,
  analytics: ['app_analytics'] as const,
};

export function useCategoriesQuery() {
  return useQuery<Category[]>({
    queryKey: QUERY_KEYS.categories,
    queryFn: fetchCategoriesApi,
  });
}

export function useSaveCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category: Category) => saveCategoryApi(category),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success(`Categoría "${data.name}" guardada con éxito`);
    },
    onError: (err: any) => {
      toast.error(`Error al guardar categoría: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategoryApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success('Categoría eliminada con éxito');
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar categoría: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useBusinessesQuery() {
  return useQuery<Business[]>({
    queryKey: QUERY_KEYS.businesses,
    queryFn: fetchBusinessesApi,
  });
}

export function useSaveBusinessMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (business: Business) => saveBusinessApi(business),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businesses });
      toast.success(`Negocio "${data.name}" guardado con éxito`);
    },
    onError: (err: any) => {
      toast.error(`Error al guardar negocio: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useBatchSaveBusinessesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batch: Business[]) => batchSaveBusinessesApi(batch),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businesses });
      toast.success(`Se importaron ${data.length} negocios con éxito`);
    },
    onError: (err: any) => {
      toast.error(`Error al importar lote: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useDeleteBusinessMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBusinessApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businesses });
      toast.success('Negocio eliminado con éxito');
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar negocio: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useMenuItemsQuery() {
  return useQuery<MenuItem[]>({
    queryKey: QUERY_KEYS.menuItems,
    queryFn: fetchMenuItemsApi,
  });
}

export function useSaveMenuItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: MenuItem) => saveMenuItemApi(item),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuItems });
      toast.success(`Producto "${data.name}" guardado con éxito`);
    },
    onError: (err: any) => {
      toast.error(`Error al guardar producto: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useDeleteMenuItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMenuItemApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuItems });
      toast.success('Producto eliminado con éxito');
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar producto: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function usePromotionsQuery() {
  return useQuery<Promotion[]>({
    queryKey: QUERY_KEYS.promotions,
    queryFn: fetchPromotionsApi,
  });
}

export function useSavePromotionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (promo: Promotion) => savePromotionApi(promo),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.promotions });
      toast.success(`Aviso "${data.title}" guardado con éxito`);
    },
    onError: (err: any) => {
      toast.error(`Error al guardar aviso: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useDeletePromotionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePromotionApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.promotions });
      toast.success('Aviso eliminado con éxito');
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar aviso: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useEventsQuery() {
  return useQuery<CommunityEvent[]>({
    queryKey: QUERY_KEYS.events,
    queryFn: fetchEventsApi,
  });
}

export function useSaveEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: CommunityEvent) => saveEventApi(event),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      toast.success(`Evento "${data.title}" guardado con éxito`);
    },
    onError: (err: any) => {
      toast.error(`Error al guardar evento: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEventApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      toast.success('Evento eliminado con éxito');
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar evento: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useEmergencyContactsQuery() {
  return useQuery<EmergencyContact[]>({
    queryKey: QUERY_KEYS.emergencyContacts,
    queryFn: fetchEmergencyContactsApi,
  });
}

export function useSaveEmergencyContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contact: EmergencyContact) => saveEmergencyContactApi(contact),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emergencyContacts });
      toast.success(`Contacto "${data.title}" guardado con éxito`);
    },
    onError: (err: any) => {
      toast.error(`Error al guardar contacto: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useDeleteEmergencyContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmergencyContactApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emergencyContacts });
      toast.success('Contacto de emergencia eliminado con éxito');
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar contacto: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useSystemUsersQuery() {
  return useQuery<SystemUser[]>({
    queryKey: QUERY_KEYS.systemUsers,
    queryFn: fetchSystemUsersApi,
  });
}

export function useSaveSystemUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: SystemUser) => saveSystemUserApi(user),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.systemUsers });
      toast.success(`Usuario "${data.full_name || data.username}" guardado con éxito`);
    },
    onError: (err: any) => {
      toast.error(`Error al guardar usuario: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useDeleteSystemUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSystemUserApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.systemUsers });
      toast.success('Usuario eliminado con éxito');
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar usuario: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useAppLogsQuery() {
  return useQuery<AppLog[]>({
    queryKey: QUERY_KEYS.logs,
    queryFn: fetchAppLogsApi,
  });
}

export function useSaveAppLogMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (log: AppLog) => saveAppLogApi(log),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logs });
      toast.success('Log registrado con éxito');
    },
    onError: (err: any) => {
      toast.error(`Error al registrar log: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useDeleteAppLogMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAppLogApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logs });
      toast.success('Log eliminado con éxito');
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar log: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useClearLogsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearAppLogsApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logs });
      toast.success('Historial de errores limpiado con éxito');
    },
    onError: (err: any) => {
      toast.error(`Error al limpiar historial: ${err?.message || 'Fallo inesperado'}`);
    },
  });
}

export function useAppAnalyticsQuery() {
  return useQuery<AppAnalyticsEvent[]>({
    queryKey: QUERY_KEYS.analytics,
    queryFn: fetchAppAnalyticsApi,
    refetchInterval: 5000,
  });
}
