'use client';

import React from 'react';
import {
  LayoutDashboard, FolderTree, Building2, UtensilsCrossed,
  Tag, Users, Terminal, ShieldCheck, Building, X, Shield, Edit3, Eye, HardDrive, Calendar, Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole, getRoleLabel } from '@/types/roles';

export type AdminTab =
  | 'overview'
  | 'categories'
  | 'businesses'
  | 'menu_items'
  | 'promotions'
  | 'events'
  | 'storage'
  | 'profiles'
  | 'logs';

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  counts: {
    categories: number;
    businesses: number;
    menuItems: number;
    promotions: number;
    events: number;
    profiles: number;
    logs: number;
  };
  currentUserEmail?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  userRole?: UserRole;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  counts,
  currentUserEmail = '',
  currentUserName = 'Administrador',
  currentUserAvatar,
  userRole = 'admin',
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  // All possible menu items
  const allMenuItems = [
    { id: 'overview' as AdminTab, label: 'Panel Principal', icon: LayoutDashboard, badge: null, adminOnly: false },
    { id: 'categories' as AdminTab, label: 'Categorías', icon: FolderTree, badge: counts.categories, adminOnly: false },
    { id: 'businesses' as AdminTab, label: 'Comercios', icon: Building2, badge: counts.businesses, adminOnly: false },
    { id: 'menu_items' as AdminTab, label: 'Productos y Menú', icon: UtensilsCrossed, badge: counts.menuItems, adminOnly: false },
    { id: 'promotions' as AdminTab, label: 'Avisos y Ofertas', icon: Tag, badge: counts.promotions, adminOnly: false },
    { id: 'events' as AdminTab, label: 'Eventos Residenciales', icon: Calendar, badge: counts.events, isNew: true, adminOnly: false },
    { id: 'storage' as AdminTab, label: 'Galería de Archivos', icon: HardDrive, badge: null, adminOnly: false },
    { id: 'profiles' as AdminTab, label: 'Residentes / Usuarios', icon: Users, badge: counts.profiles, adminOnly: true },
    { id: 'logs' as AdminTab, label: 'Historial y Alertas', icon: Terminal, badge: counts.logs, danger: counts.logs > 0, adminOnly: true },
  ];

  // Filter items based on user role: if not admin, hide adminOnly tabs
  const visibleMenuItems = allMenuItems.filter((item) => {
    if (item.adminOnly && userRole !== 'admin') {
      return false;
    }
    return true;
  });

  const handleTabClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200">
            <Shield className="w-3 h-3" />
            <span>Admin Total</span>
          </span>
        );
      case 'editor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200">
            <Edit3 className="w-3 h-3" />
            <span>Editor Gestor</span>
          </span>
        );
      case 'viewer':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
            <Eye className="w-3 h-3" />
            <span>Solo Lectura</span>
          </span>
        );
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none p-4">
      {/* Brand Header */}
      <div className="mb-6 px-2 py-3 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 truncate">
                Directorio Residencial
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">Panel de Administración</p>
            </div>
          </div>

          {/* Close button for mobile */}
          {onMobileClose && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-lg w-8 h-8 text-slate-500"
              onClick={onMobileClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Current User & Role Profile Box */}
        <div className="pt-3 border-t border-slate-100 flex items-center space-x-3">
          {currentUserAvatar ? (
            <img
              src={currentUserAvatar}
              alt="Admin"
              className="w-9 h-9 rounded-full object-cover border border-blue-500 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center border border-blue-400 shrink-0 shadow-xs">
              {(currentUserName || currentUserEmail || 'A').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]" title={currentUserName}>
              {currentUserName || 'Administrador'}
            </span>
            <div className="mt-0.5">{getRoleBadge()}</div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-between h-11 px-4 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.isNew ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold shrink-0">
                  Nuevo
                </span>
              ) : item.badge !== null ? (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                    item.danger
                      ? 'bg-rose-100 text-rose-700'
                      : isActive
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* System Info Box */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <Card className="bg-slate-50 border border-slate-200 shadow-none">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Rol: {getRoleLabel(userRole)}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {userRole === 'admin'
                  ? 'Acceso Total a Todas las Secciones'
                  : userRole === 'editor'
                  ? 'Permisos Totales en 4 Secciones'
                  : 'Solo Consulta de 4 Secciones'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold pt-1 border-t border-slate-200/60">
              <Clock className="w-3 h-3 text-blue-600 shrink-0" />
              <span>Sesión JWT Activa (4h)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col h-screen sticky top-0 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onMobileClose}
          />
          {/* Drawer Panel */}
          <aside className="fixed top-0 bottom-0 left-0 w-72 bg-white shadow-2xl z-50 transition-transform animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
