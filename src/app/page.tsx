'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Sidebar, { AdminTab } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LoginScreen from '@/components/auth/LoginScreen';
import OverviewModule from '@/components/modules/OverviewModule';
import CategoriesModule from '@/components/modules/CategoriesModule';
import BusinessesModule from '@/components/modules/BusinessesModule';
import MenuItemsModule from '@/components/modules/MenuItemsModule';
import PromotionsModule from '@/components/modules/PromotionsModule';
import EventsModule from '@/components/modules/EventsModule';
import EmergencyContactsModule from '@/components/modules/EmergencyContactsModule';
import StorageModule from '@/components/modules/StorageModule';
import ProfilesModule from '@/components/modules/ProfilesModule';
import LogsModule from '@/components/modules/LogsModule';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { supabase, testConnection } from '@/lib/supabase';
import {
  Category,
  Business,
  MenuItem,
  Promotion,
  CommunityEvent,
  EmergencyContact,
  SystemUser,
} from '@/types/database';
import { UserRole, normalizeRole, getRolePermissions } from '@/types/roles';
import {
  verifyJwt,
  getStoredAuthToken,
  clearAuthToken,
  isTokenExpired,
  storeAuthToken,
  signJwt,
  TOKEN_DURATION_SECONDS,
} from '@/lib/jwt';
import {
  QUERY_KEYS,
  useCategoriesQuery,
  useBusinessesQuery,
  useMenuItemsQuery,
  usePromotionsQuery,
  useEventsQuery,
  useEmergencyContactsQuery,
  useSystemUsersQuery,
  useAppLogsQuery,
  useAppAnalyticsQuery,
  useSaveCategoryMutation,
  useDeleteCategoryMutation,
  useSaveBusinessMutation,
  useBatchSaveBusinessesMutation,
  useDeleteBusinessMutation,
  useSaveMenuItemMutation,
  useDeleteMenuItemMutation,
  useSavePromotionMutation,
  useDeletePromotionMutation,
  useSaveEventMutation,
  useDeleteEventMutation,
  useSaveEmergencyContactMutation,
  useDeleteEmergencyContactMutation,
  useSaveSystemUserMutation,
  useDeleteSystemUserMutation,
  useSaveAppLogMutation,
  useDeleteAppLogMutation,
  useClearLogsMutation,
} from '@/hooks/useAdminQueries';

