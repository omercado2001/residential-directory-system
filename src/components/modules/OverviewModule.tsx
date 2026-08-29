'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp, ArrowUpRight, FolderTree, Building2, Terminal,
  Calendar, Search, Phone, MessageSquare, Eye, Filter, RotateCcw,
  Sparkles, BarChart3, Compass
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Category, Business, MenuItem, Promotion, CommunityEvent, Profile, AppLog, AppAnalyticsEvent } from '@/types/database';
import { AdminTab } from '../layout/Sidebar';

interface OverviewProps {
  categories: Category[];
  businesses: Business[];
  menuItems: MenuItem[];
  promotions: Promotion[];
  events?: CommunityEvent[];
  profiles: Profile[];
  logs: AppLog[];
  analytics?: AppAnalyticsEvent[];
  setActiveTab: (tab: AdminTab) => void;
  isOnline: boolean;
  onRefresh?: () => void;
}

export default function OverviewModule({
  categories,
  businesses,
  menuItems,
  promotions,
  events = [],
  profiles,
  logs,
  analytics = [],
  setActiveTab,
  isOnline,
  onRefresh,
}: OverviewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [quickRange, setQuickRange] = useState<'all' | 'today' | '7d' | '30d'>('all');

  const metrics = [
    {
      title: 'Categorías de Comercios',
      value: `${categories.length}`,
      percentage: '100%',
      isPositive: true,
      subtitle: `${categories.length} tipos activos`,
      tab: 'categories' as AdminTab,
    },
    {
      title: 'Comercios Registrados',
      value: `${businesses.length}`,
      percentage: `${businesses.filter((b) => b.is_open).length} abiertos`,
      isPositive: true,
      subtitle: 'Directorio comunitario',
      tab: 'businesses' as AdminTab,
    },
    {
      title: 'Productos y Servicios',
      value: `${menuItems.length}`,
      percentage: `${menuItems.length} items`,
      isPositive: true,
      subtitle: 'Catálogo disponible',
      tab: 'menu_items' as AdminTab,
    },
    {
      title: 'Avisos y Ofertas',
      value: `${promotions.length}`,
      percentage: `${promotions.length} vigentes`,
      isPositive: true,
      subtitle: 'Promociones activas',
      tab: 'promotions' as AdminTab,
    },
  ];

  const monthNamesSpanish = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const formatDayName = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return `${days[d.getDay()]}, ${day} de ${monthNamesSpanish[month - 1]} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const androidEvents = useMemo(() => {
    return analytics.filter((a) => a.platform === 'android');
  }, [analytics]);

  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, { count: number; label: string }>();
    androidEvents.forEach((ev) => {
      if (!ev.created_at) return;
      const d = new Date(ev.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNamesSpanish[d.getMonth()]} ${d.getFullYear()}`;
      const prev = monthsMap.get(key) || { count: 0, label };
      monthsMap.set(key, { count: prev.count + 1, label });
    });

    return Array.from(monthsMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([value, { label, count }]) => ({
        value,
        label: `${label} (${count} consultas)`,
      }));
  }, [androidEvents]);

  const availableDays = useMemo(() => {
    const daysMap = new Map<string, number>();
    androidEvents.forEach((ev) => {
      if (!ev.created_at) return;
      const d = new Date(ev.created_at);
      const key = d.toISOString().split('T')[0];
      if (selectedMonth !== 'ALL' && !key.startsWith(selectedMonth)) return;
      daysMap.set(key, (daysMap.get(key) || 0) + 1);
    });

    return Array.from(daysMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([value, count]) => ({
        value,
        label: `${formatDayName(value)} (${count} consultas)`,
      }));
  }, [androidEvents, selectedMonth]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return androidEvents.filter((ev) => {
      if (!ev.created_at) return false;
      const evDate = new Date(ev.created_at);
      const dayKey = evDate.toISOString().split('T')[0];
      const monthKey = `${evDate.getFullYear()}-${String(evDate.getMonth() + 1).padStart(2, '0')}`;

      if (quickRange === 'today' && dayKey !== todayStr) return false;
      if (quickRange === '7d') {
        const diffDays = (now.getTime() - evDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      }
      if (quickRange === '30d') {
        const diffDays = (now.getTime() - evDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      }

      if (selectedMonth !== 'ALL' && monthKey !== selectedMonth) return false;
      if (selectedDay !== 'ALL' && dayKey !== selectedDay) return false;

      return true;
    });
  }, [androidEvents, selectedMonth, selectedDay, quickRange]);

  const stats = useMemo(() => {
    const totalGlobal = androidEvents.length;
    const totalFiltered = filteredEvents.length;

    const searches = filteredEvents.filter((a) => a.event_type === 'search').length;
    const businessViews = filteredEvents.filter((a) => a.event_type === 'view_business').length;
    const categoryViews = filteredEvents.filter((a) => a.event_type === 'view_category').length;
    const whatsappClicks = filteredEvents.filter((a) => a.event_type === 'whatsapp_click').length;
    const phoneClicks = filteredEvents.filter((a) => a.event_type === 'phone_click').length;

    const daysMap = new Map<string, {
      date: string;
      total: number;
    }>();

    filteredEvents.forEach((ev) => {
      if (!ev.created_at) return;
      const dayKey = new Date(ev.created_at).toISOString().split('T')[0];
      const prev = daysMap.get(dayKey) || {
        date: dayKey,
        total: 0,
      };
      prev.total++;
      daysMap.set(dayKey, prev);
    });

    const dailyBreakdown = Array.from(daysMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    const maxDailyCount = Math.max(...dailyBreakdown.map((d) => d.total), 1);
    const avgDailyQueries = dailyBreakdown.length > 0 ? Math.round(totalFiltered / dailyBreakdown.length) : 0;
    const peakDay = dailyBreakdown.reduce((max, curr) => (curr.total > (max?.total || 0) ? curr : max), dailyBreakdown[0] || null);

    return {
      totalGlobal,
      totalFiltered,
      searches,
      businessViews,
      categoryViews,
      whatsappClicks,
      phoneClicks,
      dailyBreakdown,
      maxDailyCount,
      avgDailyQueries,
      peakDay,
    };
  }, [androidEvents, filteredEvents]);

  const hasActiveFilters = selectedMonth !== 'ALL' || selectedDay !== 'ALL' || quickRange !== 'all';

  const handleResetFilters = () => {
    setSelectedMonth('ALL');
    setSelectedDay('ALL');
    setQuickRange('all');
  };

  const chartDays = useMemo(() => {
    return [...stats.dailyBreakdown].sort((a, b) => a.date.localeCompare(b.date));
  }, [stats.dailyBreakdown]);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* 4 Core Metrics */}
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
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  {m.percentage}
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

      {/* Main Analytics Section: Consultas Móviles por Día y Mes */}
      <Card className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <CardContent className="p-0 space-y-6">
          {/* Header & Filter Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Estadísticas de Consultas Móviles
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      App Android
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro de búsquedas, aperturas y consultas por día en la base de datos
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Range Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
                <button
                  onClick={() => { setQuickRange('all'); setSelectedDay('ALL'); setSelectedMonth('ALL'); }}
                  className={`px-3 py-1.5 rounded-lg transition ${quickRange === 'all' && selectedMonth === 'ALL' && selectedDay === 'ALL' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Histórico
                </button>
                <button
                  onClick={() => { setQuickRange('today'); setSelectedDay('ALL'); setSelectedMonth('ALL'); }}
                  className={`px-3 py-1.5 rounded-lg transition ${quickRange === 'today' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => { setQuickRange('7d'); setSelectedDay('ALL'); setSelectedMonth('ALL'); }}
                  className={`px-3 py-1.5 rounded-lg transition ${quickRange === '7d' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  7 días
                </button>
                <button
                  onClick={() => { setQuickRange('30d'); setSelectedDay('ALL'); setSelectedMonth('ALL'); }}
                  className={`px-3 py-1.5 rounded-lg transition ${quickRange === '30d' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  30 días
                </button>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl h-9 px-3 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </Button>
              )}
            </div>
          </div>

          {/* Month & Day Combobox Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Filtrar por Mes</span>
              </label>
              <SearchableSelect
                options={availableMonths}
                value={selectedMonth}
                onChange={(val) => {
                  setSelectedMonth(val);
                  setSelectedDay('ALL');
                  setQuickRange('all');
                }}
                allOptionLabel="Todos los Meses"
                placeholder="Seleccionar mes..."
                searchPlaceholder="Buscar mes..."
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Filtrar por Día Específico</span>
              </label>
              <SearchableSelect
                options={availableDays}
                value={selectedDay}
                onChange={(val) => {
                  setSelectedDay(val);
                  setQuickRange('all');
                }}
                allOptionLabel="Todos los Días"
                placeholder="Seleccionar día..."
                searchPlaceholder="Buscar día..."
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Rango Activo</span>
              </label>
              <div className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white flex items-center text-xs font-semibold text-slate-800">
                {selectedDay !== 'ALL'
                  ? formatDayName(selectedDay)
                  : selectedMonth !== 'ALL'
                  ? availableMonths.find((m) => m.value === selectedMonth)?.label.split(' (')[0] || selectedMonth
                  : quickRange === 'today'
                  ? 'Sólo Consultas de Hoy'
                  : quickRange === '7d'
                  ? 'Últimos 7 días'
                  : quickRange === '30d'
                  ? 'Últimos 30 días'
                  : 'Todo el Historial Completo'}
              </div>
            </div>

            <div className="space-y-1 flex flex-col justify-end">
              <div className="h-10 px-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-700">Total en este filtro:</span>
                <span className="font-black text-blue-900 font-mono text-sm">{stats.totalFiltered.toLocaleString()} consultas</span>
              </div>
            </div>
          </div>

          {/* 4 Summary Stat Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 space-y-1.5">
              <div className="text-[11px] font-bold text-blue-700 flex items-center justify-between">
                <span>Total de Consultas</span>
                <span className="text-[10px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded">
                  {stats.totalGlobal > 0 ? Math.round((stats.totalFiltered / stats.totalGlobal) * 100) : 0}% del total
                </span>
              </div>
              <div className="text-3xl font-black text-blue-950 font-mono tracking-tight">
                {stats.totalFiltered.toLocaleString()}
              </div>
              <p className="text-[11px] text-blue-600/90 font-medium">
                De {stats.totalGlobal.toLocaleString()} registradas en total
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 space-y-1.5">
              <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-between">
                <span>Promedio por Día</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-950 font-mono tracking-tight">
                {stats.avgDailyQueries.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-600/90 font-medium">
                En {stats.dailyBreakdown.length} días con actividad
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 space-y-1.5">
              <div className="text-[11px] font-bold text-amber-700 flex items-center justify-between">
                <span>Día Pico con Más Consultas</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-amber-950 font-mono tracking-tight">
                {stats.peakDay ? stats.peakDay.total.toLocaleString() : '0'}
              </div>
              <p className="text-[11px] text-amber-700/90 font-semibold truncate" title={stats.peakDay ? formatDayName(stats.peakDay.date) : 'Sin datos'}>
                {stats.peakDay ? formatDayName(stats.peakDay.date) : 'Sin actividad'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-200/80 space-y-1.5">
              <div className="text-[11px] font-bold text-purple-700 flex items-center justify-between">
                <span>Interacciones Directas</span>
                <Phone className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-purple-950 font-mono tracking-tight">
                {(stats.whatsappClicks + stats.phoneClicks).toLocaleString()}
              </div>
              <p className="text-[11px] text-purple-700/90 font-medium">
                {stats.whatsappClicks} WhatsApp + {stats.phoneClicks} Llamadas
              </p>
            </div>
          </div>

          {/* Daily Activity Chart & Event Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Chart */}
            <div className="lg:col-span-2 p-5 bg-slate-50/60 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" /> Consultas Diarias (Cronológico)
                  </h4>
                  <p className="text-[11px] text-slate-500">Haz clic en una barra para filtrar ese día en específico</p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {chartDays.length} días graficados
                </span>
              </div>

              {chartDays.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                  No hay consultas registradas para este filtro.
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <div className="h-44 w-full flex items-end justify-between gap-2 px-2">
                    {chartDays.map((d) => {
                      const heightPercent = Math.max(12, Math.round((d.total / stats.maxDailyCount) * 100));
                      const isSelected = selectedDay === d.date;

                      return (
                        <div
                          key={d.date}
                          onClick={() => {
                            setSelectedDay(d.date === selectedDay ? 'ALL' : d.date);
                          }}
                          className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer h-full justify-end"
                          title={`${formatDayName(d.date)}: ${d.total} consultas`}
                        >
                          <div
                            className={`w-full rounded-t-lg transition-all duration-300 relative ${
                              isSelected
                                ? 'bg-indigo-600 ring-2 ring-indigo-400'
                                : 'bg-blue-600 group-hover:bg-blue-500'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-md whitespace-nowrap pointer-events-none z-10">
                              {d.total} consultas
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold transition truncate max-w-full ${
                            isSelected ? 'text-indigo-700 font-black' : 'text-slate-500 group-hover:text-blue-600'
                          }`}>
                            {d.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Event Distribution Breakdown */}
            <div className="p-5 bg-slate-50/60 border border-slate-200 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <Compass className="w-4 h-4 text-emerald-600" /> Distribución por Acción
                </h4>
                <p className="text-[11px] text-slate-500">Eventos registrados en el rango seleccionado</p>
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Fichas de Comercios</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs font-mono">{stats.businessViews}</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Búsquedas de Texto</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs font-mono">{stats.searches}</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <FolderTree className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Vistas de Categorías</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs font-mono">{stats.categoryViews}</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Contactos WhatsApp</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs font-mono">{stats.whatsappClicks}</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Llamadas Telefónicas</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs font-mono">{stats.phoneClicks}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Categorías</div>
                <div className="text-base font-bold text-slate-900 font-mono">{categories.length} registradas</div>
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
                <div className="text-base font-bold text-slate-900 font-mono">{businesses.length} negocios</div>
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
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Eventos</div>
                <div className="text-base font-bold text-slate-900 font-mono">{events.length} publicados</div>
              </div>
            </div>
            <Button onClick={() => setActiveTab('events')} className="px-3 h-8 text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg" variant="ghost">
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
                <div className="text-xs text-slate-500 font-semibold">Historial Errores</div>
                <div className="text-base font-bold text-slate-900 font-mono">{logs.length} registros</div>
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

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
