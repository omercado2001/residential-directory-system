'use client';

import React from 'react';
import {
  LayoutDashboard, FolderTree, Building2, UtensilsCrossed,
  Tag, Users, Heart, Terminal, ShieldCheck, Building,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type AdminTab =
  | 'overview'
  | 'categories'
  | 'businesses'
  | 'menu_items'
  | 'promotions'
  | 'profiles'
  | 'favorites'
  | 'logs';

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  counts: {
    categories: number;
    businesses: number;
    menuItems: number;
    promotions: number;
    profiles: number;
    logs: number;
  };
  currentUserEmail?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  counts,
  currentUserEmail = '',
  currentUserName = 'Administrador',
  currentUserAvatar,
}: SidebarProps) {
  const menuItems = [
    { id: 'overview' as AdminTab, label: 'Panel Principal', icon: LayoutDashboard, badge: null },
    { id: 'categories' as AdminTab, label: 'Categorías', icon: FolderTree, badge: counts.categories },
    { id: 'businesses' as AdminTab, label: 'Comercios', icon: Building2, badge: counts.businesses },
    { id: 'menu_items' as AdminTab, label: 'Productos y Menú', icon: UtensilsCrossed, badge: counts.menuItems },
    { id: 'promotions' as AdminTab, label: 'Avisos y Ofertas', icon: Tag, badge: counts.promotions, isNew: true },
    { id: 'profiles' as AdminTab, label: 'Residentes', icon: Users, badge: counts.profiles },
    { id: 'favorites' as AdminTab, label: 'Favoritos', icon: Heart, badge: null },
    { id: 'logs' as AdminTab, label: 'Historial y Alertas', icon: Terminal, badge: counts.logs, danger: counts.logs > 0 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30 select-none p-4 shadow-xs">
      {/* Brand Header */}
      <div className="mb-6 px-2 py-3 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-slate-900">
              Directorio Residencial
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">Panel de Administración</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center space-x-3">
          {currentUserAvatar ? (
            <img
              src={currentUserAvatar}
              alt="Admin"
              className="w-8 h-8 rounded-full object-cover border border-blue-500"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center border border-blue-400">
              {(currentUserName || currentUserEmail || 'A').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
              {currentUserName || 'Administrador'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">
              {currentUserEmail || 'Conectado a BD'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">
                  Nuevo
                </span>
              ) : item.badge !== null ? (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
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
              <span className="font-bold text-slate-800">Estado de Conexión</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Base de Datos Conectada</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
