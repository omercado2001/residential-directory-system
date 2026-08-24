'use client';

import React, { useState } from 'react';
import { Search, RefreshCw, Bell, Download, Calendar, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminTab } from './Sidebar';

interface HeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isOnline: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSignOut: () => void;
  onOpenMobileMenu?: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  isOnline,
  onRefresh,
  isRefreshing,
  searchTerm,
  setSearchTerm,
  onSignOut,
  onOpenMobileMenu,
}: HeaderProps) {
  const [showSearchInput, setShowSearchInput] = useState(false);

  const subTabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'Inicio' },
    { id: 'businesses', label: 'Comercios' },
    { id: 'categories', label: 'Categorías' },
    { id: 'menu_items', label: 'Productos' },
    { id: 'promotions', label: 'Promociones' },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex flex-col space-y-3 sm:space-y-4 shadow-xs">
      {/* Top Bar: Hamburger, Title & Action Icons */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu Trigger + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onOpenMobileMenu && (
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden rounded-xl w-9 h-9 shrink-0 text-slate-700 hover:bg-slate-100"
              onClick={onOpenMobileMenu}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <h2 className="text-base sm:text-xl lg:text-2xl font-black tracking-tight text-slate-900 truncate">
            Directorio Residencial
          </h2>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Quick Search Input */}
          <div className="relative">
            {showSearchInput ? (
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                onBlur={() => !searchTerm && setShowSearchInput(false)}
                className="w-36 sm:w-56 h-9 text-xs"
              />
            ) : (
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full w-8 h-8 sm:w-9 sm:h-9"
                onClick={() => setShowSearchInput(true)}
                title="Buscar"
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Refresh Button */}
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full w-8 h-8 sm:w-9 sm:h-9"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refrescar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Notifications Bell */}
          <Button variant="secondary" size="icon" className="rounded-full w-8 h-8 sm:w-9 sm:h-9 hidden sm:flex" title="Notificaciones">
            <Bell className="w-4 h-4" />
          </Button>

          {/* Sign Out Button */}
          <Button
            onClick={onSignOut}
            className="rounded-full font-bold px-2.5 sm:px-4 h-8 sm:h-9 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs flex items-center gap-1.5"
            variant="ghost"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Pill Tabs Group (Scrollable on Mobile) */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center p-1 bg-slate-100 rounded-full border border-slate-200 space-x-1 shrink-0">
          {subTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-3 sm:px-4 h-7 sm:h-8 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Info Badges */}
        <div className="hidden md:flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Residencial El Doral</span>
          </div>

          <Button className="rounded-full font-bold px-3.5 h-8 bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20 text-xs flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Reporte</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
