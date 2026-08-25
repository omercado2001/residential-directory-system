'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Sidebar, { AdminTab } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LoginScreen from '@/components/auth/LoginScreen';
import OverviewModule from '@/components/modules/OverviewModule';
import CategoriesModule from '@/components/modules/CategoriesModule';
import BusinessesModule from '@/components/modules/BusinessesModule';
import MenuItemsModule from '@/components/modules/MenuItemsModule';
import PromotionsModule from '@/components/modules/PromotionsModule';
import EventsModule from '@/components/modules/EventsModule';
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
  Profile,
  AppLog,
} from '@/types/database';
import { UserRole, normalizeRole, getRolePermissions } from '@/types/roles';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const permissions = getRolePermissions(userRole);

  // Entities State - Purely loaded from Supabase Database
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [appLogs, setAppLogs] = useState<AppLog[]>([]);

  // Fetch Data from Supabase
  const loadData = useCallback(async (showNotification = false) => {
    setIsRefreshing(true);

    try {
      const conn = await testConnection();
      setIsOnline(conn.online);

      const [
        { data: catData, error: catError },
        { data: bizData, error: bizError },
        { data: menuData, error: menuError },
        { data: promoData, error: promoError },
        { data: eventsData, error: eventsError },
        { data: profData, error: profError },
        { data: logData, error: logError },
      ] = await Promise.all([
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('businesses').select('*').order('name', { ascending: true }),
        supabase.from('menu_items').select('*').order('name', { ascending: true }),
        supabase.from('promotions').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('app_logs').select('*').order('created_at', { ascending: false }),
      ]);

      if (catError) console.warn('categories fetch:', catError.message);
      if (bizError) console.warn('businesses fetch:', bizError.message);
      if (menuError) console.warn('menu_items fetch:', menuError.message);
      if (promoError) console.warn('promotions fetch:', promoError.message);
      if (eventsError) console.warn('events fetch:', eventsError.message);
      if (profError) console.warn('profiles fetch:', profError.message);
      if (logError) console.warn('app_logs fetch:', logError.message);

      setCategories(catData || []);
      setBusinesses(bizData || []);
      setMenuItems(menuData || []);
      setPromotions(promoData || []);
      setEvents(eventsData || []);
      if (profData && profData.length > 0) {
        setProfiles(profData);
        if (currentUserEmail) {
          const matched = profData.find(
            (p) => p.email?.toLowerCase() === currentUserEmail.toLowerCase()
          );
          if (matched) {
            setCurrentUserProfile(matched);
            if (matched.full_name) setCurrentUserName(matched.full_name);
            setUserRole(normalizeRole(matched.role));
          }
        }
      } else {
        setProfiles([]);
      }
      setAppLogs(logData || []);

      if (showNotification) {
        toast.success('Datos sincronizados con la Base de Datos');
      }
    } catch (err: any) {
      console.error('Error al conectar con Supabase:', err);
      if (showNotification) {
        toast.error(`Error de conexión: ${err?.message || 'Fallo de red'}`);
      }
    } finally {
      setIsRefreshing(false);
      setIsLoadingInitial(false);
    }
  }, [currentUserEmail]);

  // Auth Initialization: Check active session in Supabase or Local Storage
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 1. Check local session storage
        const stored = localStorage.getItem('residential_admin_session');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.email) {
              setCurrentUserEmail(parsed.email);
              setCurrentUserName(parsed.name || parsed.email);
              setUserRole(normalizeRole(parsed.role));
              setIsAuthenticated(true);
            }
          } catch {}
        }

        // 2. Check Supabase Auth active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const email = session.user.email || '';
          setCurrentUserEmail(email);
          setIsAuthenticated(true);

          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (prof) {
            setCurrentUserProfile(prof);
            setCurrentUserName(prof.full_name || email);
            setUserRole(normalizeRole(prof.role));
          } else {
            const role = normalizeRole(session.user.user_metadata?.role || 'admin');
            const name = session.user.user_metadata?.full_name || email;
            setUserRole(role);
            setCurrentUserName(name);
          }
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
      } finally {
        setIsCheckingAuth(false);
        loadData();
      }
    };

    checkAuthStatus();

    // Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const email = session.user.email || '';
        setCurrentUserEmail(email);
        setIsAuthenticated(true);

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (prof) {
          setCurrentUserProfile(prof);
          setCurrentUserName(prof.full_name || email);
          setUserRole(normalizeRole(prof.role));
        } else {
          const role = normalizeRole(session.user.user_metadata?.role || 'admin');
          const name = session.user.user_metadata?.full_name || email;
          setUserRole(role);
          setCurrentUserName(name);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('residential_admin_session');
        setIsAuthenticated(false);
        setCurrentUserProfile(null);
        setActiveTab('overview');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadData]);

  // Ensure role tab restrictions
  const handleSelectTab = (tab: AdminTab) => {
    if ((tab === 'profiles' || tab === 'logs') && userRole !== 'admin') {
      toast.warning('Esta sección requiere permisos de Administrador General');
      setActiveTab('overview');
      return;
    }
    setActiveTab(tab);
  };

  const handleLoginSuccess = (email: string, role: UserRole = 'admin', name?: string) => {
    setCurrentUserEmail(email);
    setUserRole(role);
    if (name) {
      setCurrentUserName(name);
    }
    setIsAuthenticated(true);
    setActiveTab('overview');
    loadData();
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('residential_admin_session');
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setIsAuthenticated(false);
    setCurrentUserProfile(null);
    toast.info('Sesión cerrada correctamente');
  };

  // Categories CRUD
  const handleSaveCategory = async (cat: Category) => {
    if (permissions.isReadOnly) {
      toast.error('No tienes permisos para modificar categorías');
      return;
    }
    try {
      const { error } = await supabase.from('categories').upsert(cat);
      if (error) {
        toast.error(`Error al guardar categoría en Supabase: ${error.message}`);
        return;
      }
      toast.success(`Categoría "${cat.name}" guardada con éxito`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Fallo al guardar'}`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (permissions.isReadOnly) {
      toast.error('No tienes permisos para eliminar categorías');
      return;
    }
    const deletedCategory = categories.find((c) => c.id === id);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        toast.error(`Error al eliminar categoría: ${error.message}`);
        return;
      }
      toast.success(`Categoría "${deletedCategory?.name || id}" eliminada con éxito`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Fallo al eliminar'}`);
    }
  };

  // Businesses CRUD
  const handleSaveBusiness = async (biz: Business) => {
    if (permissions.isReadOnly) {
      toast.error('No tienes permisos para modificar comercios');
      return;
    }
    try {
      const { error } = await supabase.from('businesses').upsert(biz);
      if (error) {
        toast.error(`Error al guardar negocio en Supabase: ${error.message}`);
        return;
      }
      toast.success(`Negocio "${biz.name}" guardado con éxito`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Fallo al guardar'}`);
    }
  };

  const handleBatchSaveBusinesses = async (batch: Business[]) => {
    if (permissions.isReadOnly) {
      toast.error('No tienes permisos para importar comercios');
      return;
    }
    try {
      const { error } = await supabase.from('businesses').upsert(batch);
      if (error) {
        toast.error(`Error al guardar lote en Supabase: ${error.message}`);
        return;
      }
      toast.success(`${batch.length} comercios importados exitosamente`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error al importar lote: ${err?.message || 'Fallo de red'}`);
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    if (permissions.isReadOnly) {
      toast.error('No tienes permisos para eliminar comercios');
      return;
    }
    const deletedBiz = businesses.find((b) => b.id === id);
    try {
      const { error } = await supabase.from('businesses').delete().eq('id', id);
      if (error) {
        toast.error(`Error al eliminar negocio: ${error.message}`);
        return;
      }
      toast.success(`Negocio "${deletedBiz?.name || id}" eliminado con éxito`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Fallo al eliminar'}`);
    }
  };

  // Menu Items CRUD
  const handleSaveMenuItem = async (item: MenuItem) => {
    if (permissions.isReadOnly) {
      toast.error('No tienes permisos para modificar productos');
      return;
    }
    try {
      const { error } = await supabase.from('menu_items').upsert(item);
      if (error) {
        toast.error(`Error al guardar producto en Supabase: ${error.message}`);
        return;
      }
      toast.success(`Producto "${item.name}" guardado con éxito`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Fallo al guardar'}`);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (permissions.isReadOnly) {
      toast.error('No tienes permisos para eliminar productos');
      return;
    }
    const deletedItem = menuItems.find((m) => m.id === id);
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) {
        toast.error(`Error al eliminar producto: ${error.message}`);
        return;
      }
      toast.success(`Producto "${deletedItem?.name || id}" eliminado con éxito`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Fallo al eliminar'}`);
    }
  };

  // Promotions CRUD
  const handleSavePromotion = async (promo: Promotion) => {
    if (permissions.isReadOnly) {
      toast.error('No tienes permisos para modificar promociones');
      return;
    }
    try {
      const { error } = await supabase.from('promotions').upsert(promo);
      if (error) {
        toast.error(`Error al guardar aviso en Supabase: ${error.message}`);
        return;
      }
      toast.success(`Aviso "${promo.title}" publicado con éxito`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Fallo al guardar'}`);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (permissions.isReadOnly) {
      toast.error('No tienes permisos para eliminar promociones');
      return;
    }
    const deletedPromo = promotions.find((p) => p.id === id);
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) {
        toast.error(`Error al eliminar aviso: ${error.message}`);
        return;
      }
      toast.success(`Aviso "${deletedPromo?.title || id}" eliminado con éxito`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Fallo al eliminar'}`);
    }
  };

  // Profiles CRUD
  const handleSaveProfile = async (prof: Profile) => {
    if (!permissions.canManageUsers) {
      toast.error('Solo los Administradores Generales pueden gestionar usuarios');
      return;
    }
    try {
      const { error } = await supabase.from('profiles').upsert(prof);
      if (error) {
        toast.error(`Error al guardar usuario en Supabase: ${error.message}`);
        return;
      }
      toast.success(`Usuario "${prof.full_name || prof.email}" guardado con éxito`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Fallo al guardar'}`);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!permissions.canManageUsers) {
      toast.error('Solo los Administradores Generales pueden eliminar usuarios');
      return;
    }
    const deletedProf = profiles.find((p) => p.id === id);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        toast.error(`Error al eliminar usuario: ${error.message}`);
        return;
      }
      toast.success(`Usuario "${deletedProf?.full_name || id}" eliminado con éxito`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Fallo al eliminar'}`);
    }
  };

  // App Logs CRUD
  const handleAddLog = async (logPayload: Omit<AppLog, 'id' | 'created_at'>) => {
    try {
      const newLog: AppLog = {
        id: crypto.randomUUID(),
        ...logPayload,
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('app_logs').insert(newLog);
      if (error) {
        console.warn('Error al registrar log:', error.message);
        return;
      }
      await loadData();
    } catch (err) {
      console.warn('Fallo al registrar log local:', err);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!permissions.canViewLogs) {
      toast.error('Solo los Administradores pueden gestionar el historial');
      return;
    }
    try {
      const { error } = await supabase.from('app_logs').delete().eq('id', id);
      if (error) {
        toast.error(`Error al eliminar log: ${error.message}`);
        return;
      }
      toast.success('Registro de log eliminado');
      await loadData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Fallo al eliminar log'}`);
    }
  };

  const counts = {
    categories: categories.length,
    businesses: businesses.length,
    menuItems: menuItems.length,
    promotions: promotions.length,
    events: events.length,
    profiles: profiles.length,
    logs: appLogs.length,
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 text-slate-600 font-sans">
        <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-500">Verificando sesión en la base de datos...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        counts={counts}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUserName || currentUserProfile?.full_name || 'Usuario'}
        currentUserAvatar={currentUserProfile?.avatar_url || undefined}
        userRole={userRole}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          isOnline={isOnline}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSignOut={handleSignOut}
          userRole={userRole}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Module Rendering */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          {isLoadingInitial ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-4 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold">Cargando datos en tiempo real desde Supabase...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewModule
                  categories={categories}
                  businesses={businesses}
                  menuItems={menuItems}
                  promotions={promotions}
                  profiles={profiles}
                  logs={appLogs}
                  setActiveTab={handleSelectTab}
                  isOnline={isOnline}
                />
              )}

              {activeTab === 'categories' && (
                <CategoriesModule
                  categories={categories}
                  onSaveCategory={handleSaveCategory}
                  onDeleteCategory={handleDeleteCategory}
                  searchTerm={searchTerm}
                  canEdit={!permissions.isReadOnly}
                />
              )}

              {activeTab === 'businesses' && (
                <BusinessesModule
                  businesses={businesses}
                  categories={categories}
                  onSaveBusiness={handleSaveBusiness}
                  onBatchSaveBusinesses={handleBatchSaveBusinesses}
                  onDeleteBusiness={handleDeleteBusiness}
                  searchTerm={searchTerm}
                  canEdit={!permissions.isReadOnly}
                />
              )}

              {activeTab === 'menu_items' && (
                <MenuItemsModule
                  menuItems={menuItems}
                  businesses={businesses}
                  onSaveMenuItem={handleSaveMenuItem}
                  onDeleteMenuItem={handleDeleteMenuItem}
                  searchTerm={searchTerm}
                  canEdit={!permissions.isReadOnly}
                />
              )}

              {activeTab === 'promotions' && (
                <PromotionsModule
                  promotions={promotions}
                  businesses={businesses}
                  categories={categories}
                  onSavePromotion={handleSavePromotion}
                  onDeletePromotion={handleDeletePromotion}
                  searchTerm={searchTerm}
                  canEdit={!permissions.isReadOnly}
                />
              )}

              {activeTab === 'events' && (
                <EventsModule
                  events={events}
                  searchTerm={searchTerm}
                  onRefresh={() => loadData()}
                  canEdit={!permissions.isReadOnly}
                />
              )}

              {activeTab === 'storage' && (
                <StorageModule
                  businesses={businesses}
                  menuItems={menuItems}
                  promotions={promotions}
                  events={events}
                  profiles={profiles}
                  categories={categories}
                  searchTerm={searchTerm}
                  canEdit={!permissions.isReadOnly}
                />
              )}

              {activeTab === 'profiles' && permissions.canManageUsers && (
                <ProfilesModule
                  profiles={profiles}
                  onSaveProfile={handleSaveProfile}
                  onDeleteProfile={handleDeleteProfile}
                  searchTerm={searchTerm}
                />
              )}

              {activeTab === 'logs' && permissions.canViewLogs && (
                <LogsModule
                  logs={appLogs}
                  onAddLog={handleAddLog}
                  onDeleteLog={handleDeleteLog}
                  searchTerm={searchTerm}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
