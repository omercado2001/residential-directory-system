'use client';

import React, { useState } from 'react';
import {
  Terminal, Bug, Trash2, Eye, Filter, Database, Download, FileCode,
  FileJson, ShieldCheck, CheckCircle2, Loader2, Sparkles, Server, HardDrive, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AppLog } from '@/types/database';
import { fetchFullDatabaseBackup, downloadJsonBackup, downloadSqlBackup, BackupData } from '@/lib/backup';
import { toast } from 'sonner';

interface LogsModuleProps {
  logs: AppLog[];
  onAddLog: (log: AppLog) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  searchTerm: string;
}

const PLATFORMS = ['ALL', 'ios', 'android', 'web'];

export default function LogsModule({ logs, onAddLog, onDeleteLog, searchTerm }: LogsModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AppLog | null>(null);
  const [confirmDeleteLog, setConfirmDeleteLog] = useState<AppLog | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');

  // Backup state
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isFetchingBackup, setIsFetchingBackup] = useState(false);
  const [backupData, setBackupData] = useState<BackupData | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_id && log.user_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = platformFilter === 'ALL' || log.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openLogDetail = (log: AppLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!confirmDeleteLog) return;
    await onDeleteLog(confirmDeleteLog.id);
    setConfirmDeleteLog(null);
  };

  const getSeverityChip = () => (
    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold border border-rose-200">Alerta</span>
  );

  // Open Backup Modal & Load Live Database State
  const handleOpenBackupModal = async () => {
    setIsBackupModalOpen(true);
    setIsFetchingBackup(true);
    try {
      const data = await fetchFullDatabaseBackup();
      setBackupData(data);
    } catch (err: any) {
      console.error('Error al preparar backup:', err);
      toast.error('Error al consultar tablas para el respaldo');
    } finally {
      setIsFetchingBackup(false);
    }
  };

  const handleDownloadJson = () => {
    if (!backupData) return;
    try {
      downloadJsonBackup(backupData);
      toast.success('Respaldo JSON generado y descargado correctamente');

      // Log the backup action
      onAddLog({
        id: crypto.randomUUID(),
        error_message: `Respaldo JSON de base de datos generado con éxito (${backupData.metadata.total_records} registros)`,
        platform: 'web',
        extra_info: JSON.stringify({ tables: backupData.metadata.tables_count, date: backupData.metadata.generated_at }),
      } as any);
    } catch (err: any) {
      toast.error(`Error al descargar JSON: ${err.message}`);
    }
  };

  const handleDownloadSql = () => {
    if (!backupData) return;
    try {
      downloadSqlBackup(backupData);
      toast.success('Script SQL de restauración generado y descargado correctamente');

      // Log the backup action
      onAddLog({
        id: crypto.randomUUID(),
        error_message: `Script SQL de base de datos generado con éxito (${backupData.metadata.total_records} registros)`,
        platform: 'web',
        extra_info: JSON.stringify({ tables: backupData.metadata.tables_count, date: backupData.metadata.generated_at }),
      } as any);
    } catch (err: any) {
      toast.error(`Error al descargar SQL: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Top Banner: Backup and Maintenance Suite */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/30 mb-1">
            <Database className="w-3.5 h-3.5" />
            <span>Copia de Seguridad y Restauración</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Respaldo Integral de Base de Datos y Permisos
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Genera una copia exacta de todas las tablas (Comercios, Productos, Categorías, Promociones, Eventos, Usuarios y Roles) en formato <strong>JSON</strong> o <strong>Script SQL</strong> para restauración.
          </p>
        </div>

        <div className="z-10 shrink-0">
          <Button
            onClick={handleOpenBackupModal}
            className="h-11 px-5 rounded-full font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 text-xs cursor-pointer transition transform hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            <span>Generar Respaldo de BD</span>
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Terminal className="w-5 h-5 text-rose-600" /> Historial de Actividad y Alertas
          </h2>
          <p className="text-xs text-slate-500 mt-1">Registros de incidencias ({logs.length})</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchableSelect
            options={[
              { value: 'ALL', label: 'Todas las Plataformas' },
              { value: 'android', label: 'Android (App Móvil)' },
              { value: 'ios', label: 'iOS (App Móvil)' },
              { value: 'web', label: 'Panel Web' },
            ]}
            value={platformFilter}
            onChange={(val) => {
              setPlatformFilter(val);
              setCurrentPage(1);
            }}
            placeholder="Filtrar por plataforma..."
            icon={Filter}
            className="w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">TIPO</th>
                <th className="py-3.5 px-4">DESCRIPCIÓN DEL EVENTO</th>
                <th className="py-3.5 px-4">PLATAFORMA</th>
                <th className="py-3.5 px-4">FECHA Y HORA</th>
                <th className="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                    No hay alertas registradas.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">{getSeverityChip()}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Bug className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-semibold text-slate-900 line-clamp-1 max-w-md">
                          {log.error_message}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 uppercase">
                        {log.platform || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Reciente'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          className="w-8 h-8 p-0 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                          variant="ghost"
                          onClick={() => openLogDetail(log)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          className="w-8 h-8 p-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                          variant="ghost"
                          onClick={() => setConfirmDeleteLog(log)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLogs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[5, 8, 15, 30]}
        />
      </div>

      {/* Backup Generation Modal Dialog */}
      <Dialog open={isBackupModalOpen} onOpenChange={setIsBackupModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-slate-900">
                  Generar Respaldo de Base de Datos
                </DialogTitle>
                <p className="text-xs text-slate-500">
                  Exportación de todas las tablas, esquemas, registros y permisos
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 text-xs text-slate-900">
            {isFetchingBackup ? (
              <div className="h-60 flex flex-col items-center justify-center space-y-3 text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <span className="text-xs font-semibold">Consultando todas las tablas en Supabase...</span>
              </div>
            ) : backupData ? (
              <>
                {/* Summary Banner */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-900 text-xs">
                      Base de Datos Lista para Exportación
                    </h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Se recopilaron <strong>{backupData.metadata.total_records} registros</strong> en <strong>{backupData.metadata.tables_count} tablas</strong> junto con la matriz de roles y permisos.
                    </p>
                  </div>
                </div>

                {/* Tables Grid */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Tablas y Datos Incluidos en el Respaldo:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { name: 'Comercios (businesses)', count: backupData.database.businesses.length, icon: '🏢' },
                      { name: 'Categorías (categories)', count: backupData.database.categories.length, icon: '📁' },
                      { name: 'Productos (menu_items)', count: backupData.database.menu_items.length, icon: '🍽️' },
                      { name: 'Promociones (promotions)', count: backupData.database.promotions.length, icon: '🏷️' },
                      { name: 'Eventos (events)', count: backupData.database.events.length, icon: '🎉' },
                      { name: 'Perfiles (profiles)', count: backupData.database.profiles.length, icon: '👥' },
                      { name: 'Usuarios (system_users)', count: backupData.database.system_users.length, icon: '🔐' },
                      { name: 'Favoritos (user_favorites)', count: backupData.database.user_favorites.length, icon: '⭐' },
                      { name: 'Historial (app_logs)', count: backupData.database.app_logs.length, icon: '📋' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{item.icon}</span>
                          <span className="font-bold text-slate-800 truncate text-[11px]">{item.name}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permissions & Metadata Box */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Permisos y Control de Acceso Incluidos:</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Incluye la configuración completa de los roles: <strong>Administrador Total (Admin)</strong>, <strong>Editor Gestor</strong> y <strong>Solo Consulta (Viewer)</strong> con sus permisos por módulo.
                  </p>
                </div>

                {/* Download Format Options */}
                <div className="space-y-2 pt-1">
                  <label className="font-bold text-slate-700 block">Selecciona el Formato de Descarga:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* JSON Format */}
                    <div
                      onClick={handleDownloadJson}
                      className="p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/40 cursor-pointer transition shadow-xs flex flex-col justify-between space-y-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          <FileJson className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs group-hover:text-blue-700 transition">
                            Formato JSON (.json)
                          </h4>
                          <p className="text-[11px] text-slate-500">Estructura completa de datos y esquemas</p>
                        </div>
                      </div>
                      <Button className="w-full h-8 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar JSON</span>
                      </Button>
                    </div>

                    {/* SQL Format */}
                    <div
                      onClick={handleDownloadSql}
                      className="p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/40 cursor-pointer transition shadow-xs flex flex-col justify-between space-y-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                          <FileCode className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-700 transition">
                            Script SQL (.sql)
                          </h4>
                          <p className="text-[11px] text-slate-500">Sentencias INSERT para PostgreSQL / Supabase</p>
                        </div>
                      </div>
                      <Button className="w-full h-8 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Script SQL</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <DialogFooter className="p-4 px-6 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
            <Button
              variant="secondary"
              onClick={() => setIsBackupModalOpen(false)}
              className="rounded-full text-xs font-semibold px-5"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Detail Dialog */}
      {selectedLog && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalle del Registro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Mensaje de Incidencia:</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 text-xs">
                  {selectedLog.error_message}
                </p>
              </div>

              {selectedLog.stack_trace && (
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Traza de Error:</span>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-[10px] font-mono max-h-40">
                    {selectedLog.stack_trace}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-slate-500 font-semibold block">Plataforma:</span>
                  <span className="font-bold text-slate-800 uppercase">{selectedLog.platform || 'General'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Fecha de Registro:</span>
                  <span className="font-bold text-slate-800">
                    {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="rounded-full text-xs">
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteLog)}
        onClose={() => setConfirmDeleteLog(null)}
        onConfirm={executeDelete}
        title="¿Eliminar Registro del Historial?"
        description="Esta acción eliminará el registro de error seleccionado del historial de actividades."
        confirmText="Sí, Eliminar Registro"
      />
    </div>
  );
}
