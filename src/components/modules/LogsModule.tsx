'use client';

import React, { useState } from 'react';
import { Terminal, Bug, Trash2, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AppLog } from '@/types/database';

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

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Terminal className="w-5 h-5 text-rose-600" /> Historial de Actividad y Alertas
          </h2>
          <p className="text-xs text-slate-500 mt-1">Registros de incidencias ({logs.length})</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 h-9 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {PLATFORMS.map((p) => <option key={p} value={p}>{p === 'ALL' ? 'Todas las Plataformas' : p.toUpperCase()}</option>)}
            </select>
          </div>
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
                <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-xs">No hay alertas registradas.</td></tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">{getSeverityChip()}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Bug className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-semibold text-slate-900 line-clamp-1 max-w-xs">{log.error_message}</span>
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
                        <Button className="w-8 h-8 p-0 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200" variant="ghost" onClick={() => openLogDetail(log)}><Eye className="w-3.5 h-3.5" /></Button>
                        <Button className="w-8 h-8 p-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" variant="ghost" onClick={() => setConfirmDeleteLog(log)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

      {/* Log Detail Dialog */}
      {selectedLog && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Detalle del Registro</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Mensaje de Incidencia:</span>
                <div className="w-full font-bold p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
                  {selectedLog.error_message}
                </div>
              </div>
              {selectedLog.stack_trace && (
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Información Detallada:</span>
                  <div className="w-full p-3 whitespace-pre-wrap font-mono text-[11px] bg-slate-100 text-slate-700 rounded-xl max-h-64 overflow-y-auto">
                    {selectedLog.stack_trace}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="rounded-full font-semibold text-xs">Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteLog)}
        onClose={() => setConfirmDeleteLog(null)}
        onConfirm={executeDelete}
        title="¿Eliminar Registro de Incidencia?"
        description={`¿Estás seguro de que deseas eliminar este registro de alerta? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
