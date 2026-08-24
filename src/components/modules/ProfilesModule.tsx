'use client';

import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Shield, User as UserIcon, Store, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { Profile } from '@/types/database';

interface ProfilesModuleProps {
  profiles: Profile[];
  onSaveProfile: (profile: Profile) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
  searchTerm: string;
}

const ROLES = [
  { id: 'admin', name: 'Administrador' },
  { id: 'business_owner', name: 'Dueño de Negocio' },
  { id: 'resident', name: 'Residente / Usuario' },
];

const getRoleChip = (role?: string) => {
  switch (role) {
    case 'admin': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-extrabold border border-purple-200"><Shield className="w-3 h-3" />Administrador</span>;
    case 'business_owner': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold border border-blue-200"><Store className="w-3 h-3" />Negocio</span>;
    default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold border border-slate-200"><UserIcon className="w-3 h-3" />Residente</span>;
  }
};

export default function ProfilesModule({ profiles, onSaveProfile, onDeleteProfile, searchTerm }: ProfilesModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [id, setId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('resident');
  const [avatarUrl, setAvatarUrl] = useState('');

  const filteredProfiles = profiles.filter((p) =>
    (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage) || 1;
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateModal = () => {
    setEditingProfile(null);
    setId(crypto.randomUUID()); setFullName(''); setEmail(''); setRole('resident'); setAvatarUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Profile) => {
    setEditingProfile(p);
    setId(p.id); setFullName(p.full_name || ''); setEmail(p.email || ''); setRole(p.role || 'resident'); setAvatarUrl(p.avatar_url || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const finalId = id || editingProfile?.id || crypto.randomUUID();
    const payload: Profile = {
      id: finalId, full_name: fullName, email, role, avatar_url: avatarUrl,
      created_at: editingProfile?.created_at || new Date().toISOString(),
    };
    await onSaveProfile(payload);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Action Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" /> Residentes y Usuarios
          </h2>
          <p className="text-xs text-slate-500 mt-1">Usuarios registrados ({profiles.length})</p>
        </div>
        <Button onClick={openCreateModal} className="font-bold shadow-md bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-10 flex items-center gap-2">
          <Plus className="w-4 h-4" /><span>Nuevo Usuario</span>
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">NOMBRE DE USUARIO</th>
                <th className="py-3.5 px-4">CORREO ELECTRÓNICO</th>
                <th className="py-3.5 px-4">ROL ASIGNADO</th>
                <th className="py-3.5 px-4">FECHA DE REGISTRO</th>
                <th className="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedProfiles.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-xs">No hay usuarios registrados.</td></tr>
              ) : (
                paginatedProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.full_name || 'U'} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                            {(p.full_name || p.email || 'U').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {p.full_name || 'Sin Nombre'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-600">
                      <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /><span>{p.email || 'Sin Correo'}</span></div>
                    </td>
                    <td className="py-3.5 px-4">{getRoleChip(p.role)}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium text-xs">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Activo'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button className="w-8 h-8 p-0 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200" variant="ghost" onClick={() => openEditModal(p)}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button className="w-8 h-8 p-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" variant="ghost" onClick={() => onDeleteProfile(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          totalItems={filteredProfiles.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[5, 8, 15, 30]}
        />
      </div>

      {/* Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingProfile ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Nombre Completo</label>
              <Input placeholder="Ej. Juan Pérez" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Correo Electrónico</label>
              <Input placeholder="usuario@residencial.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Tipo de Usuario</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Foto de Perfil (enlace web)</label>
              <Input placeholder="https://..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="rounded-full font-semibold text-xs">Cancelar</Button>
            <Button onClick={handleSubmit} className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 text-xs">Guardar Usuario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
