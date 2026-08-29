'use client';

import React, { useState } from 'react';
import {
  Plus, Edit, Trash2, Phone, MessageSquare, PhoneCall,
  ShieldCheck, ShieldAlert, AlertTriangle, HeartPulse,
  Flame, Building, Zap, Droplets, Wrench, Search, Copy,
  Check, ExternalLink, Loader2, type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmergencyContact } from '@/types/database';
import { toast } from 'sonner';

interface EmergencyContactsModuleProps {
  contacts: EmergencyContact[];
  onSaveContact: (contact: EmergencyContact) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  searchTerm: string;
  canEdit?: boolean;
}

export const EMERGENCY_ICONS: { name: string; label: string; icon: LucideIcon; color: string }[] = [
  { name: 'shield-checkmark', label: 'Garita / Seguridad', icon: ShieldCheck, color: '#3b82f6' },
  { name: 'call', label: 'Teléfono / Central', icon: PhoneCall, color: '#06b6d4' },
  { name: 'police', label: 'Policía / Patrulla', icon: ShieldAlert, color: '#ef4444' },
  { name: 'ambulance', label: 'Ambulancia / Cruz Roja', icon: HeartPulse, color: '#10b981' },
  { name: 'fire', label: 'Bomberos / Fuego', icon: Flame, color: '#f97316' },
  { name: 'business', label: 'Administración', icon: Building, color: '#8b5cf6' },
  { name: 'electric', label: 'Energía Eléctrica', icon: Zap, color: '#eab308' },
  { name: 'water', label: 'Agua Potable', icon: Droplets, color: '#0284c7' },
  { name: 'maintenance', label: 'Mantenimiento', icon: Wrench, color: '#64748b' },
  { name: 'alert', label: 'Alerta General', icon: AlertTriangle, color: '#ec4899' },
];

export function renderEmergencyIcon(iconName?: string | null, className = 'w-4 h-4') {
  const cleanName = (iconName || '').toLowerCase().trim();
  const found = EMERGENCY_ICONS.find(
    (item) => item.name.toLowerCase() === cleanName || item.label.toLowerCase().includes(cleanName)
  );

  if (found) {
    const IconComp = found.icon;
    return <IconComp className={className} />;
  }

  if (cleanName.includes('shield') || cleanName.includes('garita') || cleanName.includes('seguridad')) {
    return <ShieldCheck className={className} />;
  }
  if (cleanName.includes('police') || cleanName.includes('policia')) {
    return <ShieldAlert className={className} />;
  }
  if (cleanName.includes('med') || cleanName.includes('cruz') || cleanName.includes('salud')) {
    return <HeartPulse className={className} />;
  }
  if (cleanName.includes('fire') || cleanName.includes('bombero')) {
    return <Flame className={className} />;
  }
  if (cleanName.includes('admin') || cleanName.includes('oficina')) {
    return <Building className={className} />;
  }

  return <Phone className={className} />;
}

