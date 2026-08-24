'use client';

import React from 'react';
import {
  TrendingUp, TrendingDown, MoreVertical, ArrowUpRight,
  FolderTree, Building2, Terminal, Building,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Category, Business, MenuItem, Promotion, Profile, AppLog } from '@/types/database';
import { AdminTab } from '../layout/Sidebar';

interface OverviewProps {
  categories: Category[];
  businesses: Business[];
  menuItems: MenuItem[];
  promotions: Promotion[];
  profiles: Profile[];
  logs: AppLog[];
  setActiveTab: (tab: AdminTab) => void;
  isOnline: boolean;
}

export default function OverviewModule({
  categories, businesses, menuItems, promotions, profiles, logs, setActiveTab,
}: OverviewProps) {
  const metrics = [
    { title: 'Categorías de Comercios', value: `${categories.length}`, percentage: '3.3%', isPositive: true, subtitle: 'Tipos de negocios', tab: 'categories' as AdminTab },
    { title: 'Comercios Registrados', value: `${businesses.length}`, percentage: '3.3%', isPositive: true, subtitle: 'Directorio activo', tab: 'businesses' as AdminTab },
    { title: 'Productos y Servicios', value: `${menuItems.length}`, percentage: '3.3%', isPositive: true, subtitle: 'Catálogo disponible', tab: 'menu_items' as AdminTab },
    { title: 'Avisos y Ofertas', value: `${promotions.length}`, percentage: '4.1%', isPositive: true, subtitle: 'Promociones activas', tab: 'promotions' as AdminTab },
  ];

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <Card
            key={idx}
            onClick={() => setActiveTab(m.tab)}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition shadow-xs cursor-pointer"
          >
            <CardContent className="p-0 space-y-3">
              <div className="text-xs font-semibold text-slate-500">{m.title}</div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                  {m.value}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    m.isPositive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {m.isPositive ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-rose-600" />}
                  {m.isPositive ? '↑' : '↓'} {m.percentage}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>{m.subtitle}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Residential Activity & Traffic Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity Widget */}
        <Card className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <CardContent className="p-0 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" /> Actividad del Directorio
              </h3>
              <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-semibold">
                Últimas semanas ▾
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                  <span>{businesses.length} Negocios</span>
                  <span className="text-emerald-600 text-[10px] font-bold">↑ 3.3%</span>
                </div>
                <div className="text-[11px] text-slate-500 font-semibold">Comercios Activos</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                  <span>{menuItems.length} Productos</span>
                  <span className="text-emerald-600 text-[10px] font-bold">↑ 3.3%</span>
                </div>
                <div className="text-[11px] text-slate-500 font-semibold">Catálogo General</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                  <span>{profiles.length} Residentes</span>
                  <span className="text-emerald-600 text-[10px] font-bold">↑ 3.3%</span>
                </div>
                <div className="text-[11px] text-slate-500 font-semibold">Usuarios Registrados</div>
              </div>
            </div>

            {/* Vertical Bar Chart */}
            <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 border-t border-slate-100">
              {[40, 65, 30, 85, 45, 95, 60, 75, 50, 90, 70, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <div
                    className="w-full bg-blue-600 rounded-t-md hover:bg-blue-500 transition-all duration-300 shadow-sm"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Source Widget */}
        <Card className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <CardContent className="p-0 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Consultas en la Aplicación</h3>
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-slate-600">App Móvil</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  <span className="text-slate-600">Panel Web</span>
                </div>
                <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black font-mono text-slate-900">231,856</div>
              <div className="text-xs text-slate-500 font-semibold">Consultas Realizadas</div>
            </div>
            <div className="h-40 w-full pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="300" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" />
                <path d="M0,70 Q50,40 100,65 T200,30 T300,50" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                <path d="M0,85 Q50,55 100,75 T200,45 T300,25" fill="none" stroke="#2563eb" strokeWidth="3" />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Quick Entity Inspector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Categorías</div>
                <div className="text-lg font-bold text-slate-900 font-mono">{categories.length} registradas</div>
              </div>
            </div>
            <Button onClick={() => setActiveTab('categories')} className="px-3 h-8 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg" variant="ghost">
              Ver
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Directorio</div>
                <div className="text-lg font-bold text-slate-900 font-mono">{businesses.length} negocios</div>
              </div>
            </div>
            <Button onClick={() => setActiveTab('businesses')} className="px-3 h-8 text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg" variant="ghost">
              Ver
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Historial y Alertas</div>
                <div className="text-lg font-bold text-slate-900 font-mono">{logs.length} registros</div>
              </div>
            </div>
            <Button onClick={() => setActiveTab('logs')} className="px-3 h-8 text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg" variant="ghost">
              Ver
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