export default function AdminPage() {
  const queryClient = useQueryClient();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>('viewer');

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const permissions = getRolePermissions(userRole);

  const { data: categories = [], isFetching: isFetchingCategories } = useCategoriesQuery();
  const { data: businesses = [], isFetching: isFetchingBusinesses } = useBusinessesQuery();
  const { data: menuItems = [], isFetching: isFetchingMenuItems } = useMenuItemsQuery();
  const { data: promotions = [], isFetching: isFetchingPromotions } = usePromotionsQuery();
  const { data: events = [], isFetching: isFetchingEvents } = useEventsQuery();
  const { data: emergencyContacts = [], isFetching: isFetchingEmergency } = useEmergencyContactsQuery();
  const { data: systemUsers = [], isFetching: isFetchingSystemUsers } = useSystemUsersQuery();
  const { data: appLogs = [], isFetching: isFetchingLogs } = useAppLogsQuery();
  const { data: appAnalytics = [] } = useAppAnalyticsQuery();

  const isRefreshing =
    isFetchingCategories ||
    isFetchingBusinesses ||
    isFetchingMenuItems ||
    isFetchingPromotions ||
    isFetchingEvents ||
    isFetchingEmergency ||
    isFetchingSystemUsers ||
    isFetchingLogs;

  const saveCategoryMutation = useSaveCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const saveBusinessMutation = useSaveBusinessMutation();
  const batchSaveBusinessesMutation = useBatchSaveBusinessesMutation();
  const deleteBusinessMutation = useDeleteBusinessMutation();
  const saveMenuItemMutation = useSaveMenuItemMutation();
  const deleteMenuItemMutation = useDeleteMenuItemMutation();
  const savePromotionMutation = useSavePromotionMutation();
  const deletePromotionMutation = useDeletePromotionMutation();
  const saveEventMutation = useSaveEventMutation();
  const deleteEventMutation = useDeleteEventMutation();
  const saveEmergencyContactMutation = useSaveEmergencyContactMutation();
  const deleteEmergencyContactMutation = useDeleteEmergencyContactMutation();
  const saveSystemUserMutation = useSaveSystemUserMutation();
  const deleteSystemUserMutation = useDeleteSystemUserMutation();
  const saveAppLogMutation = useSaveAppLogMutation();
  const deleteAppLogMutation = useDeleteAppLogMutation();
  const clearLogsMutation = useClearLogsMutation();

  useEffect(() => {
    testConnection().then((res) => setIsOnline(res.online));
  }, []);

  useEffect(() => {
    if (currentUserEmail && systemUsers.length > 0) {
      const match = systemUsers.find(
        (u) =>
          u.email.toLowerCase() === currentUserEmail.toLowerCase() ||
          u.username.toLowerCase() === currentUserEmail.toLowerCase()
      );
      if (match) {
        if (match.full_name) setCurrentUserName(match.full_name);
        if (match.avatar_url) setCurrentUserAvatar(match.avatar_url);
        setUserRole(normalizeRole(match.role));
      }
    }
  }, [currentUserEmail, systemUsers]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const jwtToken = getStoredAuthToken();
        if (jwtToken) {
          const payload = await verifyJwt(jwtToken);
          if (payload) {
            setCurrentUserEmail(payload.email);
            setCurrentUserName(payload.name || payload.email);
            setUserRole(normalizeRole(payload.role));
            setIsAuthenticated(true);
            queryClient.invalidateQueries();
            setIsCheckingAuth(false);
            return;
          } else {
            clearAuthToken();
            toast.error('Tu sesión JWT ha expirado. Por favor inicia sesión nuevamente.');
          }
        }

        const stored = localStorage.getItem('residential_admin_session');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.email) {
              const freshToken = await signJwt(
                {
                  sub: parsed.userId || 'admin',
                  email: parsed.email,
                  name: parsed.name || parsed.email,
                  role: parsed.role || 'viewer',
                },
                TOKEN_DURATION_SECONDS
              );

              storeAuthToken(freshToken);
              setCurrentUserEmail(parsed.email);
              setCurrentUserName(parsed.name || parsed.email);
              setUserRole(normalizeRole(parsed.role));
              setIsAuthenticated(true);
              queryClient.invalidateQueries();
              setIsCheckingAuth(false);
              return;
            }
          } catch {}
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [queryClient]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('realtime_all_tables')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businesses })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuItems })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promotions' },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.promotions })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_contacts' },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emergencyContacts })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_users' },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.systemUsers })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_analytics' },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const token = getStoredAuthToken();
      if (!token || isTokenExpired(token)) {
        clearAuthToken();
        setIsAuthenticated(false);
        toast.error('Tu sesión de 4 horas ha expirado. Por favor inicia sesión nuevamente.');
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleSelectTab = (tab: AdminTab) => {
    if (tab === 'logs' && !permissions.canViewLogs) {
      toast.error('Solo los Administradores Generales tienen acceso al historial de errores.');
      return;
    }
    if (tab === 'profiles' && !permissions.canManageUsers) {
      toast.error('Solo los Administradores Generales pueden gestionar usuarios.');
      return;
    }
    setActiveTab(tab);
  };

  const handleSignOut = () => {
    clearAuthToken();
    localStorage.removeItem('residential_admin_session');
    setIsAuthenticated(false);
    setCurrentUserEmail('');
    setCurrentUserName('');
    setCurrentUserAvatar('');
    setUserRole('viewer');
    toast.info('Sesión cerrada y token JWT invalidado');
  };

  const handleRefreshAll = useCallback(async () => {
    await queryClient.invalidateQueries();
    toast.success('Datos sincronizados con la Base de Datos');
  }, [queryClient]);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600">Verificando sesión JWT y credenciales...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={(email, role, name, token) => {
          setCurrentUserEmail(email);
          if (name) setCurrentUserName(name);
          if (role) setUserRole(role);
          setIsAuthenticated(true);
          queryClient.invalidateQueries();
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        counts={{
          categories: categories.length,
          businesses: businesses.length,
          menuItems: menuItems.length,
          promotions: promotions.length,
          events: events.length,
          emergency: emergencyContacts.length,
          profiles: systemUsers.length,
          logs: appLogs.length,
        }}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        userRole={userRole}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          isOnline={isOnline}
          onRefresh={handleRefreshAll}
          isRefreshing={isRefreshing}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSignOut={handleSignOut}
          userRole={userRole}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <OverviewModule
              categories={categories}
              businesses={businesses}
              menuItems={menuItems}
              promotions={promotions}
              events={events}
              profiles={systemUsers as any}
              logs={appLogs}
              analytics={appAnalytics}
              setActiveTab={handleSelectTab}
              isOnline={isOnline}
              onRefresh={handleRefreshAll}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesModule
              categories={categories}
              onSaveCategory={(cat) => saveCategoryMutation.mutateAsync(cat).then(() => {})}
              onDeleteCategory={(id) => deleteCategoryMutation.mutateAsync(id).then(() => {})}
              searchTerm={searchTerm}
              canEdit={permissions.canEditCategories && !permissions.isReadOnly}
            />
          )}

          {activeTab === 'businesses' && (
            <BusinessesModule
              businesses={businesses}
              categories={categories}
              onSaveBusiness={(biz) => saveBusinessMutation.mutateAsync(biz).then(() => {})}
              onBatchSaveBusinesses={(batch) => batchSaveBusinessesMutation.mutateAsync(batch).then(() => {})}
              onDeleteBusiness={(id) => deleteBusinessMutation.mutateAsync(id).then(() => {})}
              searchTerm={searchTerm}
              canEdit={permissions.canEditBusinesses && !permissions.isReadOnly}
            />
          )}

          {activeTab === 'menu_items' && (
            <MenuItemsModule
              menuItems={menuItems}
              businesses={businesses}
              onSaveMenuItem={(item) => saveMenuItemMutation.mutateAsync(item).then(() => {})}
              onDeleteMenuItem={(id) => deleteMenuItemMutation.mutateAsync(id).then(() => {})}
              searchTerm={searchTerm}
              canEdit={permissions.canEditMenuItems && !permissions.isReadOnly}
            />
          )}

          {activeTab === 'promotions' && (
            <PromotionsModule
              promotions={promotions}
              businesses={businesses}
              categories={categories}
              onSavePromotion={async (promo) => {
                await savePromotionMutation.mutateAsync(promo);
              }}
              onDeletePromotion={async (id) => {
                await deletePromotionMutation.mutateAsync(id);
              }}
              searchTerm={searchTerm}
              canEdit={permissions.canEditPromotions && !permissions.isReadOnly}
            />
          )}

          {activeTab === 'events' && (
            <EventsModule
              events={events}
              onSaveEvent={async (event) => {
                await saveEventMutation.mutateAsync(event);
              }}
              onDeleteEvent={async (id) => {
                await deleteEventMutation.mutateAsync(id);
              }}
              searchTerm={searchTerm}
              canEdit={permissions.canEditEvents && !permissions.isReadOnly}
            />
          )}

          {activeTab === 'emergency' && (
            <EmergencyContactsModule
              contacts={emergencyContacts}
              onSaveContact={async (contact) => {
                await saveEmergencyContactMutation.mutateAsync(contact);
              }}
              onDeleteContact={async (id) => {
                await deleteEmergencyContactMutation.mutateAsync(id);
              }}
              searchTerm={searchTerm}
              canEdit={permissions.canEditEmergencyContacts && !permissions.isReadOnly}
            />
          )}

          {activeTab === 'storage' && (
            <StorageModule
              businesses={businesses}
              menuItems={menuItems}
              promotions={promotions}
              events={events}
              profiles={systemUsers as any}
              categories={categories}
              searchTerm={searchTerm}
              canEdit={!permissions.isReadOnly}
            />
          )}

          {activeTab === 'profiles' && (
            <ProfilesModule
              users={systemUsers}
              onSaveUser={(user) => saveSystemUserMutation.mutateAsync(user).then(() => {})}
              onDeleteUser={(id) => deleteSystemUserMutation.mutateAsync(id).then(() => {})}
              searchTerm={searchTerm}
            />
          )}

          {activeTab === 'logs' && (
            <LogsModule
              logs={appLogs}
              onAddLog={(log) => saveAppLogMutation.mutateAsync(log).then(() => {})}
              onDeleteLog={(id) => deleteAppLogMutation.mutateAsync(id).then(() => {})}
              searchTerm={searchTerm}
            />
          )}
        </main>
      </div>
    </div>
  );
}