export default function EmergencyContactsModule({
  contacts,
  onSaveContact,
  onDeleteContact,
  searchTerm,
  canEdit = true,
}: EmergencyContactsModuleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [icon, setIcon] = useState('shield-checkmark');
  const [sortOrder, setSortOrder] = useState<number>(1);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteContact, setConfirmDeleteContact] = useState<EmergencyContact | null>(null);
  const [confirmUpdatePayload, setConfirmUpdatePayload] = useState<EmergencyContact | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const filteredContacts = contacts.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.title.toLowerCase().includes(term) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(term)) ||
      c.phone.toLowerCase().includes(term) ||
      (c.whatsapp && c.whatsapp.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage) || 1;
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateModal = () => {
    setEditingContact(null);
    setTitle('');
    setSubtitle('');
    setPhone('');
    setWhatsapp('');
    setIcon('shield-checkmark');
    setSortOrder(contacts.length + 1);
    setIsOpen(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setTitle(contact.title);
    setSubtitle(contact.subtitle || '');
    setPhone(contact.phone);
    setWhatsapp(contact.whatsapp || '');
    setIcon(contact.icon || 'shield-checkmark');
    setSortOrder(typeof contact.sort_order === 'number' ? contact.sort_order : 1);
    setIsOpen(true);
  };

  const handleCopyPhone = (phoneNum: string, id: string) => {
    navigator.clipboard.writeText(phoneNum);
    setCopiedId(id);
    toast.success(`Teléfono copiado: ${phoneNum}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFormSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedTitle) {
      toast.error('Por favor ingresa el título o nombre del contacto');
      return;
    }

    if (!trimmedPhone) {
      toast.error('Por favor ingresa el número telefónico');
      return;
    }

    const payload: EmergencyContact = {
      id: editingContact?.id || crypto.randomUUID(),
      title: trimmedTitle,
      subtitle: subtitle.trim() || null,
      phone: trimmedPhone,
      whatsapp: whatsapp.trim() ? whatsapp.trim().replace(/\D/g, '') : null,
      icon: icon || 'shield-checkmark',
      color: '#3b82f6',
      sort_order: Number(sortOrder) || 1,
      created_at: editingContact?.created_at || new Date().toISOString(),
    };

    if (editingContact) {
      setConfirmUpdatePayload(payload);
    } else {
      setIsSubmitting(true);
      try {
        await onSaveContact(payload);
        setIsOpen(false);
      } catch (err: any) {
        toast.error(`Error al guardar: ${err?.message || 'Fallo de conexión'}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const executeUpdate = async () => {
    if (!confirmUpdatePayload) return;
    setIsSubmitting(true);
    try {
      await onSaveContact(confirmUpdatePayload);
      setConfirmUpdatePayload(null);
      setIsOpen(false);
    } catch (err: any) {
      toast.error(`Error al actualizar: ${err?.message || 'Fallo de conexión'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDeleteContact) return;
    await onDeleteContact(confirmDeleteContact.id);
    setConfirmDeleteContact(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <PhoneCall className="w-4 h-4" />
            </div>
            <span>Contactos de Emergencia</span>
          </h2>
          <p className="text-xs text-slate-500">
            Directorio telefónico de auxilio, garita y servicios disponible en la app móvil ({contacts.length} contactos)
          </p>
        </div>

        {canEdit ? (
          <Button
            onClick={openCreateModal}
            className="font-bold shadow-md bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-10 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Contacto</span>
          </Button>
        ) : (
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Modo Solo Consulta
          </span>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">ORDEN</th>
                <th className="py-3.5 px-4">CONTACTO / SERVICIO</th>
                <th className="py-3.5 px-4">TELÉFONO PRINCIPAL</th>
                <th className="py-3.5 px-4">WHATSAPP</th>
                {canEdit && <th className="py-3.5 px-4 text-right">ACCIONES</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedContacts.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="text-center py-10 text-slate-400">
                    <PhoneCall className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No se encontraron contactos de emergencia.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchTerm ? 'Prueba con otro término de búsqueda' : 'Registra el primer contacto con el botón superior'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedContacts.map((contact) => {
                  const isCopied = copiedId === contact.id;

                  return (
                    <tr key={contact.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold font-mono text-xs border border-slate-200">
                          {contact.sort_order ?? '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                            {renderEmergencyIcon(contact.icon, 'w-4 h-4')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{contact.title}</p>
                            {contact.subtitle && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{contact.subtitle}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${contact.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold font-mono text-xs border border-blue-200 transition"
                            title="Llamar directamente"
                          >
                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                            <span>{contact.phone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(contact.phone, contact.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Copiar número"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {contact.whatsapp ? (
                          <a
                            href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold font-mono text-xs border border-emerald-200 transition"
                            title="Abrir chat en WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{contact.whatsapp}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">Sin WhatsApp</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              className="w-8 h-8 p-0 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                              variant="ghost"
                              onClick={() => openEditModal(contact)}
                              title="Editar Contacto"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              className="w-8 h-8 p-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                              variant="ghost"
                              onClick={() => setConfirmDeleteContact(contact)}
                              title="Eliminar Contacto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredContacts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[5, 8, 15, 30]}
        />
      </div>

      {/* Dialog Modal Create / Edit */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Editar Contacto de Emergencia' : 'Nuevo Contacto de Emergencia'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">
                Nombre / Título del Contacto <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Ej. Garita de Vigilancia 24/7, Policía Nacional"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">
                Subtítulo / Área o Ubicación
              </label>
              <Input
                placeholder="Ej. Control de Acceso Entrada Principal, Distrito X"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">
                  Teléfono Principal <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Ej. +505 8888 9911 o 118"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">
                  WhatsApp (Opcional)
                </label>
                <Input
                  placeholder="Ej. 50588889911"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">
                Orden de Prioridad en la Lista
              </label>
              <Input
                type="number"
                min="1"
                placeholder="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 1)}
              />
              <p className="text-[11px] text-slate-400">
                Los contactos con menor número se mostrarán primero en la app móvil.
              </p>
            </div>

            {/* Icon Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Ícono Representativo
                </label>
                <span className="text-[11px] font-bold text-blue-600">
                  {EMERGENCY_ICONS.find((i) => i.name === icon)?.label || icon}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                {EMERGENCY_ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = icon === item.name;

                  return (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => setIcon(item.name)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs scale-105 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                      title={item.label}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 transition-colors ${
                          isSelected ? 'bg-blue-600 text-white' : 'text-slate-600 bg-slate-100'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] leading-tight truncate w-full text-center">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              variant="secondary"
              className="rounded-full font-semibold text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={isSubmitting}
              className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 text-xs flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{editingContact ? 'Actualizar Contacto' : 'Guardar Contacto'}</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteContact)}
        onClose={() => setConfirmDeleteContact(null)}
        onConfirm={executeDelete}
        title="¿Eliminar Contacto de Emergencia?"
        description={`¿Estás seguro de que deseas eliminar "${confirmDeleteContact?.title}"? Los residentes ya no podrán ver este contacto en la app móvil.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Confirmation Dialog for Update */}
      <ConfirmDialog
        isOpen={Boolean(confirmUpdatePayload)}
        onClose={() => setConfirmUpdatePayload(null)}
        onConfirm={executeUpdate}
        title="¿Actualizar Contacto?"
        description={`¿Deseas guardar los cambios para "${confirmUpdatePayload?.title}"?`}
        confirmText="Sí, Actualizar"
        cancelText="Cancelar"
        variant="primary"
      />
    </div>
  );
}
