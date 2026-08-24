'use client';

import React, { useState } from 'react';
import { Search, RefreshCw, Bell, Download, Calendar, LogOut } from 'lucide-react';
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
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-8 py-5 flex flex-col space-y-4 transition-colors shadow-xs">
      {/* Top Greeting & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Directorio Residencial
          </h2>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Quick Search Input */}
          <div className="relative">
            {showSearchInput ? (
              <Input
                placeholder="Buscar comercios o productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                onBlur={() => !searchTerm && setShowSearchInput(false)}
                className="w-56"
              />
            ) : (
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full"
                onClick={() => setShowSearchInput(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Refresh Button */}
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Notifications Bell */}
          <Button variant="secondary" size="icon" className="rounded-full">
            <Bell className="w-4 h-4" />
          </Button>

          {/* Sign Out Button */}
          <Button
            onClick={onSignOut}
            className="rounded-full font-bold px-4 h-9 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs flex items-center gap-1.5"
            variant="ghost"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Pill Tabs Group */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center p-1 bg-slate-100 rounded-full border border-slate-200 space-x-1 w-fit">
          {subTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 h-8 text-xs font-bold transition-all ${
                  isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Residencial El Doral</span>
          </div>

          <Button className="rounded-full font-bold px-4 h-8 bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20 text-xs flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Reporte</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
